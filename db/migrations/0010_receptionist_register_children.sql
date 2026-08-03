-- Let receptionists register children directly, like admins (B-042, simplified — no pending
-- approval step). Opens INSERT on children and tags to receptionists so the registration flow
-- (add child + auto-assign a tag number) works for them. Admin-only management is unchanged:
-- children/tags UPDATE + DELETE stay admin-only (0008), so editing, deleting and re-generating
-- tags remain admin-only; receptionists can only create.
alter policy children_insert on children
	with check (app_role() in ('admin', 'receptionist') and tenant_id = app_tenant_id());
--> statement-breakpoint
alter policy tags_insert on tags
	with check (app_role() in ('admin', 'receptionist') and tenant_id = app_tenant_id());
