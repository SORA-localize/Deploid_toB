'use client';

import { useMemo } from 'react';
import { ArrowUp } from 'lucide-react';
import { ActiveFilterChips, type ActiveFilterChip } from '@/components/ActiveFilterChips';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
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

  const tabs = useMemo<readonly PageTab<'active' | 'pre'>[]>(
    () => [
      { value: 'active', label: uiText.robots.activeModels(activeCount) },
      { value: 'pre',    label: uiText.robots.preReleaseModels(preCount) },
    ],
    [activeCount, preCount],
  );

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
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
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="ページ先頭に戻る"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
