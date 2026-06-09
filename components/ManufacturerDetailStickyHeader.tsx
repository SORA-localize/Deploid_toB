'use client';

import { useMemo } from 'react';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import {
  ManufacturerDetailSectionNav,
  type ManufacturerDetailSectionLink,
} from '@/components/ManufacturerDetailSectionNav';
import { useActiveSection } from '@/lib/useActiveSection';

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
  const ids = useMemo(() => sections.map((s) => s.href.slice(1)), [sections]);
  const activeId = useActiveSection(ids);

  return (
    <ContextualPageHeader className="gap-5 py-2">
      <p className="max-w-[14rem] shrink-0 truncate text-sm font-medium text-foreground">
        {title}
      </p>
      <ManufacturerDetailSectionNav
        sections={sections}
        ariaLabel={ariaLabel}
        variant="sticky"
        activeHref={`#${activeId}`}
      />
    </ContextualPageHeader>
  );
}
