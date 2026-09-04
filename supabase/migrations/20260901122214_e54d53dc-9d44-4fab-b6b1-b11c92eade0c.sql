ALTER TABLE public.career_goals
  ADD COLUMN IF NOT EXISTS preferred_employment_types jsonb NOT NULL DEFAULT '[]'::jsonb;