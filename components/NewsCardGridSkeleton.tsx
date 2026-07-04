/**
 * 記事一覧のフィルタ更新待ち専用スケルトン。NewsCard はモバイルで横並び
 * （左に小さい画像）、デスクトップで縦並び（上にaspect-video画像）に切り替わる
 * レスポンシブなカードのため、正方形画像を上に固定する CardGridSkeleton とは形が違う。
 */
export function NewsCardGridSkeleton({ gridClassName }: { gridClassName: string }) {
  return (
    <div className={gridClassName} role="status" aria-label="更新中">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex h-full flex-row border border-border bg-card sm:flex-col"
          aria-hidden="true"
        >
          <div className="w-28 flex-none animate-pulse bg-muted sm:aspect-video sm:w-auto" />
          <div className="flex-1 space-y-2 p-4">
            <div className="h-3 w-16 animate-pulse bg-muted" />
            <div className="h-4 w-full animate-pulse bg-muted" />
            <div className="h-4 w-3/5 animate-pulse bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
