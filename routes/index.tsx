import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FileText,
  Lightbulb,
  Target,
  UserRound,
  Briefcase,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerPilot — Your user-controlled career workspace" },
      {
        name: "description",
        content:
          "CareerPilot is a private career-management workspace for your profile, goals, CVs, saved jobs, applications and outcomes. You stay in control of every decision.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "CareerPilot — Your user-controlled career workspace" },
      {
        property: "og:description",
        content:
          "Keep your professional profile, CVs, saved jobs, applications and outcomes in one private workspace you control.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const PILLARS = [
  {
    icon: UserRound,
    title: "Career Profile",
    body: "One maintained record of your experience, skills, education and languages — the context everything else builds on.",
  },
  {
    icon: Target,
    title: "Goals",
    body: "State the roles, locations and work modes you are aiming for, so your own decisions have a reference point.",
  },
  {
    icon: FileText,
    title: "CVs",
    body: "Independent CVs in three professional templates, with control over what each document shows.",
  },
  {
    icon: Briefcase,
    title: "Saved jobs",
    body: "Opportunities you chose to save, kept with the job description and your personal notes.",
  },
  {
    icon: ClipboardList,
    title: "Applications & outcomes",
    body: "Record what you applied to, how each application progressed, and the outcome and employer feedback you actually received.",
  },
  {
    icon: Lightbulb,
    title: "Evidence-based insights",
    body: "Analysis you ask for, drawn from your recorded evidence, with recommended actions you review, rate or dismiss.",
  },
];

function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  // Checked after hydration so the page stays a real, cacheable public document.
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Logo size={32} />
          <nav aria-label="Account" className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild size="sm">
                <Link to="/app/dashboard">Go to workspace</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section>
          <p className="text-sm font-medium text-primary">A workspace, not a job board</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.02em] text-foreground">
            Manage your own career, with your own evidence
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            CareerPilot is a private, user-controlled career-management workspace. It connects your
            professional profile, goals, CVs, saved jobs, applications, outcomes and recorded
            evidence, so the picture of your job search is complete and it is yours. CareerPilot
            identifies possibilities; you decide what to do.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <Button asChild>
                <Link to="/app/dashboard">Go to workspace</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link to="/signup">Create your workspace</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="what-it-connects">
          <h2 id="what-it-connects" className="text-lg font-semibold text-foreground">
            What CareerPilot keeps together
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-xl border border-border bg-surface p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-medium text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-xl border border-border bg-surface-muted p-6" aria-labelledby="what-it-is-not">
          <h2 id="what-it-is-not" className="text-lg font-semibold text-foreground">
            What CareerPilot is not
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            It is not a job marketplace, job board or search feed. It does not represent recruiters
            or employers, and it never applies to anything on your behalf. Analysis only runs when
            you explicitly ask for it, and every recommendation stays something you review and can
            dismiss.
          </p>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="text-xs text-subtle-foreground">
            CareerPilot — your career record stays private to your account.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/login" className="text-secondary-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
            <Link to="/signup" className="text-secondary-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
