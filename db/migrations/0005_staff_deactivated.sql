-- Suspend / reactivate staff (B-011 follow-up).
--
-- Soft-suspend rather than hard-delete: a removed staff member's attendance_log /
-- medical_notes attribution must survive (audit trail; the FKs are ON DELETE SET NULL,
-- so a hard delete would silently orphan history). `deactivated_at` marks a suspended
-- user. app_role() is tightened to ignore suspended rows, so RLS denies every data
-- operation for a suspended session even if one somehow reaches the DB — defense in
-- depth on top of the app-level block in getCurrentUser().

alter table staff add column if not exists deactivated_at timestamptz;
--> statement-breakpoint
create or replace function app_role() returns text
	language sql stable security definer set search_path = public
	as $$ select role::text from staff where id = app_staff_id() and deactivated_at is null $$;
