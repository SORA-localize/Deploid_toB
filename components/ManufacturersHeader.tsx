'use client';

import { ArrowUp } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { scrollToPageTop } from '@/lib/scroll';
import { uiText } from '@/lib/uiText';
import { useStickyScroll } from '@/lib/useStickyScroll';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  const isStuck = useStickyScroll();

  return (
    <StickyPageHeader visible={isStuck}>
      <div className="site-container py-2 flex items-center">
        <p className="text-sm font-medium text-foreground shrink-0">{uiText.manufacturers.title}</p>
        <div className="ml-auto flex items-center gap-3 pl-4">
          <ActiveFilterChips chips={activeChips} />
          <button
            type="button"
            onClick={scrollToPageTop}
            className="shrink-0 text-primary transition-colors hover:text-brand-hover"
            aria-label="ページ先頭に戻る"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </StickyPageHeader>
  );
}
