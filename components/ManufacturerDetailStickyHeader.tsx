'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import {
  ManufacturerDetailSectionNav,
  type ManufacturerDetailSectionLink,
} from '@/components/ManufacturerDetailSectionNav';

interface ManufacturerDetailStickyHeaderProps {
  title: string;
  sections: readonly ManufacturerDetailSectionLink[];
  ariaLabel: string;
}

export function ManufacturerDetailStickyHeader({
  title,
  sections,
  ariaLabel,
}: ManufacturerDetailStickyHeaderProps) {
  return (
    <ContextualPageHeader className="gap-5 py-2">
      <p className="max-w-[14rem] shrink-0 truncate text-sm font-medium text-foreground">
        {title}
      </p>
      <ManufacturerDetailSectionNav
        sections={sections}
        ariaLabel={ariaLabel}
        variant="sticky"
      />
    </ContextualPageHeader>
  );
}
