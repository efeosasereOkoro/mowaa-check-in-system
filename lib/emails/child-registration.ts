import QRCode from 'qrcode';
import { sendEmail, type SendEmailResult } from '@/lib/email';
import { EVENT_NAME } from '@/lib/event';

// Escape a value for safe interpolation into the HTML email body.
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export type RegistrationEmailParams = {
  to: string;
  guardianName: string;
  childName: string;
  tagCode: string | null;
  qrToken: string;
  /** Public app origin (e.g. https://app.example.com) — used to embed the QR inline via a
   *  hosted <img>. When absent (or localhost, unreachable by mail clients), the email falls
   *  back to the attached PNG only. */
  appUrl?: string;
};

/**
 * Email a guardian that their child is registered, with the child's QR code shown inline
 * (from the public /api/qr endpoint — Gmail/Outlook block data-URI images) plus attached as a
 * PNG fallback, so they can show it on a phone at check-in / check-out. Best-effort: callers
 * should not fail registration if this rejects.
 */
export async function sendChildRegistrationEmail(params: RegistrationEmailParams): Promise<SendEmailResult> {
  const png = await QRCode.toBuffer(params.qrToken, {
    type: 'png',
    margin: 1,
    width: 320,
    errorCorrectionLevel: 'M',
  });
  const childName = esc(params.childName);
  const guardianName = esc(params.guardianName);
  const eventName = esc(EVENT_NAME);
  const tagLine = params.tagCode
    ? `<p style="margin:0 0 4px;font-size:13px;color:#525252;">Tag number</p>
       <p style="margin:0;font-size:16px;font-weight:600;font-family:monospace;color:#161616;">${esc(params.tagCode)}</p>`
    : '';

  // Inline hosted QR when we know the public origin; otherwise a callout pointing at the attachment.
  const base = params.appUrl?.replace(/\/+$/, '');
  const qrUrl = base ? `${base}/api/qr/${encodeURIComponent(params.qrToken)}` : null;
  const qrBlock = qrUrl
    ? `<tr><td align="center" style="padding:12px 28px 20px;">
        <img src="${esc(qrUrl)}" width="220" height="220" alt="Check-in QR code for ${childName}" style="display:block;width:220px;height:220px;border:1px solid #e0e0e0;background:#ffffff;padding:12px;" />
        <p style="margin:10px 0 0;font-size:12px;color:#8d8d8d;">Also attached as check-in-qr.png</p>
        <div style="margin-top:14px;">${tagLine}</div>
      </td></tr>`
    : `<tr><td style="padding:8px 28px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="border:1px solid #e0e0e0;background:#f4f4f4;padding:16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#161616;">📎 Check-in QR code attached (check-in-qr.png)</p>
            <p style="margin:6px 0 0;font-size:13px;color:#525252;">Open the attached image on your phone and show it at the desk to check ${childName} in and out.</p>
          </td></tr>
        </table>
        <div style="margin-top:16px;">${tagLine}</div>
      </td></tr>`;

  const html = `
  <div style="background:#f4f4f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0f62fe;font-weight:700;">${eventName}</p>
        <h1 style="margin:0;font-size:22px;font-weight:600;">${childName} is registered</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:#393939;">
          Hi ${guardianName}, ${childName} has been registered for ${eventName}.
          Show the check-in QR code below on your phone at the desk to check ${childName} in and out.
        </p>
      </td></tr>
      ${qrBlock}
      <tr><td style="padding:0 28px 28px;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:#6f6f6f;">
          Please keep this code safe. If you can't scan it, staff can find ${childName} by name or tag number at the desk.
        </p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#8d8d8d;">Sent by ${eventName} · SmartTag Check-In</p>
      </td></tr>
    </table>
  </div>`;

  const text = [
    `${params.childName} is registered for ${EVENT_NAME}.`,
    ``,
    `Hi ${params.guardianName}, ${params.childName} has been registered for ${EVENT_NAME}.`,
    `Show the attached QR code (check-in-qr.png) on your phone at the desk to check ${params.childName} in and out.`,
    params.tagCode ? `Tag number: ${params.tagCode}` : ``,
    ``,
    `If you can't scan it, staff can find ${params.childName} by name or tag number.`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendEmail({
    to: params.to,
    subject: `${params.childName} is registered for ${EVENT_NAME}`,
    html,
    text,
    attachments: [{ filename: 'check-in-qr.png', content: png, contentType: 'image/png', cid: 'child-qr' }],
  });
}
