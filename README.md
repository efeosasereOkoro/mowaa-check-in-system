# SmartTag Check-In

Child check-in / check-out and safeguarding console for **MOWAA Summer School**. Staff register
children, print QR ID cards, check them in and out (with authorised-collector verification), record
medical notes, file safeguarding/incident reports, and export attendance — with role-based access
enforced at the database, not just the UI.

> ⚠️ **This is a live production system holding real personal and special-category data** (children's
> names/ages, guardian contacts, home addresses, health/medical notes, safeguarding incidents). Treat
> all credentials as sensitive and see **Security** below before doing anything with the database.

Live: <https://mowaa-check-in-system.vercel.app>

---

## What it does

- **Roles** — Admin, Receptionist, Health Officer. One role per user, enforced by Postgres RLS.
- **Registration** — add a child (or a whole family) with guardian, pickup persons, health details; an
  opaque QR token + printable ID card is generated per child.
- **Check-in / check-out** — find a child by QR scan, name, or tag code; check-out records the
  authorised collector. Children may check in/out multiple times a day.
- **Dashboard** — live counters + roster, filterable by status, across the event days (GMT+1 windows).
- **Health** — Health Officer console: per-child medical notes (append-only), severity flags,
  emergency indicators.
- **Incidents** — safeguarding / incident reporting with a Protection Officer (admin) case workflow
  (Submitted → Escalated → Investigating → Resolved), append-only audit, CPO sign-off, CSV + printable
  PDF export, and email alerts to admins.
- **Reports** — per-day / date-range attendance, end-of-day flags, CSV + printable PDF export.
- **Field visibility** — receptionists never see health or home-address data; enforced server-side and
  by a masked DB view, not just hidden in the UI.

## Tech stack

- **Next.js 16** (App Router, server components + server actions) · **TypeScript** · **React 19**
- **Neon** serverless **Postgres** with **Drizzle ORM** and row-level security (RLS)
- **Neon Auth** (managed Better Auth) for email/password auth
- **Brevo** for transactional email (REST API) · **qrcode** for QR generation
- **Vercel** hosting (auto-deploy from `main`)
- Inline React style objects — no CSS framework. Shared UI in `components/` (see `components/console.tsx`).

> **Note:** this repo pins a customised build of Next.js — see `AGENTS.md`. Read the relevant guide in
> `node_modules/next/dist/docs/` before changing framework-level code.

## Getting started

**Prerequisites:** Node 22+, a Neon Postgres database (with an `app_authenticated` non-owner role for
RLS), a Neon Auth project, and a Brevo account for email.

1. **Install**
   ```bash
   npm install
   ```
2. **Environment** — create `.env.local` (never commit it; `.env*` is gitignored):
   ```
   DATABASE_URL=                 # Neon owner connection (migrations, identity resolution)
   DATABASE_AUTHENTICATED_URL=   # Neon app_authenticated role (RLS-scoped app queries)
   NEON_AUTH_BASE_URL=
   NEON_AUTH_COOKIE_SECRET=      # mark Sensitive in Vercel
   EMAIL_PROVIDER=brevo          # unset → log-only stub
   BREVO_API_KEY=                # a REST API key (starts xkeysib-), NOT the SMTP key (xsmtpsib-)
   EMAIL_FROM="MOWAA Summer School <noreply@your-verified-domain>"   # sender verified in Brevo
   APP_URL=                      # optional; public origin for links/QR in emails
   ```
3. **Run migrations**
   ```bash
   npm run db:migrate
   ```
4. **Dev server**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>. There is no public sign-up — an admin provisions staff under **Users**.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run test:isolation` (`npm test`) | Cross-tenant RLS isolation suite |

## Architecture notes

- **RLS everywhere.** App queries run through `withStaffContext()` (`lib/db-authenticated.ts`) as the
  non-owner `app_authenticated` role, so the database enforces the role matrix. `app_role()` /
  `app_tenant_id()` derive the caller from a verified session id. Identity resolution uses the owner
  connection (`lib/staff.ts`).
- **Append-only audit.** `attendance_log`, `medical_notes`, and `incident_updates` block UPDATE/DELETE
  via triggers — corrections are new rows.
- **Multi-tenant foundation.** Every core table carries `tenant_id` with `app_tenant_id()`-scoped
  policies; a permanent isolation suite gates it (`npm run test:isolation`). The app currently runs
  single-tenant.
- **Migrations** live in `db/migrations/` (Drizzle); schema in `db/schema.ts`.

## Deployment

Vercel builds and deploys `main` to production automatically; preview deployments are created for the
`staging` branch. Set every environment variable above in the Vercel project (mark secrets as
Sensitive). The database is Neon.

## Documentation

- `child-checkin-prd-v1.5.md` — the product requirements (the contract)
- `DECISIONS.md` — logged decisions (why the build differs from the PRD in places)
- `BACKLOG.md` — deferred work, with rationale *(local-only; gitignored)*
- `docs/` — manual test plan, receptionist quick-start, QR scan test, multi-tenant design

## Security

This system holds children's **special-category** data. Key controls: Postgres RLS, server-side field
visibility, append-only audit logs, HTTPS in transit, Neon encryption at rest, invite-only accounts.

**Before/with real data, rotate any credential that has ever appeared in plain text** (see backlog
**B-009**): the Neon API key, `neondb_owner` and `app_authenticated` DB passwords,
`NEON_AUTH_COOKIE_SECRET`, and the main admin password. Run the pre-launch security pass (**B-029**)
and confirm lawyer sign-off on the Terms/Privacy pages (**B-030**).
