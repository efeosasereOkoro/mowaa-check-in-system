'use client';

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Shared responsive table: the full `desktop` table (>= 672px) is rendered as-is;
 * below 672px it collapses to two priority columns (primary + status) with a
 * tap-to-expand accordion detail row (one open at a time). Same narrow-detection as
 * the app shell (SSR/first render = desktop) so there's no hydration mismatch.
 *
 * Parents build `desktop` (their existing table, untouched) AND a `rows` array of
 * primary/status/detail nodes for the mobile view — one source of truth for the look
 * across every table in the app (Roster, Users, Health, Children, Reports).
 */
export type CollapsibleRow = {
  key: string;
  primary: ReactNode; // Name cell
  secondary?: ReactNode; // optional lines rendered under `primary`
  status: ReactNode; // right priority cell (status / action / short value)
  detail: ReactNode; // revealed when expanded — put "act" links/buttons here
  rowStyle?: CSSProperties; // summary <tr> extras (e.g. suspended background)
  primaryStyle?: CSSProperties; // name <td> extras (e.g. muted colour)
};

const th: CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };

export default function CollapsibleTable({
  desktop,
  rows,
  primaryHeader = 'Name',
  statusHeader = 'Status',
  statusWidth = 118,
  empty,
}: {
  desktop: ReactNode;
  rows: CollapsibleRow[];
  primaryHeader?: string;
  statusHeader?: string;
  statusWidth?: number;
  empty: string;
}) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [openId, setOpenId] = useState<string | null>(null);
  // Never leave a now-hidden row expanded (e.g. after a search filters it out).
  const effectiveOpen = rows.some((r) => r.key === openId) ? openId : null;

  if (!narrow) return <>{desktop}</>;

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', display: 'block' }}>
        <thead style={{ display: 'block' }}>
          <tr style={{ display: 'flex', alignItems: 'center', background: '#E0E0E0' }}>
            <th style={{ ...th, flex: 1, minWidth: 0 }}>{primaryHeader}</th>
            <th style={{ ...th, width: statusWidth, boxSizing: 'border-box', flex: 'none' }}>{statusHeader}</th>
            <th style={{ ...th, width: 34, flex: 'none' }} aria-hidden="true" />
          </tr>
        </thead>
        <tbody style={{ display: 'block' }}>
          {rows.length === 0 && (
            <tr style={{ display: 'block' }}>
              <td style={{ fontSize: 14, padding: '10px 12px', color: '#8D8D8D', display: 'block' }} colSpan={3}>
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const open = effectiveOpen === r.key;
            const detailId = `ct-${r.key}`;
            const toggle = () => setOpenId(open ? null : r.key);
            return (
              <Fragment key={r.key}>
                <tr
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  aria-controls={detailId}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', minHeight: 44, borderTop: '1px solid #E0E0E0', cursor: 'pointer', background: '#fff', ...r.rowStyle }}
                >
                  <td style={{ fontSize: 14, padding: '10px 12px', flex: 1, minWidth: 0, ...r.primaryStyle }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.primary}</div>
                    {r.secondary != null && <div style={{ marginTop: 3 }}>{r.secondary}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', width: statusWidth, boxSizing: 'border-box', flex: 'none', whiteSpace: 'nowrap' }}>{r.status}</td>
                  <td style={{ width: 34, flex: 'none', textAlign: 'center', fontSize: 10, color: '#525252' }}>{open ? '▲' : '▼'}</td>
                </tr>
                {open && (
                  <tr id={detailId} style={{ display: 'block', background: '#F4F4F4', borderTop: '1px solid #E0E0E0' }}>
                    <td style={{ display: 'block', padding: '4px 12px 12px' }} colSpan={3}>
                      {r.detail}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Shared detail-grid used inside expanded rows: label / value pairs. */
export function DetailGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
      {items.map((it, i) => (
        <Fragment key={i}>
          <span style={{ color: '#525252' }}>{it.label}</span>
          <span style={{ overflowWrap: 'anywhere' }}>{it.value}</span>
        </Fragment>
      ))}
    </div>
  );
}
