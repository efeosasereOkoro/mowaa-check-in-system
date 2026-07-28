import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

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

// ---------- staff (PRD `users`) ----------
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Links to the Neon Auth user identity; populated when auth is wired in E2.
  authUserId: text('auth_user_id').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: staffRole('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- event_days (GMT+1 admin-defined windows) ----------
export const eventDays = pgTable('event_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayNumber: integer('day_number').notNull().unique(), // 1..5
  label: text('label'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
});

// ---------- children ----------
export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  age: integer('age'),
  guardianName: text('guardian_name').notNull(),
  guardianPhone: text('guardian_phone').notNull(),
  homeAddress: text('home_address'), // admin-only visibility (enforced by RLS in E3)
  healthDetails: text('health_details'), // allergies / conditions, free text
  photoUrl: text('photo_url'), // optional; feature-flagged pending safeguarding (B-004)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- tags (Samsung SmartTag2) ----------
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // human tag number, e.g. TAG-001
    nfcUid: text('nfc_uid').unique(), // NFC hardware UID; duplicates rejected (FR-6)
    childId: uuid('child_id').references(() => children.id, { onDelete: 'set null' }),
    active: boolean('active').notNull().default(true), // deactivated on reassign (FR-6a)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // At most one active tag per child.
    uniqueIndex('tags_one_active_per_child')
      .on(table.childId)
      .where(sql`${table.active} = true`),
  ],
);

// ---------- pickup_persons ----------
export const pickupPersons = pgTable('pickup_persons', {
  id: uuid('id').primaryKey().defaultRandom(),
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
