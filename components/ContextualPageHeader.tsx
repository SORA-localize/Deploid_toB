'use client';

import type { ReactNode } from 'react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ScrollToTopIconButton } from '@/components/ScrollToTopIconButton';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { useHeaderStickyBarVisibility } from '@/lib/useHeaderStickyBarVisibility';
import { cn } from '@/lib/utils';

const EMPTY_ACTIVE_FILTER_CHIPS: ActiveFilterChip[] = [];

interface ContextualPageHeaderProps {
  children: ReactNode;
  activeChips?: ActiveFilterChip[];
  className?: string;
}

export function ContextualPageHeader({
  children,
  activeChips = EMPTY_ACTIVE_FILTER_CHIPS,
  className,
}: ContextualPageHeaderProps) {
  const isVisible = useHeaderStickyBarVisibility();

  return (
    <StickyPageHeader visible={isVisible}>
      <div className={cn('site-container flex items-center', className)}>
        {children}
        <div className="ml-auto flex items-center gap-3 pl-4">
          <ActiveFilterChips chips={activeChips} />
          <ScrollToTopIconButton />
        </div>
      </div>
    </StickyPageHeader>
  );
}
