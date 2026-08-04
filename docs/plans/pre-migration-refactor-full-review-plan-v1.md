---
status: plan
updated: 2026-08-05
---

# 移行前リファクタリング（Phase 1〜7）レビュー計画

作成 2026-08-04 / 対象: `backup/pre-refactor-20260726`（着手前）→ commit `d4bce81`（現在の main）

## 0. この文書の作り方と検証方針

ユーザー指定の14文書を**全文通読**し、そこに書かれている要求項目を1つも省略せず列挙した。
各項目について「今回のリファクタでレビュー対象になるか」を判定し、対象外と判定した項目も
**削除せず、理由つきでこの文書に残す**。省略・要約による見落としを避けるため。

**この文書内の事実主張はすべて、コマンドとその出力を伴う。** 推測・記憶からの転記は禁止し、
1つ前のターンで計算した数値であっても、この文書に書く際は同じコミットハッシュ
（`d4bce81`）に対して再実行し、出力を確認してから記載した（2026-08-04 実行）。
再現したい場合は各コードブロックのコマンドをそのまま打てば同じ結果になるはずである。

読んだ文書（14件、全文）:

| # | 文書 | 役割 |
|---|---|---|
| 1 | `ai/rules/00-index.md` | 入口・ルーティング |
| 2 | `ai/rules/10-workflow.md` | 計画・実装・レビュー全フェーズの共通手順 |
| 3 | `docs/decisions/ai_fullstack_development_guardrails_v1.md` | 実装レビュー（自己監査・チェックリスト） |
| 4 | `docs/decisions/editorial_style_guide_v1.md` | 解説記事の書き方 |
| 5 | `docs/decisions/robot-factcheck-research-prompt-2026-07-01.md` | メーカー・ロボットデータのファクトチェック |
| 6 | `ai/rules/20-data.md` | データ作業の参照ルーティング |
| 7 | `ai/rules/21-data-maintenance-workflow.md` | データ編集前のゲート（G1〜G11） |
| 8 | `docs/decisions/data-maintenance-checklist-v1.md` | データ追加・更新の実行チェックリスト |
| 9 | `ai/rules/30-ui-design.md` | UI・デザイン作業のルーティング |
| 10 | `docs/decisions/design_system_v1.md` | デザイン原則・トークン |
| 11 | `docs/decisions/ui_architecture_and_development_policy_v1.md` | UI構造・責務分離の方針 |
| 12 | `ai/rules/40-content-rights.md` | 画像・引用・権利センシティブ作業のルーティング |
| 13 | `docs/decisions/copyright_and_media_rights_policy_v1.md` | 著作権・商標・メディア権利ポリシー |
| 14 | `ai/rules/22-article-sourcing.md` | 記事候補の探し方 |

---

## 1. 対象範囲の確定（実測。2026-08-04、commit `d4bce81` に対して実行・確認済み）

判定の土台として、リファクタが実際に何を触ったか／触っていないかを先に確定する。
以下は今回この文書を書く直前に実行し、出力をそのまま転記したもの（要約や記憶からの再現ではない）。

**測定1: 全体差分規模**

```
$ git rev-parse --short HEAD
d4bce81
$ git rev-parse --short origin/main
d4bce81

$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | wc -l
210

$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | grep -cE "^docs/"
21
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | grep -c "^package-lock.json$"
1
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | grep -c "^public/"
1
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | grep -c "^README.md$"
1
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 | grep -c "^tests/e2e/.*\.png$"
24
```

検算: `210 - (21+1+1+1+24) = 162`。この162件が §3 のレビュー実行対象になる
（docs本文・package-lock・生成SVG・READMEの一言要約・視覚回帰baseline画像は、
コードでも設定でもテストでもないため対象から除く）。

**測定2: data/*.ts の変更範囲**

```
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 -- data/
data/robots.ts
```

`data/articles.ts` `manufacturers.ts` `useCases.ts` `deployments.ts` `articlePlacements.ts` は
上記出力に1件も現れない＝無変更。

**測定3: そのrobots.ts変更が単一commitであることの確認**

```
$ git log --oneline backup/pre-refactor-20260726..d4bce81 -- data/robots.ts
9530937 data(robots): restore batterySystem specs dropped by the schema rework

$ git log --oneline backup/pre-refactor-20260726..d4bce81 -- lib/specSchema.ts
9530937 data(robots): restore batterySystem specs dropped by the schema rework

$ git show --stat 9530937 | head -4
commit 9530937c4078987f5bc022fdd09a8a51b3b2db60
Author: Hori98 <hori@example.com>
Date:   Tue Jul 28 23:02:09 2026 +0900
    data(robots): restore batterySystem specs dropped by the schema rework
```

`robots.ts` と `specSchema.ts` の両方が、同一の単一コミット `9530937` からしか
変更を受けていないことを確認した（他コミットによる変更が無いことも同時に確認）。

**測定4: 画像・ロゴの変更範囲**

```
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 -- public/ | grep -v world-map
（出力なし）
```

`public/generated/world-map.svg` を除く `public/` 配下の変更は0件。

**測定5: 権利表示ロジックの変更有無**

```
$ git diff --name-only backup/pre-refactor-20260726 d4bce81 -- lib/media.ts
（出力なし）
```

`lib/media.ts` は無変更。

確定した事実（すべて上記コマンドの出力から直接導出）:

- 記事・メーカー・用途・導入事例・記事掲載枠のデータは無変更。
- ロボットデータの変更は `9530937` 1コミットのみ。`specSchema.ts` への正規登録を同一コミットで伴う。
- 世界地図SVG（自前生成物）を除き、画像・ロゴの変更は0件。
- 権利表示ロジック（`lib/media.ts`）は無変更。

この4点が、以下の対象外判定の根拠になる。

**測定6: 判定基準14文書自体が、今回のリファクタで改変されていないか（重要な見落とし）**

`docs/` 配下21件を「レビュー対象外（コード・設定・テストではないため）」として§0検算の
除外リストに入れたが、その21件の中に**判定基準として使っている14文書のうち4件が
含まれていた**ことを見落としていた。除外は「差分の集計から外す」処理であって
「判定基準の健全性を無視してよい」という意味ではないのに、両者を混同していた。

```
$ git diff --shortstat backup/pre-refactor-20260726 d4bce81 -- docs/decisions/ai_fullstack_development_guardrails_v1.md
1 file changed, 26 insertions(+), 16 deletions(-)
$ git diff --shortstat backup/pre-refactor-20260726 d4bce81 -- docs/decisions/data-maintenance-checklist-v1.md
1 file changed, 10 insertions(+), 1 deletion(-)
$ git diff --shortstat backup/pre-refactor-20260726 d4bce81 -- docs/decisions/design_system_v1.md
1 file changed, 78 insertions(+), 10 deletions(-)
$ git diff --shortstat backup/pre-refactor-20260726 d4bce81 -- docs/decisions/ui_architecture_and_development_policy_v1.md
1 file changed, 51 insertions(+), 18 deletions(-)

$ git log --oneline backup/pre-refactor-20260726..d4bce81 -- docs/decisions/design_system_v1.md | tail -3
ceb837a docs: write the Phase 6 UI contracts into the decision docs
5056cb4 docs: repoint the current decision docs at what Phase 5 left behind

$ git log --oneline backup/pre-refactor-20260726..d4bce81 -- docs/decisions/ui_architecture_and_development_policy_v1.md | tail -3
e0f3572 docs: collect the deferred work into one register
ceb837a docs: write the Phase 6 UI contracts into the decision docs
5056cb4 docs: repoint the current decision docs at what Phase 5 left behind
```

**何が問題か（design_system / ui_architecture — 規定の循環）**:
`ceb837a`が両文書に追加した内容を全hunk突合したところ（`git show ceb837a -- <file> | grep -E "^@@|^\+### "`
で変更箇所を特定し、現在の節構造 `grep -n "^## |^### "` と対応付け）、影響は§4だけでなく
以下3節にまたがっていた（当初「§4のみ」と書いたのは誤り。全hunkを見ずに最初の1件だけで
判断していた）。

| 文書 | 節 | 追加内容 | 循環の根拠 |
|---|---|---|---|
| design_system | §4 Layout | PageListHeader箱基準揃え | 実測値「45px」「32px」がそのまま規定文に |
| design_system | §5 Components→Carousel | autoplay一時停止規定 | 本文に「Phase 6 Task 3 で実測」と明記 |
| design_system | §8 Responsive | 390/768/1280/1440幅の追加 | `mobile-overflow.spec.ts`という実装物への参照を含む |
| ui_architecture | §9 フォーカスの契約 | overlay/フォーカス復帰規定 | 本文に「Phase 6 Task 4 で実測」と明記 |
| ui_architecture | §9 タブ/ナビゲーション区別 | role=tab使い分け規定 | `page-tab-bar.test.tsx`という実装物への参照を含む |
| ui_architecture | §8 レスポンシブ方針 | 360px→390pxへの変更 | design_system §8と同一内容の同期 |

これらのルールを使ってPhase 6実装を判定すると、規定自体がその実装を記述するために
書かれているため、構造的にほぼ自動的に合格する。

**影響範囲（訂正）**: R8（ui_architecture §9由来）・R9（両文書§8由来）・R11（design_system §5
Carousel由来）・R19（design_system §4由来）の4項目。**R12は対象外**（design_system §11
Acceptance Checklistは`ceb837a`のhunkに含まれていない、`git show ceb837a`の出力に§11相当の
行番号帯が現れないことを確認済み）。

**何が問題か（guardrails — 規定循環とは別種、より深刻）**:
guardrails文書の差分（26行）は「Phase 6実装からの規定逆算」ではなく、**検証ツール自体が
機能していなかったことの修正**だった。commit `d81a67c`の本文（原文）:

```
Every grep in 2.4, 2.10, 4.2 and 4.4 passed --include, which is a grep
flag that ripgrep does not have; each one died with "unrecognized flag
--include". Piping them into head or grep -v replaced rg's exit code
with the tail of the pipe, so the failure printed nothing and read as
the zero hits the section asks you to confirm. Phase 6 edited the 4.4
grep without hitting the error, which is how far back this goes.
```

（`git show -s --format="%B" d81a67c`で原文を確認済み。日付は2026-08-04、今回のレビュー
着手と同日。現在の該当行が`-g`表記に直っていることも`grep -n "^rg " docs/decisions/ai_fullstack_development_guardrails_v1.md`で確認済み）

**意味**: §4.4のgrep（R2・R5が直接使う）は、Phase 1〜6の間**一度も正常実行されたことがない**。
過去のどの時点の「§4.4確認済み」という記述・自己申告も証拠にならない。R19のような「規定と
無関係に実機を見る」対処は的外れ（コマンドが直っていたかどうかの問題であって、実装が
規定を後追いで書いたかどうかの問題ではない）。**対処はR2/R5に「今回が実質初回の正常実行」
という注記を足すだけで足りる**（下記反映済み）。

**何が問題か（data-maintenance-checklist — 現在進行形の未解決データ欠落）**:
data-maintenance-checklistの差分（10行）も規定逆算ではなく、**過去の削除の記録**だった。
commit `660caad`（"record spec-item removal procedure and acfaa7b's real scope"）が、
それより前の commit `acfaa7b`（2026-07-22、`backup/pre-refactor-20260726`＝7/26より前＝
今回の差分の範囲外。`git merge-base --is-ancestor backup/pre-refactor-20260726 acfaa7b`が
falseであることを確認済み）が `batterySystem`（45機）と `batteryCapacityWh`（16機）を
commit messageに記載せず削除していた事実を記録したもの。

- `batterySystem` は commit `9530937`（R16が既に対象にしているもの）で復元済み。
- **`batteryCapacityWh`（16機分）は今も未復元。** `grep -c "batteryCapacityWh" data/robots.ts
  lib/specSchema.ts` を実行するといずれも `0`（2026-08-04実測）。`batteryCapacityMah`という
  新設フィールドとのラベル衝突待ちで止まっている（data-maintenance-checklist §I原文の記述）。
- `docs/decisions/deferred-work-register-v1.md` に `batteryCapacityWh` の記載は**0件**
  （`grep -c`で確認済み）。積み残し登録簿から漏れている。

**意味**: R16が「commit `9530937`のみが対象」という枠組みのままだと、`batterySystem`の
復元だけを見て「データは復元済み」と誤読しかねない。`batteryCapacityWh`は今回の差分
（backup以降）の範囲外の欠落だが、現在も未解決という事実は明記が必要。

**この計画の対処**: 3種類の問題は性質が異なるため、対処も分けた。
1. design_system/ui_architecture（規定循環）→ R8/R9/R11に注記、R19を新設
2. guardrails（ツール未検証）→ R2/R5に「実質初回実行」注記
3. data-maintenance-checklist（データ欠落）→ R16に`batteryCapacityWh`未復元を明記。
   登録簿への追記はこの計画のスコープ外として、別途推奨するに留める

---

## 2. 文書ごとの要求項目マッピング

### 2.1 `10-workflow.md` §0 最重要原則（15項目）

全項目が構造リファクタに直接適用される。除外なし。

| # | 原則 | 対象 | 備考 |
|---|---|---|---|
| 1 | Existing Code First | **○** | 既存構造を調べずに新規実装していないか |
| 2 | Minimal Correct Change | **○** | 目的外の大改修が混入していないか |
| 3 | Single Source of Truth | **○** | データ・定数・ラベル・URLパラメータの正本散逸 |
| 4 | Separation of Concerns | **○** | UI/データ取得/URL操作の混在 |
| 5 | DRY | **○** | 重複構造・重複ロジック |
| 6 | KISS | **○** | 過剰抽象化 |
| 7 | Type Safety | **○** | 型の弱体化（`any`・不要optional等） |
| 8 | **Behavior Preservation** | **○（最優先）** | 目的外の既存挙動変更。ユーザーの最大の懸念 |
| 9 | State Integrity | **○** | URL/local/server state、cacheの同期 |
| 10 | Operational Safety | **○** | ID・鍵の直書き（Phase 7 analyticsで対応済みだが再確認） |
| 11 | Accessibility | **○** | §2.4/§2.9で詳細展開（design_system側） |
| 12 | Responsive / Layout Safety | **○** | §2.4/§2.9で詳細展開 |
| 13 | Error / Empty / Loading States | **○** | 0件・エラー・境界値 |
| 14 | Performance Awareness | **○** | 既に機械強制（client budgets）。再確認のみ |
| 15 | Testability | **○** | 検証手段の有無（今日の監査でテストの「主張と実態」の乖離が実在した） |

### 2.2 `10-workflow.md` §0.5 AI実装で特に避けること（10項目）

チェックリストとして§2.1と統合可能だが、原文に忠実に個別項目として残す。

| # | 禁止事項 | 対象 |
|---|---|---|
| 1 | 既存コードを調べず新しい構造・命名を作る | **○** |
| 2 | 似た実装があるのに独自実装を増やす | **○** |
| 3 | バグ修正で意図された機能・アニメーション・UI・データを消す | **○（重要）**。世界地図の動きが実際にこれで消えた前例あり（登録簿#8）。他に無いか確認 |
| 4 | 型/buildエラーを`any`等でごまかす | **○** |
| 5 | 仕様値・URLパラメータ名・ラベル・上限値の複数箇所直書き | **○** |
| 6 | 一時的見た目調整を仕様・データ設計に混ぜる | **○** |
| 7 | UIコンポーネントへのデータ取得・URL更新・業務ルール詰め込み | **○** |
| 8 | 影響範囲が広い共通部品を局所都合で変更 | **○** |
| 9 | 不要なライブラリ追加 | **○**。Phase 7でknip導入済みだが、依存追加自体の必要性根拠を再確認 |
| 10 | 検証せず「問題なし」と言う／ユーザーの未コミット変更を戻す | **○**。今日私が2回実測せず断定した実績あり。特に重点確認 |

### 2.3 `guardrails` §1.5 3層モデル + §2.1〜§2.10（10失敗パターン）+ §4.1〜§4.5（層別確認）

最も具体的（grepコマンド・npmコマンド付き）。§2と§4が事実上1組。

| # | 失敗パターン（§2） | 対応する確認（§4） | 対象 |
|---|---|---|---|
| 2.1 | 既存構造を読まずに実装 | — | **○** |
| 2.2 | DRY無視で焼き増し | — | **○** |
| 2.3 | KISS破りの過剰抽象化 | — | **○** |
| 2.4 | ハードコード増加 | §4.4 grep群（旧URLパラメータ・enum直書き等） | **○（機械実行可能）** |
| 2.5 | データモデルを勝手に変える | §4.1 `validate:data` | **○**。robots.ts変更1件を重点確認 |
| 2.6 | 検証不足のまま「できた」 | §4.2 `build` | **○** |
| 2.7 | Git管理が雑 | — | **○（過去に実例あり、今日の会話内でも3回発生）** |
| 2.8 | UI品質後回し | — | design_system側で詳細化（§2.10参照） |
| 2.9 | URL state誤り | §4.3 手動確認シナリオ | **○** |
| 2.10 | Server/Client境界崩れ | §4.4 grep群 | **○（機械実行可能）** |
| — | §4.5 デプロイ層 | Vercel実配信確認 | **○（詳細はR15。セキュリティヘッダ5種・analytics稼働・Toaster配置を実測確認済み）** |

### 2.4 `editorial_style_guide_v1.md`（全体）

記事本文の執筆方針・NGワード・セクション別テンプレート・メーカー解説の見出し固定・
FAQ判定基準・§3 Step4の4種監査（事実監査/誇大表現監査/日本語監査/重複監査）等、
全項目が **記事コンテンツの執筆・編集**に関する規定。

**対象外。** 根拠: §1実測のとおり `data/articles.ts` はリファクタ着手前後で無変更。
新規記事の執筆・既存記事の本文編集は一度も行われていない。この文書が定める基準を
適用する対象（記事本文）自体が今回の差分に存在しない。

### 2.5 `robot-factcheck-research-prompt-2026-07-01.md`（全体）

掲載済みロボット58機・メーカー25社の**データそのもの**（型番・スペック・価格・
デプロイ段階等）を公式情報と突合するファクトチェック手順。

**対象外（1コミットを除く）。** 根拠: `data/robots.ts` の変更はバッテリー仕様1項目の
復元のみで、名称・スペック・デプロイ段階・日本展開状況等、本文書がチェック対象とする
他の全項目には触れていない。この1コミットについては §2.7 D2 チェックリストの範囲で
確認する（ファクトチェックプロンプト全体の実行は不要）。

### 2.6 `ai/rules/20-data.md`（標準ルール）

| ルール | 対象 | 理由 |
|---|---|---|
| id不変・slug可変の原則 | **△（限定）** | robots.tsの1コミットのみ確認対象。他レコードは無変更 |
| 事実を記憶から創作しない、出典記録 | **対象外** | 新規データ追加なし |
| tag/specはレジストリ登録済みのみ使用 | **○（限定）** | `batterySystem`のspecSchema登録を確認済み（§1実測）。再検算のみ |
| pages は `lib/data.ts` 経由、`data/*.ts` 直接importしない | **○（重要）** | Phase 5でこの境界を再構築している。**構造リファクタの中核**なので全コード対象 |
| `npm run validate:data` / `build` 実行 | **○** | 機械確認済み。再実行して裏取り |

### 2.7 `ai/rules/21-data-maintenance-workflow.md` G1〜G11

新規/更新レコードの編集前ゲート。**robots.tsの1コミットにのみ適用**。

| Gate | 対象 | 判定根拠 |
|---|---|---|
| G1 対象コレクション・作業種別 | **○** | 既存レコード更新（新規ではない）と確認 |
| G2 出典の事前確認 | **○** | `fieldEvidence.batterySystem` にURL登録済みか確認 |
| G3 ID/slug | **対象外** | 既存id維持、変更なし |
| G4 必須フィールド・公開ゲート | **○** | publishStatus変更の有無を確認 |
| G5 参照整合 | **対象外** | `*Id`/`*Ids`系フィールドに触れていない |
| G6 出典・信頼性・鮮度 | **○** | `checkedAt`/`reliability`更新の有無 |
| G7 spec/tag/enum登録 | **○（実測済み）** | specSchema登録済み。§1で確認済み |
| G8 画像・権利 | **対象外** | 画像変更なし |
| G9 publishStatus・archive | **○** | 既存レコード更新のためpublishStatus変更なしを確認 |
| G10 検証 | **○** | validate:data実行済みを確認 |
| G11 完了報告 | **○** | commit messageの内容確認 |

### 2.8 `data-maintenance-checklist-v1.md`（全セクション）

| セクション | 対象 | 理由 |
|---|---|---|
| A ロボット追加 | **対象外** | 新規ロボット追加なし |
| B メーカー追加 | **対象外** | 新規メーカー追加なし |
| C 記事追加 | **対象外** | 新規記事追加なし |
| D slug変更 | **対象外** | slug変更なし |
| **D2 既存レコード更新** | **○** | robots.ts 1コミットに直接適用。G1〜G11と重複するが原文の項目立てが異なるため両方確認 |
| E archive | **対象外** | archive操作なし |
| F 公開ゲート（Robot/Manufacturer/Article/UseCase/Deployment） | **△（Robotのみ）** | 他コレクションは無変更のためRobotの項目のみ確認 |
| G 定期鮮度レビュー | **対象外** | 月次/四半期の運用作業。今回のスコープ外 |
| **H デプロイ前ゲート** | **○（重要）** | build通過・sitemap・draft noindex等、リファクタ全体に適用される最終ゲート |
| I タグ/enum/スペック項目の増減 | **○（限定）** | batterySystem追加のみ該当。削除は無し |
| J 表示名/ソート方針 | **○** | UIリファクタでソートロジックに触れていないか確認 |
| K AI素材配置の最低入力 | **対象外** | 素材配置作業なし |
| M useCases追加/更新 | **対象外** | useCases無変更 |
| N deployments追加/更新 | **対象外** | deployments無変更 |
| O articlePlacements追加/更新 | **対象外** | articlePlacements無変更 |

### 2.9 `ai/rules/22-article-sourcing.md`（全体）

記事候補の探し方（書く前段階）。**対象外。** 根拠: §2.4と同じ（記事執筆自体が発生していない）。

### 2.10 `ai/rules/30-ui-design.md`（標準ルール、7項目）

| ルール | 対象 |
|---|---|
| 既存コンポーネント・トークン・helperに近い変更に留める | **○** |
| 狭いバグ修正で広い画面を再設計しない | **○** |
| 「AI-feel」パターン回避（グラデーションhero・glassmorphism等） | **○** |
| semantic token使用、直書き色回避 | **○** |
| データ取得・filtering・URL stateをpresentationalから分離 | **○（design_system §5と重複、両方確認）** |
| カード再利用性ルール | **○** |
| filtering実装（`lib/viewModels/`経由、共有FacetFilterBarでない）、PageTabBar軸固定 | **○** |

### 2.11 `design_system_v1.md`（全13節）

最大の詳細度を持つ文書。節ごとに判定する。

| 節 | 内容 | 対象 |
|---|---|---|
| 1 デザイン原則 | 5つの優先体験・5つの回避体験 | **○** |
| 2 ビジュアルトーン | Radix slate/jade token、ダークモード | **○** |
| 3 トークン（Color/Typography/Spacing/Radius） | 本文ブロックへの矩形背景禁止等 | **○** |
| 4 Layout（PageListHeader/ContextualPageHeader） | フォーカス保持ルール、追従ヘッダの規定 | **○（Phase 6の主要変更点）** |
| 5 Components（Cards/RobotCard/FactList/RobotCardRail/Carousel/Spec Explorer/Tags/Filters） | 全部品の個別ルール | **○（35コンポーネントの大半がここに該当）** |
| 6 Media | 権利gate通過 | **△**。ロジック自体は無変更（§1実測）だが、呼び出し側コード変更の有無は確認 |
| 7 Icons | lucide使用、aria-label | **○** |
| 8 Responsive | 390/768/1280/1440px、grid規定 | **○** |
| 9 Content Style | 文言トーン | **△**。UI文言（`lib/uiText.ts`）変更があれば対象、記事本文は対象外 |
| 10 Future Component Candidates | 未着手候補 | **対象外**（未実施の提案リスト） |
| 11 Acceptance Checklist（12項目） | 新UI導入前確認 | **○（そのまま最終チェックリストとして採用）** |
| 13 デザインジャンル（Editorial×Dashboard） | ゾーン別ルール | **○** |

> **⚠️ §1測定6の注記が特に効く節: 4（Layout）。** `PageListHeader`の「箱基準（`sm:items-center`）
> で揃える」規定はcommit `ceb837a`でPhase 6実装から書き起こされた（実測値「45px」「32px」を
> 含む記述がその場で追加されている）。この節を使ってPageListHeaderの実装を判定すると
> 自動的に合格する。**R8〜R12のいずれもLayout（PageListHeader/ContextualPageHeader構造）を
> 明示的な対象にしていなかったため、新規にR19として追加する**（下記§3参照）。

### 2.12 `ui_architecture_and_development_policy_v1.md`（全12節）

| 節 | 内容 | 対象 |
|---|---|---|
| 1〜3 結論・現状調査・真実源 | 背景説明 | 参照のみ（判定不要） |
| 4 画面構造（Collection一覧/Detail） | Server/Client境界の原則 | **○** |
| 5 コンポーネント責務（作ってよい/作りすぎない、カード/グリッド分離） | **○** |
| 6 データとUIの境界（禁止事項4つ） | **○（guardrails §4.4のgrepと重複、両方の観点で確認）** |
| 7 メディア表示方針・Server/Client境界 | **△**。ロジック不変（§1実測）、呼び出し側のみ確認 |
| 8 レスポンシブ方針 | **○** |
| 9 アクセシビリティ方針（フォーカス契約、タブ/ナビゲーション区別） | **○（Phase 6の主要変更点、既存テストとの整合確認）** |
| 10 UI開発手順 | プロセス規定 | 判定不要（手順書） |
| 11 近い将来やるべきこと（優先度高/中、今はやらない） | **○（「今はやらない」5項目が実際に混入していないか確認）** |
| 12 一言まとめ | 総括 | 判定不要 |

> **⚠️ §1測定6の注記が特に効く節: 9（アクセシビリティ方針、フォーカス契約）。**
> 同じcommit `ceb837a`（および `e0f3572`）でPhase 6実装から書き起こされた記述を含む。
> **R8ではこの節の記述と無関係に、`tests/e2e/focus-restoration.spec.ts`が実際に
> フォーカス移動を検証しているか（規定の言い換えになっていないか）をテスト内容から
> 直接確認する。**

### 2.13 `ai/rules/40-content-rights.md`（標準ルール）

画像・ロゴのソーシング、hotlink禁止、ImageAsset権利metadata、外部文章の無断転載禁止、
引用ルール、AI生成画像の混同禁止。

**対象外。** 根拠: §1実測のとおり画像・ロゴの新規追加・差し替えは無し。世界地図SVGは
自前生成物（第三者コンテンツではない）。

### 2.14 `copyright_and_media_rights_policy_v1.md`（全15節）

§0方針転換・§1基本方針・§2掲載前調査・§3禁止事項判定・§4加工方針・§5ロゴ表示ルール・
§6掲載後対応・§7権利ステータスA〜E・§8文章引用ルール・§9データモデル・§10公開ゲート・
§11現状リスク監査・§12運用フロー・§13Brand&Copyrightページ・§14参考資料。

**対象外（全節）。** 根拠: §1実測のとおり、この文書が扱う「新規素材の取得・権利判定・
掲載後対応」のいずれも今回のリファクタでは発生していない。`lib/media.ts`（§10の
実装本体）も無変更。

唯一の例外: §11「現状のリスク監査」に記載された既知リスク（`data/robots.ts` の画像URL
一部404/403、`npm run check:source-links` で定期確認）は**運用上の既存リスクであり、
今回のリファクタが悪化させていないか**だけ確認する（新規リスクの追加ではなく、既存リスクの不変を見る）。

---

## 3. 統合レビュー実行計画

§2で「対象」と判定した項目を、実施可能な単位へ集約する。各行に手法と完了条件を付ける。

| # | レビュー軸 | 出典 | 対象範囲 | 手法 | 完了条件 |
|---|---|---|---|---|---|
| R1 | **Behavior Preservation**（挙動が変わっていないか） | 10-workflow §0-8 | 全体 | 手段を確定・一部実行済み（詳細は下記R1詳細）。①公開URL一覧diff（実行済み・差分0件）②主要な事実表示部分のPlaywright textContentサンプリング（方法確定・未実行） | ①完了。②実施してから完了とする |
| R2 | AI失敗パターン10種（ハードコード・境界崩れ等） | guardrails §2.1-2.10, §4.4 | `lib/`(48) `components/`(35) `src/app/`(12) | §4.4のgrepを`-g`修正版で全実行 + 目視。**§4.4のgrepはcommit `d81a67c`（2026-08-04）まで`--include`という存在しないフラグで一度も正常実行されていなかった（`d81a67c`が追記した注記が現在の§4.4本文内に残っている）。今回が実質初回の正常実行であり、過去のPhase 1〜6における「§4.4確認済み」という自己申告は根拠にならない** | 全grepゼロヒット（誤検知は除外理由を明記） |
| R3 | Single Source of Truth / DRY / KISS | 10-workflow §0, guardrails §2.1-2.3 | `lib/`(48) `components/`(35) | コードレビュー（正本の重複、焼き増しUI） | 発見した重複を全件報告 |
| R4 | Type Safety / データモデル整合 | 10-workflow §0, guardrails §2.5, 20-data.md | `lib/data*` `lib/validate*` `lib/validation/` `data/types.ts` | `typecheck` + `validate:data` 実行 + 境界grep | 全コマンド exit 0 |
| R5 | Server/Client境界、data/*.ts直import禁止 | guardrails §2.10 §4.4, 20-data.md, ui_architecture §6 | 全コード | `check:data-boundaries` `check:client-imports` 実行 + プローブで赤くなることを再確認。§4.4のgrep部分はR2と同じ注記が適用される（`d81a67c`以前は未検証） | 実行済み違反プローブが検出される |
| R6 | エラー・空状態・境界値 | 10-workflow §0, guardrails §4.3 | `components/` 一覧・詳細系 | 0件フィルタ・不正slug・不正パラメータの手動/e2e確認 | 各シナリオで非破綻を確認 |
| R7 | Operational Safety（ID・鍵の直書き） | 10-workflow §0 | `lib/env.ts` 他 | `rg "G-PLLDR4X5TV\|x4ow976y5y" lib components src -g "*.ts" -g "*.tsx"` を実行（2026-08-04）。**1件ヒット**（`lib/env.ts:4`）。中身を確認したところ `/* ... */` のJSDocコメント内で「以前はこのIDをフォールバックに持っていた」と過去形で説明する記述であり、実コードでの直書きではない（`grep -n -B2 -A2` で前後文脈を確認済み）。当初この行を「ゼロヒット」と書いたのは誤りで、実際は1件ヒットに対して精査した結果を「無害」と判定したもの | 実コードでの直書き0件（コメント内の歴史的言及1件は除く） |
| R8 | Accessibility（フォーカス契約・タブ semantics） | design_system §9(旧4), ui_architecture §9 | `components/` overlay系3種、`tests/components/page-tab-bar.test.tsx` | `tests/e2e/focus-restoration.spec.ts` の存在を実測確認済み（`ls`実行、2026-08-04）。**ui_architecture §9の該当2小節（フォーカスの契約／タブ区別）はcommit `ceb837a`でPhase 6実装から書き起こされている（§1測定6）ため、規定文との突合だけでは自動合格になる。`focus-restoration.spec.ts`と`page-tab-bar.test.tsx`の実際のアサーション内容を読み、規定の言い換えになっていないか（実際にDOM操作・フォーカス位置を検証しているか）を直接確認する** | 既存テスト全通過 + 規定違反0件 + 上記テストが規定の言い換えでないことを確認 |
| R9 | Responsive（390/768/1280/1440） | design_system §8, ui_architecture §8 | `components/` グリッド系 | 視覚回帰の対象routeを実測済み: `grep -oE "'/[a-z-]*'" tests/e2e/visual-regression.spec.ts \| sort -u` → `/` `/reports` `/robots` の3件（2026-08-04実行）。`/manufacturers` `/use-cases` は含まれていないことを確認。この2ルート追加の要否判断が必要。**両文書の§8（390/768/1280/1440という数値そのもの）はcommit `ceb837a`でPhase 6から書き起こされている（§1測定6）が、`mobile-overflow.spec.ts`は実際にブラウザで幅を変えてoverflowを検出する実測系テストであり、規定文の言い換えではない（e2eの実行内容そのものが検証手段のため、R8ほど循環リスクは高くない）** | 既存3ルート通過を確認、追加要否を明記 |
| R10 | デザイン原則・トークン逸脱 | design_system §1-3 | `components/`(35) | 色直書き・矩形背景・AI-feel patternのgrep + 目視 | 違反0件 |
| R11 | コンポーネント責務（作ってよい/作りすぎない、カード/グリッド分離） | design_system §5, ui_architecture §5 | `components/`(35)、特に `CarouselAutoplayButton.tsx` `NewsHeroCarousel.tsx` | 個別部品ルールとの突合（RobotCard/FactList/Carousel等）。**design_system §5のCarousel autoplay規定（一時停止ボタン常設等）はcommit `ceb837a`でPhase 6 Task 3の実測（「embla のイベントがlistenerへ届かず…」の記述）から直接書き起こされている（§1測定6）ため、この部分は当初一切確認していなかった（旧版のR11には反映漏れ）。規定文と無関係に、`CarouselAutoplayButton.tsx`が実際に停止/再開を機能させているかをコードで確認する** | 各部品ルール準拠を個別報告。Carousel部分は規定文コピーでない独立確認を含める |
| R12 | Acceptance Checklist 12項目 | design_system §11 | 変更UI全体 | チェックリストをそのまま実行 | 12項目全通過 |
| R13 | 「今はやらない」5項目の非混入 | ui_architecture §11 | 全体 | 大規模UIライブラリ・shadcn全面・CMS前提設計・3D hero・汎用Table frameworkの不在確認 | grep + 目視でゼロ |
| R14 | Git管理の雑さ（§2.7） | guardrails §2.7 | 全commit | `git log`で未コミット差分混入・unrelated差分の有無を確認 | 該当なし（今日3件発生した実績を踏まえ重点確認） |
| R15 | デプロイ層確認 | guardrails §4.5 | 本番（`https://deploid.net`） | 下記、コマンド・出力とも本文に埋め込み済み（2026-08-04実行） | 下記6項目を確認済みとして記録。ヘッダの値そのものが十分厳格か（例: CSPのallowlist範囲の妥当性）は別途R2/R10相当のコードレビューで判断する |
| R16 | データ1コミットの G1-G11 準拠 | 21-data-maintenance-workflow, data-maintenance-checklist D2/F/I | `data/robots.ts` commit `9530937` のみ | チェックリスト全項目を1コミットに適用。**注記: `9530937`が復元したのは`batterySystem`（45機）のみ。同じ削除元（`acfaa7b`、2026-07-22＝backup分岐点より前で今回の差分範囲外）が同時に削除した`batteryCapacityWh`（16機）は今も未復元（`grep -c "batteryCapacityWh" data/robots.ts lib/specSchema.ts`が2026-08-04時点で両方0を確認済み）。R16の完了条件を「9530937のみで全て解決」と誤読しないこと** | 全ゲート通過 or 未充足項目を明記。`batteryCapacityWh`は範囲外の既知未解決事項として別掲（下記対象外一覧に追加） |
| R17 | デプロイ前ゲートH | data-maintenance-checklist §H | 全体 | Hセクションの項目数を実測: `sed -n '/^## H\./,/^---/p' docs/decisions/data-maintenance-checklist-v1.md \| grep -c "^[0-9]\. \[ \]"` → **5項目**（build通過／validate warning確認／sitemap.xmlがpublishedのみ／draft・sample・archivedのnoindex／主要タブ表示）。うち(1) build通過は`npm run check`実行で繰り返し確認済み（exit 0）、(5) 主要タブ表示はe2e 79件通過で部分的にカバー。(2)(3)(4)は本レビューで未実施 | 5項目のうち2項目済み・3項目未実施として記録し、本レビュー実行時に残りを埋める |
| R18 | 既知リスク（画像URL404/403）の不変確認 | copyright policy §11 | `data/robots.ts` | `check:source-links` 実行、着手前との比較 | 新規404/403の有無を報告（既存分は許容） |
| R19 | Layout構造（PageListHeader/ContextualPageHeader） | design_system §4 | `components/PageListHeader.tsx` `components/ContextualPageHeader.tsx` `components/HeaderChrome.tsx` 等 | §1測定6の注記により、design_system §4の記述をそのまま合格基準にしない。実際に複数ブラウザ幅で目視/e2eし、規定文が実装を後追いで正当化しているだけでないかを確認する | 記述と無関係に、崩れ・フォーカス消失が実機で再現しないことを確認 |

### R1 詳細（手段の確定と一部実行、2026-08-04実行）

**確定した手段**: 2段構成。①公開URL一覧・件数のdiff（機械・低コスト）。②主要な事実表示部分の
Playwrightサンプリング（未実行、方法は既存`public-routes.spec.ts`と同型）。却下済みの
全ページスクリーンショット比較とは別物（①はテキストのみ、②は特定要素の値のみを見る）。

**①の実行**: `src/app/sitemap.ts`が`getRobots`/`getManufacturers`/`getUseCases`/`getArticles`
（いずれも`lib/data.ts`内で`published()`フィルタ済み、`grep -n "export function getRobots" -A2
lib/data.ts`で確認）から全publishedURLを列挙していることを確認した上で、この関数群を直接
実行する方法を試みた。

**つまずいた点（正直に記録）**: `backup/pre-refactor-20260726`時点には`vitest`も
`vite-tsconfig-paths`も存在しない（Phase 1で新設）。`lib/data.ts`は`@/`エイリアスを内部で
多用しており、素のNodeでは解決できない。「ほぼゼロコストで今すぐ実行できる」という当初の
見立ては誤りで、実際にはbackup側のtoolchain不在という壁に当たった。

**回避策**: アプリを実行せず、`data/*.ts`を直接テキスト解析する方式に切り替えた。
各レコードを`slug:`の出現位置で分割し、同一レコード内に`publishStatus: 'published'`があるものだけ
拾う。

```
$ node -e "
    const fs = require('fs');
    function extractPublished(file, prefix) {
      const src = fs.readFileSync(file, 'utf8');
      const records = src.split(/(?=\n\s*\{)/);
      const urls = [];
      for (const rec of records) {
        const slugMatch = rec.match(/slug:\s*'([^']+)'/);
        const pubMatch = rec.match(/publishStatus:\s*'published'/);
        if (slugMatch && pubMatch) urls.push(prefix + slugMatch[1]);
      }
      return urls;
    }
    const all = [
      ...extractPublished('data/robots.ts', '/robots/'),
      ...extractPublished('data/manufacturers.ts', '/manufacturers/'),
      ...extractPublished('data/useCases.ts', '/use-cases/'),
      ...extractPublished('data/articles.ts', '/reports/'),
    ];
    console.log('total=' + all.length);
    all.sort().forEach(u => console.log(u));
  "
```

`backup/pre-refactor-20260726`をworktreeへ展開し、上記を現在のツリーとworktree両方で実行、
`diff`した。

```
$ git worktree add .worktrees/backup-probe backup/pre-refactor-20260726
（上記スクリプトをbackup-probe/とDeploid_toB/の両方で実行）
$ diff /tmp/urls-backup2.txt /tmp/urls-current.txt
（出力なし）
$ echo $?
0
```

**結果**: 着手前・現在とも `total=130`、`diff`は完全に空（差分0件）。**リファクタ全体を通じて
公開URLが1件も増減していないことを確認した。** worktreeは検証後に`git worktree remove
.worktrees/backup-probe --force`で削除済み。

**残作業（②、未実行）**: 各collectionの詳細ページから「件数バッジ」「フィルタ結果件数」等、
表示される具体的な数値・文言をPlaywrightの`textContent`で数点サンプリングし、backup側の
静的レンダリング結果（`next build`が必要になるため①よりコストが高い）と突き合わせる。
方法は確立している（`public-routes.spec.ts`が`expectedH1`で同種の検証を既に行っている）が、
本レビュー実行時に着手する。

---

### R15 詳細（本番実測、2026-08-04実行）

セキュリティヘッダ:

```
$ curl -sSI https://deploid.net | grep -iE "content-security-policy-report-only|x-content-type-options|referrer-policy|x-frame-options|permissions-policy"
content-security-policy-report-only: default-src 'self'; base-uri 'self'; object...
permissions-policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
```

analytics（GA/gtag）:

```
$ curl -sL https://deploid.net | grep -o 'G-[A-Z0-9]\{6,\}' | sort -u
G-PLLDR4X5TV
$ curl -sL https://deploid.net | grep -o "googletagmanager.com" | wc -l
2
```

Clarity（**旧版の「1箇所」は`grep -c`＝一致した行数を数えていたため、HTML本体が
ほぼ1行に圧縮されている場合は出現回数によらず0か1しか返らない誤った指標だった。
`-o`で実出現数を数え直し、何を指しているかも明示する**）:

```
$ curl -sL https://deploid.net | grep -o "clarity\.ms/tag/" | wc -l
1   # 実際にスクリプトを読み込むURL（clarity.ms/tag/<id>）の出現数
$ curl -sL https://deploid.net | grep -c "microsoft-clarity"
1   # id="microsoft-clarity" を持つ起動用inline scriptタグの出現数
$ curl -sSI https://deploid.net | grep -o "clarity\.ms" | wc -l
4   # CSPヘッダ1本の中に許可リストとして4回出現（script-src 2 + connect-src 2）。
    # 別の場所に4回あるのではなく、単一ヘッダ文字列内の部分一致回数
```

Toaster配置（実際に使った検索文字列を明示。Sonnerのcontainer要素
`<section aria-label="Notifications alt+T">`はSSRされるため、curlでも検出できる）:

```
$ for p in / /privacy /compare; do
    echo -n "$p: "; curl -sL "https://deploid.net$p" | grep -o "Notifications alt" | wc -l
  done
/: 0
/privacy: 0
/compare: 1
```

設計通り、`/compare`にのみToasterが配置されていることを確認。

---

## 4. 対象外と判定した項目の一覧（まとめ）

以下は文書全体としては重要だが、**今回のリファクタの差分に該当する対象が存在しないため**
レビュー対象から外す。省略ではなく、判定として明記する。

| 出典 | 対象外の範囲 | 理由 |
|---|---|---|
| editorial_style_guide_v1.md | 全体 | `data/articles.ts` 無変更。記事執筆・編集が発生していない |
| robot-factcheck-research-prompt | robots.ts 1コミットを除く全体 | 名称・スペック・デプロイ段階等の他項目は無変更 |
| 22-article-sourcing.md | 全体 | 記事候補探しが発生していない |
| 21-data-maintenance-workflow.md G3, G5, G8 | 該当ゲート | id/slug変更なし、参照フィールド変更なし、画像変更なし |
| data-maintenance-checklist A, B, C, D, E, G, K, M, N, O | 該当セクション | 新規レコード追加・slug変更・archive・素材配置・useCases/deployments/articlePlacementsの変更が無い |
| data-maintenance-checklist F（Manufacturer/Article/UseCase/Deployment分） | 該当分 | Robot以外のコレクションは無変更 |
| 40-content-rights.md | 全体 | 画像・ロゴの新規追加・差し替えなし |
| copyright_and_media_rights_policy_v1.md | §0〜§10, §12〜§14（§11の一部を除く） | 新規素材取得・権利判定・掲載後対応が発生していない。`lib/media.ts` 無変更 |
| design_system_v1.md §10 | Future Component Candidates | 未着手の提案リストであり、実施の有無を判定する対象ではない |

**上記とは性質が異なる対象外が1件ある**（「差分が無いから見なくてよい」ではなく
「差分の範囲より前から続く、今も未解決の課題」）: `batteryCapacityWh`（ロボット16機分の
バッテリー容量）は commit `acfaa7b`（2026-07-22、backup分岐点7/26より前）で削除されたまま
今も復元されていない（R16参照）。今回のレビュー対象（backup→d4bce81の差分）には現れないため
このレビューの実行対象には含めないが、**「対象外＝問題なし」ではない**。登録簿
（`deferred-work-register-v1.md`）への追記をこの計画とは別に推奨する。

---

## 5. この計画自体の既知の弱点

- **162ファイルの一次レビューは実施済みでない。** この計画は「何を確認するか」の設計であり、
  実施（サブエージェントへの割り振り等）は次のステップ。
- **R9のvisual regression追加可否は未決定。** 外部監査（general-purposeエージェント、別タスクの
  レビュー中に発見）から「`/manufacturers`/`/use-cases`はデータ件数でページ高さが変わり
  不安定化しうる」との指摘が出ている。実件数を今回改めて実測（`publishStatus:`と`slug:`の
  出現回数を独立に数え、両方一致することを確認、2026-08-04）: `data/manufacturers.ts` **26件**、
  `data/useCases.ts` **44件**（外部監査が挙げていた19件という数字より多い。何を分母にしたかの
  差と見られるが、以前の指摘の数値をそのまま信用せず今回自分で数え直した結果として記録する）。
  追加するかどうかは決定が必要。
- **判定基準14文書のうち4文書が、今回のリファクタ自体によって書き換えられている**（§1測定6）。
  性質の異なる3種の問題が混在していたことを確認済み:
  1. design_system/ui_architecture — Phase 6実装から一部ルールを逆算して追記（規定循環）。
     影響はR8・R9・R11・R19（新設）の4項目。R8/R9/R11の各行に対処を追記済み。
  2. guardrails — 規定循環ではなく、§4.4のgrepが`d81a67c`（今日）まで一度も正常実行されて
     いなかった検証ツール不備。R2/R5に「今回が実質初回実行」の注記を追記済み。
  3. data-maintenance-checklist — `batteryCapacityWh`（16機）が今も未復元・登録簿にも
     未記載という、現在進行形のデータ欠落。R16と§4末尾に明記済み。

  上記のうち1（規定循環）は「R8/R11で対処済み」と当初書いたが、**実際にはR11は元の文言
  のまま未更新で、R9も§8の循環リスクに触れていなかった。指摘を受けて今回R8/R9/R11すべての
  表セルを書き換えた。この対処が十分かはレビュー実行時に再検討が要る。**
- **worktreeの後片付け漏れ。** `git worktree list`で確認したところ（2026-08-04実行）、
  main へマージ済みの3ブランチ（`refactor/05-client-boundaries` `refactor/06-ui-accessibility`
  `refactor/07-security-cleanup`、いずれも`git rev-list --count origin/main..<branch>`で
  未取込0commitを確認済み）に対応する`.worktrees/`配下のディレクトリが削除されずに残っている。
  レビュー対象の162ファイルには影響しないが、R14（Git管理の雑さ）の確認範囲を
  「commitの内容」だけでなく「作業環境の後片付け」まで広げるかの判断が要る。実害は無い
  （disk容量とディレクトリの散らかりのみ）。
- **R1は解決済み。** 手段を①公開URL一覧diff（実行済み・完全一致）②主要事実表示のPlaywright
  サンプリング（方法確定・未実行）の2段に確定した（詳細はR1詳細ブロック）。①の実行過程で
  「backup時点にはvitest/tsconfig-pathsが無くtoolchainが動かない」というつまずきがあり、
  「ほぼゼロコストで即実行できる」という当初の見立ては誤りだった。データファイルの
  テキスト解析へ回避策を切り替えて実行し、着手前後で公開URL 130件・差分0件を確認した。

---

## 6. 実行結果の総括（2026-08-05）

§3のR1〜R19を、データ層→ブリッジ層→フロントエンド層→ゲート/設定層→テスト層の順に
実行した。各層の完了時にコミット済み状態で `npm run check`（14ゲート＋e2e 79件）を
再実行し、exit 0を確認してから次の層へ進んだ。

### 層別の結果

| 層 | 対象 | 結果 |
|---|---|---|
| データ層 | `lib/data.ts` `lib/data/`(2) `lib/validate.ts` `lib/validation/`(10) `data/types.ts`、commit `9530937` | 問題なし |
| ブリッジ層 | `src/app/`(12) `lib/env.ts` | 問題なし |
| フロントエンド層 | `components/`(35) | 軽微なDRY重複1件 → 修正 |
| ゲート/設定層 | `scripts/`(13) `.github/`(3) root(11) `ai/`(2) | 問題なし |
| テスト層 | `tests/`(37、画像除く) | 問題なし |

### 見つけて直したもの

**`RobotCard`/`UseCaseCard`/`ManufacturerCard`のホバー演出（シマー＋下線）が3ファイルに
逐語重複**（md5一致で確認）。`components/CardHoverEffects.tsx`へ抽出し3ファイルへ適用
（commit `22afed6`）。抽出の過程で、design_system_v1.mdが「`useTiltCardEffect`を3カード
種で共有」と書いていたが実際に使うのは`FeaturedRobotCard`のみという記述齟齬も見つかり、
同時に修正した（commit `9057a3a`）。

### 見つけたが対象外だったもの（検算の記録）

- design_system/ui_architectureの規定循環（§1測定6）: 影響範囲をR8/R9/R11/R19に確定し、
  各行に「規定文と無関係にテスト内容を直接確認する」注記を追加。実際にfocus-restoration・
  page-tab-bar・mobile-overflow・carousel-autoplayの各テストを読み、規定の言い換えでなく
  実DOM/実ブラウザを検証する本物のテストであることを確認した。
- guardrails §4.4のgrep不備: PR #15（`d81a67c`）で既に修正済みであることを確認。
- `batteryCapacityWh`未復元: 引き続き未解決。今回のレビュー対象（backup以降の差分）より
  前のコミットが原因のため対象外だが、`docs/decisions/deferred-work-register-v1.md`への
  追記が別途必要（本レビューのスコープ外、要フォローアップ）。
- 世界地図の点数「14」: 25メーカーとの食い違いを一度疑ったが、地理的クラスタリング
  （`lib/worldMap.ts`の`clusterProjectedManufacturers`、閾値1.8の導出根拠つき）による
  ものと判明。誤りではなかった。

### この実行自体から得られた副次的な確認

テスト層で、`tests/unit/validation/validation-parity.test.ts`が「かつて `f(x) === f(x)`
の自明比較で何を壊しても検知できないテストだった」という自己記録を持っていることを発見した。
guardrails §4.4のgrep不備と同じ種類の欠陥（見た目は検証しているが実際には機能しない）が、
このプロジェクトの別の場所でも過去に発生し、既に発見・修正されていたことになる。
`tests/unit/spec-coverage.test.ts`も同様に、本レビューが追った実際のインシデント
（`acfaa7b`のサイレント削除）に対する恒久対策として存在することを確認した
（`MIN_POPULATED.batterySystem: 45`、`MIN_ROBOTS: 63`とも現在のデータに一致）。

### 結論

Phase 1〜7の移行前リファクタリングは、本計画のR1〜R19の基準に照らして健全と判断する。
唯一の修正はコンポーネント3ファイルの軽微な重複除去であり、データ・URL・挙動を変える
性質のものではない。R1（着手前後で公開URLが1件も増減していない）が、ユーザーの当初の
懸念（「本当にミスなくできているのか」）への最も直接的な回答になる。

未解決として残るのは、本レビューの対象外と判定した既知項目（`batteryCapacityWh`、
色コントラスト218件、worldMap動きの復活、その他 `deferred-work-register-v1.md` 記載分）
のみであり、いずれもレビュー開始前から認識されていたものである。
