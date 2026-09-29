import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import { Tag } from '../types';

export function TagsPage() {
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .tags()
      .then(setTags)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    setError('');
    setBusy(true);
    try {
      const created = await api.createTag(next);
      setTags((current) => sortTags([...(current ?? []), created]));
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the tag');
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string, nextName: string) {
    setError('');
    setBusy(true);
    try {
      const updated = await api.updateTag(id, nextName);
      setTags((current) =>
        sortTags((current ?? []).map((tag) => (tag.id === id ? updated : tag))),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename the tag');
    } finally {
      setBusy(false);
    }
  }

  async function remove(tag: Tag) {
    if (!window.confirm(`Delete “${tag.name}”? It will be removed from every video.`)) {
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.removeTag(tag.id);
      setTags((current) => (current ?? []).filter((item) => item.id !== tag.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the tag');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-medium">Tags</h1>
      <p className="mt-2 text-sm text-muted dark:text-muted-dark">
        Define tags here, then set them on a video.
      </p>

      <form onSubmit={(event) => void add(event)} className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New tag"
          maxLength={40}
          className="field max-w-sm"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-yt px-4 py-2 text-sm font-medium text-white hover:bg-yt-press disabled:opacity-50"
        >
          <PlusIcon size={16} />
          Add
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-yt">{error}</p> : null}

      {tags && tags.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
          No tags yet.
        </p>
      ) : null}

      <ul className="mt-6 grid gap-2">
        {tags?.map((tag) => (
          <TagRow key={tag.id} tag={tag} busy={busy} onRename={rename} onDelete={remove} />
        ))}
      </ul>
    </section>
  );
}

function TagRow({
  tag,
  busy,
  onRename,
  onDelete,
}: {
  tag: Tag;
  busy: boolean;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (tag: Tag) => Promise<void>;
}) {
  const [name, setName] = useState(tag.name);

  useEffect(() => {
    setName(tag.name);
  }, [tag.name]);

  function commit() {
    const next = name.trim();
    if (!next || next === tag.name) {
      setName(tag.name);
      return;
    }
    void onRename(tag.id, next);
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-panel p-3 dark:bg-panel-dark">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        maxLength={40}
        aria-label={`Rename ${tag.name}`}
        className="field"
      />
      <span className="hidden shrink-0 text-sm text-muted sm:inline dark:text-muted-dark">
        {tag.slug}
      </span>
      <button
        type="button"
        onClick={() => void onDelete(tag)}
        disabled={busy}
        aria-label={`Delete ${tag.name}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm text-yt disabled:opacity-50"
      >
        <TrashIcon size={16} />
        Delete
      </button>
    </li>
  );
}

function sortTags(tags: Tag[]) {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name));
}
