'use client';

import { Fragment } from 'react';
import AnimatedTooltip from '@/components/ui/AnimatedTooltip';
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
    <div className="flex flex-nowrap overflow-x-auto gap-0" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const button = (
          <button
            type="button"
            role="tab"
            aria-selected={activeValue === tab.value}
            onClick={() => onSelect(tab.value)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
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
