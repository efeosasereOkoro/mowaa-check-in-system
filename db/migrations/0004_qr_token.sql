-- Per-child opaque QR token (E11-S1 / D-026).
--
-- Every child gets a non-guessable token, printed as a QR on their ID card. A scan
-- resolves to the child via lookup() (exact match). Auto-provisioned: the DB default
-- fills new rows; the backfill fills existing ones. gen_random_uuid() is built in on
-- Neon/Postgres. The token is meaningless to a generic phone camera (bare string, not
-- a URL), so only the app's scanner can turn it into a child.
--
-- The table-level SELECT grant to app_authenticated already covers the new column, so
-- lookup() (running as app_authenticated under RLS) can read it. `children_card` is not
-- touched — display reads don't need the token; only card printing (E11-S3, admin) does.

alter table children add column if not exists qr_token text;
--> statement-breakpoint
update children set qr_token = gen_random_uuid() where qr_token is null;
--> statement-breakpoint
alter table children alter column qr_token set not null;
--> statement-breakpoint
alter table children alter column qr_token set default gen_random_uuid();
--> statement-breakpoint
create unique index if not exists children_qr_token_key on children (qr_token);
