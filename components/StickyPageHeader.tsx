import type { ReactNode } from 'react';

interface StickyPageHeaderProps {
  children: ReactNode;
}

export function StickyPageHeader({ children }: StickyPageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {children}
    </div>
  );
}
