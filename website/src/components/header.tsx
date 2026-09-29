"use client";

import { adminAppUrl } from "@/lib/format";
import {
  PlayIcon,
  ShieldCheckIcon,
  SignInIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useSession } from "./session";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const params = useSearchParams();
  const headerRef = useRef<HTMLElement>(null);
  const { user, ready, signIn, logout } = useSession();
  const authFailed = params.get("auth") === "failed";

  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${node.getBoundingClientRect().height}px`,
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-b border-black/10 bg-paper/80 backdrop-blur-xl dark:border-white/10 dark:bg-ink/80"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-medium"
        >
          <img
            src="/logo-circular.png"
            alt=""
            className="h-10 w-10 object-contain"
          />
          <img
            src="/artified-diy-type.svg"
            alt=""
            className="h-6 sm:h-8 -mb-1"
          />
        </Link>
        <nav className="ml-2 hidden sm:flex border rounded-full px-2 py-1 border-gray-500/30">
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink dark:text-muted-dark dark:hover:text-white"
          >
            <PlayIcon size={16} weight="fill" />
            Videos
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:flex" />
          {!ready ? (
            <span className="inline-block h-8 w-20" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <a
                  href={adminAppUrl()}
                  className="hidden items-center gap-1.5 text-sm font-medium text-yt sm:inline-flex"
                >
                  <ShieldCheckIcon size={16} weight="fill" />
                  Admin
                </a>
              )}
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full"
                />
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink dark:text-muted-dark dark:hover:text-white"
              >
                <SignOutIcon size={16} />
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="inline-flex items-center gap-1.5 rounded-full bg-yt px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-yt-press"
            >
              <SignInIcon size={16} />
              Sign in
            </button>
          )}
        </div>
      </div>
      {authFailed && (
        <p className="border-t border-yt/20 bg-yt/10 px-4 py-2 text-center text-sm text-yt-press dark:text-yt">
          Google sign-in did not finish. Check the API credentials and try
          again.
        </p>
      )}
    </header>
  );
}
