// NEXT_PUBLIC_SITE_URL を正規化して返す。スキーマ(https://)が無ければ補い、末尾スラッシュを削る。
// metadataBase / sitemap / robots の参照を1か所に集約。
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim();
const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
export const siteUrl: string = withScheme.replace(/\/+$/, '');
