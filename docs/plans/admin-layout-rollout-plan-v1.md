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
同じ「sidebar=運用メタ」パターンを適用する対象が無い）。field自体も`defaultSeo`・
`announcementBanner`・`dataAsOf`・`articleIndexPlacementLimits`の4つの直下groupのみで、
tabsで分割するほどの縦の長さも無い。

**結論: T8は実装しない。** sidebar化する対象fieldが無く、tabs化が必要な量でもないため、
「変更不要」と判定する。この判断は`docs/decisions/admin-field-layout-v1.md`へT10で
記録する（同docの現行§3はSiteSettingsのsidebar fieldを明記していなかった——これが
レビューで指摘された不備そのもの）。

## T1〜T6: 各collectionのtabs/sidebar化（tabsあり）

対象: Robots・Articles・UseCases・Distributors・Deployments・RobotSeries。

### 各タスク共通のFiles

- Modify: `collections/<Slug>.ts`（`partitionFieldsByName()`/`withSidebarPosition()`を
  `lib/payload/adminFieldLayout.ts`から使う。Manufacturers.tsと同じ構成）
- Modify（生成物）: `payload-types.ts`（レビュー指摘#5。下記「payload-types.tsの扱い」参照）
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
4. `npm run payload:migrate:create -- <slug>-layout --skip-empty`を使い捨てDBで実行し、
   既存migrationを全適用した状態から**新しいmigrationが生成されないこと**を確認する
   （tabs/sidebarは表示専用でdata構造に影響しないことの実証。レビュー指摘#6でコマンドを
   repoの正規形へ修正済み——`npm run`が抜けていた）
5. `payload-types.ts`が再生成されたら、変更前後のinterfaceのfield集合が同一であることを
   機械比較する（下記「payload-types.tsの扱い」）。順序以外の差分が出たら、表示専用の変更
   ではなくなっているということなので、そこでコミットを止めて原因を調査する
6. 実dev server + Playwrightで、tabsの切り替え・sidebarの常時表示・nested groupの
   label表示を目視確認する（確認用DB・screenshotは確認後に削除）
7. `npm run typecheck` / `npm run lint` / 次のテストが通ることを確認する
   （レビュー指摘#6でコマンドをrepoの正規形へ修正済み）:
   ```
   npx vitest run tests/content/admin-field-layout.test.ts \
     tests/content/admin-field-labels.test.ts \
     tests/content/admin-select-labels.test.ts
   ```

### payload-types.tsの扱い（レビュー指摘#5への対応）

Manufacturers POCの実績（`admin-field-layout-v1.md` §2）どおり、tabs/sidebar化は
field集合を変えなくても`payload-types.ts`の生成順序を変える。各タスクで:

1. `getPayload()`実行後に再生成された`payload-types.ts`をコミット対象に含める
2. 変更前のinterfaceと変更後のinterfaceで、field名の集合をソートして比較する
   （Manufacturers POCで実際に行った手順と同じ）
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
正しい指定は次の形（`sources`の例）:

```ts
labels: {
  singular: { ja: '出典', en: 'Source' },
  plural: { ja: '出典', en: 'Sources' },
},
```

テストも「`singular.ja`/`singular.en`が非空」だけでなく、**`singular`・`plural`
両方が非空であること**を検査する。

### 対象範囲の確定（レビュー指摘#4——当初「全collection横断」は範囲が曖昧だった）

**対象は`tests/content/admin-field-labels.test.ts`の`TARGETS`に含まれる、Admin上で
編集可能なarray fieldのみ**とする。`TARGETS`は`ArticlePlacements`・`Articles`・
`Deployments`・`Distributors`・`Manufacturers`・`Media`・`Robots`・`RobotSeries`・
`UseCases`（+ globalとして`SiteSettings`相当）——`admin.hidden: true`の
`AuditUploadSessions`・`EnvironmentMarker`は最初から除外されている（labelテストの
既存方針と一致させる。ボタン日本語化はエンドユーザーがAdminで実際に見る画面が
目的で、内部専用collectionは対象外というのが自然な線引き）。

2026-09-07時点で実コードを走査して確認した対象（5件、全て`TARGETS`内）:

| collection | field | 備考 |
|---|---|---|
| 複数（`lib/payload/access.ts`の`sourcesField()`を共有利用） | `sources` | shared field定義。1箇所直せば全collectionへ反映 |
| Manufacturers | `domesticDistributors` | |
| Robots | `priceOffers` | |
| Robots | `loadRatings` | |
| UseCases | `candidateRobots` | |

`AuditUploadSessions.allowedObjects`（array field）は`admin.hidden: true`の
collectionに属するため対象外——確認済み。

**将来追加されるarray fieldも同じ機構で検出する**: 下記テストは`TARGETS`を走査して
array fieldを再帰的に見つける実装にし、対象一覧をハードコードしない（新しいarray field
が追加されたときに人手の洗い出しへ戻らないようにする）。

### Files

- Modify: `lib/payload/access.ts`（`sourcesField()`へ`labels`追加）
- Modify: `collections/Manufacturers.ts`（`domesticDistributors`）
- Modify: `collections/Robots.ts`（`priceOffers`・`loadRatings`）
- Modify: `collections/UseCases.ts`（`candidateRobots`）
- New: `tests/content/admin-array-field-labels.test.ts`
  （`TARGETS`を再利用してarray fieldを再帰的に検出し、`labels.singular`/`labels.plural`の
  ja/en非空を検査する。既存の`admin-field-labels.test.ts`へ追加するとファイルの責務が
  「field label」と「配列行label」で混ざるため、新規ファイルに分離する）

### 完了条件

- 対象5箇所全てに`labels: { singular: {ja, en}, plural: {ja, en} }`が付く
- `tests/content/admin-array-field-labels.test.ts`が、対象5箇所を検出し、
  未対応のarray fieldが今後追加されたら機械的に検出してfailする
- `npm run typecheck` / `npm run lint`が通る（`labels`の型を正しく満たしていることの確認）
- 実画面で「〇〇を追加」ボタンが日本語表示されることを目視確認する

T9は他タスクと違いtabs/sidebarを一切触らないため、`payload:migrate:create`確認や
`payload-types.ts`の再生成比較は不要（`labels`はUI表示専用でschemaに影響しない）。

## T10: 完了後の文書整理（レビュー指摘#8——当初計画に無かった）

T1〜T9が全て完了した後の最終タスク。実装のみで終わらせず、文書側を実態に合わせる。

1. `docs/decisions/admin-field-layout-v1.md`の§3（「設計のみ、未実装」）を、実装結果へ
   書き換える。各collectionの実画面確認結果（tabsの切り替え確認・sidebar常時表示確認など、
   Manufacturers POCの§2と同じ形式）を追記する
2. 同docのT8（SiteSettings）の判断（本書の「T8の判断」節）を転記する——同docの現行§3には
   SiteSettingsのsidebar fieldの記載が無く、これが今回のレビューで指摘された不備そのもの
3. `docs/README.md`の進行中一覧からこのロールアウト計画への言及を外す
4. 本計画書（`docs/plans/admin-layout-rollout-plan-v1.md`）を`docs/archive/`へ移動する
   （`ai/rules/80-doc-governance.md`のreference/plan運用に従う）
5. 移動後、`rg --no-ignore admin-layout-rollout-plan-v1` 等で、移動前のパスを指す
   live参照（`docs/README.md`・他の計画doc・コード内コメント等）が残っていないことを確認する

## 実装しないこと

- `collapsible`型の採用（Manufacturers POCでtabsのみで要件を満たせたため）
- field自体の並び替え・削除・data構造の変更（表示専用の整理に限定する）
- `docs/decisions/admin-field-layout-v1.md` §3の設計内容そのものの見直し
  （実装時に不整合が見つかった場合のみ、その場で改訂する。ただしT8のsidebar fieldの
  記載漏れはT10で必ず埋める）
- T8（SiteSettings）のsidebar/tabs化——運用メタfieldが存在せず、対象が無いため
