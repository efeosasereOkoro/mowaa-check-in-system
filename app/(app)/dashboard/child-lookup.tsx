'use client';

import { useActionState, useRef } from 'react';
import { lookupAction } from './actions';
import type { ChildCard, LookupResult } from '@/lib/lookup';
import TapTagButton from './tap-tag-button';

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 13 };
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '130px 1fr', padding: '8px 0', borderBottom: '1px solid #F4F4F4', fontSize: 14 };
const rowLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };

function Card({ card }: { card: ChildCard }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>
          {card.firstName} {card.lastName}
        </span>
        {card.tagCode ? (
          <span style={{ ...mono, background: '#E0E0E0', padding: '2px 8px' }}>{card.tagCode}</span>
        ) : (
          <span style={{ fontSize: 12, color: '#8D8D8D' }}>no tag</span>
        )}
        <span style={{ fontSize: 11, color: '#525252', marginLeft: 'auto' }}>
          matched by {card.matchedBy}
        </span>
      </div>
      <div style={{ marginTop: 12, borderTop: '1px solid #E0E0E0' }}>
        <div style={row}>
          <div style={rowLabel}>Age</div>
          <div>{card.age ?? '—'}</div>
        </div>
        <div style={row}>
          <div style={rowLabel}>Guardian</div>
          <div>{card.guardianName}</div>
        </div>
        <div style={row}>
          <div style={rowLabel}>Guardian phone</div>
          <div style={mono}>{card.guardianPhone}</div>
        </div>
        {card.healthDetails !== undefined && (
          <div style={row}>
            <div style={rowLabel}>Health</div>
            <div>{card.healthDetails || '—'}</div>
          </div>
        )}
        {card.homeAddress !== undefined && (
          <div style={row}>
            <div style={rowLabel}>Home address</div>
            <div>{card.homeAddress || '—'}</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 10 }}>
        Check-in / check-out buttons arrive with E6.
      </div>
    </div>
  );
}

export default function ChildLookup() {
  const [state, action, pending] = useActionState<LookupResult, FormData>(lookupAction, {
    matches: [],
    note: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onScan(uid: string) {
    if (inputRef.current) inputRef.current.value = uid;
    formRef.current?.requestSubmit();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <form
        ref={formRef}
        action={action}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <input
          ref={inputRef}
          name="q"
          autoFocus
          autoComplete="off"
          placeholder="Search by child name or tag ID"
          style={{
            flex: 1,
            minWidth: 220,
            height: 48,
            background: '#fff',
            border: 'none',
            borderBottom: '1px solid #8D8D8D',
            padding: '0 16px',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            height: 48,
            padding: '0 20px',
            background: pending ? '#C6C6C6' : '#393939',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            cursor: pending ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Searching…' : 'Search'}
        </button>
        <TapTagButton onScan={onScan} />
      </form>

      {state.note && (
        <div
          style={{
            marginTop: 14,
            background: '#EDF5FF',
            border: '1px solid #D0E2FF',
            borderLeft: '3px solid #0F62FE',
            padding: '12px 16px',
            fontSize: 14,
          }}
        >
          {state.note}
        </div>
      )}

      {state.matches.map((c) => (
        <Card key={c.id} card={c} />
      ))}
    </div>
  );
}
