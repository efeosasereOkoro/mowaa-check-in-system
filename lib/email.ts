// Provider-agnostic transactional email. Server-only by usage — imported only from server
// actions; never import this from a client component (it reads secrets from env).
//
// Configure via env (never commit secrets):
//   EMAIL_PROVIDER = brevo   (unset → log-only stub, so nothing blocks if email is off)
//   BREVO_API_KEY  = <Brevo transactional API key>   (Brevo → SMTP & API → API Keys)
//   EMAIL_FROM     = "MOWAA Roots Summer School <noreply@your-verified-domain>"
//                    — MUST be a sender/domain verified in Brevo, or sends are rejected.
//
// Note on images: Brevo's transactional API sends attachments as real attachments (no inline
// cid), so the QR arrives as an attached PNG. Callers should word emails accordingly.

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  /** Content-ID for inline <img src="cid:..."> — honoured only by providers that support it. */
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

// Parse EMAIL_FROM as either "Name <email>" or a bare "email".
function parseSender(from: string): { name?: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2].trim() };
  return { email: from.trim() };
}

async function sendViaBrevo(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    // eslint-disable-next-line no-console
    console.warn('[email:brevo] BREVO_API_KEY and/or EMAIL_FROM not set — skipping send.');
    return { ok: false, skipped: true, error: 'brevo not configured' };
  }

  const payload = {
    sender: parseSender(from),
    to: [{ email: input.to }],
    subject: input.subject,
    htmlContent: input.html,
    ...(input.text ? { textContent: input.text } : {}),
    ...(input.attachments?.length
      ? { attachment: input.attachments.map((a) => ({ name: a.filename, content: a.content.toString('base64') })) }
      : {}),
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error(`[email:brevo] send failed (${res.status}): ${detail.slice(0, 300)}`);
      return { ok: false, error: `brevo ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[email:brevo] request failed', e);
    return { ok: false, error: 'brevo request failed' };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (!provider) {
    const extra = input.attachments?.length ? ` (+${input.attachments.length} attachment)` : '';
    // eslint-disable-next-line no-console
    console.info(`[email:stub] would send "${input.subject}" to ${input.to}${extra} — no EMAIL_PROVIDER set.`);
    return { ok: true, skipped: true };
  }

  if (provider === 'brevo') return sendViaBrevo(input);

  // eslint-disable-next-line no-console
  console.warn(`[email] EMAIL_PROVIDER="${provider}" is set but no adapter is implemented; skipping send.`);
  return { ok: false, skipped: true, error: `email provider "${provider}" not implemented` };
}
