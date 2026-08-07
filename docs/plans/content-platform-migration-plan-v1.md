---
status: plan
updated: 2026-07-26
---

# Content Platform Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `data/*.ts` を正本とする現行構成を、URL・ID・表示内容を維持したまま Payload CMS + managed Postgres へ移行する。

**Architecture:** GitHubはコード、Payload schema、migration、validatorを管理する。コンテンツレコードはPostgresを唯一の正本とし、Next.jsはserver-side repository経由、非エンジニアはPayload Admin、CodexはPayload MCP経由で同じデータを扱う。移行期間だけlocal/payloadのread adapterを切り替え、dual writeは行わない。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Payload CMS、Postgres、Vitest、Playwright、Vercel、Vercel BlobまたはS3互換storage

> **Deferred program prerequisite:** CMS / DB移行は未着手。開始前に [`pre-migration-refactor-implementation-index-v1.md`](../archive/pre-migration-refactor-implementation-index-v1.md) のPhase 1〜7を完了する。この前提で品質ツール、local snapshot、validator、view modelは既に存在するため、本計画で同じ基盤を作り直さない。

## Global Constraints

- `id`、`slug`、`previousSlugs`、公開URLを移行都合で変更しない。
- `PublishStatus`、rights、sources、evidence、関連IDの意味を変えない。
- 本番コンテンツをCodexからSQLで直接更新しない。Payload API/MCPを通す。
- 通常のCodex権限はread/create/update-draftに限定し、delete/publish/schema/adminを許可しない。
- local TSとPostgresのdual writeを実装しない。
- Payload切替前に全collectionの件数、ID集合、参照、公開状態、主要フィールドのparityを機械検証する。
- Client Componentへraw collection全件を渡さず、必要なview modelだけを渡す。
- schema変更はmigrationを生成してGitでreviewし、CIで適用確認する。
- ユーザー由来の未コミット差分を変更・復元しない。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `payload.config.ts` | Payload全体設定、DB、editor、collections、plugins |
| `collections/Admins.ts` | 管理画面ユーザーとrole |
| `collections/Manufacturers.ts` | manufacturer schema |
| `collections/Robots.ts` | robot schema |
| `collections/UseCases.ts` | use-case schema |
| `collections/Deployments.ts` | deployment schema |
| `collections/Articles.ts` | article schema |
| `collections/ArticlePlacements.ts` | reports/home掲載枠 |
| `collections/Media.ts` | binary metadata、rights、storage |
| `globals/SiteSettings.ts` | `dataAsOf` などの編集対象サイト設定 |
| `lib/payload/access.ts` | editor/publisher/admin/Codex権限 |
| `lib/payload/mcp.ts` | MCP公開範囲とcapability |
| `lib/content/contracts.ts` | source/repository境界とsnapshot型 |
| `lib/content/localSource.ts` | 移行期間のTS reader |
| `lib/content/payloadSource.ts` | Payload Local API reader |
| `lib/content/getContentRepository.ts` | source選択、cache、repository生成 |
| `lib/content/createContentRepository.ts` | 公開状態、slug、関連解決 |
| `lib/validation/collections/*.ts` | collection単位のdomain validation |
| `lib/validation/crossCollection.ts` | collection横断の参照・公開ゲート |
| `lib/content/cacheTags.ts` | collection単位のcache tag |
| `scripts/import-content-to-payload.mts` | 冪等import |
| `scripts/compare-content-sources.mts` | local/payload parity |
| `scripts/export-content-snapshot.mts` | rollback用export |
| `tests/content/repository.contract.test.ts` | local/payload共通contract |
| `tests/content/import-parity.test.ts` | import後parity |
| `tests/content/publish-gates.test.ts` | domain publish gates |
| `tests/fixtures/contentSnapshot.ts` | parity test用の最小fixture |
| `tests/e2e/public-routes.spec.ts` | 品質ゲート用の公開route smoke test |
| `tests/e2e/content-routes.spec.ts` | 主要URLと表示回帰 |
| `vitest.config.ts` / `eslint.config.mjs` / `playwright.config.ts` | unit、lint、E2E設定 |
| `.github/workflows/ci.yml` | PR/main品質ゲート |

### 変更

| Path | Responsibility |
|---|---|
| `package.json` / lockfile | Payload、DB adapter、test、migration commands |
| `next.config.mjs` | `withPayload`統合 |
| `tsconfig.json` | `@payload-config` alias、生成型 |
| `.env.example` | DB、Payload、content source、storage設定 |
| `.gitignore` | rollback snapshot等の一時artifact除外 |
| `data/types.ts` | runtime domain型とPayload生成型の境界整理 |
| `lib/data.ts` | repository facadeへ縮小 |
| `lib/validate.ts` | 分割validatorのorchestratorへ縮小 |
| `scripts/validate-data.mjs` | local/payload両sourceに対応 |
| `src/app/layout.tsx` | Payload route groupと競合しないfrontend layoutへ整理 |
| `src/app/**/page.tsx` | async repository取得へ変更 |
| `src/app/sitemap.ts` | repository取得へ変更 |
| `components/*Browser.tsx` | raw recordではなくview model propsへ縮小 |
| `docs/decisions/data/README.md` | cutover後の編集入口へ更新 |
| `docs/decisions/data-maintenance-checklist-v1.md` | Admin/MCP前提へ更新 |
| `README.md` | runtime data sourceと運用コマンドを更新 |

---

### Task 1: 移行開始前gateを確認する

**Files:**
- Modify: `docs/plans/content-platform-migration-plan-v1.md`

**Interfaces:**
- Consumes: pre-migration refactorで追加済みの`npm run check`、local snapshot、validator、view model
- Produces: Payload package導入前のclean/green baseline

- [ ] **Step 1: pre-migration programの完了文書を確認する**

```bash
test -f docs/reference/pre-migration-refactor-results-v1.md
rg -n "CMS / DB移行は未実施|Added gates|Remaining work" \
  docs/reference/pre-migration-refactor-results-v1.md
```

Expected: results文書が存在し、local TSが正本、品質ゲート完了、CMS / DBが残作業として記録されている。

- [ ] **Step 2: clean installから全gateを実行する**

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
```

Expected: 全gate exit 0、critical vulnerability 0。残るhighがある場合は`docs/reference/dependency-audit-2026-07-26.md`にpackage、到達可能性、追跡先がある。

- [ ] **Step 3: source境界と既存migration package不在を確認する**

```bash
npm run check:data-boundaries
rg -n "\"(payload|@payloadcms/db-postgres|@payloadcms/next)\"" package.json
rg -n "DATABASE_URL|PAYLOAD_SECRET|CONTENT_SOURCE" .env.example
```

Expected:

- data boundary checkがexit 0
- Payload/Postgres packageは0件
- migration用envは0件

- [ ] **Step 4: working treeとbranchを確認する**

```bash
git status -sb
git branch --show-current
```

Expected: working tree clean、CMS / DB移行専用branch上。pre-migration integrationや`main`へ直接実装しない。

- [ ] **Step 5: Task 1完了を記録してcommit**

```bash
git add docs/plans/content-platform-migration-plan-v1.md
git commit -m "docs: confirm content migration start gates"
```

---

### Task 2: Payloadを現行Next.jsへ組み込む

**Files:**
- Create: `payload.config.ts`
- Create: `collections/Admins.ts`
- Create: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/layout.tsx`
- Create: `src/app/(payload)/admin/importMap.js`
- Create: `tests/e2e/payload-admin.spec.ts`
- Modify: `next.config.mjs`
- Modify: `tsconfig.json`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `DATABASE_URL`、`PAYLOAD_SECRET`
- Produces: `/admin`、`/api`、`payload.config.ts`、Payload Local API

- [ ] **Step 1: admin routeのE2E testを書く**

```ts
import { expect, test } from '@playwright/test';

test('Payload admin login is mounted', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: /welcome|login|create/i })).toBeVisible();
});
```

- [ ] **Step 2: testが404で失敗することを確認する**

Run: `npm run test:e2e -- tests/e2e/payload-admin.spec.ts`

Expected: `/admin` のheadingが見つからずFAIL

- [ ] **Step 3: PayloadとPostgres adapterを追加する**

```bash
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical sharp
```

- [ ] **Step 4: Next.js configをPayloadでwrapする**

```js
import path from 'node:path';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig = {
  cacheComponents: true,
  turbopack: { root: path.resolve('.') },
  images: { formats: ['image/avif', 'image/webp'] },
};

export default withPayload(nextConfig);
```

- [ ] **Step 5: 環境変数契約を追加する**

`.env.example`:

```dotenv
DATABASE_URL=
PAYLOAD_SECRET=
CONTENT_SOURCE=local
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

- [ ] **Step 6: admin collectionとPayload configを追加する**

`collections/Admins.ts`:

```ts
import type { CollectionConfig } from 'payload';

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [{
    name: 'role',
    type: 'select',
    required: true,
    defaultValue: 'editor',
    options: ['editor', 'publisher', 'admin'],
  }],
};
```

`payload.config.ts` は `buildConfig` で `postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })`、`lexicalEditor()`、`Admins`、`secret`、`typescript.outputFile` を設定する。`DATABASE_URL` と `PAYLOAD_SECRET` が欠落した場合は、用途が分かるメッセージで起動を失敗させる。admin page / layout / REST route / import mapはPayloadの既存Next.js統合用viewとhandlerを使い、独自admin shellを作らない。

CIにはPostgreSQL service containerとtest用 `DATABASE_URL` / `PAYLOAD_SECRET` を追加し、ローカルでは専用の開発DBを使う。本番DBをE2Eへ接続しない。

- [ ] **Step 7: admin routeと既存公開routeを確認する**

Run: `npm run test:e2e -- tests/e2e/payload-admin.spec.ts`

Expected: PASS

Run: `npm run build`

Expected: 現行157ページ相当とPayload routesがbuildされ、exit 0

- [ ] **Step 8: commit**

```bash
git add payload.config.ts collections/Admins.ts src/app/'(payload)' tests/e2e/payload-admin.spec.ts next.config.mjs tsconfig.json .env.example package.json package-lock.json .github/workflows/ci.yml
git commit -m "feat: embed Payload CMS in the Next.js app"
```

---

### Task 3: 全collectionと権限を定義する

**Files:**
- Create: `collections/Manufacturers.ts`
- Create: `collections/Robots.ts`
- Create: `collections/UseCases.ts`
- Create: `collections/Deployments.ts`
- Create: `collections/Articles.ts`
- Create: `collections/ArticlePlacements.ts`
- Create: `collections/Media.ts`
- Create: `globals/SiteSettings.ts`
- Create: `lib/payload/access.ts`
- Modify: `payload.config.ts`
- Test: `tests/content/payload-schema.test.ts`

**Interfaces:**
- Consumes: `data/types.ts` の現行field semantics
- Produces: Payload collections、relationship fields、draft/version、role-based access

- [ ] **Step 1: schema contract testを書く**

```ts
import { describe, expect, it } from 'vitest';
import config from '@payload-config';

describe('Payload content schema', () => {
  it('registers every content collection', async () => {
    const resolved = await config;
    expect(resolved.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining([
        'admins',
        'manufacturers',
        'robots',
        'use-cases',
        'deployments',
        'articles',
        'article-placements',
        'media',
      ]),
    );
  });
});
```

- [ ] **Step 2: 未定義collectionによりFAILすることを確認する**

Run: `npm run test -- tests/content/payload-schema.test.ts`

Expected: `manufacturers` などが不足してFAIL

- [ ] **Step 3: collectionを一つずつ追加する**

各collectionは次を共通化する。

```ts
{
  versions: { drafts: true },
  access: {
    read: publishedOrAuthenticated,
    create: canWriteDraft,
    update: canWriteDraft,
    delete: isAdmin,
  },
  fields: [
    { name: 'stableId', type: 'text', required: true, unique: true, index: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'previousSlugs', type: 'text', hasMany: true },
  ],
}
```

参照はPayload relationshipとして定義し、API変換時に既存の `*Id` へ戻す。`stableId` は既存 `id` を保持し、Payload内部IDを公開参照に使わない。

現行 `ArticlePlacement` だけはidを持たないため、import時に `surface:slot:articleId` を決定的な `stableId` として生成する。同じsurface / slot内のorder重複と、同じ記事の重複配置はdomain validatorで拒否する。Mediaは正規化した既存srcを基に決定的なstableIdを生成し、再importで重複させない。

- [ ] **Step 4: publish gateをcollection hookへ接続する**

公開時だけdomain validatorを呼び、draftでは不完全レコードを保存可能にする。

```ts
hooks: {
  beforeChange: [
    ({ data }) => {
      if (data?._status === 'published') validateRobotForPublish(data);
      return data;
    },
  ],
}
```

- [ ] **Step 5: schema testと型生成を実行する**

Run: `npx payload generate:types`

Expected: `payload-types.ts` が生成される

Run: `npm run test -- tests/content/payload-schema.test.ts`

Expected: PASS

- [ ] **Step 6: commit**

```bash
git add collections globals lib/payload payload.config.ts payload-types.ts tests/content/payload-schema.test.ts
git commit -m "feat: define Payload content collections"
```

---

### Task 4: content sourceとrepositoryを分離する

**Files:**
- Create: `lib/content/contracts.ts`
- Create: `lib/content/localSource.ts`
- Create: `lib/content/payloadSource.ts`
- Create: `lib/content/createContentRepository.ts`
- Create: `lib/content/getContentRepository.ts`
- Create: `tests/content/repository.contract.test.ts`
- Modify: `lib/data.ts`

**Interfaces:**
- Consumes: local arraysまたはPayload Local API
- Produces: `getContentRepository(): Promise<ContentRepository>`、query単位のruntime取得、管理処理専用snapshot

- [ ] **Step 1: repository contract testを書く**

```ts
import { describe, expect, it } from 'vitest';
import { createContentRepository } from '@/lib/content/createContentRepository';
import { createLocalContentSource } from '@/lib/content/localSource';

describe('ContentRepository contract', () => {
  it('resolves stable IDs and previous slugs', async () => {
    const repository = createContentRepository(createLocalContentSource());
    const [robot] = await repository.listRobots({ limit: 1 });
    expect((await repository.getRobotById(robot.id))?.id).toBe(robot.id);
    expect((await repository.resolveRobotDetailBySlug(robot.slug)).record?.id)
      .toBe(robot.id);
  });
});
```

- [ ] **Step 2: module未作成によるFAILを確認する**

Run: `npm run test -- tests/content/repository.contract.test.ts`

Expected: `Cannot find module '@/lib/content/createContentRepository'`

- [ ] **Step 3: runtime queryとsnapshot contractを分離する**

```ts
import type {
  Article,
  ArticlePlacement,
  DeploymentSite,
  Manufacturer,
  Robot,
  UseCase,
} from '@/data/types';

export interface ContentSnapshot {
  robots: Robot[];
  manufacturers: Manufacturer[];
  useCases: UseCase[];
  articles: Article[];
  deployments: DeploymentSite[];
  articlePlacements: ArticlePlacement[];
  siteSettings: {
    dataAsOf: string;
  };
}

export interface ContentSource {
  listRobots(query: RobotListQuery): Promise<Robot[]>;
  findRobotById(id: string): Promise<Robot | null>;
  findRobotBySlug(slug: string): Promise<Robot | null>;
  // manufacturers / useCases / articles / deploymentsにも同じ粒度で定義
}

export interface ContentSnapshotSource {
  readSnapshot(): Promise<ContentSnapshot>;
}
```

`ContentSource` は公開runtime用、`ContentSnapshotSource` はimport / export / parity / 横断validation用とする。ページ処理から `readSnapshot()` を呼べない依存方向にする。

- [ ] **Step 4: local sourceを実装する**

`localSource.ts` は現行配列をメモリ上でqueryし、同時に管理処理向け `readSnapshot()` を提供する。`lib/site.ts` の `dataAsOf` もsnapshotへ含める。移行完了後に削除できるよう、local importはこのファイルだけに限定する。

- [ ] **Step 5: pure repositoryを実装する**

`createContentRepository(source)` は現行 `lib/data.ts` のpublished filter、archived detail、slug redirect、ID解決、関連解決を移す。呼び出し側は物理sourceを知らず、一覧queryにはlimit / page / filters / sortを明示する。

- [ ] **Step 6: Payload sourceを実装する**

Payloadの各collectionへ `where`、`limit`、`page`、`sort`、`depth: 0` を明示してqueryする。Payload relationshipとdraft状態はcollection別mapperで現行domain型へ変換し、暗黙の型castだけで済ませない。`limit: 500` の全件取得は `readSnapshot()` を使う管理処理だけに限定する。

- [ ] **Step 7: source選択を実装する**

```ts
export async function getContentRepository() {
  const source =
    process.env.CONTENT_SOURCE === 'payload'
      ? createPayloadContentSource()
      : createLocalContentSource();
  return createContentRepository(source);
}
```

- [ ] **Step 8: contract testを通す**

Run: `npm run test -- tests/content/repository.contract.test.ts`

Expected: local source contractがPASS

- [ ] **Step 9: commit**

```bash
git add lib/content lib/data.ts tests/content/repository.contract.test.ts
git commit -m "refactor: introduce content repository boundary"
```

---

### Task 5: importerとparity検証を作る

**Files:**
- Create: `scripts/import-content-to-payload.mts`
- Create: `scripts/compare-content-sources.mts`
- Create: `scripts/export-content-snapshot.mts`
- Create: `tests/fixtures/contentSnapshot.ts`
- Create: `tests/content/import-parity.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `ContentSnapshot`、Payload Local API
- Produces: 冪等upsert、JSON parity report、rollback snapshot

- [ ] **Step 1: parity testを書く**

```ts
import { describe, expect, it } from 'vitest';
import { compareSnapshots } from '@/scripts/compare-content-sources';
import { contentSnapshotFixture } from '@/tests/fixtures/contentSnapshot';

describe('content source parity', () => {
  it('reports no differences for equivalent snapshots', () => {
    const result = compareSnapshots(
      contentSnapshotFixture,
      structuredClone(contentSnapshotFixture),
    );
    expect(result).toEqual({ missing: [], extra: [], changed: [], brokenReferences: [] });
  });
});
```

- [ ] **Step 2: compare module不足のFAILを確認する**

Run: `npm run test -- tests/content/import-parity.test.ts`

Expected: module not foundでFAIL

- [ ] **Step 3: importerをstableId upsertで実装する**

collectionごとに `stableId` を検索し、存在すればupdate、なければcreateする。relationshipは参照先collectionを先にimportし、stableIdからPayload内部IDへ変換する。`site-settings` はGlobalなので `updateGlobal` を使い、stableId upsertの対象にしない。

mediaは現行レコード内の画像を `src + rights metadata` で正規化・重複排除して先に作る。ローカル画像はobject storageへuploadし、外部画像は権利確認済みのものだけ取得・保存する。取得不能または権利未確定の画像は自動公開せず、parity reportの要確認項目として残す。

Import order:

```text
media
manufacturers
robots
use-cases
deployments
articles
article-placements
site-settings
```

- [ ] **Step 4: parity比較を実装する**

比較対象:

- collectionごとの件数
- stable ID集合
- slug / previousSlugs
- publish status
- relationship ID集合と順序
- sources URL / checkedAt / reliability
- image rights metadata
- robot specs / evidence
- article bodyとplacement

日時、Payload内部ID、version metadataは比較対象から除外する。

- [ ] **Step 5: scriptを追加する**

```json
{
  "scripts": {
    "content:import": "tsx scripts/import-content-to-payload.mts",
    "content:compare": "tsx scripts/compare-content-sources.mts",
    "content:export": "tsx scripts/export-content-snapshot.mts"
  }
}
```

`tsx` はTask 1で明示的なdevDependencyとして追加済みであることを確認する。transitive dependencyには依存しない。

- [ ] **Step 6: 開発DBへimportして再実行する**

Run: `npm run content:import`

Expected: 全collectionがcreatedまたはupdatedとして報告され、exit 0

Run: `npm run content:import`

Expected: 重複を作らず、同じstable ID集合でexit 0

Run: `npm run content:compare`

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`

- [ ] **Step 7: commit**

```bash
git add scripts/import-content-to-payload.mts scripts/compare-content-sources.mts scripts/export-content-snapshot.mts tests/fixtures/contentSnapshot.ts tests/content/import-parity.test.ts package.json package-lock.json
git commit -m "feat: add idempotent content migration tooling"
```

---

### Task 6: ページをrepositoryへ切り替える

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/compare/page.tsx`
- Modify: `src/app/manufacturers/page.tsx`
- Modify: `src/app/manufacturers/[slug]/page.tsx`
- Modify: `src/app/robots/page.tsx`
- Modify: `src/app/robots/[slug]/page.tsx`
- Modify: `src/app/use-cases/page.tsx`
- Modify: `src/app/use-cases/[slug]/page.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/reports/[slug]/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/for-manufacturers/page.tsx`
- Modify: `lib/manufacturerLogoEnrich.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Test: `tests/e2e/content-routes.spec.ts`

**Interfaces:**
- Consumes: `getContentRepository()`
- Produces: local/payload両sourceで同じ公開URLと主要表示

- [ ] **Step 1: 主要route回帰testを書く**

```ts
import { expect, test } from '@playwright/test';

for (const route of [
  '/',
  '/robots',
  '/manufacturers',
  '/use-cases',
  '/reports',
  '/compare',
  '/robots/unitree-g1',
]) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.client);
  });
}
```

- [ ] **Step 2: 各Server Componentでrepositoryをawaitする**

```ts
const repository = await getContentRepository();
const robots = await repository.listRobots({
  status: 'published',
  limit: 100, // 現行全件表示を維持。件数増加時のpaginationは全体roadmap Phase 3で導入
  page: 1,
});
```

`lib/data.ts` のmodule-level array importを削除し、ページから `data/*.ts` を直接importしない。

- [ ] **Step 3: Client Component propsをview modelへ縮小する**

一覧Browserへ渡す値は、ID、slug、表示名、カード情報、filter facetに必要な値へ限定する。記事本文、全sources、詳細spec、未使用relationshipを一覧client propsへ含めない。

- [ ] **Step 4: local sourceで回帰確認する**

Run: `CONTENT_SOURCE=local npm run build`

Expected: exit 0、主要公開pathが生成される

Run: `CONTENT_SOURCE=local npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [ ] **Step 5: payload sourceで同じ回帰確認をする**

Run: `CONTENT_SOURCE=payload npm run build`

Expected: exit 0、local sourceと同じ主要公開pathが生成される

Run: `CONTENT_SOURCE=payload npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [ ] **Step 6: commit**

```bash
git add src/app components lib/data.ts lib/manufacturerLogoEnrich.ts tests/e2e/content-routes.spec.ts
git commit -m "refactor: read public routes through the content repository"
```

---

### Task 7: cache、preview、publish revalidationを接続する

**Files:**
- Create: `lib/content/cacheTags.ts`
- Create: `src/app/api/revalidate-content/route.ts`
- Create: `src/app/api/draft-mode/enable/route.ts`
- Create: `src/app/api/draft-mode/disable/route.ts`
- Modify: `lib/content/payloadSource.ts`
- Modify: `payload.config.ts`
- Test: `tests/content/revalidation.test.ts`

**Interfaces:**
- Consumes: Payload publish hook、signed webhook
- Produces: collection単位cache tags、draft preview、publish後revalidation

- [ ] **Step 1: webhook署名拒否testを書く**

```ts
import { expect, test } from 'vitest';
import { POST } from '@/src/app/api/revalidate-content/route';

test('rejects unsigned revalidation requests', async () => {
  const response = await POST(new Request('http://localhost/api/revalidate-content', {
    method: 'POST',
    body: JSON.stringify({ collection: 'robots' }),
  }));
  expect(response.status).toBe(401);
});
```

- [ ] **Step 2: 署名なしrequestが拒否される実装を追加する**

`REVALIDATION_SECRET` とconstant-time比較し、collection名をallowlist検証した後だけ `revalidateTag` を呼ぶ。

- [ ] **Step 3: cache tagを定義する**

```ts
export const contentTags = {
  robots: 'content:robots',
  manufacturers: 'content:manufacturers',
  useCases: 'content:use-cases',
  deployments: 'content:deployments',
  articles: 'content:articles',
  settings: 'content:settings',
} as const;
```

- [ ] **Step 4: draft previewを通常cacheから分離する**

draft modeではdraftを含め、published modeではpublished/archived policyだけを返す。draft responseを共有cacheへ保存しない。

- [ ] **Step 5: testとbuildを実行する**

Run: `npm run test -- tests/content/revalidation.test.ts`

Expected: unsigned 401、invalid collection 400、valid signed request 200

Run: `npm run build`

Expected: exit 0

- [ ] **Step 6: commit**

```bash
git add lib/content/cacheTags.ts src/app/api payload.config.ts lib/content/payloadSource.ts tests/content/revalidation.test.ts
git commit -m "feat: add content preview and cache revalidation"
```

---

### Task 8: Codex MCPと編集権限を導入する

**Files:**
- Modify: `payload.config.ts`
- Create: `lib/payload/mcp.ts`
- Create: `.codex/content-workflow.md`
- Modify: `ai/rules/20-data.md`
- Modify: `ai/rules/21-data-maintenance-workflow.md`
- Modify: `.env.example`
- Test: `tests/content/mcp-access.test.ts`

**Interfaces:**
- Consumes: Payload MCP plugin、`content-draft-writer`
- Produces: schema-aware read/create/update-draft tools、publish/delete拒否

- [ ] **Step 1: MCP権限testを書く**

```ts
import { describe, expect, it } from 'vitest';
import { resolveMcpCapabilities } from '@/lib/payload/mcp';

describe('Codex MCP permissions', () => {
  it('allows draft writes but denies publish and delete', () => {
    expect(resolveMcpCapabilities('content-draft-writer')).toEqual({
      find: true,
      create: true,
      update: true,
      delete: false,
      publish: false,
    });
  });
});
```

- [ ] **Step 2: 権限resolverとMCP pluginを追加する**

公開collectionだけをMCPへexposeし、`admins`、API key、schema管理を通常profileから除外する。Mediaのbinary uploadは別toolとして明示的に許可したときだけ有効にする。

- [ ] **Step 3: Codex workflowを文書化する**

`.codex/content-workflow.md` に次の順序を固定する。

```text
schema取得
→ 対象と参照先を検索
→ draft作成/更新
→ domain validation
→ diff要約
→ 人間のAdmin review
→ publisherが公開
```

- [ ] **Step 4: MCP access testを実行する**

Run: `npm run test -- tests/content/mcp-access.test.ts`

Expected: draft writerのdelete/publishがfalseでPASS

- [ ] **Step 5: Codexからread-only接続を確認する**

Run: `codex mcp list`

Expected: Payload MCP serverがenabledとして表示される

Codexへ「published robotの件数を取得し、変更はしない」と依頼し、DB件数と一致することを確認する。

- [ ] **Step 6: commit**

```bash
git add payload.config.ts lib/payload/mcp.ts .codex/content-workflow.md ai/rules/20-data.md ai/rules/21-data-maintenance-workflow.md .env.example tests/content/mcp-access.test.ts
git commit -m "feat: add least-privilege Codex content access"
```

---

### Task 9: 本番cutoverと旧TS撤去

**Files:**
- Delete after parity: `data/robots.ts`
- Delete after parity: `data/manufacturers.ts`
- Delete after parity: `data/useCases.ts`
- Delete after parity: `data/deployments.ts`
- Delete after parity: `data/articles.ts`
- Delete after parity: `data/articlePlacements.ts`
- Delete after cutover: `lib/content/localSource.ts`
- Modify: `lib/content/getContentRepository.ts`
- Modify: `scripts/validate-data.mjs`
- Modify: `README.md`
- Modify: `docs/decisions/data/README.md`
- Modify: `docs/decisions/data-maintenance-checklist-v1.md`
- Modify: `docs/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: parity 0差分、Payload production DB、export snapshot
- Produces: Payload-only content runtime

- [ ] **Step 1: 変更凍結とrollback windowを宣言する**

本番import開始から24時間はコンテンツ更新を凍結する。cutover後24時間はlocal sourceを残し、障害時に環境変数だけで戻せるrollback windowとする。この間にPostgresだけで新規公開を行わない。

- [ ] **Step 2: cutover直前exportを保存する**

Run: `npm run content:export`

Expected: 日時付きJSON artifactが生成され、collection件数とsha256が表示される

snapshotは `artifacts/content-snapshots/` に出力し、機密情報を含めず、`.gitignore` で除外する。暗号化した運用保管先へコピーし、ローカル一時ファイルを唯一のbackupにしない。

- [ ] **Step 3: production importとparityを実行する**

Run: `npm run content:import`

Expected: import exit 0

Run: `npm run content:compare`

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`

- [ ] **Step 4: Vercel PreviewでPayload sourceを有効にする**

Set: `CONTENT_SOURCE=payload`

Run: `npm run check`

Expected: 全品質ゲートexit 0

Run: `npm run test:e2e -- tests/e2e/content-routes.spec.ts`

Expected: 全route PASS

- [ ] **Step 5: 主要画面を目視確認する**

対象:

- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/use-cases`
- `/reports`
- `/compare`
- `/admin`

desktop 1440pxとmobile 390pxで、公開内容、画像、関連リンク、slug redirect、横幅を確認する。

- [ ] **Step 6: productionをPayload sourceへ切り替える**

Vercel production環境へ `CONTENT_SOURCE=payload` を設定してdeployする。公開後に主要route、sitemap、robots、OG imageを確認する。

- [ ] **Step 7: rollback window終了後にlocal sourceを削除する**

24時間の安定化、監視、主要route確認が完了してから、旧TS配列、local adapter、local/payload切替分岐を削除する。`CONTENT_SOURCE` は廃止し、Payload sourceを唯一の実装にする。

- [ ] **Step 8: 最終検証を実行する**

Run: `npm run check`

Expected: exit 0

Run: `npm audit --omit=dev`

Expected: critical 0。残存highは個別にissue化し、根拠なく無視しない

Run: `git diff --check`

Expected: outputなし、exit 0

- [ ] **Step 9: commit**

```bash
git add -A
git commit -m "refactor: make Payload the content source of truth"
```

---

## Rollback

cutover後に公開障害が起きた場合は、コードを巻き戻さず、24時間のrollback window内だけVercel環境変数を `CONTENT_SOURCE=local` に戻してredeployする。この期間は公開コンテンツを凍結するため、local / Postgres間に新しいpublished差分を作らない。Postgresのdraftは保持するが、local TSへ逆同期しない。

旧TS削除後のrollbackは、cutover直前exportを新しいPostgres環境へimportし、同じmigration versionのアプリをdeployする。SQL手修正で復旧しない。

---

## Completion Criteria

- Payload Adminから全collectionを編集できる
- Codex MCPがschemaを読み、draftを作成・更新できる
- Codex通常権限でdelete/publish/schema/adminが拒否される
- Postgresがコンテンツ唯一の正本である
- Gitにcontent recordの二重正本がない
- 全stable ID、slug、previousSlugs、relationship、公開状態が維持される
- `npm run check` がexit 0
- 主要routeのdesktop/mobile E2Eが通る
- publish後のcache revalidationが動作する
- export/importによる復旧手順を実行できる
