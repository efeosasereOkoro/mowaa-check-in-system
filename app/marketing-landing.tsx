import Link from 'next/link';

// Public marketing landing (E12-S1, redesigned). Server component, self-contained: a scoped
// <style> block gives it its own playful "warm paper" visual voice — deliberately distinct
// from the square Carbon console — with real responsive behaviour (fine for a static public
// page, no hydration concerns), semantic landmarks (header/main/footer) and inline SVGs.
// The page animates nothing, so prefers-reduced-motion needs no special handling.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap');
.lp * { box-sizing: border-box; }
.lp { color: #161616; font-family: var(--font-geist-sans), system-ui, sans-serif; line-height: 1.5; background: #FFF8F0; }
.lp a { text-decoration: none; }
.lp-wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
.lp-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-weight: 700; letter-spacing: -.03em; }

/* nav */
.lp-nav { position: sticky; top: 0; z-index: 10; background: rgba(255,248,240,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid #EFE4D6; }
.lp-nav-in { height: 60px; display: flex; align-items: center; justify-content: space-between; }
.lp-logo { display: flex; align-items: center; gap: 9px; font-size: 16px; }
.lp-logo b { font-weight: 700; }
.lp-logo-mark { width: 28px; height: 28px; border-radius: 9px; background: #0F62FE; color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; }

/* buttons — all pills */
.lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; font-size: 15px; font-weight: 600; border-radius: 999px; cursor: pointer; font-family: inherit; }
.lp-btn-primary { background: #0F62FE; color: #fff; border: none; box-shadow: 0 6px 0 #0A46B4; }
.lp-btn-primary:hover { background: #0353E9; }
.lp-btn-ghost { background: #fff; color: #161616; border: 1.5px solid #161616; }
.lp-btn-nav { background: #161616; color: #fff; border: none; height: 40px; padding: 0 18px; }
.lp-btn-lg { height: 56px; padding: 0 28px; font-size: 16px; }

/* ---------- hero fills the fold ---------- */
.lp-hero { min-height: calc(100vh - 60px); background: #FFF8F0; position: relative; overflow: hidden; display: grid; align-items: center; }
.lp-hero .lp-wrap { width: 100%; position: relative; z-index: 1; }
.lp-blob { position: absolute; border-radius: 50%; z-index: 0; }
.lp-blob-1 { width: 620px; height: 620px; background: #E4EEFF; right: -90px; top: -60px; }
.lp-blob-2 { width: 150px; height: 150px; background: #FFE9C2; right: 430px; bottom: 70px; }
.lp-hero-grid { display: grid; grid-template-columns: 1fr 520px; gap: 40px; padding-top: 8px; align-items: center; }

.lp-badge { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px; border-radius: 999px; background: #fff; border: 1px solid #EADFD0; color: #5A5248; font-size: 12px; font-weight: 600; }
.lp-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #0F62FE; }
.lp-h1 { font-size: clamp(46px, 5.4vw, 74px); line-height: .98; margin: 22px 0 0; max-width: 15ch; }
.lp-mark {
  background-image: linear-gradient(#FFC94A, #FFC94A);
  background-size: 100% .6em;
  background-position: 0 82%;
  background-repeat: no-repeat;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding: 0 .06em;
}
.lp-sub { font-size: 19px; color: #5A5248; max-width: 44ch; margin: 24px 0 0; }
.lp-cta-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 28px; }
.lp-note { font-size: 13px; color: #8B8378; margin-top: 16px; }

/* hero right column — the product (decorative) */
.lp-hero-art { position: relative; justify-self: center; }
.lp-phone { width: 330px; background: #161616; border-radius: 36px; padding: 9px; box-shadow: 0 26px 60px rgba(60,45,20,.22); transform: rotate(2deg); }
.lp-phone-screen { background: #F4F4F4; border-radius: 28px; overflow: hidden; }

/* dashboard mock — square-cornered: this is the console */
.lp-dash { font-family: var(--font-geist-sans), system-ui, sans-serif; }
.lp-dash-bar { height: 52px; background: #161616; display: flex; align-items: center; gap: 9px; padding: 0 14px; }
.lp-dash-av { width: 26px; height: 26px; border-radius: 7px; background: #0F62FE; color: #fff; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.lp-dash-bar b { color: #fff; font-size: 13px; font-weight: 600; }
.lp-dash-body { padding: 14px; }
.lp-dash-h { font-size: 17px; font-weight: 600; color: #161616; }
.lp-dash-sub { font-size: 12px; color: #525252; margin-top: 2px; }
.lp-dash-counts { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 12px; border: 1px solid #E0E0E0; }
.lp-dash-cell { height: 54px; border-right: 1px solid #E0E0E0; padding: 8px; display: flex; flex-direction: column; justify-content: center; }
.lp-dash-cell:last-child { border-right: none; }
.lp-dash-cell.sel { background: #EDF5FF; border-bottom: 3px solid #0F62FE; }
.lp-dash-cell .n { font-size: 18px; font-weight: 600; color: #161616; }
.lp-dash-cell .l { font-size: 9px; letter-spacing: .04em; text-transform: uppercase; color: #525252; margin-top: 2px; }
.lp-dash-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 2px; border-bottom: 1px solid #E8E8E8; }
.lp-dash-row.out { background: #FAFAFA; }
.lp-dash-name { font-size: 13px; font-weight: 600; color: #0F62FE; }
.lp-dash-meta { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 10.5px; color: #525252; margin-top: 2px; }
.lp-dash-status { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #525252; }
.lp-dash-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.lp-dash-scan { height: 44px; background: #0F62FE; color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; margin-top: 10px; }

/* floating cards over the phone */
.lp-float { position: absolute; border-radius: 16px; box-shadow: 0 12px 30px rgba(60,45,20,.14); }
.lp-float-1 { background: #fff; top: 96px; left: -58px; transform: rotate(-2deg); padding: 12px 14px; width: 232px; display: flex; gap: 10px; align-items: flex-start; }
.lp-float-check { width: 34px; height: 34px; border-radius: 50%; background: #D8F3E3; color: #0E6027; display: grid; place-items: center; flex-shrink: 0; }
.lp-float-1 .t { font-size: 14px; font-weight: 600; color: #161616; }
.lp-float-1 .s { font-size: 12.5px; color: #6B6357; margin-top: 2px; }
.lp-float-2 { background: #161616; bottom: 118px; left: -40px; transform: rotate(1.5deg); padding: 12px 14px; display: flex; gap: 9px; align-items: center; }
.lp-float-2 .dot { width: 9px; height: 9px; border-radius: 50%; background: #FFC94A; flex-shrink: 0; }
.lp-float-2 .t { font-size: 14px; font-weight: 600; color: #fff; }
.lp-float-2 .s { font-size: 12.5px; color: #A8A099; margin-top: 1px; }

/* ---------- sections ---------- */
.lp-section { padding: 72px 0; background: #FFF8F0; }
.lp-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #0F62FE; }

/* features bento */
.lp-feat-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
.lp-h2 { font-size: 44px; line-height: 1.05; margin: 8px 0 0; max-width: 20ch; }
.lp-lead { font-size: 16px; color: #5A5248; max-width: 34ch; margin: 0; }
.lp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 36px; }
.lp-card { border-radius: 22px; padding: 26px; }
.lp-card h3 { font-size: 21px; margin: 0 0 8px; }
.lp-card p { font-size: 14.5px; line-height: 1.6; margin: 0; }
.lp-card-icon { width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; margin-bottom: 16px; }
.lp-card--plain, .lp-card--rose { background: #fff; border: 1px solid #EFE4D6; }
.lp-card--plain h3, .lp-card--rose h3 { color: #161616; }
.lp-card--plain p, .lp-card--rose p { color: #5A5248; }
.lp-card--plain .lp-card-icon { background: #EDF5FF; color: #0F62FE; }
.lp-card--rose .lp-card-icon { background: #FFE4E5; color: #DA1E28; }
.lp-card--mint { background: #D8F3E3; }
.lp-card--mint h3 { color: #0B3D22; }
.lp-card--mint p { color: #2F5B44; }
.lp-card--mint .lp-card-icon { background: #fff; color: #0E6027; }
.lp-card--amber { background: #FFE9C2; }
.lp-card--amber h3 { color: #4A3800; }
.lp-card--amber p { color: #6B5312; }
.lp-card--amber .lp-card-icon { background: #fff; color: #8D6E00; }
.lp-card--hero { grid-column: span 2; background: #161616; border-radius: 22px; padding: 30px 32px; display: flex; align-items: center; gap: 32px; }
.lp-card--hero .hero-left { flex: 1; }
.lp-hero-tile { width: 46px; height: 46px; border-radius: 13px; background: #0F62FE; color: #fff; display: grid; place-items: center; }
.lp-card--hero h3 { font-size: 24px; color: #fff; margin: 16px 0 8px; }
.lp-card--hero p { font-size: 15px; color: #B8B0A6; max-width: 40ch; margin: 0; }
.lp-hero-qr { width: 150px; height: 150px; background: #fff; border-radius: 18px; display: grid; place-items: center; flex-shrink: 0; }

/* steps */
.lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 36px; }
.lp-step { background: #fff; border: 1px solid #EFE4D6; border-radius: 22px; padding: 26px; }
.lp-step-n { width: 40px; height: 40px; border-radius: 50%; background: #FFC94A; color: #161616; display: grid; place-items: center; font-size: 17px; }
.lp-step h3 { font-size: 21px; margin: 16px 0 8px; color: #161616; }
.lp-step p { font-size: 14.5px; line-height: 1.6; color: #5A5248; margin: 0; }

/* CTA band */
.lp-band-sec { padding: 0 0 72px; background: #FFF8F0; }
.lp-band { position: relative; overflow: hidden; background: #161616; border-radius: 28px; padding: 56px 48px; display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
.lp-band-blob { position: absolute; width: 280px; height: 280px; border-radius: 50%; background: #23303F; right: -70px; top: -90px; z-index: 0; }
.lp-band-in { position: relative; z-index: 1; }
.lp-band h2 { font-size: 40px; color: #fff; margin: 0 0 8px; }
.lp-band p { font-size: 16.5px; color: #B8B0A6; margin: 0; }
.lp-band .lp-btn { position: relative; z-index: 1; }

/* footer */
.lp-footer { background: #FFF8F0; border-top: 1px solid #EFE4D6; padding: 28px 0; }
.lp-footer-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 13.5px; color: #8B8378; }
.lp-footer a { color: #5A5248; }
.lp-footer-links { display: flex; gap: 18px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .lp-hero-grid { grid-template-columns: 1fr; gap: 32px; }
  .lp-hero-art { justify-self: center; }
  .lp-phone { width: 280px; }
  .lp-card--hero { grid-column: span 1; flex-direction: column; align-items: flex-start; }
  .lp-hero-qr { width: 120px; height: 120px; }
  .lp-grid, .lp-steps { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 620px) {
  .lp-hero { min-height: auto; padding: 56px 0; }
  .lp-h1 { font-size: 46px; }
  .lp-blob-1, .lp-blob-2 { display: none; }
  .lp-grid, .lp-steps { grid-template-columns: 1fr; }
  .lp-cta-row { flex-direction: column; }
  .lp-cta-row .lp-btn, .lp-band .lp-btn { width: 100%; height: 52px; }
  .lp-band { padding: 40px 28px; }
  .lp-band h2 { font-size: 32px; }
}
`;

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const Arrow = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

type Tone = 'hero' | 'mint' | 'plain' | 'rose' | 'amber';

const features: { title: string; body: string; icon: React.ReactNode; tone: Tone }[] = [
  {
    title: 'QR check-in & out',
    body: 'Scan a printed QR card with any phone camera — no special hardware. Manual name or tag search is always there as a backup.',
    icon: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 20h.01M20 14h.01M14 20h.01" /></>),
    tone: 'hero',
  },
  {
    title: 'Authorised pickup only',
    body: 'Every check-out records who collected the child, verified against the guardian and pickup list — and flags anyone not on it so staff can escalate before releasing.',
    icon: (<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>),
    tone: 'mint',
  },
  {
    title: 'Incident & safeguarding reports',
    body: 'File a safeguarding or incident report in minutes. It routes to the Protection Officer, moves through review to sign-off, and alerts admins by email — with the sensitive detail kept behind login.',
    icon: (<><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z" /><path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" /><path d="M12 10.5v3.5M12 17h.01" /></>),
    tone: 'rose',
  },
  {
    title: 'Roles that fit the desk',
    body: 'Reception, Health Officer and Admin each see exactly what they need — enforced at the database, not just hidden in the UI.',
    icon: (<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 6a3 3 0 0 1 0 6M18 15c2.2.2 3.5 1.8 3.5 4" /></>),
    tone: 'plain',
  },
  {
    title: 'Medical notes',
    body: 'Timestamped, severity-tagged and append-only. Emergencies are flagged on the roster and counted in the day’s report.',
    icon: (<><path d="M12 5v14M5 12h14" /></>),
    tone: 'rose',
  },
  {
    title: 'Live dashboard & reports',
    body: 'See who’s on-site at a glance, an end-of-day flag list, and one-click CSV export of attendance and the full register — opens in Excel.',
    icon: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
    tone: 'amber',
  },
  {
    title: 'Private by design',
    body: 'Home addresses and health details are locked to the roles that need them, with row-level security and an append-only audit trail.',
    icon: (<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
    tone: 'plain',
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
            <span className="lp-logo-mark">ST</span>
            <span>
              <b>SmartTag</b> Check-In
            </span>
          </div>
          <Link href="/sign-in" className="lp-btn lp-btn-nav">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <span className="lp-blob lp-blob-1" aria-hidden="true" />
          <span className="lp-blob lp-blob-2" aria-hidden="true" />
          <div className="lp-wrap">
            <div className="lp-hero-grid">
              <div>
                <span className="lp-badge">Child check-in, safeguarding &amp; incidents</span>
                <h1 className="lp-h1 lp-display">
                  Know who’s on-site — and <span className="lp-mark">who took them home.</span>
                </h1>
                <p className="lp-sub">
                  QR-based check-in and check-out for camps, kids’ events, schools and churches. Role-based,
                  safeguarding-first, and it runs on any phone.
                </p>
                <div className="lp-cta-row">
                  <Link href="/sign-in" className="lp-btn lp-btn-primary lp-btn-lg">
                    Sign in
                    <Arrow />
                  </Link>
                  <a href="#features" className="lp-btn lp-btn-ghost lp-btn-lg">
                    See how it works
                  </a>
                </div>
                <p className="lp-note">Self-service sign-up is coming soon — for now, access is by invite.</p>
              </div>

              <div className="lp-hero-art" aria-hidden="true">
                <div className="lp-phone">
                  <div className="lp-phone-screen">
                    <div className="lp-dash">
                      <div className="lp-dash-bar">
                        <span className="lp-dash-av">ST</span>
                        <b>SmartTag Check-In</b>
                      </div>
                      <div className="lp-dash-body">
                        <div className="lp-dash-h">Today’s roster</div>
                        <div className="lp-dash-sub">24 children · Sat 4 Jul</div>
                        <div className="lp-dash-counts">
                          <div className="lp-dash-cell sel">
                            <span className="n" style={{ color: '#0F62FE' }}>24</span>
                            <span className="l">All</span>
                          </div>
                          <div className="lp-dash-cell">
                            <span className="n" style={{ color: '#0E6027' }}>21</span>
                            <span className="l">On-site</span>
                          </div>
                          <div className="lp-dash-cell">
                            <span className="n">3</span>
                            <span className="l">Out</span>
                          </div>
                          <div className="lp-dash-cell">
                            <span className="n" style={{ color: '#DA1E28' }}>2</span>
                            <span className="l">Alerts</span>
                          </div>
                        </div>
                        <div className="lp-dash-row">
                          <div>
                            <div className="lp-dash-name">Amara Okeke</div>
                            <div className="lp-dash-meta">TAG-014 · in 09:02</div>
                          </div>
                          <div className="lp-dash-status">
                            <span className="lp-dash-dot" style={{ background: '#0E6027' }} />
                            On-site
                          </div>
                        </div>
                        <div className="lp-dash-row">
                          <div>
                            <div className="lp-dash-name">Chidi Balogun</div>
                            <div className="lp-dash-meta">TAG-021 · in 09:05</div>
                          </div>
                          <div className="lp-dash-status">
                            <span className="lp-dash-dot" style={{ background: '#0E6027' }} />
                            On-site
                          </div>
                        </div>
                        <div className="lp-dash-row out">
                          <div>
                            <div className="lp-dash-name">Emeka Nwosu</div>
                            <div className="lp-dash-meta">TAG-008 · out 15:42</div>
                          </div>
                          <div className="lp-dash-status">
                            <span className="lp-dash-dot" style={{ background: '#A8A8A8' }} />
                            Out
                          </div>
                        </div>
                        <div className="lp-dash-scan">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 20h.01M20 14h.01M14 20h.01" />
                          </svg>
                          Scan a card
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lp-float lp-float-1">
                  <span className="lp-float-check">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  </span>
                  <div>
                    <div className="t">Amara Okeke · checked out</div>
                    <div className="s">Collected by Ngozi Okeke · 15:42</div>
                  </div>
                </div>

                <div className="lp-float lp-float-2">
                  <span className="dot" />
                  <div>
                    <div className="t">3 still on-site</div>
                    <div className="s">at 16:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-feat-head">
              <div>
                <div className="lp-eyebrow">Why SmartTag</div>
                <h2 className="lp-h2 lp-display">Everything the front desk needs, nothing it doesn’t.</h2>
              </div>
              <p className="lp-lead">Built for the realities of a busy check-in table: fast, safe, and clear about who can see what.</p>
            </div>
            <div className="lp-grid">
              {features.map((f) =>
                f.tone === 'hero' ? (
                  <div key={f.title} className="lp-card lp-card--hero">
                    <div className="hero-left">
                      <div className="lp-hero-tile">
                        <Icon d={f.icon} />
                      </div>
                      <h3 className="lp-display">{f.title}</h3>
                      <p>{f.body}</p>
                    </div>
                    <div className="lp-hero-qr">
                      <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {f.icon}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div key={f.title} className={`lp-card lp-card--${f.tone}`}>
                    <div className="lp-card-icon">
                      <Icon d={f.icon} />
                    </div>
                    <h3 className="lp-display">{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-eyebrow">How it works</div>
            <h2 className="lp-h2 lp-display">Three steps, start to finish.</h2>
            <div className="lp-steps">
              {steps.map((s) => (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-n lp-display">{s.n}</div>
                  <h3 className="lp-display">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-band-sec">
          <div className="lp-wrap">
            <div className="lp-band">
              <span className="lp-band-blob" aria-hidden="true" />
              <div className="lp-band-in">
                <h2 className="lp-display">Run a safer check-in.</h2>
                <p>Sign in to your organisation’s console to get started.</p>
              </div>
              <Link href="/sign-in" className="lp-btn lp-btn-primary lp-btn-lg">
                Sign in
                <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <span>© {new Date().getFullYear()} SmartTag Check-In</span>
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
