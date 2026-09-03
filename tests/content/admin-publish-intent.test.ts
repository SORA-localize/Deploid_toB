import { describe, expect, it } from 'vitest';
import { computeCanonicalHash } from '@/lib/payload/publishApprovedVersion';
import {
  ADMIN_PUBLISH_INTENT_FIELD,
  ADMIN_PUBLISH_INTENT_PARAM,
  adminPublishIntentField,
  assertLatestVersionMatchesPublishIntent,
  clearUnclaimedAdminPublishIntent,
} from '@/lib/payload/adminPublishIntent';

/**
 * Admin公開UI（`docs/plans/admin-publish-ui-plan-v1.md` Task 1）。
 *
 * 公開クリックごとのtokenをversionへ刻み、routeが「その保存が作ったversionか」を
 * 判定できるようにする。tokenは認可情報ではなく**競合制御用のmarker**で、
 * 「Aが保存した直後にBが保存し、Bの内容がAの操作として公開される」を防ぐ。
 *
 * ## tokenをform dataではなくquery paramで運ぶ理由（計画 D-1 / Step 0）
 *
 * `admin: { hidden: true }` のfieldは**描画されないだけで値はform stateに載る**
 * （`@payloadcms/ui/.../addFieldStatePromise.js:74-88`。「prevent recursing and **rendering**」
 * とあり、`fieldState.value = data[field.name]` を設定してからreturnする）。
 *
 * したがってtokenを`overrides`で送ると、一度Publishした後のform stateがtokenを保持し、
 * **その後の通常のSave Draftがそれを再送する**。hookが`data`を見る設計だと、
 * 「Save Draftしただけのversionが公開可能になる」ためtokenの前提が崩れる。
 *
 * query paramなら token は form state に一切入らないので、この経路が原理的に消える。
 * よって hook は `req.searchParams` だけを見て、`data` の値は**信用しない**。
 */
describe('adminPublishIntentField', () => {
  it('UIへ出さないtext fieldで、書き込みはhookだけに閉じる', () => {
    const field = adminPublishIntentField();

    expect(field).toMatchObject({
      name: ADMIN_PUBLISH_INTENT_FIELD,
      type: 'text',
      admin: { hidden: true },
    });

    // 値を書けるのはhookだけ。API clientが直接tokenを差し込む経路を閉じる。
    const access = (field as { access?: { create?: () => boolean; update?: () => boolean } }).access;
    expect(access?.create?.()).toBe(false);
    expect(access?.update?.()).toBe(false);
  });

  it('field名とquery param名がexportされ、実装と綴りが一致する', () => {
    expect(ADMIN_PUBLISH_INTENT_FIELD).toBe('adminPublishIntentToken');
    expect(ADMIN_PUBLISH_INTENT_PARAM).toBe('adminPublishIntent');
  });
});

describe('clearUnclaimedAdminPublishIntent', () => {
  const req = (search: string) => ({ searchParams: new URLSearchParams(search) }) as never;

  it('query paramがあるときだけtokenを保存する', () => {
    const result = clearUnclaimedAdminPublishIntent({
      data: { name: 'Alpha' },
      req: req(`${ADMIN_PUBLISH_INTENT_PARAM}=tok-a`),
    } as never);

    expect(result).toMatchObject({ name: 'Alpha', adminPublishIntentToken: 'tok-a' });
  });

  it('query paramが無い通常保存ではnullを書く（form stateの再送を無視する）', () => {
    // 一度Publishした後のform stateはtokenを保持しており、通常のSave Draftがそれを再送する。
    // hookは`data`を信用せず、paramが無ければ必ずnullにする。
    const result = clearUnclaimedAdminPublishIntent({
      data: { name: 'Alpha', adminPublishIntentToken: 'stale-token-from-form-state' },
      req: req(''),
    } as never);

    expect(result).toMatchObject({ adminPublishIntentToken: null });
  });

  it('別のPublishクリックでは別tokenへ置き換える', () => {
    const result = clearUnclaimedAdminPublishIntent({
      data: { adminPublishIntentToken: 'tok-a' },
      req: req(`${ADMIN_PUBLISH_INTENT_PARAM}=tok-b`),
    } as never);

    expect(result).toMatchObject({ adminPublishIntentToken: 'tok-b' });
  });

  it('reqにsearchParamsが無い経路（import / restore / Local API）でもnullで通る', () => {
    // `content:import` などLocal API経由の書き込みはHTTP requestを持たない。
    // ここでthrowするとimport全体が壊れるため、必ずnullで通す。
    expect(clearUnclaimedAdminPublishIntent({ data: { name: 'Alpha' }, req: {} } as never)).toMatchObject({
      name: 'Alpha',
      adminPublishIntentToken: null,
    });
  });

  it('dataの他fieldを落とさない', () => {
    const result = clearUnclaimedAdminPublishIntent({
      data: { name: 'Alpha', slug: 'alpha', nested: { a: 1 } },
      req: req(''),
    } as never);

    expect(result).toMatchObject({ name: 'Alpha', slug: 'alpha', nested: { a: 1 } });
  });
});

describe('assertLatestVersionMatchesPublishIntent', () => {
  const version = (token: unknown) => ({ version: { adminPublishIntentToken: token } }) as never;

  it('一致すれば通る', () => {
    expect(() => assertLatestVersionMatchesPublishIntent(version('tok-a'), 'tok-a')).not.toThrow();
  });

  it('別の保存が割り込んでいたら publish-candidate-replaced で止まる', () => {
    // これが token の存在理由。A保存 → B保存 → A公開 のとき、
    // 最新versionはBのものでtokenが一致しないので、Bの内容がAの操作として公開されない。
    expect(() => assertLatestVersionMatchesPublishIntent(version('tok-b'), 'tok-a')).toThrow(
      /publish-candidate-replaced/,
    );
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['空文字', ''],
  ])('versionのtokenが%sならfail-closedで止まる', (_label, stored) => {
    // 通常のSave Draftが作ったversion（hookがnullを書く）は公開候補にならない。
    expect(() => assertLatestVersionMatchesPublishIntent(version(stored), 'tok-a')).toThrow(
      /publish-candidate-replaced/,
    );
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['空文字', ''],
  ])('期待token側が%sでもfail-closedで止まる（空同士を一致とみなさない）', (_label, expected) => {
    expect(() => assertLatestVersionMatchesPublishIntent(version(''), expected as never)).toThrow(
      /publish-candidate-replaced/,
    );
  });
});

describe('canonical hash からの除外（Task 1 Step 5）', () => {
  it('tokenが違ってもcanonical hashは変わらない', () => {
    // tokenはversionごとに変わる運用メタデータ。ここに入るとhashが内容と無関係に動き、
    // `publishApprovedVersion` の `publish-hash-mismatch` が誤発火する。
    const base = { name: 'Alpha', slug: 'alpha' };

    expect(computeCanonicalHash({ ...base, [ADMIN_PUBLISH_INTENT_FIELD]: 'tok-a' })).toBe(
      computeCanonicalHash({ ...base, [ADMIN_PUBLISH_INTENT_FIELD]: 'tok-b' }),
    );
    expect(computeCanonicalHash({ ...base, [ADMIN_PUBLISH_INTENT_FIELD]: 'tok-a' })).toBe(
      computeCanonicalHash(base),
    );
  });

  it('本文が変わればhashは変わる（除外しすぎていないことの確認）', () => {
    expect(computeCanonicalHash({ name: 'Alpha' })).not.toBe(computeCanonicalHash({ name: 'Beta' }));
  });
});
