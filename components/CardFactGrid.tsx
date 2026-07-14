import type { Key, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardFactItem {
  key?: Key;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}

export type CardFactItems = readonly [
  CardFactItem,
  CardFactItem,
  CardFactItem,
  CardFactItem,
];

interface CardFactGridProps {
  items: CardFactItems;
  className?: string;
}

/** データカード内の4項目専用。項目数・2×2配置・左揃えを固定する。 */
export function CardFactGrid({ items, className }: CardFactGridProps) {
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 text-[11px]', className)}>
      {items.map((item, index) => (
        <div
          key={item.key ?? index}
          className="min-w-0 border-b border-border py-2"
        >
          <dt className="mb-0.5 text-left text-muted-foreground/80">{item.label}</dt>
          <dd
            className={cn(
              'min-w-0 break-words text-left font-medium leading-snug text-foreground [overflow-wrap:anywhere]',
              item.valueClassName ?? 'line-clamp-2',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
