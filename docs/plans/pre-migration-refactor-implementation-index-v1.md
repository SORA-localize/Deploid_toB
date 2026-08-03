---
status: plan
updated: 2026-07-30
---

# CMS / DB移行前リファクタリング実装インデックス v1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CMS / DBを導入せず、現行の公開URL・データ意味・表示を維持したまま、将来の移行に耐える品質、責務境界、性能、UI、セキュリティへ段階的に整える。

**Architecture:** `data/*.ts` は移行完了まで正本として維持する。各phaseは最新のgreenなintegration commitから専用branchを作り、テスト追加、最小実装、全品質ゲート、差分reviewの順に進める。CMS / DB adapterや汎用repositoryは作らず、現時点でも必要なlocal snapshot、validator、view modelだけを分離する。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript 6、Vitest、Playwright、ESLint、GitHub Actions、Vercel

## Global Constraints

- `id`、`slug`、`previousSlugs`、公開URLを変更しない。
- `PublishStatus`、rights、sources、evidence、relationshipの意味を変更しない。
- Payload CMS、PostgreSQL、object storage、MCP、importer、DB adapterを今回導入しない。
- ページから直接SQLや将来CMS SDKを呼ぶ設計を先回りして作らない。
- `main` の既存commitを書き換えず、force-pushと`git reset --hard`を通常手順に含めない。
- `stash@{0}` の既存archive差分をpop、drop、変更しない。
- phase branchは`refactor/integration-20260726`の最新green commitから作る。
- integration branchへ直接実装commitを作らない。
- 外部URLのtimeoutはPR品質ゲートに含めず、retry付きscheduled workflowで監視する。
- 各phaseを独立してrevertできるcommit境界にする。

---

## 1. 正本と実行順

設計判断の正本は [`pre-migration-refactor-safety-design-v1.md`](pre-migration-refactor-safety-design-v1.md)。本書は実行順とbranch gateの正本で、各phaseの具体的なファイル、テスト、commitは次の計画を正本とする。

| 順序 | 計画 | Branch | 前提 | 状態 |
|---:|---|---|---|---|
| 0 | 本書 §2 Git baseline | `docs/refactor-planning-20260726` | 完了済み | 完了 |
| 1 | [品質ゲート](refactor-phase-01-quality-gates-v1.md) | `refactor/01-quality-gates` | Phase 0 | 完了 |
| 2 | [依存・脆弱性](refactor-phase-02-dependency-security-v1.md) | `refactor/02-dependency-security` | Phase 1 | 完了 |
| 3 | [現行データ内部](refactor-phase-03-data-internals-v1.md) | `refactor/03-data-internals` | Phase 2 | 完了 |
| 4 | [Home性能](refactor-phase-04-home-performance-v1.md) | `refactor/04-home-performance` | Phase 3 | 完了 |
| 5 | [Client境界と一覧](../archive/refactor-phase-05-client-boundaries-v1.md) | `refactor/05-client-boundaries` | Phase 4 | **完了（2026-08-02）**。実績は [baseline](../reference/refactor-baseline-2026-07-26.md) の「Phase 5 after」。`/compare` のVM化のみ後続phaseへ送った |
| 6 | [UI・アクセシビリティ](refactor-phase-06-ui-accessibility-v1.md) | `refactor/06-ui-accessibility` | Phase 5 | 未着手 |
| 7 | [設定・セキュリティ・後片付け](refactor-phase-07-security-cleanup-v1.md) | `refactor/07-security-cleanup` | Phase 6 | 未着手 |

順序を入れ替えない。特に、依存更新を品質ゲートより前に行わず、Client propsの縮小をlocal data/validator境界より前に行わない。

### Phase 5 からの繰り越し（2026-08-02 起票）

Phase 5 は budget 目標と catalog 4 route の view model 化を達成して完了したが、次の3件を
後続 phase へ送った。**Phase 6 の着手前に、どの phase が引き取るかを決めること。**

| # | 内容 | 理由 | 参照 |
|---|---|---|---|
| 1 | **`/compare` の view model 化**（旧 Task 9） | `CompareClient` が raw `Robot[]` / `Manufacturer[]` を受け取る状態が残る。`/compare` にバイト上限は課しておらず削減効果は0だが、CMS移行では対応が要る。Phase 5 最大のリファクタで、DnD・favorite・URL復元が絡み壊れ方が静か | archive済み計画の Task 9 |
| 2 | **catalog 一覧の本文検索の代替** | Task 6 で検索対象を「cardが描画する文字列＋facet label」へ限定した。サイト全体検索ページが無いため退避先が無い。復活させる場合は build 時生成の静的 JSON を `public/` へ置く方式が候補 | baseline「Phase 5 after」 |
| 3 | **共有フロア 588,395 の削減** | `3_4rbxe62x5-h.js`（67,853）が `sonner`・`lucide`・`@vercel/analytics` を含み、`layout.tsx` の `<Toaster />` により `/privacy` のような静的ページにも配信されている。`motion/react` も Home 側 4 ファイルが使い続けるため dependencies から外せていない | 同上 |


---

## 2. Phase 0: Git baseline

現在の固定点:

```text
main                              4c4d901
docs/refactor-planning-20260726   b2cdbe1 + 本計画commit
backup/pre-refactor-20260726      b2cdbe1
tag pre-refactor-20260726         b2cdbe1
stash@{0}                         safety: preserve pre-existing archive edit before refactor
```

- [x] 既存のユーザー差分をpath限定stashへ隔離
- [x] `main`の4先行commitを維持
- [x] planning docsを専用branchへcommit
- [x] `npm run validate:data` 成功
- [x] `npm run build` 成功、157ページ生成
- [x] 外部source link timeoutをPR blockerから除外する方針を確定
- [x] backup branchとannotated tagを作成
- [ ] 本書とPhase 1〜7の計画をcommit
- [ ] 最終planning commitを指す`refactor/integration-20260726`を作成

Phase 0完了確認:

```bash
git status -sb
git show-ref --verify refs/heads/backup/pre-refactor-20260726
git show-ref --verify refs/tags/pre-refactor-20260726
git show-ref --verify refs/heads/refactor/integration-20260726
git stash list
```

Expected:

- working treeがclean
- backup branchとtagが`b2cdbe1`を指す
- integration branchが最終planning commitを指す
- `stash@{0}`が保持されている

---

## 3. Phase branchの開始手順

各phaseの開始時に、前phaseがintegrationへ反映済みでgreenであることを確認する。

```bash
git checkout refactor/integration-20260726
git status -sb
npm ci
npm run check
git checkout -b refactor/01-quality-gates
```

Phase 2以降は最後のbranch名だけを対象phaseへ置換する。`npm run check`がまだ存在しないPhase 1開始時だけ、次をbaseline gateとする。

```bash
npm ci
npm run validate:data
npm run build
```

Expected: すべてexit 0。失敗時はphase branchを作らず、integration上の回帰として調査する。

---

## 4. Phase完了gate

各phase branchで次を順番に行う。

```bash
git status -sb
git diff --check
npm run check
git diff --stat refactor/integration-20260726...HEAD
git log --oneline refactor/integration-20260726..HEAD
```

追加gate:

| Phase | 追加確認 |
|---|---|
| 1 | CI workflow syntax、Chromium E2E、scheduled link checkがPR workflowから分離 |
| 2 | `npm audit --omit=dev`、lockfile diff、直接依存の利用箇所 |
| 3 | validator parity、`data/*.ts` value import inventory |
| 4 | Home HTML bytes、world-map data URI件数、390/1440 screenshot |
| 5 | route別client gzip、URL back/forward、filter共有URL |
| 6 | axe、keyboard、focus restoration、390/768/1280/1440 screenshot |
| 7 | response headers、analytics network request 0件、最終baseline比較 |

結果を対象phase計画のチェックボックスと「実測結果」節へ追記してからreviewする。成功していないphaseはintegrationへmergeしない。

---

## 5. Integrationへの反映

review済みphaseだけをno-fast-forwardで反映する。

```bash
git checkout refactor/integration-20260726
git merge --no-ff refactor/01-quality-gates
npm run check
```

Expected: merge後もexit 0。失敗した場合はmerge commitを公開せず、対象phase branchで修正する。既存commitの書換えやforce-pushで隠さない。

各merge後に、次phase branchは更新済みintegrationから作る。複数phase branchを古いintegrationから並行作成しない。

---

## 6. Mainへの反映条件

`main`へ反映できる最小単位は1phase。ただしPhase 3とPhase 5は途中状態を公開しない。

- Phase 3: local snapshot境界とvalidator分割を同一phaseで完了
- Phase 5: 1つの一覧について、view model化とHistory API化を同一taskで完了
- Phase 6: 表示変更には該当viewportのscreenshotを添付
- Phase 7: analytics opt-in化とheader testを同一phaseで完了

最終反映前:

```bash
git checkout refactor/integration-20260726
npm ci
npm run check
npm audit --omit=dev
git diff --check main...HEAD
```

`critical`は0件必須。残る`high`がある場合は、package、advisory、到達可能性、暫定対策、追跡先をPhase 2の監査文書へ記録する。

---

## 7. 中止・rollback条件

次のいずれかが起きたらphaseをintegrationへmergeしない。

- URL、`id`、`slug`、公開件数が意図せず変化
- 現行データvalidation errorが増加
- 主要routeで5xx、hydration error、document overflowが発生
- Home HTMLまたは対象route client gzipが改善前より悪化し、理由を説明できない
- analyticsが未設定でも送信される
- security headerにより画像、Formspree、analytics、Vercel runtimeが壊れる

復元点:

```bash
git switch backup/pre-refactor-20260726
git switch --detach pre-refactor-20260726
```

これは閲覧・検証用であり、backup branchやtag上へ作業commitを追加しない。

---

## 8. CMS / DB移行との境界

今回の完了後も`data/*.ts`が正本である。Payload CMS + managed PostgreSQLへの物理移行は [`content-platform-migration-plan-v1.md`](content-platform-migration-plan-v1.md) を別programとして実行する。

今回作る境界のうち将来も維持するもの:

- domain型
- local content snapshot
- collection / cross-collection validator
- server側view model
- UIが必要な値だけを受け取るprops
- URL・filter contract

移行時に初めて追加するもの:

- Payload schema / Admin / access control
- Postgres adapter
- async repository
- importer / exporter / parity checker
- draft / preview / publish
- Codex MCP

---

## 9. Backlog（Phase 7完了後）

- **HomeのworldMap動き復活**（2026-07-30、ユーザー要望）: Phase 4で自動スクロール／ドラッグを完全に削除したが、これは容量削減（4.2MB→326KB）の必須要件ではなかった（主因はTask 1のstatic asset化）。単一canvas・単一DOM・static asset・アクセシビリティ制約を維持したまま動きを復活させる再設計を、Phase 5〜7完了後に別plan（`refactor-phase-08-home-map-motion-v1.md`等）として起票する。詳細は[`refactor-phase-04-home-performance-v1.md`](refactor-phase-04-home-performance-v1.md)のFollow-up節を参照。
