import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function StudentView({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["student", userId],
    queryFn: async () => {
      const [p, a, m] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("attendance").select("*").eq("student_id", userId).order("date", { ascending: false }),
        supabase.from("marks").select("*").eq("student_id", userId).order("created_at", { ascending: false }),
      ]);
      return { profile: p.data, attendance: a.data ?? [], marks: m.data ?? [] };
    },
  });
  if (!data) return <p className="text-muted-foreground">Loading…</p>;
  const { profile, attendance, marks } = data;
  const present = attendance.filter((a) => a.status === "present").length;
  const pct = attendance.length ? Math.round((present / attendance.length) * 100) : null;

  return (
    <div className="space-y-8">
      <h1 className="text-5xl">Hello, {profile?.full_name || "student"}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-muted-foreground">Roll no · Class</p><p className="text-2xl mt-1">{profile?.roll_no || "—"} · {profile?.class_name || "—"}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Attendance</p><p className="text-2xl mt-1">{pct === null ? "—" : `${pct}%`} <span className="text-sm text-muted-foreground">({present}/{attendance.length} days)</span></p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Results recorded</p><p className="text-2xl mt-1">{marks.length}</p></Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-2xl mb-3">Marks</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
            <TableBody>
              {marks.map((m) => (
                <TableRow key={m.id}><TableCell>{m.subject}</TableCell><TableCell>{m.exam}</TableCell><TableCell className="text-right">{m.score}/{m.max_score}</TableCell></TableRow>
              ))}
              {!marks.length && <TableRow><TableCell colSpan={3} className="text-muted-foreground">No marks yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
        <Card className="p-5">
          <h2 className="text-2xl mb-3">Attendance</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.id}><TableCell>{a.date}</TableCell><TableCell className={`text-right capitalize ${a.status === "present" ? "text-success" : "text-destructive"}`}>{a.status}</TableCell></TableRow>
              ))}
              {!attendance.length && <TableRow><TableCell colSpan={2} className="text-muted-foreground">No attendance yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
