import Link from 'next/link';
import { siteNavItems } from '@/lib/siteNavigation';

export default function NotFound() {
  return (
    <div className="site-container flex min-h-[60vh] flex-col justify-center py-16">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mb-4 max-w-2xl text-2xl font-semibold text-foreground">
        ページが見つかりません
      </h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        URLが変更されたか、ページが削除された可能性があります。下記の主要ページから目的の情報を探してください。
      </p>

      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          ホームへ戻る
        </Link>
      </div>

      <nav
        className="grid max-w-3xl grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"
        aria-label="主要ページ"
      >
        {siteNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="border border-border bg-card px-4 py-3 text-foreground transition-colors hover:border-foreground/40"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
