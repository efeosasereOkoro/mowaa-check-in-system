'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { addChild } from '@/lib/children';

export type AddChildState = { error?: string; ok?: boolean };

export async function createChildAction(
  _prev: AddChildState,
  formData: FormData,
): Promise<AddChildState> {
  // Admin-only at the app layer; RLS also enforces it at the DB.
  const staff = await requireRole(['admin']);

  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();
  const firstName = get('firstName');
  const lastName = get('lastName');
  const guardianName = get('guardianName');
  const guardianPhone = get('guardianPhone');
  const ageRaw = get('age');

  if (!firstName || !lastName || !guardianName || !guardianPhone) {
    return { error: 'First name, last name, guardian name and guardian phone are required.' };
  }
  const age = ageRaw ? Number(ageRaw) : null;
  if (ageRaw && (!Number.isInteger(age) || (age as number) < 0 || (age as number) > 120)) {
    return { error: 'Age must be a whole number between 0 and 120.' };
  }

  await addChild(staff.id, {
    firstName,
    lastName,
    age,
    guardianName,
    guardianPhone,
    homeAddress: get('homeAddress') || null,
    healthDetails: get('healthDetails') || null,
  });

  revalidatePath('/children');
  return { ok: true };
}
