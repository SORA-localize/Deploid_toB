import type { Key, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FactListRow {
  key?: Key;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}

interface FactListProps {
  rows: readonly FactListRow[];
  variant?: 'compact' | 'standard';
  className?: string;
  rowClassName?: string;
}

const variantClassNames = {
  compact: {
    list: 'text-xs',
    row: 'sm:grid-cols-[7rem_minmax(0,1fr)] py-2',
  },
  standard: {
    list: 'text-xs',
    row: 'sm:grid-cols-[8rem_minmax(0,1fr)] py-3',
  },
} as const;

/** 短い基本情報・仕様向け。長文説明や真の多列表には使わない。 */
export function FactList({
  rows,
  variant = 'standard',
  className,
  rowClassName,
}: FactListProps) {
  const styles = variantClassNames[variant];

  return (
    <dl className={cn(styles.list, className)}>
      {rows.map((row, index) => (
        <div
          key={row.key ?? index}
          className={cn(
            'grid grid-cols-1 gap-1 border-b border-border sm:gap-4',
            styles.row,
            rowClassName,
          )}
        >
          <dt className="text-left text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              'min-w-0 break-words text-left font-medium text-foreground [overflow-wrap:anywhere]',
              row.valueClassName,
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
