'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname() ?? '';

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
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-neutral-900 hover:text-neutral-700 transition-colors">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">Deploid</span>
              <span className="text-sm text-neutral-500">ヒューマノイド導入判断ポータル</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path ||
                              (item.path !== '/' && pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
