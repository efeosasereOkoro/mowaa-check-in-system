'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { createStaffUser } from '@/lib/staff-admin';
import type { StaffRole } from '@/lib/staff';

export type UserActionState = { error?: string; ok?: boolean; createdName?: string };

const ROLES: StaffRole[] = ['admin', 'receptionist', 'health'];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteUserAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const admin = await requireRole(['admin']);
  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();

  const name = get('name');
  const email = get('email');
  const role = get('role') as StaffRole;
  const password = (formData.get('password') as string) ?? '';

  if (!name) return { error: 'Name is required.' };
  if (!emailRe.test(email)) return { error: 'Enter a valid email address.' };
  if (!ROLES.includes(role)) return { error: 'Choose a role.' };
  if (password.length < 8) return { error: 'Temporary password must be at least 8 characters.' };

  const result = await createStaffUser(admin.id, { name, email, role, password });
  if (result.error) return { error: result.error };

  revalidatePath('/users');
  return { ok: true, createdName: name };
}
