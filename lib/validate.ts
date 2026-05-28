// 参照整合チェック。dev起動時に lib/data.ts から1度だけ呼ばれ、
// 「存在しないslugを参照している」「双方向リンクが片側だけ」「slug重複」を
// console に出す。本番では走らない。
import { guides } from '@/data/guides';
import { manufacturers } from '@/data/manufacturers';
import { reports } from '@/data/reports';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';

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
  }

  for (const g of guides) {
    g.relatedRobotSlugs.forEach((s) => check('guide', g.slug, 'relatedRobotSlugs', s, robotSlugs));
    g.relatedUseCaseSlugs.forEach((s) =>
      check('guide', g.slug, 'relatedUseCaseSlugs', s, useCaseSlugs),
    );
  }

  for (const u of useCases) {
    u.candidateRobotSlugs.forEach((s) =>
      check('useCase', u.slug, 'candidateRobotSlugs', s, robotSlugs),
    );
    u.relatedGuideSlugs.forEach((s) =>
      check('useCase', u.slug, 'relatedGuideSlugs', s, guideSlugs),
    );
  }

  for (const rep of reports) {
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
