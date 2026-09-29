export function InfoPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-medium">{title}</h1>
      {lede ? (
        <p className="mt-3 text-lg text-muted dark:text-muted-dark">{lede}</p>
      ) : null}
      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-muted dark:text-muted-dark">
        {children}
      </div>
    </section>
  );
}
