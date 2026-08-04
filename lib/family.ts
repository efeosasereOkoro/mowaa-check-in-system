import { withStaffContext } from '@/lib/db-authenticated';
import { children, tags, guardians, pickupPersons } from '@/db/schema';

// Family registration (convenience fan-out): the guardian(s), pickup people and home address
// are entered ONCE and shared across every child; only name/age/health differ per child. We
// create all the children — each with its own tag, QR, and its own COPIES of the shared
// guardian/pickup rows — in ONE transaction, so a family is all-or-nothing and every child
// stays fully self-contained (reports/roster/CSV/child-detail read paths are unchanged). This
// is purely a data-entry convenience; there is no shared "family" entity in the DB.

export type FamilyGuardianInput = { name: string; relationship: string | null; phone: string | null; email: string | null };
export type FamilyPickupInput = { name: string; relationship: string; phone: string | null };
export type FamilyChildInput = { firstName: string; lastName: string; age: number | null; healthDetails: string | null };

export type FamilyInput = {
  guardians: FamilyGuardianInput[]; // [0] is the primary guardian (snapshotted onto each child)
  pickups: FamilyPickupInput[];
  homeAddress: string | null;
  children: FamilyChildInput[];
};

export type CreatedFamilyChild = { name: string; tagCode: string; qrToken: string };
export type CreateFamilyResult = { children: CreatedFamilyChild[] };

// A readable, unique tag code from the child's name, avoiding codes already used (existing +
// this family). Pure/in-memory so the whole family stays a single transaction (mirrors the
// CSV importer's generator).
function generateCode(firstName: string, lastName: string, used: Set<string>): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = clean(firstName).slice(0, 2) + clean(lastName).slice(0, 2) || 'CH';
  for (let i = 0; i < 50; i++) {
    const candidate = `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
    if (!used.has(candidate)) return candidate;
  }
  let n = 1;
  let fallback = `${prefix}-X${n}`;
  while (used.has(fallback)) fallback = `${prefix}-X${++n}`;
  return fallback;
}

/**
 * Create every child in a family in ONE transaction. RLS (`children_insert` / `tags_insert` /
 * `guardians_insert` / `pickups_insert`) permits admin + receptionist. The primary guardian is
 * snapshotted onto each child (children.guardian_*), and all guardians + pickups are copied to
 * every child. Returns each created child's name, tag code and QR token for the family email.
 */
export async function createFamily(staffId: string, input: FamilyInput): Promise<CreateFamilyResult> {
  const primary = input.guardians[0];
  return withStaffContext(staffId, async (tx) => {
    // Preload existing tag codes (RLS-scoped to this tenant) so tag generation is in-memory.
    const used = new Set((await tx.select({ code: tags.code }).from(tags)).map((r) => r.code));
    const created: CreatedFamilyChild[] = [];

    for (const c of input.children) {
      const [child] = await tx
        .insert(children)
        .values({
          firstName: c.firstName,
          lastName: c.lastName,
          age: c.age,
          guardianName: primary.name,
          guardianPhone: primary.phone ?? '',
          guardianEmail: primary.email,
          homeAddress: input.homeAddress,
          healthDetails: c.healthDetails,
        })
        .returning({ id: children.id, qrToken: children.qrToken });
      if (!child) continue;

      const code = generateCode(c.firstName, c.lastName, used);
      used.add(code);
      await tx.insert(tags).values({ childId: child.id, code, active: true });

      // All guardians (primary first), copied to this child.
      for (let i = 0; i < input.guardians.length; i++) {
        const g = input.guardians[i];
        await tx.insert(guardians).values({
          childId: child.id,
          name: g.name,
          relationship: g.relationship,
          phone: g.phone,
          email: g.email,
          isPrimary: i === 0,
        });
      }
      // All pickup people, copied to this child.
      for (const p of input.pickups) {
        await tx.insert(pickupPersons).values({
          childId: child.id,
          name: p.name,
          relationship: p.relationship,
          phone: p.phone,
        });
      }

      created.push({ name: `${c.firstName} ${c.lastName}`, tagCode: code, qrToken: child.qrToken });
    }

    return { children: created };
  });
}
