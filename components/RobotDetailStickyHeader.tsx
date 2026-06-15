'use client';

import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import {
  ManufacturerDetailSectionNav,
  type ManufacturerDetailSectionLink,
} from '@/components/ManufacturerDetailSectionNav';

interface RobotDetailStickyHeaderProps {
  title: string;
  sections: readonly ManufacturerDetailSectionLink[];
}

export function RobotDetailStickyHeader({ title, sections }: RobotDetailStickyHeaderProps) {
  return (
    <ContextualPageHeader className="gap-5 py-2">
      <p className="hidden sm:block max-w-[14rem] shrink-0 truncate text-sm font-medium text-foreground">
        {title}
      </p>
      <ManufacturerDetailSectionNav
        sections={sections}
        ariaLabel="ロボット詳細セクション"
        variant="sticky"
      />
    </ContextualPageHeader>
  );
}
