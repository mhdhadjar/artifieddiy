'use client';

import { PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { FormEvent, useState } from 'react';
import { contactEmail } from '@/lib/site';

const fieldClass =
  'w-full rounded-xl border border-black/10 bg-panel px-3 py-2.5 text-sm text-ink outline-none transition focus:border-yt dark:border-white/10 dark:bg-panel-dark dark:text-white';

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const body = [`Name: ${name}`, `Email: ${email}`, '', message].join('\n');
    const href = `mailto:${contactEmail}?subject=${encodeURIComponent(
      `Artified DIY — ${name}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
    window.location.href = href;
  }

  return (
    <form method="post" action="#" onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Name
        <input name="name" required autoComplete="name" className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Message
        <textarea
          name="message"
          required
          rows={6}
          className={fieldClass}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white transition hover:bg-yt-press"
        >
          <PaperPlaneTiltIcon size={16} />
          Send message
        </button>
        {sent ? (
          <p className="text-sm text-muted dark:text-muted-dark">
            Your email app should open with this message.
          </p>
        ) : null}
      </div>
    </form>
  );
}
