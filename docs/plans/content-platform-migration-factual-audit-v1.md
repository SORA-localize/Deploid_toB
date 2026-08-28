# Content Platform Migration — 実装実態の事実調査 v1

**調査日**: 2026-08-28
**調査対象**: `docs/plans/content-platform-migration-plan-v1.md` (Task 0〜9) の実装実態
**調査方針**: 推測を排除し、コマンド実行結果・ファイル実体・実行ログのみを根拠とする。
根拠を提示できない項目は「未検証」と明記し、「完了」と書かない。

## 凡例

| 記号 | 意味 |
|---|---|
| ✅ 実証済 | 実行したコマンド出力またはファイル実体で確認した |
| ❌ 反証 | 実行結果が計画の主張と矛盾した |
| ⚠️ 部分 | 一部のみ確認、残りは未検証 |
| ❓ 未検証 | このセッションで根拠を取得していない |

---

## 0. 調査開始時点の環境事実

```
$ git branch --show-current
task9/production-cutover

$ git log --oneline -3
d183fe4 docs(task9): mark cutover checklist complete
6b16349 merge main into task9 completion decision
facdbbc docs(task9): finalize cutover completion decision

$ git status --porcelain
(出力なし = working tree clean)

$ git rev-list --count main..HEAD
173
```

**事実**: 現在のブランチは `feature/content-platform-migration` ではなく
`task9/production-cutover`。main から 173 commit 先行。working tree はクリーン。

**注意**: 前セッションの記録では作業ブランチは `feature/content-platform-migration` /
PR #34 だった。ブランチが移動している。両者の関係は後述セクションで検証する。

---

## 1. 計画書の Completion Criteria（12項目）

計画書 `## Completion Criteria` の原文12項目を検証対象として固定する。

1. Payload Adminから全collectionを編集できる
2. Codex MCPがschemaを読み、draftを作成・更新できる
3. Codex通常権限でdelete/publish/schema/adminが拒否される
4. first-user bootstrap、admin role escalation拒否、最後のplatform-admin保護が実APIとMCP統合testで通る
5. 公開は承認済み最新version ID/hashの完全なdocumentだけを昇格し、status-only publishを拒否する
6. Postgresがコンテンツ唯一の正本である
7. Gitにcontent recordの二重正本がない
8. 全stable ID、slug、previousSlugs、公開URL、relationship、公開状態が①の移行前後で一致する
9. `npm run check` がexit 0
10. 主要routeのdesktop/mobile E2Eが通る
11. publish後のcache revalidationが動作する
12. export/importによる復旧手順を実行できる

（検証結果は以降のセクションに追記していく）

---

## 調査ログ

### L1. 静的品質ゲート（`npm run check` の構成scriptのうちDB非依存分）

`.env.local` を source した上で個別実行。全て exit 0。

| script | 結果 | 出力 |
|---|---|---|
| `validate:data` | ✅ exit 0 | （出力なし） |
| `check:data-boundaries` | ✅ exit 0 | `[data-boundaries] OK` |
| `check:publish-authorization-boundaries` | ✅ exit 0 | `[publish-authorization-boundaries] OK` |
| `check:client-imports` | ✅ exit 0 | `[client-imports] OK (63 client entry modules)` |
| `check:world-map-asset` | ✅ exit 0 | `[world-map] generated asset: OK` |
| `typecheck` | ✅ exit 0 | （出力なし） |
| `lint` | ✅ exit 0 | **`✖ 4 problems (0 errors, 4 warnings)`** |
| `check:plan-snippets` | ✅ exit 0 | `files=(none) extracted=0 skipped=0` |
| `check:docs` | ✅ exit 0 | `4 broken link(s) in docs/archive/ (frozen shelf, not enforced)`, `local links: OK` |

**F-1（要注意・脆弱性ではないが構造的な脆さ）**: `package.json` の lint script は
`eslint . --max-warnings 4`。実測 warning 数はちょうど **4**。つまり warning が1件でも増えた
瞬間に `npm run check` が赤になる、上限ぴったりの状態。warning 4件の内訳は
`components/Footer.tsx:22`, `components/Header.tsx:160`, `components/ManufacturerMapCopy.tsx:55`,
`components/uilayouts/carousel.tsx:628` の `@next/next/no-img-element`。
**事実であり、推測ではない**: 現状 margin ゼロ。

**F-2**: `check:plan-snippets` は `snippetCheck: true` を宣言する計画書が1つも無いため
`extracted=0` で常に通る。**このゲートは現在何も検証していない。**

**F-3**: `check:docs` は `docs/archive/` の broken link 4件を検出しているが、
「frozen shelf, not enforced」として exit 0 にしている。

### L2. Task 9「旧TS撤去」の削除実績（Files セクションの Delete 対象）

`ls` による実体確認：

| 計画書の Delete 対象 | 実体 |
|---|---|
| `data/robots.ts` | ✅ absent |
| `data/manufacturers.ts` | ✅ absent |
| `data/useCases.ts` | ✅ absent |
| `data/deployments.ts` | ✅ absent |
| `data/articles.ts` | ✅ absent |
| `data/articlePlacements.ts` | ✅ absent |
| `data/types.ts` | ✅ absent |
| `lib/content/localSource.ts` | ✅ absent |
| `lib/data/contentSnapshot.ts` | ✅ absent |
| `lib/data/localContentSnapshot.ts` | ✅ absent |
| `lib/validate.ts` | ✅ absent |
| `lib/validation/*` | ✅ ディレクトリごと absent |

`data/` 配下に残るのは `data/import/{deployments,manufacturers,robots}.json` の3ファイルのみ。

Step 7 の gate コマンド相当（`grep -rn 'data/types' src components lib scripts tests`）は
**5件ヒットするが、全てコメント文中の言及**であり `import` 文は0件。
（`lib/tagRegistry.ts:9`, `lib/payload/access.ts:214`, `lib/content/domainTypes.ts:3,4,11`,
`tests/content/payload-schema.test.ts:28`）。gate の趣旨（実依存0件）は満たしている。

**判定: 旧TS撤去そのものは ✅ 実証済。**

### L3. ❌ 反証 F-4: Task 9 の必須成果物 `docs/reference/content-restore-runbook-v1.md` が存在しない

計画書 Task 9 **Files** セクションに明記：

```
- Create: `docs/reference/content-restore-runbook-v1.md`
```

計画書 **Rollback** セクションにも要求内容が明記されている：

> `docs/reference/content-restore-runbook-v1.md`へ、実行role=`platform-admin`、Production private storeからの
> 署名検証、空DB migration、restore、parity、DNS/deploy切替、停止条件を記載する。署名・hash・
> environment marker・provider resource IDのどれかが一致しなければrestoreを開始しない。

**実体**: `docs/reference/` に当該ファイルは無い。同等の代替を名乗るファイルも無い。

```
$ ls docs/reference/
content-platform-resources-v1.md
content-preview-runbook-v1.md
database-migration-runbook-v1.md
dependency-audit-2026-07-26.md
humanoid_data_management_guide_v1.md
humanoid_data_model_policy_v1.md
humanoid_media_IA_v1.md
market-environment
payload-mcp-integration-check-2026-08-20.md
pre-migration-refactor-results-v1.md
refactor-baseline-2026-07-26.md
task9-audit-upload-endpoint-design-v1.md
task9-preview-rehearsal-preflight-v1.md
task9-production-cutover-preflight-v1.md
task9-production-readonly-check.md
task9-production-readonly-copy-paste.sh
```

`content-restore-runbook` を repo 全体で grep しても、ヒットは計画書自身の2箇所
（作成要求と内容要求）だけで、**実ファイルからの参照も実体も無い**。

**なぜ既存ゲートで検出されなかったか（事実）**: `npm run check:docs` は
「docs内に書かれたリンクの解決可否」を見るスクリプトであり、
「計画書が Create を要求したファイルの存在」は検証しない。誰もこのファイルへリンクしていないため、
リンク切れとしても現れない。

**影響**: 計画書 Completion Criteria の12番「export/importによる復旧手順を実行できる」の
**手順書側の根拠が存在しない**。復旧コード（`scripts/export-content-snapshot.mts --restore` 等）が
あることと、runbook が存在することは別問題。

### L4. ⚠️ F-5: 計画書 Rollback セクションが現コードと矛盾している（計画書側の陳腐化）

計画書 Rollback セクション冒頭：

> cutover後に公開障害が起きた場合は、コードを巻き戻さず、24時間のrollback window内だけVercel環境変数を
> `CONTENT_SOURCE=local`、`ALLOW_LOCAL_CONTENT_ROLLBACK=true`にしてredeployする。

一方、現在の `lib/content/getContentRepository.ts:16-22`：

```ts
export async function getContentRepository() {
  const sourceName = process.env.CONTENT_SOURCE;
  if (sourceName !== 'payload') {
    throw new Error(`CONTENT_SOURCE must be payload after the Production cutover; received ${String(sourceName)}`);
  }
  return createContentRepository(createPayloadContentSource());
}
```

`CONTENT_SOURCE=local` は**確実に throw する**。`ALLOW_LOCAL_CONTENT_ROLLBACK` はコード上
どこからも読まれていない（grep 結果：非docsのヒットは `.env.example:22` の1件のみで、
これは値の定義であって参照ではない）。

これは Task 9 Step 7（「`CONTENT_SOURCE` は廃止し、Payload sourceを唯一の実装にする」）の
実施結果として**正しい**。矛盾しているのは計画書 Rollback セクションと `.env.example` の方。

**残存する不整合（事実）**:
- `.env.example:22` に `ALLOW_LOCAL_CONTENT_ROLLBACK=false` が残っている（もう機能しない変数）
- `tests/e2e/content-routes.spec.ts` の docblock が
  「`CONTENT_SOURCE=local` と `CONTENT_SOURCE=payload` それぞれで実行する（両方PASSすることが
  Task 6の受け入れ条件）」と記載しているが、`local` は現在 throw するため実行不可能

**F-6a**: したがって Task 9 完了後の唯一の rollback 手段は
「cutover直前exportを新しいPostgres環境へimportし、同じmigration versionのアプリをdeploy」
（計画書 Rollback 後半）だけになったが、**その手順書（F-4 の runbook）が無い**。
F-4 と F-6 は同じ穴の表と裏。


### L1-訂正. 計測方法の欠陥と再計測

**L1 の表の exit code は無効だった。** 実行形が
`npm run --silent <script> 2>&1 | tail -5; echo "exit=$?"` であり、`$?` は `tail` の終了
コードを拾っていた（パイプの最終要素）。したがって全て 0 になるのは当然で、何も測っていない。

パイプを外して再計測した正しい結果：

```
[0] check:data-boundaries
[0] check:publish-authorization-boundaries
[0] check:client-imports
[0] check:world-map-asset
[0] typecheck
[0] lint
[0] check:plan-snippets
[0] check:docs
[1] validate:data      ← スクリプト自体が存在しない
```

L1 表の内容（各 script が実際に OK 出力を出していること）自体は再計測でも一致した。
ただし **`validate:data` は現在 `package.json` に存在しない**（Task 9 の legacy 検証
パイプライン削除に伴い削除済み。commit `8a7f123 chore(task9): switch runtime and builds to Payload`）。
これは計画書 Task 9 Files の
「`scripts/validate-data.mjs`…legacy検証パイプラインを削除する場合は…`package.json` の
`build` / `validate:data` scriptからも呼び出しを外す」に沿った**正しい**実施。

### L5. ❌ F-7（重大）: `npm run check` から E2E が外され、UI E2E 21ファイル中19ファイルがどのCIでも実行されていない

**現在の `check` script（実測）**:

```
check :: check:data-boundaries && check:publish-authorization-boundaries && check:client-imports
      && check:world-map-asset && typecheck && lint && check:plan-snippets && check:dead-code
      && check:docs && build && check:home-payload && check:bundle-content && check:client-budgets
      && test
```

**計画書執筆時点の `check`（git 履歴で確認）**:

```
check :: validate:data && ... && npm run test && npm run build && ... && npm run test:e2e
```

`npm run test:e2e` を `check` から外したのは commit
**`bc96769 ci: separate nonblocking payload e2e from verify`**（変更2ファイル、
`.github/workflows/content-e2e.yml` と `package.json`、+5/-12行）。
**commit message は1行のみで、本文による理由の記載は無い。**

**その結果として現在CIが実行しているE2Eの実測範囲**:

| workflow | job | E2E範囲 |
|---|---|---|
| `ci.yml` | `verify`（required check） | `npm run check` に `test:e2e` が無いため **UI E2E ゼロ本** |
| `content-e2e.yml` | `content-e2e` | `cache-revalidation.spec.ts` と `draft-mode-wiring.spec.ts` の **2ファイルのみ**（`--workers=1` 固定） |

`tests/e2e/` に存在する spec ファイルは **21本**：

```
accessibility-smoke, analytics-opt-in, cache-revalidation*, carousel-autoplay,
catalog-url-state, compare-toast, content-routes, draft-mode-wiring*,
focus-restoration, global-not-found, headings, hero-carousel-dots, home-map,
home-world-map, keyboard-navigation, mobile-overflow, payload-admin,
public-routes, security-headers, slug-redirects, visual-regression
（* = CIで実行されている2本）
```

**どのCI workflowからも実行されない spec = 19本。** その中には、計画書が
Task 6 / Task 9 Step 4 の受け入れ条件として名指しした
**`content-routes.spec.ts` が含まれる**（Task 9 Step 4: 「Run: `npm run test:e2e -- tests/e2e/content-routes.spec.ts`
Expected: 全route PASS」）。cutover 後、このテストを回帰として自動実行する仕組みは無い。

同様に自動実行されていないもの: `security-headers`（セキュリティヘッダ回帰）、
`slug-redirects`（Global Constraints「slug/previousSlugs/公開URLを変更しない」の実機検証）、
`public-routes`、`visual-regression`、`accessibility-smoke`、`mobile-overflow`、`payload-admin`。

### L6. ❌ F-8: Completion Criteria #10「主要routeの**desktop/mobile** E2Eが通る」に対応する mobile project が存在しない

`playwright.config.ts:30-32`（実体）:

```ts
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
```

project は **Desktop Chrome の1つだけ**。`devices['Pixel 5']` 等の mobile project は定義されていない。
（mobile 相当の検証を spec 内の viewport 指定で行っている可能性は別途 L7 で確認する。）

### L7. ⚠️ F-9: `npm run test`（vitest）はローカルで **16ファイル FAIL**、544テスト中 **267がスキップ**

ローカル実測（`.env.local` を source）:

```
Test Files  16 failed | 24 passed | 1 skipped (41)
     Tests  277 passed | 267 skipped (544)
```

**16 failed の原因は全て同一**: `lib/content/databaseSafety.ts:99` の throwaway DB ガードが
`.env.local` の `DATABASE_URL`（`localhost:5432/deploid_dev`）を拒否している。
これは**ガードが設計通りに機能している証拠**であり、コード欠陥ではない
（`deploid_dev` 誤削除インシデントの再発防止ガード）。CI では `payload_test` /
`content_e2e_test` を使うため、この16ファイルはCIでは実行される。

**問題は 267 スキップの方。** スキップ条件を grep した結果、
`describe.skipIf(!canSignForReal)` / `it.skipIf(!canSignForReal)` が下記7ファイルに存在する:

```
tests/content/restore-enforcement.test.ts:78
tests/content/temp-file-hygiene.test.ts:67
tests/content/approval-signature-enforcement.test.ts:33
tests/content/auditUploadSession.test.ts:45
tests/content/media-baseline-recovery.test.ts:45
tests/content/import-parity.test.ts:505
```

定義は全ファイルで同一:

```ts
const canSignForReal = cosignAvailable() && Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
```

**`.github/workflows/ci.yml` の `verify` job の env ブロックには
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` が無い**（env は
`DATABASE_URL` / `PAYLOAD_SECRET` / `CONTENT_SOURCE` の3つのみ。secrets 参照も無い）。
`content-e2e.yml` の env にも無い。

**したがって、実署名（実 cosign + 実 AWS KMS）を要する検証群 —— 署名付き restore の強制、
identity transfer 承認署名の強制、media 復元、audit upload session の happy path、
一時ファイル衛生 —— は CI で一度も実行されていない。**
これらはまさに「本番データの復旧と改ざん防止」の中核であり、
Completion Criteria #12「export/importによる復旧手順を実行できる」の機械的根拠にあたる部分。

### L8. ✅ CI 実績と main の保護設定（事実）

`gh run list` 実測（直近15件、全て `completed / success`）:

```
CI                    main                      push          33152223989  7m4s   2026-08-28T07:38:38Z  success
Content platform E2E  main                      push          33152223976  3m16s  2026-08-28T07:38:38Z  success
CI                    task9/production-cutover  pull_request  33151584724  6m42s                        success
Content platform E2E  task9/production-cutover  pull_request  33151584702  3m53s                        success
（以下同様、直近15件すべて success）
```

`gh pr checks 44`（最後にmergeされたPR）:

```
Vercel Preview Comments  pass
content-e2e              pass   3m49s
verify                   pass   6m40s
Supabase Preview         skipping
Vercel                   pass          Deployment has completed
```

**main の保護（訂正を含む）**: `gh api repos/:owner/:repo/branches/main/protection` は
`404 Branch not protected` を返すが、これは**旧 branch-protection API のみの結果**であり、
保護が無いという意味ではない。`gh api repos/:owner/:repo/rules/branches/main` で確認すると
ruleset **`task9-main-protection`（enforcement: active）** が適用されており、その中に:

```
required_status_checks:
  - context: verify
  - context: content-e2e
non_fast_forward / deletion / required_linear_history / creation
pull_request:
  required_approving_review_count: 0
  required_review_thread_resolution: true
```

**したがって `verify` と `content-e2e` は実際に required check として強制されている。**
（`content-e2e.yml` の docblock が求めた「branch protectionのrequired status checksに登録」は
**実施済み**。ここは計画通り。）

補足事実: `required_approving_review_count: 0` のため、PRは承認者0人で自己マージ可能。
（単独開発の運用選択であり、計画書が承認者数を要求している箇所は無い。）

### L9. F-7 の核心的な帰結（L5・L8 を突き合わせた事実）

- required check は `verify` と `content-e2e` の2つ。**これは強制されている。**
- しかし `verify` が実行する `npm run check` には `test:e2e` が**含まれない**。
- `content-e2e` が実行する playwright spec は `cache-revalidation` と `draft-mode-wiring` の**2本だけ**。

**⇒ required check は緑であっても、UI E2E 21本のうち19本は「1本も実行されないまま」main へ
マージされる構造になっている。** 緑であること自体は正しく、嘘ではない。
「緑が意味する検証範囲」が計画書の Completion Criteria #10 より狭い、というのが事実。

計画書自身も Task 9 冒頭の現在地メモでこれを認めている:

> 全UI E2E 94本中の32 failureは、既存のfixture/visual baseline差（cache・draft 2、日本語/英語6、
> 最小fixture10、画像baseline14）で、Task 9のrequired gateではない。

つまり **32本の失敗が既知の状態で「required gate ではない」と整理して完了判定している。**
これは計画書上の明示的な判断であって隠蔽ではないが、
Completion Criteria #10「主要routeのdesktop/mobile E2Eが通る」とは**両立していない**。

### L10. F-2 補足: `check:plan-snippets` が無効化された経緯（事実）

`scripts/check-plan-snippets.mjs:47-50`（現行）:

```js
if (checkedFiles.length === 0) {
  console.log('[plan-snippets] no active plan declares `snippetCheck: true`; nothing to check');
}
```

一方、この仕組みの設計元である `docs/archive/refactor-phase-05-client-boundaries-v1.md:916` は:

```js
console.error('[plan-snippets] no plan declares `snippetCheck: true`');
```

**設計時は「opt-inした計画書が1本も無い＝異常」として error 扱いだったが、現行実装は log に
格下げされ、exit 0 で通過する。** そして `docs/plans/` 配下で `snippetCheck: true` を宣言して
いる計画書は **0本**（`content-platform-migration-plan-v1.md` 自身も宣言していない。
archive の記録によれば同計画書には ts block が14個ある）。

**⇒ `npm run check` の構成要素のうち `check:plan-snippets` は、現在1行のコードも型検査していない。**

### L7-訂正（重要）. F-9 は誤りだった —— 実際のスキップは 267 ではなく 37

L7 で「544テスト中267スキップ」と書いたが、**これは測定条件が誤っていた**。
`.env.local`（`deploid_dev`）では16ファイルが `beforeAll` 段階で DB ガードにより throw し、
そのファイルに属するテストが**まとめて「skipped」に計上されていた**。
「AWS 資格情報が無いからスキップされた数」ではない。

**CI と同条件で取り直した実測**（throwaway DB `deploid_audit_vitest_test`、
`CONTENT_SOURCE=payload`、`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` を明示的に unset）:

```
$ npm run payload:migrate     # 全migration適用: Done.
$ npm run test

 Test Files  40 passed | 1 skipped (41)
      Tests  507 passed | 37 skipped (544)
   Duration  86.57s
VITEST_EXIT=0
```

**訂正後の事実**:
- `npm run test` は CI 相当環境で **exit 0**、**507/544 が実際に PASS**。
- スキップは **37テスト（6.8%）** で、267ではない。
- `payload:migrate` は空DBに対して全migrationを適用できる（Task 3.5 の要求を満たす実測）。

**F-9 の残る有効な部分**: それでも37テストは CI で実行されていない。
`ci.yml` / `content-e2e.yml` のどちらの env ブロックにも `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` は無く、`secrets.*` の参照も無い（実ファイルで確認）。
`describe.skipIf(!canSignForReal)` / `it.skipIf(!canSignForReal)` を持つのは以下6ファイル:

```
tests/content/restore-enforcement.test.ts:78
tests/content/temp-file-hygiene.test.ts:67
tests/content/approval-signature-enforcement.test.ts:33
tests/content/auditUploadSession.test.ts:45
tests/content/media-baseline-recovery.test.ts:45
tests/content/import-parity.test.ts:505
```

規模を正しく述べ直すと: **実署名パス（実cosign + 実AWS KMS）の検証は CI では
一度も走っていないが、その規模は全体の 6.8%（37テスト）であり、
残る 507 テストは CI で実際に実行され PASS している。**

### L11. ✅ `check:*` ゲート群は実際に失敗しうる（no-op ではない）

「ゲートが形だけではないか」を確認するため、各 script の失敗経路を実体で数えた:

| script | 失敗経路の数 | 行数 |
|---|---|---|
| `check-data-import-boundaries.mjs` | 4 | 138 |
| `check-publish-authorization-boundaries.mjs` | 1 | 81 |
| `check-client-import-graph.mjs` | 2 | 135 |
| `check-home-payload.mjs` | 2 | 27 |
| `check-client-bundle-content.mjs` | 1 | 57 |
| `check-client-budgets.mjs` | 1 | 156 |
| `check-audit-upload-traces.mjs` | 3 | 33 |
| `check-doc-links.mjs` | 1 | 72 |
| `generate-world-map-asset.mjs` | 1 | 28 |

`check-client-budgets.mjs` は具体的な閾値（`ROUTE_SPECIFIC_BUDGETS`、shared floor）を持ち、
超過時と**未宣言routeが出た時の両方**で fail する（`no budget declared for route: ... Add it to
ROUTE_SPECIFIC_BUDGETS`）。`check-home-payload.mjs` は HTML byte 数と embedded SVG data URI 数を
実測して fail する。**これらは実質のあるゲート。**

**⇒ 「ゲートが全部お飾り」ではない。実質が無いのは `check:plan-snippets`（L10）だけで、
`check:docs` は archive 配下のリンク切れを意図的に非強制にしている（L1 F-3）という限定的な話。**

### L12. ✅ Global Constraints「role enum 4値」は実装で守られている

`lib/payload/access.ts:73`:

```ts
export type AdminRole = 'content-reader' | 'content-draft-writer' | 'content-publisher' | 'platform-admin';
```

旧称 `editor` / `publisher` / `admin` はこの型に無い。
publish 権限は `content-publisher` 以上、delete は `platform-admin` のみ（同ファイル 97, 148行）。
計画書 Global Constraints の該当項目と一致。

### L13. ✅ Payload 構成の実体（Task 2 / 3 / 3.5 / 8）

`payload.config.ts` 実体で確認:
- `db: postgresAdapter` + `migrationDir` を repo root の `migrations/` へ明示ピン留め
  （Payload 既定の `src/migrations` へ流れる問題を回避するコメント付き）
- `plugins: [createMediaStoragePlugin(), createMcpPlugin()]` — MCP プラグイン組み込み済み（Task 8）
- `collections: contentCollections`, `globals: contentGlobals`
- `PAYLOAD_SECRET` / `DATABASE_URL` 欠落時に用途付きメッセージで早期 throw

`collections/` の実体は12個:
`Admins, ArticlePlacements, Articles, AuditUploadSessions, Deployments, Distributors,
EnvironmentMarker, Manufacturers, Media, Robots, RobotSeries, UseCases`
（計画書 §D が「計画が知らないコレクション2件」として追加を決めた分を含む）

`migrations/` に8世代のmigrationがコミット済み（`.ts` + `.json` ペア）。
`ci.yml` には **schema drift check**（`migrate:create --skip-empty` して新規ファイルが
生まれたら fail）が実装されており、「collection を変えたのに migration をコミットしていない」
状態を機械的に止めている。これは計画書 Global Constraints
「schema変更はmigrationを生成してGitでreviewし、CIで適用確認する」を満たす実装。

### L14. ✅ sharp / ERR_DLOPEN_FAILED は解決済み。CVE 債務も解消している（前セッション記録の訂正）

前セッションの記録では「sharp を 0.34.5 へ戻したため High severity CVE 4件を再導入しており、
Production cutover 前に解消必須」という未解決債務として扱われていた。**これは現在すでに解決している。**

git 履歴の実体（時系列）:

```
bfbc0d7 fix(task9): mark sharp as a server external package to fix Vercel Function native binary loading
3b2fa2e fix(task9): revert serverExternalPackages: ['sharp'] — no effect on the bug, broke Function size
e8d6f49 temp(task9): downgrade sharp to 0.34.4 to unblock Preview E2E verification
715ebfd temp(task9): downgrade sharp to 0.34.4 again — serverExternalPackages did not fix ERR_DLOPEN_FAILED
b698658 fix: isolate sharp and cosign audit upload traces
4ee87b6 fix: revert sharp to 0.34.5 to resolve Vercel ERR_DLOPEN_FAILED
503e93b refactor: remove unused Payload sharp integration        ← 真の根本原因への対処
da23ad0 fix: upgrade sharp to security-fixed release             ← 0.34.5 → 0.35.3 へ復帰
```

**根本原因は Next.js の image optimization ではなく、Payload 側の optional sharp integration
だった。** `503e93b` が `payload.config.ts` からそれを外したことで sharp が Vercel Function
bundle へ引き込まれなくなり、その後 `da23ad0` で sharp を 0.35.3（脆弱性修正版）へ戻せた。

現在の `payload.config.ts` 該当コメント（実体）:

```
// Media has no imageSizes/resizeOptions/formatOptions, so Payload's optional Sharp
// integration is intentionally disabled. Next.js image optimization remains a separate
// concern and still owns the project's Sharp dependency.
```

現在の `package.json`: `dependencies.sharp = "^0.35.3"`, `overrides.sharp = "^0.35.3"`。

**`npm audit --omit=dev` 実測**:

```
7 vulnerabilities (1 low, 6 moderate)
```

内訳は `dompurify`←`monaco-editor`（Payload admin UI 由来）と
`esbuild`←`@esbuild-kit/*`←`drizzle-kit`←`@payloadcms/db-postgres`。
**Critical 0 / High 0。** 計画書 Task 9 Step 8 の
「Expected: critical 0。残存highは個別にissue化」を**満たしている**
（残存は moderate 以下のみで、いずれも Payload の推移的依存で `No fix available`）。

### L15. ✅ Production は実際に稼働している

`curl -o /dev/null -w '%{http_code}'` 実測（2026-08-28）:

```
200  https://deploid.net/
200  https://deploid.net/robots
200  https://deploid.net/robots/unitree-g1
200  https://deploid.net/manufacturers
200  https://deploid.net/use-cases
200  https://deploid.net/reports
200  https://deploid.net/compare
200  https://deploid.net/sitemap.xml
200  https://deploid.net/admin
```

`lib/content/getContentRepository.ts` が `CONTENT_SOURCE !== 'payload'` で必ず throw する以上、
これらが 200 を返している事実は **Production が Payload/Postgres 経由で描画されている**ことの
実証になる（local source は既にコード上存在しない）。
⇒ Completion Criteria #6「Postgresがコンテンツ唯一の正本である」は ✅ 実証済。

### L16. ✅ 期限切れ audit session の cleanup scheduler は登録済み（是正計画の残課題は閉じている）

`docs/plans/task9-implementation-review-and-remediation-plan-v1.md` §10 は
「期限切れcleanup関数は実装済みだが、cron/Vercel Cron/GitHub Actions/手動ジョブへの登録は
まだ行っていない」を残課題としていたが、**その後に閉じている**。

`vercel.json`（実体）:

```json
{ "crons": [ { "path": "/api/internal/cron/audit-upload-cleanup", "schedule": "0 3 * * *" } ] }
```

route も存在する: `src/app/api/internal/cron/audit-upload-cleanup/route.ts`

### L17. ⚠️ F-11: cron endpoint の**成功経路**は一度も検証されていない

`src/app/api/internal/cron/audit-upload-cleanup/route.ts` の実体:

```ts
export async function GET(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided || provided !== expected) {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }
  const oidcToken = request.headers.get('x-vercel-oidc-token');
  if (!oidcToken) return Response.json({ ok: false, reason: 'oidc-token-header-missing' }, { status: 503 });
  ...
}
```

成功するには **2つの条件**が要る: `CRON_SECRET` の一致 **かつ** `x-vercel-oidc-token` ヘッダの存在。

計画書 Task 9 の現在地メモが記録している検証は
「**Cron endpointの未認証401を確認した**」の1点のみ。
つまり**401 を返す経路しか確認されておらず、Vercel Cron が実際に
`x-vercel-oidc-token` ヘッダを送ってくるか（＝503 で毎晩黙って失敗し続けないか）は
未検証**である。

これは推測ではなく、記録に「401を確認した」としか書かれていないという事実に基づく。
初回の実行予定時刻は毎日 03:00 UTC。

### L18. ❌ F-12: 計画書の Task 9 完了判定と、是正計画書の未完了宣言が矛盾したまま両方 repo に残っている

`docs/plans/task9-implementation-review-and-remediation-plan-v1.md` §10 の**最終段落**（現行）:

> BlobとDBを跨ぐ完全な原子性、scheduler実装の外部登録、全UI E2Eの既存baseline整合、
> Preview/Production/GitHub required checksの外部検証は未完了であり、
> **Task 9の本番承認条件はまだ満たしていない。**

同 §9:

> Critical/Highが残る、throwaway DBでの検証ができない、…または required checks が未確認の場合は
> 「実装済み」までに留め、**「本番安全」「カットオーバー承認済み」とは報告しない。**

一方 `docs/plans/content-platform-migration-plan-v1.md` Task 9 冒頭（より新しい、2026-08-27〜28）:

> **Task 9本番cutoverは完了**と判定する。

**事実の整理**（どちらが正しいかではなく、何が実際に閉じたか）:

| 是正計画が挙げた未完了項目 | 現在の実体 |
|---|---|
| scheduler の外部登録 | ✅ 閉じた（L16: `vercel.json` crons + route 実在） |
| Preview/Production/GitHub required checks の外部検証 | ✅ 閉じた（L8: ruleset で `verify`/`content-e2e` が required、直近全て success） |
| 全UI E2E の既存 baseline 整合（32 fail） | ❌ **未解決**。判断が「release gate 保留」から「non-blocking 保守課題」へ変わっただけで、32本は失敗したまま |
| Blob と DB を跨ぐ完全な原子性 | ❌ **未解決**。是正計画は「補償削除」までを実装したと記載、完全な原子性は未達と明記 |
| 実Payload複数collection書き込みの途中失敗統合テスト | ❌ **未完了**と是正計画に明記、その後に完了した記録は見当たらない |

**⇒ 是正計画書は現在の実態より古く、かつ更新されていないため、
repo 内に「本番承認条件はまだ満たしていない」という文言が生きたまま残っている。**
5項目のうち2つは実際に閉じており、3つは実際に未解決。

### L19. ⚠️ F-13: 計画書のチェックボックス状態が実装実態と対応していない

`docs/plans/content-platform-migration-plan-v1.md` の Step チェックボックスを機械集計した実測:

| Task | checked | unchecked |
|---|---|---|
| Task 0 | 0 | 5 |
| Task 0.5 | 0 | 5 |
| Task 1 | **5** | 0 |
| Task 2 | 0 | 8 |
| Task 3 | 0 | 6 |
| Task 3.5 | 0 | 9 |
| Task 4 | 0 | 9 |
| Task 5 | 0 | 9 |
| Task 6 | 0 | 6 |
| Task 7 | 0 | 8 |
| Task 8 | 0 | 7 |
| Task 9 | **9** | 0 |

**Task 1 と Task 9 だけが `[x]` で、Task 0〜8 の 72 Step は `[ ]` のまま。**
実装は（L2, L11〜L16 の通り）実際には行われているので、
**チェックボックスは進捗の指標として機能していない。**
「計画書を全部終わらせた」の根拠に計画書自身のチェックボックスを使うことはできない。

### L20. ⚠️ F-14: 撤去済みファイルを指すルール文書の残存（是正計画 M-02 の積み残し）

`ai/rules/10-workflow.md:140`（実体）:

```
- Data: `data/types.ts`, `data/*.ts`, `lib/data.ts`, `lib/validate.ts`
```

実体確認: `data/types.ts` absent / `lib/data.ts` absent / `lib/validate.ts` absent。
**3つとも存在しないファイルを、現行の作業ルールが Data 領域の正本として案内している。**

一方、同じ M-02 で指摘された他の箇所は修正済み:
- `ai/rules/20-data.md:5` → 「Payload CMS + managed PostgreSQL is now live and is the sole content source after Task 9…the former `data/*.ts` workflow has been retired.」✅
- `ai/rules/00-index.md:35` → 「The Payload CMS + managed PostgreSQL cutover is complete…removed in Task 9.」✅
- `ai/rules/21-data-maintenance-workflow.md:24` → 「the retired data/*.ts files」✅

⇒ M-02 はほぼ解消済みで、**残るのは `ai/rules/10-workflow.md:140` の1行**。

---

## 2. Completion Criteria 12項目の判定（根拠付き）

| # | 基準 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Payload Adminから全collectionを編集できる | ⚠️ 部分 | `/admin` が Production で 200（L15）。collection 12個が `collections/` に実在（L13）。`admin-access.test.ts` が CI で PASS。**ただし UI から実際に編集する `payload-admin.spec.ts` は どのCIでも実行されていない**（L5） |
| 2 | Codex MCPがschemaを読み、draftを作成・更新できる | ✅ | `createMcpPlugin()` が `payload.config.ts` に組み込み済み（L13）。`tests/integration/mcp-endpoint.test.ts` が `content-e2e` workflow の `npm run test:integration` step で実行され、直近の run は全て success（L8） |
| 3 | Codex通常権限でdelete/publish/schema/adminが拒否される | ✅ | `tests/content/mcp-access.test.ts` が `verify` の `npm run test` に含まれ PASS（L7訂正: 507/544 pass）。role enum と権限境界は `lib/payload/access.ts` に実装（L12） |
| 4 | bootstrap / escalation拒否 / 最後のplatform-admin保護 | ✅ | `preview-admin-bootstrap.test.ts`・`admin-access.test.ts` が CI で PASS。最後のadmin保護は advisory lock 付きで実装済み（是正計画 §10 に実施記録） |
| 5 | 承認済み最新version の完全documentだけ昇格、status-only publish拒否 | ✅ | `publish-gates` / `publish-approved-version` / `publish-authorization*.test.ts`（4ファイル）が CI で PASS。`lib/payload/publishApprovedVersion.ts` + `publishLock.ts` が実在 |
| 6 | Postgresがコンテンツ唯一の正本である | ✅ | `getContentRepository()` が `payload` 以外で必ず throw（L4）＋ Production 全route 200（L15）＝ Payload 経由で描画されている実証 |
| 7 | Gitにcontent recordの二重正本がない | ✅ | `data/*.ts`・`lib/content/localSource.ts`・legacy検証パイプライン一式が全て absent（L2） |
| 8 | 全stable ID/slug/previousSlugs/公開URL/relationship/公開状態の一致 | ❓ **本調査では未検証** | `import-parity.test.ts` は CI で PASS するが、これは fixture に対する検証。**Production 実データに対する `content:compare` の 0差分は 2026-08-25 の `task9-production-cutover-preflight-v1.md` の記録が唯一の根拠で、本調査では再実行も再確認もしていない** |
| 9 | `npm run check` がexit 0 | ✅（ただし範囲が縮小） | CI `verify` が直近全て success（L8）。ローカルでも throwaway DB で `npm run test` exit 0（L7訂正）。**ただし `check` から `test:e2e` が外されている**（L5） |
| 10 | 主要routeのdesktop/mobile E2Eが通る | ❌ **未達** | mobile project が `playwright.config.ts` に存在しない（L6）。UI E2E 21本中19本がどのCIでも未実行（L5）。計画書自身が「94本中32 failure」を記録（L9） |
| 11 | publish後のcache revalidationが動作する | ✅ | `tests/e2e/cache-revalidation.spec.ts` が `content-e2e` workflow で実行され（required check）、直近全て success（L8） |
| 12 | export/importによる復旧手順を実行できる | ⚠️ 部分 | 復旧コードは実在し `restore-enforcement.test.ts` 等が存在。**しかし (a) 計画書が必須とした `docs/reference/content-restore-runbook-v1.md` が存在しない（L3）、(b) 実署名を要する37テストは CI で一度も実行されていない（L7訂正）** |

**集計: ✅ 7件 / ⚠️ 3件 / ❌ 1件 / ❓ 1件**

---

## 3. 未解決事項（重要度順・全て事実に基づく）

### 優先度 高

**A-1. `docs/reference/content-restore-runbook-v1.md` が存在しない（L3）**
計画書が Task 9 の Create 成果物として明示し、Rollback セクションが記載内容まで指定している
必須文書。実体なし、代替なし、参照なし。Task 9 Step 7 で `CONTENT_SOURCE=local` による
rollback 経路が撤去された結果、**現在この runbook が唯一の復旧手順書になるはずだった**（L4 F-6a）。

**A-2. UI E2E 21本中19本がどのCIでも実行されていない（L5・L9）**
`verify` の `npm run check` から `test:e2e` が commit `bc96769`（message 1行、理由本文なし）で
除かれ、`content-e2e` は2本しか実行しない。未実行に含まれるもの:
`content-routes`（計画書が Task 6/Task 9 Step 4 の受け入れ条件に指定）、`security-headers`、
`slug-redirects`（Global Constraints「slug/公開URLを変更しない」の実機検証）、
`public-routes`、`visual-regression`、`accessibility-smoke`、`mobile-overflow`、`payload-admin`。
かつ計画書自身が「94本中32 fail」を記録している。

**A-3. cron endpoint の成功経路が未検証（L17）**
`/api/internal/cron/audit-upload-cleanup` は `CRON_SECRET` 一致に加えて
`x-vercel-oidc-token` ヘッダを要求し、無ければ 503 を返す。
記録にあるのは「未認証401を確認した」のみ。**Vercel Cron が実際に OIDC ヘッダを送るかは
未確認**で、送らなければ毎日 03:00 UTC に静かに 503 を返し続け、
期限切れ session と孤児 Blob が回収されないまま蓄積する。

### 優先度 中

**A-4. 実署名（実cosign + 実AWS KMS）を要する37テストが CI で一度も実行されていない（L7訂正）**
`ci.yml` / `content-e2e.yml` のどちらの env にも AWS 資格情報が無く、`secrets.*` 参照も無い。
対象は署名付き restore の強制、identity transfer 承認署名、media 復元、
audit upload session の happy path、一時ファイル衛生。全体の 6.8%だが、
**内容は「本番データの復旧と改ざん防止」の中核**。

**A-5. 是正計画書に「本番承認条件はまだ満たしていない」が生きたまま残っている（L18）**
`task9-implementation-review-and-remediation-plan-v1.md` §9・§10 と、
計画書 Task 9 の「完了と判定する」が repo 内で矛盾している。
挙げられた5つの未完了項目のうち2つ（scheduler登録・required checks）は実際に閉じたが、
3つ（UI E2E 32 fail、Blob/DB 原子性、複数collection途中失敗の統合テスト）は実際に未解決。

**A-6. Completion Criteria #8（parity 0差分）を本調査では再確認していない（判定表 #8）**
根拠は 2026-08-25 の preflight 記録のみ。Production 実データに対する再検証は未実施。

### 優先度 低（放置しても壊れないが、事実として不正確）

- **A-7**: `check:plan-snippets` が実質何も検査していない（L10）。設計元は error 扱いだったものが
  log に格下げされ、opt-in 計画書は0本。`npm run check` の構成要素として無効。
- **A-8**: `ai/rules/10-workflow.md:140` が存在しない `data/types.ts` / `lib/data.ts` /
  `lib/validate.ts` を Data 領域の正本として案内している（L20）。
- **A-9**: 計画書 Rollback セクションと `.env.example:22` が、
  機能しない `CONTENT_SOURCE=local` / `ALLOW_LOCAL_CONTENT_ROLLBACK` を案内している（L4）。
  `tests/e2e/content-routes.spec.ts` の docblock も同様に実行不可能な手順を書いている。
- **A-10**: 計画書の Step チェックボックスが Task 0〜8 で全て未チェック（72個）のまま（L19）。
  進捗指標として機能していない。
- **A-11**: `lint` が `--max-warnings 4` に対し実測ちょうど 4 warning。margin ゼロ（L1 F-1）。

---

## 4. 明確に良好だった点（事実）

推測を排して確認した結果、**懸念していたほど「形だけ」ではなかった**ものを列挙する。

- `npm run test` は CI 相当環境で **507/544 PASS, exit 0**（L7訂正）。
- `check:*` ゲート群は具体的な閾値と失敗経路を持つ実質的な検査（L11）。
  `check-client-budgets.mjs` は未宣言routeでも fail する設計。
- CI に **schema drift check** が実装され、migration 漏れを機械的に止めている（L13）。
- **DB 安全ガードが実際に発火した**（L7）。`deploid_dev` を拒否した動作は、
  過去の誤削除インシデント対策が生きている実証。
- main は ruleset `task9-main-protection` で保護され、
  `verify` / `content-e2e` が required check として強制されている（L8）。
- 旧TS撤去は完全に実施され、実 import 依存は0件（L2）。
- role enum 4値、publish/delete 権限境界が実装で守られている（L12）。
- sharp / ERR_DLOPEN_FAILED は根本原因（Payload の optional sharp integration）へ対処して解決し、
  **CVE 債務も解消**（`npm audit --omit=dev` で Critical 0 / High 0）（L14）。
- cleanup scheduler は `vercel.json` の cron として登録済み（L16）。
- Production 全主要route が 200（L15）。

---

## 5. 本調査の限界（未検証と明記する範囲）

以下は本調査で**根拠を取得していない**。「問題ない」とは言えない。

- Production DB に対する `content:compare` の再実行（判定表 #8）
- UI E2E 94本の実走行（計画書記載の「32 fail」を本調査では再現・確認していない）
- `npm run build` のローカル実行（CI `verify` の success をもって代替した）
- 実 AWS KMS を使った37テストの実走行（意図的に CI 同条件＝資格情報なしで測定した）
- Vercel Cron の実行履歴（成功/503 の実績ログ）
- Payload Admin UI からの実際の編集操作
