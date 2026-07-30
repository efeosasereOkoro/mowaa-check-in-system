'use server';

import { requireRole } from '@/lib/require-role';
import { lookup, type LookupResult } from '@/lib/lookup';

export async function lookupAction(_prev: LookupResult, formData: FormData): Promise<LookupResult> {
  const staff = await requireRole(['receptionist', 'admin']);
  const query = ((formData.get('q') as string) ?? '').trim();
  return lookup(staff.id, staff.role, query);
}
