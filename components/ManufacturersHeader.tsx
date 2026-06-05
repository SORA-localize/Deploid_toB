'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { uiText } from '@/lib/uiText';
import { GLOBAL_HEADER_HEIGHT } from '@/lib/siteLayout';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    function onScroll() { setIsStuck(window.scrollY >= GLOBAL_HEADER_HEIGHT); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container py-2 flex items-center">
        <p className="text-sm font-medium text-foreground shrink-0">{uiText.manufacturers.title}</p>
        <div className="ml-auto flex items-center gap-3 pl-4">
          <ActiveFilterChips chips={activeChips} />
          {isStuck && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="shrink-0 text-primary transition-colors hover:text-brand-hover"
              aria-label="ページ先頭に戻る"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
