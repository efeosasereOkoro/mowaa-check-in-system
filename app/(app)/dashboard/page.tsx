import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList, getDayRoster, type Counters } from '@/lib/dashboard';
import { Card, CardHeader } from '@/components/console';
import ChildLookup from './child-lookup';
import Roster from './roster';
import DayPicker, { type DayItem } from './day-picker';
import DesktopOnly from './desktop-only';
import RegisterChildButton from './register-child-button';

export const dynamic = 'force-dynamic';

const tile: React.CSSProperties = { flex: '1 1 150px', background: '#fff', border: '1px solid #E0E0E0', padding: 16 };
const tileLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };
const tileNum: React.CSSProperties = { fontSize: 32, fontWeight: 300, marginTop: 4 };

const emptyCounters: Counters = { total: 0, checkedIn: 0, checkedOut: 0, notArrived: 0 };

function longDate(startsAt: Date): string {
  return new Date(startsAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}

function shortDate(startsAt: Date): string {
  return new Date(startsAt)
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })
    .replace(/,/g, '');
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const staff = await requireRole(['receptionist', 'admin']);
  const { day: dayParam } = await searchParams;

  const days = await getEventDaysList(staff.id);
  const current = await getCurrentEventDay(staff.id);
  const selectedId = dayParam && days.some((d) => d.id === dayParam) ? dayParam : current?.id ?? days[0]?.id ?? null;
  const isCurrent = !!current && current.id === selectedId;

  const { counters, roster } = selectedId ? await getDayRoster(staff.id, selectedId) : { counters: emptyCounters, roster: [] };

  const dayItems: DayItem[] = days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    short: d.dayNumber === 0 ? d.label ?? `Day ${d.dayNumber}` : `Day ${d.dayNumber}`,
    long: longDate(d.startsAt),
    shortDate: shortDate(d.startsAt),
    full: d.label ?? `Day ${d.dayNumber}`,
    isCurrent: current?.id === d.id,
  }));

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {selectedId ? (
        <DayPicker items={dayItems} selectedId={selectedId} registered={counters.total} register={<RegisterChildButton />} />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Dashboard</h1>
          <div style={{ marginLeft: 'auto' }}>
            <RegisterChildButton />
          </div>
        </div>
      )}

      <DesktopOnly>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={tile}><div style={tileLabel}>Registered</div><div style={tileNum}>{counters.total}</div></div>
          <div style={tile}><div style={tileLabel}>On-site</div><div style={{ ...tileNum, color: '#0E6027' }}>{counters.checkedIn}</div></div>
          <div style={tile}><div style={tileLabel}>Checked out</div><div style={tileNum}>{counters.checkedOut}</div></div>
          <div style={tile}><div style={tileLabel}>Not arrived</div><div style={tileNum}>{counters.notArrived}</div></div>
        </div>
      </DesktopOnly>

      {isCurrent && (
        <Card>
          <CardHeader title="Find a child" />
          <div style={{ padding: 16 }}>
            <ChildLookup isAdmin={staff.role === 'admin'} />
          </div>
        </Card>
      )}

      <Roster roster={roster} actionBar={isCurrent} />
    </div>
  );
}
