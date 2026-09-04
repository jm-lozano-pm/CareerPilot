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
 -- Active stages (applied/interview/offer) may be corrected in either
 -- direction; every correction is appended to history, never rewritten.
 -- Terminal states are reached through record_application_outcome only.
 if p_to_status not in ('applied','interview','offer') then
  raise exception 'Terminal application status must be recorded with an outcome';
 end if;
 update public.applications set current_status=p_to_status where id=p_application_id and user_id=v_uid returning * into v_app;
 insert into public.application_status_history(user_id,application_id,from_status,to_status)
 values(v_uid,p_application_id,v_from,p_to_status);
 -- jobs.board_status is legacy/cache-only and intentionally not written here.
 return v_app;
end $function$;