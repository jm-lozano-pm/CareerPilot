import { supabase } from "@/integrations/supabase/client";

/**
 * "Remember me" persistence.
 *
 * The Supabase client (auto-generated) always persists its session through the
 * managed storage adapter. We never touch, copy or re-implement that session
 * material. Instead we record which persistence mode the user chose:
 *
 * - durable  — remembered: nothing extra happens, Supabase keeps the session.
 * - session  — not remembered: a sessionStorage liveness marker exists only for
 *   the current browser session. On the next boot without that marker, the
 *   Supabase session is discarded locally (supabase.auth.signOut({ scope: "local" })),
 *   which clears the managed storage — including the preview broker copy.
 *
 * No credentials, emails or tokens are stored by this module.
 */

const MODE_KEY = "careerpilot.auth.persistence";
const ALIVE_KEY = "careerpilot.auth.browser-session";

type PersistenceMode = "durable" | "session";

function safeLocal(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function safeSession(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Records the chosen persistence mode right before/after a successful sign-in. */
export function setSessionPersistence(mode: PersistenceMode): void {
  const local = safeLocal();
  const session = safeSession();
  if (mode === "durable") {
    local?.removeItem(MODE_KEY);
    session?.removeItem(ALIVE_KEY);
    return;
  }
  local?.setItem(MODE_KEY, "session");
  session?.setItem(ALIVE_KEY, "1");
}

/** Clears both markers — used on logout and account deletion. */
export function clearSessionPersistence(): void {
  safeLocal()?.removeItem(MODE_KEY);
  safeSession()?.removeItem(ALIVE_KEY);
}

let enforcement: Promise<void> | undefined;

/**
 * Drops a non-remembered session when the browser session that created it has
 * ended. Must be awaited before any auth check that trusts the session.
 */
export function enforceSessionPersistence(): Promise<void> {
  if (!enforcement) enforcement = enforce();
  return enforcement;
}

async function enforce(): Promise<void> {
  const local = safeLocal();
  const session = safeSession();
  if (!local || !session) return;
  if (local.getItem(MODE_KEY) !== "session") return;
  if (session.getItem(ALIVE_KEY) === "1") return;

  clearSessionPersistence();
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Storage is already being discarded; a failure here must not block routing.
  }
}
