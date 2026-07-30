import type { Severity } from '@/lib/medical';

const SEV: Record<Severity, { label: string; bg: string; fg: string }> = {
  routine: { label: 'Routine', bg: '#E0E0E0', fg: '#393939' },
  incident: { label: 'Incident', bg: '#FDDC69', fg: '#684E00' },
  emergency: { label: 'Emergency', bg: '#FFD7D9', fg: '#A2191F' },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEV[severity];
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}
