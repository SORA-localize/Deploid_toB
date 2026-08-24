import { describe, expect, it } from 'vitest';
import { resolvePublicServerUrl } from '@/lib/payload/resolvePublicServerUrl';

describe('resolvePublicServerUrl', () => {
  it('prefers an explicitly set PAYLOAD_PUBLIC_SERVER_URL over any Vercel-injected host', () => {
    expect(
      resolvePublicServerUrl({
        PAYLOAD_PUBLIC_SERVER_URL: 'https://explicit.example.com',
        VERCEL_BRANCH_URL: 'branch.vercel.app',
        VERCEL_URL: 'deployment.vercel.app',
      }),
    ).toBe('https://explicit.example.com');
  });

  it('falls back to VERCEL_BRANCH_URL (stable per-branch URL) when unset', () => {
    expect(
      resolvePublicServerUrl({
        VERCEL_BRANCH_URL: 'branch.vercel.app',
        VERCEL_URL: 'deployment.vercel.app',
      }),
    ).toBe('https://branch.vercel.app');
  });

  it('falls back to VERCEL_URL (per-deployment URL) when only that is set', () => {
    expect(
      resolvePublicServerUrl({
        VERCEL_URL: 'deployment.vercel.app',
      }),
    ).toBe('https://deployment.vercel.app');
  });

  it('returns undefined when nothing is set (e.g. local dev without .env.local)', () => {
    expect(resolvePublicServerUrl({})).toBeUndefined();
  });
});
