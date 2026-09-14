import type { Payload } from 'payload';
import { PUBLISHABLE_COLLECTIONS } from './adminPublishableCollections';
import type { ApprovableCollectionSlug } from './publishApprovedVersion';

/**
 * `/admin/draft-list` が表示する、コレクション横断のdraft一覧。
 *
 * ## `draft: true` を付ける理由
 *
 * `payload.find({ collection, draft: true, where: { _status: { equals: 'draft' } } })` は
 * versions表を見る問い合わせへ書き換わる（`_status`を条件にした時点でversion側の
 * `version._status`を見る）。これにより次の2パターンを両方とも正しく拾える。
 *
 * 1. 一度もpublishされていないdocument（main rowの`_status`も`draft`）
 * 2. publish済みだが、その後の編集がまだ未反映のdocument（main rowの`_status`は
 *    `published`のまま——draft保存はmain rowを書き換えない——だが最新versionは`draft`）
 *
 * `draft: true`を付けずに素朴に`find`すると2を見落とす。運用上はこちらの方が多い
 * （新規追加より既存レコードの更新の方が頻度が高い）ため、ここを間違えると
 * 一覧が実態より薄くなる。
 */

export interface DraftListItem {
  collection: ApprovableCollectionSlug;
  id: string | number;
  stableId: string;
  title: string;
  updatedAt: string;
}

/** 各collectionの`useAsTitle`に合わせたタイトル解決（`collections/*.ts`で実際に確認済み）。 */
const DRAFT_TITLE_RESOLVERS: Record<ApprovableCollectionSlug, (doc: Record<string, unknown>) => string> = {
  manufacturers: (doc) => asText(doc.name),
  distributors: (doc) => asText(doc.name),
  'robot-series': (doc) => asText(doc.name),
  robots: (doc) => asText(doc.name),
  'use-cases': (doc) => asText(doc.title),
  articles: (doc) => asText(doc.title),
  deployments: (doc) => {
    const customer = asText(doc.customer);
    const siteName = asText(doc.siteName);
    return siteName ? `${customer} — ${siteName}` : customer;
  },
};

/** 各collectionへ渡す`select`。タイトル解決に要るfieldだけを読む（articlesのrich textを避ける）。 */
const DRAFT_SELECT_FIELDS: Record<ApprovableCollectionSlug, Record<string, true>> = {
  manufacturers: { stableId: true, name: true, updatedAt: true },
  distributors: { stableId: true, name: true, updatedAt: true },
  'robot-series': { stableId: true, name: true, updatedAt: true },
  robots: { stableId: true, name: true, updatedAt: true },
  'use-cases': { stableId: true, title: true, updatedAt: true },
  articles: { stableId: true, title: true, updatedAt: true },
  deployments: { stableId: true, customer: true, siteName: true, updatedAt: true },
};

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function listDraftsForCollection(payload: Payload, collection: ApprovableCollectionSlug): Promise<DraftListItem[]> {
  const { docs } = await payload.find({
    collection,
    draft: true,
    where: { _status: { equals: 'draft' } },
    overrideAccess: true,
    depth: 0,
    limit: 100,
    sort: '-updatedAt',
    select: DRAFT_SELECT_FIELDS[collection],
  });

  const resolveTitle = DRAFT_TITLE_RESOLVERS[collection];
  return (docs as unknown as Array<Record<string, unknown>>)
    .filter((doc) => typeof doc.stableId === 'string' && doc.stableId.length > 0)
    .map((doc) => ({
      collection,
      id: doc.id as string | number,
      stableId: doc.stableId as string,
      title: resolveTitle(doc) || doc.stableId as string,
      updatedAt: asText(doc.updatedAt),
    }));
}

export async function listDraftDocumentsForAdmin({ payload }: { payload: Payload }): Promise<DraftListItem[]> {
  const collections = Object.keys(PUBLISHABLE_COLLECTIONS) as ApprovableCollectionSlug[];
  const perCollection = await Promise.all(collections.map((collection) => listDraftsForCollection(payload, collection)));
  return perCollection.flat().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
