---
status: plan
updated: 2026-08-08
---

# Content Platform Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `data/*.ts` を正本とする現行構成を、URL・ID・表示内容を維持したまま Payload CMS + managed Postgres へ移行する。

**Architecture:** GitHubはコード、Payload schema、migration、validatorを管理する。コンテンツレコードはPostgresを唯一の正本とし、Next.jsはserver-side repository経由、非エンジニアはPayload Admin、CodexはPayload MCP経由で同じデータを扱う。移行期間だけlocal/payloadのread adapterを切り替え、dual writeは行わない。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Payload CMS、Postgres、Vitest、Playwright、Vercel、Vercel BlobまたはS3互換storage

> **Deferred program prerequisite:** Phase 1〜7 は完了済み（2026-08-04）。品質ツール、local snapshot、validator、view model は既に存在するため、本計画で同じ基盤を作り直さない。**どれが既存でどれが新規かは「2026-08-08 突合結果」§A・§B が正本。File Structure の表より優先する。**

## 2026-08-08 突合結果（着手前に必ず読む）

本計画は 2026-07-26 付で、pre-migration refactor の Phase 3・5・6 が作った層を反映していない。
**着手前に実装と突き合わせた結果を以下に記録する。File Structure の表より本節が優先する。**

### A. 「新規作成」に挙がっているが既に存在するもの（4件）

| Path | 実態 |
|---|---|
| `lib/validation/crossCollection.ts` | Phase 3 が作成済み。`buildReferenceIndex` を持つ |
| `vitest.config.ts` | Phase 1 で導入済み |
| `playwright.config.ts` | Phase 1 で導入済み |
| `tests/e2e/public-routes.spec.ts` | Phase 6 で作成済み |

### B. 同じ役割の層が別の場所に既にあるもの（重複して作らない）

| 計画の記載 | 実装の現状 | 判断 |
|---|---|---|
| `lib/content/contracts.ts`（source/repository境界とsnapshot型） | **`lib/data/contentSnapshot.ts`** が `ContentSnapshot` 型を提供済み | 型は既存を import する。**repository 契約は `lib/content/` に新設する**（既存は型だけで境界を持たない） |
| `lib/content/localSource.ts`（移行期間のTS reader） | **`lib/data/localContentSnapshot.ts`** が全collectionを結合済み | **既存を source として再利用しつつ、`lib/content/` に repository / query 境界を新設する。** 既存は配列 snapshot だけで query・slug解決・pagination を持たないため、Task 4 で `lib/content/` を作るのは重複ではない |
| `lib/validation/collections/*.ts`（collection単位のdomain validation） | **`lib/validation/*.ts`** に9本（`robots` / `manufacturers` / `useCases` / `articles` / `deployments` / `common` / `registry` / `types` / `validateContentSnapshot`）が既存 | 既存の平置きを使う。`collections/` サブディレクトリを作らない |
| `lib/validation/crossCollection.ts`（collection横断） | 同名で既存 | 既存を拡張する |

`lib/validate.ts` は「互換facade」で、規則の本体は `lib/validation/*.ts` にある（`lib/validate.ts:1-4` のコメント）。
移行では facade の中身を差し替えるだけでよく、検証ロジックを書き直さない。

### C. ファイル名の誤り

| 計画の記載 | 実際 |
|---|---|
| `next.config.mjs` | **`next.config.ts`** |

### D. 計画が知らないコレクション（2件・2026-08-08 決定）

`docs/decisions/data-architecture-redesign-v1.md` §4-1 / §11 で2つのコレクションを新設すると決めた。
**Task 3（全collectionと権限を定義する）にこの2つを含める。**

| コレクション | 内容 | 出典 |
|---|---|---|
| `robotSeries` | 製品ファミリ。スペック・価格を持たない。`Robot.seriesId?` で結ぶ | `robot-data-import-plan-v1.md` DEC-S08 |
| `distributors` | 国内の提供事業者。メーカーと多対多 | `data-architecture-redesign-v1.md` §4-1 |

あわせて `Robot` から `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` /
`comparison` を落とす（DEC-S05・S06）。**`collections/Robots.ts` を書くときに現行 `data/types.ts` を
そのまま写さない。**

### E. 前提条件の再確認（2026-08-08 実測）

| Task 1 の確認項目 | 実測 |
|---|---|
| Payload / Postgres package | **0件**（未導入。計画どおり） |
| `DATABASE_URL` / `PAYLOAD_SECRET` / `CONTENT_SOURCE` | `.env.example` に**0件**（計画どおり） |
| `npm run check:data-boundaries` | exit 0 |
| pre-migration refactor の完了文書 | `docs/reference/pre-migration-refactor-results-v1.md` 存在 |
| Vercel プロジェクト | 接続済み（`.vercel/project.json`）。`vercel.json` は無く既定設定＝`main` が本番、他ブランチは Preview |

### F. 制約の緩和（2026-08-08、人間の判断）

Global Constraints のうち次の2つは**適用しない**。

- 「`id`、`slug`、`previousSlugs`、公開URLを移行都合で変更しない」 →
  **公開URLの維持は不要**。ただし `id` は他collectionからの参照に使うため引き続き不変とする
- 無停止での cutover → **1週間程度の停止は許容**

この2つは parity 検証と cutover のコストを大きく押し上げる制約だった。外れたことで
Task 5（parity）と Task 9（cutover）の要件を見直す余地がある。**見直しは Task 5 / 9 の
着手時に行い、本節では判断しない。**

---

## 2026-08-08 外部監査の指摘（**反映済み**）

突合結果（上記）に続き、外部監査で見つかった項目。**すべて本文へ反映済み。**
以下は「何をどう直したか」の記録であり、未解決リストではない。

### M-1. Task 3 が10コレクションを作らない（Critical）

`### Task 3` の Files と schema test は**7コレクション**しか列挙していない。突合結果 §D が
`RobotSeries` と `Distributors` の追加を指示しているが、**本文に反映されていない**。
test・snapshot・repository・import order・cache tag のいずれにも無い。

`docs/plans/robot-data-import-plan-v1.md` の §0 G-2 は10コレクションを要求するため、
**このままでは②が永久に着手できない。**

### M-2. 削除4フィールドの実行主体がいない（Critical）

②の DEC-S05・S06 は `Robot` から `buyerReadiness` / `marketAvailability` / `safetyNote` /
`vendorRiskNote` を落とすとするが、**①のどの Task も実行しない**。Task 3 は現行 `data/types.ts` の
semantics を写す設計なので、**削除予定のフィールドを Payload schema へ再導入してしまう。**

`buyerReadiness` は `lib/catalog/search.ts` で使用中。Payload schema だけでなく domain 型・
mapper・search・labels・visual semantics・tests・manifest scripts まで一緒に移す必要がある。

**`comparison` は削除しない。** `components/ComparisonRobotPanel.tsx` が12箇所で実表示している。

### M-3. Postgres migration の Task が無い（High）

Global Constraints は「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」と
要求しているが、本文に `payload migrate:create` / `migrations/` / `migrate:status` /
production適用 / down検証が**一度も現れない**。Postgres では collection / field 追加ごとに
migration が要る。

**schema Task ごとに migration 生成と review を含め、空DBへの up・既存schemaへの up・
down または復旧を検証する Task を追加する。**

### M-4. ①と②で script 名が食い違う（High）

| ①が定義 | ②が呼ぶ |
|---|---|
| `content:compare` | ~~`compare:content-sources`~~ → ②側を修正済み |
| `content:export` | ~~`export:content-snapshot`~~ → ②側を修正済み |

②は修正済み。**①側は cutover 後に local TS と local adapter を削除するため、
`content:compare` の「local vs payload」比較自体が実行不能になる。**②の G-3 は
「署名付き cutover baseline snapshot 対 Payload」の比較へ変える必要がある。

### M-5. Task 2 の next config 例が security headers を消す（High）

現行 `next.config.ts:18-22` は全 route に security headers を設定している。Task 2 の置換例には
`headers()` が**無い**ため、そのまま実装すると削除される。`tests/unit/security-headers.test.ts` が
落ちる。

**現行 config を保持したまま `export default withPayload(nextConfig)` だけを加える。**

なお `next.config.mjs` という記載は誤りで、実際は `next.config.ts`（突合結果 §C）。
Task 2 の Files と commit command は修正済み（§C・Task 2 Step 4・Step 8 の git add）。

### M-6. `tsx` が devDependency に無い（Medium）

Task 5 は「`tsx` は Task 1 で明示的な devDependency として追加済み」とするが、**Task 1 に
install step は無く、`package.json` にも無い**（lockfile に transitive としてのみ存在）。

Task 2 か 5 で `npm install -D tsx` するか、現行 scripts に合わせて Node の
`--experimental-strip-types` へ統一する。

### M-7. object storage・secret・DB分離の provisioning が未計画（High）

Task 5 は画像を object storage へ upload するとするが、provider・storage adapter・bucket・
credentials・CORS・バックアップ・失敗時処理が無い。`REVALIDATION_SECRET` も Task 7 で使うのに
`.env.example` の更新対象に入っていない。Preview / Production の DB を別々に作る Task も無く、
②の G-6 へ丸投げされている。

**Task 2 の前に provider 確定・資源表・secret ownership を作る。**

### M-8. MCP の `publish: false` は権限制御になっていない（High）

Task 8 は独自 resolver に `publish: false` を期待するが、Payload MCP の標準 capability は
find / create / update / delete で、独立した publish capability は無い。`update: true` のまま
`_status: published` を拒否しなければ公開できてしまう。

**collection access / hook で draft → published transition を拒否する統合testを作る。**

---

## Global Constraints

- **`id` は移行都合で変更しない**（他collectionからの参照に使うため）。**公開URL（`slug`）の
  維持は不要**（2026-08-08 の人間判断、§F）。`previousSlugs` による301保護は
  URL変更時の従来ルールとして残すが、本移行のために `slug` を維持する義務は無い。
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
| `next.config.ts` | `withPayload`統合 |
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

### Task 0: 資源を確定して払い出す（人間の作業を含む）

**Files:**
- Create: `docs/reference/content-platform-resources-v1.md`（資源表）
- Modify: `.env.example`

**Interfaces:**
- Produces: Postgres / object storage の provider 確定、環境別の接続情報、secret の管理者

`content-platform-and-database-architecture-v2.md` §11 が「実装開始時に確定する」とした
未確定5件を、ここで閉じる。**Task 2 の前に終わらせる。**

- [ ] **Step 1: provider を確定する**

| 項目 | 初期値 | 決めること |
|---|---|---|
| Postgres | Supabase | プラン、リージョン、接続プーリング方式 |
| object storage | Vercel Blob | Payload storage adapter、bucket、CORS |
| Payload の置き場 | 現行 Vercel へ同居 | Payload Cloud を使わない判断の確認 |

- [ ] **Step 2: 環境ごとにDBを分ける（②の G-6 の前提）**

**Git はブランチで分かれるが DB は分かれない。** Preview の編集が本番に出る事故を防ぐ。

| 環境 | DB | 用途 |
|---|---|---|
| local | ローカル or 開発用 Supabase | 開発 |
| CI | 使い捨て（毎回作り直す） | migration の空DB適用検証（Task 3.5 Step 2） |
| Preview | 検証用 | ブランチデプロイ |
| Production | 本番 | |

- [ ] **Step 3: 環境変数を洗い出して `.env.example` へ書く**

```dotenv
DATABASE_URL=
PAYLOAD_SECRET=
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
CONTENT_SOURCE=local
REVALIDATION_SECRET=
BLOB_READ_WRITE_TOKEN=
```

**`REVALIDATION_SECRET` は Task 7 が使うのに、これまで `.env.example` の更新対象に
入っていなかった。** `BLOB_READ_WRITE_TOKEN` も Task 5 の画像 upload に要る。
**実値はここに書かない。** Vercel の Environment Variables で設定する。

- [ ] **Step 4: 接続を確認し、環境ごとの fingerprint を記録する**

**`current_database()` 単体では分離を証明できない。** 別 provider の別プロジェクトでも
標準DB名（`postgres` 等）が一致することがあり、逆に同じ server 上の別DB名だけでは
意図した managed resource かを保証できない。**host・project参照・database名・schema・
環境marker を組み合わせて fingerprint にする。**

```bash
psql "$DATABASE_URL" -c "
  select
    current_database() as db,
    current_user as usr,
    current_setting('server_version') as pg_version,
    inet_server_addr() as host_addr,
    current_setting('cluster_name', true) as cluster_name;
"
```

上記の出力と、provider 管理画面が示す project ref / project ID を合わせて
`docs/reference/content-platform-resources-v1.md` へ環境ごとに記録する。

Expected: Preview と Production で **host_addr または project ref のどちらかが必ず異なる**。
`current_database()` だけが違い、他がすべて同じ場合は誤検知の可能性があるため再確認する。

- [ ] **Step 5: 資源表を書いてcommit**

provider・環境別の接続先・secret の管理者・バックアップ方針・復旧手順の入口を1枚にまとめる。

**完了条件:** 5つの未確定事項が閉じ、環境ごとにDBが分かれていることをコマンドで確認済み。

---

### Task 0.5: 上位正本を新schemaへ先行更新する

**Files:**
- Modify: `docs/decisions/content-platform-and-database-architecture-v2.md`（§5.1 に `robotSeries` / `distributors`）
- Modify: `docs/decisions/data-maintenance-checklist-v1.md`（§F から `buyerReadiness`、`candidateRobots` に `seriesId`）
- Modify: `ai/rules/21-data-maintenance-workflow.md`（対象collection、編集先）

**②は「上位正本を計画より優先する」と書いている。** その正本が旧schemaのままだと、
Task 3 の実装時点で正本と計画が衝突する。**schema を書く前に正本を直す。**

| 文書 | 現状 | 直す内容 |
|---|---|---|
| `content-platform-and-database-architecture-v2.md` §5.1 | CMS管理対象に `robotSeries` / `distributors` が無い | 2件を追加 |
| `data-maintenance-checklist-v1.md` §F | Robot の公開ゲートが `buyerReadiness` を要求。`candidateRobots` を `robotId` のみに限定 | `buyerReadiness` を外し、`seriesId` を許す |
| `ai/rules/21-data-maintenance-workflow.md` | 対象collectionが6種類、編集先が `data/*.ts` | 10種類へ。編集先は cutover 後に Payload |

**cutover 後（Task 9）に回さない。** 回すと Task 3〜8 の間ずっと矛盾したまま作業することになる。

- [ ] **Step 1: 3文書を更新して `updated` を上げる**
- [ ] **Step 2: `npm run check:docs` が緑であることを確認**
- [ ] **Step 3: commit**

**完了条件:** 3文書が新schemaを反映し、②の「正本を計画より優先する」が成立する。

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
- Modify: `next.config.ts`
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

- [ ] **Step 3: Payload・Postgres adapter・`tsx` を追加する**

`tsx` は Task 5 の import / compare / export script が使う。**transitive dependency に依存しない。**

```bash
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical sharp
npm install -D tsx
```

```bash
npm ls tsx --depth=0
```
Expected: `devDependencies` に解決される。

- [ ] **Step 4: Next.js configをPayloadでwrapする**

**現行 `next.config.ts` を置き換えない。`withPayload()` で包むだけにする。**

現行の `next.config.ts:18-25` は全 route へ security headers を設定している。
置換すると消え、`tests/unit/security-headers.test.ts` が落ちる。

```ts
// next.config.ts — 既存の import と nextConfig 本体はそのまま残す
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig = {
  cacheComponents: true,
  turbopack: { root: path.resolve('.') },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: [...securityHeaders] }];   // ← 消さない
  },
};

export default withPayload(nextConfig);   // ← 変更はこの1行だけ
```

**ファイル名は `next.config.ts`。** `next.config.mjs` ではない（突合結果 §C）。

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
git add payload.config.ts collections/Admins.ts src/app/'(payload)' tests/e2e/payload-admin.spec.ts next.config.ts tsconfig.json .env.example package.json package-lock.json .github/workflows/ci.yml
git commit -m "feat: embed Payload CMS in the Next.js app"
```

---

### Task 3: 全collectionと権限を定義する

**Files:**
- Create: `collections/Manufacturers.ts`
- Create: `collections/Robots.ts`
- Create: `collections/RobotSeries.ts`
- Create: `collections/Distributors.ts`
- Create: `collections/UseCases.ts`
- Create: `collections/Deployments.ts`
- Create: `collections/Articles.ts`
- Create: `collections/ArticlePlacements.ts`
- Create: `collections/Media.ts`
- Create: `globals/SiteSettings.ts`
- Create: `lib/payload/access.ts`
- Modify: `payload.config.ts`
- Modify: `data/types.ts`（削除4フィールド、`RobotSeries` / `Distributor` 型、`Robot.seriesId`、`UseCaseCandidateRobot.seriesId`）
- Modify: `lib/catalog/search.ts`（`buyerReadinessLabels[robot.buyerReadiness]` の除去）
- Modify: `lib/labels.ts` / `lib/visualSemantics.ts`（`marketAvailabilityLabels` / 未使用 tone の除去）
- Modify: `scripts/build-data-r01-manifest.mjs` / `scripts/build-data-r02-manifest.mjs`
- Modify: `tests/unit/view-models/robots.test.ts`
- Test: `tests/content/payload-schema.test.ts`

**Interfaces:**
- Consumes: `data/types.ts` の現行field semantics（**ただし §D の削除4フィールドは写さない**）
- Produces: Payload collections 10本、relationship fields、draft/version、role-based access

**`data/types.ts` をそのまま写さない。** 現行型には削除が決まっているフィールドが含まれる。
写すと Payload schema へ再導入され、②の §0 G-4 が永久に通らなくなる。

**このTaskが `Robot` から削除する4フィールド**（`robot-data-import-plan-v1.md` DEC-S05・S06）:

| フィールド | 現状 | 削除にあたって一緒に消すもの |
|---|---|---|
| `buyerReadiness` | 型に `@deprecated`。**`lib/catalog/search.ts:51` が実行時に使用中** | `lib/catalog/search.ts` の連結。型 `BuyerReadiness` は `UseCase` が使うので残す |
| `marketAvailability` | 参照0。`robot.marketAvailability` を読むコードが存在しない | 型 `MarketAvailability`、`lib/labels.ts` の `marketAvailabilityLabels`、`lib/visualSemantics.ts` の tone、両 manifest script |
| `safetyNote` | 0/63件 | `tests/unit/view-models/robots.test.ts` の参照 |
| `vendorRiskNote` | 1/63件。**`Manufacturer.vendorRiskNote` は 25/26 で残す** | 同上 |

**`comparison` は削除しない。** 型に `@deprecated` が付くが `components/ComparisonRobotPanel.tsx`
が `robot.comparison.*` を12箇所で実表示している。削除するなら `/compare` の作り替えが要るため
別計画。`collections/Robots.ts` には含める。

`RobotSeries` と `Distributors` の設計は `docs/decisions/data-architecture-redesign-v1.md`
§4-1 / §11 が正本。**`RobotSeries` はスペックも価格も持たない**（`deploymentStage` と `specs` に
答えが存在しないため）。

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
        'distributors',
        'robot-series',
        'robots',
        'use-cases',
        'deployments',
        'articles',
        'article-placements',
        'media',
      ]),
    );
  });

  // ②の §0 G-4 が要求する。data/types.ts を写すと再導入されるため機械で止める。
  it('does not carry the removed Robot fields', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const names = robots.fields.flatMap((field) => ('name' in field ? [field.name] : []));

    for (const removed of ['buyerReadiness', 'marketAvailability', 'safetyNote', 'vendorRiskNote']) {
      expect(names).not.toContain(removed);
    }
    // comparison は /compare が使用中のため残す
    expect(names).toContain('comparison');
  });

  it('links robots to their series', async () => {
    const resolved = await config;
    const robots = resolved.collections.find((collection) => collection.slug === 'robots')!;
    const seriesId = robots.fields.find((field) => 'name' in field && field.name === 'seriesId');

    expect(seriesId).toBeDefined();
    expect(seriesId).toMatchObject({ type: 'relationship', relationTo: 'robot-series', required: false });
  });
});
```

- [ ] **Step 2: 未定義collectionによりFAILすることを確認する**

Run: `npm run test -- tests/content/payload-schema.test.ts`

Expected: `manufacturers` / `robot-series` / `distributors` が不足してFAIL

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

### Task 3.5: Postgres migration を生成・適用・検証する

**Files:**
- Create: `migrations/*.ts`（Payload が生成）
- Modify: `package.json`（`payload:migrate` / `payload:migrate:status` / `payload:migrate:create`）
- Modify: `.github/workflows/ci.yml`
- Test: `tests/content/migration.test.ts`

**Interfaces:**
- Consumes: Task 3 の collections 10本
- Produces: Git で review 可能な migration ファイルと、CI での適用確認

**Global Constraints が「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」と
要求しているのに、Task 3 までにその手順が無かった。** Postgres では collection / field の追加ごとに
migration が要る（`https://payloadcms.com/docs/database/migrations`）。

- [ ] **Step 1: migration script を package.json へ追加する**

```json
{
  "payload:migrate": "payload migrate",
  "payload:migrate:create": "payload migrate:create",
  "payload:migrate:status": "payload migrate:status"
}
```

- [ ] **Step 2: 空DBへ適用できることを確認する**

新しい空のデータベースを作り、そこへ流す。

```bash
npm run payload:migrate:create -- initial-schema
npm run payload:migrate
npm run payload:migrate:status
```
Expected: 10 collection ぶんのテーブルが作られ、status がすべて適用済みになる。

- [ ] **Step 3: 既存schemaを持つDBへ適用できることを確認する**

Step 2 のDBに対して、Task 3 で1フィールド足してから再生成・再適用する。

Expected: 差分だけの migration が生成され、既存データが消えない。

- [ ] **Step 4: 巻き戻せることを確認する**

導入する Payload バージョンの migration down コマンドを公式ドキュメントで確認してから使う
（バージョンによって呼び出し方が変わりうるため、ここではコマンド名を固定しない）。
Step 2 で作った空DBに対して、直前の migration を取り消せることを確認する。

Expected: 直前の migration が取り消され、そのテーブル・カラムが消える。**down が動かない場合は、
`content:export` からの復元手順を Task 5 で確立するまで先へ進まない。**

- [ ] **Step 5: schema drift を検出する負テストを書く**

**`payload:migrate:status` は「生成済みmigrationファイルの適用状態」しか見ない。**
「`collections/Robots.ts` にフィールドを足したのに migration を生成し忘れた」という
drift は検出できない。**`migrate:create` を実行して新しいファイルが生成されるかどうかで
判定する** — 生成されれば drift がある。

```bash
npm run payload:migrate:create -- __drift-check 2>&1 | tee /tmp/drift.log
if ls migrations/*__drift-check* 2>/dev/null; then
  echo "schema drift: collections の変更に対応する migration が無い"
  rm migrations/*__drift-check*
  exit 1
fi
```

- [ ] **Step 6: CI へ組み込む**

`.github/workflows/ci.yml` に Step 5 の drift check と `payload:migrate:status` の両方を追加する。
drift check は「migration ファイルの生成漏れ」を、`migrate:status` は「生成したが適用し忘れた
migration」を検出する。**両方無いと片方の不備を見逃す。**

- [ ] **Step 7: ゲートが赤くなることを確認する（Global Constraints）**

`collections/Robots.ts` にフィールドを1つ足し、migration を生成せずに CI を回す。
Expected: Step 5 の drift check が **exit 1**。確認できたらフィールドを戻す。

- [ ] **Step 8: production 適用の手順を書く**

deploy pipeline で `npm run payload:migrate` を build の前段に置く。失敗したら deploy を止める。
migration はスキーマ変更であり、アプリコードより先に適用されている必要がある。

- [ ] **Step 9: commit**

```bash
git add migrations package.json .github/workflows/ci.yml tests/content/migration.test.ts
git commit -m "feat(db): Postgres migration の生成・適用・検証を追加"
```

**完了条件:** 空DB / 既存DB の両方へ適用でき、未適用 migration を CI が検出する。
意図的な未生成で赤くなることを確認済み。

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

**10コレクション全部に対して同じ粒度で定義する。** `robots` / `manufacturers` だけでなく
`robotSeries` / `distributors` / `useCases` / `deployments` / `articles` /
`articlePlacements` / `media` / `admins` の repository メソッドも同時に作る。
`robotSeries` は `listRobotSeries` / `getRobotSeriesById` / `resolveRobotSeriesBySlug`
（`robots` と `robotSeries` を横断した slug 解決が要る。②の Task 4 が
`/robots/[slug]` を両方で描き分けるため）。

- [ ] **Step 6: Payload sourceを実装する**

Payloadの各collectionへ `where`、`limit`、`page`、`sort`、`depth: 0` を明示してqueryする。Payload relationshipとdraft状態はcollection別mapperで現行domain型へ変換し、暗黙の型castだけで済ませない。`limit: 500` の全件取得は `readSnapshot()` を使う管理処理だけに限定する。

**10コレクションの契約表を1つにまとめ、空欄を残さない。**

| コレクション | Payload collection | domain型 | repository | snapshot | parity | cache tag |
|---|---|---|---|---|---|---|
| `manufacturers` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `robots` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `robotSeries` | ✓ Task 3（②DEC-S08） | ②が定義 | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `distributors` | ✓ Task 3（架構v2 §4-1） | ②未定義。①側で最小型を用意 | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `useCases` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `deployments` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `articles` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `articlePlacements` | ✓ Task 3 | ✓ | Step 5-6 | ✓ | Task 5 | Task 7 |
| `media` | ✓ Task 3 | 新規（rights meta含む） | **Step 5-6** | **本Stepで追加** | **Task 5で追加** | **Task 7で追加** |
| `admins` | ✓ Task 2 | 認証専用 | 対象外（編集APIを持たない） | 対象外 | 対象外 | 対象外 |

**`admins` は10コレクション全部を編集可能というAIルールの対象に機械的に含めない。**
認証用collectionであり、`ai/rules/20-data.md` / `21-data-maintenance-workflow.md`
（Task 0.5 で更新）の対象は9コレクション（`admins` を除く）と明記する。

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

`tsx` は **Task 2 Step 3 で devDependency として追加する**（Task 1 に install step は無く、
現 `package.json` にも無い。lockfile に transitive として存在するだけなので依存しない）。

```bash
npm ls tsx --depth=0
```
Expected: `devDependencies` に解決される。transitive のみなら Task 2 へ戻る。

- [ ] **Step 6: 開発DBへimportして再実行する**

Run: `npm run content:import`

Expected: 全collectionがcreatedまたはupdatedとして報告され、exit 0

Run: `npm run content:import`

Expected: 重複を作らず、同じstable ID集合でexit 0

Run: `npm run content:compare`

Expected: `missing=0 extra=0 changed=0 brokenReferences=0`

- [ ] **Step 7: cutover baseline snapshot を固定する**

**`content:compare` は Task 9 で local TS を撤去したあと実行できなくなる。**
「local vs payload」の比較なので、比較元が消えるため。

**Git へは commit しない。** `content-platform-and-database-architecture-v2.md` §2.1
「単一の正本」が「Gitへ同じレコードを二重保存しない」としており、全content recordを含む
snapshot を `docs/reference/` へ commit するとこれに反する。加えて `shasum` は改ざん検知の
チェックサムであって、真正性を証明する署名ではない（同じ場所でJSONとhashを両方書き換えられる）。

Task 9 の直前に `content:export` で snapshot を取り、**object storage（Task 0 で確定した
provider）の immutable / write-once な領域へ置く**。Git には次の3つだけを commit する。

```bash
npm run content:export -- --upload  # object storage へ upload、URLを返す
```

```
docs/reference/cutover-baseline-manifest.json
{
  "artifactUrl": "<object storage の URL>",
  "sha256": "<content:export が計算したhash>",
  "recordCounts": { "robots": 63, "manufacturers": 26, "useCases": 44, "articles": 34, "deployments": 11 },
  "exportedAt": "<ISO日時>",
  "exportedBy": "<実行した人 or CI run>"
}
```

**真正性が要る場合は GPG または cosign で artifact に署名し、manifest に署名の検証手順を書く。**
checksum だけでは「取得時に改ざんされていない」ことしか示せず、「artifact 自体が正規の
export である」ことは示さない。

**この manifest が `robot-data-import-plan-v1.md` の §0 G-3 の比較対象になる。**
②側は「local vs payload」ではなく「manifest の artifact vs payload」を検証する。

- [ ] **Step 8: commit**

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
  robotSeries: 'content:robot-series',
  distributors: 'content:distributors',
  manufacturers: 'content:manufacturers',
  useCases: 'content:use-cases',
  deployments: 'content:deployments',
  articles: 'content:articles',
  articlePlacements: 'content:article-placements',
  media: 'content:media',
  settings: 'content:settings',
} as const;
```

**10コレクション全部にタグを持たせる。** Task 4 の契約表（`robotSeries` / `distributors` /
`media` を含む）と同じ集合にする。抜けがあると、そのコレクションだけ publish 後に
古い値が残り続ける。

**`revalidateTag` は第2引数を明示する。** Next.js 16 で単一引数形式は deprecated。

```ts
revalidateTag(contentTags.robots, 'max');
```

- [ ] **Step 4: draft previewを通常cacheから分離する**

draft modeではdraftを含め、published modeではpublished/archived policyだけを返す。draft responseを共有cacheへ保存しない。

- [ ] **Step 5: 更新前後の値を統合テストで確認する**

HTTP status だけでは「revalidate が呼ばれたこと」しか分からず、「表示が実際に新しい値へ
変わったこと」は確認できない。

```ts
test('publish後に古い値ではなく新しい値が返る', async () => {
  const before = await repository.getRobotById(id);
  await payload.update({ collection: 'robots', id, data: { name: 'X' } });
  await fetch('/api/revalidate-content', { method: 'POST', headers: signed, body: JSON.stringify({ collection: 'robots' }) });
  const after = await repository.getRobotById(id);
  expect(after?.name).not.toBe(before?.name);
  expect(after?.name).toBe('X');
});
```

- [ ] **Step 6: testとbuildを実行する**

Run: `npm run test -- tests/content/revalidation.test.ts`

Expected: unsigned 401、invalid collection 400、valid signed request 200、publish前後で値が変わる

Run: `npm run build`

Expected: exit 0

- [ ] **Step 7: commit**

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

**Payload MCP に独立した publish capability は無い。** 標準は find / create / update / delete で、
`update: true` のまま `_status: 'published'` を書ければ公開できてしまう
（`https://payloadcms.com/docs/plugins/mcp`）。**resolver に `publish: false` を期待する設計は
権限制御になっていない。**

collection の access / hook で **draft → published の遷移そのものを拒否する**。

- [ ] **Step 1: MCP権限testを書く**

`resolveMcpCapabilities()` のような自前 resolver を作って `publish: false` を assert する
テストは**権限制御の証明にならない**。Payload MCP に独立した publish capability は無く、
標準は find / create / update / delete で、`update: true` のまま
`_status: 'published'` を書ければ実際には公開できてしまう
（`https://payloadcms.com/docs/plugins/mcp`）。**collection の `access.update` フックで
`_status` の書き換えそのものを拒否し、それを実際の Payload Local API へ投げて確認する。**

```ts
import { describe, expect, it, beforeAll } from 'vitest';
import { getPayload } from 'payload';
import config from '@payload-config';

describe('content-draft-writer の実権限（Local API 経由）', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  const asDraftWriter = { user: { id: 'test-draft-writer', role: 'content-draft-writer' } };

  beforeAll(async () => {
    payload = await getPayload({ config });
  });

  it('draft の作成に成功する', async () => {
    const doc = await payload.create({
      collection: 'robots',
      data: { name: 'Test', manufacturerId: 'unitree', _status: 'draft' },
      overrideAccess: false,
      user: asDraftWriter.user,
    });
    expect(doc._status).toBe('draft');
  });

  it('draft の更新に成功する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { _status: { equals: 'draft' } }, limit: 1 })).docs;
    const updated = await payload.update({
      collection: 'robots', id: doc.id, data: { name: 'Test 2' },
      overrideAccess: false, user: asDraftWriter.user,
    });
    expect(updated.name).toBe('Test 2');
  });

  it('_status: published への更新を拒否する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { _status: { equals: 'draft' } }, limit: 1 })).docs;
    await expect(
      payload.update({
        collection: 'robots', id: doc.id, data: { _status: 'published' },
        overrideAccess: false, user: asDraftWriter.user,
      }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });

  it('delete を拒否する', async () => {
    const [doc] = (await payload.find({ collection: 'robots', where: { _status: { equals: 'draft' } }, limit: 1 })).docs;
    await expect(
      payload.delete({ collection: 'robots', id: doc.id, overrideAccess: false, user: asDraftWriter.user }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });

  it('admins collection へアクセスできない', async () => {
    await expect(
      payload.find({ collection: 'admins', overrideAccess: false, user: asDraftWriter.user }),
    ).rejects.toThrow(/Forbidden|Unauthorized/);
  });
});
```

**`overrideAccess: false` が要。** 省略すると Local API はデフォルトで access 制御をスキップし、
テストが「常に成功する」誤検知になる。

- [ ] **Step 2: 権限をcollection access/hookへ実装する**

`collections/Robots.ts`（他9コレクション共通）の `access.update` で、`_status` を
`published` へ変更するリクエストを `content-draft-writer` ロールから拒否する。
`access.delete` も同ロールを拒否する。`admins` collection への `access.read` も拒否する。

MCP plugin は公開collectionだけをexposeし、`admins`、API key、schema管理を通常profileから除外する。Mediaのbinary uploadは別toolとして明示的に許可したときだけ有効にする。

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

Expected: 5ケースすべて PASS（draft作成・draft更新・published拒否・delete拒否・admins拒否）。
**実際の Payload Local API に対して実行され、fake resolver のモックではないこと。**

- [ ] **Step 5: Codexからread-only接続を確認する**

Run: `codex mcp list`

Expected: Payload MCP serverがenabledとして表示される

Codexへ「published robotの件数を取得し、変更はしない」と依頼し、DB件数と一致することを確認する。
**あわせて「あるrobotをpublishしてほしい」と依頼し、拒否されることを確認する。**

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
