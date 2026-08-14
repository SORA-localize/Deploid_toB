import type { PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { clearDraftIntents, readDraftIntent, recordDraftIntent } from '../../lib/payload/publishAuthorization';

/**
 * remediation group 1 のレビュー指摘 #3 の回帰テスト（DB不要の単体テスト）。
 *
 * draft intent は `req.context` に載る。`req.context` は**同じrequestの中で使い回される**
 * （hookが `payload.update({ req })` のようにネストした操作を呼ぶと、`createLocalReq()` が
 * `{...req.context, ...context}` を作るため、中のMap参照がそのまま引き継がれる）。
 *
 * 記録が溜まりっぱなしだと、id指定のdraft保存が残した `true` を、後続の
 * **id を持たない書き込み**（`where` 指定のbulk update、`restoreVersion` など。これらは
 * `beforeOperation` で `args.id` が無いため何も記録しない）が拾ってしまい、
 * 「main rowを書く操作」が「draft保存」と誤認されうる。
 *
 * よって draft intent は「1回の書き込みのための使い捨てトークン」として扱う:
 * 読んだ時点で消費し、次の書き込みへ持ち越さない。持ち越しが無ければ、記録の無い経路は
 * 常に `false`（= main rowを書く扱い）へ落ちる（fail-closed）。
 */
function fakeReq(sharedContext: Record<string, unknown>): PayloadRequest {
  return { context: sharedContext } as unknown as PayloadRequest;
}

describe('draft intent is a single-use token scoped to one write', () => {
  it('returns the recorded intent exactly once and false afterwards', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);

    recordDraftIntent(req, 'manufacturers', 7, true);

    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(true);
    // 2回目以降は持ち越さない。
    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(false);
    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(false);
  });

  it('does not leak an intent recorded for one document to another document', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);

    recordDraftIntent(req, 'manufacturers', 7, true);

    expect(readDraftIntent(req, 'manufacturers', 8)).toBe(false);
    expect(readDraftIntent(req, 'robots', 7)).toBe(false);
  });

  it('does not leak an intent to a write that records nothing (id-less / bulk operations)', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);

    // id指定のdraft保存が記録し、そのwriteのgateが読む。
    recordDraftIntent(req, 'manufacturers', 7, true);
    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(true);

    // 続く `where` 指定のbulk updateは `beforeOperation` で何も記録しない。
    // ここで前の `true` を拾ってはいけない。
    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(false);
  });

  it('treats a missing document id as no draft intent', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);
    recordDraftIntent(req, 'manufacturers', 7, true);

    expect(readDraftIntent(req, 'manufacturers', undefined)).toBe(false);
  });

  /**
   * `beforeOperation` は access control より前に走るので、id指定のupdateが `beforeChange` へ
   * 到達せず終わると intent が孤児になる。孤児は `clearDraftIntents()`（各write operationの
   * 入口で呼ぶ）が捨てる。token自体を記録元operationへ紐づける案は、gateより前にLocal APIを
   * 呼ぶhookを持つcollectionで正当なdraft保存まで壊すため採らなかった
   * （`lib/payload/publishAuthorization.ts` の該当コメント参照）。
   */
  it('clears pending intents for one collection without touching another', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);

    recordDraftIntent(req, 'manufacturers', 7, true);
    recordDraftIntent(req, 'robots', 9, true);

    clearDraftIntents(req, 'manufacturers');

    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(false);
    expect(readDraftIntent(req, 'robots', 9)).toBe(true);
  });

  it('keeps an explicitly recorded false as false', () => {
    const context: Record<string, unknown> = {};
    const req = fakeReq(context);

    recordDraftIntent(req, 'manufacturers', 7, false);
    expect(readDraftIntent(req, 'manufacturers', 7)).toBe(false);
  });
});
