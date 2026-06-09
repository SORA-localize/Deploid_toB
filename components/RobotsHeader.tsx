'use client';

import { useMemo } from 'react';
import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsHeaderProps {
  activeCount: number;
  preCount: number;
  activeChips: ActiveFilterChip[];
  isCrossReleaseMode?: boolean;
}

export function RobotsHeader({
  activeCount,
  preCount,
  activeChips,
  isCrossReleaseMode = false,
}: RobotsHeaderProps) {
  const { getParam, updateParams } = useUrlFilters();
  const activeRelease = getParam('release') === 'pre' ? 'pre' : 'active';

  const tabs = useMemo<readonly PageTab<'active' | 'pre'>[]>(
    () => [
      { value: 'active', label: uiText.robots.activeModels(activeCount) },
      { value: 'pre',    label: uiText.robots.preReleaseModels(preCount) },
    ],
    [activeCount, preCount],
  );

  return (
    <ContextualPageHeader activeChips={activeChips}>
      {isCrossReleaseMode ? (
        <div className="flex flex-wrap gap-0" aria-label={uiText.robots.crossReleaseCountsAria}>
          {tabs.map((tab) => (
            <span
              key={tab.value}
              className="px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-default select-none border-border/60 text-muted-foreground"
            >
              {tab.label}
            </span>
          ))}
        </div>
      ) : (
        <PageTabBar
          tabs={tabs}
          activeValue={activeRelease}
          onSelect={(value) =>
            updateParams({ release: value === 'active' ? null : value })
          }
          ariaLabel="リリースステータスで絞り込む"
        />
      )}
    </ContextualPageHeader>
  );
}
