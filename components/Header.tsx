'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'ロボット', href: '/robots' },
  { label: 'メーカー', href: '/manufacturers' },
  { label: '比較', href: '/compare' },
  { label: 'ガイド', href: '/guides' },
  { label: '用途から探す', href: '/use-cases' },
  { label: '記事', href: '/reports' },
  { label: '会社概要', href: '/about' },
  { label: 'お問い合わせ', href: '/contact' },
];

export function Header() {
  const pathname = usePathname() ?? '';

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between gap-7">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">Deploid</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ヒューマノイド導入判断ポータル
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Primary">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
