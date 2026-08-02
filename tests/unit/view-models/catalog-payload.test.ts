import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';

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
 */
const budgets = [
  {
    name: 'robots',
    maxBytes: 63_000,
    bytes: () =>
      Buffer.byteLength(
        JSON.stringify(createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases())),
      ),
  },
  {
    name: 'useCases',
    maxBytes: 19_000,
    bytes: () =>
      Buffer.byteLength(JSON.stringify(createUseCaseCatalogItems(getUseCases(), getRobots()))),
  },
  {
    name: 'manufacturers',
    maxBytes: 18_000,
    bytes: () =>
      Buffer.byteLength(
        JSON.stringify(createManufacturerCatalogItems(getManufacturers(), getRobots())),
      ),
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
