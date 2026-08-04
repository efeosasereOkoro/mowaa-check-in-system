import QRCode from 'qrcode';
import { sendEmail, type SendEmailResult } from '@/lib/email';
import { EVENT_NAME } from '@/lib/event';

// One combined registration email for a whole family: the primary guardian gets a single
// message listing every child they registered, each with their own check-in QR shown inline
// (public /api/qr endpoint) and attached as a PNG fallback. Best-effort — callers must not
// fail registration if this rejects.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export type FamilyEmailChild = { name: string; tagCode: string | null; qrToken: string };

export type FamilyEmailParams = {
  to: string;
  guardianName: string;
  children: FamilyEmailChild[];
  /** Public app origin — used to embed each QR inline via a hosted <img>. When absent the
   *  email falls back to the attached PNGs only. */
  appUrl?: string;
};

export async function sendFamilyRegistrationEmail(params: FamilyEmailParams): Promise<SendEmailResult> {
  const guardianName = esc(params.guardianName);
  const eventName = esc(EVENT_NAME);
  const count = params.children.length;
  const base = params.appUrl?.replace(/\/+$/, '');

  // Build one QR PNG attachment per child (fallback for clients that block hosted images).
  const attachments = await Promise.all(
    params.children.map(async (c, i) => ({
      filename: `check-in-qr-${(c.tagCode || `child-${i + 1}`).replace(/[^a-zA-Z0-9-]/g, '')}.png`,
      content: await QRCode.toBuffer(c.qrToken, { type: 'png', margin: 1, width: 320, errorCorrectionLevel: 'M' }),
      contentType: 'image/png',
      cid: `child-qr-${i}`,
    })),
  );

  const childCard = (c: FamilyEmailChild, i: number) => {
    const name = esc(c.name);
    const qrUrl = base ? `${base}/api/qr/${encodeURIComponent(c.qrToken)}` : null;
    const tagLine = c.tagCode
      ? `<p style="margin:8px 0 0;font-size:12px;color:#525252;">Tag number</p>
         <p style="margin:0;font-size:15px;font-weight:600;font-family:monospace;color:#161616;">${esc(c.tagCode)}</p>`
      : '';
    const qr = qrUrl
      ? `<img src="${esc(qrUrl)}" width="180" height="180" alt="Check-in QR code for ${name}" style="display:block;margin:0 auto;width:180px;height:180px;border:1px solid #e0e0e0;background:#ffffff;padding:10px;" />
         <p style="margin:8px 0 0;font-size:11px;color:#8d8d8d;">Also attached as ${esc(attachments[i].filename)}</p>`
      : `<p style="margin:0;font-size:13px;font-weight:600;color:#161616;">📎 QR attached: ${esc(attachments[i].filename)}</p>`;
    return `<tr><td style="padding:16px 28px;border-top:1px solid #e0e0e0;" align="center">
        <p style="margin:0 0 10px;font-size:17px;font-weight:600;color:#161616;">${name}</p>
        ${qr}
        ${tagLine}
      </td></tr>`;
  };

  const html = `
  <div style="background:#f4f4f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0f62fe;font-weight:700;">${eventName}</p>
        <h1 style="margin:0;font-size:22px;font-weight:600;">Your ${count === 1 ? 'child is' : `${count} children are`} registered</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:#393939;">
          Hi ${guardianName}, thanks for registering your family for ${eventName}. Each child has their own
          check-in QR code below — show the right one on your phone at the desk to check that child in and out.
        </p>
      </td></tr>
      ${params.children.map((c, i) => childCard(c, i)).join('')}
      <tr><td style="padding:16px 28px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:#6f6f6f;">
          Please keep these codes safe. If you can't scan one, staff can find each child by name or tag number at the desk.
        </p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#8d8d8d;">Sent by ${eventName} · SmartTag Check-In</p>
      </td></tr>
    </table>
  </div>`;

  const text = [
    `Your ${count === 1 ? 'child is' : `${count} children are`} registered for ${EVENT_NAME}.`,
    ``,
    `Hi ${params.guardianName}, thanks for registering your family for ${EVENT_NAME}.`,
    `Each child has their own check-in QR code (attached). Show the right one on your phone at the desk.`,
    ``,
    ...params.children.map((c) => `• ${c.name}${c.tagCode ? ` — tag ${c.tagCode}` : ''} (QR: check-in-qr-${(c.tagCode || 'child').replace(/[^a-zA-Z0-9-]/g, '')}.png)`),
    ``,
    `If you can't scan a code, staff can find each child by name or tag number.`,
  ].join('\n');

  return sendEmail({
    to: params.to,
    subject: `Your ${count === 1 ? 'child is' : 'family is'} registered for ${EVENT_NAME}`,
    html,
    text,
    attachments,
  });
}
