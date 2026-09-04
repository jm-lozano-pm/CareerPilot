/**
 * Server-only idempotency ledger for user-initiated AI actions (P4.1).
 *
 * `public.ai_requests` already carries a UNIQUE (user_id, idempotency_key)
 * constraint, so the database — not a disabled button — decides which of several
 * equivalent concurrent requests is allowed to do the work. The winner claims
 * the key, performs the action and stores the created row's identity in
 * `result`; later replays of the same logical request read that result back
 * instead of creating a second copy.
 *
 * Failures release the key (status 'failed'), so a legitimate later retry can
 * claim it again, and nothing is persisted for a failed generation.
 */

type Ctx = { supabase: any; userId: string };

/** A claim held while the AI action runs. */
export type AiClaim<T> =
  | { kind: "replay"; result: T }
  | {
      kind: "claimed";
      /** Store the successful outcome so replays can reuse it. */
      complete: (result: T) => Promise<void>;
      /** Release the key so a later retry is possible. */
      release: (errorCode?: string) => Promise<void>;
    };

/** A 'started' row older than this is treated as abandoned and reclaimable. */
const STALE_CLAIM_MS = 5 * 60_000;

export const AI_IN_PROGRESS =
  "This request is already running. Wait for it to finish before starting it again.";

export async function claimAiRequest<T>(
  ctx: Ctx,
  requestType: string,
  idempotencyKey: string,
  options: { validateResult?: (result: T) => Promise<boolean> } = {},
): Promise<AiClaim<T>> {
  const key = idempotencyKey.slice(0, 200);

  const claimed = await insertClaim(ctx, requestType, key);
  if (claimed) return claim(ctx, claimed, key);

  const { data: existing } = await ctx.supabase
    .from("ai_requests")
    .select("id, status, result, updated_at")
    .eq("user_id", ctx.userId)
    .eq("idempotency_key", key)
    .maybeSingle();

  if (!existing) throw new Error(AI_IN_PROGRESS);

  if (existing.status === "completed" && existing.result) {
    const result = existing.result as T;
    const valid = options.validateResult ? await options.validateResult(result) : true;
    if (valid) return { kind: "replay", result };
  } else if (existing.status === "started") {
    const age = Date.now() - Date.parse((existing.updated_at as string) ?? "");
    if (Number.isFinite(age) && age < STALE_CLAIM_MS) throw new Error(AI_IN_PROGRESS);
  }

  // Re-claim: only one caller can win, because the update is conditional on the
  // status we just observed.
  const { data: reclaimed } = await ctx.supabase
    .from("ai_requests")
    .update({ status: "started", result: null, error_code: null })
    .eq("id", existing.id)
    .eq("user_id", ctx.userId)
    .eq("status", existing.status)
    .select("id")
    .maybeSingle();

  if (!reclaimed) throw new Error(AI_IN_PROGRESS);
  return claim(ctx, reclaimed.id as string, key);
}

async function insertClaim(ctx: Ctx, requestType: string, key: string): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("ai_requests")
    .insert({
      user_id: ctx.userId,
      request_type: requestType,
      idempotency_key: key,
      status: "started",
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

function claim<T>(ctx: Ctx, id: string, _key: string): AiClaim<T> {
  return {
    kind: "claimed",
    complete: async (result: T) => {
      await ctx.supabase
        .from("ai_requests")
        .update({ status: "completed", result, error_code: null })
        .eq("id", id)
        .eq("user_id", ctx.userId);
    },
    release: async (errorCode?: string) => {
      await ctx.supabase
        .from("ai_requests")
        .update({ status: "failed", error_code: errorCode ?? null })
        .eq("id", id)
        .eq("user_id", ctx.userId);
    },
  };
}
