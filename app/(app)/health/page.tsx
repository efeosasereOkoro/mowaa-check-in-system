import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getHealthRoster, getRecentNotes } from '@/lib/medical';
import SeverityBadge from '@/components/severity-badge';
import HealthRoster from './health-roster';

export const dynamic = 'force-dynamic';

export default async function HealthDashboard() {
  const staff = await requireRole(['health', 'admin']);
  const day = await getCurrentEventDay(staff.id);
  const roster = await getHealthRoster(staff.id, day?.id ?? null);
  const recent = await getRecentNotes(staff.id, 8);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Health desk</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>Health</h1>

      <HealthRoster roster={roster} />

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
    </div>
  );
}
