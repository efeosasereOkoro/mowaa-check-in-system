import { requireRole } from '@/lib/require-role';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEventDaysList } from '@/lib/dashboard';
import { getAttendanceReport, getEndOfDayFlags } from '@/lib/reports';
import ReportDaySelect, { type DayOption } from './report-day-select';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, fontWeight: 600, padding: '10px 12px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { fontSize: 14, padding: '10px 12px', borderTop: '1px solid #E0E0E0', whiteSpace: 'nowrap' };

const exportBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 40,
  padding: '0 16px',
  background: '#0F62FE',
  color: '#fff',
  fontSize: 14,
  textDecoration: 'none',
};
const exportBtnAlt: React.CSSProperties = { ...exportBtn, background: '#fff', color: '#0F62FE', border: '1px solid #0F62FE' };

function dayShort(dayNumber: number, label: string | null): string {
  if (dayNumber === 0) return label ?? 'Pre-event test day';
  return label ?? `Day ${dayNumber}`;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const staff = await requireRole(['admin']);
  const { day: dayParam } = await searchParams;

  const days = await getEventDaysList(staff.id);
  const current = await getCurrentEventDay(staff.id);

  const isValid = dayParam === 'all' || days.some((d) => d.id === dayParam);
  const selected = isValid ? (dayParam as string) : current?.id ?? 'all';
  const dayId = selected === 'all' ? null : selected;
  const selectedDay = dayId ? days.find((d) => d.id === dayId) ?? null : null;

  const options: DayOption[] = [
    { value: 'all', label: 'All days' },
    ...days.map((d) => ({ value: d.id, label: dayShort(d.dayNumber, d.label) })),
  ];

  const rows = await getAttendanceReport(staff.id, dayId);
  const flags = dayId ? await getEndOfDayFlags(staff.id, dayId) : null;

  const allDays = dayId === null;

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>Admin</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>Reports</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: '#525252', marginBottom: 6 }}>Event day</div>
          <ReportDaySelect options={options} value={selected} />
        </div>
        <a href={`/api/reports/attendance?day=${selected}`} style={exportBtn}>
          Export attendance (CSV)
        </a>
        <a href="/api/reports/register" style={exportBtnAlt}>
          Export register (CSV)
        </a>
      </div>

      {/* End-of-day flags (FR-18) — only meaningful for a single day */}
      {flags && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ flex: '1 1 320px', background: '#fff', border: '1px solid #E0E0E0', borderLeft: `3px solid ${flags.stillCheckedIn.length ? '#F1C21B' : '#24A148'}`, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Still checked in ({flags.stillCheckedIn.length})
            </div>
            {flags.stillCheckedIn.length === 0 ? (
              <div style={{ fontSize: 13, color: '#525252' }}>Everyone who arrived has been checked out. ✓</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {flags.stillCheckedIn.map((s) => (
                  <li key={s.child} style={{ marginBottom: 2 }}>
                    {s.child}
                    {s.tag ? <span style={{ color: '#8D8D8D' }}> · {s.tag}</span> : null}
                    <span style={{ color: '#8D8D8D' }}> · in {s.inAt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ flex: '1 1 220px', background: '#fff', border: '1px solid #E0E0E0', borderLeft: `3px solid ${flags.emergencyCount ? '#DA1E28' : '#E0E0E0'}`, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Emergency notes today</div>
            <div style={{ fontSize: 32, fontWeight: 300, color: flags.emergencyCount ? '#DA1E28' : '#161616' }}>
              {flags.emergencyCount}
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        Attendance {allDays ? '— all days' : selectedDay ? `— ${dayShort(selectedDay.dayNumber, selectedDay.label)}` : ''}
        <span style={{ color: '#8D8D8D', fontWeight: 400 }}> ({rows.length})</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E0E0E0', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: allDays ? 760 : 640 }}>
          <thead>
            <tr style={{ background: '#E0E0E0' }}>
              {allDays && <th style={th}>Day</th>}
              <th style={th}>Time</th>
              <th style={th}>Child</th>
              <th style={th}>Action</th>
              <th style={th}>Staff</th>
              <th style={th}>Collector</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, color: '#8D8D8D' }} colSpan={allDays ? 6 : 5}>
                  No check-in / check-out activity{allDays ? ' yet' : ' for this day'}.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                {allDays && <td style={td}>{r.dayLabel}</td>}
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.time}</td>
                <td style={{ ...td, whiteSpace: 'normal' }}>{r.child}</td>
                <td style={td}>
                  {r.action}
                  {r.isOverride && (
                    <span
                      title={r.overrideReason ?? 'Admin override'}
                      style={{ marginLeft: 6, fontSize: 11, background: '#FFF1D6', color: '#8A6A00', padding: '1px 6px', borderRadius: 2 }}
                    >
                      override
                    </span>
                  )}
                </td>
                <td style={{ ...td, color: '#525252' }}>{r.staff}</td>
                <td style={{ ...td, whiteSpace: 'normal', color: '#525252' }}>{r.collector || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: '#8D8D8D', marginTop: 12 }}>
        Exports open in Excel. Attendance export follows the selected day; register export is the full children list.
      </p>
    </div>
  );
}
