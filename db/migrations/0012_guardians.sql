-- Multiple guardians per child, each with a relationship (registration asks 7 + 8, B-051).
-- Mirrors pickup_persons. children.guardian_name/phone/email stay as the denormalized PRIMARY
-- guardian (so reports, the registration email, CSV export and the roster keep working
-- unchanged); this table holds the full list. Backfill the existing single guardian as primary.

create table guardians (
	id uuid primary key default gen_random_uuid(),
	tenant_id uuid not null default app_tenant_id() references tenants(id),
	child_id uuid not null references children(id) on delete cascade,
	name text not null,
	relationship text,
	phone text,
	email text,
	is_primary boolean not null default false,
	created_at timestamptz not null default now()
);
--> statement-breakpoint
create index guardians_child_id_idx on guardians (child_id);
--> statement-breakpoint
create index guardians_tenant_id_idx on guardians (tenant_id);
--> statement-breakpoint

-- Backfill: the existing single guardian becomes each child's primary guardian.
insert into guardians (tenant_id, child_id, name, phone, email, is_primary)
	select tenant_id, id, guardian_name, guardian_phone, guardian_email, true from children;
--> statement-breakpoint

grant select, insert, update, delete on guardians to app_authenticated;
--> statement-breakpoint
alter table guardians enable row level security;
--> statement-breakpoint

-- Mirror pickup_persons: admin + receptionist read/insert; admin manages. Tenant-scoped (E12).
create policy guardians_select on guardians for select to app_authenticated
	using (app_role() in ('admin', 'receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint
create policy guardians_insert on guardians for insert to app_authenticated
	with check (app_role() in ('admin', 'receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint
create policy guardians_update on guardians for update to app_authenticated
	using (app_role() = 'admin' and tenant_id = app_tenant_id())
	with check (app_role() = 'admin' and tenant_id = app_tenant_id());
--> statement-breakpoint
create policy guardians_delete on guardians for delete to app_authenticated
	using (app_role() = 'admin' and tenant_id = app_tenant_id());
