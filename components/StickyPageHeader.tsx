'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const EXIT_DURATION_MS = 320;

interface StickyPageHeaderProps {
  children: ReactNode;
  visible: boolean;
}

export function StickyPageHeader({ children, visible }: StickyPageHeaderProps) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      className={`fixed inset-x-0 top-[var(--header-h)] z-30 border-b border-border bg-background transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
