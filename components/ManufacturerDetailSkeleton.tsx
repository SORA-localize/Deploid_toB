import { CardGridSkeleton } from '@/components/CardGridSkeleton';
import { browserGridClassNames } from '@/lib/catalogLayoutClasses';

/**
 * メーカー詳細ページ専用のroute-level loading.tsxフォールバック。
 * ロボット詳細（大きな画像＋右スペック表）とは違い、メーカー詳細は画像を持たず、
 * 小ロゴ＋全幅の情報表、その下に取扱ロボットのカード列という構成のため専用に用意する。
 */
export function ManufacturerDetailSkeleton() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-8" aria-hidden="true">
        <div className="mb-6 h-3 w-40 animate-pulse bg-muted" />

        <div className="mb-4 flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 animate-pulse bg-muted" />
          <div className="h-8 w-56 animate-pulse bg-muted" />
        </div>
        <div className="mb-8 space-y-2">
          <div className="h-4 w-full max-w-2xl animate-pulse bg-muted" />
          <div className="h-4 w-2/3 max-w-xl animate-pulse bg-muted" />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-x-8 gap-y-3 border border-border bg-card p-6 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
              <div className="h-3 w-16 animate-pulse bg-muted" />
              <div className="h-3 w-24 animate-pulse bg-muted" />
            </div>
          ))}
        </div>

        <div className="mb-4 h-5 w-28 animate-pulse bg-muted" />
        <CardGridSkeleton gridClassName={browserGridClassNames.robots} count={4} />
      </div>
    </div>
  );
}
