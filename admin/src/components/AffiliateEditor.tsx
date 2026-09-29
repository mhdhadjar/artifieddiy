import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { AffiliateItem, emptyItem } from '../types';

export function AffiliateEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: AffiliateItem[];
  onChange: (items: AffiliateItem[]) => void;
}) {
  function update(index: number, patch: Partial<AffiliateItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem()])}
          className="inline-flex items-center gap-1 text-sm font-medium text-yt"
        >
          <PlusIcon size={16} />
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted dark:text-muted-dark">Nothing listed yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <li key={index} className="grid gap-2 rounded-xl bg-panel p-3 dark:bg-panel-dark sm:grid-cols-2">
              <input
                value={item.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="Name"
                className="field"
              />
              <input
                value={item.url}
                onChange={(event) => update(index, { url: event.target.value })}
                placeholder="Affiliate URL"
                className="field"
              />
              <input
                value={item.imageUrl}
                onChange={(event) => update(index, { imageUrl: event.target.value })}
                placeholder="Image URL (optional)"
                className="field"
              />
              <input
                value={item.note}
                onChange={(event) => update(index, { note: event.target.value })}
                placeholder="Note (optional)"
                className="field"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="inline-flex items-center gap-1 justify-self-start text-sm text-muted dark:text-muted-dark"
              >
                <TrashIcon size={16} />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
