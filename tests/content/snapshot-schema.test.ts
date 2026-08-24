import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@/lib/content/contracts';
import { createLocalContentSource } from '@/lib/content/localSource';
import {
  SnapshotSchemaError,
  collectDuplicateStableIds,
  parseContentSnapshot,
  parseContentSnapshotJson,
} from '@/scripts/snapshotSchema.mts';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

/**
 * remediation group 2 / 必須修正6-4・6-5 の回帰テスト。
 *
 * 監査の指摘: `content:restore` は `JSON.parse(...) as ContentSnapshot` という bare cast だけで
 * 入力を受け取っていた。`as` は実行時に消えるので、**どんな JSON でも** managed DB への
 * upsert 入力になれた。厳密な runtime schema 検証を入れ、unknown field / 欠落 field /
 * 不正 enum / 不正日付 / 不正 collection / duplicate ID をすべて拒否する。
 */
const clone = (snapshot: ContentSnapshot): ContentSnapshot => structuredClone(snapshot);

describe('strict ContentSnapshot runtime schema', () => {
  it('accepts the test fixture snapshot', () => {
    expect(() => parseContentSnapshot(clone(contentSnapshotFixture))).not.toThrow();
  });

  it('accepts the real local content snapshot (data/*.ts)', async () => {
    // 実データが通らない検証は厳しすぎる（restoreを常に落とす）。実データで固定する。
    const local = await createLocalContentSource().readSnapshot();
    expect(() => parseContentSnapshot(local)).not.toThrow();
  });

  it('rejects a bare cast of arbitrary JSON', () => {
    expect(() => parseContentSnapshotJson('{"hello":"world"}')).toThrow(/snapshot-schema-invalid/);
    expect(() => parseContentSnapshotJson('not json at all')).toThrow(/not valid JSON/);
  });

  it('rejects an unknown field anywhere in the tree', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.robots[0] as unknown as Record<string, unknown>).backdoorField = 'anything';
    expect(() => parseContentSnapshot(snapshot)).toThrow(/robots\[0\]\.backdoorField: unknown field/);
  });

  it('rejects an unknown top-level collection', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot as unknown as Record<string, unknown>).secretCollection = [];
    expect(() => parseContentSnapshot(snapshot)).toThrow(/snapshot\.secretCollection: unknown field/);
  });

  it('rejects a missing required field', () => {
    const snapshot = clone(contentSnapshotFixture);
    delete (snapshot.manufacturers[0] as Partial<(typeof snapshot.manufacturers)[number]>).website;
    expect(() => parseContentSnapshot(snapshot)).toThrow(/manufacturers\[0\]\.website: required field is missing/);
  });

  it('rejects an invalid enum value', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.robots[0] as unknown as Record<string, unknown>).publishStatus = 'live';
    expect(() => parseContentSnapshot(snapshot)).toThrow(/robots\[0\]\.publishStatus: expected one of/);
  });

  it('rejects an unregistered tag', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.useCases[0].industryTags = ['not-a-real-industry' as never];
    expect(() => parseContentSnapshot(snapshot)).toThrow(/not a registered industry tag/);
  });

  it('rejects invalid dates, including dates that do not exist on the calendar', () => {
    for (const [value, pattern] of [
      ['2026-13-01', /month out of range/],
      ['2026-02-31', /not a real calendar date/],
      ['yesterday', /expected YYYY, YYYY-MM or YYYY-MM-DD/],
    ] as const) {
      const snapshot = clone(contentSnapshotFixture);
      snapshot.articles[0].publishedAt = value;
      expect(() => parseContentSnapshot(snapshot), value).toThrow(pattern);
    }
  });

  it('keeps accepting month-precision content dates', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.robots[0].sources = structuredClone(contentSnapshotFixture.robots[0].sources);
    snapshot.robots[0].sources[0].publishedAt = '2025-05';
    expect(() => parseContentSnapshot(snapshot)).not.toThrow();
  });

  /**
   * `--source payload` の export は、空の列を `undefined` ではなく **`null`** で返す
   * （実測: 実データ1本の baseline に467個）。`canonicalJson` は `undefined` を落とすが `null` は
   * 残すので、正規の署名済み artifact に `null` が入る。ここで `null` を拒否すると
   * **自分たちの正規 baseline を restore できなくなる**（end-to-end 実行で実際に発生した）。
   * 任意 field の `null` は「値なし」として受け、必須 field の `null` は拒否したままにする。
   */
  it('accepts null as "absent" for optional fields, the way a Payload-sourced export writes them', () => {
    const snapshot = clone(contentSnapshotFixture);
    const robot = snapshot.robots[0] as unknown as Record<string, unknown>;
    robot.nameJa = null;
    robot.featuredRank = null;
    robot.nextReviewBy = null;
    robot.heroImage = null;
    expect(() => parseContentSnapshot(snapshot)).not.toThrow();
  });

  it('still rejects null in a required field', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.robots[0] as unknown as Record<string, unknown>).name = null;
    expect(() => parseContentSnapshot(snapshot)).toThrow(/robots\[0\]\.name: expected string, got null/);
  });

  it('rejects a duplicate stable id inside one collection', () => {
    const snapshot = clone(contentSnapshotFixture);
    snapshot.robots.push(structuredClone(snapshot.robots[0]));
    expect(() => parseContentSnapshot(snapshot)).toThrow(/duplicate stable id "fixture-robot-a"/);
    expect(collectDuplicateStableIds(snapshot)).toEqual([
      { path: 'robots', detail: 'duplicate stable id "fixture-robot-a"' },
    ]);
  });

  it('rejects an unknown spec key on a robot', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.robots[0].specs as Record<string, unknown>).madeUpSpec = 1;
    expect(() => parseContentSnapshot(snapshot)).toThrow(/specs\.madeUpSpec: unknown key/);
  });

  it('rejects a wrong article variant shape', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.articles[0] as unknown as Record<string, unknown>).type = 'not-an-article-type';
    expect(() => parseContentSnapshot(snapshot)).toThrow(/articles\[0\]\.type: expected one of/);
  });

  it('reports every problem it found, not just the first', () => {
    const snapshot = clone(contentSnapshotFixture);
    (snapshot.robots[0] as unknown as Record<string, unknown>).publishStatus = 'live';
    (snapshot.robots[1] as unknown as Record<string, unknown>).extraField = true;
    try {
      parseContentSnapshot(snapshot);
      throw new Error('expected parseContentSnapshot to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotSchemaError);
      expect((error as SnapshotSchemaError).problems.length).toBeGreaterThanOrEqual(2);
    }
  });
});
