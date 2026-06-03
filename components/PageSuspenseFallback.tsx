export function PageSuspenseFallback() {
  return (
    <div
      className="min-h-[calc(100svh-4rem)] bg-background"
      role="status"
      aria-label="ページを読み込み中"
    >
      <div className="site-container py-12" aria-hidden="true">
        <div className="max-w-3xl space-y-3">
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="h-8 w-64 animate-pulse bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-muted" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border border-border bg-card p-4">
              <div className="aspect-[4/3] animate-pulse bg-muted" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-2/3 animate-pulse bg-muted" />
                <div className="h-3 w-full animate-pulse bg-muted" />
                <div className="h-3 w-4/5 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
