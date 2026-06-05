'use client';

import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { uiText } from '@/lib/uiText';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container py-2">
        <p className="text-sm font-medium text-foreground">{uiText.manufacturers.title}</p>
      </div>
      <ActiveFilterChips chips={activeChips} />
    </div>
  );
}
