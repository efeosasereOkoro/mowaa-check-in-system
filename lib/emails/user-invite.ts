import { sendEmail, type SendEmailResult } from '@/lib/email';
import type { StaffRole } from '@/lib/staff';

// Escape a value for safe interpolation into the HTML email body.
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administrator',
  receptionist: 'Receptionist',
  health: 'Health Officer',
};

const APP_NAME = 'SmartTag Check-In';

export type UserInviteParams = {
  to: string;
  name: string;
  email: string;
  role: StaffRole;
  tempPassword: string;
  signInUrl: string;
};

/**
 * Email a newly-provisioned staff member their invite: role, sign-in link, and their
 * temporary credentials. Best-effort — callers should not fail user creation if this
 * rejects. (The temp password is admin-generated and meant to be changed on first use;
 * emailing it is the pragmatic invite until a set-password-link flow exists — B-026/B-046.)
 */
export async function sendUserInviteEmail(params: UserInviteParams): Promise<SendEmailResult> {
  const name = esc(params.name);
  const email = esc(params.email);
  const roleLabel = esc(ROLE_LABEL[params.role]);
  const tempPassword = esc(params.tempPassword);
  const signInUrl = esc(params.signInUrl);

  const html = `
  <div style="background:#f4f4f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0f62fe;font-weight:700;">${esc(APP_NAME)}</p>
        <h1 style="margin:0;font-size:22px;font-weight:600;">You've been added to the team</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:#393939;">
          Hi ${name}, an administrator has created a <strong>${roleLabel}</strong> account for you on ${esc(APP_NAME)}.
          Sign in with the details below.
        </p>
      </td></tr>
      <tr><td style="padding:12px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0;font-size:12px;color:#525252;">Email</p>
            <p style="margin:2px 0 12px;font-size:15px;font-weight:600;color:#161616;">${email}</p>
            <p style="margin:0;font-size:12px;color:#525252;">Temporary password</p>
            <p style="margin:2px 0 0;font-size:15px;font-weight:600;font-family:monospace;color:#161616;">${tempPassword}</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 28px 20px;">
        <a href="${signInUrl}" style="display:inline-block;height:44px;line-height:44px;padding:0 24px;background:#0f62fe;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Sign in</a>
        <p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:#6f6f6f;">
          For your security, please change this temporary password after you sign in. If you didn't expect this, ignore this email.
        </p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#8d8d8d;">${esc(APP_NAME)}</p>
      </td></tr>
    </table>
  </div>`;

  const text = [
    `You've been added to ${APP_NAME}.`,
    ``,
    `Hi ${params.name}, an administrator created a ${ROLE_LABEL[params.role]} account for you.`,
    ``,
    `Email: ${params.email}`,
    `Temporary password: ${params.tempPassword}`,
    ``,
    `Sign in: ${params.signInUrl}`,
    ``,
    `Please change this temporary password after you sign in. If you didn't expect this, ignore this email.`,
  ].join('\n');

  return sendEmail({
    to: params.to,
    subject: `You've been added to ${APP_NAME}`,
    html,
    text,
  });
}
