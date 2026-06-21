'use client';

import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { uiText } from '@/lib/uiText';

interface UseCasesHeaderProps {
  activeChips: ActiveFilterChip[];
}

export function UseCasesHeader({ activeChips }: UseCasesHeaderProps) {
  return (
    <ContextualPageHeader activeChips={activeChips} className="py-2">
      <p className="text-sm font-medium text-foreground shrink-0">{uiText.useCases.title}</p>
    </ContextualPageHeader>
  );
}
