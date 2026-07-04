/**
 * 用途詳細ページ専用のroute-level loading.tsxフォールバック。
 * 画像を持たず、要点表→本文の段落セクション＋狭い右サイドバー（候補ロボット・関連記事）
 * という構成のため、画像＋スペック表の robots/[slug] とは別に用意する。
 */
export function UseCaseDetailSkeleton() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-8" aria-hidden="true">
        <div className="mb-6 h-3 w-40 animate-pulse bg-muted" />
        <div className="mb-8 space-y-3">
          <div className="h-8 w-64 animate-pulse bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-8">
            <div className="space-y-2 border border-border bg-card p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-4 border-b border-border py-2 last:border-b-0">
                  <div className="h-3 w-20 shrink-0 animate-pulse bg-muted" />
                  <div className="h-3 w-full animate-pulse bg-muted" />
                </div>
              ))}
            </div>

            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <div className="h-5 w-24 animate-pulse bg-muted" />
                <div className="h-4 w-full animate-pulse bg-muted" />
                <div className="h-4 w-4/5 animate-pulse bg-muted" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-24 animate-pulse bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-3 w-full animate-pulse bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
