'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createFamilyAction, type FamilyActionState } from './actions';

const label: React.CSSProperties = { fontSize: 12, color: '#525252', marginBottom: 6, display: 'block' };

// Family registration: enter the guardian(s), pickup people and home address ONCE, then add
// each child. On submit every child is created with its own tag + QR and copies of the shared
// details (convenience fan-out — no shared "family" record in the DB).
export default function AddFamilyForm({ sheet = false, onSuccess }: { sheet?: boolean; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState<FamilyActionState, FormData>(createFamilyAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  const [guardianRows, setGuardianRows] = useState<number[]>([0]);
  const nextGuardianId = useRef(1);
  const [pickupRows, setPickupRows] = useState<number[]>([0]);
  const nextPickupId = useRef(1);
  const [childRows, setChildRows] = useState<number[]>([0, 1]); // families start with two child rows
  const nextChildId = useRef(2);

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
      setGuardianRows([0]);
      nextGuardianId.current = 1;
      setPickupRows([0]);
      nextPickupId.current = 1;
      setChildRows([0, 1]);
      nextChildId.current = 2;
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const h = sheet ? 44 : 40;
  const input: React.CSSProperties = { width: '100%', height: h, background: '#fff', border: '1px solid #E0E0E0', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 };
  const outer: React.CSSProperties = sheet ? {} : { background: '#fff', border: '1px solid #E0E0E0', padding: 20, marginBottom: 24 };
  const sectionHead: React.CSSProperties = { marginTop: 20, borderTop: '1px solid #E0E0E0', paddingTop: 16 };
  const addBtn: React.CSSProperties = { marginTop: 12, height: 32, padding: '0 12px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 13, cursor: 'pointer' };

  return (
    <form ref={formRef} action={action} style={outer}>
      {!sheet && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Register a family</div>}
      <div style={{ fontSize: 12, color: '#8D8D8D', marginBottom: 4 }}>
        Enter the guardian and pickup details once, then add each child below.
      </div>

      {/* ---------- Guardians (shared) ---------- */}
      <div style={sectionHead}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Guardians</div>
        <div style={{ fontSize: 12, color: '#8D8D8D', margin: '4px 0 12px' }}>
          The first is the primary guardian (required) and receives the check-in QR codes by email.
        </div>

        {guardianRows.map((id, i) => (
          <div key={id} style={{ marginBottom: i === guardianRows.length - 1 ? 0 : 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#0F62FE' : '#525252' }}>
                {i === 0 ? 'Primary guardian' : `Guardian ${i + 1}`}
              </span>
              {i > 0 && (
                <button type="button" onClick={() => setGuardianRows((rows) => rows.filter((r) => r !== id))} style={{ height: 24, padding: '0 8px', background: '#fff', border: '1px solid #E0E0E0', color: '#DA1E28', fontSize: 12, cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </div>
            <div style={grid}>
              <div>
                <label style={label}>Name{i === 0 ? ' *' : ''}</label>
                <input name="guardianName" placeholder="Full name" style={input} />
              </div>
              <div>
                <label style={label}>Relationship</label>
                <input name="guardianRelationship" placeholder="e.g. Mother, Father" style={input} />
              </div>
              <div>
                <label style={label}>Phone{i === 0 ? ' *' : ''}</label>
                <input name="guardianPhone" inputMode="tel" style={{ ...input, fontFamily: 'var(--font-mono, monospace)' }} />
              </div>
              <div>
                <label style={label}>Email</label>
                <input name="guardianEmail" type="email" autoComplete="off" placeholder="Optional" style={input} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setGuardianRows((rows) => [...rows, nextGuardianId.current++])} style={addBtn}>
          + Add another guardian
        </button>
      </div>

      {/* ---------- Home address (shared) ---------- */}
      <div style={{ marginTop: 14 }}>
        <label style={label}>Home address (admin-only)</label>
        <input name="homeAddress" style={input} />
      </div>

      {/* ---------- Pickup people (shared) ---------- */}
      <div style={sectionHead}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>People allowed to pick up</div>
        <div style={{ fontSize: 12, color: '#8D8D8D', margin: '4px 0 12px' }}>
          Optional — applies to every child in this family. Add as many as you need.
        </div>

        {pickupRows.map((id, i) => (
          <div key={id} style={{ ...grid, marginBottom: 10 }}>
            <div>
              {i === 0 && <label style={label}>Name</label>}
              <input name="pickupName" placeholder="Full name" style={input} />
            </div>
            <div>
              {i === 0 && <label style={label}>Relationship</label>}
              <input name="pickupRelationship" placeholder="e.g. Aunt, Driver" style={input} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                {i === 0 && <label style={label}>Phone</label>}
                <input name="pickupPhone" inputMode="tel" placeholder="Optional" style={{ ...input, fontFamily: 'var(--font-mono, monospace)' }} />
              </div>
              {pickupRows.length > 1 && (
                <button type="button" onClick={() => setPickupRows((rows) => rows.filter((r) => r !== id))} aria-label="Remove this person" title="Remove" style={{ flex: 'none', width: h, height: h, background: '#fff', border: '1px solid #E0E0E0', color: '#DA1E28', fontSize: 16, cursor: 'pointer' }}>
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setPickupRows((rows) => [...rows, nextPickupId.current++])} style={addBtn}>
          + Add another person
        </button>
      </div>

      {/* ---------- Children ---------- */}
      <div style={sectionHead}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Children</div>
        <div style={{ fontSize: 12, color: '#8D8D8D', margin: '4px 0 12px' }}>
          Add each child in the family. Every child gets their own tag and QR code.
        </div>

        {childRows.map((id, i) => (
          <div key={id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i === childRows.length - 1 ? 'none' : '1px solid #F4F4F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Child {i + 1}</span>
              {childRows.length > 1 && (
                <button type="button" onClick={() => setChildRows((rows) => rows.filter((r) => r !== id))} style={{ height: 24, padding: '0 8px', background: '#fff', border: '1px solid #E0E0E0', color: '#DA1E28', fontSize: 12, cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </div>
            <div style={grid}>
              <div>
                <label style={label}>First name *</label>
                <input name="childFirstName" style={input} />
              </div>
              <div>
                <label style={label}>Last name *</label>
                <input name="childLastName" style={input} />
              </div>
              <div>
                <label style={label}>Age</label>
                <input name="childAge" inputMode="numeric" style={input} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>Health details — allergies / conditions (health &amp; admin only)</label>
              <input name="childHealth" style={input} />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setChildRows((rows) => [...rows, nextChildId.current++])} style={addBtn}>
          + Add another child
        </button>
      </div>

      {state.error && (
        <div style={{ marginTop: 16, background: '#FFF1F1', border: '1px solid #FFB3B8', borderLeft: '3px solid #DA1E28', padding: '10px 14px', fontSize: 13 }}>
          {state.error}
        </div>
      )}
      {state.ok && (
        <div style={{ marginTop: 16, background: '#DEFBE6', border: '1px solid #A7F0BA', borderLeft: '3px solid #24A148', padding: '10px 14px', fontSize: 13 }}>
          Family registered — {state.count} {state.count === 1 ? 'child' : 'children'} added.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 16, width: sheet ? '100%' : undefined, height: sheet ? 44 : 40, padding: '0 24px', background: pending ? '#C6C6C6' : '#0F62FE', color: '#fff', border: 'none', fontSize: sheet ? 15 : 14, fontWeight: sheet ? 600 : 400, cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Registering…' : 'Register family'}
      </button>
    </form>
  );
}
