# ロボットのCSV公開化・並べ替えアーキテクチャ・記事ソート重複解消 計画 v1

Last updated: 2026-06-14

## 目的

3つの独立した改善をまとめて計画する（実装は承認後）。

1. **robots ページの表示を CSV 基準に揃える** — CSV 確認済みモデルを公開し、バックログ社は出さない。
2. **並べ替えを「最適な既定＋将来拡張可能」な形にする** — 名前順以外（ステージ/日本入手性/キュレーション）に拡張できる単一の仕組みへ。
3. **記事の publishedAt 降順ソートの重複を解消する** — 4箇所の直書きを1つのコンパレータへ。

## ユーザー確定事項（2026-06-14）

- CSV にあるモデルは出す。ただし下記バックログ社（CSV下段・最終確認日なし）は**出さない**：
  AEI Robot / CASBOT / Deep Robotics / DOBOT Robotics / EIR Technology / Foundation / MagicLab / Matrix Robotics / Noetix Robotics / OpenLoong / Oversonic Robotics / Perceptyne / Rainbow Robotics / RoboForce / X-Humanoid / KyoHA / Astribot / Galbot / LG Electronics / Naver Labs / Robotis / Xiaomi / Westwood Robotics / Weave Robotics / X Square Robot / Unix Group
- 並び順は「最適」を提案。**将来は名前順以外も対応**できる設計にする。
- 記事ソート重複解消は、**安全確認が取れたら実施**。

## 調査済みファイル

- `/Users/hori/Downloads/contacts - メーカー、ロボット確認.csv`（命名・モデルの基準）
- `data/robots.ts` / `data/manufacturers.ts` / `data/types.ts`
- `lib/display.ts`（`sortRobots` / `sortManufacturers` / `sortByDisplayOrder`）
- `lib/robotFilters.ts` / `components/RobotsBrowser.tsx`
- `lib/data.ts` / `lib/articlePlacements.ts` / `lib/articleDisplay.ts` / `components/ReportsBrowser.tsx`
- `lib/validate.ts`

## 調査結果（事実ベース）

### A. CSV と robots データの突合

- **命名は一致**（前作業の `nameJa` 掃除で `name` = CSV 値に揃った）。
- robots ページは **published のみ**表示。CSV 上段23社のうち、**20モデルが `draft`** で非表示：
  Eve / A2 Lite / X1 / X2 / X2 Ultra / Walker S / Walker C / Walker X / Panda Robot / GR-3C / Forerunner K1 / Luna / Oli / IRON / T800 / SA01 / L7 / Q5 / M7 / MenteeBot
- **draft 20件はすべて `sources` 記入済み**。robot は validate が出典を常時必須にしており、現状 build が通る＝**published へ昇格しても error は増えない**（鮮度 warning が出る可能性のみ）。
- **バックログ26社はデータに0件**（`data/manufacturers.ts` に存在しない）。→「出さない」は**既に満たされている**。robots も0件。追加実装は不要。
- **`A2 Max` は未登録**。CSV は AgiBot に「A2 Ultra」と「A2 Max」を別モデル併記するが、データは1件で `id: agibot-a2-max` を **A2 Ultra が使用**（旧 slug `agibot-a2-max` を `previousSlugs` 保持）。＝過去に A2 Max→A2 Ultra へ改名した痕跡。**別モデルか改名統合かは一次情報での要確認**。
- `Figure 02` は archived（CSV非掲載＝想定どおり。据え置き）。

### B. 並べ替えの現状

- robots ページに**ソートUIは無い**。順序は固定で `sortRobots('name')`（`lib/robotFilters.ts:84`）＝メーカー名(英語A-Z)→ロボット名。
- `sortRobots` は `stage` / `japan` / `name` の3キーを持つが、`name` 以外は未使用・UI非露出。
- **`featuredRank?: number`（`data/types.ts:148` robot / `212` manufacturer）が型に存在するが、データに1件も入っておらず、コードからも未参照**＝キュレーション順の仕組みが用意されたまま死蔵。

### C. 記事ソートの重複

- `getArticles()`（`lib/data.ts:124`）が publishedAt 降順の正本順を返す。
- 同一コンパレータ `(a,b)=>b.publishedAt.localeCompare(a.publishedAt)` が**4箇所にバイト単位で重複**：
  `lib/data.ts:124` / `lib/articlePlacements.ts:8` / `lib/articleDisplay.ts:6` / `components/ReportsBrowser.tsx:35`
- `ReportsBrowser` は `getArticles()`（既ソート済み）を受けて**もう一度ソート**＝二重・冗長。
- コンパレータが完全同一なので、**1関数へ抽出しても挙動は不変**（安全）。`ReportsBrowser` の二重ソート削除も、入力が同一キーで安定ソート済みのため安全。

## 方針

### 1. CSV モデルの公開化（データ）

- **draft 20件を `publishStatus: 'published'` に昇格**（すべて CSV 上段社のモデル・出典あり）。
- `Figure 02` は archived 据え置き。
- バックログ26社は**何もしない**（データに無い＝出ない）。
- **A2 Max は本計画では未確定**。下記「判断が必要」で扱う。データ判断が出るまで A2 Ultra 1件のまま。
- 昇格対象は機械的に全 draft ではなく、CSV 上段社のモデルに限定（現状 draft は全件これに該当）。公開前に各レコードの `summary` / `specs` の薄さを目視し、明らかに未完成なものは個別に draft 据え置き可（編集判断）。

### 2. 並べ替えアーキテクチャ（最適＋拡張可能）

**標準形**：「ソート済み結果」ではなく「キーで切り替わる単一のソート関数」を正本にする。`sortRobots(robots, key, manufacturers)` を拡張する。

- `lib/display.ts` の `sortRobots` に**キー `'featured'` を追加**し、**既定キーにする**：
  `featuredRank` 昇順（`?? Infinity` で未設定は最後）→ **タイブレークは既存 `'name'` と完全同一**の `compareRobotCatalogNames`（メーカー名→ロボット名→slug）。
- `lib/robotFilters.ts:84`（一覧）と `src/app/robots/[slug]/page.tsx:64`（詳細の前後ナビ）の両方を `'name'`→`'featured'` に。
  → **一覧の並びと詳細 prev/next を同一順に保つ**（片方だけ変えると順序がズレる）。
- これにより：
  - **編集者が `featuredRank` を入れた順に上位表示**できる（CSV の優先順位や注目機種を反映）。配列順に依存しない。
  - `featuredRank` 未設定なら **`'name'` と数学的に同一の並び**にフォールバック（タイブレークが同じため）。
  - **将来の拡張は「キーを増やす＋UIで選ばせる」だけ**：`stage`/`japan`/`name` は既存、`SelectControl`＋URLパラメータ（既存フィルタと同形）で露出すれば新規ソートロジックは不要。

> **重要（スコープの正直さ）**：本計画は**仕組みと既定キーの切替まで**を入れる。`featuredRank` を1件も入れなければ、**robots ページの見た目の並びは現状（名前順）と同一**で変わらない。実際に「CSV優先度順」へ並び替えるには `featuredRank` への**値付け（編集作業）が別途必要**。本計画はその受け皿を作る。
>
> なぜ featuredRank 既定が最適か：判断ポータルでは「重要・代表機種を先に見せる」価値が高く、純アルファベットより編集制御が要る。死蔵フィールドを活かし、配列順非依存・将来のユーザー選択ソートとも両立する。
>
> スコープ外：メーカー側の `featuredRank`（`data/types.ts:212`）も死蔵だが、今回は robots のみ対象（manufacturers の並びは現状の `sortManufacturers` を維持）。

### 3. 記事ソート重複の解消（DRY）

- `lib/display.ts` に名前付きコンパレータを1つ追加（例）：
  ```ts
  export const byArticlePublishedDesc = (a: Article, b: Article) =>
    b.publishedAt.localeCompare(a.publishedAt);
  ```
- 4箇所の直書きをこれに置換：`lib/data.ts:124` / `lib/articlePlacements.ts:8`（`sortArticlesByPublishedAt` 内部）/ `lib/articleDisplay.ts:6` / `components/ReportsBrowser.tsx:35`。
- `ReportsBrowser` の二重ソートは**削除**（`getArticles()` の順を信頼）。完全同一キー・安定ソートのため表示順は不変。
- 配置先は `lib/display.ts`。**循環import無しを確認済み**（display.ts は型のみ import・data.ts は display.ts を未参照）ので、`data.ts` から安全に import できる。

## 変更ファイル

- `data/robots.ts`（draft 20件 → published。A2 Max は判断保留）
- `lib/display.ts`（`sortRobots` に `'featured'` キー追加＋`byArticlePublishedDesc` 追加。`Article` 型 import が必要）
- `lib/robotFilters.ts`（一覧の既定ソートキー `'name'`→`'featured'`）
- `src/app/robots/[slug]/page.tsx`（prev/next の `sortRobots('name')`→`'featured'`。一覧と順序を一致）
- `lib/data.ts` / `lib/articlePlacements.ts` / `lib/articleDisplay.ts` / `components/ReportsBrowser.tsx`（共有コンパレータへ置換・二重ソート削除）

> 実装は3コミットに分けると追いやすい：(1) `data:` CSV公開化、(2) `feat(sort):` featuredRank対応、(3) `refactor:` 記事ソート集約。

## 変更しないファイル

- `data/manufacturers.ts`（バックログ社は元から不在。追加しない）
- `data/types.ts`（`featuredRank` は既存・型変更なし）
- `components/RobotsBrowser.tsx`（今回はUIソート露出を含めない。既定順の変更のみ）
- robots/manufacturers の `id` / `slug`（不変）

## 影響範囲

- **データ**：robots の公開数が 30→約50 に増える（draft 20件公開）。一覧・比較・sitemap・detail SSG 対象が増える。
- **コード**：robot 既定キーが `'name'`→`'featured'`。ただし **featuredRank を入れるまで並びは名前順と同一**（タイブレーク一致）＝**この計画単体では robots ページの表示順は変わらない**。記事ソートは挙動不変（DRYのみ）。
- build：draft公開で freshness **warning** が増える可能性（error ではない）。

## リスクと軽減策

| リスク | 軽減策 |
| --- | --- |
| 未完成の draft を公開して薄いカードが出る | 公開前に summary/specs を目視。薄いものは個別 draft 据え置き可。不明値は既存の「要確認」表示でカバー |
| `featuredRank` 既定化で並びが変わって見える | 値未設定なら名前順フォールバックで現状維持。値を入れた時だけ変わる（意図的） |
| 記事ソート集約で順序が変わる | コンパレータ完全同一・安定ソートのため不変。検証で reports 一覧の順を目視 |
| A2 Max を誤って別追加 or 誤統合 | 一次情報確認まで保留。本計画では触らない |
| draft公開で鮮度切れ warning 増 | warning は build を止めない。鮮度レビュー（checklist G）で順次 `checkedAt` 更新 |

## 検証コマンド

```bash
npx tsc --noEmit
npm run validate:data   # draft→published で error が出ないこと（warning は許容）
npm run build           # 公開数増加後も SSG 成功
git diff --check
```

## 手動確認項目

- robots ページに CSV 上段モデル（旧 draft 20件）が表示される
- バックログ社・そのロボットは表示されない（元から不在）
- `featuredRank` 未設定時、robots の並びが従来の名前順と一致
- `featuredRank` を仮で1件入れると先頭に来る（仕組み確認）
- reports 一覧・home 注目記事・記事内 featured の順が従来どおり（新しい順）

## 実装しないこと

- robots ページへのユーザー選択ソートUI追加（アーキテクチャは用意するが露出は別PR）
- `featuredRank` の本格キュレーション値付け（仕組みのみ。値は編集で）
- バックログ26社・そのロボットの新規追加
- A2 Max のデータ確定（一次情報確認が前提）
- `data/types.ts` の型変更

## 判断が必要な点

1. **draft 20件の公開範囲**：全件公開でよいか、内容が薄い特定機種は draft 据え置きにするか（リスト提示可）。
2. **A2 Max**：CSV が別モデル併記。一次情報で「別モデル（要追加）」か「A2 Ultra と同一（CSV重複）」か確定が必要。
3. **`featuredRank` の既定化**：仕組み導入に同意か。値付け（CSV優先順位を反映するか）は後続でよいか。

## 自己監査の反映

ワークフロー §1.5 に沿い、実コードで突合した補正：

**第1パス（事実確認）**
- draft公開の安全性を「validate が robot 出典を常時必須＝現状 build 通過」から確認（昇格で error 増加なし）。
- 「バックログを出さない」は**実装不要**（データに不在）と確定。過剰実装を回避。
- 記事ソート4箇所がバイト単位同一であることを確認し、抽出を「挙動不変」と断定。
- `featuredRank` が型のみ存在・完全死蔵であることを確認し、新フィールド追加ではなく**既存資産の活用**に。

**第2パス（計画の自己監査）**
1. **prev/next の不整合**：一覧を `'featured'` にするのに robot 詳細の前後ナビ（`robots/[slug]/page.tsx:64`）が `'name'` のままだと順序がズレる。→ 変更対象に追加し両方を `'featured'` に。
2. **「仕組み」と「実際の並び変化」の混同**：featuredRank 未設定では表示順は名前順のまま。本計画単体では robots ページの見た目は変わらない旨を目的・影響範囲に明記（過大広告の回避）。
3. **タイブレーク同一の保証**：`'featured'` のタイブレークが `'name'` と完全同一（`compareRobotCatalogNames`）であることを明記し、フォールバックの無変化を保証。
4. **メーカー featuredRank はスコープ外**と明記。
5. **`display.ts` の `Article` import** 必要を実装メモに追加。

**反映しなかった項目（理由）**
- UIソート露出：スコープ外・別PR（仕組みは用意）。
- `featuredRank` の値付け：編集判断（仕組みのみ提供）。
- robots 一覧へのソートUI：別PR。
