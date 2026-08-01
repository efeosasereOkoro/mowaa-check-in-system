import Link from 'next/link';
import QRCode from 'qrcode';
import { requireRole } from '@/lib/require-role';
import { listChildrenForCards, type CardChild } from '@/lib/children';
import { EVENT_NAME } from '@/lib/event';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

// Standalone (outside the app shell) so it prints clean — no sidebar/nav on the page.
// QR encodes the child's opaque token (E11); a scan resolves via lookup(). SVG output
// stays crisp at any print size.
async function qrSvg(token: string): Promise<string> {
  return QRCode.toString(token, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
}

function CardFace({ child, svg }: { child: CardChild; svg: string }) {
  return (
    <div className="card">
      <div className="card-event">{EVENT_NAME}</div>
      <div className="card-name">
        {child.firstName} {child.lastName}
      </div>
      <div className="card-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="card-tag">{child.tagCode ?? 'No tag number'}</div>
    </div>
  );
}

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const staff = await requireRole(['admin']);
  const { child: childId } = await searchParams;
  const allKids = await listChildrenForCards(staff.id);
  const kids = childId ? allKids.filter((k) => k.id === childId) : allKids;
  const single = !!childId;
  const svgs = await Promise.all(kids.map((k) => qrSvg(k.qrToken)));

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .cards { display: grid; grid-template-columns: repeat(auto-fill, 85mm); gap: 8mm; }
        .card {
          width: 85mm; height: 54mm; box-sizing: border-box;
          border: 1px solid #C6C6C6; padding: 5mm;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          break-inside: avoid; page-break-inside: avoid;
        }
        .card-event { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #0F62FE; font-weight: 700; }
        .card-name { font-size: 17px; font-weight: 600; margin: 2mm 0; line-height: 1.15; }
        .card-qr { flex: 1; display: flex; align-items: center; justify-content: center; }
        .card-qr svg { width: 24mm; height: 24mm; }
        .card-tag { font-family: ui-monospace, monospace; font-size: 12px; color: #393939; margin-top: 1mm; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 10mm; }
          body { background: #fff; }
          .card { border: 1px solid #8D8D8D; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href={single && kids[0] ? `/children/${kids[0].id}` : '/children'} style={{ color: '#0F62FE', fontSize: 14 }}>
          ← Back{single && kids[0] ? ` to ${kids[0].firstName}` : ' to Children'}
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 400, margin: 0, flex: 1, minWidth: 200 }}>{single ? 'ID card' : 'ID cards'}</h1>
        <span style={{ fontSize: 13, color: '#525252' }}>{kids.length} card{kids.length === 1 ? '' : 's'}</span>
        <PrintButton />
      </div>
      <p className="no-print" style={{ fontSize: 13, color: '#525252', marginTop: 0, marginBottom: 20, maxWidth: 560 }}>
        Each card carries the child&apos;s name, a QR code, the tag number, and the event name. Print on card stock,
        cut along the borders. At the desk, staff tap <strong>Scan QR</strong> and point the camera at the code.
      </p>

      {kids.length === 0 ? (
        <p style={{ color: '#8D8D8D' }}>No children registered yet.</p>
      ) : (
        <div className="cards">
          {kids.map((k, i) => (
            <CardFace key={k.id} child={k} svg={svgs[i]} />
          ))}
        </div>
      )}
    </div>
  );
}
