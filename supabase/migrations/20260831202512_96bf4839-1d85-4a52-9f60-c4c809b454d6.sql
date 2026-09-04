ALTER TABLE public.application_outcomes ADD COLUMN IF NOT EXISTS employer_feedback text;

COMMENT ON COLUMN public.application_outcomes.employer_feedback IS 'Verbatim feedback/stated reason explicitly provided by the employer or recruiter. Untrusted user-entered evidence; never AI-generated or inferred.';

CREATE OR REPLACE FUNCTION public.record_application_outcome(p_application_id uuid, p_outcome text, p_outcome_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text, p_employer_feedback text DEFAULT NULL::text)
 RETURNS application_outcomes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_app public.applications; v_out public.application_outcomes; v_status text;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if p_outcome not in ('offer_accepted','offer_declined','rejected','withdrawn','closed') then raise exception 'Invalid outcome'; end if;
 select * into v_app from public.applications where id=p_application_id and user_id=v_uid for update;
 if not found then raise exception 'Application not found'; end if;
 v_status := case when p_outcome='offer_accepted' then 'closed' when p_outcome='offer_declined' then 'closed' else p_outcome end;
 insert into public.application_outcomes(user_id,application_id,outcome,outcome_date,notes,employer_feedback)
 values(v_uid,p_application_id,p_outcome,coalesce(p_outcome_date,current_date),p_notes,nullif(btrim(p_employer_feedback),''))
 on conflict(application_id) do update set outcome=excluded.outcome,outcome_date=excluded.outcome_date,notes=excluded.notes,employer_feedback=excluded.employer_feedback
 returning * into v_out;
 if v_app.current_status <> v_status then
  update public.applications set current_status=v_status where id=p_application_id and user_id=v_uid;
  insert into public.application_status_history(user_id,application_id,from_status,to_status)
  values(v_uid,p_application_id,v_app.current_status,v_status);
 end if;
 -- jobs.board_status is legacy/cache-only and intentionally not written here.
 return v_out;
end $function$;