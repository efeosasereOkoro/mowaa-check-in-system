import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList, getDayRoster, type Counters } from '@/lib/dashboard';
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
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <DesktopOnly>
          <div style={{ fontSize: 12, color: '#525252' }}>Attendance console</div>
        </DesktopOnly>
        {/* Both receptionists and admins register from here (receptionists can't reach /children). */}
        <div style={{ marginLeft: 'auto' }}>
          <RegisterChildButton />
        </div>
      </div>

      {selectedId ? (
        <DayPicker items={dayItems} selectedId={selectedId} />
      ) : (
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 16px' }}>Dashboard</h1>
      )}

      <DesktopOnly>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={tile}><div style={tileLabel}>Registered</div><div style={tileNum}>{counters.total}</div></div>
          <div style={tile}><div style={tileLabel}>On-site</div><div style={{ ...tileNum, color: '#0E6027' }}>{counters.checkedIn}</div></div>
          <div style={tile}><div style={tileLabel}>Checked out</div><div style={tileNum}>{counters.checkedOut}</div></div>
          <div style={tile}><div style={tileLabel}>Not arrived</div><div style={tileNum}>{counters.notArrived}</div></div>
        </div>
      </DesktopOnly>

      {isCurrent && (
        <div style={{ marginBottom: 14 }}>
          <DesktopOnly>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Find a child</div>
          </DesktopOnly>
          <ChildLookup isAdmin={staff.role === 'admin'} />
        </div>
      )}

      <DesktopOnly>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Roster</div>
      </DesktopOnly>
      <Roster roster={roster} actionBar={isCurrent} />
    </div>
  );
}
