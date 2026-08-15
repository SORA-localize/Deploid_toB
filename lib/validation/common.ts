// collection横断で使い回す検証プリミティブ。
// 文言・severity は分割前の lib/validate.ts から一字一句そのまま移している。
// `fs`/`path` を使う画像実測validationはこのファイルだけに置く（server/node限定）。
import fs from 'node:fs';
import path from 'node:path';
import type { ImageAsset, RightsStatus } from '../../data/legacyTypes.ts';
import { isRegisteredTag, normalizeTagKey, type TagKind } from '../tagRegistry.ts';
import type { ValidationCollector } from './types.ts';

export const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const referenceDisplayStatuses = new Set<RightsStatus>([
  'reference-attributed',
  'permission-requested',
]);

/** 鮮度warningの既定: sources の最新確認日がこの日数を超えたら再確認を促す（設計 §11.6） */
export const FRESHNESS_DAYS = 180;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function checkReference(args: {
  collector: ValidationCollector;
  kind: string;
  owner: string;
  field: string;
  id: string;
  ids: ReadonlySet<string>;
}): void {
  const { collector, kind, owner, field, id, ids } = args;
  if (!ids.has(id)) {
    collector.error(`[missing] ${kind} "${owner}".${field} -> "${id}" は存在しません`);
  }
}

export function checkDisplayableReference(args: {
  collector: ValidationCollector;
  kind: string;
  owner: string;
  field: string;
  id: string;
  allIds: ReadonlySet<string>;
  displayableIds: ReadonlySet<string>;
  displayableStatus: string;
}): void {
  const { collector, kind, owner, field, id, allIds, displayableIds, displayableStatus } = args;
  if (allIds.has(id) && !displayableIds.has(id)) {
    collector.error(
      `[not-visible] ${kind} "${owner}".${field} -> "${id}" は存在しますが、` +
        `${displayableStatus} ではないため公開面で表示されません`,
    );
  }
}

export function checkUniqueValues(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  values: readonly string[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      collector.error(`[duplicate] ${kind} "${owner}".${field} に重複があります: ${value}`);
    }
    seen.add(value);
  }
}

export function checkDate(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  value: string | undefined,
): void {
  if (value && !isoDatePattern.test(value)) {
    collector.error(`[date] ${kind} "${owner}".${field} は YYYY-MM-DD 形式にしてください: ${value}`);
  }
}

export function checkUrl(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  value: string | undefined,
): void {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      collector.error(`[url] ${kind} "${owner}".${field} は http(s) URL にしてください: ${value}`);
    }
  } catch {
    collector.error(`[url] ${kind} "${owner}".${field} はURL形式にしてください: ${value}`);
  }
}

export function checkRequiredSources(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  sources: readonly { checkedAt: string; url?: string }[],
  options: { requireNonEmpty?: boolean } = {},
): void {
  const requireNonEmpty = options.requireNonEmpty ?? true;
  if (requireNonEmpty && sources.length === 0) {
    collector.error(`[source-empty] ${kind} "${owner}".sources が空です`);
  }
  sources.forEach((source, index) => {
    checkUrl(collector, kind, owner, `sources[${index}].url`, source.url);
    checkDate(collector, kind, owner, `sources[${index}].checkedAt`, source.checkedAt);
  });
}

export function checkImageAsset(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  asset: ImageAsset | undefined,
): void {
  if (!asset) return;
  if (!asset.src.trim()) return; // 空src = 未取得。警告・検証不要
  if (!asset.src.startsWith('/')) {
    collector.warn(`[image-remote] ${kind} "${owner}".${field}.src が外部URLです（public/ へのローカル化推奨）: ${asset.src}`);
  } else {
    const publicRoot = path.resolve(process.cwd(), 'public');
    const absolutePath = path.resolve(publicRoot, asset.src.replace(/^\/+/, ''));
    if (!absolutePath.startsWith(`${publicRoot}${path.sep}`)) {
      collector.error(`[image-path] ${kind} "${owner}".${field}.src が public/ の外を指しています: ${asset.src}`);
    } else if (!fs.existsSync(absolutePath)) {
      collector.error(`[image-missing] ${kind} "${owner}".${field}.src のファイルが存在しません: ${asset.src}`);
    }
  }
  if (!asset.alt.trim()) collector.error(`[image-alt] ${kind} "${owner}".${field}.alt が空です`);
  if (!asset.rights) {
    collector.error(`[image-rights] ${kind} "${owner}".${field}.rights が未設定です`);
    return;
  }

  checkDate(collector, kind, owner, `${field}.rights.checkedAt`, asset.rights.checkedAt);
  if (asset.rights.sourceType !== 'own' && !asset.rights.rightsHolder) {
    collector.error(`[image-rights-holder] ${kind} "${owner}".${field}.rights.rightsHolder が未設定です`);
  }
  if (
    (asset.rights.status === 'licensed' || asset.rights.status === 'commercial-permitted') &&
    !asset.rights.licenseUrl &&
    !asset.rights.permissionNote
  ) {
    collector.error(
      `[image-permission-evidence] ${kind} "${owner}".${field} は ${asset.rights.status} ですが、licenseUrl / permissionNote のどちらもありません`,
    );
  }

  if (referenceDisplayStatuses.has(asset.rights.status)) {
    if (!asset.credit) collector.error(`[image-credit] ${kind} "${owner}".${field}.credit が未設定です`);
    if (!asset.sourceUrl) {
      collector.error(`[image-source] ${kind} "${owner}".${field}.sourceUrl が未設定です`);
    }
  }
  if (asset.aspectRatio != null) {
    collector.error(
      `[image-derived-metadata] ${kind} "${owner}".${field}.aspectRatio は data/*.ts に保存せず、実行時に計測してください`,
    );
  }
}

function checkTagDuplicates(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  values: readonly string[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    const key = normalizeTagKey(value);
    if (seen.has(key)) {
      collector.error(`[tag-duplicate] ${kind} "${owner}".${field} に正規化後の重複があります: ${value}`);
    }
    seen.add(key);
  }
}

export function checkTags(
  collector: ValidationCollector,
  kind: string,
  owner: string,
  field: string,
  tagKind: TagKind,
  values: readonly string[],
): void {
  checkTagDuplicates(collector, kind, owner, field, values);
  for (const value of values) {
    if (!isRegisteredTag(tagKind, value)) {
      collector.error(`[tag-unknown] ${kind} "${owner}".${field} に未登録タグがあります: ${value}`);
    }
  }
}

// 鮮度チェック（warning）: nextReviewBy 超過、または最新 checkedAt が既定日数超（設計 §11.6）
// `now` は呼出元（orchestrator）が検証実行全体で1度だけ計算した値を渡す
// （分割前 lib/validate.ts と同様、レコード毎の Date.now() 呼び出しによる非決定性を避ける）。
export function checkFreshness(
  collector: ValidationCollector,
  kind: string,
  record: {
    id: string;
    publishStatus: string;
    nextReviewBy?: string;
    sources: readonly { checkedAt: string }[];
  },
  now: number,
): void {
  if (record.publishStatus !== 'published') return;
  if (record.nextReviewBy) {
    if (isoDatePattern.test(record.nextReviewBy) && Date.parse(record.nextReviewBy) < now) {
      collector.warn(`[stale] ${kind} "${record.id}" の nextReviewBy (${record.nextReviewBy}) を過ぎています。再確認してください`);
    }
    return;
  }
  const newestCheckedAt = record.sources
    .map((source) => Date.parse(source.checkedAt))
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  if (newestCheckedAt != null && now - newestCheckedAt > FRESHNESS_DAYS * MS_PER_DAY) {
    const days = Math.floor((now - newestCheckedAt) / MS_PER_DAY);
    collector.warn(`[stale] ${kind} "${record.id}" の最終確認から${days}日経過しています（既定${FRESHNESS_DAYS}日）`);
  }
}
