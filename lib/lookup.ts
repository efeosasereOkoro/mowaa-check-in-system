import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { withStaffContext } from '@/lib/db-authenticated';
import { children, tags } from '@/db/schema';
import { canSeeAddress, canSeeHealthDetails } from '@/lib/field-visibility';
import type { StaffRole } from '@/lib/staff';
import type { ChildStatus } from '@/lib/attendance';

export type ChildCard = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  tagCode: string | null;
  healthDetails?: string | null; // health + admin only
  homeAddress?: string | null; // admin only
  matchedBy: 'name' | 'tag';
  // today's attendance status (filled by the dashboard action, not lookup itself)
  status?: ChildStatus;
  inAt?: string | null;
  outAt?: string | null;
  collectorLabel?: string | null;
};

export type LookupResult = {
  matches: ChildCard[];
  note: string | null;
  eventDay: { id: string; label: string | null } | null;
};

const childCols = {
  id: children.id,
  firstName: children.firstName,
  lastName: children.lastName,
  age: children.age,
  guardianName: children.guardianName,
  guardianPhone: children.guardianPhone,
  homeAddress: children.homeAddress,
  healthDetails: children.healthDetails,
};

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
  tagCode: string | null;
};

// Server-side field-visibility projection (E3): drop fields the role may not see.
function project(role: StaffRole, r: Row, matchedBy: 'name' | 'tag'): ChildCard {
  const card: ChildCard = {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    age: r.age,
    guardianName: r.guardianName,
    guardianPhone: r.guardianPhone,
    tagCode: r.tagCode,
    matchedBy,
  };
  if (canSeeHealthDetails(role)) card.healthDetails = r.healthDetails;
  if (canSeeAddress(role)) card.homeAddress = r.homeAddress;
  return card;
}

/**
 * Find children by name OR by tag (code / NFC UID). Returns role-projected cards.
 * When nothing matches, `note` explains why (unknown / deactivated / unassigned tag).
 */
export async function lookup(staffId: string, role: StaffRole, rawQuery: string): Promise<LookupResult> {
  const query = rawQuery.trim();
  if (!query) return { matches: [], note: null, eventDay: null };

  return withStaffContext(staffId, async (tx) => {
    // 1) resolve as an ACTIVE tag (code or NFC UID)
    const activeTag = (await tx
      .select({ ...childCols, tagCode: tags.code })
      .from(tags)
      .innerJoin(children, eq(children.id, tags.childId))
      .where(and(eq(tags.active, true), or(eq(tags.code, query), eq(tags.nfcUid, query))))
      .limit(1)) as Row[];

    // 2) name search (first, last, or "first last")
    const like = `%${query}%`;
    const nameRows = (await tx
      .select({ ...childCols, tagCode: tags.code })
      .from(children)
      .leftJoin(tags, and(eq(tags.childId, children.id), eq(tags.active, true)))
      .where(
        or(
          ilike(children.firstName, like),
          ilike(children.lastName, like),
          sql`lower(${children.firstName} || ' ' || ${children.lastName}) like ${'%' + query.toLowerCase() + '%'}`,
        ),
      )
      .limit(10)) as Row[];

    const matches: ChildCard[] = [];
    const seen = new Set<string>();
    if (activeTag[0]) {
      matches.push(project(role, activeTag[0], 'tag'));
      seen.add(activeTag[0].id);
    }
    for (const r of nameRows) {
      if (!seen.has(r.id)) {
        matches.push(project(role, r, 'name'));
        seen.add(r.id);
      }
    }

    let note: string | null = null;
    if (matches.length === 0) {
      const anyTag = await tx
        .select({ active: tags.active, childId: tags.childId })
        .from(tags)
        .where(or(eq(tags.code, query), eq(tags.nfcUid, query)))
        .limit(1);
      if (anyTag[0] && !anyTag[0].active) {
        note = `Tag “${query}” was deactivated — the child likely has a replacement tag. Search by name instead.`;
      } else if (anyTag[0] && anyTag[0].active && !anyTag[0].childId) {
        note = `Tag “${query}” isn’t linked to a child yet.`;
      } else {
        note = `No child found for “${query}”.`;
      }
    }
    return { matches, note, eventDay: null };
  });
}
