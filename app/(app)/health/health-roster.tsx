'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { HealthRosterRow } from '@/lib/medical';
import type { ChildStatus } from '@/lib/attendance';

const statusLabel: Record<ChildStatus, string> = {
  checked_in: 'On-site',
  checked_out: 'Checked out',
  not_arrived: 'Not arrived',
};
const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', verticalAlign: 'top' };

export default function HealthRoster({ roster }: { roster: HealthRosterRow[] }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return roster;
    return roster.filter(
      (r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(ql) || (r.tagCode?.toLowerCase().includes(ql) ?? false),
    );
  }, [roster, q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or tag"
        style={{ width: '100%', maxWidth: 360, height: 40, border: 'none', borderBottom: '1px solid #8D8D8D', padding: '0 12px', fontSize: 14, marginBottom: 12 }}
      />
      <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              <th style={th}>Name</th>
              <th style={th}>Tag</th>
              <th style={th}>Status</th>
              <th style={th}>Allergies / conditions</th>
              <th style={th}>Last note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td style={{ ...td, color: '#8D8D8D' }} colSpan={5}>No children match.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>
                  {r.emergencyToday && (
                    <span title="Emergency note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />
                  )}
                  <Link href={`/health/${r.id}`} style={{ color: '#0F62FE' }}>
                    {r.firstName} {r.lastName}
                  </Link>
                </td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{r.tagCode ?? '—'}</td>
                <td style={td}>{statusLabel[r.status]}</td>
                <td style={{ ...td, color: '#525252', maxWidth: 260 }}>{r.healthDetails || '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#525252' }}>
                  {r.lastNote ? `${r.lastNote.severity} · ${r.lastNote.when}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
