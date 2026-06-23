import type { ReactNode } from 'react';

export interface DefinitionRow {
  label: ReactNode;
  value: ReactNode;
  /** dd のクラスを既定値から上書きする（タイトル+本文など複合コンテンツ用） */
  valueClassName?: string;
}

interface DefinitionListProps {
  rows: DefinitionRow[];
  /** about/for-manufacturers は foreground、privacy は muted（既存の見た目を保持） */
  ddTone?: 'foreground' | 'muted';
  /** 最初のセクション（mission/課題/方針）だけ py-5、他は py-4 */
  py?: '4' | '5';
  className?: string;
}

// 情報・テキスト重視ページ（about/contact/privacy/for-manufacturers）共通の
// ラベル・値の定義リスト。8rem gutter・md breakpoint で統一する。
export function DefinitionList({ rows, ddTone = 'foreground', py = '4', className }: DefinitionListProps) {
  const rowPy = py === '5' ? 'py-5' : 'py-4';
  const defaultDdClassName = `text-sm leading-relaxed ${ddTone === 'foreground' ? 'text-foreground' : 'text-muted-foreground'}`;
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
