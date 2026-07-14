import type { ComparisonSpecGroup } from '@/lib/robotDisplay';
import { cn } from '@/lib/utils';

interface ComparisonSpecListProps {
  groups: readonly ComparisonSpecGroup[];
  variant?: 'card' | 'panel';
}

/** 比較面専用。数値だけを右揃えし、文章・状態・欠損値は左揃えにする。 */
export function ComparisonSpecList({
  groups,
  variant = 'card',
}: ComparisonSpecListProps) {
  return (
    <div className={variant === 'card' ? 'flex-1 px-3 pb-3' : 'space-y-6'}>
      {groups.map((group) => (
        <section key={group.heading}>
          {variant === 'card' ? (
            <p className="mt-3 mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </p>
          ) : (
            <h5 className="mb-2 border-b border-border-subtle pb-1.5 text-xs font-semibold text-foreground">
              {group.heading}
            </h5>
          )}
          <dl className={variant === 'panel' ? 'space-y-2 text-xs' : undefined}>
            {group.rows.map((row) => {
              const numeric = row.valueKind === 'number';
              return (
                <div
                  key={row.label}
                  className={cn(
                    'flex justify-between gap-3 border-b border-border-subtle last:border-0',
                    variant === 'card'
                      ? 'min-h-9 items-center py-1 text-xs'
                      : 'pb-2 last:pb-0',
                  )}
                >
                  <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                  <dd
                    className={cn(
                      'min-w-0 break-words font-medium text-foreground [overflow-wrap:anywhere]',
                      variant === 'panel' && 'max-w-[65%]',
                      numeric ? 'text-right tabular-nums' : 'text-left',
                    )}
                  >
                    {row.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
