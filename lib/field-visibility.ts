import type { StaffRole } from '@/lib/staff';

/**
 * SINGLE SOURCE OF TRUTH for child field visibility (FR-8, the heart of the spec).
 *
 * Row-level access is enforced by RLS (E2-S3); this module enforces COLUMN-level
 * visibility server-side — the server never sends a hidden field to the client
 * (not merely hidden in the UI). Every child-data read for display MUST go through
 * `projectChild` (server) and/or the `children_card` masked view (database).
 *
 * Visibility:
 *  - Base fields (name, age, guardian name/phone, photo) → all staff
 *  - health_details (allergies/conditions) → Health Officer + Admin
 *  - home_address → Admin only
 *  - SmartThings Find link → Admin only
 *  - medical_notes (separate table) → Health Officer + Admin (already DB-enforced by RLS)
 */

/** Admin-only external link (per the approved prototype). */
export const SMARTTHINGS_FIND_URL = 'https://smartthingsfind.samsung.com';

export function canSeeHealthDetails(role: StaffRole): boolean {
  return role === 'admin' || role === 'health';
}
export function canSeeAddress(role: StaffRole): boolean {
  return role === 'admin';
}
export function canSeeSmartThingsLink(role: StaffRole): boolean {
  return role === 'admin';
}

/** Fields every staff role may see. */
export type ChildBase = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  photoUrl: string | null;
};

/** Role-gated fields. */
export type ChildSensitive = {
  healthDetails: string | null;
  homeAddress: string | null;
};

export type ChildFull = ChildBase & ChildSensitive;
export type VisibleChild = ChildBase & Partial<ChildSensitive>;

/**
 * Project a full child record down to only the fields `role` may see.
 * Sensitive fields are OMITTED (not nulled) when disallowed, so they never leave
 * the server for that role.
 */
export function projectChild(role: StaffRole, child: ChildFull): VisibleChild {
  const visible: VisibleChild = {
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    age: child.age,
    guardianName: child.guardianName,
    guardianPhone: child.guardianPhone,
    photoUrl: child.photoUrl,
  };
  if (canSeeHealthDetails(role)) visible.healthDetails = child.healthDetails;
  if (canSeeAddress(role)) visible.homeAddress = child.homeAddress;
  return visible;
}

export function projectChildren(role: StaffRole, children: ChildFull[]): VisibleChild[] {
  return children.map((c) => projectChild(role, c));
}
