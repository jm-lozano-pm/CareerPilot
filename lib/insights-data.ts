import { supabase } from "@/integrations/supabase/client";
import type { JobSearchContextRefs, JobSearchInsightContent } from "@/lib/insights-shared";
import {
  parseStoredFeedback,
  type RecommendationFeedback,
} from "@/lib/recommendation-feedback";

export type JobSearchInsightRecord = {
  id: string;
  generatedAt: string;
  content: JobSearchInsightContent;
  contextRefs: JobSearchContextRefs | null;
};

export type RecommendationRecord = {
  id: string;
  insightId: string | null;
  title: string;
  rationale: string;
  state: "active" | "dismissed";
  createdAt: string;
  /** Stored feedback (rating + optional explanation + optional stated intention), or null. */
  feedback: RecommendationFeedback | null;
  /** First time the card was actually rendered for the owner; null on older rows. */
  shownAt: string | null;
  /** Set only by an explicit Review interaction — never inferred from existence or display. */
  reviewedAt: string | null;
  /** Set when the owner dismissed the action; independent of any feedback rating. */
  dismissedAt: string | null;
};

/** Engagement stage of one recommendation, derived deterministically from stored facts. */
export type RecommendationStage =
  | "generated"
  | "shown"
  | "reviewed"
  | "dismissed";

/**
 * Deterministic engagement rollup. Dismissal and feedback are independent facts,
 * so a dismissed action can still be unrated and a rated action can stay active.
 */
export function summarizeRecommendationEngagement(records: RecommendationRecord[]) {
  return {
    generated: records.length,
    shown: records.filter((r) => r.shownAt !== null).length,
    reviewed: records.filter((r) => r.reviewedAt !== null).length,
    dismissed: records.filter((r) => r.dismissedAt !== null || r.state === "dismissed").length,
    feedbackSubmitted: records.filter((r) => r.feedback !== null).length,
  };
}

/** Furthest stage reached. Dismissal is terminal for display purposes only. */
export function recommendationStage(record: RecommendationRecord): RecommendationStage {
  if (record.dismissedAt !== null || record.state === "dismissed") return "dismissed";
  if (record.reviewedAt !== null) return "reviewed";
  if (record.shownAt !== null) return "shown";
  return "generated";
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Your session has expired. Please sign in again.");
  return id;
}

/** Most recent stored job-search insight, or null when none exists. */
export async function fetchLatestJobSearchInsight(): Promise<JobSearchInsightRecord | null> {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, generated_at, content, context_refs")
    .eq("type", "job_search")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("We couldn't load your saved insight. Please try again.");
  if (!data) return null;
  return {
    id: data.id,
    generatedAt: data.generated_at,
    content: data.content as unknown as JobSearchInsightContent,
    contextRefs: (data.context_refs as unknown as JobSearchContextRefs | null) ?? null,
  };
}

/** Recommendations for one insight, including any recorded feedback. */
export async function fetchRecommendations(insightId: string): Promise<RecommendationRecord[]> {
  const { data, error } = await supabase
    .from("recommendations")
    .select(
      "id, insight_id, title, rationale, state, created_at, shown_at, reviewed_at, dismissed_at, recommendation_feedback(rating, notes, intended_action)",
    )
    .eq("insight_id", insightId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("We couldn't load your recommended actions. Please try again.");
  return (data ?? []).map((row) => {
    const feedbackRows = (row as { recommendation_feedback?: unknown }).recommendation_feedback;
    // One row per recommendation is enforced by the unique constraint, so the
    // embedded relation is read as either an object or a single-item array.
    const feedbackRow = Array.isArray(feedbackRows) ? feedbackRows[0] : feedbackRows;
    return {
      id: row.id,
      insightId: row.insight_id,
      title: row.title,
      rationale: row.rationale ?? "",
      state: (row.state === "dismissed" ? "dismissed" : "active") as RecommendationRecord["state"],
      createdAt: row.created_at,
      feedback: parseStoredFeedback(feedbackRow),
      shownAt: row.shown_at ?? null,
      reviewedAt: row.reviewed_at ?? null,
      dismissedAt: row.dismissed_at ?? null,
    };
  });
}

/**
 * Dismiss or restore. Dismissing stamps dismissed_at once; restoring clears it.
 * Feedback rows are never created or changed here — dismissal is not a rating.
 */
export async function setRecommendationState(
  id: string,
  state: "active" | "dismissed",
): Promise<void> {
  const patch =
    state === "dismissed"
      ? { state, dismissed_at: new Date().toISOString() }
      : { state, dismissed_at: null };
  const { error } = await supabase.from("recommendations").update(patch).eq("id", id);
  if (error) {
    throw new Error(
      state === "dismissed"
        ? "We couldn't dismiss that action. Please try again."
        : "We couldn't restore that action. Please try again.",
    );
  }
}

/**
 * Idempotent first-render stamp. The `is null` filter means repeated calls match
 * no rows, so re-renders cannot overwrite the original timestamp.
 */
export async function markRecommendationShown(id: string): Promise<void> {
  const { error } = await supabase
    .from("recommendations")
    .update({ shown_at: new Date().toISOString() })
    .eq("id", id)
    .is("shown_at", null);
  // Display tracking must never interrupt the user; surface nothing on failure.
  if (error) return;
}

/** Explicit review, stamped once. Repeat calls are no-ops thanks to the `is null` filter. */
export async function markRecommendationReviewed(id: string): Promise<void> {
  const { error } = await supabase
    .from("recommendations")
    .update({ reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .is("reviewed_at", null);
  if (error) throw new Error("We couldn't record your review. Please try again.");
}

/**
 * One feedback row per recommendation; sending again updates that same row,
 * including clearing an optional field back to null. This touches nothing in
 * the review/dismiss/shown lifecycle and no career records.
 */
export async function saveRecommendationFeedback(
  recommendationId: string,
  feedback: RecommendationFeedback,
): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from("recommendation_feedback").upsert(
    {
      user_id: userId,
      recommendation_id: recommendationId,
      rating: feedback.rating,
      notes: feedback.notes,
      intended_action: feedback.intendedAction,
    },
    { onConflict: "recommendation_id" },
  );
  if (error) throw new Error("We couldn't record your feedback. Please try again.");
}
