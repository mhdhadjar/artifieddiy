import type { Metadata } from 'next';

export const siteName = 'Artified DIY';

export const siteDescription =
  'Projects, tools, and the materials behind every build.';

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@artifieddiy.com';

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName,
      title: `${title} · ${siteName}`,
      description,
      url: path,
      images: [{ url: '/logo.png', alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${siteName}`,
      description,
      images: ['/logo.png'],
    },
  };
}

export function siteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.WEB_ORIGIN || '';
  const origin = configured.replace(/\/$/, '');
  return origin || 'http://localhost:2202';
}

export function plainText(value: string, max = 200): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}
