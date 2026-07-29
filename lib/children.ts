import { desc } from 'drizzle-orm';
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
