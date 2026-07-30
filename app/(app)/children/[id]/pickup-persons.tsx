'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addPickupAction, removePickupAction, type PickupActionState } from '../actions';

type Pickup = { id: string; name: string; relationship: string; phone: string | null };

const input: React.CSSProperties = {
  height: 36,
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #8D8D8D',
  padding: '0 12px',
  fontSize: 13,
};

export default function PickupPersonsSection({
  childId,
  persons,
}: {
  childId: string;
  persons: Pickup[];
}) {
  const [state, action, adding] = useActionState<PickupActionState, FormData>(addPickupAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E0E0E0', paddingTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Authorized pickup persons</div>

      {persons.length === 0 && (
        <p style={{ fontSize: 13, color: '#8D8D8D', margin: '0 0 12px' }}>None added yet.</p>
      )}

      {persons.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 0',
            borderBottom: '1px solid #F4F4F4',
            fontSize: 14,
            maxWidth: 560,
          }}
        >
          <div>
            {p.name} <span style={{ color: '#525252' }}>({p.relationship})</span>
            {p.phone ? (
              <span style={{ color: '#525252', fontFamily: 'monospace', fontSize: 13 }}>
                {' '}
                · {p.phone}
              </span>
            ) : null}
          </div>
          <form action={removePickupAction}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="childId" value={childId} />
            <button
              type="submit"
              style={{
                height: 28,
                padding: '0 10px',
                background: 'transparent',
                border: 'none',
                color: '#DA1E28',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </form>
        </div>
      ))}

      <form ref={formRef} action={action} style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <input type="hidden" name="childId" value={childId} />
        <input name="name" placeholder="Name" style={{ ...input, flex: '1.4', minWidth: 140 }} />
        <input name="relationship" placeholder="Relationship" style={{ ...input, flex: 1, minWidth: 120 }} />
        <input name="phone" placeholder="Phone (optional)" style={{ ...input, flex: 1, minWidth: 120 }} />
        <button
          type="submit"
          disabled={adding}
          style={{
            height: 36,
            padding: '0 16px',
            background: adding ? '#C6C6C6' : '#0F62FE',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            cursor: adding ? 'not-allowed' : 'pointer',
          }}
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {state.error && (
        <div style={{ marginTop: 10, color: '#DA1E28', fontSize: 13 }}>{state.error}</div>
      )}
    </div>
  );
}
