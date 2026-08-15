import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getHealthRoster, getRecentNotes } from '@/lib/medical';
import SeverityBadge from '@/components/severity-badge';
import { Card, CardHeader } from '@/components/console';
import HealthHeader from './health-header';
import HealthRoster from './health-roster';

export const dynamic = 'force-dynamic';

export default async function HealthDashboard() {
  const staff = await requireRole(['health', 'admin']);
  const day = await getCurrentEventDay(staff.id);
  const roster = await getHealthRoster(staff.id, day?.id ?? null);
  const recent = await getRecentNotes(staff.id, 8);
  const alerts = roster.filter((r) => r.emergencyToday).length;
  const childOptions = roster.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}` }));

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <HealthHeader context={`${roster.length} children · ${alerts} alert${alerts === 1 ? '' : 's'} today`} childOptions={childOptions} />

      <HealthRoster roster={roster} />

      <Card>
        <CardHeader title="Recent medical notes" meta="latest 8" />
        {recent.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: '#8D8D8D' }}>No medical notes yet.</div>
        ) : (
          recent.map((n) => (
            <div key={n.id} style={{ padding: '12px 16px', borderTop: '1px solid #F4F4F4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <SeverityBadge severity={n.severity} />
                <strong style={{ fontSize: 14 }}>{n.child}</strong>
                <span style={{ fontSize: 12, color: '#8D8D8D', marginLeft: 'auto' }}>{n.when}</span>
              </div>
              <div style={{ fontSize: 13, color: '#393939', marginTop: 6 }}>{n.noteText}</div>
              <div style={{ fontSize: 12, color: '#8D8D8D', marginTop: 4 }}>{n.author ?? 'Unknown'}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
