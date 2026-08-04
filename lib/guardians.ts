import { asc, desc, eq } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { guardians } from '@/db/schema';

export type NewGuardianInput = {
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  isPrimary?: boolean;
};

/** A child's guardians (primary first, then by add order). RLS-scoped. */
export async function listGuardians(staffId: string, childId: string) {
  return withStaffContext(staffId, (tx) =>
    tx
      .select()
      .from(guardians)
      .where(eq(guardians.childId, childId))
      .orderBy(desc(guardians.isPrimary), asc(guardians.createdAt)),
  );
}

/** Add a guardian. RLS (`guardians_insert`) permits admin + receptionist (registration). */
export async function addGuardian(staffId: string, childId: string, input: NewGuardianInput) {
  return withStaffContext(staffId, (tx) =>
    tx
      .insert(guardians)
      .values({
        childId,
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        email: input.email,
        isPrimary: input.isPrimary ?? false,
      })
      .returning({ id: guardians.id }),
  );
}
