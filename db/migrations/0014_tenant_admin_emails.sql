-- E13-S7: notify a tenant's admins (Protection Officers) by email when an incident is filed or
-- escalated. To email them we need their addresses — but `staff` is admin-only under RLS, and a
-- receptionist or health officer can file an incident. This SECURITY DEFINER helper returns ONLY
-- the active admin emails of the CALLER's own tenant (via app_tenant_id()), so any on-duty staff
-- can trigger the notification without being able to browse staff. Used server-side for email
-- recipients only — never surfaced to the client.
create or replace function tenant_admin_emails() returns table(email text)
	language sql
	stable
	security definer
	set search_path = public
	as $$
	select s.email
	from staff s
	where s.tenant_id = app_tenant_id()
		and s.role = 'admin'
		and s.deactivated_at is null
		and s.email is not null;
$$;
--> statement-breakpoint
grant execute on function tenant_admin_emails() to app_authenticated;
