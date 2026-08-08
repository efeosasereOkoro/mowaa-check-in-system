'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { updateIncidentAction, type IncidentActionState } from '../actions';

// Local status list (D-027 — client component must not import a value from a server lib).
const STATUSES: { value: string; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'escalated', label: 'Escalated to CPO' },
  { value: 'investigating', label: 'Under investigation' },
  { value: 'resolved', label: 'Resolved' },
];

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };
const area: React.CSSProperties = { width: '100%', minHeight: 64, background: '#fff', border: '1px solid #E0E0E0', padding: 10, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' };
const sel: React.CSSProperties = { height: 40, border: '1px solid #E0E0E0', background: '#fff', padding: '0 10px', fontSize: 14, appearance: 'auto', minWidth: 200 };

export default function IncidentActions({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState<IncidentActionState, FormData>(updateIncidentAction, {});
  const statusForm = useRef<HTMLFormElement>(null);
  const noteForm = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState(currentStatus);

  useEffect(() => {
    if (state.ok) {
      // The page revalidates the server data; clear the note textareas here. reset() leaves the
      // controlled status <select> untouched (React owns its value) but clears the textareas.
      statusForm.current?.reset();
      noteForm.current?.reset();
    }
  }, [state]);

  const resolving = selected === 'resolved';

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Update this case</h2>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr', maxWidth: 560 }}>
        {/* Change status (S5) + resolve/sign-off (S6) */}
        <form ref={statusForm} action={action} style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 16 }}>
          <input type="hidden" name="kind" value="status_change" />
          <input type="hidden" name="incidentId" value={incidentId} />
          <label style={label}>Change status</label>
          <select name="newStatus" value={selected} onChange={(e) => setSelected(e.target.value)} style={sel}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
                {s.value === currentStatus ? ' (current)' : ''}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 12 }}>
            <label style={label}>{resolving ? 'Resolution — required to sign off *' : 'Note (optional)'}</label>
            <textarea name="note" style={area} placeholder={resolving ? 'How the case was resolved (this is the official sign-off)' : 'Optional context for this change'} />
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{ marginTop: 12, height: 40, padding: '0 18px', background: pending ? '#C6C6C6' : resolving ? '#0E6027' : '#0F62FE', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer' }}
          >
            {pending ? 'Saving…' : resolving ? 'Resolve & sign off' : 'Save status update'}
          </button>
        </form>

        {/* Add a note */}
        <form ref={noteForm} action={action} style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 16 }}>
          <input type="hidden" name="kind" value="note" />
          <input type="hidden" name="incidentId" value={incidentId} />
          <label style={label}>Add a note (no status change)</label>
          <textarea name="note" style={area} />
          <button
            type="submit"
            disabled={pending}
            style={{ marginTop: 12, height: 40, padding: '0 18px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer' }}
          >
            {pending ? 'Saving…' : 'Add note'}
          </button>
        </form>
      </div>

      {state.error && <div style={{ marginTop: 12, color: '#DA1E28', fontSize: 13 }}>{state.error}</div>}
    </div>
  );
}
