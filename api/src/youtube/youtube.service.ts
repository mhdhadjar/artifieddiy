import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  extractYoutubeId,
  formatIsoDuration,
  watchUrl,
} from '../common/slug';

type YoutubeThumbnail = { url?: string };
type YoutubeVideo = {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: Record<string, YoutubeThumbnail>;
  };
  contentDetails?: {
    duration?: string;
  };
};

export type YoutubePreview = {
  youtubeId: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
};

@Injectable()
export class YoutubeService {
  constructor(private readonly config: ConfigService) {}

  async preview(input: string): Promise<YoutubePreview> {
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('YouTube API key is not configured');
    }

    const youtubeId = extractYoutubeId(input);
    if (!youtubeId) {
      throw new BadRequestException('Paste a YouTube video link');
    }

    const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
    endpoint.searchParams.set('part', 'snippet,contentDetails');
    endpoint.searchParams.set('id', youtubeId);
    endpoint.searchParams.set('key', apiKey);

    let payload: { items?: YoutubeVideo[] };
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`YouTube responded with ${response.status}`);
      }
      payload = (await response.json()) as { items?: YoutubeVideo[] };
    } catch {
      throw new BadGatewayException('Could not load this video from YouTube');
    }

    const item = payload.items?.[0];
    const snippet = item?.snippet;
    if (!item || !snippet?.title || !snippet.publishedAt) {
      throw new BadRequestException('YouTube video was not found');
    }

    const thumbnail = this.bestThumbnail(snippet.thumbnails);
    if (!thumbnail) {
      throw new BadGatewayException('YouTube did not return a thumbnail');
    }

    return {
      youtubeId,
      url: watchUrl(youtubeId),
      title: snippet.title,
      description: snippet.description ?? '',
      thumbnail,
      publishedAt: snippet.publishedAt,
      duration: formatIsoDuration(item.contentDetails?.duration ?? ''),
      channelTitle: snippet.channelTitle ?? '',
    };
  }

  private bestThumbnail(
    thumbnails?: Record<string, YoutubeThumbnail>,
  ): string | null {
    if (!thumbnails) {
      return null;
    }
    for (const key of ['maxres', 'standard', 'high', 'medium', 'default']) {
      const url = thumbnails[key]?.url;
      if (url) {
        return url;
      }
    }
    return null;
  }
}
