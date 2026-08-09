import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal-page';

// Update this whenever the content below changes.
const LAST_UPDATED = '9 August 2026';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The terms for using SmartTag Check-In.',
};

const contents = [
  { id: 'who-for', label: 'Who these terms are for' },
  { id: 'using', label: 'Using SmartTag Check-In' },
  { id: 'you-must', label: 'What you must do' },
  { id: 'you-must-not', label: 'What you must not do' },
  { id: 'data', label: 'Keeping information safe' },
  { id: 'availability', label: 'Availability of the service' },
  { id: 'ending', label: 'Suspending or ending access' },
  { id: 'liability', label: 'Our responsibility to you' },
  { id: 'changes', label: 'Changes to these terms' },
  { id: 'contact', label: 'Contact us' },
];

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" lastUpdated={LAST_UPDATED} contents={contents}>
      <h2 id="who-for">Who these terms are for</h2>
      <p>These terms are for organisations and staff who use SmartTag Check-In to check children in and out.</p>
      <p>By using the service, you agree to these terms. If you don’t agree, don’t use it.</p>

      <h2 id="using">Using SmartTag Check-In</h2>
      <p>An admin sets up staff accounts — there’s no public sign-up yet. Each person logs in with their own account. Keep your password to yourself and don’t share your login.</p>

      <h2 id="you-must">What you must do</h2>
      <p>You must:</p>
      <ul>
        <li>only add information you’re allowed to collect</li>
        <li>get consent from a child’s guardian before storing their details, especially health information</li>
        <li>keep the information accurate and up to date</li>
        <li>follow your organisation’s safeguarding and data protection rules</li>
        <li>report safeguarding or welfare concerns and incidents promptly and accurately, following your organisation’s safeguarding protocol, and only open incident reports if your role allows it</li>
        <li>check the right person is collecting a child before you check them out</li>
      </ul>

      <h2 id="you-must-not">What you must not do</h2>
      <p>You must not:</p>
      <ul>
        <li>use the service for anything unlawful</li>
        <li>try to access another organisation’s information</li>
        <li>share your login or let someone else use your account</li>
        <li>try to break, overload or get around the security of the service</li>
      </ul>

      <h2 id="data">Keeping information safe</h2>
      <p>
        How we handle personal information is set out in our <Link href="/privacy">Privacy policy</Link>. You’re responsible for what
        you enter and who you give access to.
      </p>

      <h2 id="availability">Availability of the service</h2>
      <p>We work to keep the service running, but we can’t promise it will always be available. We may need to take it down for maintenance or updates.</p>

      <h2 id="ending">Suspending or ending access</h2>
      <p>An admin can suspend a staff member’s access at any time. We may suspend or end access for an organisation that breaks these terms.</p>

      <h2 id="liability">Our responsibility to you</h2>
      <p>
        We provide the service “as is”. We’re not responsible for how an organisation uses it, or for losses outside our reasonable
        control. Nothing in these terms limits our liability where the law does not allow it.
      </p>

      <h2 id="changes">Changes to these terms</h2>
      <p>If we change these terms, we’ll update this page and change the “last updated” date at the top.</p>

      <h2 id="contact">Contact us</h2>
      <p>For anything about these terms, contact the organisation running your event.</p>
    </LegalPage>
  );
}
