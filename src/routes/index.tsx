import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roster — Simple Student Management" },
      { name: "description", content: "Track students, attendance and marks in one quiet place." },
      { property: "og:title", content: "Roster — Simple Student Management" },
      { property: "og:description", content: "Track students, attendance and marks in one quiet place." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-6 flex items-center justify-between">
        <span className="font-display text-2xl">Roster</span>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="mx-auto max-w-5xl px-6 flex-1 flex flex-col justify-center py-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-6">Student management</p>
        <h1 className="text-6xl md:text-8xl leading-[0.95] max-w-3xl">
          Students, attendance & marks — <em className="text-primary">kept simply.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Admins manage the roster, mark daily attendance and record exam results. Students sign in to see their own progress.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Get started</Link></Button>
        </div>
      </section>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-6 grid grid-cols-3 gap-6 text-sm">
          {[["01", "Student records"], ["02", "Daily attendance"], ["03", "Exam marks"]].map(([n, t]) => (
            <div key={n}><span className="font-display text-2xl text-accent-foreground/60 mr-2">{n}</span>{t}</div>
          ))}
        </div>
      </footer>
    </main>
  );
}
