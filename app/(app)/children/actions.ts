'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { requireRole } from '@/lib/require-role';
import { addChild, updateChild, deleteChild, getChild, type NewChildInput } from '@/lib/children';
import { addPickupPerson, removePickupPerson, updatePickupPerson } from '@/lib/pickup-persons';
import { addGuardian } from '@/lib/guardians';
import { assignGeneratedTag, unassignActiveTag } from '@/lib/tags';
import { sendChildRegistrationEmail } from '@/lib/emails/child-registration';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const guardianEmail = get('guardianEmail');
  if (guardianEmail && !EMAIL_RE.test(guardianEmail)) {
    return { error: 'Enter a valid guardian email, or leave it blank.' };
  }
  return {
    values: {
      firstName,
      lastName,
      age,
      guardianName,
      guardianPhone,
      guardianEmail: guardianEmail || null,
      homeAddress: get('homeAddress') || null,
      healthDetails: get('healthDetails') || null,
    },
  };
}

export async function createChildAction(
  _prev: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  // Receptionists can register children directly, like admins (B-042).
  const staff = await requireRole(['admin', 'receptionist']);
  const parsed = parseChildForm(formData);
  if ('error' in parsed) return parsed;

  const [created] = await addChild(staff.id, parsed.values);
  // Every child gets a tag number automatically — no manual entry, none missed.
  let tagCode: string | null = null;
  if (created?.id) {
    tagCode = await assignGeneratedTag(staff.id, created.id, parsed.values.firstName, parsed.values.lastName);
  }

  // Best-effort: email the guardian a confirmation + the child's QR to show at check-in/out.
  // Registration must never fail because email is down or unconfigured.
  if (created?.id && parsed.values.guardianEmail) {
    try {
      // Public origin so the email can embed the QR inline (env override for reliability).
      const h = await headers();
      const host = h.get('x-forwarded-host') ?? h.get('host');
      const proto = h.get('x-forwarded-proto') ?? 'https';
      const appUrl = process.env.APP_URL || (host ? `${proto}://${host}` : undefined);
      await sendChildRegistrationEmail({
        to: parsed.values.guardianEmail,
        guardianName: parsed.values.guardianName,
        childName: `${parsed.values.firstName} ${parsed.values.lastName}`,
        tagCode,
        qrToken: created.qrToken,
        appUrl,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('child registration email failed', e);
    }
  }

  // Guardians (repeater) — the primary (row 0, validated above) is also stored on the child as
  // the denormalized snapshot used by reports/email/CSV; here we record the full list, each with
  // a relationship. Best-effort: the child is already registered, so a guardian hiccup must not
  // fail registration. Rows are aligned by index across the parallel getAll() arrays.
  if (created?.id) {
    const gNames = formData.getAll('guardianName').map((v) => String(v).trim());
    const gRels = formData.getAll('guardianRelationship').map((v) => String(v).trim());
    const gPhones = formData.getAll('guardianPhone').map((v) => String(v).trim());
    const gEmails = formData.getAll('guardianEmail').map((v) => String(v).trim());
    let primaryAssigned = false;
    for (let i = 0; i < gNames.length; i++) {
      if (!gNames[i]) continue; // a guardian needs at least a name
      const isPrimary = !primaryAssigned;
      primaryAssigned = true;
      try {
        await addGuardian(staff.id, created.id, {
          name: gNames[i],
          relationship: gRels[i] || null,
          phone: gPhones[i] || null,
          email: gEmails[i] && EMAIL_RE.test(gEmails[i]) ? gEmails[i] : null,
          isPrimary,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('add guardian during registration failed', e);
      }
    }
  }

  // People allowed to pick up (repeater) — insert every complete row (name + relationship).
  // A guardian may be known by more than one name, and more than one person may collect the
  // child, so this is a list. RLS lets admin + receptionist add pickups. Best-effort: the
  // child is already registered, so a pickup hiccup must not fail the registration.
  if (created?.id) {
    const names = formData.getAll('pickupName').map((v) => String(v).trim());
    const rels = formData.getAll('pickupRelationship').map((v) => String(v).trim());
    const phones = formData.getAll('pickupPhone').map((v) => String(v).trim());
    for (let i = 0; i < names.length; i++) {
      if (names[i] && rels[i]) {
        try {
          await addPickupPerson(staff.id, created.id, { name: names[i], relationship: rels[i], phone: phones[i] || null });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('add pickup during registration failed', e);
        }
      }
    }
  }

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

// Edit an existing pickup person's details.
export async function editPickupAction(_prev: PickupActionState, formData: FormData): Promise<PickupActionState> {
  const staff = await requireRole(['admin']);
  const get = (k: string) => ((formData.get(k) as string) ?? '').trim();
  const id = get('id');
  const childId = get('childId');
  const name = get('name');
  const relationship = get('relationship');

  if (!id) return { error: 'Missing pickup person.' };
  if (!name || !relationship) return { error: 'Name and relationship are required.' };

  await updatePickupPerson(staff.id, id, { name, relationship, phone: get('phone') || null });
  if (childId) revalidatePath(`/children/${childId}`);
  return { ok: true };
}

export type TagActionState = { error?: string; ok?: boolean };

// Generate a fresh unique tag number for the child (auto — no manual entry).
export async function generateTagAction(
  _prev: TagActionState,
  formData: FormData,
): Promise<TagActionState> {
  const staff = await requireRole(['admin']);
  const childId = ((formData.get('childId') as string) ?? '').trim();
  if (!childId) return { error: 'Missing child.' };

  try {
    const child = await getChild(staff.id, childId);
    if (!child) return { error: 'Child not found.' };
    await assignGeneratedTag(staff.id, childId, child.firstName, child.lastName);
  } catch {
    return { error: 'Could not generate a tag. Please try again.' };
  }
  revalidatePath(`/children/${childId}`);
  return { ok: true };
}

// Plain form action: unassign (deactivate) the child's active tag.
export async function unassignTagAction(formData: FormData) {
  const staff = await requireRole(['admin']);
  const childId = ((formData.get('childId') as string) ?? '').trim();
  if (childId) {
    await unassignActiveTag(staff.id, childId);
    revalidatePath(`/children/${childId}`);
  }
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
