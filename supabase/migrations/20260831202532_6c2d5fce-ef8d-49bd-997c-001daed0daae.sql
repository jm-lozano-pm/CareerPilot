DROP FUNCTION IF EXISTS public.record_application_outcome(uuid, text, date, text);

REVOKE ALL ON FUNCTION public.record_application_outcome(uuid, text, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_application_outcome(uuid, text, date, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_application_outcome(uuid, text, date, text, text) TO authenticated;