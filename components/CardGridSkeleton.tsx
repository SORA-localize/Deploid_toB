/**
 * フィルタ更新待ち（isPending）専用のローディング表現。
 * PageSuspenseFallback のカード部分と同じ見た目のブロックを、呼び出し側の実グリッドと
 * 同じ gridClassName で並べる。列数がページごとに違うため、実グリッドのクラスをそのまま
 * 渡してもらい、スケルトン→実データの切り替え時に列数がガクッと変わらないようにする。
 */
export function CardGridSkeleton({
  gridClassName,
  count = 10,
}: {
  gridClassName: string;
  count?: number;
}) {
  return (
    <div className={gridClassName} role="status" aria-label="更新中">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border border-border bg-card p-4" aria-hidden="true">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-2/3 animate-pulse bg-muted" />
            <div className="h-3 w-full animate-pulse bg-muted" />
            <div className="h-3 w-4/5 animate-pulse bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
