import { AffiliateSection } from "@/components/affiliate-section";
import { Linkified } from "@/components/linkified";
import { ProjectFiles } from "@/components/project-files";
import { getVideo } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { plainText, siteName } from "@/lib/site";
import {
  ArrowLeftIcon,
  PlayIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { video } = await getVideo(slug);
  if (!video) {
    return { title: "Video" };
  }

  const description = plainText(video.description);
  const path = `/videos/${video.slug}`;
  const image = video.thumbnail
    ? { url: video.thumbnail, alt: video.title }
    : { url: "/logo.png", alt: siteName };

  return {
    title: video.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      url: path,
      siteName,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [image.url],
    },
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { slug } = await params;
  const { video, error } = await getVideo(slug);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted dark:text-muted-dark">
          This video could not be loaded right now.
        </p>
      </section>
    );
  }

  if (!video) {
    notFound();
  }

  const hasAffiliates = video.tools.length > 0 || video.materials.length > 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/videos"
        className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink dark:text-muted-dark dark:hover:text-white"
      >
        <ArrowLeftIcon size={16} />
        All videos
      </Link>
      <h1 className="mt-4 text-3xl font-medium leading-tight sm:text-4xl">
        {video.title}
      </h1>
      <p className="mt-3 text-sm text-muted dark:text-muted-dark">
        {formatDate(video.publishedAt)}
        {video.duration ? ` · ${video.duration}` : ""}
        {video.channelTitle ? ` · ${video.channelTitle}` : ""}
      </p>
      {video.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/videos?tag=${encodeURIComponent(tag.slug)}`}
                className="inline-block rounded-full bg-panel px-3 py-1 text-sm transition hover:bg-black/10 dark:bg-panel-dark dark:hover:bg-white/10"
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <a
        href={video.url}
        target="_blank"
        rel="noreferrer noopener"
        className="group relative mt-6 block overflow-hidden rounded-3xl bg-panel shadow-sm dark:bg-panel-dark"
      >
        <img
          src={video.thumbnail}
          alt=""
          className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-yt text-white shadow-lg transition group-hover:scale-110 group-hover:bg-yt-press">
            <PlayIcon
              size={28}
              weight="fill"
              className=" text-shadow-2xs "
              aria-hidden
            />
          </span>
        </span>
      </a>

      <a
        href={video.url}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white transition hover:bg-yt-press"
      >
        <YoutubeLogoIcon size={18} weight="fill" />
        Watch on YouTube
      </a>

      {video.description ? (
        <div className="mt-8">
          <Linkified text={video.description} />
        </div>
      ) : null}

      <ProjectFiles slug={video.slug} files={video.files ?? []} />

      {hasAffiliates ? (
        <div className="mt-12 grid gap-10">
          <AffiliateSection
            title="Tools used in this video"
            items={video.tools}
          />
          <AffiliateSection
            title="Materials used in this video"
            items={video.materials}
          />
          <p className="text-sm text-muted dark:text-muted-dark">
            Some links are affiliate links. Artified DIY may earn a commission
            if you buy through them, at no extra cost to you.{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-medium text-yt hover:text-yt-press"
            >
              Affiliate disclosure
            </Link>
          </p>
        </div>
      ) : null}
    </article>
  );
}
