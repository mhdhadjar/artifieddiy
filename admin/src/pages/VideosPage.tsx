import { PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Video } from '../types';

export function VideosPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .videos()
      .then(setVideos)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Videos</h1>
        <Link
          to="/videos/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-yt px-4 py-2 text-sm font-medium text-white hover:bg-yt-press"
        >
          <PlusIcon size={16} />
          Add video
        </Link>
      </div>
      {error ? <p className="mt-6 text-yt">{error}</p> : null}
      {videos && videos.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
          No videos yet. Add one from a YouTube link.
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3">
        {videos?.map((video) => (
          <li key={video.id}>
            <Link
              to={`/videos/${video.id}`}
              className="flex items-center gap-4 rounded-2xl bg-panel p-3 transition hover:bg-black/[0.06] dark:bg-panel-dark dark:hover:bg-white/10"
            >
              <img src={video.thumbnail} alt="" className="h-16 w-28 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{video.title}</span>
                <span className="text-sm text-muted dark:text-muted-dark">
                  {video.slug}
                  {video.tags.length > 0
                    ? ` · ${video.tags.map((tag) => tag.name).join(', ')}`
                    : ''}
                  {(video.files?.length ?? 0) > 0
                    ? ` · ${video.files.length} file${video.files.length === 1 ? '' : 's'}`
                    : ''}
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  video.published
                    ? 'bg-yt/10 text-yt'
                    : 'bg-black/5 text-muted dark:bg-white/10 dark:text-muted-dark'
                }`}
              >
                {video.published ? 'Published' : 'Draft'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
