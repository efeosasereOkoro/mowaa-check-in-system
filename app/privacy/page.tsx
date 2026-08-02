import type { Metadata } from 'next';
import LegalPage from '@/components/legal-page';

// Update this whenever the content below changes.
const LAST_UPDATED = '31 July 2026';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How SmartTag Check-In collects, uses and protects personal information.',
};

const contents = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What information we collect' },
  { id: 'why', label: 'Why we collect it' },
  { id: 'who-can-see', label: 'Who can see it' },
  { id: 'sharing', label: 'Who we share it with' },
  { id: 'retention', label: 'How long we keep it' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'security', label: 'How we keep it safe' },
  { id: 'children', label: 'Children’s information' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'contact', label: 'How to contact us or complain' },
  { id: 'changes', label: 'Changes to this notice' },
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" lastUpdated={LAST_UPDATED} contents={contents}>
      <h2 id="who-we-are">Who we are</h2>
      <p>SmartTag Check-In helps organisations — like camps, kids’ events, schools and churches — check children in and out safely.</p>
      <p>This notice explains what personal information we hold, why we hold it, and what you can do about it.</p>
      <p>
        Your organisation decides what to collect and why. SmartTag Check-In stores and processes it on their behalf. If you have a
        question about a particular child’s records, contact the organisation running the event.
      </p>

      <h2 id="what-we-collect">What information we collect</h2>
      <p>About each child:</p>
      <ul>
        <li>their name and age</li>
        <li>their guardian’s name and phone number</li>
        <li>their home address, if the organisation adds it</li>
        <li>health or medical details, such as allergies or conditions</li>
        <li>a check-in and check-out record — the times, and who collected them</li>
        <li>a tag number and QR code we generate to identify them</li>
      </ul>
      <p>About staff who use the system:</p>
      <ul>
        <li>their name, email address and role — for example receptionist, health officer or admin</li>
      </ul>
      <p>We do not collect payment details.</p>

      <h2 id="why">Why we collect it</h2>
      <p>We use this information to:</p>
      <ul>
        <li>know who is on site and who has been collected</li>
        <li>keep children safe</li>
        <li>record medical needs and any incidents</li>
        <li>let an organisation see attendance and export reports</li>
      </ul>
      <p>
        Health and medical details are <strong>special category information</strong>. We only hold them where the organisation has a
        clear reason and the guardian’s consent.
      </p>

      <h2 id="who-can-see">Who can see it</h2>
      <p>People see only what their role needs:</p>
      <ul>
        <li>
          <strong>Reception</strong> — a child’s name, age, tag, status, guardian name and phone. Not the home address or any health
          details.
        </li>
        <li>
          <strong>Health officer</strong> — health and medical details, but not the home address.
        </li>
        <li>
          <strong>Admin</strong> — everything for their own organisation, including reports.
        </li>
      </ul>
      <p>These limits are enforced by the database, not just hidden on screen. Someone from one organisation can never see another organisation’s information.</p>

      <h2 id="sharing">Who we share it with</h2>
      <p>We do not sell your information. We share it only with the services that run the app for us:</p>
      <ul>
        <li><strong>Vercel</strong> — hosts the website</li>
        <li><strong>Neon</strong> — stores the database</li>
      </ul>
      <p>These providers process information on our instructions. We protect information in transit with HTTPS, and the database is encrypted.</p>

      <h2 id="retention">How long we keep it</h2>
      <p>
        We keep information for as long as the organisation needs it to run their event and meet their record-keeping duties. Ask the
        organisation about their retention period. When it’s no longer needed, it is deleted.
      </p>

      <h2 id="your-rights">Your rights</h2>
      <p>You can ask to:</p>
      <ul>
        <li>see the information we hold about you or your child</li>
        <li>correct it if it’s wrong</li>
        <li>delete it</li>
        <li>limit or object to how it’s used</li>
        <li>get a copy to move elsewhere</li>
      </ul>
      <p>To use any of these rights, contact the organisation running the event. They’ll normally respond within one month.</p>

      <h2 id="security">How we keep it safe</h2>
      <p>
        We limit access by role, encrypt the database, use HTTPS, and keep an append-only record of check-ins and medical notes so they
        can’t be quietly changed. Only vetted staff get access.
      </p>

      <h2 id="children">Children’s information</h2>
      <p>Most of the information in SmartTag Check-In is about children. We take extra care with it. Home addresses and health details are locked to the roles that need them.</p>

      <h2 id="cookies">Cookies</h2>
      <p>We use one essential cookie to keep you signed in. We don’t use advertising or tracking cookies.</p>

      <h2 id="contact">How to contact us or complain</h2>
      <p>Contact the organisation running your event first.</p>
      <p>
        If you’re not happy with how your information has been handled, you can complain to your data protection regulator. In Nigeria
        this is the Nigeria Data Protection Commission (NDPC). If the UK GDPR applies to you, contact the Information Commissioner’s
        Office (ICO).
      </p>

      <h2 id="changes">Changes to this notice</h2>
      <p>If we change how we collect or use information, we’ll update this page and change the “last updated” date at the top.</p>
    </LegalPage>
  );
}
