'use client';

import { Fragment } from 'react';
import { Tooltip } from 'radix-ui';
import { cn } from '@/lib/utils';

export interface PageTab<T extends string> {
  value: T;
  label: string;
  /** 任意。指定したタブのみツールチップでこの説明を表示する。 */
  description?: string;
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
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-wrap gap-0" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const button = (
            <button
              type="button"
              role="tab"
              aria-selected={activeValue === tab.value}
              onClick={() => onSelect(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeValue === tab.value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          );

          // description が無いタブ（robots 側全タブ・'すべて' 等）は素の button のまま＝DOM副作用なし。
          if (!tab.description) {
            return <Fragment key={tab.value}>{button}</Fragment>;
          }

          return (
            <Tooltip.Root key={tab.value}>
              <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  sideOffset={6}
                  className="z-50 max-w-[16rem] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-relaxed text-popover-foreground shadow-md"
                >
                  {tab.description}
                  <Tooltip.Arrow className="fill-border" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
}
