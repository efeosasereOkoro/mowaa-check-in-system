-- Column-level field visibility (E3), defense-in-depth at the database.
--
-- `children_card` masks role-gated columns using app_role() (the app-set, verified
-- staff context from E2-S3). security_invoker=true so RLS on `children` still applies
-- when app_authenticated reads through the view. Display reads should use this view;
-- the server-side projectChild() (lib/field-visibility.ts) is the matching app-layer guard.
--   health_details → Health Officer + Admin
--   home_address   → Admin only
create view children_card with (security_invoker = true) as
select
	c.id,
	c.first_name,
	c.last_name,
	c.age,
	c.guardian_name,
	c.guardian_phone,
	c.photo_url,
	case when app_role() in ('admin', 'health') then c.health_details end as health_details,
	case when app_role() = 'admin' then c.home_address end as home_address,
	c.created_at,
	c.updated_at
from children c;
--> statement-breakpoint
grant select on children_card to app_authenticated;
