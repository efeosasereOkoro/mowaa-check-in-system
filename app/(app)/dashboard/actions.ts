'use server';

import { requireRole } from '@/lib/require-role';
import { lookup, type LookupResult } from '@/lib/lookup';
import {
  getCurrentEventDay,
  getDayStatuses,
  checkIn,
  checkOut,
  getCheckoutInfo,
  type ActionResult,
} from '@/lib/attendance';
import { addPickupPerson } from '@/lib/pickup-persons';

export async function lookupAction(_prev: LookupResult, formData: FormData): Promise<LookupResult> {
  const staff = await requireRole(['receptionist', 'admin']);
  const query = ((formData.get('q') as string) ?? '').trim();

  const result = await lookup(staff.id, staff.role, query);
  const day = await getCurrentEventDay(staff.id);
  result.eventDay = day ? { id: day.id, label: day.label } : null;

  if (day && result.matches.length) {
    const statuses = await getDayStatuses(
      staff.id,
      day.id,
      result.matches.map((m) => m.id),
    );
    result.matches = result.matches.map((m) => ({ ...m, ...statuses[m.id] }));
  }
  return result;
}

export async function checkInAction(childId: string): Promise<ActionResult> {
  const staff = await requireRole(['receptionist', 'admin']);
  return checkIn(staff.id, childId);
}

// Override is admin-only (FR-11).
export async function overrideCheckInAction(childId: string, reason: string): Promise<ActionResult> {
  const staff = await requireRole(['admin']);
  return checkIn(staff.id, childId, { override: true, reason });
}

export async function getCheckoutInfoAction(childId: string) {
  const staff = await requireRole(['receptionist', 'admin']);
  return getCheckoutInfo(staff.id, childId);
}

export async function checkOutAction(
  childId: string,
  pickupPersonId: string | null,
  label: string,
): Promise<ActionResult> {
  const staff = await requireRole(['receptionist', 'admin']);
  return checkOut(staff.id, childId, { pickupPersonId, label });
}

// Escalation (D-006): add a verified pickup person inline (RLS allows receptionist).
export async function addVerifiedPickupAction(
  childId: string,
  name: string,
  relationship: string,
): Promise<ActionResult> {
  const staff = await requireRole(['receptionist', 'admin']);
  if (!name.trim() || !relationship.trim()) return { error: 'Name and relationship are required.' };
  await addPickupPerson(staff.id, childId, {
    name: name.trim(),
    relationship: relationship.trim(),
    phone: null,
  });
  return { ok: true };
}
