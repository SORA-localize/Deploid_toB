/**
 * Central environment variable management and validation.
 *
 * 実 ID をここに書かない。以前は `|| 'G-PLLDR4X5TV'` のようにフォールバックを持っており、
 * 環境変数が未設定でも production では必ず analytics を送っていた。「設定していないなら
 * 送らない」を成立させるため、値は環境変数だけを正本とする。
 *
 * parser を純関数として切り出してあるのは、`process.env` を差し替えずにテストするため。
 */

type EnvSource = Readonly<Record<string, string | undefined>>;

function optional(source: EnvSource, key: string) {
  return source[key]?.trim() || null;
}

function parseBoolean(source: EnvSource, key: string) {
  return source[key]?.trim().toLowerCase() === 'true';
}

export function parsePublicEnv(source: EnvSource) {
  const isDev = source.NODE_ENV === 'development';
  const isProd = source.NODE_ENV === 'production';
  const isVercelProduction = source.VERCEL_ENV === 'production';

  /**
   * Vercel の preview は `NODE_ENV=production` でビルドされる。preview の計測が本番へ
   * 混ざらないよう、`VERCEL_ENV` が production のときだけ production runtime とみなす。
   * `VERCEL_ENV` 自体が無い場合（Vercel 以外での self-host、ローカルの `next start`）は
   * production 扱いにする。
   */
  const isProductionRuntime = isProd && (isVercelProduction || !source.VERCEL_ENV);

  const gaMeasurementId = optional(source, 'NEXT_PUBLIC_GA_MEASUREMENT_ID');
  const clarityProjectId = optional(source, 'NEXT_PUBLIC_CLARITY_PROJECT_ID');
  const analyticsRequested = parseBoolean(source, 'NEXT_PUBLIC_ANALYTICS_ENABLED');

  /**
   * 形式検査は production runtime に限る。壊れた値でローカル開発まで止めない。
   * 逆に production では黙って受け入れない——タイポした ID は「計測できているつもりで
   * 何も取れていない」状態を作り、気づくまでが長い。
   */
  if (isProductionRuntime && gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) {
    throw new Error('[env] NEXT_PUBLIC_GA_MEASUREMENT_ID must match G-[A-Z0-9]+');
  }
  if (isProductionRuntime && clarityProjectId && !/^[a-z0-9]+$/i.test(clarityProjectId)) {
    throw new Error('[env] NEXT_PUBLIC_CLARITY_PROJECT_ID must be alphanumeric');
  }
  if (isProductionRuntime && analyticsRequested && !gaMeasurementId && !clarityProjectId) {
    throw new Error('[env] NEXT_PUBLIC_ANALYTICS_ENABLED requires a GA or Clarity ID');
  }

  return {
    formspreeFormId: optional(source, 'NEXT_PUBLIC_FORMSPREE_FORM_ID'),
    gaMeasurementId,
    clarityProjectId,
    mediaUsagePolicy: optional(source, 'NEXT_PUBLIC_MEDIA_USAGE_POLICY'),
    isDev,
    isProd,
    isVercelProduction,
    isProductionRuntime,
    analyticsEnabled:
      isProductionRuntime && analyticsRequested && Boolean(gaMeasurementId || clarityProjectId),
    vercelAnalyticsEnabled:
      isProductionRuntime && parseBoolean(source, 'NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED'),
  } as const;
}

export const env = parsePublicEnv(process.env);

// Log warning if critical environment variables are missing in production
if (env.isProductionRuntime && !env.formspreeFormId) {
  console.warn('[env] NEXT_PUBLIC_FORMSPREE_FORM_ID is not defined. Contact form will be disabled.');
}
