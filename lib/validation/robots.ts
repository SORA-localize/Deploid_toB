import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import { isSpecKey, MAX_SPEC_ROWS_PER_GROUP, specSchema } from '../specSchema.ts';
import {
  checkDate,
  checkDisplayableReference,
  checkFreshness,
  checkImageAsset,
  checkReference,
  checkRequiredSources,
  checkTags,
  checkUniqueValues,
  checkUrl,
} from './common.ts';
import { buildReferenceIndex } from './crossCollection.ts';
import type { ValidationCollector } from './types.ts';

const robotPriceChannels = new Set([
  'manufacturer-public',
  'authorized-distributor-public',
]);
const robotLoadScopes = new Set([
  'single-arm',
  'dual-arm',
  'whole-body',
  'carrier',
  'manufacturer-wording',
]);
const robotLoadRatingKinds = new Set(['rated', 'maximum', 'unspecified']);
const robotPriceTaxStatuses = new Set(['included', 'excluded', 'unknown']);
const robotEvidenceFields = new Set(['priceOffers', 'loadRatings']);

// robot鮮度チェック。monolith では検証全体の先頭に hoist されていたため、
// orchestrator が他の全チェックより先に呼ぶ（このファイル内の validateRobots とは別呼出）。
export function validateRobotFreshness(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
  now: number,
): void {
  snapshot.robots.forEach((r) => checkFreshness(collector, 'robot', r, now));
}

export function validateRobots(snapshot: ContentSnapshot, collector: ValidationCollector): void {
  const { robots } = snapshot;
  const { manufacturerIds, publishedManufacturerIds, publishedRobotIds, robotIds, visibleRobotIds } =
    buildReferenceIndex(snapshot);

  for (const r of robots) {
    checkReference({
      collector,
      kind: 'robot',
      owner: r.slug,
      field: 'manufacturerId',
      id: r.manufacturerId,
      ids: manufacturerIds,
    });
    if (visibleRobotIds.has(r.id)) {
      checkDisplayableReference({
        collector,
        kind: 'robot',
        owner: r.slug,
        field: 'manufacturerId',
        id: r.manufacturerId,
        allIds: manufacturerIds,
        displayableIds: publishedManufacturerIds,
        displayableStatus: 'published',
      });
    }
    if (r.supersededById) {
      checkReference({
        collector,
        kind: 'robot',
        owner: r.slug,
        field: 'supersededById',
        id: r.supersededById,
        ids: robotIds,
      });
      if (visibleRobotIds.has(r.id)) {
        checkDisplayableReference({
          collector,
          kind: 'robot',
          owner: r.slug,
          field: 'supersededById',
          id: r.supersededById,
          allIds: robotIds,
          displayableIds: publishedRobotIds,
          displayableStatus: 'published',
        });
      }
      if (r.supersededById === r.id) {
        collector.error(`[superseded-self] robot "${r.id}".supersededById が自分自身を指しています`);
      }
    }
    // specs のキーは lib/specSchema.ts 登録値のみ（型でも保証されるが、将来のCMS/JSON化に備えた実行時保証）
    Object.keys(r.specs).forEach((key) => {
      if (!isSpecKey(key)) {
        collector.error(`[spec-unknown] robot "${r.id}".specs に未登録キーがあります: ${key}（lib/specSchema.ts に追加してください）`);
      }
    });
    const potentialSpecRowsByGroup = new Map<string, number>();
    specSchema.forEach((entry) => {
      if (entry.key === 'heightCm' || entry.key === 'widthCm' || entry.key === 'depthCm') return;
      potentialSpecRowsByGroup.set(
        entry.group,
        (potentialSpecRowsByGroup.get(entry.group) ?? 0) + 1,
      );
    });
    if (r.specs.heightCm != null || r.specs.widthCm != null || r.specs.depthCm != null) {
      potentialSpecRowsByGroup.set(
        'body-motion',
        (potentialSpecRowsByGroup.get('body-motion') ?? 0) + 1,
      );
    }
    if ((r.loadRatings?.length ?? 0) > 0) {
      potentialSpecRowsByGroup.set(
        'body-motion',
        (potentialSpecRowsByGroup.get('body-motion') ?? 0) + 1,
      );
    }
    potentialSpecRowsByGroup.forEach((count, group) => {
      if (count > MAX_SPEC_ROWS_PER_GROUP) {
        collector.error(
          `[spec-group-limit] robot "${r.id}" の ${group} は最大${MAX_SPEC_ROWS_PER_GROUP}行を超える可能性があります: ${count}`,
        );
      }
    });
    const robotSourceUrls = new Set(r.sources.map((source) => source.url));
    checkUniqueValues(
      collector,
      'robot',
      r.slug,
      'usageExampleSourceUrls',
      r.usageExampleSourceUrls ?? [],
    );
    if ((r.usageExampleSourceUrls?.length ?? 0) > 3) {
      collector.error(`[usage-example-limit] robot "${r.id}".usageExampleSourceUrls は最大3件です`);
    }
    (r.usageExampleSourceUrls ?? []).forEach((url, index) => {
      checkUrl(collector, 'robot', r.slug, `usageExampleSourceUrls[${index}]`, url);
      if (!robotSourceUrls.has(url)) {
        collector.error(
          `[usage-example-source] robot "${r.id}".usageExampleSourceUrls[${index}] が sources にありません: ${url}`,
        );
      }
    });
    (r.priceOffers ?? []).forEach((offer, index) => {
      const field = `priceOffers[${index}]`;
      if (!robotPriceChannels.has(offer.channel)) {
        collector.error(`[price-channel] robot "${r.id}".${field}.channel が未登録です: ${offer.channel}`);
      }
      if (!offer.display.trim()) {
        collector.error(`[price-display] robot "${r.id}".${field}.display が空です`);
      }
      if (offer.amount != null && (!Number.isFinite(offer.amount) || offer.amount < 0)) {
        collector.error(`[price-amount] robot "${r.id}".${field}.amount は0以上の有限値にしてください`);
      }
      if ((offer.amount == null) !== (offer.currency == null)) {
        collector.error(`[price-currency] robot "${r.id}".${field}.amount と currency は同時に設定してください`);
      }
      if (offer.currency != null && !offer.currency.trim()) {
        collector.error(`[price-currency] robot "${r.id}".${field}.currency が空です`);
      }
      if (offer.taxStatus != null && !robotPriceTaxStatuses.has(offer.taxStatus)) {
        collector.error(`[price-tax] robot "${r.id}".${field}.taxStatus が未登録です: ${offer.taxStatus}`);
      }
      if (offer.channel === 'authorized-distributor-public' && !offer.sellerName?.trim()) {
        collector.error(`[price-seller] robot "${r.id}".${field}.sellerName は正規代理店価格で必須です`);
      }
      checkUrl(collector, 'robot', r.slug, `${field}.sourceUrl`, offer.sourceUrl);
      if (!robotSourceUrls.has(offer.sourceUrl)) {
        collector.error(`[price-source] robot "${r.id}".${field}.sourceUrl が sources にありません: ${offer.sourceUrl}`);
      }
    });
    const loadRatingKeys = new Set<string>();
    (r.loadRatings ?? []).forEach((load, index) => {
      const field = `loadRatings[${index}]`;
      if (!robotLoadScopes.has(load.scope)) {
        collector.error(`[load-scope] robot "${r.id}".${field}.scope が未登録です: ${load.scope}`);
      }
      if (!robotLoadRatingKinds.has(load.rating)) {
        collector.error(`[load-rating] robot "${r.id}".${field}.rating が未登録です: ${load.rating}`);
      }
      if (!Number.isFinite(load.kg) || load.kg <= 0) {
        collector.error(`[load-kg] robot "${r.id}".${field}.kg は0より大きい有限値にしてください`);
      }
      // 同一variantでも、瞬間/持続や特定姿勢/全作業域など条件別の荷重を持てる。
      // kg と condition まで一致する完全重複だけをエラーにする。
      const uniqueKey = [
        load.variant?.trim() ?? '',
        load.scope,
        load.rating,
        String(load.kg),
        load.condition?.trim() ?? '',
      ].join('\u0000');
      if (loadRatingKeys.has(uniqueKey)) {
        collector.error(`[load-duplicate] robot "${r.id}".${field} に同一条件の荷重レコードがあります`);
      }
      loadRatingKeys.add(uniqueKey);
      checkUrl(collector, 'robot', r.slug, `${field}.sourceUrl`, load.sourceUrl);
      if (!robotSourceUrls.has(load.sourceUrl)) {
        collector.error(`[load-source] robot "${r.id}".${field}.sourceUrl が sources にありません: ${load.sourceUrl}`);
      }
    });
    Object.entries(r.fieldEvidence ?? {}).forEach(([key, urls]) => {
      if (!isSpecKey(key) && !robotEvidenceFields.has(key)) {
        collector.error(`[evidence-field] robot "${r.id}".fieldEvidence に未登録キーがあります: ${key}`);
      }
      if (!urls || urls.length === 0) {
        collector.error(`[evidence-empty] robot "${r.id}".fieldEvidence.${key} が空です`);
        return;
      }
      checkUniqueValues(collector, 'robot', r.slug, `fieldEvidence.${key}`, urls);
      urls.forEach((url, index) => {
        checkUrl(collector, 'robot', r.slug, `fieldEvidence.${key}[${index}]`, url);
        if (!robotSourceUrls.has(url)) {
          collector.error(`[evidence-source] robot "${r.id}".fieldEvidence.${key} が sources にありません: ${url}`);
        }
      });
    });
    checkDate(collector, 'robot', r.slug, 'updatedAt', r.updatedAt);
    checkRequiredSources(collector, 'robot', r.slug, r.sources);
    checkTags(collector, 'robot', r.slug, 'industryTags', 'industry', r.industryTags ?? []);
    checkTags(collector, 'robot', r.slug, 'taskTags', 'task', r.taskTags ?? []);
    if (r.heroImage?.src.trim()) {
      collector.error(`[robot-hero-image] robot "${r.id}" は heroImage ではなく images のroleへ登録してください`);
    }
    checkImageAsset(collector, 'robot', r.slug, 'heroImage', r.heroImage);
    Object.entries(r.images ?? {}).forEach(([role, image]) =>
      checkImageAsset(collector, 'robot', r.slug, `images.${role}`, image),
    );
  }
}
