# Phase 5 セッション引き継ぎ

> **この文書は一時ファイル。** 引き継ぎ完了後は削除してよい。
> 恒久的な情報（制約・task・実測値）は計画書側にあり、ここには**重複させない**。
> ここに書くのは「計画書を読んでも分からないこと」だけ。

作成: 2026-08-01 / 更新: 2026-08-02 / 対象branch: `refactor/05-client-boundaries`

---

## 0. 最初に読むもの（この順）

| # | ファイル | 何が書いてあるか |
|---|---|---|
| 1 | 本ファイル | git状態、経緯、決定の理由、既知の罠 |
| 2 | `docs/plans/refactor-phase-05-client-boundaries-v1.md` | **Phase 5の正本**。制約・実測baseline・Task 1〜10 |
| 3 | `docs/plans/pre-migration-refactor-implementation-index-v1.md` | プログラム全体（Phase 0〜7）の正本 |
| 4 | `docs/plans/pre-migration-refactor-safety-design-v1.md` | branch運用・安全設計のルール |
| 5 | `.superpowers/sdd/refactor-phase-05-client-boundaries-v1/progress.md` | 実行台帳（旧task番号ベース。§5参照） |

`AGENTS.md` → `ai/rules/00-index.md` → 各work-type ruleも通常どおり適用される。

---

## 1. 未コミットの変更はない（2026-08-02 時点）

計画書の書き直し（1,693行 → 2,163行、5 task → 10 task）は commit `cf9864c` で保存済み。
書き直しの主体は人間（ユーザー）。AIによる改訂commit（`a1fb180`〜`020f2ca`）を踏まえたうえで、
実測値から構成し直したもの。理由は計画書冒頭「この計画の書き直しについて」節にある。

**main checkout側の同名ファイルは旧972行版のまま。** 書き直し版はこのworktreeのbranchにのみ
存在する。ファイルを開くときはパスを確認すること。

---

## 2. 何の一部か

CMS/DB移行（Payload CMS + Supabase Postgres）の**前段**として走る、7 phaseのリファクタプログラム。
移行そのものは `docs/plans/content-platform-migration-plan-v1.md` に保留中。
今は「移行を妨げている問題を、`data/*.ts` を正本のまま段階的に解消する」段階。

```
main（= origin/main。PR#5でPhase 2相当まで反映済み）
└ backup/pre-refactor-20260726 ＋ tag pre-refactor-20260726  ← 復元点
   └ refactor/integration-20260726   ← mainより26 commit先行
      ├ refactor/01-quality-gates       ✅ merge済み
      ├ refactor/02-dependency-security ✅ merge済み
      ├ refactor/03-data-internals      ✅ merge済み
      ├ refactor/04-home-performance    ✅ merge済み
      ├ refactor/05-client-boundaries   ← 現在地
      ├ refactor/06-ui-accessibility    未着手
      └ refactor/07-security-cleanup    未着手
```

**Phase 3・4分はintegrationに溜まったままmainへ未反映。** これはPhase 5の作業とは独立の判断事項
（safety design §4.3 ルール9: Vercelプロジェクトへlink済みのため、mainへのpush前に本番デプロイ
誘発の有無を確認する）。

---

## 3. 作業場所

```
worktree: /Users/hori/Desktop/Humanoid_curation_website/Deploid_toB/.worktrees/refactor-05-client-boundaries
branch:   refactor/05-client-boundaries（integration HEAD 68cda0e から分岐）
```

`.worktrees/` は `.gitignore` 済み（commit `68cda0e`）。
**main checkoutで作業しないこと。** safety designがintegrationへの直接commitを禁止している。

シェルの作業ディレクトリは`cd`で持続する。main checkoutとworktreeを取り違えると、
同じパスの別バージョンを見て誤った結論を出す（このセッションで実際に起きた）。

---

## 4. 実装済みのもの

commit済みは2 task分のみ。**いずれも旧計画のtask番号**であり、新計画のTask 1〜10とは無関係。

| commit | 内容 |
|---|---|
| `611b5a7` | catalog filterをHistory API化。`lib/catalog/urlState.ts`・`urlSearch.ts`新設、`lib/useUrlParamUpdater.ts`削除 |
| `918f058` | 上の副作用修正。`pushState`ではGA page viewが飛ばなくなる問題（`next/navigation`のhookが生の`history.pushState`を観測しないため） |
| `f42ecbf` | Robot/Manufacturer一覧のview model化。`lib/viewModels/{shared,logo,robots,manufacturers}.ts`新設、card系のmotion除去 |
| `a1fb180`〜`020f2ca` | 計画書の改訂4件（コードは変更していない） |

**現存するファイル:** `lib/catalog/{urlState,urlSearch}.ts`、`lib/viewModels/{shared,logo,robots,manufacturers}.ts`

**存在しないファイル**（計画に出てくるが未実装。誤って「あるはず」と思わないこと）:
`lib/catalog/search.ts`、`scripts/check-catalog-payload.mjs`、`scripts/check-plan-snippets.mjs`、
`scripts/check-client-bundle-content.mjs`、`scripts/check-client-import-graph.mjs`

**未達の制約:** `lib/viewModels/robots.ts:73` は現在も
`createCatalogSearchText(createRobotSearchDocument(...))` であり、本文が`searchText`へ連結されて
clientへ渡っている。Global Constraint「本文をVMへ含めない」は**未達**。新計画のTask 6が担当。

### 新計画の進捗（2026-08-02）

| commit | 内容 |
|---|---|
| `1bed216`〜`0b596c4` | 計画書の修正（内部監査7件＋外部レビュー7件。コード変更なし） |
| `263aa0c` | **Task 1** `/reports`の生data 705,431バイト除去 |
| `0d6826f` | Task 1の実測を計画書へ反映（budoux発見。改訂履歴 #15） |
| `4687a80` | 引き継ぎメモ更新 |
| `779901f` | **Task 2** gate 3本導入。全て緑 |
| `df3d223` | **Task 3** card系のmotion除去 |
| `d6d57b0` | **Task 4** carousel系のmotion除去 |
| `c1ca425` | **Task 5** `normalizeSearchText`分離 |
| `b167fa1` | **budoux除去**（計画に担当taskが無かった作業） |

復元点tag: `phase05-task01`〜`task05-20260802`、`phase05-budoux-20260802`。

**現在のroute固有JS（着手前 → 現在）:**

| route | 着手前 | 現在 | budget 180,000 |
|---|---:|---:|---|
| `/reports` | 1,233,689 | **135,713** | 達成 |
| `/use-cases` | 268,207 | **129,672** | 達成 |
| `/manufacturers` | 178,411 | **172,833** | 達成 |
| `/robots` | 325,787 | **184,569** | 4,569超過。**追加作業はしない（決定済み）** |

`/robots`の残りはRadix・floating-ui・日本語UI文字列で、Task 6〜9はどれも扱わない。
180,000は計画書自身が暫定値と書いていた数字なので、Task 10で実測から確定する。

**Task 6〜9はバイトではなくCMS移行のためのVM化である。** Task 6は「VM構造変更」と
「searchTextのwhitelist化（＝本文検索の喪失）」を束ねており、後者はJS目標に0バイトしか
寄与しない不可逆なproduct判断。**着手前に分割の可否を決めること**（計画書のTask 6冒頭に注記あり）。

## 5. SDD台帳（リセット済み）

`.superpowers/sdd/refactor-phase-05-client-boundaries-v1/` に実行台帳がある
（`superpowers:subagent-driven-development` skillが使う。git ignore対象）。

計画書のtask番号振り直しに合わせて**台帳はリセット済み**。

| ファイル | 内容 |
|---|---|
| `progress.md` | 新計画用。リセットの経緯と、旧task↔commitの対応表のみ。進捗記録は空 |
| `progress-old-plan-archive.md` | 旧計画の台帳。経緯の参照用 |
| `task-{1,2}-{brief,report}.md`、`review-*.diff` | 旧計画のもの。新計画とは対応しない |

**旧台帳のtask番号を新計画へ読み替えないこと。** 新Task 1は `/reports` の生data除去であり、
旧計画には存在しなかった作業。読み替えると完了済みtaskを再実行することになる
（skillが「最も高コストな失敗」と警告しているもの）。

---

## 6. 決定済みの事項（再検討しないこと）

いずれも実測と人間の裁定を経ている。理由の詳細は計画書側にある。

| 決定 | 一行要約 |
|---|---|
| MiniSearchは**維持** | 削減は実測18,690バイトのみ。日本語検索品質（fuzzy 0.2、`Intl.Segmenter('ja')`）を落とす対価に見合わない。索引する文字列だけをcatalog searchTextへ差し替える |
| JS目標は**route固有JSの絶対値** | 旧「総量から30%削減」は算術的に達成不能だった（共有フロア591,394が総量の64%） |
| `searchExtra`方式は**見送り** | 削減分はRSC payloadでありJS目標に寄与しない。4 collectionで`searchText`統一 |
| catalog検索範囲を**card表示＋facet labelに限定** | 本文全文検索は失われる。サイト全体検索ページが存在しないため退避先も無い。代替は後続phase |
| bundle検査は**record slugカウント** | field名markerは実測で10 chunkにhit・8件誤検知。slug方式は133/133で誤検知0 |

---

## 7. 既知の罠

**① 計画書の散文とコード例が食い違う（3巡連続で発生）**

「散文で決めたことがコード例・step・表のどれかに反映されない」という故障モードが3回起きた。
3回目は`useCase.description`（存在しないfield。実際は`subtitle`/`summary`）を、
「`UseCase`に`description`は存在しない」と書いた3段落上のコード例で使っていた。

対策は新計画のTask 2にある`scripts/check-plan-snippets.mjs`（計画書の`ts` blockを`tsc --noEmit`に
かける）。**目視確認と対応表では防げないことが実証済み。**

**② `data/types.ts` を見ずにフィールド名を書かない**

`UseCase`の実フィールドは `atAGlance` `buyerReadiness` `candidateRobots` `capabilityNotes`
`environment` `environmentRequirements` `industryTags` `japanDeploymentConditions` `maturityLevel`
`overview` `primaryIndustry` `requiredCapabilities` `subtitle` `taskTags` `title` `titleJa`
`whyHardToday` `whyItMatters` ＋ `BaseRecord`（`id` `slug` `summary` ほか）。
`description`は無い。labelは`maturityLabels`（`useCaseMaturityLabels`ではない）。

**③ 測定は必ずフレッシュビルドで**

`.next/` が古いまま計測すると誤った結論に至る。ルート固有JSは
`route-bundle-stats.json` の `firstLoadChunkPaths` から共有フロア（`/privacy`のchunk集合）を
引いて算出する。総量（`firstLoadUncompressedJsBytes`）を見ると共有フロアに埋もれて差分が見えない。

**④ RSC payloadとJS chunkは別物**

server→client propsはJS chunkではなくRSC flight payloadに載る。PPRのため
prerendered HTMLにも現れず、request時にstreamされる。
`check-client-budgets`（JS）で`searchText`の肥大は検知できない。逆にVM側のgateでは
import chain経由のbundle流出を検知できない。**両方が要る。**

---

## 8. 経緯（なぜ実装が止まって計画改訂に入ったか）

セッションはPhase 4のUIバグメモ整理から始まり、Phase 5に着手。旧Task 1・2を実装した。

旧Task 2のコードレビューで「計画書のコード例通りに実装するとGlobal Constraint違反になる」
という指摘が出た。計画そのものに矛盾があったため、実装を止めて計画修正へ切り替えた。

以降、外部AIレビューを3巡回した（改訂commit `a1fb180` → `3f11870` → `4ec93dd` → `020f2ca`）。
各巡で判明したことは計画書冒頭の表にまとまっている。根本原因は
**初版が実測せずに書かれていたこと**。

その後ユーザーが計画書を実測値から全面的に書き直した（§1の未コミット変更）。

---

## 9. 次の一手

**Task 6の分割可否を決める** — VM構造変更だけ実施するか、searchTextのwhitelist化も含めるか。
判断材料は計画書のTask 6冒頭の注記。

その後はTask 6（VM化のみ）→ 7 → 8 → 9 → 10の順。Task 10で実測から budget を確定する。

**budgetのためにやることはもう残っていない。** Task 1〜5とbudoux除去で
`/robots`を除き達成済み。以降はCMS移行のための構造変更である。

---

## 10. 環境メモ

- `npm run check` が全gateのpipeline。個別scriptは `package.json` を参照
- e2eは`npm run test:e2e`。**専用port 3399で毎回自前のサーバを起動する**（`reuseExistingServer: false`）。
  2026-08-02まではport 3000を既存サーバごと再利用しており、親checkoutのサーバに当たって
  **いま書いたコードを一度もテストしないまま全件緑になる**状態だった。実際に発生したため修正済み。
  portが塞がっている場合はエラーで止まる（静かに間違えるより安全）。
- Node 22系。`data/*.ts`を読むscriptは`--experimental-strip-types`付き
- Vercelプロジェクトへlink済み（safety design §4.3 ルール9）
