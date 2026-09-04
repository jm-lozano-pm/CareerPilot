/**
 * One-shot handoff of the Google-link outcome from the public /auth/callback
 * route to Settings. Contains no tokens — only a status and an optional
 * friendly message.
 */

const KEY = "careerpilot.auth.link-result";

export type LinkResult = { status: "linked" } | { status: "error"; message: string };

function safeSession(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function setLinkResult(result: LinkResult) {
  try {
    safeSession()?.setItem(KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function takeLinkResult(): LinkResult | null {
  const storage = safeSession();
  const raw = storage?.getItem(KEY);
  if (!raw) return null;
  storage?.removeItem(KEY);
  try {
    const parsed = JSON.parse(raw) as LinkResult;
    if (parsed?.status === "linked") return { status: "linked" };
    if (parsed?.status === "error") return { status: "error", message: String(parsed.message) };
    return null;
  } catch {
    return null;
  }
}
