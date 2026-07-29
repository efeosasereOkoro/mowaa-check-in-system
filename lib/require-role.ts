import { redirect } from 'next/navigation';
import { getCurrentUser, type StaffRecord, type StaffRole } from '@/lib/staff';
import { defaultHome } from '@/lib/rbac';

/**
 * Server-side guard: require a signed-in, provisioned staff member.
 * - no session   → /sign-in (middleware also enforces this)
 * - no staff row → /  (root renders "account not set up")
 */
export async function requireStaff(): Promise<StaffRecord> {
  const current = await getCurrentUser();
  if (!current) redirect('/sign-in');
  if (!current.staff) redirect('/');
  return current.staff;
}

/** Require the staff member's role to be one of `allowed`, else send them to their own home. */
export async function requireRole(allowed: StaffRole[]): Promise<StaffRecord> {
  const staff = await requireStaff();
  if (!allowed.includes(staff.role)) redirect(defaultHome(staff.role));
  return staff;
}
