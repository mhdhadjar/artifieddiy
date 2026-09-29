import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  FloppyDiskIcon,
  TrashIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, webUrl } from '../api';
import { AffiliateEditor } from '../components/AffiliateEditor';
import { FileManager } from '../components/FileManager';
import { AffiliateItem, ProjectFile, Tag } from '../types';

type FormState = {
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  slug: string;
  published: boolean;
  tools: AffiliateItem[];
  materials: AffiliateItem[];
  tagIds: string[];
  files: ProjectFile[];
};

const emptyForm: FormState = {
  youtubeUrl: '',
  youtubeId: '',
  title: '',
  description: '',
  thumbnail: '',
  publishedAt: '',
  duration: '',
  channelTitle: '',
  slug: '',
  published: false,
  tools: [],
  materials: [],
  tagIds: [],
  files: [],
};

function toLocalInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function VideoEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    api
      .tags()
      .then(setTags)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .video(id)
      .then((video) => {
        setForm({
          youtubeUrl: video.url,
          youtubeId: video.youtubeId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          publishedAt: toLocalInput(video.publishedAt),
          duration: video.duration,
          channelTitle: video.channelTitle,
          slug: video.slug,
          published: video.published,
          tools: video.tools,
          materials: video.materials,
          tagIds: video.tags.map((tag) => tag.id),
          files: video.files ?? [],
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function fetchMetadata() {
    setError('');
    setBusy(true);
    try {
      const preview = await api.preview(form.youtubeUrl);
      patch({
        youtubeId: preview.youtubeId,
        youtubeUrl: preview.url,
        title: preview.title,
        description: preview.description,
        thumbnail: preview.thumbnail,
        publishedAt: toLocalInput(preview.publishedAt),
        duration: preview.duration,
        channelTitle: preview.channelTitle,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch the video');
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.youtubeId) {
      setError('Fetch the YouTube link before saving.');
      return;
    }
    const payload = {
      youtubeId: form.youtubeId,
      title: form.title,
      description: form.description,
      thumbnail: form.thumbnail,
      publishedAt: new Date(form.publishedAt).toISOString(),
      duration: form.duration,
      channelTitle: form.channelTitle,
      published: form.published,
      tools: form.tools.filter((item) => item.name.trim() && item.url.trim()),
      materials: form.materials.filter((item) => item.name.trim() && item.url.trim()),
      tagIds: form.tagIds,
      ...(editing && form.slug ? { slug: form.slug } : {}),
    };
    setBusy(true);
    try {
      const saved = editing && id ? await api.update(id, payload) : await api.create(payload);
      navigate(`/videos/${saved.id}`);
      if (!editing) return;
      patch({ slug: saved.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the video');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm('Delete this video page?')) return;
    setBusy(true);
    try {
      await api.remove(id);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the video');
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted dark:text-muted-dark">Loading video…</p>;
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">{editing ? 'Edit video' : 'Add video'}</h1>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted dark:text-muted-dark"
        >
          <ArrowLeftIcon size={16} />
          Back
        </Link>
      </div>

      <label className="grid gap-2 text-sm">
        YouTube link
        <div className="flex gap-2">
          <input
            value={form.youtubeUrl}
            onChange={(event) => patch({ youtubeUrl: event.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            className="field flex-1"
          />
          <button
            type="button"
            onClick={() => void fetchMetadata()}
            disabled={busy || !form.youtubeUrl}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-ink"
          >
            <YoutubeLogoIcon size={16} weight="fill" />
            Fetch
          </button>
        </div>
      </label>

      {form.thumbnail ? (
        <img src={form.thumbnail} alt="" className="aspect-video w-full max-w-md rounded-2xl object-cover" />
      ) : null}

      <label className="grid gap-2 text-sm">
        Title
        <input value={form.title} onChange={(event) => patch({ title: event.target.value })} className="field" required />
      </label>
      <label className="grid gap-2 text-sm">
        Description
        <textarea
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          rows={8}
          className="field"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Published date
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(event) => patch({ publishedAt: event.target.value })}
            className="field"
            required
          />
        </label>
        <label className="grid gap-2 text-sm">
          Duration
          <input value={form.duration} onChange={(event) => patch({ duration: event.target.value })} className="field" />
        </label>
        <label className="grid gap-2 text-sm">
          Channel
          <input value={form.channelTitle} onChange={(event) => patch({ channelTitle: event.target.value })} className="field" />
        </label>
        <label className="grid gap-2 text-sm">
          Thumbnail URL
          <input value={form.thumbnail} onChange={(event) => patch({ thumbnail: event.target.value })} className="field" required />
        </label>
      </div>
      {editing ? (
        <label className="grid gap-2 text-sm">
          Slug
          <input value={form.slug} onChange={(event) => patch({ slug: event.target.value })} className="field" />
        </label>
      ) : null}

      <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Tags</h2>
          <Link to="/tags" className="text-sm font-medium text-yt">
            Define tags
          </Link>
        </div>
        {tags.length === 0 ? (
          <p className="mt-3 text-sm text-muted dark:text-muted-dark">
            No tags yet. Define some, then set them on this video.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    patch({
                      tagIds: selected
                        ? form.tagIds.filter((id) => id !== tag.id)
                        : [...form.tagIds, tag.id],
                    })
                  }
                  className={`rounded-full px-3 py-1 text-sm ${
                    selected
                      ? 'bg-ink text-white dark:bg-white dark:text-ink'
                      : 'bg-panel text-ink dark:bg-panel-dark dark:text-white'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <AffiliateEditor title="Tools used in this video" items={form.tools} onChange={(tools) => patch({ tools })} />
      <AffiliateEditor
        title="Materials used in this video"
        items={form.materials}
        onChange={(materials) => patch({ materials })}
      />
      <FileManager
        videoId={id}
        files={form.files}
        onChange={(files) => patch({ files })}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => patch({ published: event.target.checked })}
        />
        Published on the website
      </label>

      {error ? <p className="text-sm text-yt">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white hover:bg-yt-press disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} />
          Save
        </button>
        {editing && form.slug ? (
          <a
            href={`${webUrl()}/videos/${form.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted dark:text-muted-dark"
          >
            <ArrowSquareOutIcon size={16} />
            Open page
          </a>
        ) : null}
        {editing ? (
          <button
            type="button"
            onClick={() => void remove()}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-yt"
          >
            <TrashIcon size={16} />
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
