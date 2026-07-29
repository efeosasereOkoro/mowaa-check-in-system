-- Self-managed Row-Level Security (see DECISIONS D-016).
--
-- Model: the app connects as the NON-OWNER role `app_authenticated` (RLS applies to it)
-- and sets `app.staff_id` (the verified staff-row id from the session) per request via
-- SET LOCAL inside a transaction. Policies derive the caller's role from the `staff`
-- table via app_role(), a SECURITY DEFINER helper that runs as owner (bypasses RLS on
-- staff, so no recursion). The owner role (neondb_owner) bypasses RLS entirely and is
-- used only for migrations/admin and session identity resolution.
--
-- Prerequisite: the `app_authenticated` login role must already exist (created out of
-- band; its password is not committed). See DECISIONS D-016 / BACKLOG.

-- ---------- helper functions ----------
create or replace function app_staff_id() returns uuid
	language sql stable
	as $$ select nullif(current_setting('app.staff_id', true), '')::uuid $$;
--> statement-breakpoint
create or replace function app_role() returns text
	language sql stable security definer set search_path = public
	as $$ select role::text from staff where id = app_staff_id() $$;
--> statement-breakpoint

-- ---------- base grants to app_authenticated (RLS then filters rows/ops) ----------
grant usage on schema public to app_authenticated;
--> statement-breakpoint
grant execute on function app_staff_id() to app_authenticated;
--> statement-breakpoint
grant execute on function app_role() to app_authenticated;
--> statement-breakpoint
grant select, insert, update, delete on children, tags, pickup_persons, staff, event_days to app_authenticated;
--> statement-breakpoint
grant select, insert on attendance_log, medical_notes to app_authenticated;
--> statement-breakpoint

-- ---------- enable RLS ----------
alter table children enable row level security;
--> statement-breakpoint
alter table tags enable row level security;
--> statement-breakpoint
alter table pickup_persons enable row level security;
--> statement-breakpoint
alter table staff enable row level security;
--> statement-breakpoint
alter table event_days enable row level security;
--> statement-breakpoint
alter table attendance_log enable row level security;
--> statement-breakpoint
alter table medical_notes enable row level security;
--> statement-breakpoint

-- ---------- children: all staff read; admin writes (column visibility = E3) ----------
create policy children_select on children for select to app_authenticated
	using (app_role() in ('admin','receptionist','health'));
--> statement-breakpoint
create policy children_insert on children for insert to app_authenticated
	with check (app_role() = 'admin');
--> statement-breakpoint
create policy children_update on children for update to app_authenticated
	using (app_role() = 'admin') with check (app_role() = 'admin');
--> statement-breakpoint
create policy children_delete on children for delete to app_authenticated
	using (app_role() = 'admin');
--> statement-breakpoint

-- ---------- tags: all staff read; admin writes ----------
create policy tags_select on tags for select to app_authenticated
	using (app_role() in ('admin','receptionist','health'));
--> statement-breakpoint
create policy tags_insert on tags for insert to app_authenticated
	with check (app_role() = 'admin');
--> statement-breakpoint
create policy tags_update on tags for update to app_authenticated
	using (app_role() = 'admin') with check (app_role() = 'admin');
--> statement-breakpoint
create policy tags_delete on tags for delete to app_authenticated
	using (app_role() = 'admin');
--> statement-breakpoint

-- ---------- pickup_persons: admin+receptionist read; admin manages; receptionist may INSERT (escalation, D-003) ----------
create policy pickups_select on pickup_persons for select to app_authenticated
	using (app_role() in ('admin','receptionist'));
--> statement-breakpoint
create policy pickups_insert on pickup_persons for insert to app_authenticated
	with check (app_role() in ('admin','receptionist'));
--> statement-breakpoint
create policy pickups_update on pickup_persons for update to app_authenticated
	using (app_role() = 'admin') with check (app_role() = 'admin');
--> statement-breakpoint
create policy pickups_delete on pickup_persons for delete to app_authenticated
	using (app_role() = 'admin');
--> statement-breakpoint

-- ---------- staff: admin only (identity resolution uses the owner connection) ----------
create policy staff_all on staff for all to app_authenticated
	using (app_role() = 'admin') with check (app_role() = 'admin');
--> statement-breakpoint

-- ---------- event_days: all staff read; admin writes ----------
create policy event_days_select on event_days for select to app_authenticated
	using (app_role() in ('admin','receptionist','health'));
--> statement-breakpoint
create policy event_days_insert on event_days for insert to app_authenticated
	with check (app_role() = 'admin');
--> statement-breakpoint
create policy event_days_update on event_days for update to app_authenticated
	using (app_role() = 'admin') with check (app_role() = 'admin');
--> statement-breakpoint
create policy event_days_delete on event_days for delete to app_authenticated
	using (app_role() = 'admin');
--> statement-breakpoint

-- ---------- attendance_log: all staff read; admin+receptionist insert; append-only ----------
create policy attendance_select on attendance_log for select to app_authenticated
	using (app_role() in ('admin','receptionist','health'));
--> statement-breakpoint
create policy attendance_insert on attendance_log for insert to app_authenticated
	with check (app_role() in ('admin','receptionist'));
--> statement-breakpoint

-- ---------- medical_notes: admin+health read & insert ONLY (receptionist: no access); append-only ----------
create policy mednotes_select on medical_notes for select to app_authenticated
	using (app_role() in ('admin','health'));
--> statement-breakpoint
create policy mednotes_insert on medical_notes for insert to app_authenticated
	with check (app_role() in ('admin','health'));
