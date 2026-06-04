'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';

export function Header() {
  const pathname = usePathname() ?? '';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'ロボット', path: '/robots' },
    { label: 'メーカー', path: '/manufacturers' },
    { label: '比較', path: '/compare' },
    { label: 'ガイド', path: '/guides' },
    { label: '用途から探す', path: '/use-cases' },
    { label: '記事', path: '/reports' },
    { label: '会社概要', path: '/about' },
    { label: 'お問い合わせ', path: '/contact' },
  ];

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

  return (
    <header className="relative border-b border-border bg-background">
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
              {navItems.map((item) => {
                const isActive = pathname === item.path ||
                                (item.path !== '/' && pathname.startsWith(item.path));

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
            className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            aria-label={isMenuOpen ? 'ナビゲーションを閉じる' : 'ナビゲーションを開く'}
            aria-expanded={isMenuOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            aria-hidden="true"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav
            id="site-mobile-navigation"
            className="absolute top-full left-0 right-0 z-50 border-b border-border bg-background shadow-md lg:hidden"
          >
            <div className="site-container grid grid-cols-2 gap-x-4 gap-y-1 py-3">
              {navItems.map((item) => {
                const isActive = pathname === item.path ||
                  (item.path !== '/' && pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`py-2 text-sm transition-colors ${
                      isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="site-container flex items-center justify-between border-t border-border py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">テーマ</span>
              <ThemeModeToggle />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
