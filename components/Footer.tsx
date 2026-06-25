import Link from 'next/link';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { footerNavItems, footerNotice } from '@/lib/siteNavigation';

async function getCopyrightYear() {
  'use cache';
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await getCopyrightYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="site-container py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center transition-opacity hover:opacity-75"
            aria-label="Deploid ホームへ"
          >
            <img
              src="/brand/deploid-logo.png"
              alt="Deploid"
              className="h-6 w-auto dark:brightness-0 dark:invert"
              width={760}
              height={306}
            />
          </Link>

          <nav
            className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground"
            aria-label="フッターナビゲーション"
          >
            {footerNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-[11px] leading-relaxed text-muted-foreground md:flex-row md:items-start md:justify-between">
          <p className="shrink-0">© {year} Deploid</p>
          <p className="min-w-0 flex-1 md:pl-6 md:text-right">
            {footerNotice}
          </p>
        </div>

        <div className="mt-3 flex justify-end">
          <ScrollToTopButton />
        </div>
      </div>
    </footer>
  );
}
