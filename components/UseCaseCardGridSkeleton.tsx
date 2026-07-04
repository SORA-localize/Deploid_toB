/**
 * 用途一覧のフィルタ更新待ち専用スケルトン。UseCaseCard は画像を持たず、
 * 成熟度（実運用候補/PoC・実証/初期検討）ごとに見出し付きグループで並ぶため、
 * 単一のフラットなカードグリッドである CardGridSkeleton とは形が合わない。
 */
export function UseCaseCardGridSkeleton({ gridClassName }: { gridClassName: string }) {
  return (
    <div role="status" aria-label="更新中" aria-hidden="true">
      {[6, 4, 3].map((count, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <div className="mb-3 h-4 w-24 animate-pulse bg-muted" />
          <div className={gridClassName}>
            {Array.from({ length: count }).map((_, cardIndex) => (
              <div key={cardIndex} className="border border-border bg-card p-4">
                <div className="mb-2 h-4 w-4/5 animate-pulse bg-muted" />
                <div className="mb-1 h-3 w-full animate-pulse bg-muted" />
                <div className="mb-3 h-3 w-3/5 animate-pulse bg-muted" />
                <div className="h-5 w-16 animate-pulse bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
