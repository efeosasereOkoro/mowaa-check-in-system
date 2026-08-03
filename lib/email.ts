// Provider-agnostic transactional email. Server-only by usage — imported only from server
// actions; never import this from a client component (it reads env and would leak nothing
// useful, but keep it server-side).
//
// No provider is wired yet — the client will choose one (Resend / SMTP). Until
// EMAIL_PROVIDER and its credentials are set, sendEmail() logs what it *would* send and
// returns { skipped: true }, so callers are complete in code and nothing (e.g. child
// registration) ever blocks or fails because email isn't configured.
//
// To wire a provider later, implement the matching branch below and set EMAIL_PROVIDER:
//   - Resend: `resend.emails.send({ from, to, subject, html, text, attachments })`
//             (attachments: { filename, content: base64 | Buffer, contentType, content_id? })
//   - SMTP:   nodemailer transport.sendMail({ from, to, subject, html, text, attachments })
//             (attachments: { filename, content: Buffer, contentType, cid })
// EMAIL_FROM is the verified sender (e.g. "SmartTag Check-In <noreply@yourdomain>").

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  /** Content-ID for referencing this attachment inline via <img src="cid:..."> */
  cid?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (!provider) {
    const extra = input.attachments?.length ? ` (+${input.attachments.length} attachment)` : '';
    // eslint-disable-next-line no-console
    console.info(`[email:stub] would send "${input.subject}" to ${input.to}${extra} — no EMAIL_PROVIDER set.`);
    return { ok: true, skipped: true };
  }

  // Adapters land here once a provider is chosen (see file header).
  // eslint-disable-next-line no-console
  console.warn(`[email] EMAIL_PROVIDER="${provider}" is set but no adapter is implemented yet; skipping send.`);
  return { ok: false, skipped: true, error: `email provider "${provider}" not implemented` };
}
