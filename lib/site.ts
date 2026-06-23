// NEXT_PUBLIC_SITE_URL を正規化して返す。スキーマ(https://)が無ければ補い、末尾スラッシュを削る。
// metadataBase / sitemap / robots の参照を1か所に集約。
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim();
if (process.env.VERCEL_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(raw)) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set to the production site URL on Vercel production.');
}
const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
export const siteUrl: string = withScheme.replace(/\/+$/, '');

// 意味の異なる3つの日付。1つに統合しない（統合すると相互に誤って書き換わる）。
export const siteMeta = {
  // サイトの公開開始月。固定値、通常は変更しない。
  launchedAt: '2026年6月',
  // プライバシーポリシーの最終改定月。改定時のみ更新する。
  privacyUpdatedAt: '2026年6月',
  // 掲載件数（ロボット・メーカー数）が正しい時点。件数を確認・更新したら合わせて更新する。
  dataAsOf: '2026年6月',
} as const;
