import type { Metadata } from 'next';
import Link from 'next/link';
import { VideoGrid } from '@/components/video-grid';
import { getTags, getVideos } from '@/lib/api';
import { siteName } from '@/lib/site';

export const dynamic = 'force-dynamic';

const description = 'Every build, linked through to YouTube.';

export const metadata: Metadata = {
  title: 'Videos',
  description,
  alternates: {
    canonical: '/videos',
  },
  openGraph: {
    type: 'website',
    siteName,
    title: `Videos · ${siteName}`,
    description,
    url: '/videos',
    images: [{ url: '/logo.png', alt: siteName }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Videos · ${siteName}`,
    description,
    images: ['/logo.png'],
  },
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const params = await searchParams;
  const tagSlug = typeof params.tag === 'string' ? params.tag : undefined;
  const [{ videos, error }, tags] = await Promise.all([
    getVideos(tagSlug),
    getTags(),
  ]);
  const active = tags.find((tag) => tag.slug === tagSlug);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-medium">{active ? active.name : 'Videos'}</h1>
      <p className="mt-2 text-muted dark:text-muted-dark">
        {active
          ? `Builds tagged ${active.name}.`
          : 'Every build, linked through to YouTube.'}
      </p>
      {tags.length > 0 ? (
        <ul className="mt-6 mb-8 flex flex-wrap gap-2">
          <li>
            <Link href="/videos" className={chipClass(!active)}>
              All
            </Link>
          </li>
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/videos?tag=${encodeURIComponent(tag.slug)}`}
                className={chipClass(active?.id === tag.id)}
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-8" />
      )}
      {error ? (
        <p className="rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
          The video library is unavailable right now.
        </p>
      ) : videos.length === 0 && active ? (
        <p className="rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
          No videos tagged {active.name} yet.
        </p>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </section>
  );
}

function chipClass(active: boolean) {
  return active
    ? 'inline-block rounded-full bg-ink px-3 py-1 text-sm text-white dark:bg-white dark:text-ink'
    : 'inline-block rounded-full bg-panel px-3 py-1 text-sm transition hover:bg-black/10 dark:bg-panel-dark dark:hover:bg-white/10';
}
