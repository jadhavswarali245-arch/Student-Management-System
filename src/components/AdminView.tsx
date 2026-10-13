import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Profile = { id: string; full_name: string; email: string; roll_no: string | null; class_name: string | null; phone: string | null };

function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const adminIds = new Set((admins ?? []).map((a) => a.user_id));
      const { data } = await supabase.from("profiles").select("*").order("full_name");
      return ((data ?? []) as Profile[]).filter((p) => !adminIds.has(p.id));
    },
  });
}

export function AdminView() {
  const { data: students = [] } = useStudents();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-5xl">Admin</h1>
        <p className="text-muted-foreground">{students.length} students</p>
      </div>
      <Tabs defaultValue="students">
        <TabsList><TabsTrigger value="students">Students</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="marks">Marks</TabsTrigger></TabsList>
        <TabsContent value="students"><StudentsTab students={students} /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab students={students} /></TabsContent>
        <TabsContent value="marks"><MarksTab students={students} /></TabsContent>
      </Tabs>
    </div>
  );
}

function StudentsTab({ students }: { students: Profile[] }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Profile | null>(null);
  const [q, setQ] = useState("");
  const list = students.filter((s) => `${s.full_name} ${s.email} ${s.roll_no ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  async function save() {
    if (!edit) return;
    const { error } = await supabase.from("profiles").update({
      full_name: edit.full_name, roll_no: edit.roll_no, class_name: edit.class_name, phone: edit.phone,
    }).eq("id", edit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["students"] });
  }

  return (
    <Card className="p-5 mt-4">
      <Input placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs mb-4" />
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roll</TableHead><TableHead>Class</TableHead><TableHead>Phone</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.full_name || "—"}</TableCell><TableCell>{s.email}</TableCell>
              <TableCell>{s.roll_no || "—"}</TableCell><TableCell>{s.class_name || "—"}</TableCell><TableCell>{s.phone || "—"}</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setEdit(s)}>Edit</Button></TableCell>
            </TableRow>
          ))}
          {!list.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No students yet. Students appear here after they sign up.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit student</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              {(["full_name", "roll_no", "class_name", "phone"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label className="capitalize">{k.replace("_", " ")}</Label>
                  <Input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                </div>
              ))}
              <Button className="w-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AttendanceTab({ students }: { students: Profile[] }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: records = [] } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => (await supabase.from("attendance").select("*").eq("date", date)).data ?? [],
  });
  const statusOf = (id: string) => records.find((r) => r.student_id === id)?.status;

  async function mark(student_id: string, status: string) {
    const { error } = await supabase.from("attendance").upsert({ student_id, date, status }, { onConflict: "student_id,date" });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["attendance", date] });
  }

  return (
    <Card className="p-5 mt-4">
      <div className="flex items-center gap-3 mb-4"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" /></div>
      <Table>
        <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Roll</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {students.map((s) => {
            const st = statusOf(s.id);
            return (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.full_name || s.email}</TableCell><TableCell>{s.roll_no || "—"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant={st === "present" ? "default" : "outline"} onClick={() => mark(s.id, "present")}>Present</Button>
                  <Button size="sm" variant={st === "absent" ? "destructive" : "outline"} onClick={() => mark(s.id, "absent")}>Absent</Button>
                </TableCell>
              </TableRow>
            );
          })}
          {!students.length && <TableRow><TableCell colSpan={3} className="text-muted-foreground">No students yet.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  );
}

function MarksTab({ students }: { students: Profile[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ student_id: "", subject: "", exam: "", score: "", max_score: "100" });
  const { data: marks = [] } = useQuery({
    queryKey: ["marks"],
    queryFn: async () => (await supabase.from("marks").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name || "—";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.student_id) { toast.error("Pick a student"); return; }
    const { error } = await supabase.from("marks").insert({
      student_id: f.student_id, subject: f.subject, exam: f.exam || "Exam", score: Number(f.score), max_score: Number(f.max_score),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Mark added");
    setF({ ...f, subject: "", score: "" });
    qc.invalidateQueries({ queryKey: ["marks"] });
  }
  async function remove(id: string) {
    await supabase.from("marks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["marks"] });
  }

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr] mt-4">
      <Card className="p-5">
        <h2 className="text-2xl mb-4">Add mark</h2>
        <form onSubmit={add} className="space-y-3">
          <Select value={f.student_id} onValueChange={(v) => setF({ ...f, student_id: v })}>
            <SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || s.email}</SelectItem>)}</SelectContent>
          </Select>
          <Input required placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
          <Input placeholder="Exam (e.g. Midterm)" value={f.exam} onChange={(e) => setF({ ...f, exam: e.target.value })} />
          <div className="flex gap-2">
            <Input required type="number" placeholder="Score" value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} />
            <Input required type="number" placeholder="Out of" value={f.max_score} onChange={(e) => setF({ ...f, max_score: e.target.value })} />
          </div>
          <Button className="w-full">Add</Button>
        </form>
      </Card>
      <Card className="p-5">
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Score</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {marks.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{nameOf(m.student_id)}</TableCell><TableCell>{m.subject}</TableCell><TableCell>{m.exam}</TableCell><TableCell>{m.score}/{m.max_score}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
            {!marks.length && <TableRow><TableCell colSpan={5} className="text-muted-foreground">No marks yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
