'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addNoteAction, type NoteState } from '../actions';

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };
const field: React.CSSProperties = { width: '100%', background: '#fff', border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', height: 40, fontSize: 14 };

export default function AddNoteForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState<NoteState, FormData>(addNoteAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 }}>
      <input type="hidden" name="childId" value={childId} />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add medical note</div>

      <label style={label}>Severity</label>
      <select name="severity" defaultValue="routine" style={{ ...field, cursor: 'pointer', marginBottom: 14 }}>
        <option value="routine">Routine</option>
        <option value="incident">Incident</option>
        <option value="emergency">Emergency</option>
      </select>

      <label style={label}>Note *</label>
      <textarea
        name="noteText"
        required
        placeholder="Describe the observation, treatment or incident"
        style={{ ...field, height: 90, padding: '10px 12px', resize: 'vertical' }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" name="guardianNotified" />
        Guardian notified
      </label>

      {state.error && <div style={{ marginTop: 14, color: '#DA1E28', fontSize: 13 }}>{state.error}</div>}
      {state.ok && <div style={{ marginTop: 14, color: '#0E6027', fontSize: 13 }}>Note saved.</div>}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 16, height: 40, padding: '0 24px', background: pending ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Saving…' : 'Save note'}
      </button>
      <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        This note becomes a permanent record and cannot be edited or deleted.
      </div>
    </form>
  );
}
