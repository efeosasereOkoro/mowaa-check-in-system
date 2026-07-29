import { desc, eq, sql } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { children } from '@/db/schema';

export type NewChildInput = {
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
};

/** List children for the register (admin). Runs RLS-scoped as the given staff member. */
export async function listChildren(staffId: string) {
  return withStaffContext(staffId, (tx) =>
    tx.select().from(children).orderBy(desc(children.createdAt)),
  );
}

/** Insert a child. RLS (`children_insert`) permits this only for admins. */
export async function addChild(staffId: string, input: NewChildInput) {
  return withStaffContext(staffId, (tx) =>
    tx.insert(children).values(input).returning({ id: children.id }),
  );
}

/** Fetch one child by id (RLS-scoped). */
export async function getChild(staffId: string, id: string) {
  const rows = await withStaffContext(staffId, (tx) =>
    tx.select().from(children).where(eq(children.id, id)).limit(1),
  );
  return rows[0] ?? null;
}

/** Update a child. RLS (`children_update`) permits this only for admins. */
export async function updateChild(staffId: string, id: string, input: NewChildInput) {
  return withStaffContext(staffId, (tx) =>
    tx
      .update(children)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(children.id, id)),
  );
}

/**
 * Delete a child. RLS (`children_delete`) permits this only for admins.
 * Throws a FK error if the child has attendance/medical history (ON DELETE RESTRICT) —
 * callers surface that as "can't delete a child with an audit trail".
 */
export async function deleteChild(staffId: string, id: string) {
  return withStaffContext(staffId, (tx) => tx.delete(children).where(eq(children.id, id)));
}
