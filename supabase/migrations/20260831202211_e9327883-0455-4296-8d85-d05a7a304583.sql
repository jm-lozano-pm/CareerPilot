CREATE OR REPLACE FUNCTION public.record_application(p_job_id uuid, p_application_date date DEFAULT CURRENT_DATE, p_cv_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS applications
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_app public.applications;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.jobs where id=p_job_id and user_id=v_uid) then raise exception 'Job not found'; end if;
 if p_cv_id is not null and not exists(select 1 from public.cvs where id=p_cv_id and user_id=v_uid) then raise exception 'CV not found'; end if;
 if exists(select 1 from public.applications where job_id=p_job_id) then raise exception 'Application already exists for this job'; end if;
 insert into public.applications(user_id,job_id,cv_id,application_date,current_status,notes)
 values(v_uid,p_job_id,p_cv_id,coalesce(p_application_date,current_date),'applied',p_notes) returning * into v_app;
 insert into public.application_status_history(user_id,application_id,from_status,to_status)
 values(v_uid,v_app.id,null,'applied');
 -- jobs.board_status is legacy/cache-only and intentionally not written here.
 return v_app;
end $function$;

CREATE OR REPLACE FUNCTION public.transition_application_status(p_application_id uuid, p_to_status text)
 RETURNS applications
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_app public.applications; v_from text;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if p_to_status not in ('applied','interview','offer','rejected','withdrawn','closed') then raise exception 'Invalid application status'; end if;
 select * into v_app from public.applications where id=p_application_id and user_id=v_uid for update;
 if not found then raise exception 'Application not found'; end if;
 v_from := v_app.current_status;
 if v_from in ('rejected','withdrawn','closed') then raise exception 'Terminal application status cannot be changed'; end if;
 if p_to_status = v_from then return v_app; end if;
 if (v_from='applied' and p_to_status not in ('interview','rejected','withdrawn','closed'))
 or (v_from='interview' and p_to_status not in ('offer','rejected','withdrawn','closed'))
 or (v_from='offer' and p_to_status not in ('rejected','withdrawn','closed')) then
  raise exception 'Invalid application status transition';
 end if;
 update public.applications set current_status=p_to_status where id=p_application_id and user_id=v_uid returning * into v_app;
 insert into public.application_status_history(user_id,application_id,from_status,to_status)
 values(v_uid,p_application_id,v_from,p_to_status);
 -- jobs.board_status is legacy/cache-only and intentionally not written here.
 return v_app;
end $function$;

CREATE OR REPLACE FUNCTION public.record_application_outcome(p_application_id uuid, p_outcome text, p_outcome_date date DEFAULT CURRENT_DATE, p_notes text DEFAULT NULL::text)
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
 insert into public.application_outcomes(user_id,application_id,outcome,outcome_date,notes)
 values(v_uid,p_application_id,p_outcome,coalesce(p_outcome_date,current_date),p_notes)
 on conflict(application_id) do update set outcome=excluded.outcome,outcome_date=excluded.outcome_date,notes=excluded.notes
 returning * into v_out;
 if v_app.current_status <> v_status then
  update public.applications set current_status=v_status where id=p_application_id and user_id=v_uid;
  insert into public.application_status_history(user_id,application_id,from_status,to_status)
  values(v_uid,p_application_id,v_app.current_status,v_status);
 end if;
 -- jobs.board_status is legacy/cache-only and intentionally not written here.
 return v_out;
end $function$;

COMMENT ON COLUMN public.jobs.board_status IS 'LEGACY/cache-only. Not authoritative and not read by the application. Board status is derived from applications.current_status, or Saved when no application exists.';