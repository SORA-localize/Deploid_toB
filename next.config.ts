import path from 'node:path';
import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { securityHeaders } from './lib/securityHeaders';

/**
 * `.mjs` から `.ts` へ変えたのは、header の正本を test と共有するため。
 * `tsconfig.json` は `allowJs: false` なので、`.mjs` の正本は TypeScript の test から
 * import できない（TS2307）。Next.js 16 は TypeScript config を直接読める。
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: path.resolve('.'),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // `(frontend)` と `(payload)` の2つの独立 root layout に分割した（Task 2）ため、どちらの
    // layoutにも一致しないURL（typo等）に対してNext.jsが選べるroot layoutが無い。
    // `src/app/global-not-found.tsx` を有効にして、この場合も自前のbrand付き404を返す。
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders],
      },
    ];
  },
};

export default withPayload(nextConfig);
