import type { Severity } from '@/lib/medical';

const SEV: Record<Severity, { label: string; color: string }> = {
  routine: { label: 'Routine', color: '#525252' },
  incident: { label: 'Incident', color: '#8D6E00' },
  emergency: { label: 'Emergency', color: '#DA1E28' },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEV[severity];
  return <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>;
}
