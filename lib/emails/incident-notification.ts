import { sendEmail, type SendEmailResult } from '@/lib/email';
import { EVENT_NAME } from '@/lib/event';

// Notify a Protection Officer (admin) that an incident was filed or escalated (E13-S7).
// Deliberately low-detail: the email says an incident exists and links to the console — the
// sensitive narrative stays behind login, not in the inbox.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export type IncidentNotifyParams = {
  to: string;
  event: 'filed' | 'escalated';
  category: string; // human label
  reportedBy: string | null;
  when: string | null;
  incidentUrl: string | null;
};

export async function sendIncidentNotification(p: IncidentNotifyParams): Promise<SendEmailResult> {
  const headline = p.event === 'filed' ? 'A new incident has been reported' : 'An incident has been escalated';
  const eventName = esc(EVENT_NAME);
  // Child identity is deliberately omitted — recipients open the console to see who it concerns.
  const rows: [string, string | null][] = [
    ['Type', p.category],
    ['Reported by', p.reportedBy],
    ['Filed', p.when],
  ];
  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 0;font-size:13px;color:#525252;width:120px;">${esc(k)}</td><td style="padding:4px 0;font-size:14px;color:#161616;">${esc(v as string)}</td></tr>`,
    )
    .join('');

  const button = p.incidentUrl
    ? `<tr><td style="padding:20px 28px 4px;"><a href="${esc(p.incidentUrl)}" style="display:inline-block;background:#0f62fe;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;">Open the case</a></td></tr>`
    : '';

  const html = `
  <div style="background:#f4f4f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
      <tr><td style="padding:24px 28px 4px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#da1e28;font-weight:700;">${eventName} · Safeguarding</p>
        <h1 style="margin:0;font-size:20px;font-weight:600;">${esc(headline)}</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#393939;">
          A Protection Officer should review it. Details are kept in the system — open the case to read the full report.
        </p>
      </td></tr>
      <tr><td style="padding:12px 28px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rowsHtml}</table>
      </td></tr>
      ${button}
      <tr><td style="padding:20px 28px;border-top:1px solid #e0e0e0;margin-top:16px;">
        <p style="margin:0;font-size:12px;color:#8d8d8d;">Sent by ${eventName} · SmartTag Check-In</p>
      </td></tr>
    </table>
  </div>`;

  const text = [
    `${headline} — ${EVENT_NAME} (Safeguarding).`,
    ``,
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    ``,
    p.incidentUrl ? `Open the case: ${p.incidentUrl}` : 'Open the incidents console to review it.',
  ].join('\n');

  return sendEmail({
    to: p.to,
    subject: `[Safeguarding] ${headline} — ${p.category}`,
    html,
    text,
  });
}
