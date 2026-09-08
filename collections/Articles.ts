import type { CollectionConfig } from 'payload';
import {
  assertBaseRecordPublishable,
  baseContentFields,
  baseRecordContentFields,
  contentCollectionAccess,
  contentCollectionBeforeOperationHooks,
  contentVersionsConfig,
  createPublishGateHook,
  createVersionRetentionGuardBeforeChangeHook,
  PublishValidationError, } from '../lib/payload/access';
import { applyAdminFieldLabels, articlesFieldLabels } from '../lib/payload/adminFieldLabels';
import { partitionFieldsByName, withSidebarPosition } from '../lib/payload/adminFieldLayout';
import { ADMIN_PUBLISH_INTENT_FIELD } from '../lib/payload/adminPublishIntent';
import {
  articleCategorySelectOptions,
  articleContentKindSelectOptions,
  articleSectionSelectOptions,
  articleTypeSelectOptions,
} from '../lib/payload/adminSelectLabels';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain } from '../lib/content/payloadMappers';
import type { Article } from '../lib/content/domainTypes';
import { contentPublishAdminComponents } from '../lib/payload/adminPublishComponents';
import { clearUnclaimedAdminPublishIntent } from '../lib/payload/adminPublishIntent';

interface ArticleCandidate {
  stableId?: string;
  slug?: string;
  summary?: string;
  sources?: unknown[];
  title?: string;
  category?: Article['category'];
  type?: string;
  section?: Article['section'];
  publishedAt?: string;
  whyItMatters?: string;
  manufacturerGuideContent?: unknown;
  _status?: 'draft' | 'published';
  lifecycleStatus?: 'active' | 'archived';
}

/**
 * `Article` は `StandardArticle | ManufacturerGuideArticle` の判別可能unionのため、書きかけの
 * draft candidate（`type` が未確定な段階もある）を素直に `Partial<Article>` へ当てはめようとすると
 * union分配でfield型が衝突する。ここでは publish gate 専用の緩い形だけを持つ。
 */
interface ArticlePublishCandidate {
  id?: string;
  slug?: string;
  summary?: string;
  sources?: Article['sources'];
  publishStatus?: Article['publishStatus'];
  title?: string;
  category?: Article['category'];
  type?: string;
  section?: Article['section'];
  publishedAt?: string;
  whyItMatters?: string;
  manufacturerGuideContent?: unknown;
}

function mapArticleCandidateToDomain(candidate: ArticleCandidate): ArticlePublishCandidate {
  return {
    id: candidate.stableId,
    slug: candidate.slug,
    summary: candidate.summary,
    sources: (candidate.sources as Article['sources']) ?? [],
    publishStatus: payloadStatusToDomain(candidate),
    title: candidate.title,
    category: candidate.category,
    type: candidate.type,
    section: candidate.section,
    publishedAt: candidate.publishedAt,
    whyItMatters: candidate.whyItMatters,
    manufacturerGuideContent: candidate.manufacturerGuideContent,
  };
}

function validateArticleForPublish(article: ArticlePublishCandidate): void {
  assertBaseRecordPublishable(article as Article);
  const missing: string[] = [];
  if (!article.title) missing.push('title');
  if (!article.category) missing.push('category');
  if (!article.type) missing.push('type');
  if (!article.section) missing.push('section');
  if (!article.publishedAt) missing.push('publishedAt');
  if (!article.whyItMatters) missing.push('whyItMatters');
  if (article.type === 'manufacturer-guide' && !article.manufacturerGuideContent) {
    missing.push('manufacturerGuideContent');
  }
  if (missing.length > 0) {
    throw new PublishValidationError(missing, 'articles');
  }
}

/**
 * T2（`docs/archive/admin-layout-rollout-plan-v1.md`、設計は
 * `docs/decisions/admin-field-layout-v1.md` §3 Articles）: 運用頻度で3層に分けた配置。
 * `sidebar`はTier3（滅多に触らない運用メタ）、tabはTier1（本文）→Tier2（分類・関連）→
 * Tier2〜3（画像・出典・特殊コンテンツ）の順。Manufacturers/Robots POCと同じ構成——
 * 名前の集合はこのファイル内で閉じており、抜けがあれば起動時にthrowする。
 */
const SIDEBAR_FIELD_NAMES = ['stableId', 'slug', 'previousSlugs', 'lifecycleStatus', 'nextReviewBy', 'featured'] as const;
const BODY_TAB_FIELD_NAMES = ['title', 'titleJa', 'summary', 'whyItMatters', 'keyTakeaways', 'body'] as const;
const CLASSIFICATION_TAB_FIELD_NAMES = [
  'category',
  'type',
  'section',
  'contentKind',
  'publishedAt',
  'author',
  'industryTags',
  'regionTags',
  'themeTags',
  'relatedRobotIds',
  'relatedManufacturerIds',
  'relatedUseCaseIds',
] as const;
const MEDIA_SOURCES_SPECIAL_CONTENT_TAB_FIELD_NAMES = ['heroImage', 'sources', 'reliability', 'seo', 'manufacturerGuideContent'] as const;

/** 旧 `reports` を改称・拡張したニュースメディア collection（`data-architecture-redesign-v1.md` §7）。 */
const articlesAllFields = applyAdminFieldLabels(
  [
      ...baseContentFields(),
      ...baseRecordContentFields(),
      { name: 'title', type: 'text', required: true },
      { name: 'titleJa', type: 'text' },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: articleCategorySelectOptions,
      },
      {
        name: 'type',
        type: 'select',
        required: true,
        options: articleTypeSelectOptions,
      },
      {
        name: 'section',
        type: 'select',
        required: true,
        options: articleSectionSelectOptions,
      },
      {
        name: 'contentKind',
        type: 'select',
        options: articleContentKindSelectOptions,
      },
      {
        name: 'publishedAt',
        type: 'text',
        required: true,
        // text型の理由: lib/payload/access.ts の sourcesField 冒頭コメント参照
        // （日付のみの値をtimestamptzにするとimport時のserver TZで日付がずれるため）。
        admin: {
          description: {
            ja: '記事の公開日。記事カード・記事詳細ページに表示されます。',
            en: "The article's publish date. Shown on the article card and detail page.",
          },
        },
      },
      { name: 'author', type: 'text' },
      { name: 'industryTags', type: 'text', hasMany: true },
      { name: 'regionTags', type: 'text', hasMany: true },
      { name: 'themeTags', type: 'text', hasMany: true },
      { name: 'whyItMatters', type: 'textarea', required: true },
      { name: 'keyTakeaways', type: 'text', hasMany: true },
      { name: 'featured', type: 'checkbox' },
      {
        name: 'relatedRobotIds',
        type: 'relationship',
        relationTo: 'robots',
        hasMany: true,
      },
      {
        name: 'relatedManufacturerIds',
        type: 'relationship',
        relationTo: 'manufacturers',
        hasMany: true,
      },
      {
        name: 'relatedUseCaseIds',
        type: 'relationship',
        relationTo: 'use-cases',
        hasMany: true,
      },
      {
        name: 'body',
        type: 'textarea',
        admin: {
          description: {
            ja: '記事本文（Markdown）。記事タイプが「メーカー解説」の場合はこちらではなく下の専用欄（manufacturerGuideContent）を使います。',
            en: 'Article body (Markdown). When the article type is "Manufacturer guide", use the dedicated field below (manufacturerGuideContent) instead of this one.',
          },
          condition: (_, siblingData) => siblingData?.type !== 'manufacturer-guide',
        },
      },
      {
        name: 'manufacturerGuideContent',
        type: 'json',
        // JSON形の内訳（`docs/decisions/editorial_style_guide_v1.md` §6のテンプレートに対応）:
        // `companyOverview`（企業概要）/`lineup`（機体ラインアップ）/`deploymentStatus`（導入実績）/
        // `procurementChannels`（購入・相談チャネル）/`faq`（よくある質問）等。
        //
        // `required: true` を付けられない: Payloadの`required`は条件付き必須を表現できず、
        // 常時必須にすると記事タイプが「メーカー解説」以外のときも保存できなくなる
        // （`admin.condition`でこのfield自体が非表示になるだけで、必須検証は別軸のため）。
        // 実際の必須判定は`validateArticleForPublish`（このファイル冒頭）が公開時に行う——
        // つまり画面には`*`が出ないが、記事タイプが「メーカー解説」なら公開に必須。
        admin: {
          description: {
            ja: '【記事タイプが「メーカー解説」のときは必須】メーカー解説の専用コンテンツ（企業概要・機体ラインアップ・導入実績・購入/相談チャネル・FAQ等）。記事タイプが「メーカー解説」の記事だけで使い、記事詳細ページの各セクションに表示されます。画面には必須マーク（*）が付きませんが、未入力のまま公開しようとするとエラーになります。',
            en: '[Required when article type is "Manufacturer guide"] Manufacturer-guide-only content (company overview, lineup, deployment status, procurement channels, FAQ, etc.). Used only when the article type is "Manufacturer guide" — rendered as the corresponding sections on the article detail page. No required-field mark (*) shows here, but publishing without it will fail.',
          },
          condition: (_, siblingData) => siblingData?.type === 'manufacturer-guide',
        },
      },
    ],
  articlesFieldLabels,
);

const { matched: sidebarFields, rest: afterSidebar } = partitionFieldsByName(articlesAllFields, SIDEBAR_FIELD_NAMES);
const { matched: bodyTabFields, rest: afterBody } = partitionFieldsByName(afterSidebar, BODY_TAB_FIELD_NAMES);
const { matched: classificationTabFields, rest: afterClassification } = partitionFieldsByName(
  afterBody,
  CLASSIFICATION_TAB_FIELD_NAMES,
);
const { matched: mediaSourcesSpecialContentTabFields, rest: unplacedFields } = partitionFieldsByName(
  afterClassification,
  MEDIA_SOURCES_SPECIAL_CONTENT_TAB_FIELD_NAMES,
);

/**
 * `unplacedFields`は`admin.hidden`な`adminPublishIntentField()`だけのはず
 * （表示場所を持たない）。それ以外が残っていたら、上記4つの名前リストへの追加漏れ——
 * 編集画面のどこにも表示されない field が生まれるので、起動時に気づけるようにする。
 */
const unexpectedlyUnplacedFields = unplacedFields.filter(
  (field) => (field as { name?: string }).name !== ADMIN_PUBLISH_INTENT_FIELD,
);
if (unexpectedlyUnplacedFields.length > 0) {
  throw new Error(
    `Articles admin field layout: unplaced field(s) — add to a tab/sidebar name list: ${unexpectedlyUnplacedFields
      .map((f) => (f as { name?: string }).name)
      .join(', ')}`,
  );
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  // 公開サイトの表記に合わせる（lib/uiText.ts の reports.title/breadcrumb = '記事'）。
  labels: { singular: { ja: '記事', en: 'Article' }, plural: { ja: '記事', en: 'Articles' } },
  admin: { useAsTitle: 'title', components: contentPublishAdminComponents },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...unplacedFields,
    ...withSidebarPosition(sidebarFields),
    {
      type: 'tabs',
      tabs: [
        { label: { ja: '本文', en: 'Body' }, fields: bodyTabFields },
        { label: { ja: '分類・関連', en: 'Classification & related' }, fields: classificationTabFields },
        { label: { ja: '画像・出典・特殊コンテンツ', en: 'Media, sources & special content' }, fields: mediaSourcesSpecialContentTabFields },
      ],
    },
  ],
  hooks: {
    beforeOperation: contentCollectionBeforeOperationHooks,
    beforeChange: [
      // 他のhookより先に置く: 以降のhookが正規化済みのtokenを見るようにする。
      clearUnclaimedAdminPublishIntent,
      createPublishGateHook({
        collectionSlug: 'articles',
        mapToDomain: async (candidate) => mapArticleCandidateToDomain(candidate as ArticleCandidate),
        validateForPublish: (domain) => validateArticleForPublish(domain as never),
      }),
      createVersionRetentionGuardBeforeChangeHook({ collectionSlug: 'articles' }),
    ],
    // Task 7 Step 3: publish後にpublicキャッシュを無効化する通知。
    afterChange: [createRevalidationAfterChangeHook('articles')],
  },
};
