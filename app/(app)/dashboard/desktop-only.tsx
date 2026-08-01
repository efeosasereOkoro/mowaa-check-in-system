'use client';

import { useEffect, useState } from 'react';

// Renders children only at >= 672px. Lets the server dashboard page keep its desktop
// chrome (eyebrow, stat tiles, section labels) while dropping it on narrow — same
// narrow-detection pattern as the shell, so first render matches the server.
export default function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 672);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow ? null : <>{children}</>;
}
