import { Tag, Video } from './types';

function internalApi() {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:2201'
  );
}

export async function getVideos(
  tag?: string,
): Promise<{ videos: Video[]; error: boolean }> {
  try {
    const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const response = await fetch(`${internalApi()}/videos${query}`, { cache: 'no-store' });
    if (!response.ok) {
      return { videos: [], error: true };
    }
    const videos = (await response.json()) as Video[];
    return { videos, error: false };
  } catch {
    return { videos: [], error: true };
  }
}

export async function getVideo(
  slug: string,
): Promise<{ video: Video | null; error: boolean }> {
  try {
    const response = await fetch(
      `${internalApi()}/videos/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );
    if (response.status === 404) {
      return { video: null, error: false };
    }
    if (!response.ok) {
      return { video: null, error: true };
    }
    const video = (await response.json()) as Video;
    return { video, error: false };
  } catch {
    return { video: null, error: true };
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${internalApi()}/tags`, { cache: 'no-store' });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as Tag[];
  } catch {
    return [];
  }
}
