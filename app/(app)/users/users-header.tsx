'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageBand } from '@/components/console';
import AddUserForm from './add-user-form';

const Plus = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

export default function UsersHeader({ context }: { context: string }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PageBand
        title="Users"
        context={context}
        actions={[{ key: 'add', label: formOpen ? 'Close' : 'Add user', icon: formOpen ? undefined : Plus, primary: true, onClick: () => setFormOpen((o) => !o) }]}
      />

      {formOpen && (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderTop: '3px solid #0F62FE' }}>
          <div style={{ height: 48, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Add user</span>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Close" style={{ width: 32, height: 32, background: 'transparent', border: 'none', fontSize: 18, color: '#525252', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <AddUserForm
              sheet
              onSuccess={() => {
                setFormOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
