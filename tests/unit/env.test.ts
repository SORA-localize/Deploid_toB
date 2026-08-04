import { describe, expect, it } from 'vitest';
import { parsePublicEnv } from '@/lib/env';

/**
 * analytics は「明示的に有効化され、ID があり、production runtime である」ときだけ動く。
 *
 * これを parser として切り出すのは、以前 `lib/env.ts` が実 ID をフォールバックに持っていて
 * （`|| 'G-PLLDR4X5TV'`）、環境変数が未設定でも本番では必ず送信していたため。
 * 「未設定なら送らない」は挙動なので、テストで固定する。
 */
describe('parsePublicEnv', () => {
  const productionRuntime = { NODE_ENV: 'production', VERCEL_ENV: 'production' };

  it('disables analytics when IDs are absent', () => {
    const env = parsePublicEnv(productionRuntime);

    expect(env.gaMeasurementId).toBeNull();
    expect(env.clarityProjectId).toBeNull();
    expect(env.analyticsEnabled).toBe(false);
    expect(env.vercelAnalyticsEnabled).toBe(false);
  });

  it('keeps analytics off when IDs exist but opt-in is missing', () => {
    const env = parsePublicEnv({
      ...productionRuntime,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234',
      NEXT_PUBLIC_CLARITY_PROJECT_ID: 'clarity123',
    });

    // ID があるだけでは足りない。これが以前のフォールバックとの差。
    expect(env.analyticsEnabled).toBe(false);
  });

  it('enables configured analytics only in production runtime', () => {
    const source = {
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234',
      NEXT_PUBLIC_CLARITY_PROJECT_ID: 'clarity123',
      NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: 'true',
    };

    expect(parsePublicEnv({ ...productionRuntime, ...source }).analyticsEnabled).toBe(true);
    expect(parsePublicEnv({ ...productionRuntime, ...source }).vercelAnalyticsEnabled).toBe(true);

    // development では同じ設定でも送らない。ローカル作業が本番の計測を汚さないため。
    expect(parsePublicEnv({ NODE_ENV: 'development', ...source }).analyticsEnabled).toBe(false);
    expect(parsePublicEnv({ NODE_ENV: 'development', ...source }).vercelAnalyticsEnabled).toBe(false);

    // Vercel の preview も production runtime ではない。
    expect(
      parsePublicEnv({ NODE_ENV: 'production', VERCEL_ENV: 'preview', ...source }).analyticsEnabled,
    ).toBe(false);
  });

  it('treats a self-hosted production build without VERCEL_ENV as production runtime', () => {
    const env = parsePublicEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234',
    });

    expect(env.analyticsEnabled).toBe(true);
  });

  it('rejects invalid configured IDs in production', () => {
    expect(() =>
      parsePublicEnv({ ...productionRuntime, NEXT_PUBLIC_GA_MEASUREMENT_ID: 'invalid' }),
    ).toThrow('NEXT_PUBLIC_GA_MEASUREMENT_ID');

    expect(() =>
      parsePublicEnv({ ...productionRuntime, NEXT_PUBLIC_CLARITY_PROJECT_ID: 'has space' }),
    ).toThrow('NEXT_PUBLIC_CLARITY_PROJECT_ID');
  });

  it('rejects opt-in without any ID in production', () => {
    expect(() =>
      parsePublicEnv({ ...productionRuntime, NEXT_PUBLIC_ANALYTICS_ENABLED: 'true' }),
    ).toThrow('NEXT_PUBLIC_ANALYTICS_ENABLED');
  });

  it('does not throw on malformed values outside production runtime', () => {
    // ローカルで壊れた値を置いても開発は止めない。止めるのは本番だけ。
    expect(() =>
      parsePublicEnv({ NODE_ENV: 'development', NEXT_PUBLIC_GA_MEASUREMENT_ID: 'invalid' }),
    ).not.toThrow();
  });

  it('trims values and reads booleans case-insensitively', () => {
    const env = parsePublicEnv({
      ...productionRuntime,
      NEXT_PUBLIC_ANALYTICS_ENABLED: ' TRUE ',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: ' G-TEST1234 ',
    });

    expect(env.gaMeasurementId).toBe('G-TEST1234');
    expect(env.analyticsEnabled).toBe(true);
  });

  it('treats an empty string as unset', () => {
    const env = parsePublicEnv({ ...productionRuntime, NEXT_PUBLIC_FORMSPREE_FORM_ID: '  ' });

    expect(env.formspreeFormId).toBeNull();
  });
});
