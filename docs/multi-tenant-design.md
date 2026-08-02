# Multi-tenant SaaS — design doc (E12)

Status: **draft**, informed by a passing RLS isolation spike (2026-07-31). Precedes E12-S2 code.
Owner: dev. Related: BACKLOG **B-022/B-023/B-005**, DECISIONS **D-016** (self-managed RLS), **D-024–D-032**.

## 1. Goal & scope
Turn the single-event check-in app into a **multi-tenant SaaS**: many independent organisations ("tenants"), each running their own **fully isolated** check-in system (children, staff, events, attendance, medical notes, reports), on shared infrastructure. In scope: tenancy model, data model, RLS, auth/membership, onboarding, per-tenant config, operator tooling, compliance. Out of scope for v1 of the SaaS: white-label domains (later, B-005) and billing (optional, E12-S11).

## 2. Tenancy model — DECISION: row-level `tenant_id` + RLS

**Chosen:** one shared schema; every tenant-scoped table carries a `tenant_id`; Postgres **RLS** scopes every row to the caller's tenant — extending our existing self-managed RLS (we already run feature queries as the non-owner `app_authenticated` role and set `app.staff_id` via `SET LOCAL`; we simply add a tenant GUC and a tenant predicate).

Rejected: **schema-per-tenant** (migration/ops overhead grows with tenant count) and **DB-per-tenant** (expensive, poor fit for Neon serverless at scale). Revisit only if a large tenant needs hard physical isolation.

**Spike result (throwaway `spike_mt` schema, real Neon, `app_authenticated` role, tenant set via a GUC exactly like `withStaffContext`) — 9/9:**
- Tenant A and B each see **only** their own rows.
- **No tenant context → 0 rows** (fails *closed*).
- Inserting a row with **another tenant's `tenant_id` is blocked** by the policy `WITH CHECK`.
- Cross-tenant **UPDATE/DELETE affect 0 rows** (hidden by the `USING` clause).
- The **owner** connection bypasses RLS (sees all) — so feature code must keep using `app_authenticated`, never the owner `db` client (already our rule).

The model works. The rest is applying it everywhere, without exception.

## 3. Data model changes
- New **`tenants`** table: `id`, `name`, `slug` (unique), `status` (active/suspended), `timezone`, `settings` (jsonb — brand name, feature flags), `plan`, `created_at`.
- Add **`tenant_id uuid not null references tenants(id)`** to: `staff`, `children`, `tags`, `pickup_persons`, `attendance_log`, `medical_notes`, `event_days` (and the future `events` table, §7).
- **Uniqueness becomes per-tenant**, via composite unique indexes: `tags.code`, tag numbers, and the `staff.email` lookup unique **within a tenant** (a person can be invited to more than one tenant → see membership). `children.qr_token` can stay globally unique (it's opaque).
- Index `tenant_id` on every table (it's in every query's `WHERE` now).
- **Backfill:** the existing single-tenant data becomes tenant #1 ("NLC Kids Camp") — a migration inserts one `tenants` row and stamps every existing row's `tenant_id`.

## 4. RLS plan
- New helper **`app_tenant_id()`** — `nullif(current_setting('app.tenant_id', true), '')::uuid` (fails closed to `null` → no rows).
- **`withStaffContext` sets both GUCs** in the transaction: `app.staff_id` **and** `app.tenant_id` (both read from the resolved session's staff row). One place, so no query can forget it.
- **Every policy** on every table gains `tenant_id = app_tenant_id()` in **both** `USING` and `WITH CHECK`, *in addition to* the existing `app_role()` checks. Also update:
  - the masked **`children_card`** view (add `tenant_id` scoping — `security_invoker` already carries the caller's context),
  - the **append-only triggers** (they already block UPDATE/DELETE regardless of tenant — fine; just ensure inserts can't cross tenants, enforced by the base-table policy),
  - the **reports** queries and the **CSV export** route handlers (they run under `withStaffContext`, so they inherit the tenant scope — verify, don't assume).
- **`app_role()`** stays SECURITY DEFINER but now must also be tenant-consistent: derive role from the staff row *matching both* `app_staff_id()` and the tenant (a suspended/foreign staff id yields no role → fail closed).

## 5. Auth & membership
- Neon Auth identities are **global**. Introduce membership:
  - **Option A** `staff.tenant_id` — one org per user. Simplest.
  - **Option B** a `memberships(user_id, tenant_id, role)` join table — a user can belong to many orgs, each with a role, plus an org switcher. More flexible, more work.
  - **Recommendation:** start with **A** (one org per staff row; a person in two orgs = two staff rows keyed by email), migrate to B only if multi-org demand appears.
- **Tenant resolution** in the session: the current tenant comes from the user's staff row (Option A). `getCurrentUser` returns `{ ...user, staff, tenantId }`; `withStaffContext` uses it.
- **Public sign-up** (E12-S5) creates a **tenant + its first admin** — this reverses D-013's "no public sign-up" **at the tenant-creation level only**; invite-only stays *within* a tenant.
- **URL strategy:** path/implicit first (tenant from membership, no URL change); subdomains (`acme.app`) later with wildcard DNS + cert (ties B-005).

## 6. Migration & backfill strategy
Ordered, reversible migrations:
1. `tenants` table; seed the existing org; **`tenant_id` nullable** on all tables.
2. Backfill every row → the seed tenant; then set `tenant_id NOT NULL` + FKs + per-tenant unique indexes.
3. `app_tenant_id()` + rewrite policies/view/`app_role()`; update `withStaffContext`.
4. Ship behind nothing (single tenant behaves identically) → then enable public signup (S5).
Each step is independently deployable; the app keeps working as a single-tenant instance throughout.

## 7. Per-tenant configuration
- **Timezone** — today hard-coded `Africa/Lagos` throughout the day-boundary logic → **`tenants.timezone`** (must thread through every `toLocaleString`/day-window calc). Highest-churn config change.
- **Events** (E12-S6, B-023) — replace the hard-coded event with an **`events`** table per tenant (one-off + recurrence rule → generated `event_days`). Attendance/reports become per-event.
- **Branding** — `EVENT_NAME` constant → `tenants.settings`.
- **Feature flags** — e.g. child photo (B-004) per tenant; plan limits (seats, children count).

## 8. Tenant lifecycle & operator console (E12-S9)
Create (self-serve), **suspend** (block all access — mirror the staff-suspend pattern at tenant level), **delete** (soft first; hard-delete needs the append-only trigger dance, B-014), per-tenant **data export**. A superadmin/operator surface (you): list tenants, support, **audited impersonation**, metrics.

## 9. Security & isolation testing (non-negotiable)
- A **permanent automated isolation suite** (extends the spike): for every table, prove tenant A cannot read/insert/update/delete tenant B — run in CI on every change.
- Full **security review** each merge (B-028): auth, RLS coverage, IDOR on tenant/child/token ids, CSRF on server actions, export scoping.
- **Compliance (E12-S10):** you become a **processor for many controllers** → DPA template, public **subprocessor list** (Vercel, Neon, Stripe…), per-tenant **export/erasure** (GDPR), data-residency options. Rotate chat-exposed creds first (B-009).

## 10. Phased rollout (maps to E12 stories)
1. **S1 landing** ✅ (done). 2. **This doc + spike** ✅. 3. **S2** tenancy foundation (tables, `tenant_id`, backfill, `app_tenant_id()`). 4. **S3** RLS scoping + isolation suite — *gate before any tenant-facing UI*. 5. **S4** membership + resolution. 6. **S5** public org signup. 7. **S6** per-tenant events + timezone. 8. **S7** settings/branding. 9. **S8** onboarding. 10. **S9** operator console. 11. **S10** compliance. 12. **S11** billing (optional).

## 11. Decisions — LOCKED (2026-07-31)
- **Membership: one org per user** — `staff.tenant_id` (a person in two orgs = two staff rows keyed by email). No join table for v1.
- **Tenant URL: path/implicit** — tenant resolved from the logged-in user's staff row; no URL change. Subdomains deferred (ties B-005).
- **Billing: later** — not in v1 scope; E12-S11 stays optional/deferred.
- Still to settle when building: tenant `slug` scheme + reserved names.

## 12. Risks
- **Cross-tenant leakage** (the whole ballgame) — mitigated by "set the tenant GUC in one place," fail-closed `app_tenant_id()`, policies on **every** table, and the permanent isolation suite.
- **A forgotten query path** (a raw owner query, a new table without a policy) — mitigated by keeping *all* feature reads in `withStaffContext` + a test that asserts RLS is enabled on every `public` table.
- **Timezone threading** — easy to miss a spot; audit every date/day calculation.
- **Backfill correctness** on live data — dry-run + row-count assertions.
