'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export type DayItem = {
  id: string;
  dayNumber: number;
  short: string; // "Day 3"
  long: string; // "Thursday 6 August 2026"
  shortDate: string; // "Wed 1 Jul 2026" (narrow day-line subtitle)
  full: string; // "Day 3 — 6 Aug 2026" (dropdown + mobile button)
  isCurrent: boolean;
};

const CARET = '▾';

const noticeBox: React.CSSProperties = {
  marginBottom: 16,
  background: '#EDF5FF',
  border: '1px solid #D0E2FF',
  borderLeft: '3px solid #0F62FE',
  padding: '10px 14px',
  fontSize: 13,
};

function cellStyle(size: number, sharedLeft: boolean, enabled: boolean): React.CSSProperties {
  return {
    width: size,
    height: size,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    border: '1px solid #161616',
    ...(sharedLeft ? { borderLeft: 'none' } : {}),
    color: enabled ? '#161616' : '#C6C6C6',
    fontSize: 18,
    textDecoration: 'none',
    cursor: enabled ? 'pointer' : 'default',
  };
}

export default function DayPicker({ items, selectedId, registered, register }: { items: DayItem[]; selectedId: string; registered: number; register: ReactNode }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const idx = Math.max(0, items.findIndex((i) => i.id === selectedId));
  const selected = items[idx];
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx < items.length - 1 ? items[idx + 1] : null;
  const current = items.find((i) => i.isCurrent) ?? null;
  const isCurrent = !!selected?.isCurrent;

  if (!selected) return null;

  const panel = (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 2px)',
        left: 0,
        minWidth: 240,
        zIndex: 50,
        background: '#fff',
        border: '1px solid #E0E0E0',
        maxHeight: 320,
        overflowY: 'auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      }}
    >
      {items.map((i) => (
        <Link
          key={i.id}
          href={`/dashboard?day=${i.id}`}
          onClick={() => setOpen(false)}
          style={{
            display: 'block',
            padding: '10px 14px',
            fontSize: 13,
            textDecoration: 'none',
            color: '#161616',
            whiteSpace: 'nowrap',
            background: i.id === selectedId ? '#E8E8E8' : '#fff',
          }}
        >
          {i.full}
          {i.isCurrent ? ' · today' : ''}
        </Link>
      ))}
    </div>
  );

  const step = (to: DayItem | null, glyph: string, size: number, sharedLeft: boolean) =>
    to ? (
      <Link href={`/dashboard?day=${to.id}`} style={cellStyle(size, sharedLeft, true)} aria-label={glyph === '‹' ? 'Previous day' : 'Next day'}>
        {glyph}
      </Link>
    ) : (
      <span style={cellStyle(size, sharedLeft, false)}>{glyph}</span>
    );

  if (narrow) {
    // Compact one-row day line: day name + short date on the left, a 44px stepper on
    // the right. No dropdown (it only restated the title). Go-to-today + notice stay
    // below when you're viewing another day.
    const navCell = (to: DayItem | null, glyph: string, sharedLeft: boolean) => {
      const enabled = !!to;
      const style: React.CSSProperties = {
        width: 44,
        height: 44,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        border: '1px solid #E0E0E0',
        ...(sharedLeft ? { borderLeft: 'none' } : {}),
        color: enabled ? '#161616' : '#A8A8A8',
        fontSize: 18,
        textDecoration: 'none',
        cursor: enabled ? 'pointer' : 'default',
      };
      return enabled ? (
        <Link href={`/dashboard?day=${to!.id}`} style={style} aria-label={glyph === '‹' ? 'Previous day' : 'Next day'}>
          {glyph}
        </Link>
      ) : (
        <span style={style} aria-disabled="true">
          {glyph}
        </span>
      );
    };

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.short}
            </div>
            <div style={{ fontSize: 13, color: '#525252' }}>
              {selected.shortDate}
              {isCurrent ? ' · today' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flex: 'none' }}>
            {navCell(prev, '‹', false)}
            {navCell(next, '›', true)}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>{register}</div>

        {!isCurrent && current && (
          <Link href={`/dashboard?day=${current.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 44, background: '#0F62FE', color: '#fff', fontSize: 14, textDecoration: 'none', marginBottom: 12 }}>
            Go to today
          </Link>
        )}
        {!isCurrent && <div style={noticeBox}>Check-in / check-out is only available on the current day.</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>{selected.short}</h1>
        <div style={{ fontSize: 15, color: '#525252' }}>
          {selected.long} · {registered} registered
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flex: 'none' }}>
            {step(prev, '‹', 40, false)}
            {step(next, '›', 40, true)}
          </div>
          <div ref={ddRef} style={{ position: 'relative', flex: 'none' }}>
            <button
              onClick={() => setOpen((o) => !o)}
              style={{ height: 40, padding: '0 12px', background: '#fff', border: '1px solid #161616', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              All days <span style={{ fontSize: 10 }}>{CARET}</span>
            </button>
            {open && panel}
          </div>
          {!isCurrent && current && (
            <Link href={`/dashboard?day=${current.id}`} style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 14px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 14, textDecoration: 'none', flex: 'none' }}>
              Go to today
            </Link>
          )}
          {register}
        </div>
      </div>
      {!isCurrent && (
        <div style={{ ...noticeBox, marginTop: 16, marginBottom: 0 }}>
          Viewing <strong>{selected.full}</strong> — check-in / check-out is only available on the current day.
        </div>
      )}
    </div>
  );
}
