'use client';

import Link from 'next/link';
import CollapsibleTable, { DetailGrid, type CollapsibleRow } from '@/components/collapsible-table';

export type ChildRow = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  guardianName: string;
  guardianPhone: string;
  homeAddress: string | null;
  healthDetails: string | null;
  emergency: boolean;
};

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

function EmergencyDot() {
  return <span title="Emergency medical note today" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1E28', marginRight: 8 }} />;
}

export default function ChildrenTable({ children }: { children: ChildRow[] }) {
  const desktop = (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
        <thead>
          <tr style={{ background: '#E0E0E0' }}>
            <th style={th}>Name</th>
            <th style={th}>Age</th>
            <th style={th}>Guardian</th>
            <th style={th}>Phone</th>
            <th style={th}>Address</th>
            <th style={th}>Health</th>
          </tr>
        </thead>
        <tbody>
          {children.length === 0 && (
            <tr>
              <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>
                No children registered yet.
              </td>
            </tr>
          )}
          {children.map((c) => (
            <tr key={c.id}>
              <td style={td}>
                {c.emergency && <EmergencyDot />}
                <Link href={`/children/${c.id}`} style={{ color: '#0F62FE' }}>
                  {c.firstName} {c.lastName}
                </Link>
              </td>
              <td style={td}>{c.age ?? '—'}</td>
              <td style={td}>{c.guardianName}</td>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{c.guardianPhone}</td>
              <td style={{ ...td, color: '#525252' }}>{c.homeAddress ?? '—'}</td>
              <td style={{ ...td, color: '#525252' }}>{c.healthDetails ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const mobileRows: CollapsibleRow[] = children.map((c) => ({
    key: c.id,
    primary: (
      <>
        {c.emergency && <EmergencyDot />}
        {c.firstName} {c.lastName}
      </>
    ),
    status: <span style={{ fontSize: 13 }}>{c.age ?? '—'}</span>,
    detail: (
      <>
        <DetailGrid
          items={[
            { label: 'Guardian', value: c.guardianName },
            { label: 'Phone', value: <span style={{ fontFamily: 'monospace' }}>{c.guardianPhone}</span> },
            { label: 'Address', value: c.homeAddress ?? '—' },
            { label: 'Health', value: c.healthDetails ?? '—' },
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <Link href={`/children/${c.id}`} style={{ color: '#0F62FE', fontSize: 13 }}>
            Open child →
          </Link>
        </div>
      </>
    ),
  }));

  return <CollapsibleTable desktop={desktop} rows={mobileRows} statusHeader="Age" statusWidth={56} empty="No children registered yet." />;
}
