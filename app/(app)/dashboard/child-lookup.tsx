'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { lookupAction } from './actions';
import type { LookupResult } from '@/lib/lookup';
import ScanQrButton from './scan-qr-button';
import ChildCard from './child-card';

function fd(q: string) {
  const f = new FormData();
  f.set('q', q);
  return f;
}

const Magnifier = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8D8D8D" strokeWidth={1.7} style={{ flex: 'none' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);
const Plus = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ flex: 'none' }}>
    <line x1="7.5" y1="3" x2="7.5" y2="12" />
    <line x1="3" y1="7.5" x2="12" y2="7.5" />
  </svg>
);

export default function ChildLookup({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState<LookupResult, FormData>(lookupAction, {
    matches: [],
    note: null,
    eventDay: null,
  });
  // Controlled query so a post-action refresh always re-runs the same search.
  const [query, setQuery] = useState('');

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function onScan(token: string) {
    setQuery(token);
    action(fd(token));
  }
  const refresh = () => action(fd(query));

  return (
    <div style={{ marginTop: narrow ? 0 : 8 }}>
      {narrow ? (
        <form action={action} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0, height: 44, background: '#fff', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
            <Magnifier />
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Search name or tag"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, textOverflow: 'ellipsis' }}
            />
          </div>
          {isAdmin && (
            <Link
              href="/children"
              style={{ flex: 'none', height: 44, padding: '0 12px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Plus />
              Register
            </Link>
          )}
        </form>
      ) : (
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
      )}

      {state.eventDay === null && (state.matches.length > 0 || state.note) && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#8D8D8D' }}>Outside event hours — check-in / check-out is disabled.</div>
      )}

      {state.note && (
        <div style={{ marginTop: 14, background: '#EDF5FF', border: '1px solid #D0E2FF', borderLeft: '3px solid #0F62FE', padding: '12px 16px', fontSize: 14 }}>
          {state.note}
        </div>
      )}

      {state.matches.map((c) => (
        <ChildCard key={c.id} card={c} isAdmin={isAdmin} eventOpen={state.eventDay !== null} onRefresh={refresh} />
      ))}

      {narrow && (
        <div
          style={{ position: 'fixed', left: 0, right: 0, zIndex: 15, bottom: 'calc(56px + env(safe-area-inset-bottom))', padding: '6px 16px', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}
        >
          <ScanQrButton onScan={onScan} variant="bar" label="Scan QR to check in" />
        </div>
      )}
    </div>
  );
}
