'use client';

import { ArrowUp } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { uiText } from '@/lib/uiText';
import { useStickyScroll } from '@/lib/useStickyScroll';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  const isStuck = useStickyScroll();

  return (
    <StickyPageHeader>
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
    </StickyPageHeader>
  );
}
