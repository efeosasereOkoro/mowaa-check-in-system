-- Let deleting a staff row succeed without tripping the append-only triggers (B-049).
-- staff.id is referenced by attendance_log.staff_id and medical_notes.author_staff_id
-- (both ON DELETE SET NULL); event_days.id by medical_notes.event_day_id (SET NULL too).
-- The SET-NULL cascade issues an UPDATE the append-only triggers rejected. Extend them to
-- permit exactly those FK-null cascades (like 0006 did for the collector), keeping every
-- real edit and all DELETEs blocked. Attribution content is preserved (attendance keeps
-- collector_label; medical notes keep their text) — only the staff/day FK link is nulled.
--
-- Also converts medical_notes' trigger from STATEMENT-level to ROW-level: the old one fired
-- on the cascade UPDATE even when zero rows matched, so even a staff member who authored
-- nothing could not be deleted.

-- attendance_log: allow nulling collector_pickup_person_id (0006) AND staff_id (new).
create or replace function attendance_append_only() returns trigger
	language plpgsql
	as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'attendance_log is append-only: DELETE is not permitted' using errcode = 'restrict_violation';
	end if;
	-- Allow only the ON DELETE SET NULL cascades: collector_pickup_person_id and/or staff_id
	-- being nulled, with every other column unchanged.
	if to_jsonb(new) - 'collector_pickup_person_id' - 'staff_id' = to_jsonb(old) - 'collector_pickup_person_id' - 'staff_id'
		and (new.collector_pickup_person_id is null or new.collector_pickup_person_id is not distinct from old.collector_pickup_person_id)
		and (new.staff_id is null or new.staff_id is not distinct from old.staff_id) then
		return new;
	end if;
	raise exception 'attendance_log is append-only: UPDATE is not permitted' using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint

-- medical_notes: row-level, allow nulling author_staff_id and/or event_day_id (SET NULL cascades).
create or replace function medical_append_only() returns trigger
	language plpgsql
	as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'medical_notes is append-only: DELETE is not permitted' using errcode = 'restrict_violation';
	end if;
	if to_jsonb(new) - 'author_staff_id' - 'event_day_id' = to_jsonb(old) - 'author_staff_id' - 'event_day_id'
		and (new.author_staff_id is null or new.author_staff_id is not distinct from old.author_staff_id)
		and (new.event_day_id is null or new.event_day_id is not distinct from old.event_day_id) then
		return new;
	end if;
	raise exception 'medical_notes is append-only: UPDATE is not permitted' using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint

drop trigger if exists medical_notes_append_only on medical_notes;
--> statement-breakpoint
create trigger medical_notes_append_only
	before update or delete on medical_notes
	for each row execute function medical_append_only();
