import {
  ArrowSquareOutIcon,
  NewspaperIcon,
  PlayIcon,
  SignOutIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api, webUrl } from '../api';
import { SessionUser } from '../types';
import { ThemeToggle } from './ThemeToggle';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'font-medium' : 'text-muted dark:text-muted-dark';
}

export function Shell({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  async function logout() {
    await api.logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <img src="/logo-circular.png" alt="" className="h-10 w-10 object-contain" />
          <div>
            <Link to="/" className="font-medium">
              Artified DIY
            </Link>
            <p className="text-xs text-muted dark:text-muted-dark">Admin</p>
          </div>
          <nav className="ml-4 flex items-center gap-4 text-sm">
            <NavLink to="/" end className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <PlayIcon size={16} weight="fill" />
                Videos
              </span>
            </NavLink>
            <NavLink to="/weblogs" className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <NewspaperIcon size={16} />
                Weblog
              </span>
            </NavLink>
            <NavLink to="/tags" className={navClass}>
              <span className="inline-flex items-center gap-1.5">
                <TagIcon size={16} />
                Tags
              </span>
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <a
              href={webUrl()}
              className="inline-flex items-center gap-1.5 text-sm text-muted dark:text-muted-dark"
            >
              <ArrowSquareOutIcon size={16} />
              View site
            </a>
            <span className="hidden text-sm sm:inline">{user.name}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 text-sm text-yt"
            >
              <SignOutIcon size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
