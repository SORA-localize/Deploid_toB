'use client';

import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ScrollToTopIconButton } from '@/components/ScrollToTopIconButton';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { useHeaderStickyBarVisibility } from '@/lib/useHeaderStickyBarVisibility';
import { uiText } from '@/lib/uiText';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  const isStuck = useHeaderStickyBarVisibility();

  return (
    <StickyPageHeader visible={isStuck}>
      <div className="site-container py-2 flex items-center">
        <p className="text-sm font-medium text-foreground shrink-0">{uiText.manufacturers.title}</p>
        <div className="ml-auto flex items-center gap-3 pl-4">
          <ActiveFilterChips chips={activeChips} />
          <ScrollToTopIconButton />
        </div>
      </div>
    </StickyPageHeader>
  );
}
