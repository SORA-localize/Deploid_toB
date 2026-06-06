'use client';

import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { uiText } from '@/lib/uiText';

interface ManufacturersHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function ManufacturersHeader({ activeChips }: ManufacturersHeaderProps) {
  return (
    <ContextualPageHeader activeChips={activeChips} className="py-2">
      <p className="text-sm font-medium text-foreground shrink-0">{uiText.manufacturers.title}</p>
    </ContextualPageHeader>
  );
}
