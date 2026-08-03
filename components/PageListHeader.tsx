import type { ReactNode } from 'react';

/**
 * 一覧ページの見出しブロック（正本）。全 index route はこれを使う。
 *
 * `<main>` 配下で使う前提。`<header>` は body 直下でないと banner landmark に
 * ならないため、landmark は重複しない（`src/app/layout.tsx:66` が `<main>` を持つ）。
 */
interface PageListHeaderProps {
  title: string;
  /**
   * 文字列なら `<p>` で描画する。`/compare` のように画面幅で本文を出し分ける等、
   * 複数要素が要る場合だけ node を渡す。その際は
   * `pageListHeaderDescriptionClassName` を使って体裁を揃えること。
   */
  description: ReactNode;
  /** H1 の id。`aria-labelledby` から参照したいときに渡す。 */
  headingId?: string;
  className?: string;
  action?: ReactNode;
}

export const pageListHeaderDescriptionClassName =
  'text-sm text-muted-foreground max-w-3xl leading-relaxed';

export function PageListHeader({
  title,
  description,
  headingId,
  className = 'mb-5',
  action,
}: PageListHeaderProps) {
  return (
    <header className={className}>
      {/*
        見出しと action は箱の中央で揃える。action に入るのは検索窓のような
        コントロールで、実測で 45px（テキスト20px + 上下padding各12px + 下線1px。
        最低タッチ領域 44px を満たすための高さ）あり、H1 の 32px より 13px 高い。
        items-baseline（文字同士の流儀）だと、この差が上3px・下10px と偏って配分され、
        検索窓の下線だけが見出しより下へ垂れる。文字とコントロールを並べる場合は
        箱基準で揃える。
      */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6 mb-2">
        <h1 id={headingId} className="text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {action && <div className="mt-3 w-full sm:mt-0 sm:w-72 md:w-96 shrink-0">{action}</div>}
      </div>
      {typeof description === 'string' ? (
        <p className={pageListHeaderDescriptionClassName}>{description}</p>
      ) : (
        description
      )}
    </header>
  );
}
