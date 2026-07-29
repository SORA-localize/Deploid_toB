import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import {
  checkDate,
  checkFreshness,
  checkImageAsset,
  checkRequiredSources,
  checkUrl,
} from './common.ts';
import type { ValidationCollector } from './types.ts';

export function validateManufacturers(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
): void {
  const { manufacturers } = snapshot;

  manufacturers.forEach((m) => checkFreshness(collector, 'manufacturer', m));

  for (const m of manufacturers) {
    checkDate(collector, 'manufacturer', m.slug, 'updatedAt', m.updatedAt);
    checkRequiredSources(collector, 'manufacturer', m.slug, m.sources);
    checkImageAsset(collector, 'manufacturer', m.slug, 'logo', m.logo);
    (['symbol', 'wordmark', 'combined'] as const).forEach((variant) => {
      const asset = m.logos?.[variant];
      if (!asset) return;
      checkImageAsset(collector, 'manufacturer', m.slug, `logos.${variant}`, asset);
      // logos.* は空srcプレースホルダーを認めない（置くなら実ファイルと権利を揃えてから）
      if (!asset.src.trim()) {
        collector.error(`[image-missing] manufacturer "${m.slug}".logos.${variant}.src が空です`);
      }
    });
    m.domesticDistributors?.forEach((distributor, index) => {
      const field = `domesticDistributors[${index}]`;
      if (!distributor.name.trim()) {
        collector.error(`[required] manufacturer "${m.slug}".${field}.name が空です`);
      }
      checkUrl(collector, 'manufacturer', m.slug, `${field}.website`, distributor.website);
      checkUrl(collector, 'manufacturer', m.slug, `${field}.sourceUrl`, distributor.sourceUrl);
      checkDate(collector, 'manufacturer', m.slug, `${field}.checkedAt`, distributor.checkedAt);
    });
  }
}
