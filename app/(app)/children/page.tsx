import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import AddChildForm from './add-child-form';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0' };

export default async function ChildrenPage() {
  const staff = await requireRole(['admin']);
  const kids = await listChildren(staff.id);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Register</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 24px' }}>Children</h1>

      <AddChildForm />

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
            {kids.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={6}>
                  No children registered yet.
                </td>
              </tr>
            )}
            {kids.map((c) => (
              <tr key={c.id}>
                <td style={td}>
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
      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        {kids.length} registered. Edit/delete, pickup persons, tags and photo come next (E4-S2…S6).
      </p>
    </div>
  );
}
