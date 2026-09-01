import { describe, expect, it } from 'vitest';
import { findPayloadMigrationGuardViolations } from '../../scripts/check-payload-migration-guard.mjs';

/**
 * 2026-09-01 の監査で見つかった取りこぼしを固定する。
 *
 * `getPayload()` は `PAYLOAD_MIGRATING=true` が無いと dev-mode schema push（実DDL）を走らせる
 * （`@payloadcms/db-postgres` の `connect.js`）。`payload.config.ts` は `push:` を指定していないので
 * このフラグだけが歯止め。当時 `verify-content-snapshot.mts` /
 * `verify-content-conservation.mts` / `compare-content-sources.mts` の3本に無く、
 * うち2本は復旧runbookが**本番に対して実行するよう案内していた**手順の一部だった。
 */
describe('scripts が Payload へ接続する前に schema push を止めていること', () => {
  const GUARD = "process.env.PAYLOAD_MIGRATING = 'true';";

  it('ガード無しで Payload へ到達する script を violation として報告する', () => {
    const violations = findPayloadMigrationGuardViolations([
      {
        path: 'scripts/example-unguarded.mts',
        source: "const { createPayloadContentSource } = await import('../lib/content/payloadSource.ts');",
      },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.path).toBe('scripts/example-unguarded.mts');
  });

  it('ガードがあれば violation にしない', () => {
    const violations = findPayloadMigrationGuardViolations([
      {
        path: 'scripts/example-guarded.mts',
        source: `${GUARD}\nconst { getPayload } = await import('payload');\nconst { default: config } = await import('../payload.config.ts');`,
      },
    ]);
    expect(violations).toEqual([]);
  });

  it('payload / payload.config / payloadSource のどの到達経路でも検出する', () => {
    const sources = [
      "import { getPayload } from 'payload';",
      "import config from '../payload.config';",
      "const m = await import('../lib/content/payloadSource.ts');",
    ];
    for (const source of sources) {
      const violations = findPayloadMigrationGuardViolations([{ path: 'scripts/probe.mts', source }]);
      expect(violations, source).toHaveLength(1);
    }
  });

  it('型だけの import は接続しないので violation にしない', () => {
    const violations = findPayloadMigrationGuardViolations([
      { path: 'scripts/types-only.mts', source: "import type { Payload } from 'payload';" },
    ]);
    expect(violations).toEqual([]);
  });

  it('scripts 配下以外は対象にしない（lib はページ経路で、別の gate が守る）', () => {
    const violations = findPayloadMigrationGuardViolations([
      { path: 'lib/content/payloadSource.ts', source: "import { getPayload } from 'payload';" },
    ]);
    expect(violations).toEqual([]);
  });
});
