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
  // Next.js image optimization uses Sharp. Keep the native module outside the
  // Turbopack bundle so the runtime resolves the platform-specific @img/sharp-*
  // optional dependency installed by Vercel.
  serverExternalPackages: ['sharp'],
  outputFileTracingIncludes: {
    // `contains: true` is used by Next's route matcher. `!(/**)` is therefore
    // intentional: it matches the static session route but not its children.
    '/api/admin/audit-upload/session!(/**)': ['./.cosign-bin/cosign'],
    '/api/admin/audit-upload/session/\\[sessionId\\]/complete': ['./.cosign-bin/cosign'],
  },
  outputFileTracingExcludes: {
    '/api/admin/audit-upload/**': [
      'tests/**',
      'docs/**',
      'media/**',
      'public/**',
      'migrations/**',
      'package-lock.json',
      'tsconfig.tsbuildinfo',
    ],
  },
  turbopack: {
    root: path.resolve('.'),
  },
  // audit-upload route（`docs/reference/task9-audit-upload-endpoint-design-v1.md`）専用。
  // `scripts/fetch-cosign-binary.mjs`がbuild時（`vercel-build`）に取得したcosign binaryを、
  // 署名検証を実際に行う2つのrouteのVercel Function bundleへ明示的に含める。他のrouteは
  // cosignを使わないため対象に含めない（bundle sizeを不要に増やさない）。POCで実Preview
  // deploymentにて動作確認済みの構成（`task9-audit-upload-endpoint-design-v1.md`「POC結果」）。
  images: {
    formats: ['image/avif', 'image/webp'],
    // `heroImage.src`等（`lib/payload/access.ts`の`imageAssetField()`）はただのtext fieldで、
    // Payload Media（Vercel Blob）へアップロードして発行されたURL、またはWikimedia Commonsの
    // ようなCC画像の外部URLを直接貼れる設計（`collections/Media.ts`参照）。next/imageは
    // 同一origin外のhostnameをここで明示許可しないと最適化を拒否するため、その2つを追加した。
    // 現行データは全て`/public/images/...`のローカルパス（同一origin）のみで、このリストが
    // 無くても動いていたが、外部URL運用へ切り替えるとこの許可が無いと画像最適化が失敗する。
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'clonerobotics.com' },
      // 以下、ロボDB.xlsx（発表済みロボットシート、メーカー名セルの埋め込みリンク）から抽出した
      // 公式サイトホスト（2026-09-08）。実際に画像を貼る際は、画像ファイル自身のURLの
      // hostnameがここと一致するか必ず確認すること（同じ会社でもwww有無やCDN別ドメインで
      // 食い違うことがある。例: 川崎重工業はここでは khi.co.jp だが、既存データの一部は
      // global.kawasaki.com を使っている）。
      { protocol: 'https', hostname: 'www.1x.tech' },
      { protocol: 'https', hostname: 'ai2robotics.com' },
      { protocol: 'https', hostname: 'anyverse.com' },
      { protocol: 'https', hostname: 'www.agile-robots.com' },
      { protocol: 'https', hostname: 'www.agilityrobotics.com' },
      { protocol: 'https', hostname: 'apptronik.com' },
      { protocol: 'https', hostname: 'www.astribot.com' },
      { protocol: 'https', hostname: 'www.booster.tech' },
      { protocol: 'https', hostname: 'bostondynamics.com' },
      { protocol: 'https', hostname: 'casbot.tech' },
      { protocol: 'https', hostname: 'www.dobot-robots.com' },
      { protocol: 'https', hostname: 'www.engineai.com.cn' },
      { protocol: 'https', hostname: 'www.figure.ai' },
      { protocol: 'https', hostname: 'www.fftai.com' },
      { protocol: 'https', hostname: 'galaxea-dynamics.com' },
      { protocol: 'https', hostname: 'www.galbot.com' },
      { protocol: 'https', hostname: 'www.genesis.ai' },
      { protocol: 'https', hostname: 'gigaai.cc' },
      { protocol: 'https', hostname: 'thehumanoid.ai' },
      { protocol: 'https', hostname: 'www.gotokepler.com' },
      { protocol: 'https', hostname: 'www.lg.com' },
      { protocol: 'https', hostname: 'www.lejurobot.com' },
      { protocol: 'https', hostname: 'kuavo.lejurobot.com' },
      { protocol: 'https', hostname: 'limxdynamics.com' },
      { protocol: 'https', hostname: 'neura-robotics.com' },
      { protocol: 'https', hostname: 'www.openloong.org.cn' },
      { protocol: 'https', hostname: 'www.oversonicrobotics.com' },
      { protocol: 'https', hostname: 'pal-robotics.com' },
      { protocol: 'https', hostname: 'www.perceptyne.com' },
      { protocol: 'https', hostname: 'www.psibot.ai' },
      { protocol: 'https', hostname: 'www.robotis.com' },
      { protocol: 'https', hostname: 'www.rainbow-robotics.com' },
      { protocol: 'https', hostname: 'www.roboforce.ai' },
      // 「Robot.com」社は元々 `http://robot.com` として抽出していたが誤り
      // （実サイトは `https://www.robot.com/`）。加えてNext.jsは`remotePatterns`を
      // 50件までしか許可せず（超えるとbuild自体が`Fatal next config errors`で落ちる——
      // 2026-09-10にPR#76再pushで実際に踏んだ）、48件の速報的な追加でちょうど51件になり
      // 上限を超えていた。他社と違いこの1件はどのロボットデータにもまだ使われていないため、
      // 誤った形のまま残すより削除して上限内に収める。実際にRobot.com社の画像を貼る時が来たら
      // この直後のエントリのすぐ上に、正しい形（`https`, `www.robot.com`）で入れ直すこと。
      { protocol: 'https', hostname: 'www.robotera.com' },
      { protocol: 'https', hostname: 'sanctuary.ai' },
      { protocol: 'https', hostname: 'www.sunday.ai' },
      { protocol: 'https', hostname: 'unix-group.ai' },
      { protocol: 'https', hostname: 'www.unitree.com' },
      { protocol: 'https', hostname: 'en.wandercraft.eu' },
      { protocol: 'https', hostname: 'www.weaverobotics.com' },
      { protocol: 'https', hostname: 'www.westwoodrobotics.io' },
      { protocol: 'https', hostname: 'x2robot.com' },
      { protocol: 'https', hostname: 'www.x-humanoid.com' },
      { protocol: 'https', hostname: 'www.xpeng.com' },
      { protocol: 'https', hostname: 'www.donutrobotics.com' },
      { protocol: 'https', hostname: 'ugo.plus' },
      { protocol: 'https', hostname: 'www.khi.co.jp' },
    ],
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
