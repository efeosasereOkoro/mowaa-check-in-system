import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Auto-stamp tenant_id on insert from the acting staff member's tenant (E12-S2). The
// column is NOT NULL but has this default, so existing insert code needs no changes.
const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .default(sql`app_tenant_id()`)
    .references(() => tenants.id);

/**
 * Child Check-In / Check-Out — core data model.
 * PRD §10.2 tables: users, children, tags, pickup_persons, attendance_log,
 * medical_notes, event_days. (PRD `users` is modelled here as `staff` to avoid
 * clashing with Neon Auth's own user tables.)
 *
 * Decisions baked in (see DECISIONS.md):
 *  - D-006: children have separate first_name / last_name; three attendance states.
 *  - D-001/D-002: event_days hold admin-defined GMT+1 start/end windows.
 *
 * NOT in this migration (separate stories): RLS policies (E2/E3) and the
 * append-only UPDATE/DELETE triggers for attendance_log + medical_notes (E1-S4).
 */

// ---------- enums ----------
export const staffRole = pgEnum('staff_role', ['admin', 'receptionist', 'health']);
export const attendanceAction = pgEnum('attendance_action', ['check_in', 'check_out']);
export const noteSeverity = pgEnum('note_severity', ['routine', 'incident', 'emergency']);

// ---------- tenants (E12 multi-tenant SaaS) ----------
// One row per organisation. Every tenant-scoped table carries a tenant_id FK to here;
// RLS scopes rows by app_tenant_id() (E12-S3). One org per user (staff.tenant_id).
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull().default('active'), // active | suspended
  timezone: text('timezone').notNull().default('Africa/Lagos'), // per-tenant day-boundary tz
  settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`), // brand name, feature flags
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- staff (PRD `users`) ----------
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  // Links to the Neon Auth user identity; populated when auth is wired in E2.
  authUserId: text('auth_user_id').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: staffRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Set when an admin suspends the user: blocks login (getCurrentUser) and, via
  // app_role(), denies all RLS-scoped data ops. Null = active. Reversible.
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
});

// ---------- event_days (GMT+1 admin-defined windows) ----------
export const eventDays = pgTable(
  'event_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    dayNumber: integer('day_number').notNull(), // unique per tenant (below)
    label: text('label'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('event_days_tenant_day_number_key').on(table.tenantId, table.dayNumber)],
);

// ---------- children ----------
export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  age: integer('age'),
  guardianName: text('guardian_name').notNull(),
  guardianPhone: text('guardian_phone').notNull(),
  guardianEmail: text('guardian_email'), // optional; where the registration + QR email is sent
  homeAddress: text('home_address'), // admin-only visibility (enforced by RLS in E3)
  healthDetails: text('health_details'), // allergies / conditions, free text
  photoUrl: text('photo_url'), // optional; feature-flagged pending safeguarding (B-004)
  // Opaque per-child QR token (E11): printed as a QR on the child's ID card; a scan
  // resolves to this child via lookup(). Non-guessable; auto-provisioned; QR payload
  // is the bare token (not a URL). See DECISIONS D-026.
  qrToken: text('qr_token').notNull().unique().default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- tags (Samsung SmartTag2) ----------
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: tenantId(),
    code: text('code').notNull(), // human tag number, e.g. TAG-001 (unique per tenant, below)
    nfcUid: text('nfc_uid').unique(), // vestigial (NFC retired, D-026); kept for now (B-027)
    childId: uuid('child_id').references(() => children.id, { onDelete: 'set null' }),
    active: boolean('active').notNull().default(true), // deactivated on reassign (FR-6a)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tags_tenant_code_key').on(table.tenantId, table.code),
    // At most one active tag per child.
    uniqueIndex('tags_one_active_per_child')
      .on(table.childId)
      .where(sql`${table.active} = true`),
  ],
);

// ---------- pickup_persons ----------
export const pickupPersons = pgTable('pickup_persons', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- attendance_log (append-only; triggers added in E1-S4) ----------
export const attendanceLog = pgTable('attendance_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'restrict' }),
  eventDayId: uuid('event_day_id')
    .notNull()
    .references(() => eventDays.id, { onDelete: 'restrict' }),
  action: attendanceAction('action').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  // Check-out only: which authorised person collected the child.
  collectorPickupPersonId: uuid('collector_pickup_person_id').references(
    () => pickupPersons.id,
    { onDelete: 'set null' },
  ),
  collectorLabel: text('collector_label'), // snapshot, e.g. "Ikenna Nwosu (Father)"
  isOverride: boolean('is_override').notNull().default(false), // admin override (FR-11)
  overrideReason: text('override_reason'),
});

// ---------- medical_notes (append-only; triggers added in E1-S4) ----------
export const medicalNotes = pgTable('medical_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'restrict' }),
  eventDayId: uuid('event_day_id').references(() => eventDays.id, { onDelete: 'set null' }),
  severity: noteSeverity('severity').notNull(),
  noteText: text('note_text').notNull(),
  guardianNotified: boolean('guardian_notified').notNull().default(false),
  authorStaffId: uuid('author_staff_id').references(() => staff.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
