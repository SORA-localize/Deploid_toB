/**
 * 記事詳細ページ専用のroute-level loading.tsxフォールバック。
 * 横幅いっぱいのヒーロー画像が最上部にあり、その下にタイトル、さらに下でTOC＋本文の
 * 2カラムという順序のため、画像とタイトルの順序が逆な robots/[slug] とは別に用意する。
 */
export function ArticleDetailSkeleton() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div aria-hidden="true">
        <div className="site-container pt-4">
          <div className="h-3 w-52 animate-pulse bg-muted" />
        </div>

        <div className="mt-4 h-[400px] w-full animate-pulse bg-muted sm:h-[500px] md:h-[580px]" />

        <div className="site-container py-6">
          <div className="mb-4 max-w-3xl space-y-3">
            <div className="h-8 w-full animate-pulse bg-muted" />
            <div className="h-4 w-2/3 animate-pulse bg-muted" />
          </div>
          <div className="mb-6 h-4 w-72 animate-pulse bg-muted" />

          <div className="grid grid-cols-1 gap-8 border-t border-border pt-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="hidden space-y-2 lg:block">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="h-3 w-full animate-pulse bg-muted" />
              ))}
            </div>
            <div className="max-w-3xl space-y-3">
              <div className="h-5 w-32 animate-pulse bg-muted" />
              <div className="h-4 w-full animate-pulse bg-muted" />
              <div className="h-4 w-full animate-pulse bg-muted" />
              <div className="h-4 w-4/5 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
