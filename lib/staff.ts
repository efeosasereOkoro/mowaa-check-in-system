import { eq, or, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { staff } from '@/db/schema';

export type StaffRecord = typeof staff.$inferSelect;
export type StaffRole = StaffRecord['role'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

export type CurrentUser = {
  authUserId: string;
  email: string;
  name: string | null;
  staff: StaffRecord | null;
  suspended: boolean; // matched a staff row, but it's deactivated → treated as no access
};

/**
 * Resolve the current Neon Auth session to a `staff` record (with role).
 *
 * Matching order: linked `auth_user_id` first, then email (case-insensitive) —
 * so an admin can pre-provision a staff row by email (invite model) before the
 * person ever logs in. On the first email match we backfill `auth_user_id` to
 * lock the link. Returns `null` when there is no active session, and
 * `{ ..., staff: null }` when the session has no matching staff row (unprovisioned).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user?.email) return null;

  const rows = await db
    .select()
    .from(staff)
    .where(
      or(eq(staff.authUserId, user.id), sql`lower(${staff.email}) = lower(${user.email})`),
    )
    .limit(1);

  let record = rows[0] ?? null;

  // Suspended → no access. Report it (root page shows a message) instead of a role.
  if (record?.deactivatedAt) {
    return { authUserId: user.id, email: user.email, name: user.name ?? null, staff: null, suspended: true };
  }

  // Backfill the auth link when matched by email for the first time.
  if (record && !record.authUserId) {
    await db.update(staff).set({ authUserId: user.id }).where(eq(staff.id, record.id));
    record = { ...record, authUserId: user.id };
  }

  return {
    authUserId: user.id,
    email: user.email,
    name: user.name ?? null,
    staff: record,
    suspended: false,
  };
}
