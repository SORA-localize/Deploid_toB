import { describe, expect, it } from 'vitest';
import { filterPublished } from '@/lib/content/createContentRepository';
import { toDomainContentSnapshot } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

// Task 6: view model層はcanonical domain型（`lib/content/domainTypes.ts`）を受け取るため、
// テストのfixtureも`@/lib/data`（削除済み）ではなく、localSource.tsと同じ
// legacy→domain変換（`toDomainContentSnapshot`）を通した配列を使う。repositoryやDBは不要
// （createRobotCatalogItemsは純粋関数）。
const snapshot = toDomainContentSnapshot(localContentSnapshot);
const robots = filterPublished(snapshot.robots);
const manufacturers = filterPublished(snapshot.manufacturers);
const useCases = filterPublished(snapshot.useCases);

describe('robot catalog view models', () => {
  it('exclude editorial evidence and full domain records', () => {
    const json = JSON.stringify(createRobotCatalogItems(robots, manufacturers, useCases));
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
    const items = createRobotCatalogItems(robots, manufacturers, useCases);
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const robot of robots) {
      const bodyValues = [
        robot.description,
        robot.summary,
        robot.supportNote,
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
