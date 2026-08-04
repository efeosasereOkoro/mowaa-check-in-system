import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { listChildren } from '@/lib/children';
import { getCurrentEventDay } from '@/lib/attendance';
import { getEmergencyChildIdsToday } from '@/lib/medical';
import { MobileOnly, DesktopOnly } from '@/components/viewport';
import AddChildForm from './add-child-form';
import AddChildSheet from './add-child-sheet';
import ChildrenTable, { type ChildRow } from './children-table';
import ImportChildren from './import-children';

export const dynamic = 'force-dynamic';

const QrGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ flex: 'none' }}>
    <rect x="1" y="1" width="4" height="4" rx="0.5" />
    <rect x="9" y="1" width="4" height="4" rx="0.5" />
    <rect x="1" y="9" width="4" height="4" rx="0.5" />
    <rect x="9" y="9" width="2" height="2" />
    <rect x="12" y="12" width="1" height="1" />
  </svg>
);

export default async function ChildrenPage() {
  const staff = await requireRole(['admin']);
  const kids = await listChildren(staff.id);
  const day = await getCurrentEventDay(staff.id);
  const emergencyIds = await getEmergencyChildIdsToday(staff.id, day?.id ?? null);

  const childRows: ChildRow[] = kids.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    age: c.age,
    guardianName: c.guardianName,
    guardianPhone: c.guardianPhone,
    homeAddress: c.homeAddress,
    healthDetails: c.healthDetails,
    emergency: emergencyIds.has(c.id),
  }));

  return (
    <div style={{ maxWidth: 1000 }}>
      <MobileOnly>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>Children</div>
            <div style={{ fontSize: 13, color: '#525252', marginTop: 2 }}>{kids.length} registered</div>
          </div>
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <Link
              href="/cards"
              target="_blank"
              style={{ height: 36, padding: '0 12px', background: '#fff', border: '1px solid #161616', color: '#161616', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <QrGlyph />
              QR cards
            </Link>
            <ImportChildren />
          </div>
        </div>
      </MobileOnly>
      <DesktopOnly>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '0 0 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Children</h1>
          <Link href="/cards" target="_blank" style={{ color: '#0F62FE', fontSize: 14 }}>
            Print QR ID cards →
          </Link>
          <div style={{ marginLeft: 'auto' }}>
            <ImportChildren />
          </div>
        </div>
      </DesktopOnly>

      <DesktopOnly>
        <AddChildForm />
      </DesktopOnly>

      <ChildrenTable children={childRows} />

      <AddChildSheet />
    </div>
  );
}
