import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError, FormAlert, FormNotice } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/lib/auth-errors";

const confirmSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Both passwords must match.",
  });

type ConfirmValues = z.infer<typeof confirmSchema>;

export const Route = createFileRoute("/recover_/confirm")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — CareerPilot" },
      {
        name: "description",
        content: "Finish password recovery and set a new password for your CareerPilot account.",
      },
      { property: "og:title", content: "Set a new password — CareerPilot" },
      { property: "og:description", content: "Complete CareerPilot password recovery." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecoverConfirmPage,
});

function RecoverConfirmPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // Supabase parses the recovery link and establishes a temporary session.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setHasRecoverySession(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setHasRecoverySession(Boolean(data.session));
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const form = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ConfirmValues) {
    setFormError(null);
    setNotice(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }
    setNotice("Your password has been updated.");
    await navigate({ to: "/app/dashboard", replace: true });
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a new password for your CareerPilot account."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      {hasRecoverySession === false && (
        <FormAlert message="This recovery link is no longer valid. Request a new recovery email." />
      )}
      <FormNotice message={notice} />
      <FormAlert message={formError} />
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          <p className="mt-1.5 text-sm text-muted-foreground">At least 8 characters.</p>
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || hasRecoverySession === false}
        >
          {form.formState.isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthShell>
  );
}
