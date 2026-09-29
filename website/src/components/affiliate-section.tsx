import { ArrowSquareOutIcon, LinkIcon } from '@phosphor-icons/react/ssr';
import { AffiliateItem } from '@/lib/types';

export function AffiliateSection({
  title,
  items,
}: {
  title: string;
  items: AffiliateItem[];
}) {
  const listed = items.filter((item) => item.name && item.url);
  if (listed.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-medium">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {listed.map((item) => (
          <li key={`${item.name}-${item.url}`}>
            <a
              href={item.url}
              target="_blank"
              rel="sponsored noreferrer noopener"
              className="flex items-center gap-4 rounded-2xl bg-panel p-3 transition hover:-translate-y-0.5 hover:bg-black/[0.06] dark:bg-panel-dark dark:hover:bg-white/10"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-yt/10 text-yt">
                  <LinkIcon size={22} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.name}</span>
                {item.note ? (
                  <span className="mt-1 block text-sm text-muted dark:text-muted-dark">
                    {item.note}
                  </span>
                ) : null}
              </span>
              <ArrowSquareOutIcon
                size={18}
                className="ml-auto shrink-0 text-muted dark:text-muted-dark"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
