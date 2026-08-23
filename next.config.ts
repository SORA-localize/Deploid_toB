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
  // audit-upload route（`docs/reference/task9-audit-upload-endpoint-design-v1.md`）専用。
  // `scripts/fetch-cosign-binary.mjs`がbuild時（`vercel-build`）に取得したcosign binaryを、
  // 署名検証を実際に行う2つのrouteのVercel Function bundleへ明示的に含める。他のrouteは
  // cosignを使わないため対象に含めない（bundle sizeを不要に増やさない）。POCで実Preview
  // deploymentにて動作確認済みの構成（`task9-audit-upload-endpoint-design-v1.md`「POC結果」）。
  outputFileTracingIncludes: {
    '/api/admin/audit-upload/session': ['./.cosign-bin/cosign'],
    '/api/admin/audit-upload/session/[sessionId]/complete': ['./.cosign-bin/cosign'],
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
