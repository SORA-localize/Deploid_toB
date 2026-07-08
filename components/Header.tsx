'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { HeaderStickyBarSlot } from '@/components/HeaderChrome';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import { siteNavItems } from '@/lib/siteNavigation';

export function Header() {
  const pathname = usePathname() ?? '';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const closeMenuOnDesktop = () => {
      if (mediaQuery.matches) setIsMenuOpen(false);
    };

    closeMenuOnDesktop();
    mediaQuery.addEventListener('change', closeMenuOnDesktop);
    return () => mediaQuery.removeEventListener('change', closeMenuOnDesktop);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-background relative">
      <div className="site-container">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 text-foreground transition-opacity hover:opacity-75"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Deploid ホームへ"
          >
            <img
              src="/brand/deploid-logo.png"
              alt="Deploid"
              className="h-8 w-auto shrink-0 dark:brightness-0 dark:invert"
              width={760}
              height={306}
            />
            <span className="hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:inline">
              ヒューマノイド導入支援サイト
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-1">
              {siteNavItems.map((item) => {
                const isActive = pathname === item.path ||
                                (item.path !== '/' && pathname.startsWith(item.path));
                const hasChildren = item.children && item.children.length > 0;

                if (hasChildren) {
                  return (
                    <div key={item.path} className="group relative">
                      <Link
                        href={item.path}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`relative inline-flex items-center gap-1 px-3 py-2 text-sm transition-all duration-200 ${
                          isActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {item.label}
                        <ChevronDown
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                          aria-hidden="true"
                        />
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                        )}
                      </Link>

                      <div className="pointer-events-none absolute left-1/2 top-full z-[var(--z-dropdown)] w-48 -translate-x-1/2 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                        <div
                          aria-label={`${item.label}の項目`}
                          className="border border-border bg-background p-1 shadow-xl"
                        >
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`relative px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <ThemeModeToggle />
          </div>

          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            aria-label={isMenuOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}
            aria-expanded={isMenuOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* 右スライドインナビ（モバイル） */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <nav
        id="site-mobile-navigation"
        aria-hidden={!isMenuOpen}
        className={`fixed right-0 top-0 z-[var(--z-dropdown)] flex h-full w-72 flex-col border-l border-border bg-background shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            メニュー
          </span>
          <button
            type="button"
            aria-label="ナビゲーションを閉じる"
            onClick={() => setIsMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col overflow-y-auto py-2">
          {siteNavItems.map((item) => {
            const isActive = pathname === item.path ||
              (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <div key={item.path} className="flex flex-col">
                <Link
                  href={item.path}
                  tabIndex={isMenuOpen ? 0 : -1}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                  className={`inline-flex min-h-12 items-center px-6 text-sm transition-colors ${
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && item.children.length > 0 && (
                  <div className="border-y border-border/60 bg-muted/25 py-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        tabIndex={isMenuOpen ? 0 : -1}
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex min-h-10 items-center px-9 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-auto shrink-0 border-t border-border px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">テーマ</span>
          <ThemeModeToggle />
        </div>
      </nav>
      <HeaderStickyBarSlot />
    </header>
  );
}
