/**
 * Recommendation feedback rules (P1.6) — pure, framework-free, so the same
 * validation runs in the UI and in tests.
 *
 * Scope boundaries that must stay true:
 * - Feedback is a *statement about the recommendation*, never a career record.
 *   An intended action is a self-reported intention only; it never creates or
 *   changes Jobs, Applications, Outcomes, CVs or Profile data.
 * - Feedback is independent of the review/dismiss/shown lifecycle. Rating
 *   "Not helpful" does not dismiss, and dismissing writes no feedback.
 * - Feedback never means the recommendation was completed.
 */

export type FeedbackRating = "helpful" | "not_helpful";

/** Small controlled vocabulary, mirrored by a CHECK constraint in the database. */
export const INTENDED_ACTIONS = ["plan_to_try", "already_tried", "not_relevant_now"] as const;
export type IntendedAction = (typeof INTENDED_ACTIONS)[number];

export const INTENDED_ACTION_LABELS: Record<IntendedAction, string> = {
  plan_to_try: "I plan to try this",
  already_tried: "I already tried this",
  not_relevant_now: "Not relevant right now",
};

export const FEEDBACK_NOTES_MAX = 500;

export type RecommendationFeedback = {
  rating: FeedbackRating;
  /** Optional short explanation; empty input is stored as null, not "". */
  notes: string | null;
  /** Optional stated intention; null when the user picked nothing. */
  intendedAction: IntendedAction | null;
};

export type FeedbackDraft = {
  rating: FeedbackRating | null;
  notes: string;
  intendedAction: IntendedAction | "" | null;
};

export const EMPTY_FEEDBACK_DRAFT: FeedbackDraft = { rating: null, notes: "", intendedAction: "" };

export function isFeedbackRating(value: unknown): value is FeedbackRating {
  return value === "helpful" || value === "not_helpful";
}

export function isIntendedAction(value: unknown): value is IntendedAction {
  return typeof value === "string" && (INTENDED_ACTIONS as readonly string[]).includes(value);
}

/** Tolerant reader for stored rows, including rows written before P1.6. */
export function parseStoredFeedback(row: unknown): RecommendationFeedback | null {
  if (typeof row !== "object" || row === null) return null;
  const record = row as Record<string, unknown>;
  if (!isFeedbackRating(record["rating"])) return null;
  const notes = typeof record["notes"] === "string" ? record["notes"].trim() : "";
  return {
    rating: record["rating"],
    notes: notes.length > 0 ? notes : null,
    intendedAction: isIntendedAction(record["intended_action"]) ? record["intended_action"] : null,
  };
}

/** Prefills the editor from an existing row so updating feedback is possible. */
export function draftFromFeedback(feedback: RecommendationFeedback | null): FeedbackDraft {
  if (!feedback) return { ...EMPTY_FEEDBACK_DRAFT };
  return {
    rating: feedback.rating,
    notes: feedback.notes ?? "",
    intendedAction: feedback.intendedAction ?? "",
  };
}

export type FeedbackValidation =
  | { ok: true; value: RecommendationFeedback }
  | { ok: false; error: string; field: "rating" | "notes" | "intendedAction" };

/**
 * Both optional fields may be blank — a plain Helpful / Not helpful rating is a
 * complete, valid submission. This stays a lightweight rating, not a survey.
 */
export function validateFeedbackDraft(draft: FeedbackDraft): FeedbackValidation {
  if (!isFeedbackRating(draft.rating)) {
    return { ok: false, field: "rating", error: "Choose Helpful or Not helpful first." };
  }
  const notes = draft.notes.trim();
  if (notes.length > FEEDBACK_NOTES_MAX) {
    return {
      ok: false,
      field: "notes",
      error: `Keep your explanation to ${FEEDBACK_NOTES_MAX} characters or fewer.`,
    };
  }
  const rawAction = draft.intendedAction;
  if (rawAction !== null && rawAction !== "" && !isIntendedAction(rawAction)) {
    return { ok: false, field: "intendedAction", error: "Choose one of the listed options." };
  }
  return {
    ok: true,
    value: {
      rating: draft.rating,
      notes: notes.length > 0 ? notes : null,
      intendedAction: isIntendedAction(rawAction) ? rawAction : null,
    },
  };
}

/**
 * Deterministic usefulness rollup, computed in code from stored feedback only.
 * Intentionally not surfaced as an Analytics page.
 */
export function summarizeFeedback(rows: (RecommendationFeedback | null)[]) {
  const present = rows.filter((row): row is RecommendationFeedback => row !== null);
  return {
    rated: present.length,
    helpful: present.filter((row) => row.rating === "helpful").length,
    notHelpful: present.filter((row) => row.rating === "not_helpful").length,
    withExplanation: present.filter((row) => row.notes !== null).length,
    intendedActions: {
      plan_to_try: present.filter((row) => row.intendedAction === "plan_to_try").length,
      already_tried: present.filter((row) => row.intendedAction === "already_tried").length,
      not_relevant_now: present.filter((row) => row.intendedAction === "not_relevant_now").length,
    },
  };
}
