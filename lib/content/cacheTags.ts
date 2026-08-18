/**
 * Content cache tagとrevalidation webhookの署名/検証（`docs/plans/content-platform-migration-plan-v1.md`
 * Task 7 Step 2・3）。
 *
 * ## なぜ「Payloadのafter changeフックが直接 `revalidateTag()` を呼ばない」のか
 *
 * `revalidateTag()`（`next/cache`）はNext.jsのrequestスコープ（Route Handler / Server Action）
 * の中でしか呼べない。Payloadのcollection hookは、このNext.jsアプリに埋め込まれたRoute
 * Handler経由のリクエスト（管理画面・公開API）だけでなく、`payload migrate` / `content:import` /
 * `tests/content/*.test.ts` のようにNext.jsのrequestスコープの外（プレーンなNode process、
 * vitestのLocal API呼び出し）からも実行される。そこで無条件に `revalidateTag()` を呼ぶと、
 * それらの経路すべてを壊す。
 *
 * そのため、実際に `revalidateTag()` を呼ぶ場所は `src/app/api/revalidate-content/route.ts`
 * （本物のRoute Handler）1箇所に絞り、collection hook側は「このHTTPエンドポイントへ署名付きで
 * 通知するだけ」にする（`lib/payload/revalidationHook.ts`）。通知が届かなくても
 * （Next.jsサーバーが起動していない、ネットワーク不通等）、公開そのものはfail-openにする
 * （キャッシュの新鮮さが1回落ちるだけで、データの正しさやセキュリティには影響しない）。
 *
 * ## fail-closedな署名検証
 *
 * `REVALIDATION_SECRET` が未設定、署名ヘッダが無い、署名が一致しない、collection名が
 * allowlist外——これらはすべて401/400で拒否する。「とりあえず通す」分岐は無い。
 * 比較は `crypto.timingSafeEqual` で行い、文字列の `===` は使わない。
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 公開content 9 collection + `site-settings` globalのcache tag（Step 3）。
 * Task 4の契約表（`robotSeries` / `distributors` / `media` を含む）と同じ集合。
 * 1つでも抜けると、そのcollectionだけpublish後に古い値が残り続ける。
 */
export const contentTags = {
  robots: 'content:robots',
  robotSeries: 'content:robot-series',
  distributors: 'content:distributors',
  manufacturers: 'content:manufacturers',
  useCases: 'content:use-cases',
  deployments: 'content:deployments',
  articles: 'content:articles',
  articlePlacements: 'content:article-placements',
  media: 'content:media',
  settings: 'content:settings',
} as const;

export type ContentTagKey = keyof typeof contentTags;
export type ContentTagValue = (typeof contentTags)[ContentTagKey];

/**
 * Payload collection slug（+ `site-settings` global）→ `contentTags` key。
 * webhookのcollection allowlistと、collection hookが送るcollection名の両方がこの1つの表を通る
 * ので、どちらかだけ更新して他方が古いまま、という乖離が構造的に起きない。
 */
export const COLLECTION_TO_TAG_KEY = {
  robots: 'robots',
  'robot-series': 'robotSeries',
  distributors: 'distributors',
  manufacturers: 'manufacturers',
  'use-cases': 'useCases',
  deployments: 'deployments',
  articles: 'articles',
  'article-placements': 'articlePlacements',
  media: 'media',
  'site-settings': 'settings',
} as const satisfies Record<string, ContentTagKey>;

export type RevalidatableCollectionSlug = keyof typeof COLLECTION_TO_TAG_KEY;

const REVALIDATABLE_COLLECTION_SLUGS = new Set<string>(Object.keys(COLLECTION_TO_TAG_KEY));

export function isRevalidatableCollectionSlug(value: unknown): value is RevalidatableCollectionSlug {
  return typeof value === 'string' && REVALIDATABLE_COLLECTION_SLUGS.has(value);
}

/** collection slugからtag値を1箇所で解決する。allowlist外は呼び出し禁止（呼び出し前に検証すること）。 */
export function tagForCollection(collectionSlug: RevalidatableCollectionSlug): ContentTagValue {
  return contentTags[COLLECTION_TO_TAG_KEY[collectionSlug]];
}

const SIGNATURE_HEADER = 'x-revalidate-signature';
export const REVALIDATE_SIGNATURE_HEADER = SIGNATURE_HEADER;

/** HMAC-SHA256 over the raw request body bytes, hex-encoded. */
export function computeRevalidationSignature(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/**
 * fail-closed: secret未設定・ヘッダ欠落・不正な16進・長さ不一致・不一致のいずれでも `false`。
 * `timingSafeEqual` は長さが違うと例外を投げるため、長さ比較を先に行ってから渡す
 * （長さの違い自体は攻撃者に新しい情報を与えない——正しい署名は常にSHA-256の32byte固定長なので、
 * 長さ違いの入力はその時点で無条件に不正と分かる）。
 */
export function verifyRevalidationSignature(rawBody: string, providedSignatureHeader: string | null): boolean {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) return false;
  if (!providedSignatureHeader) return false;
  if (!/^[0-9a-f]+$/i.test(providedSignatureHeader)) return false;

  const expectedHex = computeRevalidationSignature(rawBody, secret);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const providedBuf = Buffer.from(providedSignatureHeader, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
