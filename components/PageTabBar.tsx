'use client';

import { cn } from '@/lib/utils';

export interface PageTab<T extends string> {
  value: T;
  label: string;
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
    <div className="flex flex-wrap gap-0" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
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
      ))}
    </div>
  );
}
