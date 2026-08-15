'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageBand } from '@/components/console';
import RegisterForm from './register-form';
import ImportChildren from './import-children';

const Plus = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);
const QrGlyph = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ flex: 'none' }}>
    <rect x="1" y="1" width="4" height="4" rx="0.5" />
    <rect x="9" y="1" width="4" height="4" rx="0.5" />
    <rect x="1" y="9" width="4" height="4" rx="0.5" />
    <rect x="9" y="9" width="2" height="2" />
    <rect x="12" y="12" width="1" height="1" />
  </svg>
);

export default function ChildrenHeader({ context }: { context: string }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <PageBand
        title="Children"
        context={context}
        actions={[
          { key: 'cards', label: 'Print QR ID cards', href: '/cards', target: '_blank', icon: QrGlyph },
          { key: 'import', label: 'Import from spreadsheet', onClick: () => setImportOpen(true) },
          { key: 'register', label: formOpen ? 'Close' : 'Register a child', icon: formOpen ? undefined : Plus, primary: true, onClick: () => setFormOpen((o) => !o) },
        ]}
      />

      {formOpen && (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderTop: '3px solid #0F62FE' }}>
          <div style={{ height: 48, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Register a child</span>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="Close" style={{ width: 32, height: 32, background: 'transparent', border: 'none', fontSize: 18, color: '#525252', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <RegisterForm
              sheet
              onSuccess={() => {
                setFormOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}

      <ImportChildren open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
