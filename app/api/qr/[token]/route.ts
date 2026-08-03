import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

// Public QR image: renders a token as a QR PNG so it can be embedded inline in emails
// (<img src=".../api/qr/<token>">) — Gmail/Outlook block data-URI images, so a hosted URL
// is the reliable way to show a QR in an email. Encoding a token reveals nothing (the token
// is the input; it's already the opaque check-in credential we email to the guardian), so no
// auth is needed. Kept out of the auth middleware (see middleware.ts matcher).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length > 128) return new Response('Not found', { status: 404 });

  const png = await QRCode.toBuffer(token, { type: 'png', margin: 1, width: 320, errorCorrectionLevel: 'M' });
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
