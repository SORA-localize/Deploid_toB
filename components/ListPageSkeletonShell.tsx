import type { ReactNode } from 'react';

/**
 * 一覧ページ共通のタイトル部分（PageSuspenseFallback と同じ見た目）＋
 * ページ固有のグリッドスケルトンを組み合わせるための外枠。
 * カード形状がページごとに違うため、グリッド部分だけ呼び出し側で差し替える。
 */
export function ListPageSkeletonShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-12" aria-hidden="true">
        <div className="mb-8 max-w-3xl space-y-3">
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="h-8 w-64 animate-pulse bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-muted" />
        </div>
        {children}
      </div>
    </div>
  );
}
