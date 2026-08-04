'use client';

import { useState } from 'react';
import AddChildForm from './add-child-form';
import AddFamilyForm from './add-family-form';

// Wraps the two registration modes behind a segmented toggle: one child, or a whole family
// (guardian entered once, multiple children). Used on the Children page, its mobile sheet,
// and the dashboard register modal.
export default function RegisterForm({ sheet = false, onSuccess }: { sheet?: boolean; onSuccess?: () => void }) {
  const [mode, setMode] = useState<'child' | 'family'>('child');

  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1,
    height: 40,
    padding: '0 12px',
    background: active ? '#0F62FE' : '#fff',
    color: active ? '#fff' : '#161616',
    border: '1px solid ' + (active ? '#0F62FE' : '#E0E0E0'),
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  });

  return (
    <div style={sheet ? {} : { background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }} role="tablist" aria-label="Registration type">
        <button type="button" role="tab" aria-selected={mode === 'child'} onClick={() => setMode('child')} style={{ ...tab(mode === 'child'), borderRight: 'none' }}>
          Register a child
        </button>
        <button type="button" role="tab" aria-selected={mode === 'family'} onClick={() => setMode('family')} style={tab(mode === 'family')}>
          Register a family
        </button>
      </div>

      {/* Both forms render in `sheet` layout (no own card) — this wrapper is the card. */}
      {mode === 'child' ? <AddChildForm sheet onSuccess={onSuccess} /> : <AddFamilyForm sheet onSuccess={onSuccess} />}
    </div>
  );
}
