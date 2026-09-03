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
} from '../lib/payload/access';
import { createRevalidationAfterChangeHook } from '../lib/payload/revalidationHook';
import { payloadStatusToDomain } from '../lib/content/payloadMappers';
import type { Article } from '../lib/content/domainTypes';
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
    throw new Error(`publish-validation-failed: articles missing ${missing.join(', ')}`);
  }
}

/** 旧 `reports` を改称・拡張したニュースメディア collection（`data-architecture-redesign-v1.md` §7）。 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title' },
  access: contentCollectionAccess,
  versions: contentVersionsConfig,
  fields: [
    ...baseContentFields(),
    ...baseRecordContentFields(),
    { name: 'title', type: 'text' },
    { name: 'titleJa', type: 'text' },
    {
      name: 'category',
      type: 'select',
      options: ['news', 'interview', 'company-report', 'analysis', 'policy'],
    },
    {
      name: 'type',
      type: 'select',
      options: [
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
      ],
    },
    {
      name: 'section',
      type: 'select',
      options: ['digest', 'deployment', 'business', 'tech', 'policy', 'entertainment'],
    },
    {
      name: 'contentKind',
      type: 'select',
      options: ['editorial', 'sample', 'sponsored'],
    },
    { name: 'publishedAt', type: 'text', admin: { description: '日付のみの値。timestamptz にすると import 時の server TZ で日付がずれるため text（Task 5、詳細は lib/payload/access.ts の sourcesField）。' } },
    { name: 'author', type: 'text' },
    { name: 'industryTags', type: 'text', hasMany: true },
    { name: 'regionTags', type: 'text', hasMany: true },
    { name: 'themeTags', type: 'text', hasMany: true },
    { name: 'whyItMatters', type: 'textarea' },
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
        description: 'Markdown本文。type === manufacturer-guide の記事では使わない（manufacturerGuideContentを使う）。',
        condition: (_, siblingData) => siblingData?.type !== 'manufacturer-guide',
      },
    },
    {
      name: 'manufacturerGuideContent',
      type: 'json',
      admin: {
        description: 'ManufacturerGuideContent（companyOverview / lineup / deploymentStatus / procurementChannels / faq 等）。type === manufacturer-guide の記事だけ使う。',
        condition: (_, siblingData) => siblingData?.type === 'manufacturer-guide',
      },
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
