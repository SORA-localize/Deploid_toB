// 参照整合チェック。dev起動時に lib/data.ts から1度だけ呼ばれ、
// 「存在しないslugを参照している」「双方向リンクが片側だけ」「slug重複」を
// console に出す。本番では走らない。
import { guides } from '@/data/guides';
import { manufacturers } from '@/data/manufacturers';
import { reports } from '@/data/reports';
import { robots } from '@/data/robots';
import type { ImageAsset, RightsStatus } from '@/data/types';
import { useCases } from '@/data/useCases';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const referenceDisplayStatuses = new Set<RightsStatus>([
  'reference-attributed',
  'permission-requested',
]);

export function validateData(): string[] {
  const issues: string[] = [];
  const robotSlugs = new Set(robots.map((r) => r.slug));
  const manufacturerSlugs = new Set(manufacturers.map((m) => m.slug));
  const guideSlugs = new Set(guides.map((g) => g.slug));
  const useCaseSlugs = new Set(useCases.map((u) => u.slug));
  const reportSlugs = new Set(reports.map((r) => r.slug));

  const check = (kind: string, owner: string, field: string, slug: string, set: Set<string>) => {
    if (!set.has(slug)) {
      issues.push(`[missing] ${kind} "${owner}".${field} -> "${slug}" は存在しません`);
    }
  };

  const checkDate = (kind: string, owner: string, field: string, value: string | undefined) => {
    if (value && !isoDatePattern.test(value)) {
      issues.push(`[date] ${kind} "${owner}".${field} は YYYY-MM-DD 形式にしてください: ${value}`);
    }
  };

  const checkRequiredSources = (
    kind: string,
    owner: string,
    sources: readonly { checkedAt: string }[],
  ) => {
    if (sources.length === 0) {
      issues.push(`[source-empty] ${kind} "${owner}".sources が空です`);
    }
    sources.forEach((source, index) => {
      checkDate(kind, owner, `sources[${index}].checkedAt`, source.checkedAt);
    });
  };

  const checkImageAsset = (
    kind: string,
    owner: string,
    field: string,
    asset: ImageAsset | undefined,
  ) => {
    if (!asset) return;
    if (!asset.alt.trim()) issues.push(`[image-alt] ${kind} "${owner}".${field}.alt が空です`);
    if (!asset.rights) {
      issues.push(`[image-rights] ${kind} "${owner}".${field}.rights が未設定です`);
      return;
    }

    checkDate(kind, owner, `${field}.rights.checkedAt`, asset.rights.checkedAt);

    if (referenceDisplayStatuses.has(asset.rights.status)) {
      if (!asset.credit) issues.push(`[image-credit] ${kind} "${owner}".${field}.credit が未設定です`);
      if (!asset.sourceUrl) {
        issues.push(`[image-source] ${kind} "${owner}".${field}.sourceUrl が未設定です`);
      }
      if (!asset.rights.rightsHolder) {
        issues.push(`[image-rights-holder] ${kind} "${owner}".${field}.rights.rightsHolder が未設定です`);
      }
    }
  };

  const checkTagDuplicates = (kind: string, owner: string, field: string, values: readonly string[]) => {
    const seen = new Set<string>();
    for (const value of values) {
      const key = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
      if (seen.has(key)) {
        issues.push(`[tag-duplicate] ${kind} "${owner}".${field} に正規化後の重複があります: ${value}`);
      }
      seen.add(key);
    }
  };

  const dup = <T extends { slug: string }>(name: string, arr: T[]) => {
    const seen = new Set<string>();
    for (const x of arr) {
      if (seen.has(x.slug)) issues.push(`[duplicate] ${name} にslug重複: ${x.slug}`);
      seen.add(x.slug);
    }
  };
  dup('robots', robots);
  dup('manufacturers', manufacturers);
  dup('guides', guides);
  dup('useCases', useCases);
  dup('reports', reports);

  for (const r of robots) {
    check('robot', r.slug, 'manufacturerSlug', r.manufacturerSlug, manufacturerSlugs);
    checkDate('robot', r.slug, 'updatedAt', r.updatedAt);
    checkRequiredSources('robot', r.slug, r.sources);
    checkImageAsset('robot', r.slug, 'heroImage', r.heroImage);
    Object.entries(r.images ?? {}).forEach(([role, image]) =>
      checkImageAsset('robot', r.slug, `images.${role}`, image),
    );
  }

  for (const m of manufacturers) {
    checkDate('manufacturer', m.slug, 'updatedAt', m.updatedAt);
    checkRequiredSources('manufacturer', m.slug, m.sources);
    checkImageAsset('manufacturer', m.slug, 'logo', m.logo);
  }

  for (const g of guides) {
    checkDate('guide', g.slug, 'updatedAt', g.updatedAt);
    checkTagDuplicates('guide', g.slug, 'topics', g.topics);
    g.relatedRobotSlugs.forEach((s) => check('guide', g.slug, 'relatedRobotSlugs', s, robotSlugs));
    g.relatedUseCaseSlugs.forEach((s) =>
      check('guide', g.slug, 'relatedUseCaseSlugs', s, useCaseSlugs),
    );
  }

  for (const u of useCases) {
    checkDate('useCase', u.slug, 'updatedAt', u.updatedAt);
    checkTagDuplicates('useCase', u.slug, 'industryTags', u.industryTags);
    checkTagDuplicates('useCase', u.slug, 'taskTags', u.taskTags);
    u.candidateRobotSlugs.forEach((s) =>
      check('useCase', u.slug, 'candidateRobotSlugs', s, robotSlugs),
    );
    u.relatedGuideSlugs.forEach((s) =>
      check('useCase', u.slug, 'relatedGuideSlugs', s, guideSlugs),
    );
  }

  for (const rep of reports) {
    checkDate('report', rep.slug, 'updatedAt', rep.updatedAt);
    checkDate('report', rep.slug, 'publishedAt', rep.publishedAt);
    checkRequiredSources('report', rep.slug, rep.sources);
    checkTagDuplicates('report', rep.slug, 'tags', rep.tags);
    rep.relatedRobotSlugs.forEach((s) =>
      check('report', rep.slug, 'relatedRobotSlugs', s, robotSlugs),
    );
    rep.relatedManufacturerSlugs.forEach((s) =>
      check('report', rep.slug, 'relatedManufacturerSlugs', s, manufacturerSlugs),
    );
    rep.relatedUseCaseSlugs.forEach((s) =>
      check('report', rep.slug, 'relatedUseCaseSlugs', s, useCaseSlugs),
    );
    (rep.relatedGuideSlugs ?? []).forEach((s) =>
      check('report', rep.slug, 'relatedGuideSlugs', s, guideSlugs),
    );
  }

  // Bidirectional consistency: Guide <-> UseCase（両側ともUIで使うため整合が必要）
  for (const g of guides) {
    for (const ucSlug of g.relatedUseCaseSlugs) {
      const uc = useCases.find((u) => u.slug === ucSlug);
      if (uc && !uc.relatedGuideSlugs.includes(g.slug)) {
        issues.push(
          `[asymmetric] guide "${g.slug}" は useCase "${ucSlug}" を参照しているが、逆向き(useCase.relatedGuideSlugs)に含まれていません`,
        );
      }
    }
  }
  for (const u of useCases) {
    for (const gSlug of u.relatedGuideSlugs) {
      const g = guides.find((x) => x.slug === gSlug);
      if (g && !g.relatedUseCaseSlugs.includes(u.slug)) {
        issues.push(
          `[asymmetric] useCase "${u.slug}" は guide "${gSlug}" を参照しているが、逆向き(guide.relatedUseCaseSlugs)に含まれていません`,
        );
      }
    }
  }

  // 余談: report.relatedGuideSlugs があるならガイドが知らなくても警告しない
  // (片方向リレーション。reportが主、guideは知らなくていい設計)

  void reportSlugs;
  return issues;
}

let didRun = false;
export function runValidationInDev(): void {
  if (didRun) return;
  didRun = true;
  if (process.env.NODE_ENV === 'production') return;
  const issues = validateData();
  const total = robots.length + manufacturers.length + guides.length + useCases.length + reports.length;
  if (issues.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[data] referential integrity: OK (${total} records)`);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[data] referential integrity issues (${issues.length}):\n` + issues.map((i) => '  - ' + i).join('\n'));
  }
}
