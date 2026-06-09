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
        <div className="flex flex-wrap items-center gap-2" aria-label={uiText.robots.crossReleaseCountsAria}>
          <span className="border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
            {uiText.robots.activeModels(activeCount)}
          </span>
          <span className="border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
            {uiText.robots.preReleaseModels(preCount)}
          </span>
          <span className="w-full text-xs text-muted-foreground sm:w-auto">
            {uiText.robots.filteredAcrossRelease}
          </span>
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
