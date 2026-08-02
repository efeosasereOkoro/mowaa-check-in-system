import Link from 'next/link';

// Public marketing landing (E12-S1). Server component, self-contained: a scoped <style>
// block gives it real responsive behaviour (fine for a static public page — no hydration
// concerns), semantic landmarks (header/main/footer) for accessibility, and inline SVGs.
const CSS = `
.lp * { box-sizing: border-box; }
.lp { color: #161616; font-family: var(--font-geist-sans), system-ui, sans-serif; line-height: 1.5; }
.lp a { text-decoration: none; }
.lp-wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }

.lp-nav { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); border-bottom: 1px solid #E0E0E0; }
.lp-nav-in { height: 60px; display: flex; align-items: center; justify-content: space-between; }
.lp-logo { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.lp-logo b { font-weight: 600; }
.lp-mark { width: 26px; height: 26px; border-radius: 6px; background: #0F62FE; color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
.lp-btn { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; font-size: 15px; font-weight: 600; border-radius: 2px; cursor: pointer; }
.lp-btn-primary { background: #0F62FE; color: #fff; border: 1px solid #0F62FE; }
.lp-btn-primary:hover { background: #0353E9; }
.lp-btn-ghost { background: transparent; color: #161616; border: 1px solid #8D8D8D; }
.lp-btn-sm { height: 40px; padding: 0 14px; font-size: 14px; }
.lp-btn-lg { height: 52px; padding: 0 26px; font-size: 16px; }

.lp-hero { background: linear-gradient(180deg, #EDF5FF 0%, #F4F4F4 100%); padding: 64px 0 72px; }
.lp-badge { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #0043CE; background: #D0E2FF; padding: 4px 10px; border-radius: 2px; }
.lp-h1 { font-size: 44px; line-height: 1.1; font-weight: 600; margin: 16px 0 0; max-width: 18ch; }
.lp-sub { font-size: 18px; color: #525252; margin: 16px 0 28px; max-width: 54ch; }
.lp-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
.lp-note { font-size: 13px; color: #8D8D8D; margin-top: 14px; }

.lp-section { padding: 64px 0; }
.lp-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #0F62FE; }
.lp-h2 { font-size: 30px; font-weight: 600; margin: 8px 0 0; max-width: 22ch; }
.lp-lead { font-size: 16px; color: #525252; margin: 12px 0 0; max-width: 60ch; }

.lp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 36px; }
.lp-card { background: #fff; border: 1px solid #E0E0E0; padding: 24px; }
.lp-card-icon { width: 40px; height: 40px; border-radius: 8px; background: #EDF5FF; color: #0F62FE; display: grid; place-items: center; }
.lp-card h3 { font-size: 17px; font-weight: 600; margin: 16px 0 6px; }
.lp-card p { font-size: 14px; color: #525252; margin: 0; }

.lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 36px; }
.lp-step-n { width: 32px; height: 32px; border-radius: 50%; background: #161616; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 600; }
.lp-step h3 { font-size: 17px; font-weight: 600; margin: 14px 0 6px; }
.lp-step p { font-size: 14px; color: #525252; margin: 0; }

.lp-band { background: #161616; color: #fff; padding: 56px 0; }
.lp-band h2 { font-size: 28px; font-weight: 600; margin: 0 0 8px; }
.lp-band p { font-size: 16px; color: #C6C6C6; margin: 0 0 24px; }

.lp-footer { border-top: 1px solid #E0E0E0; padding: 28px 0; }
.lp-footer-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #8D8D8D; }
.lp-footer a { color: #525252; }
.lp-footer-links { display: flex; gap: 18px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .lp-grid, .lp-steps { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 620px) {
  .lp-h1 { font-size: 32px; }
  .lp-sub { font-size: 16px; }
  .lp-section, .lp-hero { padding: 44px 0; }
  .lp-grid, .lp-steps { grid-template-columns: 1fr; }
  .lp-btn-lg { height: 48px; }
}
`;

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const features = [
  {
    title: 'QR check-in & out',
    body: 'Scan a printed QR card with any phone camera — no special hardware. Manual name or tag search is always there as a backup.',
    icon: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 20h.01M20 14h.01M14 20h.01" /></>),
  },
  {
    title: 'Authorised pickup only',
    body: 'Every check-out records who collected the child, verified against the guardian and pickup list — with an admin override that logs a reason.',
    icon: (<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
  },
  {
    title: 'Roles that fit the desk',
    body: 'Reception, Health Officer and Admin each see exactly what they need — enforced at the database, not just hidden in the UI.',
    icon: (<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 6a3 3 0 0 1 0 6M18 15c2.2.2 3.5 1.8 3.5 4" /></>),
  },
  {
    title: 'Medical notes',
    body: 'Timestamped, severity-tagged and append-only. Emergencies are flagged on the roster and counted in the day’s report.',
    icon: (<><path d="M12 5v14M5 12h14" /></>),
  },
  {
    title: 'Live dashboard & reports',
    body: 'See who’s on-site at a glance, an end-of-day flag list, and one-click CSV export of attendance and the full register — opens in Excel.',
    icon: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  },
  {
    title: 'Private by design',
    body: 'Home addresses and health details are locked to the roles that need them, with row-level security and an append-only audit trail.',
    icon: (<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  },
];

const steps = [
  { n: 1, title: 'Register & print cards', body: 'Add children, then print QR ID cards for the whole group in one batch.' },
  { n: 2, title: 'Scan to check in & out', body: 'At the desk, scan the card and pick the authorised collector at pickup.' },
  { n: 3, title: 'Track live & report', body: 'Watch the counts move in real time, and export attendance when the day ends.' },
];

export default function MarketingLanding() {
  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <div className="lp-logo">
            <span className="lp-mark">ST</span>
            <span>
              <b>SmartTag</b> Check-In
            </span>
          </div>
          <Link href="/sign-in" className="lp-btn lp-btn-ghost lp-btn-sm">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-wrap">
            <span className="lp-badge">Child check-in &amp; check-out</span>
            <h1 className="lp-h1">Know who’s on-site — and who took them home.</h1>
            <p className="lp-sub">
              QR-based check-in and check-out for camps, kids’ events, schools and churches. Role-based,
              safeguarding-first, and it runs on any phone.
            </p>
            <div className="lp-cta-row">
              <Link href="/sign-in" className="lp-btn lp-btn-primary lp-btn-lg">
                Sign in
              </Link>
              <a href="#features" className="lp-btn lp-btn-ghost lp-btn-lg">
                See how it works
              </a>
            </div>
            <p className="lp-note">Self-service sign-up is coming soon — for now, access is by invite.</p>
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-eyebrow">Why SmartTag</div>
            <h2 className="lp-h2">Everything the front desk needs, nothing it doesn’t.</h2>
            <p className="lp-lead">Built for the realities of a busy check-in table: fast, safe, and clear about who can see what.</p>
            <div className="lp-grid">
              {features.map((f) => (
                <div key={f.title} className="lp-card">
                  <div className="lp-card-icon">
                    <Icon d={f.icon} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ background: '#fff', borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0' }}>
          <div className="lp-wrap">
            <div className="lp-eyebrow">How it works</div>
            <h2 className="lp-h2">Three steps, start to finish.</h2>
            <div className="lp-steps">
              {steps.map((s) => (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-n">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-band">
          <div className="lp-wrap">
            <h2>Run a safer check-in.</h2>
            <p>Sign in to your organisation’s console to get started.</p>
            <Link href="/sign-in" className="lp-btn lp-btn-primary lp-btn-lg">
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <span>© {'2026'} SmartTag Check-In</span>
          <nav className="lp-footer-links" aria-label="Footer">
            <Link href="/sign-in">Sign in</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
