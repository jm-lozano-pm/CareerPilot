import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError, FormAlert } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/lib/auth-errors";
import { PasswordChecklist, passwordRuleFailures } from "@/components/auth/password-checklist";
import { enforceSessionPersistence, setSessionPersistence } from "@/lib/auth-persistence";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { setPendingEmail, startCooldown, verificationRedirectUrl } from "@/lib/auth-verification";



const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .email("Enter a valid email address."),
    password: z
      .string()
      .min(1, "Enter a password.")
      .refine((value) => passwordRuleFailures(value).length === 0, {
        message: "Your password does not meet all the requirements below.",
      }),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupValues = z.infer<typeof signupSchema>;


export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: async () => {
    await enforceSessionPersistence();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Create account — CareerPilot" },
      {
        name: "description",
        content:
          "Create a CareerPilot account to organise your career profile, CVs and saved opportunities.",
      },
      { property: "og:title", content: "Create account — CareerPilot" },
      { property: "og:description", content: "Create your private CareerPilot workspace." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [weakFromServer, setWeakFromServer] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const unmetRules = passwordRuleFailures(password);
  const allRulesMet = password.length > 0 && unmetRules.length === 0;
  const confirmTouched =
    !!form.formState.touchedFields.confirmPassword || confirmPassword.length > 0;
  const mismatch = confirmTouched && confirmPassword.length > 0 && confirmPassword !== password;
  const confirmMatches = confirmTouched && allRulesMet && confirmPassword === password;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmError = mismatch
    ? "Passwords do not match"
    : form.formState.errors.confirmPassword?.message;

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    setWeakFromServer(false);
    // A new account is a durable session; clear any leftover ephemeral marker.
    setSessionPersistence("durable");

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: verificationRedirectUrl() },
    });
    if (error) {
      const friendly = friendlyAuthError(error);
      const raw = String((error as { message?: unknown }).message ?? "").toLowerCase();
      if (
        raw.includes("password") ||
        raw.includes("weak") ||
        raw.includes("pwned") ||
        raw.includes("breach")
      ) {
        setWeakFromServer(true);
        form.setError("password", { type: "server", message: friendly });
        form.setFocus("password");
        return;
      }
      if (raw.includes("registered") || raw.includes("already exists")) {
        form.setError("email", { type: "server", message: friendly });
        form.setFocus("email");
        return;
      }
      setFormError(friendly);
      return;
    }
    if (!data.session) {
      // Verification required: leave the form entirely for the dedicated page.
      setPendingEmail(values.email);
      startCooldown();
      form.reset({ email: "", password: "", confirmPassword: "" });
      await navigate({ to: "/check-email", replace: true });
      return;
    }
    window.location.assign("/app/dashboard");
  }

  function onInvalid() {
    if (form.formState.errors.email) form.setFocus("email");
    else if (form.formState.errors.password) form.setFocus("password");
    else if (form.formState.errors.confirmPassword) form.setFocus("confirmPassword");
  }

  const canSubmit = allRulesMet && confirmPassword === password && confirmPassword.length > 0;

  return (
    <AuthShell
      title="Create your account"
      description="Your CareerPilot workspace stays private to you."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <FormAlert message={formError} />
      <GoogleButton label="Continue with Google" onError={(m) => setFormError(m || null)} />
      <AuthDivider />
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-4"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            {...form.register("email")}
          />
          <div id="email-error">
            <FieldError message={emailError} />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={!!passwordError}
            aria-describedby={
              passwordError ? "password-requirements password-error" : "password-requirements"
            }
            {...form.register("password")}
          />
          <div id="password-error">
            <FieldError message={passwordError} />
          </div>
          <PasswordChecklist
            id="password-requirements"
            value={password}
            emphasise={weakFromServer || (!!passwordError && unmetRules.length > 0)}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={!!confirmError}
            aria-describedby={confirmError ? "confirm-error" : "confirm-status"}
            {...form.register("confirmPassword")}
          />
          <div id="confirm-error">
            <FieldError message={confirmError} />
          </div>
          <p id="confirm-status" role="status" className="sr-only">
            {confirmMatches ? "Passwords match" : ""}
          </p>
          {confirmMatches && !confirmError && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-success">
              <Check aria-hidden="true" className="size-3.5" />
              Passwords match
            </p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting || !canSubmit}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>

  );
}
