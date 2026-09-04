ALTER TABLE public.recommendation_feedback
  ADD COLUMN IF NOT EXISTS intended_action text;

ALTER TABLE public.recommendation_feedback
  ADD CONSTRAINT recommendation_feedback_intended_action_check
  CHECK (intended_action IS NULL OR intended_action IN ('plan_to_try','already_tried','not_relevant_now'));

ALTER TABLE public.recommendation_feedback
  ADD CONSTRAINT recommendation_feedback_notes_length_check
  CHECK (notes IS NULL OR char_length(notes) <= 500);