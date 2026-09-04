import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError, FormAlert, FormNotice } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/lib/auth-errors";
import { enforceSessionPersistence, setSessionPersistence } from "@/lib/auth-persistence";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { setPendingEmail } from "@/lib/auth-verification";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    await enforceSessionPersistence();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/app/dashboard" });
    }
  },

  validateSearch: (search: Record<string, unknown>): { expired?: true } =>
    search["expired"] === "1" || search["expired"] === true ? { expired: true } : {},
  head: () => ({
    meta: [
      { title: "Log in — CareerPilot" },
      {
        name: "description",
        content: "Log in to your private CareerPilot workspace to manage your career profile and CVs.",
      },
      { property: "og:title", content: "Log in — CareerPilot" },
      { property: "og:description", content: "Log in to your CareerPilot workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { expired } = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [remember, setRemember] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setNeedsVerification(false);
    // Set before sign-in so the liveness marker exists as soon as a session does.
    setSessionPersistence(remember ? "durable" : "session");
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const raw = String((error as { message?: unknown }).message ?? "").toLowerCase();
      if (raw.includes("not confirmed") || raw.includes("email_not_confirmed")) {
        // Verification is required regardless of the Remember me choice.
        setPendingEmail(values.email);
        setNeedsVerification(true);
      }
      setFormError(friendlyAuthError(error));
      return;
    }
    await navigate({ to: "/app/dashboard", replace: true });
  }


  return (
    <AuthShell
      title="Log in"
      description="Access your CareerPilot workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {expired && <FormNotice message="Your session has expired. Please log in again." />}
      <FormAlert message={formError} />
      {needsVerification && (
        <p className="mb-4 text-sm text-muted-foreground">
          <Link to="/check-email" className="font-medium text-primary hover:underline">
            Resend the verification email
          </Link>{" "}
          to finish activating your account.
        </p>
      )}
      <GoogleButton
        label="Continue with Google"
        persistence={remember ? "durable" : "session"}
        onError={(m) => setFormError(m || null)}
      />
      <AuthDivider />
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(value) => setRemember(value === true)}
            aria-describedby="remember-help"
            className="mt-0.5"
          />
          <div className="min-w-0">
            <Label htmlFor="remember" className="font-medium">
              Remember me
            </Label>
            <p id="remember-help" className="mt-0.5 text-xs text-muted-foreground">
              Stay signed in on this device. Leave unchecked to end the session when you close
              your browser.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging in…" : "Log in"}
        </Button>
        <Link
          to="/recover"
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthShell>
  );
}
