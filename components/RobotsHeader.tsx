'use client';

import type { ActiveFilterChip } from '@/components/ActiveFilterChips';
import { ContextualPageHeader } from '@/components/ContextualPageHeader';
import { PageTabBar, type PageTab } from '@/components/PageTabBar';
import { uiText } from '@/lib/uiText';

interface RobotsHeaderProps {
  /** リスト直上の業種タブと同じ配列を渡す（状態の正本はURL、部品は PageTabBar 共用）。 */
  industryTabs: readonly PageTab<string>[];
  activeIndustry: string;
  onIndustrySelect: (value: string) => void;
  activeChips: ActiveFilterChip[];
}

/**
 * スクロール後に現れる sticky bar。リスト直上の業種タブのミラーとして同じタブを出す。
 * sticky bar はヘッダー通過後にしか表示されないため、常設タブの「移設」ではなく「ミラー」。
 */
export function RobotsHeader({
  industryTabs,
  activeIndustry,
  onIndustrySelect,
  activeChips,
}: RobotsHeaderProps) {
  return (
    <ContextualPageHeader activeChips={activeChips}>
      <PageTabBar
        tabs={industryTabs}
        activeValue={activeIndustry}
        onSelect={onIndustrySelect}
        ariaLabel={uiText.useCases.industryTabsAriaLabel}
      />
    </ContextualPageHeader>
  );
}
