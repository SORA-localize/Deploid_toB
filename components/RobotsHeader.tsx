'use client';

import { useMemo } from 'react';
import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { uiText } from '@/lib/uiText';

interface RobotsHeaderProps {
  activeCount: number;
  preCount: number;
  activeChips: ActiveFilterChip[];
  activeRelease: 'active' | 'pre';
  onReleaseSelect: (value: 'active' | 'pre') => void;
  isCrossReleaseMode?: boolean;
}

export function RobotsHeader({
  activeCount,
  preCount,
  activeChips,
  activeRelease,
  onReleaseSelect,
  isCrossReleaseMode = false,
}: RobotsHeaderProps) {
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
          onSelect={onReleaseSelect}
          ariaLabel="リリースステータスで絞り込む"
        />
      )}
    </ContextualPageHeader>
  );
}
