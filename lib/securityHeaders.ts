/**
 * 全 route へ付ける security header の正本。`next.config.ts` と test が同じ値を見る。
 *
 * CSP は **report-only に限る**。enforce へ上げると、許可し忘れた script / iframe / 画像が
 * 黙って落ちる。どれが落ちるかは実トラフィックのレポートを見るまで分からないため、
 * このphaseでは観測に徹する。enforce は互換性を確認してからの別判断。
 */

/**
 * 実際に読み込んでいる third party だけを列挙する。「念のため」で広げない。
 *
 * - YouTube: `components/YouTubeEmbed.tsx` がクリック後に youtube-nocookie の iframe を作り、
 *   サムネイルを i.ytimg.com から読む
 * - Formspree: `components/ContactForm.tsx` の送信先
 * - GA / Clarity: opt-in のときだけ動くが、有効化した瞬間に CSP で落ちては意味がないので許可する
 * - Vercel: Vercel Analytics（`NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED`）の送信先
 */
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://formspree.io",
  // 'unsafe-inline': next/script の inline snippet と Next.js 自身の bootstrap がある。
  // nonce 化は enforce へ上げるときに別途検討する。
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms https://va.vercel-scripts.com",
  // 'unsafe-inline': Tailwind と next/font が inline style を出す。
  "style-src 'self' 'unsafe-inline'",
  // `https:` を許しているのは、data/*.ts の外部画像とロゴが多数のドメインに散っているため。
  // 列挙は現実的でなく、画像は `lib/media.ts` の gate 側で権利管理している。
  "img-src 'self' data: blob: https: https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://vitals.vercel-insights.com https://formspree.io",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
] as const satisfies ReadonlyArray<{ key: string; value: string }>;
