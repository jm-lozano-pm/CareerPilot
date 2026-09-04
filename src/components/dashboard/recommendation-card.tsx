import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, ThumbsDown, ThumbsUp, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { friendlyDataError } from "@/lib/auth-errors";
import {
  markRecommendationReviewed,
  markRecommendationShown,
  saveRecommendationFeedback,
  setRecommendationState,
  type RecommendationRecord,
} from "@/lib/insights-data";
import { evidenceLabel } from "@/lib/insights-shared";
import {
  FEEDBACK_NOTES_MAX,
  INTENDED_ACTIONS,
  INTENDED_ACTION_LABELS,
  draftFromFeedback,
  validateFeedbackDraft,
  type FeedbackDraft,
  type FeedbackRating,
  type RecommendationFeedback,
} from "@/lib/recommendation-feedback";

type Props = { recommendation: RecommendationRecord; insightId: string };

const EVIDENCE_MARKER = "Based on:";

function splitRationale(rationale: string): { text: string; evidence: string[] } {
  const index = rationale.lastIndexOf(EVIDENCE_MARKER);
  if (index === -1) return { text: rationale, evidence: [] };
  return {
    text: rationale.slice(0, index).trim(),
    evidence: rationale
      .slice(index + EVIDENCE_MARKER.length)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  };
}

export function RecommendationCard({ recommendation, insightId }: Props) {
  const queryClient = useQueryClient();
  const { text, evidence } = splitRationale(recommendation.rationale);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["insights", "recommendations", insightId] });

  const alreadyReviewed = recommendation.reviewedAt !== null;
  // Reviewed actions open by default; unreviewed ones stay summarised until reviewed.
  const [expanded, setExpanded] = useState(alreadyReviewed);

  // Display tracking: one write per recommendation, guarded locally and by the
  // `shown_at is null` filter in the data layer, so re-renders write nothing.
  const shownSent = useRef(false);
  useEffect(() => {
    if (shownSent.current || recommendation.shownAt !== null) return;
    shownSent.current = true;
    void markRecommendationShown(recommendation.id);
  }, [recommendation.id, recommendation.shownAt]);

  const stateMutation = useMutation({
    mutationFn: (state: "active" | "dismissed") => setRecommendationState(recommendation.id, state),
    onSuccess: async (_data, state) => {
      await invalidate();
      toast.success(state === "dismissed" ? "Action dismissed." : "Action restored.");
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const reviewMutation = useMutation({
    mutationFn: () => markRecommendationReviewed(recommendation.id),
    onSuccess: async () => {
      setExpanded(true);
      await invalidate();
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  // Feedback editing is deliberately local and separate from review/dismiss.
  const [draft, setDraft] = useState<FeedbackDraft>(() => draftFromFeedback(recommendation.feedback));
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const feedbackMutation = useMutation({
    mutationFn: (value: RecommendationFeedback) => saveRecommendationFeedback(recommendation.id, value),
    onSuccess: async () => {
      setEditingFeedback(false);
      setFeedbackError(null);
      await invalidate();
      toast.success("Thanks — feedback recorded.");
    },
    onError: (error) => setFeedbackError(friendlyDataError(error)),
  });

  // Keep the local draft aligned with stored feedback while not editing, so a
  // refetch (or feedback saved elsewhere) is reflected without clobbering input.
  const storedFeedbackKey = JSON.stringify(recommendation.feedback);
  useEffect(() => {
    if (editingFeedback) return;
    setDraft(draftFromFeedback(recommendation.feedback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedFeedbackKey, editingFeedback]);

  function chooseRating(rating: FeedbackRating) {
    setFeedbackError(null);
    setDraft((current) => ({ ...current, rating }));
    setEditingFeedback(true);
  }

  function submitFeedback() {
    const result = validateFeedbackDraft(draft);
    if (!result.ok) {
      setFeedbackError(result.error);
      return;
    }
    feedbackMutation.mutate(result.value);
  }

  function cancelFeedback() {
    setDraft(draftFromFeedback(recommendation.feedback));
    setFeedbackError(null);
    setEditingFeedback(false);
  }

  const notesLength = draft.notes.trim().length;
  const notesId = `recommendation-feedback-notes-${recommendation.id}`;
  const notesErrorId = `${notesId}-error`;

  const dismissed = recommendation.state === "dismissed";
  const busy = stateMutation.isPending || feedbackMutation.isPending || reviewMutation.isPending;
  const detailsId = `recommendation-details-${recommendation.id}`;

  return (
    <li
      className={`rounded-xl border border-border bg-surface p-4 ${dismissed ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{recommendation.title}</p>
          {alreadyReviewed && (
            <p className="mt-1 text-xs text-subtle-foreground">
              Reviewed {new Date(recommendation.reviewedAt!).toLocaleDateString()}
            </p>
          )}
        </div>
        {dismissed ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => stateMutation.mutate("active")}
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Restore
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Dismiss action: ${recommendation.title}`}
            disabled={busy}
            onClick={() => stateMutation.mutate("dismissed")}
          >
            {stateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="size-4" aria-hidden="true" />
            )}
            Dismiss
          </Button>
        )}
      </div>

      {!expanded ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={busy}
          aria-expanded={false}
          aria-controls={detailsId}
          onClick={() => {
            if (alreadyReviewed) {
              setExpanded(true);
              return;
            }
            reviewMutation.mutate();
          }}
        >
          {reviewMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
          Review recommendation
        </Button>
      ) : (
        <div id={detailsId}>
          {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}

          {evidence.length > 0 && (
            <p className="mt-3 text-xs text-subtle-foreground">
              Evidence basis:{" "}
              <span className="text-secondary-foreground">
                {evidence.map((key) => evidenceLabel(key)).join(" · ")}
              </span>
            </p>
          )}

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Was this useful?</span>
              <Button
                variant={draft.rating === "helpful" ? "secondary" : "outline"}
                size="sm"
                disabled={busy}
                aria-pressed={draft.rating === "helpful"}
                onClick={() => chooseRating("helpful")}
              >
                <ThumbsUp className="size-4" aria-hidden="true" />
                Helpful
              </Button>
              <Button
                variant={draft.rating === "not_helpful" ? "secondary" : "outline"}
                size="sm"
                disabled={busy}
                aria-pressed={draft.rating === "not_helpful"}
                onClick={() => chooseRating("not_helpful")}
              >
                <ThumbsDown className="size-4" aria-hidden="true" />
                Not helpful
              </Button>
              {recommendation.feedback && !editingFeedback && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditingFeedback(true)}>
                  Edit feedback
                </Button>
              )}
              <span className="text-xs text-subtle-foreground">
                Rating this doesn&apos;t dismiss it or mark it done.
              </span>
            </div>

            {editingFeedback && (
              <div className="mt-3 rounded-lg border border-border bg-surface-muted p-3">
                <Label htmlFor={notesId}>Anything you&apos;d like to add? (optional)</Label>
                <Textarea
                  id={notesId}
                  rows={3}
                  className="mt-1.5 bg-surface"
                  maxLength={FEEDBACK_NOTES_MAX}
                  value={draft.notes}
                  aria-describedby={feedbackError ? notesErrorId : undefined}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                />
                <p className="mt-1 text-xs text-subtle-foreground">
                  {notesLength}/{FEEDBACK_NOTES_MAX} characters
                </p>

                <fieldset className="mt-3">
                  <legend className="text-xs text-muted-foreground">
                    What do you intend to do? (optional — this is only your note, nothing is recorded
                    against your jobs or applications)
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INTENDED_ACTIONS.map((action) => {
                      const selected = draft.intendedAction === action;
                      return (
                        <Button
                          key={action}
                          type="button"
                          variant={selected ? "secondary" : "outline"}
                          size="sm"
                          aria-pressed={selected}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              intendedAction: selected ? "" : action,
                            }))
                          }
                        >
                          {INTENDED_ACTION_LABELS[action]}
                        </Button>
                      );
                    })}
                  </div>
                </fieldset>

                {feedbackError && (
                  <p id={notesErrorId} role="alert" className="mt-3 text-sm text-destructive">
                    {feedbackError}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={feedbackMutation.isPending} onClick={submitFeedback}>
                    {feedbackMutation.isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    {recommendation.feedback ? "Update feedback" : "Submit feedback"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={feedbackMutation.isPending}
                    onClick={cancelFeedback}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {recommendation.feedback && !editingFeedback && (
              <div className="mt-3 text-xs text-subtle-foreground">
                <p>
                  Recorded:{" "}
                  <span className="text-secondary-foreground">
                    {recommendation.feedback.rating === "helpful" ? "Helpful" : "Not helpful"}
                  </span>
                  {recommendation.feedback.intendedAction && (
                    <>
                      {" · "}
                      <span className="text-secondary-foreground">
                        {INTENDED_ACTION_LABELS[recommendation.feedback.intendedAction]}
                      </span>
                    </>
                  )}
                </p>
                {recommendation.feedback.notes && (
                  <p className="mt-1 text-secondary-foreground">{recommendation.feedback.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
