'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="site-container flex min-h-[60vh] flex-col justify-center py-16">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Error
      </p>
      <h1 className="mb-4 max-w-2xl text-2xl font-semibold text-foreground">
        ページを表示できませんでした
      </h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        一時的な問題の可能性があります。再試行しても解消しない場合は、ホームへ戻ってください。
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          再試行
        </button>
        <a
          href="/"
          className="border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
        >
          ホームへ戻る
        </a>
      </div>
    </div>
  );
}
