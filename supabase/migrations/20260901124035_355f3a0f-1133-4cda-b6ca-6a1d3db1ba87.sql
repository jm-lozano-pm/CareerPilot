ALTER TABLE public.jobs ALTER COLUMN description SET NOT NULL;
-- CHECK constraint jobs_description_not_blank already exists and enforces non-blank descriptions.