'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { uiText } from '@/lib/uiText';

export function ManufacturersHeader() {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container py-4">
        <Breadcrumbs items={[{ label: uiText.manufacturers.breadcrumb }]} />
      </div>
    </div>
  );
}
