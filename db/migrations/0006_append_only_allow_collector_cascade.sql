-- Fix: removing a pickup person failed when they were recorded as a collector.
--
-- attendance_log.collector_pickup_person_id is ON DELETE SET NULL, so deleting a
-- pickup person cascades an UPDATE that nulls that FK — which the statement-level
-- append-only trigger (0003) rejected outright. The collector's name is snapshotted
-- in collector_label, so nulling the FK loses nothing meaningful.
--
-- Replace attendance_log's trigger with a ROW-level one that still blocks all DELETEs
-- and all real edits, but permits the single case where only collector_pickup_person_id
-- is set to NULL (the cascade). medical_notes keeps the strict all-or-nothing trigger.

create or replace function attendance_append_only() returns trigger
	language plpgsql
	as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'attendance_log is append-only: DELETE is not permitted' using errcode = 'restrict_violation';
	end if;
	-- UPDATE: allow only the pickup-person FK being nulled (ON DELETE SET NULL cascade).
	if new.collector_pickup_person_id is null
		and old.collector_pickup_person_id is not null
		and to_jsonb(new) - 'collector_pickup_person_id' = to_jsonb(old) - 'collector_pickup_person_id' then
		return new;
	end if;
	raise exception 'attendance_log is append-only: UPDATE is not permitted' using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint

drop trigger if exists attendance_log_append_only on attendance_log;
--> statement-breakpoint
create trigger attendance_log_append_only
	before update or delete on attendance_log
	for each row execute function attendance_append_only();
