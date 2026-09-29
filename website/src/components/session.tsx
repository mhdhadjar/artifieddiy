'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { publicApi } from '@/lib/format';
import { SessionUser } from '@/lib/types';

type SessionState = {
  user: SessionUser | null;
  ready: boolean;
  signIn: () => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${publicApi()}/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as SessionUser;
      })
      .then((next) => {
        if (active) setUser(next);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  function signIn() {
    const returnTo = window.location.href.split('?')[0];
    window.location.href = `${publicApi()}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function logout() {
    await fetch(`${publicApi()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }

  return (
    <SessionContext.Provider value={{ user, ready, signIn, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}
