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
