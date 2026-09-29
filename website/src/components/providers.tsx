'use client';

import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { SessionProvider } from './session';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </SessionProvider>
    </ThemeProvider>
  );
}
