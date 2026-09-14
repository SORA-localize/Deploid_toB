import type { ApprovableCollectionSlug } from './publishApprovedVersion';

/**
 * `ApprovableCollectionSlug` の実行時allowlist。型だけでは任意のslugが素通りするため、
 * `payload.find({ collection })` へ渡す前にここで閉じる。
 *
 * `src/app/api/admin/publish/route.ts`（単発publish）と
 * `src/app/api/admin/publish/bulk/route.ts`（一括publish）の両方が共有する。
 *
 * **配列ではなく `Record` にしてある。** `readonly ApprovableCollectionSlug[]` は
 * *部分集合*も受け付けるので、`ApprovableCollectionSlug` に新しいslugを足しても
 * ここへ書き忘れたことを型が検出できない。`satisfies Record<ApprovableCollectionSlug, true>`
 * なら**1件でも欠けるとtypecheckが落ちる**。
 */
export const PUBLISHABLE_COLLECTIONS = {
  manufacturers: true,
  distributors: true,
  'robot-series': true,
  robots: true,
  'use-cases': true,
  deployments: true,
  articles: true,
} satisfies Record<ApprovableCollectionSlug, true>;

export function isPublishableCollection(value: unknown): value is ApprovableCollectionSlug {
  return typeof value === 'string' && Object.hasOwn(PUBLISHABLE_COLLECTIONS, value);
}

/**
 * `/admin/draft-list` のコレクション別見出し表示用。各`collections/*.ts`の`labels.plural`と
 * 値を合わせてある（一致していないと「その名前で管理画面のどのメニューか」が編集者に伝わらない）。
 * ここが数少ない、admin本体の`labels`を手動で写す箇所——Payloadの`admin.components.views`は
 * 独自viewから他collectionの`config.collections[].labels`を直接読める型APIを公開していない
 * （`initPageResult.req.payload.collections[slug].config.labels`はランタイムには存在するが
 * 型上safeに辿れないため、素直に重複させて`npm run typecheck`の対象にする）。
 */
export const DRAFT_LIST_COLLECTION_LABELS: Record<ApprovableCollectionSlug, { ja: string; en: string }> = {
  manufacturers: { ja: 'メーカー', en: 'Manufacturers' },
  distributors: { ja: '代理店', en: 'Distributors' },
  'robot-series': { ja: 'シリーズ', en: 'Robot series' },
  robots: { ja: 'ロボット', en: 'Robots' },
  'use-cases': { ja: '用途', en: 'Use cases' },
  deployments: { ja: '導入事例（世界地図用）', en: 'Deployments (World Map)' },
  articles: { ja: '記事', en: 'Articles' },
};
