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
        <div key={index} className="overflow-hidden border border-border bg-card" aria-hidden="true">
          <div className="aspect-[7/6] animate-pulse border-b border-border bg-muted" />
          <div className="p-3">
            <div className="h-4 w-2/3 animate-pulse bg-muted" />
            <div className="mt-1.5 h-3 w-1/2 animate-pulse bg-muted" />
            <div className="mt-3 grid grid-cols-2 gap-x-4">
              {Array.from({ length: 4 }).map((__, factIndex) => (
                <div key={factIndex} className="border-b border-border py-2">
                  <div className="mb-1 h-2.5 w-12 animate-pulse bg-muted" />
                  <div className="h-3 w-16 animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
