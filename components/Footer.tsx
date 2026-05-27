import Link from 'next/link';

const columns = [
  {
    title: 'コンテンツ',
    links: [
      { label: 'ロボット', href: '/robots' },
      { label: 'メーカー', href: '/manufacturers' },
      { label: 'ガイド', href: '/guides' },
      { label: '用途から探す', href: '/use-cases' },
    ],
  },
  {
    title: 'ツール',
    links: [
      { label: '比較', href: '/compare' },
      { label: '記事', href: '/reports' },
    ],
  },
  {
    title: '会社情報',
    links: [
      { label: '会社概要', href: '/about' },
      { label: 'お問い合わせ', href: '/contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">更新情報</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              最新の業界動向と導入レポートをお届けします。
            </p>
            <Link
              href="/contact"
              className="inline-block bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              お問い合わせ
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © 2026 Deploid. 本サイトは情報提供を目的としており、特定の製品やサービスを推奨するものではありません。
          </p>
        </div>
      </div>
    </footer>
  );
}
