import type { MetadataRoute } from 'next';
import { getTags, getVideos, getWeblogs } from '@/lib/api';
import { siteOrigin } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const [{ videos }, tags, weblogs] = await Promise.all([
    getVideos(),
    getTags(),
    getWeblogs(),
  ]);

  const pages: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${origin}/videos`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${origin}/about`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${origin}/contact`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${origin}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${origin}/affiliate-disclosure`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  for (const tag of tags) {
    pages.push({
      url: `${origin}/videos?tag=${encodeURIComponent(tag.slug)}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  for (const video of videos) {
    const published = new Date(video.publishedAt);
    pages.push({
      url: `${origin}/videos/${encodeURIComponent(video.slug)}`,
      lastModified: Number.isNaN(published.getTime()) ? undefined : published,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: video.thumbnail ? [video.thumbnail] : undefined,
    });
  }

  for (const post of weblogs) {
    const updated = new Date(post.updatedAt);
    pages.push({
      url: `${origin}/${encodeURIComponent(post.address)}`,
      lastModified: Number.isNaN(updated.getTime()) ? undefined : updated,
      changeFrequency: 'weekly',
      priority: 0.7,
      images: post.mainImage ? [post.mainImage] : undefined,
    });
  }

  return pages;
}
