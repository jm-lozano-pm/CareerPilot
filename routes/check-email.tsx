import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthShell, FormAlert, FormNotice } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  clearPendingEmail,
  cooldownRemaining,
  getPendingEmail,
  maskEmail,
  resendVerificationEmail,
} from "@/lib/auth-verification";

export const Route = createFileRoute("/check-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Check your email — CareerPilot" },
      {
        name: "description",
        content:
          "Confirm your email address to finish creating your private CareerPilot workspace.",
      },
      { property: "og:title", content: "Check your email — CareerPilot" },
      { property: "og:description", content: "Confirm your CareerPilot email address." },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(getPendingEmail());
    setCooldown(cooldownRemaining());
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown(cooldownRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function onResend() {
    if (!email) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await resendVerificationEmail(email);
    if (result.ok) {
      setNotice(
        "We've asked our email service to send another confirmation link. It can take a few minutes to arrive.",
      );
      setCooldown(cooldownRemaining());
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <AuthShell
      title="Check your email"
      description={
        email
          ? `We sent a confirmation link to ${maskEmail(email)}. Open it to activate your account.`
          : "Open the confirmation link we sent to your email address to activate your account."
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <FormNotice message={notice} />
      <FormAlert message={error} />

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
        <MailCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-sm text-muted-foreground">
          <p>
            Confirmation emails can take a few minutes. If it isn't there, check your spam or
            promotions folder, and make sure the address is correct.
          </p>
          <p className="mt-2">You won't be able to log in until the address is confirmed.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {email && (
          <Button type="button" onClick={onResend} disabled={busy || cooldown > 0}>
            {busy
              ? "Sending…"
              : cooldown > 0
                ? `Resend verification email (${cooldown}s)`
                : "Resend verification email"}
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/signup" onClick={() => clearPendingEmail()}>
            Use a different email address
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
