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
};

/**
 * Email a guardian that their child is registered, with the child's QR code embedded as an
 * inline image so they can show it on a phone at check-in / check-out. Best-effort: callers
 * should not fail registration if this rejects. The QR is a CID attachment (a data-URI <img>
 * is blocked by Gmail/Outlook); the PNG is also attached so it survives if inline is stripped.
 */
export async function sendChildRegistrationEmail(params: RegistrationEmailParams): Promise<SendEmailResult> {
  const png = await QRCode.toBuffer(params.qrToken, {
    type: 'png',
    margin: 1,
    width: 320,
    errorCorrectionLevel: 'M',
  });
  const cid = 'child-qr';
  const childName = esc(params.childName);
  const guardianName = esc(params.guardianName);
  const eventName = esc(EVENT_NAME);
  const tagLine = params.tagCode
    ? `<p style="margin:0 0 4px;font-size:13px;color:#525252;">Tag number</p>
       <p style="margin:0;font-size:16px;font-weight:600;font-family:monospace;color:#161616;">${esc(params.tagCode)}</p>`
    : '';

  const html = `
  <div style="background:#f4f4f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0f62fe;font-weight:700;">${eventName}</p>
        <h1 style="margin:0;font-size:22px;font-weight:600;">${childName} is registered</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:#393939;">
          Hi ${guardianName}, ${childName} has been registered for ${eventName}.
          We've attached ${childName}'s check-in QR code to this email — show it on your phone at the desk to check them in and out.
        </p>
      </td></tr>
      <tr><td style="padding:8px 28px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="border:1px solid #e0e0e0;background:#f4f4f4;padding:16px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#161616;">📎 Check-in QR code attached (check-in-qr.png)</p>
            <p style="margin:6px 0 0;font-size:13px;color:#525252;">Open the attached image on your phone and show it at the desk to check ${childName} in and out.</p>
          </td></tr>
        </table>
        <div style="margin-top:16px;">${tagLine}</div>
      </td></tr>
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
    `Show the attached QR code on your phone at the desk to check ${params.childName} in and out.`,
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
    attachments: [{ filename: 'check-in-qr.png', content: png, contentType: 'image/png', cid }],
  });
}
