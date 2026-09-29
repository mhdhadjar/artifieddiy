import { ArrowRightIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { Hero } from '@/components/hero';
import { VideoGrid } from '@/components/video-grid';
import { getVideos } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { videos, error } = await getVideos();

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-medium">Latest videos</h2>
          <Link
            href="/videos"
            className="inline-flex items-center gap-1 text-sm font-medium text-yt hover:text-yt-press"
          >
            View all
            <ArrowRightIcon size={16} />
          </Link>
        </div>
        {error ? (
          <p className="rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
            The video library is unavailable right now.
          </p>
        ) : (
          <VideoGrid videos={videos.slice(0, 6)} />
        )}
      </section>
    </>
  );
}
