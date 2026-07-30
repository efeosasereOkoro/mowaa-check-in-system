import { and, desc, eq } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { tags } from '@/db/schema';

export type NewTagInput = { code: string; nfcUid: string | null };

/** All tags ever assigned to a child (active + inactive history), newest first. */
export async function listTagsForChild(staffId: string, childId: string) {
  return withStaffContext(staffId, (tx) =>
    tx.select().from(tags).where(eq(tags.childId, childId)).orderBy(desc(tags.createdAt)),
  );
}

/**
 * Set the child's active tag: deactivate any current active tag, then insert the
 * new one (atomic — covers both first-assignment and replacement, E4-S4/S5).
 * Old tag rows are kept as inactive history. Duplicate code/NFC UID throw a unique
 * violation, which rolls back the whole transaction (old tag stays active).
 */
export async function setActiveTag(staffId: string, childId: string, input: NewTagInput) {
  return withStaffContext(staffId, async (tx) => {
    await tx
      .update(tags)
      .set({ active: false })
      .where(and(eq(tags.childId, childId), eq(tags.active, true)));
    return tx
      .insert(tags)
      .values({ childId, code: input.code, nfcUid: input.nfcUid, active: true })
      .returning({ id: tags.id });
  });
}

/** Deactivate the child's active tag without assigning a new one. */
export async function unassignActiveTag(staffId: string, childId: string) {
  return withStaffContext(staffId, (tx) =>
    tx
      .update(tags)
      .set({ active: false })
      .where(and(eq(tags.childId, childId), eq(tags.active, true))),
  );
}
