import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

/**
 * Email-verification helpers.
 *
 * The address awaiting confirmation is kept in sessionStorage only — never in a
 * URL, never in localStorage, never logged. After a refresh in a new browser
 * session the /check-email page falls back to a generic state.
 */

const PENDING_KEY = "careerpilot.auth.pending-email";
const COOLDOWN_KEY = "careerpilot.auth.resend-at";

export const RESEND_COOLDOWN_SECONDS = 60;

function store(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function setPendingEmail(email: string): void {
  store()?.setItem(PENDING_KEY, email);
}

export function getPendingEmail(): string | null {
  return store()?.getItem(PENDING_KEY) ?? null;
}

export function clearPendingEmail(): void {
  const s = store();
  s?.removeItem(PENDING_KEY);
  s?.removeItem(COOLDOWN_KEY);
}

/** Masks an address for display: jo•••@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export function startCooldown(seconds = RESEND_COOLDOWN_SECONDS): void {
  store()?.setItem(COOLDOWN_KEY, String(Date.now() + seconds * 1000));
}

/** Remaining cooldown in whole seconds (0 when a resend is allowed). */
export function cooldownRemaining(): number {
  const raw = store()?.getItem(COOLDOWN_KEY);
  if (!raw) return 0;
  const remaining = Math.ceil((Number(raw) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function verificationRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export type ResendResult = { ok: true } | { ok: false; message: string };

/**
 * Asks the backend to dispatch another confirmation email. A successful call
 * means the backend accepted the dispatch request — the UI never claims the
 * message was delivered to the inbox.
 */
export async function resendVerificationEmail(email: string): Promise<ResendResult> {
  const remaining = cooldownRemaining();
  if (remaining > 0) {
    return { ok: false, message: `Please wait ${remaining}s before requesting another email.` };
  }
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: verificationRedirectUrl() },
  });
  if (error) {
    return { ok: false, message: friendlyAuthError(error) };
  }
  startCooldown();
  return { ok: true };
}
