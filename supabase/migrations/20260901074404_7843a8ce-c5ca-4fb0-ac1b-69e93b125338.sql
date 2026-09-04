ALTER TABLE public.ai_requests ADD COLUMN IF NOT EXISTS result jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS cv_job_match_assessments_unique_snapshot
  ON public.cv_job_match_assessments (user_id, job_id, cv_id, job_content_version, cv_content_version);