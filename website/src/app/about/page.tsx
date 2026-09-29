import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { pageMetadata } from '@/lib/site';

const description =
  'Artified DIY is the home for the builds, tools, and materials from the channel.';

export const metadata = pageMetadata('About', description, '/about');

export default function AboutPage() {
  return (
    <InfoPage title="About" lede={description}>
      <InfoSection title="What this site is">
        <p>
          Each video page points to the YouTube build and lists the tools and
          materials used in it. The point is to watch the project, then find
          the parts without digging through a description.
        </p>
        <p>
          Browsing does not require an account. Sign in with Google to download
          project files.
        </p>
      </InfoSection>
      <InfoSection title="Links on video pages">
        <p>
          Tool and material links go to the products from that build. Some of
          them are affiliate links. Read the{' '}
          <Link href="/affiliate-disclosure" className="font-medium text-yt hover:text-yt-press">
            affiliate disclosure
          </Link>{' '}
          for how that works.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
