import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { pageMetadata } from '@/lib/site';

const description =
  'What Artified DIY stores when you browse or sign in, and what it does not.';

export const metadata = pageMetadata('Privacy', description, '/privacy');

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy" lede={description}>
      <p className="text-sm text-muted dark:text-muted-dark">
        Last updated September 29, 2026.
      </p>
      <InfoSection title="Accounts">
        <p>
          You can browse the site without an account. If you sign in with
          Google, we receive your name, email address, profile photo, and
          Google account id, and we store them so we can recognize you on later
          visits.
        </p>
        <p>
          Sign-in uses a session cookie named artified_session. It is HTTP-only,
          lasts seven days, and is cleared when you sign out. We do not ask for
          a password.
        </p>
      </InfoSection>
      <InfoSection title="What we do not do">
        <p>
          We do not sell personal information. This site does not run
          advertising or analytics cookies.
        </p>
      </InfoSection>
      <InfoSection title="Other sites">
        <p>
          Watch on YouTube leaves this site. YouTube’s privacy policy applies
          there.
        </p>
        <p>
          Tool and material links may go to retailers, which set their own
          cookies. Some of those links are affiliate links. See the{' '}
          <Link
            href="/affiliate-disclosure"
            className="font-medium text-yt hover:text-yt-press"
          >
            affiliate disclosure
          </Link>
          .
        </p>
      </InfoSection>
      <InfoSection title="Messages">
        <p>
          If you email us, we use your message and email address to reply. We
          do not add you to a mailing list.
        </p>
      </InfoSection>
      <InfoSection title="Children">
        <p>This site is not directed at children under 13.</p>
      </InfoSection>
    </InfoPage>
  );
}
