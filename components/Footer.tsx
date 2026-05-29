import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 mb-12 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">コンテンツ</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/robots" className="text-neutral-600 hover:text-neutral-900">ロボット一覧</Link></li>
              <li><Link href="/manufacturers" className="text-neutral-600 hover:text-neutral-900">メーカー一覧</Link></li>
              <li><Link href="/guides" className="text-neutral-600 hover:text-neutral-900">導入ガイド</Link></li>
              <li><Link href="/use-cases" className="text-neutral-600 hover:text-neutral-900">用途から探す</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">ツール</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/compare" className="text-neutral-600 hover:text-neutral-900">ロボット比較</Link></li>
              <li><Link href="/reports" className="text-neutral-600 hover:text-neutral-900">記事</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">会社情報</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-neutral-600 hover:text-neutral-900">サイトについて</Link></li>
              <li><Link href="/contact" className="text-neutral-600 hover:text-neutral-900">お問い合わせ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">更新情報</h3>
            <p className="text-sm text-neutral-600 mb-3">最新の業界動向と導入事例を配信</p>
            <Link
              href="/contact"
              className="inline-block px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
            >
              お問い合わせ
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            © 2026 Deploid. 本サイトは情報提供を目的としており、特定の製品やサービスを推奨するものではありません。
          </p>
          <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
            掲載画像・ロゴには出典を明記した参照用途のものを含みます。権利者からの修正・削除依頼はお問い合わせよりご連絡ください。
          </p>
        </div>
      </div>
    </footer>
  );
}
