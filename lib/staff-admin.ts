import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { withStaffContext } from '@/lib/db-authenticated';
import { staff } from '@/db/schema';
import type { StaffRole } from '@/lib/staff';

/**
 * Admin user management (B-011 / E2) — invite model, no public sign-up (D-013).
 * An admin provisions a staff row (name, email, role) and a Neon Auth login with a
 * temporary password, then relays the credentials. On first login getCurrentUser()
 * links auth_user_id by email. Email-delivered invite links / self-set passwords wait
 * on email sending (B-011 / B-026).
 */

export type StaffStatus = 'active' | 'invited' | 'suspended';
export type StaffListItem = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
};

export async function listStaff(adminId: string): Promise<StaffListItem[]> {
  return withStaffContext(adminId, async (tx) => {
    const rows = await tx
      .select({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        authUserId: staff.authUserId,
        deactivatedAt: staff.deactivatedAt,
      })
      .from(staff)
      .orderBy(asc(staff.name));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.deactivatedAt ? 'suspended' : r.authUserId ? 'active' : 'invited',
    }));
  });
}

export type SuspendResult = { ok?: true; error?: string };

/** Suspend or reactivate a staff member. Guards against self-lockout and removing the last active admin. */
export async function setUserSuspended(adminId: string, userId: string, suspend: boolean): Promise<SuspendResult> {
  if (suspend && userId === adminId) return { error: 'You cannot suspend your own account.' };

  return withStaffContext(adminId, async (tx) => {
    const [target] = await tx
      .select({ id: staff.id, role: staff.role, deactivatedAt: staff.deactivatedAt })
      .from(staff)
      .where(eq(staff.id, userId))
      .limit(1);
    if (!target) return { error: 'User not found.' };

    if (suspend && target.role === 'admin') {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(staff)
        .where(and(eq(staff.role, 'admin'), isNull(staff.deactivatedAt), ne(staff.id, userId)));
      if (n === 0) return { error: 'This is the last active admin — provision or reactivate another admin first.' };
    }

    await tx
      .update(staff)
      .set({ deactivatedAt: suspend ? sql`now()` : null })
      .where(eq(staff.id, userId));
    return { ok: true };
  });
}

export type CreateStaffResult = { ok?: true; error?: string };

/** This app's own origin, so a server action can reach its /api/auth endpoints. */
async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

/**
 * Provision a staff member: create the Neon Auth login (temporary password) and the
 * staff row. Runs as the admin (RLS `staff_all` permits admin writes). The sign-up
 * response's Set-Cookie is intentionally ignored so the admin's own session is untouched.
 */
export async function createStaffUser(
  adminId: string,
  input: { name: string; email: string; role: StaffRole; password: string },
): Promise<CreateStaffResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const { role, password } = input;

  // Reject a duplicate staff row up front (clearer than a raw unique-violation).
  const existing = await withStaffContext(adminId, (tx) =>
    tx.select({ id: staff.id }).from(staff).where(sql`lower(${staff.email}) = ${email}`).limit(1),
  );
  if (existing[0]) return { error: 'A user with that email already exists.' };

  // Create the auth login. 200 → new identity; an "already exists" error is tolerated
  // (the person keeps their existing password; we still link the staff row by email).
  let authUserId: string | null = null;
  try {
    const res = await fetch(`${await appOrigin()}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      const data = (await res.json()) as { user?: { id?: string } };
      authUserId = data.user?.id ?? null;
    } else {
      const msg = (await res.text()).toLowerCase();
      if (!/exist|already/.test(msg)) return { error: 'Could not create the login. Please try again.' };
    }
  } catch {
    return { error: 'Could not reach the auth service. Please try again.' };
  }

  try {
    await withStaffContext(adminId, (tx) => tx.insert(staff).values({ authUserId, name, email, role }));
  } catch {
    return { error: 'The login was created but saving the staff record failed. Check the Users list before retrying.' };
  }
  return { ok: true };
}
