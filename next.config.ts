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
