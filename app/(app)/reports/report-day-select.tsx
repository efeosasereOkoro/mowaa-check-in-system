'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type DayOption = { value: string; label: string };

// Reports day picker — same shape as the dashboard's: a ‹ › stepper plus a picker.
// Narrow uses a full-height list sheet; desktop uses a dropdown. Navigates via router.
export default function ReportDaySelect({ options, value }: { options: DayOption[]; value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || narrow) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
  }, [open, narrow]);

  const go = (v: string) => {
    setOpen(false);
    startTransition(() => router.push(`/reports?day=${v}`));
  };

  const dayOptions = options.filter((o) => o.value !== 'all');
  const idx = dayOptions.findIndex((o) => o.value === value);
  const prev = idx > 0 ? dayOptions[idx - 1] : null;
  const next = idx >= 0 && idx < dayOptions.length - 1 ? dayOptions[idx + 1] : null;
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  const navCell = (to: DayOption | null, glyph: string, size: number, sharedLeft: boolean) => {
    const enabled = !!to && !pending;
    return (
      <button
        type="button"
        disabled={!enabled}
        onClick={to ? () => go(to.value) : undefined}
        aria-label={glyph === '‹' ? 'Previous day' : 'Next day'}
        style={{
          width: size,
          height: size,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          border: '1px solid #E0E0E0',
          ...(sharedLeft ? { borderLeft: 'none' } : {}),
          color: to ? '#161616' : '#A8A8A8',
          fontSize: 18,
          cursor: enabled ? 'pointer' : 'default',
        }}
      >
        {glyph}
      </button>
    );
  };

  const list = (
    <>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => go(o.value)}
          style={{ display: 'block', width: '100%', textAlign: 'left', minHeight: 44, padding: '11px 14px', background: o.value === value ? '#E8E8E8' : '#fff', border: 'none', borderTop: '1px solid #F4F4F4', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {o.label}
        </button>
      ))}
    </>
  );

  if (narrow) {
    return (
      <>
        <div style={{ display: 'flex', gap: 8 }}>
          {navCell(prev, '‹', 44, false)}
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ flex: 1, minWidth: 0, height: 44, background: '#fff', border: '1px solid #E0E0E0', padding: '0 12px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLabel}</span>
            <span style={{ fontSize: 9, flex: 'none' }}>▾</span>
          </button>
          {navCell(next, '›', 44, false)}
        </div>
        {open && (
          <div role="dialog" aria-label="Select day" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 'none', height: 56, borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Select day</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ width: 44, height: 44, background: 'transparent', border: 'none', fontSize: 22, color: '#525252', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>{list}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={ref} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', flex: 'none' }}>
        {navCell(prev, '‹', 40, false)}
        {navCell(next, '›', 40, true)}
      </div>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ height: 40, padding: '0 12px', background: '#fff', border: '1px solid #E0E0E0', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {currentLabel} <span style={{ fontSize: 9 }}>▾</span>
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, minWidth: 220, zIndex: 50, background: '#fff', border: '1px solid #E0E0E0', maxHeight: 320, overflowY: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
            {list}
          </div>
        )}
      </div>
    </div>
  );
}
