import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DefinitionRow {
  label: ReactNode;
  value: ReactNode;
  /** dd のクラスを既定値から上書きする（タイトル+本文など複合コンテンツ用） */
  valueClassName?: string;
  /** detail-decision バリアントのみ：dt の先頭に小さく表示するアイコン */
  icon?: LucideIcon;
}

interface DefinitionListProps {
  rows: DefinitionRow[];
  /**
   * static-page: about/privacy/for-manufacturers の固定本文ページ向け（md breakpoint・8rem gutter）
   * detail-decision: robots/[slug]・use-cases/[slug] の詳細ページ向け（sm breakpoint・8rem gutter・アイコン対応）
   * judgment: 記事本文内の定性判断テーブル向け（外枠 border + bg-card・11rem gutter・dt は呼び出し側が合成）
   */
  variant?: 'static-page' | 'detail-decision' | 'judgment';
  /** static-page バリアントの dd 文字色（about/for-manufacturers は foreground、privacy は muted） */
  ddTone?: 'foreground' | 'muted';
  /** static-page バリアントのみ：最初のセクション（mission/課題/方針）だけ py-5、他は py-4 */
  py?: '4' | '5';
  className?: string;
}

export function DefinitionList({
  rows,
  variant = 'static-page',
  ddTone = 'foreground',
  py = '4',
  className,
}: DefinitionListProps) {
  if (variant === 'judgment') {
    return (
      <dl className={`my-6 divide-y divide-border border border-border bg-card text-sm ${className ?? ''}`}>
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-1.5 p-4 sm:grid-cols-[11rem_1fr] sm:gap-4"
          >
            <dt className="text-foreground">{row.label}</dt>
            <dd className={row.valueClassName ?? 'break-words leading-relaxed text-foreground/80 [overflow-wrap:anywhere]'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (variant === 'detail-decision') {
    return (
      <dl className={`divide-y divide-border text-xs max-w-3xl ${className ?? ''}`}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-1 sm:gap-4 py-3">
              <dt className="text-muted-foreground">
                {Icon ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="w-3 h-3 shrink-0 opacity-60" />
                    {row.label}
                  </span>
                ) : (
                  row.label
                )}
              </dt>
              <dd className={row.valueClassName ?? 'break-words font-medium text-foreground [overflow-wrap:anywhere]'}>
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  // static-page
  const rowPy = py === '5' ? 'py-5' : 'py-4';
  const defaultDdClassName = `break-words text-sm leading-relaxed [overflow-wrap:anywhere] ${ddTone === 'foreground' ? 'text-foreground' : 'text-muted-foreground'}`;
  return (
    <dl className={`divide-y divide-border ${className ?? ''}`}>
      {rows.map((row, index) => (
        <div
          key={index}
          className={`grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-2 md:gap-8 ${rowPy} first:pt-0 last:pb-0`}
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-0.5 shrink-0">
            {row.label}
          </dt>
          <dd className={row.valueClassName ?? defaultDdClassName}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
