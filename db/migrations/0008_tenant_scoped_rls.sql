-- Tenant-scoped RLS (E12-S3). The isolation gate: every policy on every tenant-scoped
-- table now also requires `tenant_id = app_tenant_id()`, in BOTH the USING (read/affect)
-- and WITH CHECK (write) clauses, on top of the existing app_role() checks. After this,
-- a staffer of tenant A cannot read, insert, update or delete tenant B's rows — enforced
-- by the database, not just the app. This is the prerequisite for onboarding a second
-- tenant (public signup E12-S5, operator console E12-S9).
--
-- app_tenant_id() derives the tenant from the SAME staff row as app_role() (via
-- app_staff_id()), so role and tenant can never disagree — no separate tenant GUC.
-- The auto-stamp column DEFAULT app_tenant_id() (0007) already sets tenant_id = the
-- caller's tenant on insert, so the new WITH CHECK is satisfied by normal inserts and
-- rejects any row carrying a forged tenant_id.
--
-- children_card is security_invoker, so it inherits children's RLS — tenant scoping
-- flows through automatically once children_select carries the predicate (no view change).

-- Harden app_tenant_id() to also fail closed for a suspended staff member, matching
-- app_role() (0005). A deactivated staffer now yields NULL tenant → 0 rows / insert
-- default NULL → NOT NULL rejection.
create or replace function app_tenant_id() returns uuid
	language sql stable security definer set search_path = public
	as $$ select tenant_id from staff where id = app_staff_id() and deactivated_at is null $$;
--> statement-breakpoint

-- ---------- children ----------
alter policy children_select on children
	using (app_role() in ('admin','receptionist','health') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy children_insert on children
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy children_update on children
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy children_delete on children
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- tags ----------
alter policy tags_select on tags
	using (app_role() in ('admin','receptionist','health') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy tags_insert on tags
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy tags_update on tags
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy tags_delete on tags
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- pickup_persons ----------
alter policy pickups_select on pickup_persons
	using (app_role() in ('admin','receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy pickups_insert on pickup_persons
	with check (app_role() in ('admin','receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy pickups_update on pickup_persons
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy pickups_delete on pickup_persons
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- staff (admin-managed within the tenant; owner conn still resolves identity) ----------
alter policy staff_all on staff
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- event_days ----------
alter policy event_days_select on event_days
	using (app_role() in ('admin','receptionist','health') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy event_days_insert on event_days
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy event_days_update on event_days
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy event_days_delete on event_days
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- attendance_log (append-only: SELECT + INSERT only) ----------
alter policy attendance_select on attendance_log
	using (app_role() in ('admin','receptionist','health') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy attendance_insert on attendance_log
	with check (app_role() in ('admin','receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint

-- ---------- medical_notes (append-only: SELECT + INSERT only) ----------
alter policy mednotes_select on medical_notes
	using (app_role() in ('admin','health') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy mednotes_insert on medical_notes
	with check (app_role() in ('admin','health') and tenant_id = app_tenant_id());
