ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_description_not_blank CHECK (description IS NOT NULL AND btrim(description) <> '');

COMMENT ON COLUMN public.jobs.description IS 'Required job description text. Must be non-empty after trimming; URL extraction may prefill it but the user must complete it before saving.';

ALTER TABLE public.cvs ALTER COLUMN template SET DEFAULT 'modern';

COMMENT ON COLUMN public.cvs.template IS 'One of classic, modern, compact. Default is modern for newly created CVs; existing rows keep their stored template.';