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

**この文書の時点では実装しない。** タスクの並び・完了条件を確定させるための計画書。

## 対象範囲と優先順位

`docs/decisions/admin-field-layout-v1.md` §3の設計案をそのまま使う（本書では複製しない）。
field総数はcollectionの「縦の長さ」の目安（共有field 10個 + collection固有fieldの合計、
2026-09-07に実際のfield定義を1つずつ数えて算出。目視の概算ではなく列挙して確認済み）。

| # | collection | 状態 | field総数 | 設計 |
|---|---|---|---|---|
| — | Manufacturers | ✅ 実装済み（Task 6 POC） | 29 | 実装済み。他タスクの参考実装 |
| T1 | Robots | 未実装 | 32 | `admin-field-layout-v1.md` §3 Robots |
| T2 | Articles | 未実装 | 29 | 同 §3 Articles |
| T3 | UseCases | 未実装 | 28 | 同 §3 UseCases |
| T4 | Distributors | 未実装 | 19 | 同 §3 Distributors |
| T5 | Deployments | 未実装 | 19 | 同 §3 Deployments |
| T6 | RobotSeries | 未実装 | 17 | 同 §3 RobotSeries |
| T7 | ArticlePlacements | 未実装 | 10 | 同 §3（sidebarのみ、tab不要と判断済み） |
| T8 | SiteSettings（global） | 未実装 | 4 | 同 §3（sidebarのみ、tab不要と判断済み） |
| T9 | 配列fieldの追加ボタン日本語化 | 未実装 | 全collection横断 | 本書で新設（下記） |

T1〜T3を優先する: field総数がManufacturers（実装済み・29）以上で、現状最も縦に長い。
T7・T8はfield数が少なく、`admin-field-layout-v1.md`も「tabsで分割するほどの量ではない」
と判断済みのため優先度は最も低い。

## T1〜T8: 各collectionのtabs/sidebar化

各タスクの完了条件はManufacturers POCと同一パターンにする
（`admin-field-layout-v1.md` §2「実画面での確認結果」を参照）。

1. `lib/payload/adminFieldLayout.ts`の`partitionFieldsByName()`/`withSidebarPosition()`を、
   対象collectionファイル内で該当tier名リストと共に使う（Manufacturers.tsと同じ構成）。
   `access.ts`側のshared field自体・data構造は変更しない
2. 振り分け漏れの機械検出（`unplacedFields`が`ADMIN_PUBLISH_INTENT_FIELD`以外を含んだら
   起動時にthrow）をManufacturers.tsと同じ形で実装する
3. `payload:migrate:create -- <slug>-layout --skip-empty`を使い捨てDBで実行し、
   既存migrationを全適用した状態から**新しいmigrationが生成されないこと**を確認する
   （tabs/sidebarは表示専用でdata構造に影響しないことの実証）
4. 実dev server + Playwrightで、tabsの切り替え・sidebarの常時表示・nested groupの
   label表示を目視確認する（確認用DB・screenshotは確認後に削除）
5. `npx tsc` / `npx eslint` / 対象collectionのlabel系テストが通ることを確認する

## T9: 配列fieldの追加ボタンの日本語化

`admin-field-layout-v1.md` §4に「Task 4/6のスコープ外」として明記されている積み残し。
`Source を追加`ではなく`Add Source`のように、配列field（`type: 'array'`）の行に対する
追加ボタンが英語のまま——Payloadは`labels.singular`（field単位、collection単位の
`labels`とは別設定）から自動生成するため、未設定だと英語のfield名がボタン文言になる。

### 対象の洗い出し（実装前に必須）

`type: 'array'`な全fieldを`collections/*.ts`・`lib/payload/access.ts`から機械的に
列挙し、`labels`未設定のものを一覧化する（T4のテストと同じ「機械検出＋テストで固定」の
形にする——目視での洗い出しに頼らない）。少なくとも次を含む見込み:
`sources`、`Manufacturers.domesticDistributors`、`Robots.priceOffers`、
`Robots.loadRatings`、`UseCases.candidateRobots`。T1〜T8で新しくtabs化する過程でも
配列fieldを触るため、**T1〜T8のどこかと同じPRでまとめるか、T9として独立させるかは
着手時に判断する**（配列を含むcollectionを触るタスクと合流させた方が手戻りが少ない可能性）。

### 完了条件

- 対象配列field全てに`labels: { singular: {ja, en} }`が付く
- 未対応の配列fieldを機械検出するテストを追加する（`tests/content/admin-field-labels.test.ts`
  へ追加、またはT4と同じ形の新規テストファイル）
- 実画面で「〇〇を追加」ボタンが日本語表示されることを目視確認する

## 実装しないこと

- `collapsible`型の採用（Manufacturers POCでtabsのみで要件を満たせたため）
- field自体の並び替え・削除・data構造の変更（表示専用の整理に限定する）
- `docs/decisions/admin-field-layout-v1.md` §3の設計内容そのものの見直し
  （実装時に不整合が見つかった場合のみ、その場で改訂する）
