import { describe, expect, it } from 'vitest';
import { robots } from '@/data/robots';
import { specSchema, type SpecKey } from '@/lib/specSchema';

/**
 * スペック値の「静かな消失」検出。
 *
 * `RobotSpecs` は全項目 optional なので、値が消えた状態も型として正しい。
 * そのため tsc・validate:data・build・lint はいずれも成功したままになる。
 * 実例: acfaa7b は specSchema から2行消したことで、45機の `batterySystem` と
 * 16機の `batteryCapacityWh` を含む73件の値を、全ゲートgreenのまま削除した。
 *
 * ここは各項目の充足件数が下限を割っていないことだけを見る。合計ではなく項目別に
 * するのは、ある項目の消失が別項目の増加で相殺されるのを防ぐため。
 *
 * 意図的に値を減らす・項目を廃止するときは、同じcommitでこの数値を下げる。
 * 差分がレビューに現れることが目的なので、自動更新はしない。
 *
 * 型が `Record<SpecKey, number>` なので、`lib/specSchema.ts` へ項目を追加/削除すると
 * この表も直さない限り型検査が通らない（＝新項目が素通りしない）。
 */
const MIN_POPULATED: Record<SpecKey, number> = {
  mobility: 59,
  heightCm: 45,
  widthCm: 1,
  depthCm: 1,
  weightKg: 41,
  speedMps: 25,
  dof: 34,
  handType: 1,
  tactileSensor: 0,
  runtimeMin: 35,
  batteryCapacityMah: 1,
  chargeTimeMin: 15,
  batterySwapMethod: 1,
  batterySystem: 45,
  controlMethod: 47,
  sdk: 26,
  computePlatform: 25,
};

/** 2026-07-28時点のレコード数。archive等で意図的に減らすときだけ下げる */
const MIN_ROBOTS = 63;
/** payloadKg廃止後、可搬重量の正本は loadRatings[] 側にある */
const MIN_LOAD_RATINGS = 34;

const populated = (key: SpecKey) => robots.filter((robot) => robot.specs[key] != null).length;

describe('robot spec coverage floor', () => {
  for (const entry of specSchema) {
    const floor = MIN_POPULATED[entry.key];
    it(`${entry.key} keeps at least ${floor} populated value(s)`, () => {
      expect(populated(entry.key)).toBeGreaterThanOrEqual(floor);
    });
  }

  it(`keeps at least ${MIN_ROBOTS} robot records`, () => {
    expect(robots.length).toBeGreaterThanOrEqual(MIN_ROBOTS);
  });

  it(`keeps at least ${MIN_LOAD_RATINGS} robots with loadRatings`, () => {
    expect(robots.filter((robot) => (robot.loadRatings?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(
      MIN_LOAD_RATINGS,
    );
  });
});
