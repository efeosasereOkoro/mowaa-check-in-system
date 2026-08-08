-- E13-S1: Safeguarding & incident reporting foundation (B-048). Append-only + tenant-scoped,
-- mirroring medical_notes / attendance_log. Two tables:
--   incident_reports  — the immutable filed report (the ≤24h written record).
--   incident_updates  — append-only workflow/audit log; the current status of an incident is
--                       the latest update's new_status (like attendance status = last action).
-- Broader than medical_notes: an incident may involve an adult or a child (child_id nullable).
-- Protection Officer = admin for now. No UI in this story.

create type incident_category as enum (
	'safeguarding', 'medical_emergency', 'injury', 'abuse_suspicion', 'security_breach', 'theft_damage', 'other'
);
--> statement-breakpoint
create type incident_status as enum ('submitted', 'escalated', 'investigating', 'resolved');
--> statement-breakpoint
create type incident_update_kind as enum ('status_change', 'note', 'guardian_notified', 'signoff');
--> statement-breakpoint

create table incident_reports (
	id uuid primary key default gen_random_uuid(),
	tenant_id uuid not null default app_tenant_id() references tenants(id),
	-- Nullable: not every incident involves a specific child. RESTRICT protects the safeguarding
	-- trail (can't delete a child who has an incident on file), like medical_notes.child_id.
	child_id uuid references children(id) on delete restrict,
	category incident_category not null,
	category_other text, -- free text when category = 'other'
	-- The filer (signed-in staff). SET NULL + the append-only trigger's allowance keep the report
	-- if the staff member is later deleted (B-049).
	reporter_staff_id uuid references staff(id) on delete set null,
	-- Optional details of an external reporter, when the person reporting isn't the signed-in staff.
	reporter_name text,
	reporter_phone text,
	reporter_email text,
	incident_at timestamptz, -- when it happened (form-enforced; nullable at the DB)
	location text,
	persons_involved text,
	how_involved text,
	narrative text not null, -- the statement
	key_notes text,
	guardian_notified boolean not null default false,
	guardian_notified_at timestamptz,
	filed_at timestamptz not null default now(),
	created_at timestamptz not null default now()
);
--> statement-breakpoint
create index incident_reports_tenant_id_idx on incident_reports (tenant_id);
--> statement-breakpoint
create index incident_reports_child_id_idx on incident_reports (child_id);
--> statement-breakpoint

create table incident_updates (
	id uuid primary key default gen_random_uuid(),
	tenant_id uuid not null default app_tenant_id() references tenants(id),
	incident_id uuid not null references incident_reports(id) on delete cascade,
	author_staff_id uuid references staff(id) on delete set null,
	kind incident_update_kind not null,
	new_status incident_status, -- set when kind = 'status_change'
	note text,
	created_at timestamptz not null default now()
);
--> statement-breakpoint
create index incident_updates_tenant_id_idx on incident_updates (tenant_id);
--> statement-breakpoint
create index incident_updates_incident_id_idx on incident_updates (incident_id);
--> statement-breakpoint

-- Append-only (row-level): block DELETE + any real UPDATE, allowing only the staff SET-NULL
-- cascade (reporter_staff_id / author_staff_id) — exactly like medical_append_only (0011).
create function incident_reports_append_only() returns trigger
	language plpgsql
	as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'incident_reports is append-only: DELETE is not permitted' using errcode = 'restrict_violation';
	end if;
	if to_jsonb(new) - 'reporter_staff_id' = to_jsonb(old) - 'reporter_staff_id'
		and (new.reporter_staff_id is null or new.reporter_staff_id is not distinct from old.reporter_staff_id) then
		return new;
	end if;
	raise exception 'incident_reports is append-only: UPDATE is not permitted' using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint
create trigger incident_reports_append_only
	before update or delete on incident_reports
	for each row execute function incident_reports_append_only();
--> statement-breakpoint

create function incident_updates_append_only() returns trigger
	language plpgsql
	as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'incident_updates is append-only: DELETE is not permitted' using errcode = 'restrict_violation';
	end if;
	if to_jsonb(new) - 'author_staff_id' = to_jsonb(old) - 'author_staff_id'
		and (new.author_staff_id is null or new.author_staff_id is not distinct from old.author_staff_id) then
		return new;
	end if;
	raise exception 'incident_updates is append-only: UPDATE is not permitted' using errcode = 'restrict_violation';
end
$$;
--> statement-breakpoint
create trigger incident_updates_append_only
	before update or delete on incident_updates
	for each row execute function incident_updates_append_only();
--> statement-breakpoint

-- Grants: append-only tables get select + insert only (like attendance_log / medical_notes).
grant select, insert on incident_reports, incident_updates to app_authenticated;
--> statement-breakpoint
alter table incident_reports enable row level security;
--> statement-breakpoint
alter table incident_updates enable row level security;
--> statement-breakpoint

-- RLS (Protection Officer = admin for now; tenant-scoped in USING and WITH CHECK, E12).
-- incident_reports: any on-duty staff (admin/receptionist/health) files, as themselves; admin
-- reads all, and a filer can read their own filed reports. No UPDATE/DELETE policy (append-only;
-- the staff SET-NULL cascade bypasses RLS as a referential action, like the other audit tables).
create policy incident_reports_select on incident_reports for select to app_authenticated
	using ((app_role() = 'admin' or reporter_staff_id = app_staff_id()) and tenant_id = app_tenant_id());
--> statement-breakpoint
create policy incident_reports_insert on incident_reports for insert to app_authenticated
	with check (app_role() in ('admin', 'receptionist', 'health') and reporter_staff_id = app_staff_id() and tenant_id = app_tenant_id());
--> statement-breakpoint

-- incident_updates: the CPO/admin workflow + sign-off log — admin only.
create policy incident_updates_select on incident_updates for select to app_authenticated
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
create policy incident_updates_insert on incident_updates for insert to app_authenticated
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
