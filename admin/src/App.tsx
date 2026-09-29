import { GoogleLogoIcon, SignOutIcon } from '@phosphor-icons/react';
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, apiUrl } from './api';
import { Shell } from './components/Shell';
import { ThemeToggle } from './components/ThemeToggle';
import { TagsPage } from './pages/TagsPage';
import { VideoEditor } from './pages/VideoEditor';
import { VideosPage } from './pages/VideosPage';
import { SessionUser } from './types';

type Gate = 'loading' | 'admin' | 'guest' | 'forbidden';

export function App() {
  const [gate, setGate] = useState<Gate>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    api
      .me()
      .then((next) => {
        setUser(next);
        setGate(next.role === 'admin' ? 'admin' : 'forbidden');
      })
      .catch((error: { status?: number }) => {
        setUser(null);
        setGate(error.status === 403 ? 'forbidden' : 'guest');
      });
  }, []);

  function signIn() {
    const returnTo = window.location.origin + window.location.pathname;
    window.location.href = `${apiUrl()}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }

  if (gate === 'loading') {
    return (
      <Screen>
        <p className="text-muted dark:text-muted-dark">Checking access…</p>
      </Screen>
    );
  }

  if (gate !== 'admin' || !user) {
    return (
      <Screen>
        <img src="/logo.png" alt="" className="mx-auto h-24 w-24 object-contain" />
        <h1 className="mt-6 text-2xl font-medium">Artified DIY Admin</h1>
        <p className="mt-2 text-sm text-muted dark:text-muted-dark">
          {gate === 'forbidden'
            ? 'This panel is only available to admin accounts.'
            : 'Sign in with Google to manage videos.'}
        </p>
        {gate === 'guest' ? (
          <button
            type="button"
            onClick={signIn}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white hover:bg-yt-press"
          >
            <GoogleLogoIcon size={16} weight="fill" />
            Sign in with Google
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void api.logout().finally(() => {
                setUser(null);
                setGate('guest');
              });
            }}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-yt"
          >
            <SignOutIcon size={16} />
            Sign out
          </button>
        )}
      </Screen>
    );
  }

  return (
    <Routes>
      <Route element={<Shell user={user} onLogout={() => setGate('guest')} />}>
        <Route index element={<VideosPage />} />
        <Route path="videos/new" element={<VideoEditor />} />
        <Route path="videos/:id" element={<VideoEditor />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 text-ink dark:bg-ink dark:text-white">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}
