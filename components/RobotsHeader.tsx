'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { cn } from '@/lib/utils';

interface RobotsHeaderProps {
  activeCount: number;
  preCount: number;
}

const RELEASE_TABS = [
  { value: 'active' as const, labelFn: uiText.robots.activeModels },
  { value: 'pre' as const,    labelFn: uiText.robots.preReleaseModels },
] as const;

export function RobotsHeader({ activeCount, preCount }: RobotsHeaderProps) {
  const { getParam, updateParams } = useUrlFilters();
  const activeRelease = getParam('release') === 'pre' ? 'pre' : 'active';

  const counts = { active: activeCount, pre: preCount };

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="site-container pt-4 pb-2">
        <Breadcrumbs items={[{ label: uiText.robots.breadcrumb }]} />
      </div>
      <div className="site-container">
        <div
          className="flex flex-wrap gap-0"
          role="tablist"
          aria-label="リリースステータスで絞り込む"
        >
          {RELEASE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeRelease === tab.value}
              onClick={() =>
                updateParams({ release: tab.value === 'active' ? null : tab.value })
              }
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeRelease === tab.value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.labelFn(counts[tab.value])}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
