import { describe, expect, it, vi } from 'vitest';
import { PublishValidationError } from '@/lib/payload/access';
import { mapPublishError } from '@/lib/payload/adminPublishErrors';

/**
 * Admin公開routeのエラー写像（`docs/plans/admin-publish-ui-plan-v1.md` Task 4 Step 6）。
 *
 * routeそのものは `getPayload()` を呼ぶため単体で組み立てられない。写像は
 * `lib/payload/adminPublishErrors.ts` へ切り出してあり、**routeとこのsuiteが同じ実装を参照する**。
 * 規則をテスト側へ書き写すと、routeを変えてもテストが緑のままになり「検証したつもり」になる。
 * 認証・origin判定は `publish-request-auth.test.ts`、公開の中身は
 * `admin-publish-service.test.ts`（実Postgres）が担当する。
 *
 * ## なぜValidationErrorの行が最重要か
 *
 * draft保存はPayloadのfield検証を飛ばす。したがって「必須項目が足りない下書きを公開しようとした」が
 * **最も多い失敗**になる。ここを500へ落とすと利用者には「Something went wrong.」相当が出て、
 * この計画の主目的（原因が分かるようにする）を最頻ケースで達成できない。
 */

describe('公開失敗の写像', () => {
  it('PublishValidationError は422で不足field名を返す（messageをparseしない）', () => {
    const [status, body] = mapPublishError(new PublishValidationError(['website', 'description'], 'manufacturers'));

    expect(status).toBe(422);
    expect(body.error).toBe('publish-validation-failed');
    expect(body.fields).toEqual(['website', 'description']);
  });

  it('base検査（scopeなし）でも同じ形で返る', () => {
    const [status, body] = mapPublishError(new PublishValidationError(['summary', 'sources']));
    expect(status).toBe(422);
    expect(body.fields).toEqual(['summary', 'sources']);
  });

  it('Payloadの ValidationError は422でfield pathを返す（500に落とさない）', () => {
    const err = Object.assign(new Error('The following field is invalid: website'), {
      name: 'ValidationError',
      data: { errors: [{ path: 'website' }, { field: 'description' }] },
    });

    const [status, body] = mapPublishError(err);
    expect(status).toBe(422);
    expect(body.error).toBe('validation-failed');
    expect(body.fields).toEqual(['website', 'description']);
  });

  it('ValidationErrorのerrorsが空でも422のまま（形は保つ）', () => {
    const err = Object.assign(new Error('invalid'), { name: 'ValidationError', data: {} });
    const [status, body] = mapPublishError(err);
    expect(status).toBe(422);
    expect(body.fields).toEqual([]);
  });

  it.each([
    ['publish-candidate-replaced: someone else saved', 409, 'publish-candidate-replaced'],
    ['publish-stale-approval: a newer draft exists', 409, 'publish-stale-approval'],
    ['publish-hash-mismatch: content changed', 409, 'publish-hash-mismatch'],
    ['publish-role-required', 403, 'publish-role-required'],
    ['archive-role-required', 403, 'archive-role-required'],
    ['publish-not-found: no manufacturers document', 404, 'publish-not-found'],
    ['publish-lock-unavailable: no transaction', 503, 'publish-temporarily-unavailable'],
    ['publish-transaction-unavailable: adapter', 503, 'publish-temporarily-unavailable'],
  ])('%s → %i', (message, expectedStatus, expectedError) => {
    const [status, body] = mapPublishError(new Error(message));
    expect(status).toBe(expectedStatus);
    expect(body.error).toBe(expectedError);
  });

  it('publish-approval-required は500（正しい経路なら到達しない＝配線バグの signal）', () => {
    // serviceを経由していれば承認contextが付くので、ここへ来たら配線が壊れている。
    // 利用者向けには汎用エラー、詳細はサーバーログという扱い。
    const [status, body] = mapPublishError(new Error('publish-approval-required'));
    expect(status).toBe(500);
    expect(body.error).toBe('publish-internal-error');
  });

  it('未知の例外は500だが、内部messageを本文へ載せない', () => {
    const [status, body] = mapPublishError(new Error('connection terminated unexpectedly at 10.0.0.5'));
    expect(status).toBe(500);
    expect(body.error).toBe('publish-internal-error');
    expect(JSON.stringify(body)).not.toContain('10.0.0.5');
  });

  it('Error以外がthrowされても落ちない', () => {
    expect(mapPublishError('publish-not-found')[0]).toBe(404);
    expect(mapPublishError(null)[0]).toBe(500);
  });
});

describe('レスポンス本文の方針', () => {
  it('表示文言を含めず、安定した識別子だけを返す', () => {
    // 翻訳はclient側のPayload i18nが行う（計画 Global Constraints）。
    // APIが日本語を返すと、英語ロケールのadminで日本語が混ざる。
    const [, body] = mapPublishError(new PublishValidationError(['website'], 'manufacturers'));
    const serialized = JSON.stringify(body);

    expect(serialized).not.toMatch(/[ぁ-んァ-ヶ一-龠]/);
    expect(Object.keys(body).sort()).toEqual(['error', 'fields', 'ok']);
  });
});

/**
 * 2026-09-03、`tests/e2e/payload-admin-publish.spec.ts` が実ビルドのNextサーバー上で
 * 検出した不具合の回帰テスト。
 *
 * 必須項目を空にして公開すると、サーバーは正しく `PublishValidationError` をthrowしていたのに、
 * `mapPublishError` が **500 / `publish-internal-error`** を返していた。原因は
 * `error instanceof PublishValidationError` —— Next.jsは `access.ts` をサーバー側の複数chunkへ
 * 重複して束ねるため、hookがthrowした側とここが参照する側でconstructorが別objectになる。
 *
 * つまり**この写像を作った目的（原因が分かるようにする）が、最も多い失敗ケースで失われていた**。
 * 上のsuiteが緑だったのは、vitestが単一module graphで動くため。
 *
 * `vi.resetModules()` で2つ目のmodule instanceを作ると、その状況をそのまま再現できる。
 */
describe('module instanceをまたいだ例外の写像', () => {
  it('別instanceの PublishValidationError でも422で不足field名を返す', async () => {
    vi.resetModules();
    const other = await import('@/lib/payload/access');
    expect(other.PublishValidationError).not.toBe(PublishValidationError);

    const [status, body] = mapPublishError(new other.PublishValidationError(['website'], 'manufacturers'));

    expect(status).toBe(422);
    expect(body.error).toBe('publish-validation-failed');
    expect(body.fields).toEqual(['website']);
  });

  it('`name` を騙るだけで `fields` を持たないobjectは422にしない', () => {
    // 形で判定する以上、形が揃っていないものを通してはいけない。
    const [status] = mapPublishError(Object.assign(new Error('x'), { name: 'PublishValidationError' }));
    expect(status).toBe(500);
  });

  it('`fields` に文字列以外が混ざっていれば422にしない', () => {
    const fake = Object.assign(new Error('x'), { name: 'PublishValidationError', fields: ['ok', 42] });
    expect(mapPublishError(fake)[0]).toBe(500);
  });
});
