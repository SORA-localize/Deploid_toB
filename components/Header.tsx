'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

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
    <header className="border-b border-neutral-200 bg-neutral-50">
      <div className="site-container">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 text-neutral-900 transition-opacity hover:opacity-75"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Deploid ホームへ"
          >
            <img
              src="/brand/deploid-logo.png"
              alt="Deploid"
              className="h-8 w-auto shrink-0"
              width={760}
              height={306}
            />
            <span className="hidden whitespace-nowrap text-xs font-medium text-neutral-500 sm:inline">
              ヒューマノイド導入支援サイト
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
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
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-neutral-950 lg:hidden"
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
        <nav id="site-mobile-navigation" className="border-t border-neutral-200 lg:hidden">
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
                    isActive ? 'font-medium text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
