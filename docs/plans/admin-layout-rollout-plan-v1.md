---
status: plan
updated: 2026-09-07
---

# Admin編集画面レイアウト整理のロールアウト計画 v1

## Context

`docs/decisions/admin-field-layout-v1.md`（Task 6）が、Manufacturersの編集画面を
sidebar（運用メタ）＋tabs（内容別）に整理するPOCを実装済み。同docの§3に、残り
8 collection/global（Robots・UseCases・Articles・Distributors・Deployments・
RobotSeries・ArticlePlacements・SiteSettings）向けの配置案も**設計だけ**書いてあるが、
実装はまだ無い——編集画面はManufacturers以外、全field縦一列のままで見にくい。

2026-09-07、ユーザーからの依頼で本計画を起票。同時に、Task 4/6の時点で
「スコープ外」として先送りされていた**配列fieldの追加ボタン英語表記**
（例:「Add Source」「Add Domestic Distributor」）の日本語化も、この計画へ含める
（ユーザー確認済み: 「翻訳タスクは計画に含めていいと思う」）。

**この文書は着手前にレビューを受け、指摘を反映して改訂したもの（v1改訂、2026-09-07）。**
指摘は3件のP1（実装不可能な型指定・完了条件の内部矛盾・検出漏れ）と5件のP2で、
全て本文へ反映済み。何を直したかは各セクションに明記する。

## 対象範囲と優先順位

`docs/decisions/admin-field-layout-v1.md` §3の設計案をそのまま使う（本書では複製しない）。
field総数はcollectionの「縦の長さ」の目安（共有field 10個 + collection固有fieldの合計、
2026-09-07に実際のfield定義を1つずつ数えて算出。目視の概算ではなく列挙して確認済み）。

| # | collection | 状態 | field総数 | 設計 |
|---|---|---|---|---|
| — | Manufacturers | ✅ 実装済み（Task 6 POC） | 29 | 実装済み。他タスクの参考実装 |
| T1 | Robots | 未実装 | 32 | `admin-field-layout-v1.md` §3 Robots。tabsあり |
| T2 | Articles | 未実装 | 29 | 同 §3 Articles。tabsあり |
| T3 | UseCases | 未実装 | 28 | 同 §3 UseCases。tabsあり |
| T4 | Distributors | 未実装 | 19 | 同 §3 Distributors。tabsあり |
| T5 | Deployments | 未実装 | 19 | 同 §3 Deployments。tabsあり |
| T6 | RobotSeries | 未実装 | 17 | 同 §3 RobotSeries。tabsあり |
| T7 | ArticlePlacements | 未実装 | 10 | 同 §3。**sidebarのみ、tabsは作らない** |
| T8 | SiteSettings（global） | 対象外と判定 | 4 | 下記「T8の判断」参照。**実装しない** |
| T9 | 配列fieldの追加ボタン日本語化 | 未実装 | 全collection横断（範囲は下記で確定） | 本書で新設 |
| T10 | 完了後の文書整理 | 未実装 | — | 本書で新設（レビュー指摘） |

### 着手順（レビュー指摘#7を反映）

**T9 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T10**。

T9を最初に独立させて実装する。理由は、T9が触る配列field（`sources`・
`domesticDistributors`・`priceOffers`・`loadRatings`・`candidateRobots`）は、
これから触るT1（Robots）・T3（UseCases）と重なっており、レイアウト変更と
ボタンlabel変更を同じPRで混ぜると、migration差分やUI回帰が出たときにどちらが
原因か切り分けにくくなるため。T9を先に完了・merge してから、T1以降のレイアウト
タスクへ進む。

T1〜T3を優先する: field総数がManufacturers（実装済み・29）以上で、現状最も縦に長い。

### T8の判断（レビュー指摘#2を反映——実装前に方針決定が必要だった項目）

`globals/SiteSettings.ts`の実体を確認した結果、**SiteSettingsには運用メタfieldが
そもそも存在しない**（`stableId`/`slug`/`lifecycleStatus`は個別collection専用の概念で、
globalは常に単一documentのためglobal定義コメントにも明記されている——他collectionと
同じ「sidebar=運用メタ」パターンを適用する対象が無い）。field自体も`defaultSeo`（group）・
`announcementBanner`（group）・`dataAsOf`（text）・`articleIndexPlacementLimits`（group）の
4つの直下fieldのみで（レビュー指摘#4: 全てgroupではなく`dataAsOf`はtext）、
tabsで分割するほどの縦の長さも無い。

**結論: T8は実装しない。** sidebar化する対象fieldが無く、tabs化が必要な量でもないため、
「変更不要」と判定する。この判断は`docs/decisions/admin-field-layout-v1.md`へ
**2026-09-07・実装着手前に記録済み**（同docの旧§3はSiteSettingsのsidebar fieldを明記して
おらず、ArticlePlacementsのfield数も誤っていた——レビュー指摘#4で見つかった不備。
`docs/plans/`側ではなく正本の決定文書を直接修正した。詳細はT10bの節を参照）。

## T1〜T6: 各collectionのtabs/sidebar化（tabsあり）

対象: Robots・Articles・UseCases・Distributors・Deployments・RobotSeries。

### 各タスク共通のFiles

- Modify: `collections/<Slug>.ts`（`partitionFieldsByName()`/`withSidebarPosition()`を
  `lib/payload/adminFieldLayout.ts`から使う。Manufacturers.tsと同じ構成）
- Modify（生成物）: `payload-types.ts`（レビュー指摘#5。下記「payload-types.tsの扱い」参照。
  再生成には後述の`npm run payload:generate-types`を使う——`getPayload()`起動時の
  自動生成には頼らない）
- New/Modify: `tests/content/admin-field-layout.test.ts`（レビュー指摘#3。下記「データ駆動
  テスト」参照。1タスク＝このファイルへ1エントリを追加する形にし、既存エントリは変更しない）
- `access.ts`側のshared field自体・data構造は変更しない

### 各タスク共通の完了条件

1. `partitionFieldsByName()`/`withSidebarPosition()`を対象collectionファイル内で使い、
   `docs/decisions/admin-field-layout-v1.md` §3の当該collectionの表通りに配置する
2. 振り分け漏れの機械検出（`unplacedFields`が`ADMIN_PUBLISH_INTENT_FIELD`以外を含んだら
   起動時にthrow）をManufacturers.tsと同じ形で実装する——**ただしこれは「置き場所がゼロ」
   しか検出できない（レビュー指摘#3）。誤配置・重複登録・順序違い・sidebar付け忘れは
   検出できないため、次の3を必ず併用する**
3. `tests/content/admin-field-layout.test.ts`へ当該collectionのエントリを追加し、
   次を固定する（レビュー指摘#3で要求された項目）:
   - sidebar field名の集合
   - tabのja/en labelと順序
   - 各tabのfield名と順序
   - 変更前後でvisible field集合が一致すること（tabs/sidebarへ振り分けても
     フィールドの追加・削除が起きていないことの機械証明）
   - hiddenな`adminPublishIntent`フィールドが保持されること
4. `npm run payload:migrate:create -- <slug>-layout --skip-empty`を実行し、
   `migrations/`内の最新JSON snapshotと現在のPayload schemaに差分がなく、
   **新しい`.ts`/`.json`が生成されないこと**を確認する（tabs/sidebarは表示専用でdata構造に
   影響しないことの実証）。**この確認はDBへ接続しない**（下記「migration検証の実際の仕組み」
   参照。レビュー指摘#2で誤った説明を訂正済み）
5. `npm run payload:generate-types`（下記「payload-types.tsの扱い」で新設）を実行し、
   再生成された`payload-types.ts`の変更前後で、interfaceのfield集合が同一であることを
   機械比較する。順序以外の差分が出たら、表示専用の変更ではなくなっているということなので、
   そこでコミットを止めて原因を調査する
6. 実dev server + Playwrightで、tabsの切り替え・sidebarの常時表示・nested groupの
   label表示を目視確認する（確認用DB・screenshotは確認後に削除）
7. `npm run typecheck` / `npm run lint` / 次のテストが通ることを確認する
   （レビュー指摘#6でコマンドをrepoの正規形へ修正済み）:
   ```
   npx vitest run tests/content/admin-field-layout.test.ts \
     tests/content/admin-field-labels.test.ts \
     tests/content/admin-select-labels.test.ts
   ```

### migration検証の実際の仕組み（レビュー指摘#2——当初の説明は実装と不一致だった）

当初案は「使い捨てDBに既存migrationを全適用した状態から、新migrationが生成されないことを
確認する」としていたが、これは実装と一致しない。`scripts/run-payload-migration-cli.mts:114`
（既存の migration wrapper）は`migrate:create`実行時に`disableDBConnect: true`を渡しており、
**`migrate:create`はDBへ接続しない**。実際の比較は次の2つの間で行われる
（`node_modules/@payloadcms/drizzle/dist/utilities/buildCreateMigration.js`）:

- `migrations/`内の最新JSON snapshot（ファイル）
- 現在のPayload configから生成したDrizzle schema（メモリ上、live DBを読まない）

したがって「使い捨てDBへmigrationを適用したこと」自体は、この検査結果に影響しない。
コマンド起動には`DATABASE_URL`を何か設定する必要があるため誤操作防止のためlocal throwaway名の
URLを明示する、という運用は変わらないが、**それは接続防止のための形式的な要件であって、
`migrate:create`自体がそのDBへ接続するわけではない**、と正確に理解しておく。

（DB適用そのものを検証したい場合は`npm run payload:migrate`の検証として別途行う。今回の
表示専用変更ではその検証は通常不要——`migrate:create`が新規migrationを生成しないことの
確認だけで十分）。

### payload-types.tsの扱い（レビュー指摘#5——`getPayload()`起動時の自動生成に頼らない）

Manufacturers POCの実績（`admin-field-layout-v1.md` §2）どおり、tabs/sidebar化は
field集合を変えなくても`payload-types.ts`の生成順序を変える。

**`getPayload()`実行後の型生成完了を完了条件に使わない**——インストール済み
Payload 3.87.1（`node_modules/payload/dist/index.js:359`）は起動時の型生成を
`void this.bin({ args: ['generate:types'], log: false })`という**fire-and-forgetで
実行しており、awaitしていない**。したがって`getPayload()`が返った時点で型生成がまだ
進行中の可能性があり、直後に`payload-types.ts`を読むと古い内容を比較してしまう
（さらに`migrate:create`はコマンド完了時に`process.exit(0)`するため、バックグラウンドの
型生成がファイル書き込み前に打ち切られるケースもある——タスクごとに結果が不安定になる）。

**対策**: 既存のmigration wrapper（`scripts/run-payload-migration-cli.mts`）と同じ流儀で、
`payload/node`が公開する`generateTypes()`（`node_modules/payload/dist/exports/node.js`）を
明示的にawaitするtsx scriptを新設する。

- New: `scripts/generate-payload-types.mts`（configをimportし、`generateTypes(config)`を
  awaitしてから終了する。`run-payload-migration-cli.mts`と同じ構成——config読み込み方法・
  エラー処理を揃える）
- Modify: `package.json`（`"payload:generate-types": "tsx scripts/generate-payload-types.mts"`
  相当のscriptを追加）

各タスクでの使い方:

1. `npm run payload:generate-types`を実行し、型生成の完了を待つ
2. 完了後の`payload-types.ts`を`git diff -- payload-types.ts`で確認し、変更前後で
   interfaceのfield名集合をソートして比較する（Manufacturers POCで実際に行った手順と同じ）
3. 順序以外の型変更（field追加・削除・型変更）が1件でもあれば、それは表示専用の変更では
   ないので、そこで作業を止めて原因を調査する。コミットしない

### 1 task = 1 commitの境界と順序制約（レビュー指摘#7）

各タスクは「対象collectionファイルの変更 + 生成された`payload-types.ts` +
`admin-field-layout.test.ts`への当該collectionエントリ追加」を1コミット・1PRにまとめる。

`payload-types.ts`と`tests/content/admin-field-layout.test.ts`は全タスクが共有するファイルの
ため、**T1〜T6は並行ブランチで進めず、1つずつ着手→merge→次、の順で進める**
（同じファイルへの同時変更によるconflict/生成物の巻き戻りを避けるため）。

## T7: ArticlePlacements（sidebarのみ、tabsは作らない）

レビュー指摘#2: 当初案は「共通完了条件（tabsの切り替え確認）」を全対象へ一律適用しており、
T7・T8がtabsを作らない方針と矛盾していた。T7は次の独立した完了条件を使う。

`collections/ArticlePlacements.ts`の実体（10 field）を確認済み:
`stableId`/`slug`/`previousSlugs`/`lifecycleStatus`（`baseContentFields()`由来の運用メタ）、
`surface`/`slot`/`articleId`/`order`/`kind`/`sponsor`（内容そのもの）。

### 配置

| 層 | 置き場所 |
|---|---|
| 運用メタ | sidebar: `stableId` `slug` `previousSlugs` `lifecycleStatus` |
| それ以外 | 通常領域（tabsで囲わず、そのまま縦並び）: `surface` `slot` `articleId` `order` `kind` `sponsor` |

`docs/decisions/admin-field-layout-v1.md` §3が既にこの sidebar 4fieldを明記しており、
本書はそれをそのまま採用する（tabsは作らない、という判断も同docと一致）。

### Files / 完了条件

T1〜T6と同じFiles構成（`collections/ArticlePlacements.ts`・`payload-types.ts`・
`admin-field-layout.test.ts`）。完了条件はT1〜T6の1・2・4・5・7と同じだが、
**3と6を次に置き換える**（tabsが無いため）:

- `tests/content/admin-field-layout.test.ts`のエントリで、sidebar field名の集合と
  visible field集合の不変性に加え、**「tabsを持たないこと」を明示的に検査する**
  （レビュー指摘#3の「T7・T8がtabsを持たないこと」を固定する項目）
- 実dev serverで、sidebarが常時表示されること・tabsが存在しないことを目視確認する

## T9: 配列fieldの追加ボタンの日本語化

`admin-field-layout-v1.md` §4に「Task 4/6のスコープ外」として明記されている積み残し。
`出典を追加`ではなく`Add Source`のように、配列field（`type: 'array'`）の行に対する
追加ボタンが英語のまま——Payloadは`labels.singular`（field単位、collection単位の
`labels`とは別設定）から自動生成するため、未設定だと英語のfield名がボタン文言になる。

### labelsの正しい型（レビュー指摘#1——当初案は型エラーになる指定だった）

`node_modules/payload/dist/fields/config/types.d.ts`の`Labels`型は
`singular`と`plural`の**両方が必須**:

```ts
export type Labels = {
  plural: LabelFunction | StaticLabel;
  singular: LabelFunction | StaticLabel;
};
```

当初案の`labels: { singular: { ja, en } }`（`plural`無し）は型エラーになる。
正しい指定は`labels: { singular: {ja, en}, plural: {ja, en} }`の形。

テストも「`singular.ja`/`singular.en`が非空」だけでなく、**`singular`・`plural`
両方が非空であること**を検査する。

### labelsの正本と具体的な翻訳値（レビュー指摘#2——当初案は値を決めていなかった）

このrepoではAdmin labelの正本は`lib/payload/adminFieldLabels.ts`に集約する方針
（同ファイル冒頭のD-3「ラベルは`collections/*.ts`に直接書かず、ここへ集約する」）。
`labels.singular`/`labels.plural`もfield定義へ直接文字列を書かず、同ファイルへ追加する
（推奨されたとおり後者を採用）。

`AdminFieldLabelMap`（`{name: {ja, en}}`、field単位のsingle labelを想定した既存の型）とは
別に、array行のsingular/plural両方を持つ新しい型を追加する:

```ts
export interface AdminArrayRowLabel {
  singular: AdminFieldLabel;
  plural: AdminFieldLabel;
}
```

対象5箇所の具体的な翻訳値（既存のfield単位label——例えば`sources: {ja: '出典', en: 'Sources'}`
——と表記を揃え、en singularは末尾の`s`を落とす、ja は単複同形のためsingular/pluralで
同じ文字列を使う）:

| 定義箇所 | export名 | singular | plural |
|---|---|---|---|
| `sourcesField()` | `sourcesRowLabels` | `{ja: '出典', en: 'Source'}` | `{ja: '出典', en: 'Sources'}` |
| `Manufacturers.domesticDistributors` | `manufacturersDomesticDistributorsRowLabels` | `{ja: '代理店', en: 'Distributor'}` | `{ja: '代理店', en: 'Distributors'}` |
| `Robots.priceOffers` | `robotsPriceOffersRowLabels` | `{ja: '価格情報', en: 'Price offer'}` | `{ja: '価格情報', en: 'Price offers'}` |
| `Robots.loadRatings` | `robotsLoadRatingsRowLabels` | `{ja: '可搬重量', en: 'Load rating'}` | `{ja: '可搬重量', en: 'Load ratings'}` |
| `UseCases.candidateRobots` | `useCasesCandidateRobotsRowLabels` | `{ja: '候補ロボット', en: 'Candidate robot'}` | `{ja: '候補ロボット', en: 'Candidate robots'}` |

各field定義側では`labels: sourcesRowLabels`のように定数をそのまま渡す（値をfield定義へ
直接書かない）。

### 対象範囲の確定（レビュー指摘#4——当初「全collection横断」は範囲が曖昧だった）

**対象は`tests/content/admin-field-labels.test.ts`の`TARGETS`と同じ集合に含まれる、
Admin上で編集可能なarray fieldのみ**とする。`TARGETS`自体は`ArticlePlacements`・
`Articles`・`Deployments`・`Distributors`・`Manufacturers`・`Media`・`Robots`・
`RobotSeries`・`UseCases`（+ globalとして`SiteSettings`相当）を指し、`admin.hidden: true`の
`AuditUploadSessions`・`EnvironmentMarker`は最初から除外されている（labelテストの
既存方針と一致させる。ボタン日本語化はエンドユーザーがAdminで実際に見る画面が
目的で、内部専用collectionは対象外というのが自然な線引き）。

**「定義箇所の数」と「実際にAdmin画面へ現れる箇所の数」を区別する**
（レビュー指摘#1）。`sources`は`lib/payload/access.ts`の`sourcesField()`という
**1つの共有定義**だが、`baseRecordContentFields()`経由で7 collection
（Articles・Deployments・Distributors・Manufacturers・RobotSeries・Robots・UseCases）
の画面へ展開される。したがって:

| 区分 | 件数 | 内訳 |
|---|---|---|
| **コード上の定義箇所**（実際に編集する場所） | 5 | `sourcesField()`（1箇所、7 collectionで共有）／`Manufacturers.domesticDistributors`／`Robots.priceOffers`／`Robots.loadRatings`／`UseCases.candidateRobots` |
| **Admin画面上の出現箇所**（テストが検査すべき件数） | 11 | `sources`×7 collection ＋ `domesticDistributors`×1 ＋ `priceOffers`×1 ＋ `loadRatings`×1 ＋ `candidateRobots`×1 |

`AuditUploadSessions.allowedObjects`（array field）は`admin.hidden: true`の
collectionに属するため対象外——確認済み。

**将来追加されるarray fieldも同じ機構で検出する**: 下記テストは対象collectionのfield定義を
再帰的に走査してarray fieldを見つける実装にし、**「検出された全arrayが`labels.singular`・
`labels.plural`のja/enを共に持つこと」を条件にする**（固定11件という数へ依存すると、
新しいarray fieldが増えた・減った場合にテストの意図と実装がずれる。レビュー指摘#1の
「固定件数ではなく検出ベースにする」を反映）。

### Files

- Modify: `lib/payload/adminFieldLabels.ts`（`AdminArrayRowLabel`型と対象5箇所の
  row label定数を追加。上表の翻訳値をそのまま定義する）
- Modify: `lib/payload/access.ts`（`sourcesField()`に`labels: sourcesRowLabels`を追加。
  7 collection分へ一括反映）
- Modify: `collections/Manufacturers.ts`（`domesticDistributors`に
  `labels: manufacturersDomesticDistributorsRowLabels`）
- Modify: `collections/Robots.ts`（`priceOffers`・`loadRatings`にそれぞれ対応するrow labels）
- Modify: `collections/UseCases.ts`（`candidateRobots`に`labels: useCasesCandidateRobotsRowLabels`）
- Modify: `tests/content/admin-field-labels.test.ts`（新規ファイルは作らない。理由は次項）

**新規テストファイルを作らない理由（レビュー指摘#1の再修正）**: 前回案は
`tests/content/admin-array-field-labels.test.ts`という新規ファイルで`TARGETS`相当を
再構築する設計だったが、これは`admin-field-labels.test.ts`・`admin-select-labels.test.ts`に
続く**3つ目の同一対象リストの複製**になり、「3つ目の重複が発生した時点で切り出しを検討する」
という前回自身の記述と矛盾していた。

「field label」と「配列行label」はどちらも同じ関心事（Admin fieldの翻訳完全性）であり
責務は離れていないため、**`tests/content/admin-field-labels.test.ts`へ検査を追加する**
（最小の変更で済み、新しいTARGETS複製を作らない）。具体的には、同ファイルが`TARGETS`を
再帰的に走査している既存ロジック（`collectUnlabeledAdminFieldPaths`と同じ考え方）に、
「array fieldを見つけたら`labels.singular`・`labels.plural`のja/en非空を検査する」
分岐を追加する形にする。

### 完了条件

- コード上の5箇所全てに、`lib/payload/adminFieldLabels.ts`で定義した対応するrow label定数が
  `labels`として付く（値を直接field定義へ書かない）
- `tests/content/admin-field-labels.test.ts`が、Admin画面上の11箇所（上表参照）を
  実際に検出し、`labels.singular`/`labels.plural`のja/enが揃っていることを確認する。
  かつ、今後array fieldが追加・削除されても固定件数に依存せず追従する
  （検出ベースの条件——上の「対象範囲の確定」節を参照）
- `npm run typecheck` / `npm run lint`が通る（`labels`の型を正しく満たしていることの確認）
- 実画面で「〇〇を追加」ボタンが日本語表示されることを目視確認する

T9は他タスクと違いtabs/sidebarを一切触らないため、`payload:migrate:create`確認や
`payload-types.ts`の再生成比較は不要（`labels`はUI表示専用でschemaに影響しない）。

## T10: 完了後の文書整理（レビュー指摘#8——当初計画に無かった）

T1〜T9が全て完了した後の最終タスク。実装のみで終わらせず、文書側を実態に合わせる。
`ai/rules/80-doc-governance.md`「Moving Documents」が「棚移動は path change であって
内容変更ではない。両方必要なら別commitに分け、移動を先・内容変更を後にする」と定めているため
（レビュー指摘#3）、**2つのcommit（T10a・T10b）＋最終検証（T10c）**へ分ける。T10cは
確認のみでcommitを作らない（`rg`・`npm run check`が失敗した場合のみ、そこで見つかった
問題を直す追加commitが必要になる）。

### T10a: 移動のみ（path changeのみ、本文は無変更）

`docs/plans/admin-layout-rollout-plan-v1.md`を`docs/archive/`へ`git mv`する。
このcommitでは本文を一切編集しない（`docs/archive/`配下は凍結対象——移動後に
このファイル自体を編集しない、という原則をここでも守る）。

### T10b: 他docの内容更新（T10aの後、別commit）

**ArticlePlacementsのfield数訂正とSiteSettingsの「変更不要」判断は、レビュー指摘#4を受けて
2026-09-07・実装着手前に`docs/decisions/admin-field-layout-v1.md`（frontmatter`updated`も
更新済み）へ反映済み。** `docs/plans/`は正本の決定文書を上書きできないため、この訂正は
T10まで待たず先に済ませてある（当初案はここをT10へ含めていたが、それは「決定文書の既知の
誤りを実装完了まで放置する」ことになり不適切だった）。

T10bで行うのは、T1〜T9の**実装結果**に関する更新のみ:

1. `docs/decisions/admin-field-layout-v1.md`の§3（T1〜T6の各collectionの設計案）を、
   実装結果へ書き換える。各collectionの実画面確認結果（tabsの切り替え確認・sidebar常時
   表示確認など、Manufacturers POCの§2と同じ形式）を追記する
2. 1の内容変更に伴い、`docs/decisions/admin-field-layout-v1.md`のfrontmatter`updated`を
   実施日へ更新する（`ai/rules/80-doc-governance.md`「Frontmatter」:「`updated`は内容が
   実質的に変わった時だけ更新する」に該当するケース）
3. `docs/README.md`の進行中一覧からこのロールアウト計画への言及を外す
   （移動先が`docs/archive/`になったため、旧パスへのリンクも修正する）

### T10c: 最終検証（T10bの後）

1. `rg --no-ignore admin-layout-rollout-plan-v1` 等で、移動前のパス
   （`docs/plans/admin-layout-rollout-plan-v1.md`）を指すlive参照
   （`docs/README.md`・他の計画doc・コード内コメント等）が残っていないことを確認する
   （`docs/archive/`配下からの参照は対象外——凍結済みのため直さない）
2. `npm run check`を実行し、通ることを確認する（レビュー指摘#2）。T10は`build`・
   `check:docs`・全Vitest・`check:dead-code`等、各タスクの部分テストではカバーしない
   repo標準ゲート一式を通す最終防波堤のため、個別タスクのtypecheck/lint/該当テストだけでは
   代替しない

## 実装しないこと

- `collapsible`型の採用（Manufacturers POCでtabsのみで要件を満たせたため）
- fieldの追加・削除・名前・型・data pathの変更（レビュー指摘#3で訂正——「並び替えをしない」
  ではない。`partitionFieldsByName()`は`names`配列の順序でfieldを返す
  （`lib/payload/adminFieldLayout.ts:37`実装通り）ため、**Admin上の表示順は
  `docs/decisions/admin-field-layout-v1.md` §3のsidebar/tab配置順へ意図的に変更する**
  ——Manufacturers POCでも実際に表示順・生成型のプロパティ順が変わっている。変更しないのは
  field自体（名前・型・data path・DB上の列）であって、画面上の見た目の並びではない）
- `docs/decisions/admin-field-layout-v1.md` §3の設計内容そのものの見直し
  （実装時に不整合が見つかった場合のみ、その場で改訂する。ArticlePlacements/SiteSettingsの
  記載漏れはレビュー指摘#4を受けて2026-09-07に修正済み——実装開始前に済ませてあるため、
  T10では扱わない）
- T8（SiteSettings）のsidebar/tabs化——運用メタfieldが存在せず、対象が無いため
