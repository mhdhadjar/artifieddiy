import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { contactEmail, pageMetadata } from '@/lib/site';

const description =
  'Some product links on Artified DIY are affiliate links. You do not pay extra.';

export const metadata = pageMetadata(
  'Affiliate Disclosure',
  description,
  '/affiliate-disclosure',
);

export default function AffiliateDisclosurePage() {
  return (
    <InfoPage title="Affiliate Disclosure" lede={description}>
      <InfoSection title="Commissions">
        <p>
          Artified DIY may earn a commission when you buy through an affiliate
          link on this site. The price you pay is the retailer’s price.
        </p>
        <p>
          Those links use a sponsored relationship so browsers and readers can
          tell them apart from ordinary links.
        </p>
      </InfoSection>
      <InfoSection title="Where they appear">
        <p>
          Video pages list tools and materials from that build. Some of those
          product links are affiliate links. A short note on the page says so
          when a list includes them.
        </p>
      </InfoSection>
      <InfoSection title="How items are chosen">
        <p>
          The lists are the tools and materials from the project. A commission
          does not change which items are listed or what the video says about
          them. Prices and availability come from the retailer and can change.
        </p>
        <p>
          If a link is wrong, write to{' '}
          <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-yt hover:text-yt-press"
          >
            {contactEmail}
          </a>{' '}
          or use the{' '}
          <Link href="/contact" className="font-medium text-yt hover:text-yt-press">
            contact page
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
