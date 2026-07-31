'use client';

import { useActionState, useState } from 'react';
import { lookupAction } from './actions';
import type { LookupResult } from '@/lib/lookup';
import ScanQrButton from './scan-qr-button';
import ChildCard from './child-card';

function fd(q: string) {
  const f = new FormData();
  f.set('q', q);
  return f;
}

export default function ChildLookup({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState<LookupResult, FormData>(lookupAction, {
    matches: [],
    note: null,
    eventDay: null,
  });
  // Controlled query so a post-action refresh always re-runs the same search.
  const [query, setQuery] = useState('');

  function onScan(token: string) {
    setQuery(token);
    action(fd(token));
  }
  const refresh = () => action(fd(query));

  return (
    <div style={{ marginTop: 8 }}>
      <form action={action} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          autoComplete="off"
          placeholder="Search by child name or tag ID"
          style={{ flex: 1, minWidth: 220, height: 48, background: '#fff', border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 16px', fontSize: 14 }}
        />
        <button type="submit" disabled={pending} style={{ height: 48, padding: '0 20px', background: pending ? '#C6C6C6' : '#393939', color: '#fff', border: 'none', fontSize: 14, cursor: pending ? 'not-allowed' : 'pointer' }}>
          {pending ? 'Searching…' : 'Search'}
        </button>
        <ScanQrButton onScan={onScan} />
      </form>

      {state.eventDay === null && (state.matches.length > 0 || state.note) && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#8D8D8D' }}>
          Outside event hours — check-in / check-out is disabled.
        </div>
      )}

      {state.note && (
        <div style={{ marginTop: 14, background: '#EDF5FF', border: '1px solid #D0E2FF', borderLeft: '3px solid #0F62FE', padding: '12px 16px', fontSize: 14 }}>
          {state.note}
        </div>
      )}

      {state.matches.map((c) => (
        <ChildCard key={c.id} card={c} isAdmin={isAdmin} eventOpen={state.eventDay !== null} onRefresh={refresh} />
      ))}
    </div>
  );
}
