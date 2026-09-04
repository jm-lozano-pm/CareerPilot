import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError, FormAlert, FormNotice } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/lib/auth-errors";

const recoverSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
});

type RecoverValues = z.infer<typeof recoverSchema>;

export const Route = createFileRoute("/recover")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Password recovery — CareerPilot" },
      {
        name: "description",
        content: "Request a password recovery email for your CareerPilot account.",
      },
      { property: "og:title", content: "Password recovery — CareerPilot" },
      { property: "og:description", content: "Recover access to your CareerPilot workspace." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<RecoverValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecoverValues) {
    setFormError(null);
    setNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/recover/confirm`,
    });
    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }
    setNotice("If that email has an account, a recovery link is on its way.");
  }

  return (
    <AuthShell
      title="Recover your password"
      description="We'll email you a link to set a new password."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <FormNotice message={notice} />
      <FormAlert message={formError} />
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send recovery email"}
        </Button>
      </form>
    </AuthShell>
  );
}
