import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { PasswordChecklist, passwordRuleFailures } from "@/components/auth/password-checklist";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { startGoogleLink } from "@/lib/identity-linking";
import { takeLinkResult } from "@/lib/link-result";
import { GoogleMark } from "@/components/auth/google-button";

/**
 * Sign-in methods (D). Reads the authenticated user's identities to tell the
 * truth about how this workspace can be accessed. Setting a password uses
 * Supabase's authenticated `updateUser`, so the Google identity is never
 * replaced or unlinked and no second account or confirmation flow is created.
 */

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  email: "Email and password",
  apple: "Apple",
  azure: "Microsoft",
};

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function SignInMethods() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<string[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [googleLabel, setGoogleLabel] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setLoading(false);
      return;
    }
    const identities = data.user.identities ?? [];
    const list = identities.map((identity) => identity.provider);
    setProviders(list.length > 0 ? list : [data.user.app_metadata?.provider ?? "email"]);
    setEmail(data.user.email ?? null);
    const google = identities.find((identity) => identity.provider === "google");
    const info = (google?.identity_data ?? {}) as { email?: string; name?: string };
    setGoogleLabel(info.email ?? info.name ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  // Outcome of a Google link round trip, handed over by /auth/callback.
  useEffect(() => {
    const result = takeLinkResult();
    if (!result) return;
    if (result.status === "linked") {
      toast.success("Google connected. You can now sign in with Google or with your password.");
      void load();
    } else {
      setLinkError(result.message);
    }
  }, []);

  async function handleConnectGoogle() {
    setLinkError(null);
    setLinking(true);
    const message = await startGoogleLink();
    if (message) {
      setLinkError(message);
      setLinking(false);
    }
  }

  const hasPassword = providers.includes("email");
  const hasGoogle = providers.includes("google");
  const social = providers.filter((provider) => provider !== "email");
  const failures = passwordRuleFailures(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setFormError(null);
    if (failures.length > 0 || password !== confirm || confirm.length === 0) return;
    if (!email) {
      setFormError(
        "Your sign-in provider did not share an email address, so email and password sign-in is not available for this account.",
      );
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(friendlyAuthError(error));
        return;
      }
      setPassword("");
      setConfirm("");
      setTouched(false);
      setOpen(false);
      await load();
      toast.success(
        hasPassword
          ? "Password updated."
          : `Password created. You can now sign in with Google or with ${email} and your new password.`,
      );
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SurfaceCard>
      <SurfaceCardTitle>Sign-in methods</SurfaceCardTitle>
      <p className="mt-1.5 text-sm text-muted-foreground">
        These are the ways you can sign in to this CareerPilot workspace. Every method opens the same
        account and the same data.
      </p>

      {loading ? (
        <Skeleton className="mt-4 h-16 w-full max-w-sm" />
      ) : (
        <ul className="mt-4 flex max-w-md flex-col gap-2">
          <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <GoogleMark />
              <span className="min-w-0">
                <span className="block text-foreground">Google</span>
                {hasGoogle && googleLabel && (
                  <span className="block truncate text-xs text-muted-foreground">
                    Google identity: {googleLabel}
                  </span>
                )}
              </span>
            </span>
            <span
              className={
                hasGoogle ? "text-xs font-medium text-success" : "text-xs text-muted-foreground"
              }
            >
              {hasGoogle ? "Google connected" : "Not connected"}
            </span>
          </li>
          {social
            .filter((provider) => provider !== "google")
            .map((provider) => (
              <li
                key={provider}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm"
              >
                <span className="text-foreground">{providerLabel(provider)}</span>
                <span className="text-xs font-medium text-success">Enabled</span>
              </li>
            ))}
          <li className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm">
            <span className="text-foreground">Email and password</span>
            <span
              className={
                hasPassword ? "text-xs font-medium text-success" : "text-xs text-muted-foreground"
              }
            >
              {hasPassword ? "Password enabled" : "Not set up yet"}
            </span>
          </li>
        </ul>
      )}

      {!loading && linkError && (
        <div className="mt-4 max-w-md">
          <FormAlert message={linkError} />
        </div>
      )}

      {!loading && !open && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setOpen(true)}>
            <KeyRound className="size-4" aria-hidden="true" />
            {hasPassword ? "Change password" : "Create password"}
          </Button>
          {!hasGoogle && (
            <Button
              variant="outline"
              aria-label="Connect Google to this CareerPilot account"
              disabled={linking}
              onClick={() => void handleConnectGoogle()}
            >
              {linking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              {linking ? "Connecting Google…" : "Connect Google"}
            </Button>
          )}
        </div>
      )}

      {!loading && !open && !hasGoogle && (
        <p className="mt-2 text-xs text-muted-foreground">
          Use Google or your password to access the same CareerPilot workspace.
        </p>
      )}

      {open && (
        <form noValidate onSubmit={handleSubmit} className="mt-4 max-w-sm">
          {formError && <FormAlert message={formError} />}
          <div className="mt-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              aria-describedby="new-password-rules"
              aria-invalid={touched && failures.length > 0}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordChecklist
              id="new-password-rules"
              value={password}
              emphasise={touched && failures.length > 0}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="mt-1.5"
              aria-invalid={mismatch}
              aria-describedby="confirm-password-feedback"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <p id="confirm-password-feedback" className="mt-1.5 text-xs" aria-live="polite">
              {mismatch ? (
                <span className="text-destructive">Passwords do not match</span>
              ) : confirm.length > 0 ? (
                <span className="text-success">Passwords match</span>
              ) : (
                <span className="text-muted-foreground">Re-enter the password to confirm it.</span>
              )}
            </p>
            {touched && confirm.length === 0 && <FieldError message="Confirm your new password." />}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {hasPassword ? "Update password" : "Create password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirm("");
                setTouched(false);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </SurfaceCard>
  );
}
