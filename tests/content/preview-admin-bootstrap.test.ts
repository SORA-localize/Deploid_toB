import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getPayload, type Payload } from 'payload';
import config from '../../payload.config';
import { assertPreviewWriteConfirmedByMarker, bootstrapAdminIfAllowed } from '@/scripts/import-content-to-payload.mts';
import { assertLocalThrowawayDatabase } from './testDbGuard';

/**
 * `bootstrapAdminIfAllowed()`（remediation: 2026-08-22、Preview rehearsal中に見つかったgap）の
 * 検証。実Postgres + 実Payload Local APIを使う——mockでは`_environment_marker`のunique制約
 * 違反やaccess control(`create: () => false`)の実際の挙動を再現できないため。
 *
 * `isLocal`は関数の引数として明示的に渡す（実装側のコメント参照）。これにより、実際には
 * ローカルthrowaway DBである共有ambient DBを使いながら、「non-localと判定された場合」の
 * 分岐を偽装なしで検証できる——`classifyDatabaseUrl()`自体（pure関数、host文字列の
 * 完全一致判定のみ）は別途レビュー済みの既存コードで、ここでは再検証しない。
 *
 * `_environment_marker`は他の`tests/content/*.test.ts`と共有するambient DBの一部（Task 3.5の
 * committed migrationで作られるtable）。`vitest.config.ts`の`fileParallelism: false`により
 * 他fileと同時実行されないことを前提に、このfile内でmarker行を作成・削除する
 * （前後で必ず空へ戻す——他fileが「markerは無い」ことを前提にしている可能性があるため）。
 */
describe('bootstrapAdminIfAllowed (Preview admin bootstrap safety guard)', () => {
  let payload: Payload;
  const EMAIL = 'preview-bootstrap-test-admin@example.com';
  const PASSWORD = 'Str0ngPassw0rd!23';

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/preview-admin-bootstrap.test.ts');
    payload = await getPayload({ config });
    // `bootstrapAdminIfAllowed()`のcreate呼び出しは`overrideAccess: false`（意図的——実bootstrap
    // 経路と同じaccess controlを通す）。Admins collectionのaccess controlは「admins 0件のときだけ
    // 誰でも作成可」なので、ambient DB（他fileと共有）に他fileが残したadmin行があると
    // 前提が崩れる。`tests/content/import-dry-run.test.ts`と同じ既存の慣習
    // （自分のsetupでadminsを空にする）に倣う。
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'environment-marker', where: {}, overrideAccess: true });
    await payload.delete({ collection: 'admins', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    await payload.delete({ collection: 'environment-marker', where: {}, overrideAccess: true }).catch(() => undefined);
  });

  it('creates the admin when isLocal is true, regardless of any flags (existing local path, unchanged)', async () => {
    const args = new Map<string, string | true>();
    await bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, true);

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(1);
    // beforeAll で admins を空にしているため、この admin は必ず「1人目」——
    // Admins.hooks.beforeValidate により platform-admin へ強制される。
    expect((docs[0] as { role?: string }).role).toBe('platform-admin');
  });

  it('refuses when isLocal is false and --i-know-this-is-preview is not passed', async () => {
    const args = new Map<string, string | true>();
    await expect(bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, false)).rejects.toThrow(
      /i-know-this-is-preview/,
    );

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(0);
  });

  it('refuses when isLocal is false, the flag is passed, but no _environment_marker row exists (fail-closed)', async () => {
    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, false)).rejects.toThrow(
      /never stamped/,
    );

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(0);
  });

  it('refuses when isLocal is false, the flag is passed, but the marker says "production"', async () => {
    await payload.create({
      collection: 'environment-marker',
      overrideAccess: true,
      data: { environment: 'production', singleton: 1 } as never,
    });

    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, false)).rejects.toThrow(
      /reports "production", not "preview"/,
    );

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(0);
  });

  it('refuses when --admin-password (CLI arg) is used together with --i-know-this-is-preview, even if the marker says preview', async () => {
    await payload.create({
      collection: 'environment-marker',
      overrideAccess: true,
      data: { environment: 'preview', singleton: 1 } as never,
    });

    const args = new Map<string, string | true>([
      ['i-know-this-is-preview', true],
      ['admin-password', PASSWORD],
    ]);
    await expect(bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, false)).rejects.toThrow(
      /--admin-password is not allowed together with --i-know-this-is-preview/,
    );

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(0);
  });

  it('creates the admin when isLocal is false, the flag is passed, no CLI-arg password, and the marker says "preview"', async () => {
    await payload.create({
      collection: 'environment-marker',
      overrideAccess: true,
      data: { environment: 'preview', singleton: 1 } as never,
    });

    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await bootstrapAdminIfAllowed(payload, args, EMAIL, PASSWORD, false);

    const { docs } = await payload.find({ collection: 'admins', where: { email: { equals: EMAIL } }, overrideAccess: true });
    expect(docs).toHaveLength(1);
    expect((docs[0] as { role?: string }).role).toBe('platform-admin');
  });
});

/**
 * `assertPreviewWriteConfirmedByMarker()`（remediation: 2026-08-22、外部レビューが発見した
 * 二次的なgap）の検証。
 *
 * 発見された穴: `assertWritableDatabaseUrl()`の`confirmedPreview`分岐（接続前の同期的な
 * URL判定）は、`--i-know-this-is-preview`を渡すだけで書き込みを許可していた——DBの中身
 * （`_environment_marker`）を一切見ていなかった。`bootstrapAdminIfAllowed()`のmarker検証は
 * 「adminがまだ無い」場合にしか呼ばれないため、既にadminが存在する対象（実運用中の
 * Productionはまさにこれに該当する）には一度も適用されない。結果、
 * `DATABASE_URL=<production> --i-know-this-is-preview`（既存adminあり）という組み合わせが、
 * 何の検証もなくcontent upsertまで到達できてしまっていた。
 *
 * この関数は`getPayload()`接続後・実際の書き込みを行う前に必ず呼ばれ、DB自身の申告を検証する。
 */
describe('assertPreviewWriteConfirmedByMarker (Preview write gate — DB self-report verification)', () => {
  let payload: Payload;

  beforeAll(async () => {
    assertLocalThrowawayDatabase('tests/content/preview-admin-bootstrap.test.ts');
    payload = await getPayload({ config });
  });

  afterEach(async () => {
    await payload.delete({ collection: 'environment-marker', where: {}, overrideAccess: true });
  });

  afterAll(async () => {
    await payload.delete({ collection: 'environment-marker', where: {}, overrideAccess: true }).catch(() => undefined);
  });

  it('allows when the marker says "preview" and only --i-know-this-is-preview is passed', async () => {
    await payload.create({
      collection: 'environment-marker',
      overrideAccess: true,
      data: { environment: 'preview', singleton: 1 } as never,
    });

    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(assertPreviewWriteConfirmedByMarker(payload, args, false)).resolves.toBeUndefined();
  });

  it('refuses when the marker says "production", even with --i-know-this-is-preview', async () => {
    await payload.create({
      collection: 'environment-marker',
      overrideAccess: true,
      data: { environment: 'production', singleton: 1 } as never,
    });

    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(assertPreviewWriteConfirmedByMarker(payload, args, false)).rejects.toThrow(
      /reports "production", not "preview"/,
    );
  });

  it('refuses when there is no marker row at all (never stamped), even with --i-know-this-is-preview (fail-closed)', async () => {
    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(assertPreviewWriteConfirmedByMarker(payload, args, false)).rejects.toThrow(/never stamped/);
  });

  it('does not check the marker at all when --i-know-this-is-production is also passed (existing production-flag behavior unchanged)', async () => {
    // No marker row exists at all here — if this function checked the marker for the
    // production-flag path, this would throw. It must not: assertWritableDatabaseUrl()'s
    // existing --i-know-this-is-production path is explicitly out of scope for this change.
    const args = new Map<string, string | true>([
      ['i-know-this-is-preview', true],
      ['i-know-this-is-production', true],
    ]);
    await expect(assertPreviewWriteConfirmedByMarker(payload, args, false)).resolves.toBeUndefined();
  });

  it('does not check the marker at all when isLocal is true, regardless of flags', async () => {
    const args = new Map<string, string | true>([['i-know-this-is-preview', true]]);
    await expect(assertPreviewWriteConfirmedByMarker(payload, args, true)).resolves.toBeUndefined();
  });

  it('is a no-op when --i-know-this-is-preview was never passed (authorized via --i-know-this-is-production alone, or local+throwaway)', async () => {
    await expect(assertPreviewWriteConfirmedByMarker(payload, new Map(), false)).resolves.toBeUndefined();
  });
});
