import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList, getDayRoster, type Counters } from '@/lib/dashboard';
import ChildLookup from './child-lookup';
import Roster from './roster';

export const dynamic = 'force-dynamic';

const tile: React.CSSProperties = { flex: '1 1 150px', background: '#fff', border: '1px solid #E0E0E0', padding: 16 };
const tileLabel: React.CSSProperties = { fontSize: 12, color: '#525252' };
const tileNum: React.CSSProperties = { fontSize: 32, fontWeight: 300, marginTop: 4 };

const emptyCounters: Counters = { total: 0, checkedIn: 0, checkedOut: 0, notArrived: 0 };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const staff = await requireRole(['receptionist', 'admin']);
  const { day: dayParam } = await searchParams;

  const days = await getEventDaysList(staff.id);
  const current = await getCurrentEventDay(staff.id);
  const selectedId = dayParam && days.some((d) => d.id === dayParam) ? dayParam : current?.id ?? days[0]?.id ?? null;
  const selected = days.find((d) => d.id === selectedId) ?? null;
  const isCurrent = !!current && current.id === selectedId;

  const { counters, roster } = selectedId ? await getDayRoster(staff.id, selectedId) : { counters: emptyCounters, roster: [] };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Attendance console</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 16px' }}>Dashboard</h1>

      {days.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 16 }}>
          {days.map((d) => {
            const sel = d.id === selectedId;
            const isToday = current?.id === d.id;
            return (
              <Link
                key={d.id}
                href={`/dashboard?day=${d.id}`}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  textDecoration: 'none',
                  border: '1px solid #E0E0E0',
                  marginRight: -1,
                  background: sel ? '#0F62FE' : '#fff',
                  color: sel ? '#fff' : '#161616',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.label ?? `Day ${d.dayNumber}`}
                {isToday ? ' · today' : ''}
              </Link>
            );
          })}
        </div>
      )}

      {selected && !isCurrent && (
        <div style={{ marginBottom: 16, background: '#EDF5FF', border: '1px solid #D0E2FF', borderLeft: '3px solid #0F62FE', padding: '10px 14px', fontSize: 13 }}>
          Viewing <strong>{selected.label ?? `Day ${selected.dayNumber}`}</strong> — check-in / check-out is only available on the current day.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={tile}><div style={tileLabel}>Registered</div><div style={tileNum}>{counters.total}</div></div>
        <div style={tile}><div style={tileLabel}>On-site</div><div style={{ ...tileNum, color: '#0E6027' }}>{counters.checkedIn}</div></div>
        <div style={tile}><div style={tileLabel}>Checked out</div><div style={tileNum}>{counters.checkedOut}</div></div>
        <div style={tile}><div style={tileLabel}>Not arrived</div><div style={tileNum}>{counters.notArrived}</div></div>
      </div>

      {isCurrent && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Find a child</div>
          <ChildLookup isAdmin={staff.role === 'admin'} />
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Roster</div>
      <Roster roster={roster} />
    </div>
  );
}
