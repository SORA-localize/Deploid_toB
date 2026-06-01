'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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

  return (
    <header className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="min-w-0 text-neutral-900 transition-colors hover:text-neutral-700"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-lg">Deploid</span>
              <span className="hidden text-xs font-medium uppercase tracking-wider text-neutral-500 sm:inline">
                ヒューマノイド導入実務ガイド
              </span>
            </div>
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
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 md:px-8">
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
