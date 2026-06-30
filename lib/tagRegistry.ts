/**
 * タグの統制語彙（唯一の正本）。kind ごとに別々の軸で、値は kind 名前空間で一意。
 *
 * 軸の役割:
 * - industry / task: ロボット・用途・記事の検索ファセット。意図的に非MECE（重なりを許容）。
 * - region: 記事の地域ファセット（Article.regionTags。互いに重ならない地域バケット）。
 * - theme: 記事の論点（angle）ファセット（Article.themeTags、任意・0〜4個）。
 *
 * 1概念=1軸に保つ。記事の「主題」は Article.section（data/types.ts、必須・タブ）が正本で、
 * deployment/policy は section に属する。theme はそれと直交する細かい論点（資金調達・価格・安全 等）。
 * 企業名・機種名はタグにしない（relatedManufacturerIds / relatedRobotIds で表す）。
 * 新しい値はまずここに登録してからデータで使う（lib/validate.ts が未登録・件数違反を弾く）。
 */
export type TagKind =
  | 'industry'
  | 'task'
  | 'use-case-domain'
  | 'region'
  | 'theme';

export interface TagRegistryEntry {
  kind: TagKind;
  value: string;
  label: string;
}

export function normalizeTagKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export const tagRegistry = [
  // 正規産業タグ（8産業）
  { kind: 'industry', value: 'manufacturing', label: '製造' },
  { kind: 'industry', value: 'logistics', label: '物流' },
  { kind: 'industry', value: 'construction', label: '建設・インフラ' },
  { kind: 'industry', value: 'agriculture', label: '農業・食品生産' },
  { kind: 'industry', value: 'healthcare', label: '医療・介護' },
  { kind: 'industry', value: 'retail', label: '小売・店舗' },
  { kind: 'industry', value: 'facility-management', label: '施設管理' },
  { kind: 'industry', value: 'research', label: '研究・開発' },
  // 移行中の旧産業タグ（B-09/B-09b 完了後に削除）
  { kind: 'industry', value: 'healthcare-care', label: '医療・介護（旧）' },
  { kind: 'industry', value: 'hospitality', label: 'ホテル・接客（旧）' },
  { kind: 'industry', value: 'construction-infrastructure', label: '建設・インフラ（旧）' },
  { kind: 'industry', value: 'public-sector', label: '公共・行政（旧）' },
  { kind: 'industry', value: 'education', label: '教育（旧）' },
  { kind: 'industry', value: 'e-commerce', label: 'EC（旧）' },
  { kind: 'industry', value: 'plant', label: '工場（旧）' },
  { kind: 'industry', value: 'facility', label: '施設（旧）' },
  { kind: 'industry', value: 'marketing', label: 'マーケティング（旧）' },

  // 正規タスクタグ（11種）
  { kind: 'task', value: 'material-handling', label: '搬送・マテハン' },
  { kind: 'task', value: 'picking', label: 'ピッキング・仕分け' },
  { kind: 'task', value: 'assembly', label: '組立・加工' },
  { kind: 'task', value: 'inspection', label: '点検・検査' },
  { kind: 'task', value: 'patrol', label: '巡回・警備' },
  { kind: 'task', value: 'cleaning', label: '清掃・衛生管理' },
  { kind: 'task', value: 'physical-assistance', label: '身体介助・リハビリ' },
  { kind: 'task', value: 'customer-service', label: '接客・案内・配膳' },
  { kind: 'task', value: 'agricultural-work', label: '農作業・収穫' },
  { kind: 'task', value: 'hazardous-work', label: '危険作業・インフラ保守' },
  { kind: 'task', value: 'research-task', label: '研究・実験・検証' },
  // 移行中の旧タスクタグ（B-09/B-09c 完了後に削除）
  { kind: 'task', value: 'quality-inspection', label: '品質検査（旧）' },
  { kind: 'task', value: 'shelf-stocking', label: '棚補充（旧）' },
  { kind: 'task', value: 'disaster-response', label: '災害対応（旧）' },
  { kind: 'task', value: 'r-and-d', label: '研究開発（旧）' },
  { kind: 'task', value: 'hri', label: 'HRI（旧）' },
  { kind: 'task', value: 'control', label: '制御（旧）' },
  { kind: 'task', value: 'demo', label: 'デモ（旧）' },
  { kind: 'task', value: 'exhibition', label: '展示（旧）' },

  // use-case-domain: UseCase.primaryDomain/secondaryDomains の正本（廃止予定。B-01〜B-09 完了後に A-03 で削除）
  { kind: 'use-case-domain', value: 'move-goods', label: '物の運搬' },
  { kind: 'use-case-domain', value: 'manipulate-and-assemble', label: '組立・加工作業' },
  { kind: 'use-case-domain', value: 'inspect-and-record', label: '巡回・点検・記録' },
  { kind: 'use-case-domain', value: 'communicate-with-people', label: '人対応・案内' },
  { kind: 'use-case-domain', value: 'assist-human-body', label: '身体介助の代行' },
  { kind: 'use-case-domain', value: 'demonstrate-capability', label: '実演・デモ動作' },
  { kind: 'use-case-domain', value: 'validate-new-tech', label: '新技術・新動作の検証' },

  // 記事の地域ファセット（Article.regionTags）。検索・絞り込み用で互いに重ならない地域バケット。
  // 企業・機種は relatedManufacturerIds/relatedRobotIds で表すのでここには入れない。
  { kind: 'region', value: 'japan', label: '日本' },
  { kind: 'region', value: 'china', label: '中国' },
  { kind: 'region', value: 'korea', label: '韓国' },
  { kind: 'region', value: 'us', label: '米国' },
  { kind: 'region', value: 'europe', label: '欧州' },
  { kind: 'region', value: 'southeast-asia', label: '東南アジア' },
  { kind: 'region', value: 'global', label: 'グローバル' },

  // 記事のテーマファセット（Article.themeTags、任意）。section（主題）と直交する「記事の論点」軸。
  // 旧 article kind のテーマ語を統合した（例: market/analysis/forecast→market-analysis、
  // raas/subscription→business-model、viral/demo→pr-demo）。deployment/policy は section が正本のため持たない。
  { kind: 'theme', value: 'funding', label: '資金調達' },
  { kind: 'theme', value: 'ipo', label: 'IPO' },
  { kind: 'theme', value: 'pricing', label: '価格' },
  { kind: 'theme', value: 'business-model', label: 'ビジネスモデル' },
  { kind: 'theme', value: 'mass-production', label: '量産' },
  { kind: 'theme', value: 'commercialization', label: '商用化' },
  { kind: 'theme', value: 'market-analysis', label: '市場分析' },
  { kind: 'theme', value: 'safety', label: '安全' },
  { kind: 'theme', value: 'labor', label: '労使' },
  { kind: 'theme', value: 'consumer', label: '消費者向け' },
  { kind: 'theme', value: 'poc', label: 'PoC' },
  { kind: 'theme', value: 'physical-ai', label: 'フィジカルAI' },
  { kind: 'theme', value: 'pr-demo', label: 'デモ・話題' },
] as const satisfies readonly TagRegistryEntry[];

export type RegisteredTag = (typeof tagRegistry)[number];
export type TagValue<K extends TagKind> = Extract<RegisteredTag, { kind: K }>['value'];

const tagByKindAndKey = new Map(
  tagRegistry.map((entry) => [`${entry.kind}:${normalizeTagKey(entry.value)}`, entry]),
);

const tagDisplayIndexByKindAndKey = new Map(
  tagRegistry.map((entry, index) => [`${entry.kind}:${normalizeTagKey(entry.value)}`, index] as const),
);

const tagByKey = new Map<string, TagRegistryEntry>();
tagRegistry.forEach((entry) => {
  const key = normalizeTagKey(entry.value);
  if (!tagByKey.has(key)) tagByKey.set(key, entry);
});

export function getRegisteredTag(kind: TagKind, value: string) {
  return tagByKindAndKey.get(`${kind}:${normalizeTagKey(value)}`);
}

export function getAnyRegisteredTag(value: string) {
  return tagByKey.get(normalizeTagKey(value));
}

export function isRegisteredTag(kind: TagKind, value: string) {
  return Boolean(getRegisteredTag(kind, value));
}

export function getTagDisplayIndex(kind: TagKind, value: string) {
  return (
    tagDisplayIndexByKindAndKey.get(`${kind}:${normalizeTagKey(value)}`) ??
    Number.MAX_SAFE_INTEGER
  );
}
