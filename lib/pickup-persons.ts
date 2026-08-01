import { asc, eq } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { pickupPersons } from '@/db/schema';

export type NewPickupInput = { name: string; relationship: string; phone: string | null };

/** List a child's authorized pickup persons (RLS-scoped). */
export async function listPickupPersons(staffId: string, childId: string) {
  return withStaffContext(staffId, (tx) =>
    tx
      .select()
      .from(pickupPersons)
      .where(eq(pickupPersons.childId, childId))
      .orderBy(asc(pickupPersons.createdAt)),
  );
}

/** Add a pickup person. RLS (`pickups_insert`) permits admins (and receptionists at checkout). */
export async function addPickupPerson(staffId: string, childId: string, input: NewPickupInput) {
  return withStaffContext(staffId, (tx) =>
    tx
      .insert(pickupPersons)
      .values({ childId, ...input })
      .returning({ id: pickupPersons.id }),
  );
}

/** Update a pickup person's details. RLS (`pickups_update`) permits admins only. */
export async function updatePickupPerson(staffId: string, id: string, input: NewPickupInput) {
  return withStaffContext(staffId, (tx) =>
    tx.update(pickupPersons).set(input).where(eq(pickupPersons.id, id)),
  );
}

/** Remove a pickup person. RLS (`pickups_delete`) permits admins only. */
export async function removePickupPerson(staffId: string, id: string) {
  return withStaffContext(staffId, (tx) =>
    tx.delete(pickupPersons).where(eq(pickupPersons.id, id)),
  );
}
