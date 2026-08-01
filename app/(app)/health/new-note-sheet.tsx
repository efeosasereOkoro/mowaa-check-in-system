'use client';

import { useActionState, useEffect, useState } from 'react';
import { addNoteAction, type NoteState } from './actions';

type Child = { id: string; name: string };

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };
const field: React.CSSProperties = { width: '100%', background: '#fff', border: '1px solid #E0E0E0', padding: '0 12px', height: 44, fontSize: 14, boxSizing: 'border-box' };

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

// Narrow-only: the sticky "New medical note" bar + a full-height sheet whose first
// field is a child picker, then severity/note. Posts to the existing addNoteAction.
export default function NewNoteSheet({ children }: { children: Child[] }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Child | null>(null);
  const [q, setQ] = useState('');
  const [state, action, pending] = useActionState<NoteState, FormData>(addNoteAction, {});

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setPicked(null);
      setQ('');
    }
  }, [state]);

  if (!narrow) return null;

  const matches = q.trim() ? children.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())) : children;

  return (
    <>
      <div style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />

      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 15, bottom: 'calc(56px + env(safe-area-inset-bottom))', padding: '6px 16px', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ width: '100%', height: 44, background: '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Plus />
          New medical note
        </button>
      </div>

      {open && (
        <div role="dialog" aria-label="New medical note" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 'none', height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>New medical note</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {!picked ? (
              <>
                <label style={label}>Choose a child</label>
                <div style={{ ...field, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
                    <circle cx="7" cy="7" r="4.5" />
                    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
                  </svg>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a child" autoFocus style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14 }} />
                </div>
                <div style={{ marginTop: 8, border: '1px solid #E0E0E0' }}>
                  {matches.length === 0 && <div style={{ padding: 12, fontSize: 13, color: '#8D8D8D' }}>No children match.</div>}
                  {matches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPicked(c)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', minHeight: 44, padding: '11px 12px', background: '#fff', border: 'none', borderTop: '1px solid #F4F4F4', fontSize: 15, cursor: 'pointer' }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <form action={action}>
                <input type="hidden" name="childId" value={picked.id} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#525252' }}>Child</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{picked.name}</div>
                  </div>
                  <button type="button" onClick={() => setPicked(null)} style={{ height: 36, padding: '0 12px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 13, cursor: 'pointer' }}>
                    Change
                  </button>
                </div>

                <label style={label}>Severity</label>
                <select name="severity" defaultValue="routine" style={{ ...field, cursor: 'pointer', marginBottom: 14 }}>
                  <option value="routine">Routine</option>
                  <option value="incident">Incident</option>
                  <option value="emergency">Emergency</option>
                </select>

                <label style={label}>Note *</label>
                <textarea name="noteText" required placeholder="Describe the observation, treatment or incident" style={{ ...field, height: 120, padding: '10px 12px', resize: 'vertical' }} />

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" name="guardianNotified" />
                  Guardian notified
                </label>

                {state.error && <div style={{ marginTop: 14, color: '#DA1E28', fontSize: 13 }}>{state.error}</div>}

                <button type="submit" disabled={pending} style={{ marginTop: 16, width: '100%', height: 44, background: pending ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer' }}>
                  {pending ? 'Saving…' : 'Save note'}
                </button>
                <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>This note becomes a permanent record and cannot be edited or deleted.</div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
