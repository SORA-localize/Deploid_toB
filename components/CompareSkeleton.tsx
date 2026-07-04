/**
 * 比較ページ専用のroute-level loading.tsxフォールバック。
 * カードグリッドの一覧ページとは全く別のツールUI（左: メーカー一覧サイドバー、
 * 中央: 比較シート、右: お気に入りパネル）のため、専用に用意する。
 */
export function CompareSkeleton() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-8" aria-hidden="true">
        <div className="mb-2 h-3 w-16 animate-pulse bg-muted" />
        <div className="mb-6 space-y-2">
          <div className="h-8 w-24 animate-pulse bg-muted" />
          <div className="h-4 w-full max-w-lg animate-pulse bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_minmax(0,1fr)_16rem]">
          {/* メーカー一覧サイドバー */}
          <div className="border border-border bg-card p-3">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-4 w-4/5 animate-pulse bg-muted" />
              ))}
            </div>
          </div>

          {/* 比較シート */}
          <div className="border border-border bg-card p-4">
            <div className="mb-4 h-4 w-32 animate-pulse bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse bg-muted" />
              ))}
            </div>
          </div>

          {/* お気に入りパネル */}
          <div className="border border-border bg-card p-4">
            <div className="mb-4 h-4 w-20 animate-pulse bg-muted" />
            <div className="h-16 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
