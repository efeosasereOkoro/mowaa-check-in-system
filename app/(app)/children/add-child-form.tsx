'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createChildAction, type ChildActionState } from './actions';

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };

export default function AddChildForm({ sheet = false, onSuccess }: { sheet?: boolean; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState<ChildActionState, FormData>(createChildAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const h = sheet ? 44 : 40;
  const input: React.CSSProperties = { width: '100%', height: h, background: '#fff', border: '1px solid #E0E0E0', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 };
  const outer: React.CSSProperties = sheet ? {} : { background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 };

  return (
    <form ref={formRef} action={action} style={outer}>
      {!sheet && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add child</div>}

      <div style={grid}>
        <div>
          <label style={label}>First name *</label>
          <input name="firstName" style={input} />
        </div>
        <div>
          <label style={label}>Last name *</label>
          <input name="lastName" style={input} />
        </div>
        <div>
          <label style={label}>Age</label>
          <input name="age" inputMode="numeric" style={input} />
        </div>
      </div>

      <div style={{ ...grid, marginTop: 14 }}>
        <div>
          <label style={label}>Guardian name *</label>
          <input name="guardianName" style={input} />
        </div>
        <div>
          <label style={label}>Guardian phone *</label>
          <input name="guardianPhone" style={{ ...input, fontFamily: 'var(--font-mono, monospace)' }} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={label}>Home address (admin-only)</label>
        <input name="homeAddress" style={input} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={label}>Health details — allergies / conditions (health &amp; admin only)</label>
        <input name="healthDetails" style={input} />
      </div>

      {state.error && (
        <div style={{ marginTop: 16, background: '#FFF1F1', border: '1px solid #FFB3B8', borderLeft: '3px solid #DA1E28', padding: '10px 14px', fontSize: 13 }}>
          {state.error}
        </div>
      )}
      {state.ok && (
        <div style={{ marginTop: 16, background: '#DEFBE6', border: '1px solid #A7F0BA', borderLeft: '3px solid #24A148', padding: '10px 14px', fontSize: 13 }}>
          Child added.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 16, width: sheet ? '100%' : undefined, height: sheet ? 44 : 40, padding: '0 24px', background: pending ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: sheet ? 15 : 14, fontWeight: sheet ? 600 : 400, cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Adding…' : 'Add child'}
      </button>
    </form>
  );
}
