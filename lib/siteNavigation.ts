export interface SiteNavItem {
  label: string;
  path: string;
  footerLabel?: string;
}

export const siteNavItems: SiteNavItem[] = [
  { label: 'ロボット', path: '/robots', footerLabel: 'ロボット' },
  { label: 'メーカー', path: '/manufacturers', footerLabel: 'メーカー' },
  { label: '比較', path: '/compare' },
  { label: '用途から探す', path: '/use-cases', footerLabel: '用途' },
  { label: 'ニュース・解説', path: '/reports' },
  { label: '会社概要', path: '/about' },
  { label: 'お問い合わせ', path: '/contact' },
];

export const footerNavItems = [
  ...siteNavItems.map((item) => ({
    ...item,
    label: item.footerLabel ?? item.label,
  })),
  { label: 'メーカー・代理店の方へ', path: '/for-manufacturers' },
  { label: 'プライバシーポリシー', path: '/privacy' },
];

export const footerNotice =
  '本サイトは情報提供を目的としており、特定の製品やサービスを推奨するものではありません。掲載画像・ロゴには出典を明記した参照用途のものを含みます。権利者からの修正・削除依頼はお問い合わせよりご連絡ください。';
