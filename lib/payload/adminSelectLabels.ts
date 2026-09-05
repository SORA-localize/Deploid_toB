/**
 * Payload Admin の`select`fieldの選択肢ラベルの正本
 * （`docs/plans/admin-ux-and-revalidation-fix-plan-v1.md` Task 5、D-5）。
 *
 * D-5: 公開サイト側の`lib/labels.ts`は日本語のみの`Record<型, string>`で、公開ページが
 * 直接importして使っている。ここへ英語や`{ja,en}`形を混ぜると公開側の型・表示に影響するため、
 * admin専用の英語ラベル・`{ja,en}`組み立てはこのファイルに閉じる。
 *
 * 既存Recordがある値は**日本語テキストをここへ転記せず、`lib/labels.ts`のRecordを直接参照する**
 * （表記ゆれ防止）。英語ラベルはこのファイルだけが正本。
 */
import type { Field, Option } from 'payload';
import {
  articleCategoryLabels,
  articleSectionLabels,
  articleTypeLabels,
  buyerReadinessLabels,
  capabilityLabels,
  companyStatusLabels,
  companyTypeLabels,
  deploymentStageLabels,
  deploymentStatusLabels,
  japanAvailabilityLabels,
  japanPresenceLabels,
  maturityLabels,
  operatingEnvironmentLabels,
  procurementLabels,
  reliabilityLabels,
  robotCategoryLabels,
  robotLoadRatingLabels,
  robotLoadScopeLabels,
  robotPriceChannelLabels,
} from '../labels';

function opt(value: string, ja: string, en: string): Option {
  return { value, label: { ja, en } };
}

// ==========================================================================
// 共有field（`lib/payload/access.ts`）
// ==========================================================================

/** `baseContentFields()`の`lifecycleStatus`。公開サイトのRecordは無い（Payload/admin専用の軸）。 */
export const lifecycleStatusSelectOptions: Option[] = [
  opt('active', '掲載中', 'Active'),
  opt('archived', 'アーカイブ済み', 'Archived'),
];

/** `sourcesField()`の`reliability`と`baseRecordContentFields()`の`reliability`が共有する。 */
export const reliabilitySelectOptions: Option[] = (
  ['verified', 'official', 'reported', 'estimated'] as const
).map((v) =>
  opt(
    v,
    reliabilityLabels[v],
    { verified: 'Verified', official: 'Official', reported: 'Reported', estimated: 'Estimated' }[v],
  ),
);

/** `rightsMetaField()`の`status`（画像等の権利ステータス）。公開サイドのRecordは無い。 */
export const rightsStatusSelectOptions: Option[] = [
  opt('own', '自社保有', 'Owned'),
  opt('licensed', 'ライセンス取得済み', 'Licensed'),
  opt('commercial-permitted', '商用利用許諾済み', 'Commercial use permitted'),
  opt('reference-attributed', '出典表示で参照利用', 'Reference use (attributed)'),
  opt('permission-requested', '許諾申請中', 'Permission requested'),
  opt('prototype-only', '試作段階のみ', 'Prototype only'),
  opt('blocked', '使用不可', 'Blocked'),
];

/** `rightsMetaField()`の`sourceType`（画像等の入手元区分）。公開サイドのRecordは無い。 */
export const rightsSourceTypeSelectOptions: Option[] = [
  opt('own', '自社撮影・作成', 'Own'),
  opt('manufacturer-official', 'メーカー公式', 'Manufacturer official'),
  opt('partner-official', 'パートナー公式', 'Partner official'),
  opt('press-release', 'プレスリリース', 'Press release'),
  opt('third-party', '第三者', 'Third party'),
  opt('unknown', '不明', 'Unknown'),
];

// ==========================================================================
// ArticlePlacements
// ==========================================================================

/** `surface`（掲載面）。値は現状`reports-index`のみ。 */
export const articlePlacementSurfaceSelectOptions: Option[] = [
  opt('reports-index', '記事一覧ページ', 'Reports index page'),
];

/**
 * `slot`（掲載枠）。**`lib/labels.ts`の`imageRoleLabels.hero`（「メイン画像」＝画像の役割）を
 * 再利用しない**——ここでの`hero`は「記事配置の最上段」という別概念（D-5、T5対応表）。
 */
export const articlePlacementSlotSelectOptions: Option[] = [
  opt('hero', '最上段（トップ）', 'Top slot'),
  opt('feature', '注目枠', 'Feature slot'),
];

/**
 * `kind`（掲載区分）。`Articles.contentKind`と値が一部重複するが、`house`は
 * `ArticlePlacements`だけの値のため**別selectとして扱う**（T5対応表）。
 */
export const articlePlacementKindSelectOptions: Option[] = [
  opt('editorial', '編集部', 'Editorial'),
  opt('sample', 'サンプル', 'Sample'),
  opt('sponsored', 'スポンサード', 'Sponsored'),
  opt('house', '自社枠', 'House'),
];

// ==========================================================================
// Articles
// ==========================================================================

export const articleCategorySelectOptions: Option[] = (
  ['news', 'interview', 'company-report', 'analysis', 'policy'] as const
).map((v) =>
  opt(v, articleCategoryLabels[v], {
    news: 'News',
    interview: 'Interview',
    'company-report': 'Company report',
    analysis: 'Analysis',
    policy: 'Policy',
  }[v]),
);

export const articleTypeSelectOptions: Option[] = (
  [
    'analysis',
    'deployment-report',
    'interview',
    'event-report',
    'policy-update',
    'case-study',
    'news-brief',
    'tech-update',
    'market-analysis',
    'manufacturer-guide',
    'robot-guide',
    'basics-guide',
  ] as const
).map((v) =>
  opt(v, articleTypeLabels[v], {
    analysis: 'Analysis',
    'deployment-report': 'Deployment report',
    interview: 'Interview',
    'event-report': 'Event report',
    'policy-update': 'Policy update',
    'case-study': 'Case study',
    'news-brief': 'News brief',
    'tech-update': 'Tech update',
    'market-analysis': 'Market analysis',
    'manufacturer-guide': 'Manufacturer guide',
    'robot-guide': 'Robot guide',
    'basics-guide': 'Basics guide',
  }[v]),
);

export const articleSectionSelectOptions: Option[] = (
  ['digest', 'deployment', 'business', 'tech', 'policy', 'entertainment'] as const
).map((v) =>
  opt(v, articleSectionLabels[v], {
    digest: 'Digest',
    deployment: 'Deployment',
    business: 'Business',
    tech: 'Tech',
    policy: 'Policy',
    entertainment: 'Entertainment',
  }[v]),
);

/**
 * `Articles.contentKind`。`ArticlePlacements.kind`と値が一部重複するが**別selectとして扱う**
 * （T5対応表。`house`は持たない）。公開サイドのRecordは無い。
 */
export const articleContentKindSelectOptions: Option[] = [
  opt('editorial', '編集部', 'Editorial'),
  opt('sample', 'サンプル', 'Sample'),
  opt('sponsored', 'スポンサード', 'Sponsored'),
];

// ==========================================================================
// Distributors
// ==========================================================================

/** 公開サイドのRecordは無い。 */
export const distributorProviderTypeSelectOptions: Option[] = [
  opt('maker-direct', 'メーカー直販', 'Maker direct'),
  opt('reseller', '販売代理店', 'Reseller'),
  opt('other', 'その他', 'Other'),
];

/** `lib/labels.ts`の`procurementLabels`（`ProcurementModel`）の部分集合。 */
export const distributorAcquisitionMethodSelectOptions: Option[] = (
  ['purchase', 'lease', 'raas', 'subscription', 'inquiry'] as const
).map((v) =>
  opt(v, procurementLabels[v], {
    purchase: 'Purchase',
    lease: 'Lease',
    raas: 'RaaS',
    subscription: 'Subscription',
    inquiry: 'Inquiry',
  }[v]),
);

// ==========================================================================
// Deployments
// ==========================================================================

export const deploymentStatusSelectOptions: Option[] = (
  ['announced', 'pilot', 'production', 'ended', 'unknown'] as const
).map((v) =>
  opt(v, deploymentStatusLabels[v], {
    announced: 'Announced',
    pilot: 'Pilot',
    production: 'Production',
    ended: 'Ended',
    unknown: 'Unknown',
  }[v]),
);

// ==========================================================================
// Robots
// ==========================================================================

export const robotCategorySelectOptions: Option[] = (
  ['humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other'] as const
).map((v) =>
  opt(v, robotCategoryLabels[v], {
    humanoid: 'Humanoid',
    'general-purpose-robot': 'General-purpose robot',
    'upper-body-humanoid': 'Upper-body humanoid',
    'mobile-manipulator': 'Mobile manipulator',
    other: 'Other',
  }[v]),
);

export const robotDeploymentStageSelectOptions: Option[] = (
  ['concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued'] as const
).map((v) =>
  opt(v, deploymentStageLabels[v], {
    concept: 'Concept',
    prototype: 'Prototype',
    pilot: 'Pilot',
    'limited-production': 'Limited production',
    production: 'Production',
    'internal-use': 'Internal use only',
    discontinued: 'Discontinued',
  }[v]),
);

/** `procurementLabels`（`ProcurementModel`）の全7値。 */
export const robotProcurementModelSelectOptions: Option[] = (
  ['purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry'] as const
).map((v) =>
  opt(v, procurementLabels[v], {
    purchase: 'Purchase',
    lease: 'Lease',
    raas: 'RaaS',
    subscription: 'Subscription',
    'partner-program': 'Partner program',
    'not-for-sale': 'Not for sale',
    inquiry: 'Inquiry',
  }[v]),
);

export const robotPriceOfferChannelSelectOptions: Option[] = (
  ['manufacturer-public', 'authorized-distributor-public'] as const
).map((v) =>
  opt(v, robotPriceChannelLabels[v], {
    'manufacturer-public': 'Manufacturer public price',
    'authorized-distributor-public': 'Authorized distributor public price',
  }[v]),
);

/** 公開サイドのRecordは無い。 */
export const robotPriceOfferTaxStatusSelectOptions: Option[] = [
  opt('included', '税込', 'Tax included'),
  opt('excluded', '税別', 'Tax excluded'),
  opt('unknown', '不明', 'Unknown'),
];

export const robotLoadRatingScopeSelectOptions: Option[] = (
  ['single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording'] as const
).map((v) =>
  opt(v, robotLoadScopeLabels[v], {
    'single-arm': 'Single arm',
    'dual-arm': 'Dual arm',
    'whole-body': 'Whole body',
    carrier: 'Carrier',
    'manufacturer-wording': 'Manufacturer wording',
  }[v]),
);

export const robotLoadRatingKindSelectOptions: Option[] = (
  ['rated', 'maximum', 'unspecified'] as const
).map((v) =>
  opt(v, robotLoadRatingLabels[v], { rated: 'Rated', maximum: 'Maximum', unspecified: 'Unspecified' }[v]),
);

export const robotJapanAvailabilitySelectOptions: Option[] = (
  ['official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown'] as const
).map((v) =>
  opt(v, japanAvailabilityLabels[v], {
    'official-japan': 'Official Japan sales',
    'distributor-japan': 'Japan distributor available',
    'inquiry-required': 'Inquiry required',
    'import-only': 'Personal import only',
    unavailable: 'Not available in Japan',
    unknown: 'Unknown',
  }[v]),
);

// ==========================================================================
// Manufacturers
// ==========================================================================

export const manufacturerCompanyTypeSelectOptions: Option[] = (
  ['manufacturer', 'distributor', 'integrator', 'ai-os', 'research'] as const
).map((v) =>
  opt(v, companyTypeLabels[v], {
    manufacturer: 'Manufacturer',
    distributor: 'Distributor',
    integrator: 'Integrator',
    'ai-os': 'AI/OS',
    research: 'Research organization',
  }[v]),
);

export const manufacturerCompanyStatusSelectOptions: Option[] = (
  ['active', 'stealth', 'acquired', 'inactive'] as const
).map((v) =>
  opt(v, companyStatusLabels[v], {
    active: 'Active',
    stealth: 'Stealth',
    acquired: 'Acquired',
    inactive: 'Inactive',
  }[v]),
);

export const manufacturerJapanPresenceSelectOptions: Option[] = (
  ['office', 'distributor', 'partner', 'remote', 'none', 'unknown'] as const
).map((v) =>
  opt(v, japanPresenceLabels[v], {
    office: 'Japan office',
    distributor: 'Japan distributor',
    partner: 'Japan partner',
    remote: 'Remote support',
    none: 'No Japan presence',
    unknown: 'Unconfirmed',
  }[v]),
);

// ==========================================================================
// UseCases
// ==========================================================================

export const useCaseMaturityLevelSelectOptions: Option[] = (
  ['early-stage', 'pilot-phase', 'production-ready'] as const
).map((v) =>
  opt(v, maturityLabels[v], {
    'early-stage': 'Early stage',
    'pilot-phase': 'Pilot / PoC',
    'production-ready': 'Production ready',
  }[v]),
);

export const useCaseBuyerReadinessSelectOptions: Option[] = (
  ['initial-adoption', 'requires-poc', 'limited-today'] as const
).map((v) =>
  opt(v, buyerReadinessLabels[v], {
    'initial-adoption': 'Ready for initial adoption',
    'requires-poc': 'Requires PoC',
    'limited-today': 'Limited today',
  }[v]),
);

export const useCaseEnvironmentSelectOptions: Option[] = (
  ['indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous'] as const
).map((v) =>
  opt(v, operatingEnvironmentLabels[v], {
    'indoor-controlled': 'Indoor (controlled)',
    'indoor-semi-controlled': 'Indoor (semi-controlled)',
    outdoor: 'Outdoor',
    mixed: 'Mixed',
    hazardous: 'Hazardous',
  }[v]),
);

export const useCaseRequiredCapabilitySelectOptions: Option[] = (
  ['mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration'] as const
).map((v) =>
  opt(v, capabilityLabels[v], {
    mobility: 'Mobility',
    manipulation: 'Manipulation',
    perception: 'Perception',
    autonomy: 'Autonomy',
    communication: 'Communication',
    'data-capture': 'Data capture',
    integration: 'Integration',
  }[v]),
);

/** `candidateRobots[].fit`。公開サイドのRecordは無い。 */
export const useCaseCandidateRobotFitSelectOptions: Option[] = [
  opt('strong', '強く適合', 'Strong fit'),
  opt('possible', '適合の可能性', 'Possible fit'),
  opt('watch', '注視', 'Watch'),
];

/** `candidateRobots[].basis`。公開サイドのRecordは無い。 */
export const useCaseCandidateRobotBasisSelectOptions: Option[] = [
  opt('deployment', '導入実績', 'Deployment evidence'),
  opt('adjacent-deployment', '類似導入実績', 'Adjacent deployment evidence'),
  opt('official-use-case', 'メーカー公式ユースケース', 'Official use case'),
  opt('product-capability', '製品スペックから推定', 'Product capability'),
  opt('market-signal', '市場動向からの推定', 'Market signal'),
  opt('editorial-watch', '編集部の見立て', 'Editorial watch'),
];

// ==========================================================================
// テスト専用: 対象configを機械走査するためのヘルパー（実行時には使わない）。
// `lib/payload/adminFieldLabels.ts`の`collectUnlabeledAdminFieldPaths`と同じ考え方で、
// nested/array内のselect fieldもdot区切りpathで拾う。
// ==========================================================================

/** `select`fieldの1つ分のスナップショット。`values`は`options`から取り出したvalueの集合。 */
export interface SelectFieldSnapshot {
  path: string;
  /** `label`が`{ja, en}`（非空文字列2つ）を持たないoptionのvalue一覧。空なら全件ラベル済み。 */
  unlabeledValues: string[];
  values: string[];
}

function isPlainObjectLabel(label: unknown): label is { ja: unknown; en: unknown } {
  return typeof label === 'object' && label !== null;
}

function hasCompleteBilingualLabel(option: Option): boolean {
  if (typeof option === 'string') return false;
  const label = option.label;
  if (!isPlainObjectLabel(label)) return false;
  return typeof label.ja === 'string' && label.ja.length > 0 && typeof label.en === 'string' && label.en.length > 0;
}

function optionValue(option: Option): string {
  return typeof option === 'string' ? option : option.value;
}

/** `fields`をnested/array/tabs/blocksまで再帰的に走査し、`select`fieldごとのスナップショットを集める。 */
export function collectSelectFieldSnapshots(fields: Field[], prefix = ''): SelectFieldSnapshot[] {
  const snapshots: SelectFieldSnapshot[] = [];
  for (const field of fields) {
    const withMeta = field as Field & {
      name?: string;
      type?: string;
      options?: Option[];
      fields?: Field[];
      tabs?: { name?: string; fields: Field[] }[];
      blocks?: { fields: Field[] }[];
    };
    const name = withMeta.name;
    const path = name ? (prefix ? `${prefix}.${name}` : name) : prefix;
    if (withMeta.type === 'select' && withMeta.options) {
      snapshots.push({
        path,
        values: withMeta.options.map(optionValue),
        unlabeledValues: withMeta.options.filter((o) => !hasCompleteBilingualLabel(o)).map(optionValue),
      });
    }
    if (withMeta.fields) snapshots.push(...collectSelectFieldSnapshots(withMeta.fields, path));
    if (withMeta.tabs) {
      for (const tab of withMeta.tabs) {
        const tabPath = tab.name ? (path ? `${path}.${tab.name}` : tab.name) : path;
        snapshots.push(...collectSelectFieldSnapshots(tab.fields, tabPath));
      }
    }
    if (withMeta.blocks) {
      for (const block of withMeta.blocks) {
        snapshots.push(...collectSelectFieldSnapshots(block.fields, path));
      }
    }
  }
  return snapshots;
}
