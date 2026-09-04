import { useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { setSessionPersistence } from "@/lib/auth-persistence";

export function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4 shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.68-3.9 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/**
 * Managed Google sign-in. Credentials live in Lovable Cloud; nothing about the
 * OAuth client is present in the browser bundle. `redirect_uri` is always a
 * public same-origin URL, never a protected route.
 */
export function GoogleButton({
  label = "Continue with Google",
  onError,
  persistence = "durable",
}: {
  label?: string;
  onError?: (message: string) => void;
  persistence?: "durable" | "session";
}) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    onError?.("");
    setSessionPersistence(persistence);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        onError?.(friendlyOAuthError(result.error));
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      window.location.assign("/app/dashboard");
    } catch (error) {
      onError?.(friendlyOAuthError(error));
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
    >
      <GoogleMark />
      {busy ? "Connecting to Google…" : label}
    </Button>
  );
}

/** Never surfaces raw OAuth/provider detail. */
export function friendlyOAuthError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message).toLowerCase()
      : "";
  if (raw.includes("closed") || raw.includes("cancel") || raw.includes("abort")) {
    return "Google sign-in was cancelled. You can try again or use your email and password.";
  }
  if (raw.includes("popup") || raw.includes("blocked")) {
    return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
  }
  if (raw.includes("unsupported provider") || raw.includes("disabled") || raw.includes("not enabled")) {
    return "Google sign-in isn't available right now. Please use your email and password.";
  }
  if (raw.includes("identity") || raw.includes("already") || raw.includes("exists")) {
    return "An account already uses this email address. Log in with your email and password, then link Google from Settings.";
  }
  if (raw.includes("network") || raw.includes("failed to fetch")) {
    return "We couldn't reach Google. Check your connection and try again.";
  }
  return "We couldn't complete Google sign-in. Please try again.";
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3" role="separator" aria-label="Or continue with email">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Or</span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}
