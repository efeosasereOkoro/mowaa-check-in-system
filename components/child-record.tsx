import type { ChildAttendanceDay } from '@/lib/attendance';
import type { MedicalNote } from '@/lib/medical';

// Presentational, server-safe pieces shared by the child detail page and the printable
// individual report. Explicit dark text (the app is a light-only Carbon design).

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: '#525252',
  borderBottom: '1px solid #E0E0E0',
  padding: '8px 10px',
};
const td: React.CSSProperties = {
  fontSize: 14,
  color: '#161616',
  borderBottom: '1px solid #F4F4F4',
  padding: '8px 10px',
};

export function AttendanceTable({ days }: { days: ChildAttendanceDay[] }) {
  if (days.length === 0) {
    return <p style={{ fontSize: 14, color: '#525252', margin: 0 }}>No attendance recorded yet.</p>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Day', 'Date', 'Checked in', 'Checked out', 'Collected by'].map((h) => (
            <th key={h} style={th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((d) => (
          <tr key={d.dayNumber}>
            <td style={td}>
              {d.dayLabel}
              {d.override ? ' *' : ''}
            </td>
            <td style={td}>{d.date ?? '—'}</td>
            <td style={td}>{d.inAt ?? '—'}</td>
            <td style={td}>{d.outAt ?? '—'}</td>
            <td style={td}>{d.collector ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SEVERITY_COLOR: Record<MedicalNote['severity'], string> = {
  routine: '#0E6027',
  incident: '#8D6E00',
  emergency: '#DA1E28',
};

export function MedicalNotesList({ notes }: { notes: MedicalNote[] }) {
  if (notes.length === 0) {
    return <p style={{ fontSize: 14, color: '#525252', margin: 0 }}>No medical notes.</p>;
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {notes.map((n) => (
        <div key={n.id} style={{ border: '1px solid #E0E0E0', padding: 12, breakInside: 'avoid' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: SEVERITY_COLOR[n.severity], textTransform: 'capitalize' }}>
              {n.severity}
            </span>
            <span style={{ fontSize: 12, color: '#525252' }}>{n.when}</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#161616', whiteSpace: 'pre-wrap' }}>{n.noteText}</p>
          <div style={{ fontSize: 12, color: '#525252', marginTop: 6 }}>
            {n.author ? `by ${n.author}` : 'author unknown'}
            {n.guardianNotified ? ' · guardian notified' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
