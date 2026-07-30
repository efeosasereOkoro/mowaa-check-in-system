'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { addMedicalNote, type Severity } from '@/lib/medical';
import { getCurrentEventDay } from '@/lib/attendance';

export type NoteState = { error?: string; ok?: boolean };

export async function addNoteAction(_prev: NoteState, formData: FormData): Promise<NoteState> {
  const staff = await requireRole(['health', 'admin']);
  const childId = ((formData.get('childId') as string) ?? '').trim();
  const severity = ((formData.get('severity') as string) ?? 'routine') as Severity;
  const noteText = ((formData.get('noteText') as string) ?? '').trim();
  const guardianNotified = formData.get('guardianNotified') === 'on';

  if (!childId) return { error: 'Missing child.' };
  if (!['routine', 'incident', 'emergency'].includes(severity)) return { error: 'Invalid severity.' };
  if (!noteText) return { error: 'Note text is required.' };

  const day = await getCurrentEventDay(staff.id);
  await addMedicalNote(staff.id, childId, {
    severity,
    noteText,
    guardianNotified,
    eventDayId: day?.id ?? null,
  });
  revalidatePath(`/health/${childId}`);
  revalidatePath('/health');
  return { ok: true };
}
