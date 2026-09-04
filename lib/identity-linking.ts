import { supabase } from "@/integrations/supabase/client";

/**
 * Google identity linking for an already-authenticated user.
 *
 * We use Supabase's authenticated `linkIdentity` API — never `signInWithOAuth`,
 * which could create or switch to a different auth user. No OAuth tokens or
 * credentials are stored by the app; Supabase owns that material. The only
 * thing we persist is the current user id, so the callback can prove the Google
 * identity landed on the SAME account.
 */

const PENDING_KEY = "careerpilot.auth.link-google-user";

function safeSession(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readPendingLinkUserId(): string | null {
  return safeSession()?.getItem(PENDING_KEY) ?? null;
}

export function clearPendingLink() {
  safeSession()?.removeItem(PENDING_KEY);
}

/** Starts the Google link flow. Returns an error message when it cannot start. */
export async function startGoogleLink(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return "Your session has expired. Please sign in again, then connect Google.";
  }
  safeSession()?.setItem(PENDING_KEY, data.user.id);

  const { error: linkError } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?link=google` },
  });
  if (linkError) {
    clearPendingLink();
    return friendlyLinkError(linkError);
  }
  return null;
}

export function friendlyLinkError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message).toLowerCase()
      : "";
  if (raw.includes("manual linking") || raw.includes("not enabled") || raw.includes("disabled")) {
    return "Connecting Google isn't available on this workspace yet. Your email and password sign-in is unaffected.";
  }
  if (raw.includes("already") || raw.includes("exists") || raw.includes("identity_already")) {
    return "That Google account is already connected to a different CareerPilot account. Nothing was merged or moved. Use a different Google account, or sign in with that account instead.";
  }
  if (raw.includes("cancel") || raw.includes("closed") || raw.includes("access_denied")) {
    return "Google connection was cancelled. Nothing changed.";
  }
  if (raw.includes("expired") || raw.includes("state")) {
    return "That Google connection attempt expired. Please try again.";
  }
  if (raw.includes("session") || raw.includes("jwt")) {
    return "Your session has expired. Please sign in again, then connect Google.";
  }
  if (raw.includes("network") || raw.includes("failed to fetch")) {
    return "We couldn't reach Google. Check your connection and try again.";
  }
  return "We couldn't connect Google. Please try again.";
}
