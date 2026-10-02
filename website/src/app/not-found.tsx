import { HouseIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-medium">Page not found</h1>
      <p className="mt-3 text-muted dark:text-muted-dark">
        That page is not on Artified DIY.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white"
      >
        <HouseIcon size={16} />
        Back home
      </Link>
    </section>
  );
}
