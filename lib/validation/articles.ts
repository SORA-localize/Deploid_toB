import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import { manufacturerGuideDeploymentCategoryOrder } from '../display.ts';
import {
  checkDate,
  checkDisplayableReference,
  checkImageAsset,
  checkReference,
  checkRequiredSources,
  checkTags,
  checkUniqueValues,
  checkUrl,
} from './common.ts';
import { buildReferenceIndex } from './crossCollection.ts';
import type { ValidationCollector } from './types.ts';

// manufacturer-guide は本文を manufacturerGuideContent に持つ固定テンプレート型。
// 型では表現しきれない「非空文字であること」「prose に見出しを持ち込まないこと」をここで確認する。
// monolith ではこのブロックが robots/manufacturers/useCases の各ループより前に位置していたため、
// orchestrator が validateArticles（本ループ）や validateArticlePlacements とは別に単独で呼ぶ。
export function validateManufacturerGuideContent(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
): void {
  const { articles, robots } = snapshot;
  for (const article of articles) {
    if (article.type !== 'manufacturer-guide') continue;
    const content = article.manufacturerGuideContent;
    // prose フィールドは string 型のトップレベル値をすべて対象にする（新フィールド追加時の列挙漏れ防止）。
    Object.entries(content).forEach(([field, value]) => {
      if (typeof value !== 'string') return;
      if (!value.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: ${field} が空です`);
      }
      // 見出しはテンプレート（MANUFACTURER_GUIDE_SECTIONS）の専有。prose に Markdown 見出しが
      // 混入すると TOC・スクロール連動の外に h2 が生まれるため build で弾く。
      if (/^#{1,6}\s/m.test(value)) {
        collector.error(
          `[manufacturerGuideContent] ${article.slug}: ${field} に Markdown 見出しが含まれています（見出しはテンプレート固定）`,
        );
      }
    });
    const articleSourceUrls = new Set(article.sources.map((s) => s.url));
    manufacturerGuideDeploymentCategoryOrder.forEach((category) => {
      const item = content.deploymentStatus[category];
      if (!item || !item.body.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: deploymentStatus.${category} が不完全です`);
        return;
      }
      // evidence が none 以外の行は根拠URL必須。URLは記事 sources[] と一致させる。
      if (item.evidence !== 'none') {
        if (!item.sourceUrls || item.sourceUrls.length === 0) {
          collector.error(
            `[manufacturerGuideContent] ${article.slug}: deploymentStatus.${category} に sourceUrls がありません（evidence が none 以外は必須）`,
          );
        }
      }
      (item.sourceUrls ?? []).forEach((url) => {
        if (!articleSourceUrls.has(url)) {
          collector.error(
            `[manufacturerGuideContent] ${article.slug}: deploymentStatus.${category}.sourceUrls の "${url}" が記事 sources[] に登録されていません`,
          );
        }
      });
    });
    if (content.procurementChannels.length === 0) {
      collector.error(
        `[manufacturerGuideContent] ${article.slug}: procurementChannels が空です（国内窓口が無い場合も公式問い合わせ窓口を載せる）`,
      );
    }
    content.procurementChannels.forEach((channel, i) => {
      if (!channel.name.trim() || !channel.role.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: procurementChannels[${i}] の name/role が空です`);
      }
      if (!/^https?:\/\//.test(channel.url)) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: procurementChannels[${i}].url の形式が不正です`);
      }
    });
    if (content.lineup.length === 0) {
      collector.error(`[manufacturerGuideContent] ${article.slug}: lineup が空です`);
    }
    const robotIdSet = new Set(robots.map((r) => r.id));
    content.lineup.forEach((row) => {
      if (!robotIdSet.has(row.robotId)) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: lineup の robotId "${row.robotId}" が存在しません`);
      }
      if (!row.roleLabel.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: lineup.${row.robotId} の roleLabel が空です`);
      }
    });
    content.faq.forEach((item, i) => {
      if (!item.question.trim() || !item.answer.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: faq[${i}] が不完全です`);
      }
      if (/^#{1,6}\s/m.test(item.answer)) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: faq[${i}] の回答に Markdown 見出しが含まれています`);
      }
    });
    (content.videos ?? []).forEach((video, i) => {
      if (!/^[A-Za-z0-9_-]{11}$/.test(video.videoId)) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: videos[${i}].videoId の形式が不正です`);
      }
      if (!video.title.trim() || !video.channelName.trim() || !video.channelUrl.trim()) {
        collector.error(`[manufacturerGuideContent] ${article.slug}: videos[${i}] が不完全です`);
      }
    });
  }
}

// monolith ではこのブロックが articles 本ループの後（deployments ループの後）に位置していたため、
// orchestrator が validateArticles（本ループ）とは別に、全collection validatorの最後に呼ぶ。
export function validateArticlePlacements(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
): void {
  const { articlePlacements } = snapshot;
  const { articleIds, publishedArticleIds } = buildReferenceIndex(snapshot);

  const placementOrders = new Set<string>();
  const placementArticles = new Set<string>();
  for (const placement of articlePlacements) {
    const owner = `${placement.surface}.${placement.slot}.${placement.order}`;
    checkReference({
      collector,
      kind: 'articlePlacement',
      owner,
      field: 'articleId',
      id: placement.articleId,
      ids: articleIds,
    });
    checkDisplayableReference({
      collector,
      kind: 'articlePlacement',
      owner,
      field: 'articleId',
      id: placement.articleId,
      allIds: articleIds,
      displayableIds: publishedArticleIds,
      displayableStatus: 'published',
    });

    const orderKey = `${placement.surface}:${placement.slot}:${placement.order}`;
    if (placementOrders.has(orderKey)) {
      collector.error(`[duplicate] reportPlacement order 重複: ${orderKey}`);
    }
    placementOrders.add(orderKey);

    const articleKey = `${placement.surface}:${placement.slot}:${placement.articleId}`;
    if (placementArticles.has(articleKey)) {
      collector.error(`[duplicate] reportPlacement report 重複: ${articleKey}`);
    }
    placementArticles.add(articleKey);

    if (placement.kind === 'sponsored' && !placement.sponsor?.name.trim()) {
      collector.error(`[required] reportPlacement "${owner}".sponsor.name が空です`);
    }
    if (placement.sponsor) {
      if (!placement.sponsor.name.trim()) {
        collector.error(`[required] reportPlacement "${owner}".sponsor.name が空です`);
      }
      checkUrl(collector, 'articlePlacement', owner, 'sponsor.url', placement.sponsor.url);
    }
  }
}

// articles collection の本ループのみ（manufacturer-guide本文check と articlePlacements は
// monolithでの相対位置を保つため、それぞれ validateManufacturerGuideContent /
// validateArticlePlacements として別に export し、orchestrator が個別に呼ぶ）。
export function validateArticles(snapshot: ContentSnapshot, collector: ValidationCollector): void {
  const { articles } = snapshot;
  const {
    manufacturerIds,
    publishedManufacturerIds,
    publishedUseCaseIds,
    robotIds,
    useCaseIds,
    visibleRobotIds,
  } = buildReferenceIndex(snapshot);

  for (const article of articles) {
    checkDate(collector, 'article', article.slug, 'updatedAt', article.updatedAt);
    checkDate(collector, 'article', article.slug, 'publishedAt', article.publishedAt);
    checkImageAsset(collector, 'article', article.slug, 'heroImage', article.heroImage);
    checkRequiredSources(collector, 'article', article.slug, article.sources, {
      requireNonEmpty: article.publishStatus === 'published' && article.contentKind !== 'sample',
    });
    checkTags(collector, 'article', article.slug, 'industryTags', 'industry', article.industryTags ?? []);
    checkTags(collector, 'article', article.slug, 'regionTags', 'region', article.regionTags ?? []);
    checkTags(collector, 'article', article.slug, 'themeTags', 'theme', article.themeTags ?? []);
    if ((article.themeTags?.length ?? 0) > 4) {
      collector.error(
        `[tag-count] article "${article.slug}".themeTags は0〜4個にしてください（現在 ${article.themeTags?.length ?? 0}個）`,
      );
    }
    checkUniqueValues(collector, 'article', article.slug, 'relatedRobotIds', article.relatedRobotIds);
    checkUniqueValues(collector, 'article', article.slug, 'relatedManufacturerIds', article.relatedManufacturerIds);
    checkUniqueValues(collector, 'article', article.slug, 'relatedUseCaseIds', article.relatedUseCaseIds);
    article.relatedRobotIds.forEach((s) => {
      checkReference({
        collector,
        kind: 'article',
        owner: article.slug,
        field: 'relatedRobotIds',
        id: s,
        ids: robotIds,
      });
      if (article.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'article',
          owner: article.slug,
          field: 'relatedRobotIds',
          id: s,
          allIds: robotIds,
          displayableIds: visibleRobotIds,
          displayableStatus: 'published/archived',
        });
      }
    });
    article.relatedManufacturerIds.forEach((s) => {
      checkReference({
        collector,
        kind: 'article',
        owner: article.slug,
        field: 'relatedManufacturerIds',
        id: s,
        ids: manufacturerIds,
      });
      if (article.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'article',
          owner: article.slug,
          field: 'relatedManufacturerIds',
          id: s,
          allIds: manufacturerIds,
          displayableIds: publishedManufacturerIds,
          displayableStatus: 'published',
        });
      }
    });
    article.relatedUseCaseIds.forEach((s) => {
      checkReference({
        collector,
        kind: 'article',
        owner: article.slug,
        field: 'relatedUseCaseIds',
        id: s,
        ids: useCaseIds,
      });
      if (article.publishStatus === 'published') {
        checkDisplayableReference({
          collector,
          kind: 'article',
          owner: article.slug,
          field: 'relatedUseCaseIds',
          id: s,
          allIds: useCaseIds,
          displayableIds: publishedUseCaseIds,
          displayableStatus: 'published',
        });
      }
    });
  }
}
