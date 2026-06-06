'use client';

import { useMemo } from 'react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { ScrollToTopIconButton } from '@/components/ScrollToTopIconButton';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { useHeaderStickyBarVisibility } from '@/lib/useHeaderStickyBarVisibility';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';

interface RobotsHeaderProps {
  activeCount: number;
  preCount: number;
  activeChips: ActiveFilterChip[];
}

export function RobotsHeader({ activeCount, preCount, activeChips }: RobotsHeaderProps) {
  const { getParam, updateParams } = useUrlFilters();
  const activeRelease = getParam('release') === 'pre' ? 'pre' : 'active';
  const isStuck = useHeaderStickyBarVisibility();

  const tabs = useMemo<readonly PageTab<'active' | 'pre'>[]>(
    () => [
      { value: 'active', label: uiText.robots.activeModels(activeCount) },
      { value: 'pre',    label: uiText.robots.preReleaseModels(preCount) },
    ],
    [activeCount, preCount],
  );

  return (
    <StickyPageHeader visible={isStuck}>
      <div className="site-container flex items-center">
        <PageTabBar
          tabs={tabs}
          activeValue={activeRelease}
          onSelect={(value) =>
            updateParams({ release: value === 'active' ? null : value })
          }
          ariaLabel="リリースステータスで絞り込む"
        />
        <div className="ml-auto flex items-center gap-3 pl-4">
          <ActiveFilterChips chips={activeChips} />
          <ScrollToTopIconButton />
        </div>
      </div>
    </StickyPageHeader>
  );
}
