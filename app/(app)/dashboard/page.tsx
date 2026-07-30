import { requireRole } from '@/lib/require-role';
import ChildLookup from './child-lookup';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const staff = await requireRole(['receptionist', 'admin']);
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Attendance console</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>Dashboard</h1>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Find a child</div>
      <ChildLookup isAdmin={staff.role === 'admin'} />

      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 32 }}>
        Live counters, tag rack and activity feed come in E7; check-in / check-out in E6.
      </p>
    </div>
  );
}
