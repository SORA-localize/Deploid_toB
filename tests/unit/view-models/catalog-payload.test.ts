import { describe, expect, it } from 'vitest';
import { filterPublished } from '@/lib/content/createContentRepository';
import { toDomainContentSnapshot } from '@/lib/content/localSource';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { createArticleCatalogItems } from '@/lib/viewModels/articles';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';

// Task 6: `@/lib/data`（削除済み）の代わりに、localSource.tsと同じlegacy→domain変換を通した
// fixtureを使う（VM関数群は純粋関数のためrepository/DBは不要）。
const snapshot = toDomainContentSnapshot(localContentSnapshot);
const robots = filterPublished(snapshot.robots);
const manufacturers = filterPublished(snapshot.manufacturers);
const useCases = filterPublished(snapshot.useCases);
const articles = filterPublished(snapshot.articles);

/**
 * catalog view model の JSON バイト数の上限。
 *
 * server -> client props は RSC flight payload に載り、JS chunk には現れない。
 * したがって route固有JS の budget（check:client-budgets）では肥大を検知できず、
 * 逆に VM 側のこの gate では import chain 経由の bundle 流出を検知できない。両方が要る。
 *
 * 文字数ではなく Buffer.byteLength で測る（日本語はUTF-8で1文字約3バイトのため、
 * 文字数では実転送量を大きく過小評価する）。
 *
 * maxBytes は Task 6 完了時の実測値 * 1.15。
 *   robots        55,001 バイト（whitelist化前 101,449）
 *   manufacturers 15,627 バイト（whitelist化前 37,271）
 *   useCases      16,093 バイト（Task 7 で新設）
 *   articles      56,415 バイト（Task 8 で新設。titleSegments を含む）
 */
const budgets = [
  {
    name: 'robots',
    maxBytes: 63_000,
    bytes: () => Buffer.byteLength(JSON.stringify(createRobotCatalogItems(robots, manufacturers, useCases))),
  },
  {
    name: 'useCases',
    maxBytes: 19_000,
    bytes: () => Buffer.byteLength(JSON.stringify(createUseCaseCatalogItems(useCases, robots))),
  },
  {
    name: 'articles',
    maxBytes: 65_000,
    bytes: () => Buffer.byteLength(JSON.stringify(createArticleCatalogItems(articles))),
  },
  {
    name: 'manufacturers',
    maxBytes: 18_000,
    bytes: () => Buffer.byteLength(JSON.stringify(createManufacturerCatalogItems(manufacturers, robots))),
  },
];

describe('catalog payload budgets', () => {
  for (const budget of budgets) {
    it(`${budget.name} stays within its byte budget`, () => {
      const actual = budget.bytes();
      // 上限を締め直すときはこの出力を使う。
      console.log(`[catalog-payload] ${budget.name}: ${actual}/${budget.maxBytes}`);
      expect(actual).toBeLessThanOrEqual(budget.maxBytes);
    });
  }
});
