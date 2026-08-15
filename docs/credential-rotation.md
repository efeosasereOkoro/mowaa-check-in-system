# Credential rotation (B-009)

Several secrets passed through a development chat and must be treated as **compromised**. The system
holds real children's data (health, addresses), so rotate them. This is the runbook.

## Ground rules
- 🔒 **Never paste a new secret into a chat, PR, issue, or commit.** Store new values in a password manager.
- 🔁 **Env-var changes on Vercel take effect only after a redeploy.** For every secret below, update it in
  **both** places, then redeploy:
  - **Vercel** → Project → Settings → Environment Variables (mark each **Sensitive**)
  - local **`.env.local`**
- Do the DB-password and cookie-secret steps at a **quiet time** — each causes a brief disruption.

Do them in this order (least disruptive first).

---

## 1. Neon API key — no app impact
- Neon Console → **Account settings → API keys** → revoke the old `napi_…` key → **Create new**.
- The app does not use this at runtime (management/CLI only), so nothing to update in env.

## 2. `NEON_AUTH_COOKIE_SECRET` — signs everyone out
- Generate a fresh secret in your terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- Update `NEON_AUTH_COOKIE_SECRET` in **Vercel** + **`.env.local`** → **Redeploy**.
- ⚠️ All existing sessions become invalid — staff must **sign in again**.

## 3. `app_authenticated` DB password → `DATABASE_AUTHENTICATED_URL`
- Neon Console → **Roles** → `app_authenticated` → **Reset password**
  (or `ALTER ROLE app_authenticated WITH PASSWORD '…';` in the SQL editor).
- Copy the **new connection string**; update `DATABASE_AUTHENTICATED_URL` in **Vercel** + **`.env.local`** → **Redeploy**.
- ⚠️ The old string stops working the instant you reset — there's a brief window until the redeploy
  finishes where app DB queries fail.

## 4. `neondb_owner` DB password → `DATABASE_URL`
- Neon Console → **Connect → Reset password** for `neondb_owner`.
- Update `DATABASE_URL` in **Vercel** + **`.env.local`** → **Redeploy**. Same brief-window caveat as #3.

## 5. Main admin password (`efeosasere@gmail.com`)
- Change it via the app's **Forgot password** flow (if Neon delivers the reset email), or from the
  **Neon Auth** dashboard if it exposes setting a user's password.
- (In-app "change my password" is not built yet — backlog **B-046**.)

## 6. Brevo API key (if considered exposed)
- Brevo → **SMTP & API → API Keys** → create a new **`xkeysib-`** REST key (not the `xsmtpsib-` SMTP key).
- Update `BREVO_API_KEY` in **Vercel** + **`.env.local`** → **Redeploy**.

---

## After rotating
- Load production, **sign in fresh**, and click through Dashboard → a child → Health → Incidents → a
  report to confirm DB + auth work.
- File a test incident to confirm email still sends (if #6 was done).
- Mark **B-009** complete.
