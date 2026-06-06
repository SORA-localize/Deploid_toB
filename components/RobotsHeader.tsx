'use client';

import { useMemo } from 'react';
import { ArrowUp } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { StickyPageHeader } from '@/components/StickyPageHeader';
import { uiText } from '@/lib/uiText';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useStickyScroll } from '@/lib/useStickyScroll';

interface RobotsHeaderProps {
  activeCount: number;
  preCount: number;
  activeChips: ActiveFilterChip[];
}

export function RobotsHeader({ activeCount, preCount, activeChips }: RobotsHeaderProps) {
  const { getParam, updateParams } = useUrlFilters();
  const activeRelease = getParam('release') === 'pre' ? 'pre' : 'active';
  const isStuck = useStickyScroll();

  const tabs = useMemo<readonly PageTab<'active' | 'pre'>[]>(
    () => [
      { value: 'active', label: uiText.robots.activeModels(activeCount) },
      { value: 'pre',    label: uiText.robots.preReleaseModels(preCount) },
    ],
    [activeCount, preCount],
  );

  return (
    <StickyPageHeader>
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
          {isStuck && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="shrink-0 text-primary transition-colors hover:text-brand-hover"
              aria-label="ページ先頭に戻る"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </StickyPageHeader>
  );
}
