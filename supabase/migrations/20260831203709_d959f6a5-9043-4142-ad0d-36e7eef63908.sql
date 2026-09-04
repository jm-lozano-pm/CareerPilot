ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS shown_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;

COMMENT ON COLUMN public.recommendations.shown_at IS 'First time this recommendation was actually rendered to its owner. Set once, never overwritten.';
COMMENT ON COLUMN public.recommendations.reviewed_at IS 'First time the owner explicitly reviewed this recommendation. Never inferred from record existence or from being shown.';
COMMENT ON COLUMN public.recommendations.dismissed_at IS 'When the owner dismissed this recommendation (state = dismissed). Independent of feedback: dismissal is not a Not helpful rating.';