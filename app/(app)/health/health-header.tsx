'use client';

import { useState } from 'react';
import { PageBand } from '@/components/console';
import NoteSheet from './new-note-sheet';

type Child = { id: string; name: string };

const Plus = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

export default function HealthHeader({ context, childOptions }: { context: string; childOptions: Child[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageBand
        title="Health"
        context={context}
        actions={[{ key: 'add', label: 'Add medical note', icon: Plus, primary: true, onClick: () => setOpen(true) }]}
      />
      <NoteSheet childOptions={childOptions} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
