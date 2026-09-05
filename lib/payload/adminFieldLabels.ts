/**
 * Payload Admin のfieldラベルの正本（`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 4）。
 *
 * D-3: ラベルは`collections/*.ts`に直接書かず、ここへ集約する（表記ゆれの検出のため）。
 * D-4: `payload.config.ts`の`supportedLanguages: { en, ja }`に合わせ、ja/en両方を持つ
 * （日本語だけ付けると英語localeで日本語が出る）。Payloadの`label`は`StaticLabel`
 * （`Record<string,string> | string`、`node_modules/payload/dist/config/types.d.ts:436`）
 * としてこの`{ja, en}`形をそのまま受け付ける。
 */
import type { Field } from 'payload';

export interface AdminFieldLabel {
  ja: string;
  en: string;
}

export type AdminFieldLabelMap = Record<string, AdminFieldLabel>;

/** Payload組み込みfield。個別にラベルを持たせる対象ではない。 */
const BUILTIN_FIELD_NAMES = new Set(['id', 'createdAt', 'updatedAt', '_status']);

function isFieldHidden(field: Field): boolean {
  const withHidden = field as Field & { hidden?: boolean; admin?: { hidden?: boolean } };
  return withHidden.hidden === true || withHidden.admin?.hidden === true;
}

/**
 * `fields`の直下（1階層）だけにlabelを付ける。nested groupやarrayの中身は、その入れ子を
 * 組み立てている場所（`sourcesField()`自身、または各collectionのgroup/array field定義の
 * 直下）で個別に呼ぶ。1回のwalkで全階層を処理しようとすると、同名field
 * （例: `reliability`がBaseRecord直下と`sources[]`の中の両方にある）が衝突するため、
 * 呼び出し側が「今どの階層のfieldsを見ているか」を知っている前提で、その階層に対応する
 * 狭い`labels`を渡す設計にしている。
 */
export function applyAdminFieldLabels<T extends Field[]>(fields: T, labels: AdminFieldLabelMap): T {
  for (const field of fields) {
    const name = (field as Field & { name?: string }).name;
    if (!name) continue;
    const label = labels[name];
    if (label) (field as Field & { label?: unknown }).label = label;
  }
  return fields;
}

/**
 * 未ラベルのfieldをnested/array/tabs/blocksまで再帰的に検出する（T4完了条件のテスト専用。
 * 実行時には使わない）。hidden fieldとPayload組み込みfieldは対象外。戻り値はdot区切りの
 * field path（例: `heroImage.rights.status`）。
 */
export function collectUnlabeledAdminFieldPaths(fields: Field[], prefix = ''): string[] {
  const gaps: string[] = [];
  for (const field of fields) {
    if (isFieldHidden(field)) continue;
    const withMeta = field as Field & {
      name?: string;
      label?: unknown;
      fields?: Field[];
      tabs?: { name?: string; fields: Field[] }[];
      blocks?: { fields: Field[] }[];
    };
    const name = withMeta.name;
    const path = name ? (prefix ? `${prefix}.${name}` : name) : prefix;
    if (name && !BUILTIN_FIELD_NAMES.has(name) && withMeta.label === undefined) {
      gaps.push(path);
    }
    if (withMeta.fields) gaps.push(...collectUnlabeledAdminFieldPaths(withMeta.fields, path));
    if (withMeta.tabs) {
      for (const tab of withMeta.tabs) {
        const tabPath = tab.name ? (path ? `${path}.${tab.name}` : tab.name) : path;
        gaps.push(...collectUnlabeledAdminFieldPaths(tab.fields, tabPath));
      }
    }
    if (withMeta.blocks) {
      for (const block of withMeta.blocks) {
        gaps.push(...collectUnlabeledAdminFieldPaths(block.fields, path));
      }
    }
  }
  return gaps;
}

// ==========================================================================
// 共有field（`lib/payload/access.ts`）。ここで1回だけ定義し、access.ts側の
// 各field生成関数がここを参照してlabelを付ける（collection側での複製はしない）。
// ==========================================================================

export const baseContentFieldLabels: AdminFieldLabelMap = {
  stableId: { ja: '内部ID（不変）', en: 'Stable ID (immutable)' },
  slug: { ja: 'URLスラッグ', en: 'URL slug' },
  previousSlugs: { ja: '旧URLスラッグ', en: 'Previous URL slugs' },
  lifecycleStatus: { ja: '掲載状態', en: 'Lifecycle status' },
};

export const sourcesItemFieldLabels: AdminFieldLabelMap = {
  title: { ja: '出典タイトル', en: 'Source title' },
  url: { ja: '出典URL', en: 'Source URL' },
  publisher: { ja: '発行元', en: 'Publisher' },
  publishedAt: { ja: '出典の公開日', en: 'Source published date' },
  checkedAt: { ja: '確認日', en: 'Checked date' },
  reliability: { ja: 'この出典の信頼度', en: 'Reliability of this source' },
  note: { ja: '備考', en: 'Note' },
};

export const rightsMetaFieldLabels: AdminFieldLabelMap = {
  status: { ja: '権利ステータス', en: 'Rights status' },
  sourceType: { ja: '入手元区分', en: 'Source type' },
  checkedAt: { ja: '確認日', en: 'Checked date' },
  rightsHolder: { ja: '権利者', en: 'Rights holder' },
  licenseUrl: { ja: 'ライセンスURL', en: 'License URL' },
  permissionNote: { ja: '許諾に関する備考', en: 'Permission note' },
};

export const imageAssetFieldLabels: AdminFieldLabelMap = {
  src: { ja: '画像URL', en: 'Image URL' },
  alt: { ja: '代替テキスト', en: 'Alt text' },
  credit: { ja: 'クレジット表記', en: 'Credit' },
  sourceUrl: { ja: '画像の出典URL', en: 'Image source URL' },
  rights: { ja: '権利情報', en: 'Rights' },
  aspectRatio: { ja: 'アスペクト比', en: 'Aspect ratio' },
};

export const seoFieldLabels: AdminFieldLabelMap = {
  metaTitle: { ja: 'SEOタイトル', en: 'SEO title' },
  metaDescription: { ja: 'SEO説明文', en: 'SEO description' },
  noindex: { ja: '検索エンジンに登録しない', en: 'Noindex' },
};

export const baseRecordContentFieldLabels: AdminFieldLabelMap = {
  summary: { ja: '概要（一覧・カード表示用）', en: 'Summary (for list/card display)' },
  reliability: { ja: '総合信頼度', en: 'Overall reliability' },
  sources: { ja: '出典', en: 'Sources' },
  nextReviewBy: { ja: '次回レビュー期限', en: 'Next review due date' },
  heroImage: { ja: 'メイン画像', en: 'Hero image' },
  seo: { ja: 'SEO設定', en: 'SEO settings' },
};

// ==========================================================================
// Manufacturers
// ==========================================================================

export const manufacturersFieldLabels: AdminFieldLabelMap = {
  name: { ja: '社名（英語表記）', en: 'Company name' },
  nameJa: { ja: '社名（日本語表記）', en: 'Company name (Japanese)' },
  companyType: { ja: '企業区分', en: 'Company type' },
  companyStatus: { ja: '稼働状況', en: 'Company status' },
  country: { ja: '本社国', en: 'Country' },
  hqCity: { ja: '本社都市', en: 'HQ city' },
  headquarters: { ja: '本社所在地（座標）', en: 'Headquarters (coordinates)' },
  foundedYear: { ja: '設立年', en: 'Founded year' },
  website: { ja: '公式サイトURL', en: 'Website URL' },
  logos: { ja: 'ロゴ（JSON）', en: 'Logos (JSON)' },
  contactUrl: { ja: '問い合わせ先URL', en: 'Contact URL' },
  description: { ja: '企業説明', en: 'Description' },
  japanPresence: { ja: '日本国内展開', en: 'Japan presence' },
  domesticDistributors: { ja: '国内代理店（移行前の互換フィールド）', en: 'Domestic distributors (legacy, pre-migration)' },
  distributorNote: { ja: '代理店に関する備考', en: 'Distributor note' },
  supportNote: { ja: 'サポートに関する備考', en: 'Support note' },
  procurementNote: { ja: '調達に関する備考', en: 'Procurement note' },
  vendorRiskNote: { ja: 'ベンダーリスクに関する備考', en: 'Vendor risk note' },
  featuredRank: { ja: '注目度順位（小さいほど上位表示）', en: 'Featured rank (lower = higher priority)' },
};

export const manufacturersHeadquartersFieldLabels: AdminFieldLabelMap = {
  lat: { ja: '緯度', en: 'Latitude' },
  lng: { ja: '経度', en: 'Longitude' },
};

export const manufacturersDomesticDistributorsFieldLabels: AdminFieldLabelMap = {
  name: { ja: '代理店名', en: 'Distributor name' },
  website: { ja: 'ウェブサイトURL', en: 'Website URL' },
  sourceUrl: { ja: '出典URL', en: 'Source URL' },
  checkedAt: { ja: '確認日', en: 'Checked date' },
  note: { ja: '備考', en: 'Note' },
};

// ==========================================================================
// Distributors
// ==========================================================================

export const distributorsFieldLabels: AdminFieldLabelMap = {
  name: { ja: '代理店名（英語表記）', en: 'Distributor name' },
  nameJa: { ja: '代理店名（日本語表記）', en: 'Distributor name (Japanese)' },
  website: { ja: '公式サイトURL', en: 'Website URL' },
  providerType: { ja: '取扱区分', en: 'Provider type' },
  handledManufacturerIds: { ja: '取扱メーカー', en: 'Handled manufacturers' },
  handledRobotIds: { ja: '取扱ロボット', en: 'Handled robots' },
  acquisitionMethods: { ja: '取得方法', en: 'Acquisition methods' },
  inquiryUrl: { ja: '問い合わせ先URL', en: 'Inquiry URL' },
  note: { ja: '備考', en: 'Note' },
};

// ==========================================================================
// RobotSeries
// ==========================================================================

export const robotSeriesFieldLabels: AdminFieldLabelMap = {
  name: { ja: 'シリーズ名（英語表記）', en: 'Series name' },
  nameJa: { ja: 'シリーズ名（日本語表記）', en: 'Series name (Japanese)' },
  manufacturerId: { ja: 'メーカー', en: 'Manufacturer' },
  description: { ja: 'シリーズ説明', en: 'Description' },
  images: { ja: '画像（JSON）', en: 'Images (JSON)' },
  industryTags: { ja: '業種タグ', en: 'Industry tags' },
  taskTags: { ja: 'タスクタグ', en: 'Task tags' },
};

// ==========================================================================
// Robots
// ==========================================================================

export const robotsFieldLabels: AdminFieldLabelMap = {
  name: { ja: '機体名（英語表記）', en: 'Robot name' },
  nameJa: { ja: '機体名（日本語表記）', en: 'Robot name (Japanese)' },
  manufacturerId: { ja: 'メーカー', en: 'Manufacturer' },
  seriesId: { ja: 'シリーズ', en: 'Series' },
  category: { ja: 'カテゴリ', en: 'Category' },
  description: { ja: '機体説明', en: 'Description' },
  featuredRank: { ja: '注目度順位（小さいほど上位表示）', en: 'Featured rank (lower = higher priority)' },
  deploymentStage: { ja: '展開段階', en: 'Deployment stage' },
  supersededById: { ja: '後継機', en: 'Superseded by' },
  specs: { ja: 'スペック（JSON）', en: 'Specs (JSON)' },
  procurementModels: { ja: '調達形態', en: 'Procurement models' },
  priceOffers: { ja: '価格情報', en: 'Price offers' },
  loadRatings: { ja: '可搬重量', en: 'Load ratings' },
  fieldEvidence: { ja: '項目別出典（JSON）', en: 'Field evidence (JSON)' },
  usageExampleSourceUrls: { ja: '活用事例の出典URL', en: 'Usage example source URLs' },
  japanAvailability: { ja: '国内入手性', en: 'Japan availability' },
  distributorJapan: { ja: '国内代理店名', en: 'Japan distributor name' },
  supportNote: { ja: 'サポートに関する備考', en: 'Support note' },
  images: { ja: '画像（JSON）', en: 'Images (JSON)' },
  industryTags: { ja: '業種タグ', en: 'Industry tags' },
  taskTags: { ja: 'タスクタグ', en: 'Task tags' },
  comparison: { ja: '比較情報（非推奨・/compare用に維持）', en: 'Comparison info (deprecated, kept for /compare)' },
};

export const robotsPriceOffersFieldLabels: AdminFieldLabelMap = {
  channel: { ja: '販売チャネル', en: 'Sales channel' },
  display: { ja: '表示用価格', en: 'Display price' },
  amount: { ja: '金額', en: 'Amount' },
  currency: { ja: '通貨', en: 'Currency' },
  taxStatus: { ja: '税込区分', en: 'Tax status' },
  variant: { ja: '型番・バリアント', en: 'Variant' },
  sellerName: { ja: '販売元名', en: 'Seller name' },
  sourceUrl: { ja: '出典URL', en: 'Source URL' },
};

export const robotsLoadRatingsFieldLabels: AdminFieldLabelMap = {
  scope: { ja: '対象部位', en: 'Scope' },
  rating: { ja: '定格区分', en: 'Rating type' },
  kg: { ja: '重量(kg)', en: 'Weight (kg)' },
  condition: { ja: '条件', en: 'Condition' },
  variant: { ja: '型番・バリアント', en: 'Variant' },
  sourceUrl: { ja: '出典URL', en: 'Source URL' },
};

export const robotsComparisonFieldLabels: AdminFieldLabelMap = {
  strengths: { ja: '強み', en: 'Strengths' },
  constraints: { ja: '制約', en: 'Constraints' },
  bestFit: { ja: '向いている用途', en: 'Best fit' },
  notFit: { ja: '向いていない用途', en: 'Not a fit' },
};

// ==========================================================================
// UseCases
// ==========================================================================

export const useCasesFieldLabels: AdminFieldLabelMap = {
  title: { ja: 'タイトル（英語表記）', en: 'Title' },
  titleJa: { ja: 'タイトル（日本語表記）', en: 'Title (Japanese)' },
  subtitle: { ja: 'サブタイトル', en: 'Subtitle' },
  maturityLevel: { ja: '実用化段階', en: 'Maturity level' },
  buyerReadiness: { ja: '導入検討度（Robotsからは廃止済み）', en: 'Buyer readiness (removed from Robots)' },
  environment: { ja: '稼働環境', en: 'Environment' },
  requiredCapabilities: { ja: '必要な能力', en: 'Required capabilities' },
  primaryIndustry: { ja: '主な業種', en: 'Primary industry' },
  industryTags: { ja: '業種タグ', en: 'Industry tags' },
  taskTags: { ja: 'タスクタグ', en: 'Task tags' },
  atAGlance: { ja: '要点まとめ', en: 'At a glance' },
  overview: { ja: '概要本文', en: 'Overview' },
  whyItMatters: { ja: '注目すべき理由', en: 'Why it matters' },
  capabilityNotes: { ja: '能力別の補足', en: 'Capability notes' },
  environmentRequirements: { ja: '環境要件', en: 'Environment requirements' },
  whyHardToday: { ja: '現時点で難しい理由', en: 'Why hard today' },
  japanDeploymentConditions: { ja: '国内導入の条件', en: 'Japan deployment conditions' },
  candidateRobots: { ja: '候補ロボット', en: 'Candidate robots' },
};

export const useCasesAtAGlanceFieldLabels: AdminFieldLabelMap = {
  whereFits: { ja: '適する場面', en: 'Where it fits' },
  whereDoesNotFit: { ja: '適さない場面', en: 'Where it does not fit' },
  mustBeTrue: { ja: '前提条件', en: 'Must be true' },
};

export const useCasesCapabilityNotesFieldLabels: AdminFieldLabelMap = {
  mobility: { ja: '移動', en: 'Mobility' },
  manipulation: { ja: 'マニピュレーション', en: 'Manipulation' },
  perception: { ja: '知覚', en: 'Perception' },
  autonomy: { ja: '自律 / 遠隔操作', en: 'Autonomy / teleoperation' },
  communication: { ja: 'コミュニケーション', en: 'Communication' },
  integration: { ja: '連携', en: 'Integration' },
};

export const useCasesCandidateRobotsFieldLabels: AdminFieldLabelMap = {
  robotId: { ja: 'ロボット', en: 'Robot' },
  seriesId: { ja: 'シリーズ', en: 'Series' },
  fit: { ja: '適合度', en: 'Fit' },
  basis: { ja: '根拠区分', en: 'Basis' },
  evidenceDeploymentIds: { ja: '根拠となる導入事例', en: 'Evidence deployments' },
  evidenceSourceUrls: { ja: '根拠の出典URL', en: 'Evidence source URLs' },
  reason: { ja: '選定理由', en: 'Reason' },
};

// ==========================================================================
// Deployments
// ==========================================================================

export const deploymentsFieldLabels: AdminFieldLabelMap = {
  manufacturerId: { ja: 'メーカー', en: 'Manufacturer' },
  robotId: { ja: 'ロボット', en: 'Robot' },
  customer: { ja: '導入先', en: 'Customer' },
  siteName: { ja: '拠点名', en: 'Site name' },
  country: { ja: '導入国', en: 'Country' },
  location: { ja: '所在地（座標）', en: 'Location (coordinates)' },
  status: { ja: '導入状況', en: 'Status' },
  startedAt: { ja: '導入開始時期', en: 'Started at' },
  relatedUseCaseIds: { ja: '関連ユースケース', en: 'Related use cases' },
};

export const deploymentsLocationFieldLabels: AdminFieldLabelMap = {
  lat: { ja: '緯度', en: 'Latitude' },
  lng: { ja: '経度', en: 'Longitude' },
};

// ==========================================================================
// Articles
// ==========================================================================

export const articlesFieldLabels: AdminFieldLabelMap = {
  title: { ja: 'タイトル（英語表記）', en: 'Title' },
  titleJa: { ja: 'タイトル（日本語表記）', en: 'Title (Japanese)' },
  category: { ja: 'カテゴリ', en: 'Category' },
  type: { ja: '記事タイプ', en: 'Article type' },
  section: { ja: 'セクション', en: 'Section' },
  contentKind: { ja: 'コンテンツ区分', en: 'Content kind' },
  publishedAt: { ja: '公開日', en: 'Published date' },
  author: { ja: '執筆者', en: 'Author' },
  industryTags: { ja: '業種タグ', en: 'Industry tags' },
  regionTags: { ja: '地域タグ', en: 'Region tags' },
  themeTags: { ja: 'テーマタグ', en: 'Theme tags' },
  whyItMatters: { ja: '注目すべき理由', en: 'Why it matters' },
  keyTakeaways: { ja: '要点', en: 'Key takeaways' },
  featured: { ja: '注目記事にする', en: 'Featured' },
  relatedRobotIds: { ja: '関連ロボット', en: 'Related robots' },
  relatedManufacturerIds: { ja: '関連メーカー', en: 'Related manufacturers' },
  relatedUseCaseIds: { ja: '関連ユースケース', en: 'Related use cases' },
  body: { ja: '本文（Markdown）', en: 'Body (Markdown)' },
  manufacturerGuideContent: { ja: 'メーカー解説コンテンツ（JSON）', en: 'Manufacturer guide content (JSON)' },
};

// ==========================================================================
// ArticlePlacements
// ==========================================================================

export const articlePlacementsFieldLabels: AdminFieldLabelMap = {
  surface: { ja: '掲載面', en: 'Surface' },
  slot: { ja: '掲載枠', en: 'Slot' },
  articleId: { ja: '記事', en: 'Article' },
  order: { ja: '表示順', en: 'Order' },
  kind: { ja: '掲載区分', en: 'Kind' },
  sponsor: { ja: 'スポンサー情報', en: 'Sponsor' },
};

export const articlePlacementsSponsorFieldLabels: AdminFieldLabelMap = {
  name: { ja: 'スポンサー名', en: 'Sponsor name' },
  url: { ja: 'スポンサーURL', en: 'Sponsor URL' },
  disclosure: { ja: '広告表記文言', en: 'Disclosure text' },
  campaignId: { ja: 'キャンペーンID', en: 'Campaign ID' },
};

// ==========================================================================
// SiteSettings（global）
// ==========================================================================

export const siteSettingsFieldLabels: AdminFieldLabelMap = {
  defaultSeo: { ja: '既定SEO設定', en: 'Default SEO' },
  announcementBanner: { ja: 'お知らせバナー', en: 'Announcement banner' },
  dataAsOf: { ja: 'データ基準時点', en: 'Data as of' },
  articleIndexPlacementLimits: { ja: '記事一覧の掲載上限', en: 'Article index placement limits' },
};

export const siteSettingsDefaultSeoFieldLabels: AdminFieldLabelMap = {
  metaTitle: { ja: 'SEOタイトル', en: 'SEO title' },
  metaDescription: { ja: 'SEO説明文', en: 'SEO description' },
};

export const siteSettingsAnnouncementBannerFieldLabels: AdminFieldLabelMap = {
  enabled: { ja: '表示する', en: 'Enabled' },
  message: { ja: 'メッセージ', en: 'Message' },
  url: { ja: 'リンク先URL', en: 'Link URL' },
};

export const siteSettingsArticleIndexPlacementLimitsFieldLabels: AdminFieldLabelMap = {
  hero: { ja: 'hero枠の上限', en: 'Hero slot limit' },
  feature: { ja: 'feature枠の上限', en: 'Feature slot limit' },
};
