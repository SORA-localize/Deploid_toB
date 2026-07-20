/**
 * ロボット詳細ページ専用のroute-level loading.tsxフォールバック。
 * パンくず→タイトル→（画像・詳細仕様＋基本スペックsidebar）という実際のレイアウトに合わせている。
 * メーカー/用途/記事の詳細ページはそれぞれ形が違うため、専用スケルトンを別途用意している
 * （ManufacturerDetailSkeleton / UseCaseDetailSkeleton / ArticleDetailSkeleton）。
 */
export function RobotDetailSkeleton() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-8" aria-hidden="true">
        <div className="mb-6 h-3 w-40 animate-pulse bg-muted" />
        <div className="mb-8 space-y-3">
          <div className="h-8 w-2/3 max-w-xl animate-pulse bg-muted" />
          <div className="h-4 w-full max-w-md animate-pulse bg-muted" />
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <div className="min-w-0">
            <div className="h-[280px] animate-pulse rounded-xl bg-muted sm:h-[360px] md:h-[420px]" />

            <div className="border-b border-border py-10">
              <div className="mb-5 h-5 w-24 animate-pulse bg-muted" />
              <div className="hidden lg:block">
                <div className="flex gap-0 border-b border-border">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex min-h-10 items-center px-4 py-2">
                      <div className="h-4 w-20 animate-pulse bg-muted" />
                    </div>
                  ))}
                </div>
                <div className="h-[420px] space-y-4 py-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 border-b border-border py-3">
                      <div className="h-3 w-16 animate-pulse bg-muted" />
                      <div className="h-3 w-24 animate-pulse bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6 lg:hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="h-4 w-24 animate-pulse bg-muted" />
                    <div className="h-12 animate-pulse bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden space-y-3 lg:block">
            <div className="mb-4 h-3 w-20 animate-pulse bg-muted" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-border py-2">
                <div className="h-3 w-14 animate-pulse bg-muted" />
                <div className="h-3 w-20 animate-pulse bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
