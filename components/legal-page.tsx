import Link from 'next/link';

// Shared shell for the public legal pages (Terms, Privacy). Semantic header/main/footer,
// a readable ~720px column, a jump-to contents list, and a "Last updated" line.
const CSS = `
.legal * { box-sizing: border-box; }
.legal { color: #161616; font-family: var(--font-geist-sans), system-ui, sans-serif; }
.legal a { color: #0F62FE; }
.legal-nav { border-bottom: 1px solid #E0E0E0; }
.legal-nav-in { max-width: 960px; margin: 0 auto; padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.legal-logo { display: flex; align-items: center; gap: 8px; font-size: 16px; color: #161616; text-decoration: none; }
.legal-logo b { font-weight: 600; }
.legal-mark { width: 26px; height: 26px; border-radius: 6px; background: #0F62FE; color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
.legal-signin { font-size: 14px; }

.legal-main { max-width: 720px; margin: 0 auto; padding: 40px 20px 72px; }
.legal-main h1 { font-size: 40px; font-weight: 600; line-height: 1.15; margin: 0 0 8px; }
.legal-updated { font-size: 15px; color: #525252; margin: 0 0 32px; }
.legal-toc { background: #F4F4F4; border: 1px solid #E0E0E0; padding: 16px 20px; margin: 0 0 40px; }
.legal-toc h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #525252; margin: 0 0 10px; font-weight: 600; }
.legal-toc ol { margin: 0; padding-left: 20px; }
.legal-toc li { margin: 6px 0; font-size: 16px; }

.legal-body h2 { font-size: 24px; font-weight: 600; margin: 44px 0 12px; scroll-margin-top: 76px; }
.legal-body h2:first-child { margin-top: 0; }
.legal-body p, .legal-body li { font-size: 18px; line-height: 1.6; color: #262626; }
.legal-body p { margin: 0 0 16px; }
.legal-body ul, .legal-body ol { margin: 0 0 20px; padding-left: 24px; }
.legal-body li { margin: 8px 0; }
.legal-body strong { font-weight: 600; }

.legal-footer { border-top: 1px solid #E0E0E0; }
.legal-footer-in { max-width: 960px; margin: 0 auto; padding: 24px 20px; display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; font-size: 13px; color: #8D8D8D; }
.legal-footer a { color: #525252; }
.legal-footer nav { display: flex; gap: 18px; flex-wrap: wrap; }

@media (max-width: 620px) { .legal-main h1 { font-size: 30px; } }
`;

export default function LegalPage({
  title,
  lastUpdated,
  contents,
  children,
}: {
  title: string;
  lastUpdated: string;
  contents: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="legal-nav">
        <div className="legal-nav-in">
          <Link href="/" className="legal-logo">
            <span className="legal-mark">ST</span>
            <span>
              <b>SmartTag</b> Check-In
            </span>
          </Link>
          <Link href="/sign-in" className="legal-signin">
            Sign in
          </Link>
        </div>
      </header>

      <main className="legal-main">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {lastUpdated}</p>

        <nav className="legal-toc" aria-label="Contents">
          <h2>Contents</h2>
          <ol>
            {contents.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-body">{children}</div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-in">
          <span>© 2026 SmartTag Check-In</span>
          <nav aria-label="Footer">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
