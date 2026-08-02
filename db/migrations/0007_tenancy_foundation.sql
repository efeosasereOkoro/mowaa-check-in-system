-- Multi-tenant foundation (E12-S2). Adds a `tenants` table and a `tenant_id` on every
-- tenant-scoped table, backfilling existing rows to the seed org. tenant_id is stamped
-- automatically on insert via a column DEFAULT of app_tenant_id() (derived from the acting
-- staff member's row, SECURITY DEFINER) — so existing insert code needs no changes.
--
-- RLS tenant-scoping of the *existing* per-table policies is E12-S3. With only the seed
-- tenant present there is no isolation gap yet. This migration is backward-compatible with
-- pre-tenant app code (inserts auto-stamp; selects ignore the new column).

create table tenants (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	status text not null default 'active',
	timezone text not null default 'Africa/Lagos',
	settings jsonb not null default '{}'::jsonb,
	plan text not null default 'free',
	created_at timestamptz not null default now()
);
--> statement-breakpoint
insert into tenants (name, slug, timezone) values ('NLC Kids Camp', 'nlc-kids-camp', 'Africa/Lagos');
--> statement-breakpoint

alter table staff add column tenant_id uuid;
--> statement-breakpoint
alter table children add column tenant_id uuid;
--> statement-breakpoint
alter table tags add column tenant_id uuid;
--> statement-breakpoint
alter table pickup_persons add column tenant_id uuid;
--> statement-breakpoint
alter table attendance_log add column tenant_id uuid;
--> statement-breakpoint
alter table medical_notes add column tenant_id uuid;
--> statement-breakpoint
alter table event_days add column tenant_id uuid;
--> statement-breakpoint

update staff set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
update children set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
update tags set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
update pickup_persons set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
-- attendance_log + medical_notes are append-only (UPDATE blocked by triggers). Disable the
-- trigger just for this one-time tenant_id backfill, then re-enable. (Inserts stay allowed,
-- so the app's normal writes are unaffected.)
alter table attendance_log disable trigger attendance_log_append_only;
--> statement-breakpoint
update attendance_log set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
alter table attendance_log enable trigger attendance_log_append_only;
--> statement-breakpoint
alter table medical_notes disable trigger medical_notes_append_only;
--> statement-breakpoint
update medical_notes set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint
alter table medical_notes enable trigger medical_notes_append_only;
--> statement-breakpoint
update event_days set tenant_id = (select id from tenants where slug = 'nlc-kids-camp') where tenant_id is null;
--> statement-breakpoint

-- Tenant context: derive the caller's tenant from their staff row (staff.tenant_id now
-- exists). SECURITY DEFINER bypasses staff RLS — same pattern as app_role(). Fails closed.
create or replace function app_tenant_id() returns uuid
	language sql stable security definer set search_path = public
	as $$ select tenant_id from staff where id = app_staff_id() $$;
--> statement-breakpoint
grant execute on function app_tenant_id() to app_authenticated;
--> statement-breakpoint
grant select on tenants to app_authenticated;
--> statement-breakpoint

-- Lock down each table: NOT NULL + FK + auto-stamp default + index.
alter table staff alter column tenant_id set not null;
--> statement-breakpoint
alter table staff add constraint staff_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table staff alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index staff_tenant_id_idx on staff (tenant_id);
--> statement-breakpoint

alter table children alter column tenant_id set not null;
--> statement-breakpoint
alter table children add constraint children_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table children alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index children_tenant_id_idx on children (tenant_id);
--> statement-breakpoint

alter table tags alter column tenant_id set not null;
--> statement-breakpoint
alter table tags add constraint tags_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table tags alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index tags_tenant_id_idx on tags (tenant_id);
--> statement-breakpoint

alter table pickup_persons alter column tenant_id set not null;
--> statement-breakpoint
alter table pickup_persons add constraint pickup_persons_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table pickup_persons alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index pickup_persons_tenant_id_idx on pickup_persons (tenant_id);
--> statement-breakpoint

alter table attendance_log alter column tenant_id set not null;
--> statement-breakpoint
alter table attendance_log add constraint attendance_log_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table attendance_log alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index attendance_log_tenant_id_idx on attendance_log (tenant_id);
--> statement-breakpoint

alter table medical_notes alter column tenant_id set not null;
--> statement-breakpoint
alter table medical_notes add constraint medical_notes_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table medical_notes alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index medical_notes_tenant_id_idx on medical_notes (tenant_id);
--> statement-breakpoint

alter table event_days alter column tenant_id set not null;
--> statement-breakpoint
alter table event_days add constraint event_days_tenant_id_fk foreign key (tenant_id) references tenants(id);
--> statement-breakpoint
alter table event_days alter column tenant_id set default app_tenant_id();
--> statement-breakpoint
create index event_days_tenant_id_idx on event_days (tenant_id);
--> statement-breakpoint

-- Uniqueness becomes per-tenant (was global): a tag number and an event day number are
-- unique within a tenant, so a second org can reuse TAG-001 / Day 1.
alter table tags drop constraint tags_code_unique;
--> statement-breakpoint
create unique index tags_tenant_code_key on tags (tenant_id, code);
--> statement-breakpoint
alter table event_days drop constraint event_days_day_number_unique;
--> statement-breakpoint
create unique index event_days_tenant_day_number_key on event_days (tenant_id, day_number);
--> statement-breakpoint

-- tenants RLS: a staff member can read only their own tenant row.
alter table tenants enable row level security;
--> statement-breakpoint
create policy tenants_self_select on tenants for select to app_authenticated using (id = app_tenant_id());
