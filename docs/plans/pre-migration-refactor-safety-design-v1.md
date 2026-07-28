---
status: plan
updated: 2026-07-28
---

# CMS / DB 移行前リファクタリング安全設計 v1

## 0. 決定

CMS / DB 移行は実施せず、現行の `data/*.ts` を正本としたまま、将来の移行を妨げている品質・責務・性能・UI・セキュリティ上の問題を段階的に解消する。

実行方式は **安全網先行 + integration branch + phase branch** とする。

- `main` の既存履歴を rebase / squash / force-push しない
- 現行の公開URL、データ、表示内容を各phaseの回帰基準とする
- 1つの巨大PRを作らず、独立して検証可能な単位へ分ける
- CMS / DB 固有の抽象化を先回りして作らない
- 現在価値があり、保存先変更後も残る責務だけを整理する

詳細な作業手順は [`pre-migration-refactor-implementation-index-v1.md`](pre-migration-refactor-implementation-index-v1.md) と、そこから参照するPhase 1〜7の実装計画を正本とする。

---

## 1. 目的

次の状態を、外部CMSやDBなしで実現する。

1. 依存更新や大規模変更を安全に行える自動検証がある
2. 現行データの参照・検証・表示変換の責務が分離されている
3. TS配列の物理配置を将来変更しても、ページ側の変更を局所化できる
4. Homeと一覧ページのHTML・client bundleが適正化されている
5. UIが見た目だけでなく、semantic HTML、keyboard、mobileで成立する
6. analytics・環境変数・security headersが明示的に管理されている
7. 各phaseを独立してrevertできる

---

## 2. 今回のスコープ

### 2.1. 実施する

- Git履歴、未コミット差分、復元点、branchの整理
- lint、typecheck、unit test、E2E、CI
- Next.jsを含む既知脆弱性の修正
- `lib/validate.ts` の責務分割
- `data/*.ts` import箇所の隔離
- `lib/data.ts` の公開APIを維持した内部分割
- map、国コード、表示順などのハードコード整理
- Homeの巨大SVG / HTML問題の解消
- Client Component境界と一覧用propsの縮小
- ReportsのH1、header、carousel、keyboard、focusの改善
- analytics既定値、環境変数、security headersの整理
- 不要依存・不要コード・古い文書参照の整理

### 2.2. 実施しない

- Payload CMS packageの導入
- PostgreSQL、Supabase、object storageへの接続
- Payload collection、Admin、MCP、draft / publish
- importer、parity checker、DB migration
- local / CMSのdual source切替
- 本番データの物理移行
- 将来DBを想定した汎用ORM・汎用repository framework
- 公開URL、id、slug、データ意味の変更
- 全面リデザイン

CMS / DB 移行は [`content-platform-migration-plan-v1.md`](content-platform-migration-plan-v1.md) に保留する。

---

## 3. 採用方式と比較

### 採用: 安全網先行

品質ゲートを作ってから依存・構造・性能・UIを変更する。初期成果は見えにくいが、後続変更の失敗検出とrollbackが最も確実になる。

### 不採用: 性能先行

Homeの4MB超HTMLを最初に直すため効果は早い。しかし、E2Eとbundle基準がない状態では表示回帰やmobile崩れを検出しにくい。

### 不採用: データ抽象化先行

将来移行の準備は早いが、CMSのquery、draft、relationship仕様が未導入の段階でasync repository等を作ると、移行時に作り直す可能性がある。

したがって、現在必要な **validation、local data access、view model** の境界までは整理し、CMS adapter境界は移行時に導入する。

---

## 4. Git安全設計

### 4.1. 現状

- local `main` は `origin/main` より4コミット先行
- 4コミットはspec schema、メーカー記事分割、その計画とarchive更新であり、履歴を保持する
- CMS / DB方針と全体roadmapは `docs/refactor-planning-20260726` のcommit `c1f3f58` に分離済み
- `docs/archive/manufacturer-guide-per-file-split-plan-v1.md` の既存未コミット差分は、今回の計画commitへ含めない
- workspace直下の `README.md` はnested repository外のため、Git branchの復元対象外
- `origin/main`がこの4コミット分local `main`より遅れている間、`refactor/integration-20260726`ベースのPRの差分にはこの4コミットが混入する

### 4.2. Branch構成

```text
main
└─ docs/refactor-planning-20260726
   ├─ backup/pre-refactor-20260726
   └─ refactor/integration-20260726
      ├─ refactor/01-quality-gates
      ├─ refactor/02-dependency-security
      ├─ refactor/03-data-internals
      ├─ refactor/04-home-performance
      ├─ refactor/05-client-boundaries
      ├─ refactor/06-ui-accessibility
      └─ refactor/07-security-cleanup
```

### 4.3. 運用ルール

1. `backup/pre-refactor-20260726` とannotated tagを、検証済みplanning commitへ固定する
2. 実装は `refactor/integration-20260726` へ直接commitしない
3. 各phase branchはintegrationの最新green commitから作る
4. phase内でも、test追加と実装を意味のある小commitへ分ける
5. phase完了時にdiff review、validate、test、build、対象E2E、性能計測を行う
6. 失敗したphaseはintegrationへmergeせず、branchを保持して原因を調査する
7. `main` 反映はphase単位でreview可能な状態になってから行う
8. force-push、`git reset --hard`、既存commitの書換えを通常手順に含めない
9. `main`のfast-forward pushは本refactorと分離して判断する。リポジトリはVercelプロジェクト（`team_ijw72r...`/`prj_uij9sR...`）へlink済みのため、実行前に本番デプロイ誘発の有無を確認する

既存archive差分はpath限定stashに隔離し、refactor branchへ持ち込まない。内容の採否は別作業として扱う。

---

## 5. 実施順序

### Phase 0: Git baseline

- planning docsを独立commitにする
- 既存archive差分を隔離する
- working treeをcleanにする
- `validate:data`、production buildを実行する
- source link checkは外部サイトのtimeoutを含む診断結果として保存する
- baselineの件数、主要URL、HTMLサイズ、route別client bundleを記録する
- backup branchとannotated tagを作る

完了条件:

- clean working tree
- baseline commandsがすべて成功
- 現行commitへ1コマンドで戻れる
- refactor対象外の差分がphase branchへ存在しない

### Phase 1: 品質ゲート

- `typecheck`、ESLint、Vitest、Playwrightを追加する
- 現行data validationをunit testから呼べる境界へ整理する
- 主要index/detail、slug redirect、sitemap、390px overflowをE2E化する
- GitHub Actionsで同じcheckを実行する
- source link checkはretry付きのscheduled workflowに分離し、外部timeoutだけでPRをblockしない
- dependency automationは更新PRを作るだけにし、自動mergeしない

完了条件:

- `npm run check` でvalidate、type、lint、unit、build、E2Eが実行される
- PRとlocalで同じ検証コマンドを使える
- 既存157ページ相当と主要URLが維持される

### Phase 2: 依存・脆弱性

- Next.jsを監査時点の修正版へ更新する
- runtime依存とtransitive dependencyを監査する
- `shadcn` packageがruntimeに必要か確認し、不要なら削除する
- 1dependency群ずつ更新し、lockfile差分をreviewする
- high vulnerabilityが残る場合は到達可能性と対応方針を記録する

完了条件:

- critical vulnerabilityが0
- 残るhighに根拠と追跡先がある
- build、E2E、主要画面が更新前と一致する

### Phase 3: 現行データ内部の整理

- `lib/validate.ts` をcommon、collection、cross-collection、orchestratorへ分割する
- validatorを副作用のない関数としてtest可能にする
- `data/*.ts` の物理importを限定したlocal data moduleへ集約する
- `lib/data.ts` は既存ページ向けfacadeとして残す
- slug、id、publish status、relationshipの意味を変えない
- map特例、country code、表示順など、再利用される規則をdomain registryへ移す

完了条件:

- validatorをcollection単位でtest可能
- ページとUIが `data/*.ts` を直接importしない
- 現行 `lib/data.ts` の利用側を一括変更しない
- CMS固有interfaceや空の汎用repositoryを作らない

### Phase 4: Home性能

- dotted-mapのSVGを静的assetとして一度だけ生成する
- 同一data URIの3重埋込みを廃止する
- map描画とanimationを必要なviewportだけで動かす
- Unitree / Shanghai固有分岐を一般化する
- reduced motionで連続animationを停止する

完了条件:

- Home raw HTMLが500KB未満
- HTML / RSC内のworld-map SVG data URIが0件
- Homeの表示内容、arc、mobile幅が回帰testを通る

### Phase 5: Client境界と一覧

- 一覧へ渡す値をcard / filter用view modelへ限定する
- favorite、drag、search、carousel等の操作だけをclient islandにする
- 全件client filterと`router.push`によるRSC再取得の二重処理を解消する
- 現件数では小さいview model + client filterを採用し、DB query方式は導入しない
- CompareClientとReportsBrowserを責務別に分割する

完了条件:

- 主要一覧へraw domain record全体を渡さない
- route別client gzipを監査基準から30%以上削減する
- filter状態とURL共有が従来どおり動く

### Phase 6: UI・アクセシビリティ

- `/reports` に一意なH1と説明を置く
- list / detail / contextual headerの責務を整理する
- horizontal scrollとcarouselへ名称、操作説明、prev / next、pause、現在位置を付ける
- dialog、drawer、popoverのfocus restorationを検証する
- hover animationを情報取得の必須条件にしない
- 390 / 768 / 1280 / 1440pxを回帰対象にする

完了条件:

- 全index/detailに一意なH1
- keyboardだけで主要操作が完了する
- 主要routeでdocument overflowがない
- 現行のeditorial broadsheet × product dashboard表現を維持する

### Phase 7: 設定・セキュリティ・後片付け

- GA / Clarityのコード既定値を削除し、明示設定時だけ有効化する
- production環境変数のvalidationを追加する
- `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`を設定する
- CSPはreport-onlyで互換性を確認してからenforceを別判断する
- 不要依存、到達不能コード、古い文書参照を削除する
- 最終の性能・a11y・security・bundle計測をbaselineと比較する

完了条件:

- analyticsが未設定時に送信されない
- security headersをE2Eで確認できる
- 全品質ゲートがgreen
- current docsが実装と一致する

---

## 6. データ移行への備え方

移行準備は「将来のCMS APIを今から模倣すること」ではない。次の境界を整えることで備える。

```text
data/*.ts
  ↓ local import boundary
pure selectors / validators
  ↓
lib/data.ts facade
  ↓
server page / view-model builder
  ↓
small client props
```

将来のCMS移行では、local import boundaryをPayload sourceへ置き換え、facade / view modelの契約を維持する。現時点ではDBのpagination、draft query、relationship depthを仮定しない。

---

## 7. エラー処理とrollback

- data validation errorはbuild前にexit code非0で停止する
- lint / type / unit / E2E / buildのどれかが失敗したcommitはphase完了としない
- dependency更新で回帰した場合は、対象更新commitだけをrevertする
- 性能改善で表示が変わった場合は、asset生成とUI変更を別commitにして原因を限定する
- integrationへmerge後に問題が判明した場合は、merge commitまたはphase commitをrevertし、履歴を書き換えない
- backup branch / tagは全phase完了まで削除・移動しない
- CMS / DB移行計画には本作業の未完了phaseを前提として持ち込まない

---

## 8. 検証戦略

### 全phase共通

```bash
npm run validate:data
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

`typecheck`、`lint`、`test`、`test:e2e` はPhase 1で追加する。Phase 0の必須gateは現存する `validate:data` と `build`。`check:source-links` は外部サイトのrate limit、timeout、bot対策に影響されるため、失敗URLを記録して再確認する非blocking診断とする。

### 変更領域別

| 領域 | 追加検証 |
|---|---|
| data / validator | 同一fixtureに対するerror codeと件数の一致 |
| dependency | `npm audit --omit=dev`、主要route smoke |
| Home | raw HTML、SVG出現数、1440 / 390px screenshot |
| catalog | route別client gzip、filter / URL / favorite |
| UI | axe、keyboard、focus restoration、4 viewport |
| security | response headers、analytics未送信 |

---

## 9. 全体完了条件

- mainの既存履歴を破壊していない
- CMS / DB関連のruntime依存を追加していない
- `data/*.ts` が引き続き唯一のコンテンツ正本
- 公開URL、id、slug、主要表示が維持される
- lint、type、unit、E2E、buildがCI必須
- known critical vulnerabilityが0
- `lib/validate.ts` と巨大Client Componentの責務が分割される
- Home HTMLとroute別client bundleが目標値を満たす
- Reports H1と主要keyboard問題が解消する
- analyticsとsecurity headersが明示設定になる
- 次のCMS / DB移行がlocal import境界の置換から開始できる
