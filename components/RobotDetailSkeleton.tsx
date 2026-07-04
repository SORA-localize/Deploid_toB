/**
 * 詳細ページ（ロボット/メーカー/用途/記事）用の route-level loading.tsx フォールバック。
 * PageSuspenseFallback（一覧のカードグリッド用）とは形が違うため専用に用意する。
 * パンくず・タイトル・本文2カラムの大まかな形に合わせたスケルトン。
 */
export function DetailPageSuspenseFallback() {
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="aspect-[4/3] animate-pulse bg-muted lg:col-span-2" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse bg-muted" />
            <div className="h-4 w-5/6 animate-pulse bg-muted" />
            <div className="h-4 w-4/6 animate-pulse bg-muted" />
            <div className="h-4 w-full animate-pulse bg-muted" />
            <div className="h-4 w-3/6 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
