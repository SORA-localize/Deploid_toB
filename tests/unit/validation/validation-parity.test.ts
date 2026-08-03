import { describe, expect, it } from 'vitest';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
import { validateContentSnapshot } from '@/lib/validation/validateContentSnapshot';

/**
 * validateContentSnapshot は複数のバリデータを固定順で呼ぶ orchestrator。
 * 呼出順は分割前 lib/validate.ts の出力順に一字一句合わせてあり（詳細は
 * lib/validation/validateContentSnapshot.ts 冒頭のコメントと commit d97cc4c を参照）、
 * robot鮮度 → manufacturer鮮度 → collection横断 → ... → deployments → articlePlacements
 * の順で errors/warnings に push される。
 *
 * このテストは `toContain` ではなく `toEqual` で配列そのものを固定する。
 * 複数collectionから同時にエラー/警告を出すfixtureを使い、呼出順が入れ替わると
 * 必ず配列の並びが変わって落ちるようにするため（旧テストは
 * `validateContentSnapshot(x)` と `validateData()`＝そのラッパー呼び出しを比較する
 * f(x) === f(x) の自明比較で、何が壊れても検知できなかった）。
 */
describe('validator call order', () => {
  it('emits freshness warnings and a reference error in the orchestrator fixed order', () => {
    const snapshot = structuredClone(localContentSnapshot);

    // 鮮度警告: robot と manufacturer の両方を stale にする。
    // orchestrator は robot鮮度→manufacturer鮮度の順で呼ぶ（monolithで検証全体の
    // 先頭にhoistされていた2ループ）ため、warnings はこの順で並ぶはずである。
    snapshot.robots[0].nextReviewBy = '2020-01-01';
    snapshot.manufacturers[0].nextReviewBy = '2020-01-01';

    // 参照エラー: deployment が存在しない manufacturerId を指す
    // （reference-errors.test.ts と同種のfixture。ここでは配列全体の完全一致に使う）。
    snapshot.deployments[0].manufacturerId = 'missing-manufacturer-xyz';

    const result = validateContentSnapshot(snapshot);

    expect(result.warnings).toEqual([
      `[stale] robot "${snapshot.robots[0].id}" の nextReviewBy (2020-01-01) を過ぎています。再確認してください`,
      `[stale] manufacturer "${snapshot.manufacturers[0].id}" の nextReviewBy (2020-01-01) を過ぎています。再確認してください`,
    ]);
    expect(result.errors).toEqual([
      `[missing] deployment "${snapshot.deployments[0].id}".manufacturerId -> "missing-manufacturer-xyz" は存在しません`,
    ]);
  });
});
