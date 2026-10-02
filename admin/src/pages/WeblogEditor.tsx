import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  FloppyDiskIcon,
  ImageIcon,
  PlusIcon,
  TextTIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, webUrl } from '../api';
import { WeblogBlock } from '../types';

type ContentRow = WeblogBlock & { key: string };

type FormState = {
  title: string;
  address: string;
  description: string;
  youtubeUrl: string;
  mainImage: string;
  content: ContentRow[];
  published: boolean;
};

const emptyForm: FormState = {
  title: '',
  address: '',
  description: '',
  youtubeUrl: '',
  mainImage: '',
  content: [],
  published: false,
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function toAddress(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function cleanAddressInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 80);
}

function row(type: ContentRow['type']): ContentRow {
  return {
    key: crypto.randomUUID(),
    type,
    markdown: '',
    imageUrl: '',
    alt: '',
  };
}

export function WeblogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const addressTouched = useRef(editing);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!id) return;
    addressTouched.current = true;
    api
      .weblog(id)
      .then((post) => {
        addressTouched.current = true;
        setForm({
          title: post.title,
          address: post.address,
          description: post.description,
          youtubeUrl: post.youtubeUrl,
          mainImage: post.mainImage,
          content: post.content.map((block) => ({ ...block, key: crypto.randomUUID() })),
          published: post.published,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function onTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      address: addressTouched.current ? current.address : toAddress(title),
    }));
  }

  function onAddress(value: string) {
    const address = cleanAddressInput(value);
    addressTouched.current = address.length > 0;
    setForm((current) => ({
      ...current,
      address: address || toAddress(current.title),
    }));
    if (!address) {
      addressTouched.current = false;
    }
  }

  function updateRow(key: string, partial: Partial<ContentRow>) {
    setForm((current) => ({
      ...current,
      content: current.content.map((block) =>
        block.key === key ? { ...block, ...partial } : block,
      ),
    }));
  }

  function moveRow(index: number, direction: -1 | 1) {
    setForm((current) => {
      const next = index + direction;
      if (next < 0 || next >= current.content.length) {
        return current;
      }
      const content = current.content.slice();
      const [item] = content.splice(index, 1);
      content.splice(next, 0, item);
      return { ...current, content };
    });
  }

  function removeRow(key: string) {
    setForm((current) => ({
      ...current,
      content: current.content.filter((block) => block.key !== key),
    }));
  }

  async function upload(file: File, target: string) {
    if (file.type && !IMAGE_TYPES.includes(file.type)) {
      setError('Upload a JPG, PNG, WEBP, or GIF image');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 8 MB or smaller');
      return;
    }
    setError('');
    setUploading(target);
    try {
      const uploaded = await api.uploadWeblogImage(file);
      if (target === 'main') {
        patch({ mainImage: uploaded.url });
      } else {
        updateRow(target, { imageUrl: uploaded.url });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the image');
    } finally {
      setUploading('');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.content.some((block) => block.type === 'image' && !block.imageUrl)) {
      setError('Each image row needs an image');
      return;
    }
    const payload = {
      title: form.title.trim(),
      address: toAddress(form.address),
      description: form.description,
      youtubeUrl: form.youtubeUrl.trim(),
      mainImage: form.mainImage,
      published: form.published,
      content: form.content
        .filter((block) => block.type === 'image' || block.markdown.trim())
        .map(({ type, markdown, imageUrl, alt }) => ({
          type,
          markdown,
          imageUrl,
          alt,
        })),
    };
    setBusy(true);
    try {
      const saved =
        editing && id ? await api.updateWeblog(id, payload) : await api.createWeblog(payload);
      if (!editing) {
        navigate(`/weblogs/${saved.id}`);
        return;
      }
      addressTouched.current = true;
      patch({ address: saved.address });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the post');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm('Delete this weblog post?')) return;
    setBusy(true);
    try {
      await api.removeWeblog(id);
      navigate('/weblogs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the post');
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted dark:text-muted-dark">Loading post…</p>;
  }

  const pageUrl = form.address ? `${webUrl()}/${form.address}` : '';

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">{editing ? 'Edit post' : 'Add post'}</h1>
        <Link
          to="/weblogs"
          className="inline-flex items-center gap-1 text-sm text-muted dark:text-muted-dark"
        >
          <ArrowLeftIcon size={16} />
          Back
        </Link>
      </div>

      <label className="grid gap-2 text-sm">
        Title
        <input
          value={form.title}
          onChange={(event) => onTitle(event.target.value)}
          className="field"
          required
          maxLength={200}
        />
      </label>

      <label className="grid gap-2 text-sm">
        Address
        <input
          value={form.address}
          onChange={(event) => onAddress(event.target.value)}
          onBlur={() => patch({ address: toAddress(form.address) })}
          placeholder="how-to-make-a-halloween-decoration"
          className="field"
          required
          maxLength={80}
        />
        <span className="text-muted dark:text-muted-dark">
          {pageUrl ? `Public page: ${pageUrl}` : 'Filled from the title. You can change it.'}
        </span>
      </label>

      <label className="grid gap-2 text-sm">
        Description
        <textarea
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          rows={4}
          maxLength={5000}
          className="field"
        />
      </label>

      <label className="grid gap-2 text-sm">
        YouTube link
        <input
          value={form.youtubeUrl}
          onChange={(event) => patch({ youtubeUrl: event.target.value })}
          placeholder="https://www.youtube.com/watch?v=…"
          className="field"
        />
      </label>

      <div className="grid gap-2 text-sm">
        <span>Main image</span>
        {form.mainImage ? (
          <img src={form.mainImage} alt="" className="w-full max-w-md rounded-2xl object-cover" />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-ink">
            <ImageIcon size={16} />
            {uploading === 'main' ? 'Uploading…' : form.mainImage ? 'Replace image' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={Boolean(uploading)}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void upload(file, 'main');
              }}
            />
          </label>
          {form.mainImage ? (
            <button
              type="button"
              onClick={() => patch({ mainImage: '' })}
              className="text-sm text-yt"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Content</h2>
            <p className="mt-1 text-sm text-muted dark:text-muted-dark">
              Each block is one row on the page.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => patch({ content: [...form.content, row('markdown')] })}
              className="inline-flex items-center gap-1 text-sm font-medium text-yt"
            >
              <TextTIcon size={16} />
              Add markdown
            </button>
            <button
              type="button"
              onClick={() => patch({ content: [...form.content, row('image')] })}
              className="inline-flex items-center gap-1 text-sm font-medium text-yt"
            >
              <PlusIcon size={16} />
              Add image
            </button>
          </div>
        </div>

        {form.content.length === 0 ? (
          <p className="mt-4 text-sm text-muted dark:text-muted-dark">No rows yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {form.content.map((block, index) => (
              <li key={block.key} className="grid gap-3 rounded-xl bg-panel p-3 dark:bg-panel-dark">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {block.type === 'markdown' ? 'Markdown' : 'Image'} {index + 1}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => moveRow(index, -1)}
                      className="text-muted disabled:opacity-30 dark:text-muted-dark"
                    >
                      <ArrowUpIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === form.content.length - 1}
                      onClick={() => moveRow(index, 1)}
                      className="text-muted disabled:opacity-30 dark:text-muted-dark"
                    >
                      <ArrowDownIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove row"
                      onClick={() => removeRow(block.key)}
                      className="text-yt"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
                {block.type === 'markdown' ? (
                  <textarea
                    value={block.markdown}
                    onChange={(event) => updateRow(block.key, { markdown: event.target.value })}
                    rows={8}
                    placeholder="Write this row in markdown"
                    className="field font-mono text-sm"
                  />
                ) : (
                  <div className="grid gap-2">
                    {block.imageUrl ? (
                      <img src={block.imageUrl} alt="" className="max-h-64 w-full rounded-xl object-cover" />
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-yt">
                        <ImageIcon size={16} />
                        {uploading === block.key
                          ? 'Uploading…'
                          : block.imageUrl
                            ? 'Replace image'
                            : 'Upload image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          disabled={Boolean(uploading)}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file) void upload(file, block.key);
                          }}
                        />
                      </label>
                    </div>
                    <input
                      value={block.alt}
                      onChange={(event) => updateRow(block.key, { alt: event.target.value })}
                      placeholder="Image description"
                      maxLength={300}
                      className="field"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
          disabled={busy || Boolean(uploading)}
          className="inline-flex items-center gap-1.5 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white hover:bg-yt-press disabled:opacity-50"
        >
          <FloppyDiskIcon size={16} />
          Save
        </button>
        {editing && form.address ? (
          <a
            href={pageUrl}
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
