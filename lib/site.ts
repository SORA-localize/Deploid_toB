// NEXT_PUBLIC_SITE_URL を正規化して返す。スキーマ(https://)が無ければ補い、末尾スラッシュを削る。
// metadataBase / sitemap / robots の参照を1か所に集約。
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim();
if (process.env.VERCEL_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(raw)) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set to the production site URL on Vercel production.');
}
const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
export const siteUrl: string = withScheme.replace(/\/+$/, '');
