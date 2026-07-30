'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { addChild, updateChild, deleteChild, type NewChildInput } from '@/lib/children';
import { addPickupPerson, removePickupPerson } from '@/lib/pickup-persons';

export type ChildActionState = { error?: string; ok?: boolean };

function parseChildForm(formData: FormData): { values: NewChildInput } | { error: string } {
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
  return {
    values: {
      firstName,
      lastName,
      age,
      guardianName,
      guardianPhone,
      homeAddress: get('homeAddress') || null,
      healthDetails: get('healthDetails') || null,
    },
  };
}

export async function createChildAction(
  _prev: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const staff = await requireRole(['admin']);
  const parsed = parseChildForm(formData);
  if ('error' in parsed) return parsed;

  await addChild(staff.id, parsed.values);
  revalidatePath('/children');
  return { ok: true };
}

export type PickupActionState = { error?: string; ok?: boolean };

export async function addPickupAction(
  _prev: PickupActionState,
  formData: FormData,
): Promise<PickupActionState> {
  const staff = await requireRole(['admin']);
  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();
  const childId = get('childId');
  const name = get('name');
  const relationship = get('relationship');

  if (!childId) return { error: 'Missing child.' };
  if (!name || !relationship) return { error: 'Name and relationship are required.' };

  await addPickupPerson(staff.id, childId, { name, relationship, phone: get('phone') || null });
  revalidatePath(`/children/${childId}`);
  return { ok: true };
}

// Plain form action (no useActionState): remove a pickup person.
export async function removePickupAction(formData: FormData) {
  const staff = await requireRole(['admin']);
  const id = ((formData.get('id') as string) ?? '').trim();
  const childId = ((formData.get('childId') as string) ?? '').trim();
  if (id) await removePickupPerson(staff.id, id);
  if (childId) revalidatePath(`/children/${childId}`);
}

export async function updateChildAction(
  _prev: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const staff = await requireRole(['admin']);
  const id = ((formData.get('id') as string) ?? '').trim();
  if (!id) return { error: 'Missing child id.' };

  const parsed = parseChildForm(formData);
  if ('error' in parsed) return parsed;

  await updateChild(staff.id, id, parsed.values);
  revalidatePath('/children');
  revalidatePath(`/children/${id}`);
  return { ok: true };
}

export async function deleteChildAction(
  _prev: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const staff = await requireRole(['admin']);
  const id = ((formData.get('id') as string) ?? '').trim();
  if (!id) return { error: 'Missing child id.' };

  try {
    await deleteChild(staff.id, id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/foreign key|23503/i.test(msg)) {
      return {
        error:
          'Cannot delete: this child has attendance or medical history. Records with an audit trail are kept.',
      };
    }
    return { error: 'Could not delete this child. Please try again.' };
  }
  revalidatePath('/children');
  return { ok: true };
}
