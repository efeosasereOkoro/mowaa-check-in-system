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

/**
 * Generate a readable, unique tag number from the child's name (e.g. "AMOK-4821")
 * and set it as the active tag — deactivating any previous one. Every child should
 * have one, so this is called at registration and by the "Generate" button. Uniqueness
 * is checked against existing codes (retry on clash); the DB unique constraint is the
 * final backstop.
 */
export async function assignGeneratedTag(
  staffId: string,
  childId: string,
  firstName: string,
  lastName: string,
): Promise<string> {
  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = (clean(firstName).slice(0, 2) + clean(lastName).slice(0, 2)) || 'CH';
  return withStaffContext(staffId, async (tx) => {
    let code = '';
    for (let i = 0; i < 25; i++) {
      const candidate = `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
      const clash = await tx.select({ c: tags.code }).from(tags).where(eq(tags.code, candidate)).limit(1);
      if (!clash[0]) {
        code = candidate;
        break;
      }
    }
    if (!code) code = `${prefix}-${Date.now().toString().slice(-6)}`;
    await tx.update(tags).set({ active: false }).where(and(eq(tags.childId, childId), eq(tags.active, true)));
    await tx.insert(tags).values({ childId, code, active: true });
    return code;
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
