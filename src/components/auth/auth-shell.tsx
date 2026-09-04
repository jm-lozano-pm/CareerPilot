import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <div className="mb-6 flex justify-center">
          <Link
            to="/"
            aria-label="CareerPilot home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo size={30} />
          </Link>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
          <div className="mt-6">{children}</div>
        </section>
        {footer && (
          <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function FormNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-primary"
    >
      {message}
    </div>
  );
}
