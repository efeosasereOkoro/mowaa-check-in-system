-- Optional guardian email on children. Used to email the guardian a registration
-- confirmation with the child's QR code, so they can show it on a phone at check-in/out.
-- Nullable: registration never requires it, and the email is simply skipped when absent.
-- children is already tenant-scoped by RLS, so a nullable column needs no policy change.
alter table children add column guardian_email text;
