const URL_RE = /(https?:\/\/[^\s]+)/g;

export function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink/90 dark:text-white/90">
      {parts.map((part, index) =>
        part.startsWith('http') ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="text-yt underline-offset-2 hover:underline"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}
