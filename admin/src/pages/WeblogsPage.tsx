import { PlusIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Weblog } from '../types';

export function WeblogsPage() {
  const [weblogs, setWeblogs] = useState<Weblog[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .weblogs()
      .then(setWeblogs)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Weblog</h1>
        <Link
          to="/weblogs/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-yt px-4 py-2 text-sm font-medium text-white hover:bg-yt-press"
        >
          <PlusIcon size={16} />
          Add post
        </Link>
      </div>
      {error ? <p className="mt-6 text-yt">{error}</p> : null}
      {weblogs && weblogs.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
          No posts yet. Add one to publish a page at its address.
        </p>
      ) : null}
      <ul className="mt-6 grid gap-3">
        {weblogs?.map((post) => (
          <li key={post.id}>
            <Link
              to={`/weblogs/${post.id}`}
              className="flex items-center gap-4 rounded-2xl bg-panel p-3 transition hover:bg-black/[0.06] dark:bg-panel-dark dark:hover:bg-white/10"
            >
              {post.mainImage ? (
                <img src={post.mainImage} alt="" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <span className="grid h-16 w-28 place-items-center rounded-lg bg-black/5 text-xs text-muted dark:bg-white/10 dark:text-muted-dark">
                  No image
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{post.title}</span>
                <span className="block truncate text-sm text-muted dark:text-muted-dark">
                  /{post.address}
                  {post.contentCount > 0
                    ? ` · ${post.contentCount} row${post.contentCount === 1 ? '' : 's'}`
                    : ''}
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  post.published
                    ? 'bg-yt/10 text-yt'
                    : 'bg-black/5 text-muted dark:bg-white/10 dark:text-muted-dark'
                }`}
              >
                {post.published ? 'Published' : 'Draft'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
