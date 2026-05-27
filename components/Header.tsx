import Link from 'next/link';

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
  return (
    <header className="header">
      <div className="container header-inner">
        <Link className="brand" href="/">
          Deploid
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
