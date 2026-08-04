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
  // Set by the camera scanner (not the manual search box): a scan should check the child in.
  const isScan = formData.get('scan') === '1';

  const result = await lookup(staff.id, staff.role, query);
  const day = await getCurrentEventDay(staff.id);
  result.eventDay = day ? { id: day.id, label: day.label } : null;

  if (day && result.matches.length) {
    // Scan-to-check-in (B-053): a camera scan resolves to exactly one child by their QR tag.
    // When the event is open and the child hasn't arrived, the scan itself checks them in —
    // no extra tap. Already-in / already-out just report status; check-out stays a deliberate,
    // collector-verified action and re-check-in stays an admin override.
    if (isScan && result.matches.length === 1 && result.matches[0].matchedBy === 'tag') {
      const only = result.matches[0];
      const who = `${only.firstName} ${only.lastName}`;
      const pre = await getDayStatuses(staff.id, day.id, [only.id]);
      const st = pre[only.id]?.status ?? 'not_arrived';
      if (st === 'not_arrived') {
        const r = await checkIn(staff.id, only.id);
        result.flash = r.ok
          ? { kind: 'success', text: `Checked in ${who}.` }
          : { kind: 'error', text: r.error ?? 'Could not check in.' };
      } else if (st === 'checked_in') {
        result.flash = { kind: 'info', text: `${who} is already checked in — check them out below when leaving.` };
      } else {
        result.flash = { kind: 'info', text: `${who} was already checked out today.` };
      }
    }

    const statuses = await getDayStatuses(
      staff.id,
      day.id,
      result.matches.map((m) => m.id),
    );
    result.matches = result.matches.map((m) => ({ ...m, ...statuses[m.id] }));
  } else if (isScan && result.matches.length === 0) {
    // A scanned code that resolves to nothing — say so plainly (hide the raw token echo).
    result.flash = { kind: 'error', text: 'That QR code isn’t linked to a child.' };
    result.note = null;
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
