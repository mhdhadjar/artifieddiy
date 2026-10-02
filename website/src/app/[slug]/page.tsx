import { Linkified } from '@/components/linkified';
import { WeblogBody } from '@/components/weblog-body';
import { getWeblog } from '@/lib/api';
import { plainText, siteName } from '@/lib/site';
import { YoutubeLogoIcon } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug.includes('.')) {
    return { title: 'Page' };
  }
  const { weblog } = await getWeblog(slug);
  if (!weblog) {
    return { title: 'Page' };
  }

  const description = plainText(weblog.description || weblog.title);
  const path = `/${weblog.address}`;
  const image = weblog.mainImage
    ? { url: weblog.mainImage, alt: weblog.title }
    : { url: '/logo.png', alt: siteName };

  return {
    title: weblog.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'article',
      title: weblog.title,
      description,
      url: path,
      siteName,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: weblog.title,
      description,
      images: [image.url],
    },
  };
}

export default async function WeblogPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug.includes('.')) {
    notFound();
  }

  const { weblog, error } = await getWeblog(slug);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted dark:text-muted-dark">
          This page could not be loaded right now.
        </p>
      </section>
    );
  }

  if (!weblog) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-medium leading-tight sm:text-4xl">{weblog.title}</h1>
      {weblog.description ? (
        <div className="mt-4 text-lg">
          <Linkified text={weblog.description} />
        </div>
      ) : null}
      {weblog.mainImage ? (
        <img
          src={weblog.mainImage}
          alt={weblog.title}
          className="mt-6 w-full rounded-3xl"
        />
      ) : null}
      <WeblogBody blocks={weblog.content} />
      {weblog.youtubeId ? (
        <div className="mt-10 overflow-hidden rounded-3xl bg-panel dark:bg-panel-dark">
          <iframe
            title={weblog.title}
            src={`https://www.youtube.com/embed/${weblog.youtubeId}`}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : weblog.youtubeUrl ? (
        <a
          href={weblog.youtubeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white transition hover:bg-yt-press"
        >
          <YoutubeLogoIcon size={18} weight="fill" />
          Watch on YouTube
        </a>
      ) : null}
    </article>
  );
}
