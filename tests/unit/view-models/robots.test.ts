import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

describe('robot catalog view models', () => {
  it('exclude editorial evidence and full domain records', () => {
    const json = JSON.stringify(
      createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases()),
    );
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"fieldEvidence"');
    expect(json).not.toContain('"comparison"');
    expect(json).not.toContain('"priceOffers"');
    expect(json).not.toContain('"sourceUrl"');
    expect(json).not.toContain('"rights"');
  });

  // key名の不在だけでは、連結済みsearch textとして本文が載っている場合を検出できない。
  // 両辺を同じ関数で正規化して値そのものを照合する（raw文字列比較では実測で7.9%取りこぼす）。
  it('excludes body text values, not just their keys', () => {
    const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const robot of getRobots()) {
      const bodyValues = [
        robot.description,
        robot.summary,
        robot.supportNote,
        robot.safetyNote,
        robot.vendorRiskNote,
        ...robot.comparison.strengths,
        ...robot.comparison.constraints,
        ...robot.comparison.bestFit,
        ...robot.comparison.notFit,
      ];

      for (const value of bodyValues) {
        // 12文字未満は他fieldと偶然一致しうるため対象外。
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
