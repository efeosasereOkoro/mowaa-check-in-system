import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getHealthRoster, getRecentNotes } from '@/lib/medical';
import SeverityBadge from '@/components/severity-badge';
import { MobileOnly, DesktopOnly } from '@/components/viewport';
import HealthRoster from './health-roster';
import NewNoteSheet from './new-note-sheet';

export const dynamic = 'force-dynamic';

export default async function HealthDashboard() {
  const staff = await requireRole(['health', 'admin']);
  const day = await getCurrentEventDay(staff.id);
  const roster = await getHealthRoster(staff.id, day?.id ?? null);
  const recent = await getRecentNotes(staff.id, 8);

  return (
    <div style={{ maxWidth: 1000 }}>
      <MobileOnly>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>Health</div>
          <div style={{ fontSize: 13, color: '#525252', marginTop: 2 }}>{roster.length} children · today</div>
        </div>
      </MobileOnly>
      <DesktopOnly>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>Health</h1>
      </DesktopOnly>

      <HealthRoster roster={roster} />

      {/* Recent medical notes */}
      <MobileOnly>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '28px 0 12px' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Recent medical notes</span>
          <span style={{ fontSize: 13, color: '#525252' }}>latest 8</span>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          {recent.length === 0 && <div style={{ padding: 12, fontSize: 13, color: '#8D8D8D' }}>No medical notes yet.</div>}
          {recent.map((n) => (
            <div key={n.id} style={{ padding: 12, borderTop: '1px solid #F4F4F4' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{n.child}</div>
              <div style={{ fontSize: 12, color: '#525252', marginTop: 2 }}>
                <SeverityBadge severity={n.severity} /> · {n.when} · {n.author ?? 'Unknown'}
              </div>
              <div style={{ fontSize: 14, color: '#161616', marginTop: 6 }}>{n.noteText}</div>
            </div>
          ))}
          {recent.length > 0 && (
            <div style={{ padding: 12, borderTop: '1px solid #F4F4F4' }}>
              <Link href="/health" style={{ fontSize: 13, color: '#0F62FE' }}>
                View all notes →
              </Link>
            </div>
          )}
        </div>
      </MobileOnly>
      <DesktopOnly>
        <div style={{ fontSize: 14, fontWeight: 600, margin: '28px 0 12px' }}>Recent medical notes</div>
        <div style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
          {recent.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#8D8D8D' }}>No medical notes yet.</div>}
          {recent.map((n) => (
            <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F4F4F4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <SeverityBadge severity={n.severity} />
                <strong style={{ fontSize: 14 }}>{n.child}</strong>
                <span style={{ fontSize: 12, color: '#8D8D8D', marginLeft: 'auto' }}>{n.when}</span>
              </div>
              <div style={{ fontSize: 13, color: '#393939', marginTop: 6 }}>{n.noteText}</div>
              <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 4 }}>{n.author ?? 'Unknown'}</div>
            </div>
          ))}
        </div>
      </DesktopOnly>

      <NewNoteSheet children={roster.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}` }))} />
    </div>
  );
}
