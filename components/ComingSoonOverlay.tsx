import type { ReactNode } from 'react';

interface ComingSoonOverlayProps {
  children: ReactNode;
}

export function ComingSoonOverlay({ children }: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-40">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          開発中
        </p>
      </div>
    </div>
  );
}
