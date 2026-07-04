/**
 * メーカー一覧のフィルタ更新待ち専用スケルトン。ManufacturerCard は画像を持たず
 * 小ロゴ＋key-valueの行（設立/代表ロボット/相談ルート/国内代理店）で構成されるため、
 * 画像枠を持つ CardGridSkeleton とは別に用意する。
 */
export function ManufacturerCardGridSkeleton({ gridClassName }: { gridClassName: string }) {
  return (
    <div className={gridClassName} role="status" aria-label="更新中">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="border border-border bg-card p-4 sm:p-6" aria-hidden="true">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-10 w-10 shrink-0 animate-pulse bg-muted" />
            <div className="h-5 w-2/3 animate-pulse bg-muted" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between border-b border-border py-1.5 last:border-b-0"
              >
                <div className="h-3 w-16 animate-pulse bg-muted" />
                <div className="h-3 w-20 animate-pulse bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
