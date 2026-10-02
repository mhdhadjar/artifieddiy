import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import type { WeblogBlock } from '@/lib/types';

function safeHref(href?: string) {
  if (!href) return undefined;
  if (href.startsWith('#') || href.startsWith('/')) return href;
  try {
    const url = new URL(href);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function safeImage(src?: string | Blob) {
  if (typeof src !== 'string') return undefined;
  try {
    const url = new URL(src);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return src;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const components: Components = {
  h1: ({ children }) => <h2 className="text-2xl font-medium leading-tight">{children}</h2>,
  h2: ({ children }) => <h2 className="text-2xl font-medium leading-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-medium leading-tight">{children}</h3>,
  p: ({ children }) => <p>{children}</p>,
  a: ({ href, children }) => {
    const safe = safeHref(href);
    if (!safe) {
      return <span>{children}</span>;
    }
    const external = safe.startsWith('http');
    return (
      <a
        href={safe}
        className="font-medium text-yt underline-offset-2 hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-black/15 pl-4 text-muted dark:border-white/20 dark:text-muted-dark">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-2xl bg-panel p-4 text-sm leading-6 dark:bg-panel-dark">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-black/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10">
        {children}
      </code>
    ),
  img: ({ src, alt }) => {
    const image = safeImage(src);
    if (!image) return null;
    return <img src={image} alt={alt ?? ''} className="w-full rounded-3xl" />;
  },
};

export function WeblogBody({ blocks }: { blocks: WeblogBlock[] }) {
  return (
    <div className="mt-10 grid gap-8">
      {blocks.map((block, index) => {
        if (block.type === 'image') {
          const image = safeImage(block.imageUrl);
          if (!image) return null;
          return (
            <img
              key={`${block.type}-${index}`}
              src={image}
              alt={block.alt}
              className="w-full rounded-3xl"
            />
          );
        }
        if (!block.markdown.trim()) return null;
        return (
          <div
            key={`${block.type}-${index}`}
            className="grid gap-4 text-[15px] leading-7 text-ink/90 dark:text-white/90"
          >
            <ReactMarkdown components={components}>{block.markdown}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
