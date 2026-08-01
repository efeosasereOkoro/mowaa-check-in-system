'use client';

import { useEffect, useState } from 'react';

// Shared narrow/desktop gates so server pages can branch their layout without a media
// query. First render = desktop (matches the server), adjusted on mount — same pattern
// as the app shell, so there's no hydration mismatch.
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return useNarrow() ? null : <>{children}</>;
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return useNarrow() ? <>{children}</> : null;
}
