'use client';

import { Fragment } from 'react';
import AnimatedTooltip from '@/components/ui/AnimatedTooltip';
import { cn } from '@/lib/utils';

export interface PageTab<T extends string> {
  value: T;
  label: string;
  /** 任意。指定したタブのみツールチップでこの説明を表示する。 */
  description?: string;
  /** 任意。指定した場合のみラベル横に件数を表示する。0件も表示対象。 */
  count?: number;
  /** aria-disabled と click guard で選択不可にする。active tab には指定しない。 */
  disabled?: boolean;
}

interface PageTabBarProps<T extends string> {
  tabs: readonly PageTab<T>[];
  activeValue: T;
  onSelect: (value: T) => void;
  ariaLabel: string;
}

export function PageTabBar<T extends string>({
  tabs,
  activeValue,
  onSelect,
  ariaLabel,
}: PageTabBarProps<T>) {
  return (
    <div className="flex flex-nowrap overflow-x-auto gap-0" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;
        const isDisabled = Boolean(tab.disabled);
        const hasCount = tab.count != null;
        const button = (
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled || undefined}
            aria-label={hasCount ? `${tab.label}、${tab.count}件` : undefined}
            onClick={(event) => {
              if (isDisabled) {
                event.preventDefault();
                return;
              }
              onSelect(tab.value);
            }}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-foreground text-foreground'
                : isDisabled
                  ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{tab.label}</span>
            {hasCount && (
              <span
                aria-hidden="true"
                className="ml-1 min-w-4 text-right text-xs tabular-nums opacity-75"
              >
                {tab.count}
              </span>
            )}
          </button>
        );

        // description が無いタブ（robots 側全タブ・'すべて' 等）は素の button のまま＝DOM副作用なし。
        if (!tab.description) {
          return <Fragment key={tab.value}>{button}</Fragment>;
        }

        return (
          <AnimatedTooltip
            key={tab.value}
            content={tab.description}
            placement="bottom"
            delay={150}
          >
            {button}
          </AnimatedTooltip>
        );
      })}
    </div>
  );
}
