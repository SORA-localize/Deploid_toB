import { describe, expect, it } from 'vitest';
import {
  assertCiThrowawayDatabaseUrl,
  assertStrictThrowawayDatabaseUrl,
  assertWritableDatabaseUrl,
  classifyDatabaseUrl,
} from '@/lib/content/databaseSafety';

describe('assertCiThrowawayDatabaseUrl', () => {
  it('rejects a CI seed target that is not a local throwaway database', () => {
    expect(() =>
      assertCiThrowawayDatabaseUrl(
        'scripts/seed-ci-site-settings.mts',
        'postgresql://u@db.example.supabase.co:5432/postgres',
      ),
    ).toThrow(/local throwaway Postgres/);
  });

  it('allows a local throwaway database', () => {
    expect(() =>
      assertCiThrowawayDatabaseUrl(
        'scripts/seed-ci-site-settings.mts',
        'postgresql://u@localhost:5432/deploid_ci_e2e_test',
      ),
    ).not.toThrow();
  });
});

/**
 * remediation group 4 (P0) の回帰テスト。
 *
 * 2026-08-20のインシデント後、throwaway DB判定ロジックは`tests/content/testDbGuard.ts`だけに
 * 置かれていた。外部監査は「実際に破壊的書き込みを行う `content:import` / `content:restore` の
 * gate（`assertWritableDatabase` / `assertRestoreInputModeAllowed`）が、同種のhost-onlyな
 * 脆弱性を持ったまま残っている」と指摘した。この共通module（`lib/content/databaseSafety.ts`）が
 * 分類ロジックの唯一の実体になる。
 *
 * ここでは純粋関数だけをテストする（実DBには一切接続しない）。
 */
describe('classifyDatabaseUrl (純粋な分類ロジック)', () => {
  it('classifies known local hosts as local', () => {
    // `::1`（IPv6 loopback）は元のtestDbGuard.tsのLOCAL_DATABASE_HOSTSにも含まれているが、
    // `new URL('postgresql://u@[::1]:5432/x').hostname`は`[::1]`（角括弧付き）を返すため、
    // 素の`::1`とは一致しない。これは移植元の既存挙動で、fail-closed（non-localとして拒否）な
    // 方向の既知の限界であり本remediationのscope外（安全性を弱める向きではない）。
    for (const hostForUrl of ['localhost', '127.0.0.1']) {
      expect(classifyDatabaseUrl(`postgresql://u@${hostForUrl}:5432/deploid_test`).isLocalHost).toBe(true);
    }
  });

  it('classifies a managed Supabase host as non-local', () => {
    const result = classifyDatabaseUrl('postgresql://u@db.abcdef.supabase.co:5432/postgres');
    expect(result.isLocalHost).toBe(false);
    expect(result.host).toBe('db.abcdef.supabase.co');
  });

  it('recognizes names containing test/throwaway/e2e as throwaway, case-insensitively', () => {
    for (const name of ['deploid_test', 'deploid_TEST_foo', 'deploid_throwaway', 'deploid_e2e_run']) {
      expect(classifyDatabaseUrl(`postgresql://u@localhost:5432/${name}`).looksLikeThrowawayName).toBe(true);
    }
  });

  it('never treats deploid_dev or postgres as throwaway, regardless of host', () => {
    for (const name of ['deploid_dev', 'postgres']) {
      expect(classifyDatabaseUrl(`postgresql://u@localhost:5432/${name}`).looksLikeThrowawayName).toBe(false);
    }
  });

  it('treats an arbitrary persistent-looking local name as non-throwaway', () => {
    expect(classifyDatabaseUrl('postgresql://u@localhost:5432/deploid_manual_probe').looksLikeThrowawayName).toBe(
      false,
    );
  });

  it('extracts the database name without the leading slash', () => {
    expect(classifyDatabaseUrl('postgresql://u@localhost:5432/deploid_test').databaseName).toBe('deploid_test');
  });

  it('throws on an invalid connection URL', () => {
    expect(() => classifyDatabaseUrl('not-a-url')).toThrow(/not a valid connection URL/);
  });
});

describe('assertStrictThrowawayDatabaseUrl (test suite向け: 常に拒否、flagによる迂回なし)', () => {
  it('throws when DATABASE_URL is not set', () => {
    expect(() => assertStrictThrowawayDatabaseUrl('some.test.ts', undefined)).toThrow(/DATABASE_URL is not set/);
  });

  it('throws on a non-local host', () => {
    expect(() =>
      assertStrictThrowawayDatabaseUrl('some.test.ts', 'postgresql://u@db.abcdef.supabase.co:5432/deploid_test'),
    ).toThrow(/Refusing to run/);
  });

  it('throws on deploid_dev even though it is on localhost', () => {
    expect(() =>
      assertStrictThrowawayDatabaseUrl('some.test.ts', 'postgresql://u@localhost:5432/deploid_dev'),
    ).toThrow(/Refusing to run/);
  });

  it('throws on a local database whose name is not recognizably throwaway', () => {
    expect(() =>
      assertStrictThrowawayDatabaseUrl('some.test.ts', 'postgresql://u@localhost:5432/deploid_manual_probe'),
    ).toThrow(/Refusing to run/);
  });

  it('passes for a local throwaway-named database', () => {
    expect(() =>
      assertStrictThrowawayDatabaseUrl('some.test.ts', 'postgresql://u@localhost:5432/deploid_task9_test'),
    ).not.toThrow();
  });
});

describe('assertWritableDatabaseUrl (CLIスクリプト向け: 3分岐、明示flagによる迂回を許す)', () => {
  const call = (overrides: Partial<Parameters<typeof assertWritableDatabaseUrl>[0]> = {}) =>
    assertWritableDatabaseUrl({
      raw: 'postgresql://u@localhost:5432/deploid_task9_test',
      callerFile: 'scripts/some-script.mts',
      confirmedProduction: false,
      confirmedPreview: false,
      confirmedPersistentLocalDatabase: false,
      ...overrides,
    });

  it('throws when DATABASE_URL is not set', () => {
    expect(() => call({ raw: undefined })).toThrow(/DATABASE_URL is not set/);
  });

  // ─── remote host branch（2026-08-22: --i-know-this-is-preview を対称に追加） ──
  it('refuses a remote host without --i-know-this-is-production or --i-know-this-is-preview', () => {
    expect(() => call({ raw: 'postgresql://u@db.abcdef.supabase.co:5432/postgres' })).toThrow(/Refusing to write/);
  });

  it('allows a remote host with --i-know-this-is-production', () => {
    expect(() =>
      call({ raw: 'postgresql://u@db.abcdef.supabase.co:5432/postgres', confirmedProduction: true }),
    ).not.toThrow();
  });

  it('allows a remote host with --i-know-this-is-preview (does not require --i-know-this-is-production too)', () => {
    expect(() =>
      call({ raw: 'postgresql://u@db.abcdef.supabase.co:5432/postgres', confirmedPreview: true }),
    ).not.toThrow();
  });

  // ─── local + throwaway name branch (既存通り無条件で許可) ────────────────
  it('allows a local throwaway-named database unconditionally, no flag needed', () => {
    expect(() =>
      call({ raw: 'postgresql://u@localhost:5432/deploid_task9_test' }),
    ).not.toThrow();
  });

  // ─── local + non-throwaway name branch (新設: 明示的な確認flagを要求する) ─
  it('refuses a local persistent database (deploid_dev) without the confirmation flag', () => {
    expect(() => call({ raw: 'postgresql://u@localhost:5432/deploid_dev' })).toThrow(
      /i-know-this-is-a-persistent-local-database/,
    );
  });

  it('allows a local persistent database (deploid_dev) once the confirmation flag is given', () => {
    expect(() =>
      call({ raw: 'postgresql://u@localhost:5432/deploid_dev', confirmedPersistentLocalDatabase: true }),
    ).not.toThrow();
  });

  it('refuses an arbitrary non-throwaway local database name without the flag', () => {
    expect(() => call({ raw: 'postgresql://u@localhost:5432/deploid_manual_probe' })).toThrow(
      /i-know-this-is-a-persistent-local-database/,
    );
  });

  it('allows an arbitrary non-throwaway local database name with the flag', () => {
    expect(() =>
      call({ raw: 'postgresql://u@localhost:5432/deploid_manual_probe', confirmedPersistentLocalDatabase: true }),
    ).not.toThrow();
  });

  it('the two confirmation flags are distinct — the production flag does not unlock a local persistent database', () => {
    expect(() =>
      call({ raw: 'postgresql://u@localhost:5432/deploid_dev', confirmedProduction: true }),
    ).toThrow(/i-know-this-is-a-persistent-local-database/);
  });
});
