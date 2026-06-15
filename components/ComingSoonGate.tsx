'use client';

import { useState, useEffect } from 'react';

interface ComingSoonGateProps {
  children: React.ReactNode;
  storageKey: string;
  title: string;
}

export function ComingSoonGate({ children, storageKey, title }: ComingSoonGateProps) {
  const [locked, setLocked] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'unlocked') setLocked(false);
    setMounted(true);
  }, [storageKey]);

  const unlock = () => {
    localStorage.setItem(storageKey, 'unlocked');
    setLocked(false);
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className={locked ? 'blur-sm pointer-events-none select-none' : undefined}>
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-32">
          <div className="flex flex-col items-center gap-5 border border-border bg-background px-10 py-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Coming Soon
            </p>
            <p className="text-base font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              このセクションは現在準備中です。
            </p>
            <button
              type="button"
              onClick={unlock}
              className="mt-2 border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              プレビューを表示
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
