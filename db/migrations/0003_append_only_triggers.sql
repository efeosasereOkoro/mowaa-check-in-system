-- Append-only integrity for the audit tables (E1-S4 / E10-S2 hardening).
--
-- attendance_log and medical_notes must be append-only for EVERY role (PRD §5:
-- "both are append-only for every role"). The app role `app_authenticated` is
-- already append-only by grant (SELECT + INSERT only, no UPDATE/DELETE — see
-- 0001_rls_policies). These triggers close the remaining gap: they block UPDATE
-- and DELETE at the row-engine level for ALL roles, including the table owner
-- (neondb_owner), which bypasses RLS. So an accidental or malicious change made
-- through the owner connection is rejected too.
--
-- Note: deliberate maintenance that must remove rows (e.g. the pre-launch
-- test-data cleanup, BACKLOG B-014) has to disable these triggers first, e.g.
--   alter table attendance_log disable trigger attendance_log_append_only;
-- run the cleanup, then re-enable. That friction is intentional.

create or replace function enforce_append_only() returns trigger
	language plpgsql
	as $$
begin
	raise exception '% is append-only: % is not permitted', tg_table_name, tg_op
		using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint

drop trigger if exists attendance_log_append_only on attendance_log;
--> statement-breakpoint
create trigger attendance_log_append_only
	before update or delete on attendance_log
	for each statement execute function enforce_append_only();
--> statement-breakpoint

drop trigger if exists medical_notes_append_only on medical_notes;
--> statement-breakpoint
create trigger medical_notes_append_only
	before update or delete on medical_notes
	for each statement execute function enforce_append_only();
