# ロボットデータ ファクトチェック反映 実装計画

**作成日:** 2026-07-01  
**ブランチ:** fix/usecase-data-scope-cleanup（Phase A/B）→ 新ブランチ推奨（Phase C）  
**入力:** `docs/planning/robot-factcheck-research-prompt-2026-07-01.md` に対する外部レビュー結果  
**対象ページ:** `/robots`（一覧）・`/robots/[slug]`（詳細）・`/use-cases/[slug]`（用途詳細内の候補ロボット）

---

## 0. 方針

本計画は以下の3フェーズに分ける。

| フェーズ | 内容 | 型変更 | 難度 |
|---|---|---|---|
| **A. データ修正** | 既存フィールドの値を正確な値に修正 | なし | 低 |
| **B. 新規ロボット追加** | 高優先モデルをDBに追加（既存型の範囲内） | なし | 中 |
| **C. データモデル拡張** | `marketAvailability`・`scopeStatus`・`evidenceLevel` 等の導入 | あり | 高 |

Phase A・B は現ブランチで連続実施可能。Phase C は型変更を伴うため別ブランチで計画する。

**実装しないこと（今回スコープ外）:**
- Phase C のデータモデル拡張に対応する UI の全面改修
- 新規ロボット解説記事の作成（editorial_style_guide_v1.md のメーカー解説・ロボット解説フォーマット参照、別タスク）
- `leju-kuavo5-w`・`unitree-h2-d`・`booster-t2`・`robotera-star1` 等の「要公式確認」モデルの追加

---

## Phase A：データ修正（既存型内）

### FC-A-001：mobility 修正（onex-eve）

**対象ファイル:** `data/robots.ts`  
**問題:** `onex-eve.specs.mobility` が `biped` だが、1X公式は「wheeled factory humanoid」と明示。  
**変更内容:** `mobility: 'biped'` → `'wheeled'`  
**影響ページ:** `/robots`（フィルタ）・`/robots/onex-eve`  
**検証:** `npm run validate:data && npm run build`

---

### FC-A-002：mobility 修正（sanctuary-phoenix）

**対象ファイル:** `data/robots.ts`  
**問題:** Phoenix Gen 8 は車輪ベース採用が公式確認済み。現行 `biped` は旧世代の記述。  
**変更内容:** `mobility: 'biped'` → `'wheeled'`、`summary`・`description` に「Gen 8 以降 wheeled base」を注記。  
**制約:** 世代分離（`sanctuary-phoenix-gen7`・`sanctuary-phoenix-gen8`）は Phase B またはそれ以降で実施。今回は現行世代（Gen 8）ベースに寄せる。  
**影響ページ:** `/robots`・`/robots/sanctuary-phoenix`  
**検証:** validate + build

---

### FC-A-003：deploymentStage 修正（複数）

**対象ファイル:** `data/robots.ts`

| robotId | 現在値 | 修正値 | 理由 |
|---|---|---|---|
| `wandercraft-calvin` | `production` | `limited-production` | Renault1社での産業導入。全体量産ではない |
| `boston-dynamics-atlas` | `limited-production` | `pilot` | 公式は enterprise pilot 文脈。量産販売は未開始 |
| `xpeng-iron` | `internal-use` | `pilot` | 量産目標 2026 年末。現時点は pilot が適切 |

**注意:** `xpeng-iron` の `description`・`summary` に「2026年末量産予定」の文言を追加し、断定表現を除去する。  
**影響ページ:** `/robots/[slug]`（詳細ページのステータス表示）  
**検証:** validate + build

---

### FC-A-004：galbot-g1 mobility 確認と修正

**対象ファイル:** `data/robots.ts`  
**問題:** レビューでは「biped ではなく wheeled/mobile-base として確認すべき」と指摘。DB上は `biped`。  
**事前調査が必要:** 実装前に Galbot 公式で G1 の移動方式を確認する。  
- biped 確定 → 変更なし
- wheeled 確定 → `mobility: 'wheeled'`、`category` 再検討  
**影響ページ:** `/robots`・`/robots/galbot-g1`

---

### FC-A-005：description 表現の精度修正（複数）

**対象ファイル:** `data/robots.ts`

以下のロボットで「公式確認済みスペック」と「二次情報ベースのスペック」が混在しているため、断定表現を緩和する。

| robotId | 修正箇所 | 修正方針 |
|---|---|---|
| `figure-03` | 身長・重量・可搬・DoF | 「約〜」または「報道ベース」表記に変更。公式確認済み項目（ワイヤレス充電・軽量化・触覚検知）は維持 |
| `tesla-optimus` | production 関連表現 | 「社内利用中。量産時期は未公表」に修正 |
| `kawasaki-kaleido` | 製品訴求表現 | 「研究・実証段階。世代（Kaleido 9 等）によりスペック異なる」を明記 |
| `engineai-t800` | 量産断定 | 「会社発表ベースで量産出荷開始」に変更（`limited-production` 維持） |
| `wandercraft-calvin` | 数値スペック | 身長・重量・DoF 等に「二次情報」注記を追加または削除 |

**影響ページ:** `/robots/[slug]`  
**検証:** validate + build

---

### FC-A-006：robotera-q5 の再分類（削除取り消し）

**現状確認:** `robotera-q5` は現在 DB に `publishStatus: 'published'`・`mobility: 'biped'` で存在しているため削除の必要はない。  
**変更内容:**  
- `mobility: 'biped'` → 公式確認後に `'wheeled'` へ修正  
- `summary`・`description` に「車輪型・双腕構成の詳細は公式確認待ち」を注記  
- `publishStatus: 'published'` 維持（borderline 判定のため削除不要）  
**注意:** RBTX ページは二次情報のため、mobility の最終確定は公式ページを確認してから行う。

---

**Phase A まとめ：コミット構成**

```
FC-A-001〜002: fix(data): correct mobility for onex-eve and sanctuary-phoenix
FC-A-003:      fix(data): adjust deploymentStage for calvin/atlas/xpeng-iron
FC-A-004:      fix(data): correct galbot-g1 mobility (after official confirmation)
FC-A-005:      fix(data): soften unconfirmed spec claims in descriptions
FC-A-006:      fix(data): reclassify robotera-q5 as borderline wheeled-humanoid
```

---

## Phase B：新規ロボット追加（既存型内）

### FC-B-001：apptronik-apollo-2

**優先度:** 高  
**根拠:** Reuters / Business Insider / GlobeNewswire が 2026-06-30 に Apollo 2 発表を報道。  
**対象ファイル:** `data/robots.ts`（メーカー `apptronik` は既存・published）

```
id: 'apptronik-apollo-2'
slug: 'apptronik-apollo-2'
name: 'Apollo 2'
manufacturerId: 'apptronik'
category: 'humanoid'
specs.mobility: 'biped'
deploymentStage: 'pilot'
buyerReadiness: 'requires-poc'
publishStatus: 'draft' → 公式ページ確認後に 'published'
```

**注意:**
- 初代 `apptronik-apollo` のスペックを Apollo 2 に流用しない
- 公式ページが存在しない段階では `publishStatus: 'draft'` で追加
- 公式ページ URL を `sources[]` に必ず含める

**影響ページ:** `/robots`（公開後）  
**検証:** validate + build

---

### FC-B-002：agibot-g2

**優先度:** 高  
**根拠:** AgiBot 公式 G2 製品ページあり。wheeled、産業用途訴求。  
**対象ファイル:** `data/robots.ts`（メーカー `agibot` は既存・published）

```
id: 'agibot-g2'
slug: 'agibot-g2'
name: 'G2'
manufacturerId: 'agibot'
category: 'mobile-manipulator' または 'humanoid'（公式ページ確認後に決定）
specs.mobility: 'wheeled'
deploymentStage: 要確認（公式ページで確認）
buyerReadiness: 要確認
publishStatus: 'draft' → 確認後 'published'
sources: [{ url: 'https://www.agibot.com/products/G2', ... }]
```

**注意:** G2 が `mobile-manipulator` か `humanoid` かは公式フォームファクタで判断する。双腕・人型上半身であれば `humanoid`。

---

### FC-B-003：unitree-g1-d

**優先度:** 中〜高  
**根拠:** Unitree 公式 G1-D ページあり。wheeled、昇降機構、7DoF×2 の双腕。  
**対象ファイル:** `data/robots.ts`（メーカー `unitree` は既存・published）

```
id: 'unitree-g1-d'
slug: 'unitree-g1-d'
name: 'G1-D'
manufacturerId: 'unitree'
category: 'mobile-manipulator' または 'humanoid'
specs.mobility: 'wheeled'
deploymentStage: 要確認
publishStatus: 'draft' → 確認後 'published'
sources: [{ url: 'https://www.unitree.com/mobile/G1-D', ... }]
```

**注意:** G1 と G1-D は別製品として扱う。G1 のスペックを流用しない。

---

### FC-B-004：agibot-g1（要確認）

**優先度:** 中  
**条件:** AgiBot 公式ラインナップに G1 が存在することを確認できた場合のみ追加。  
**対象ファイル:** `data/robots.ts`  
**対応:** 公式 https://www.agibot.com/jp/ にアクセスし、G1 の独立製品ページがある場合に draft で追加。

---

**Phase B まとめ：コミット構成**

```
FC-B-001: feat(data): add apptronik-apollo-2 as draft
FC-B-002: feat(data): add agibot-g2 as draft (wheeled)
FC-B-003: feat(data): add unitree-g1-d as draft (wheeled)
FC-B-004: feat(data): add agibot-g1 if official page confirmed
```

Phase B の各コミット後に `npm run validate:data && npm run build` を必ず実行する。

---

## Phase C：データモデル拡張（別ブランチ推奨）

Phase A/B と同ブランチで実施しない。型変更のため影響範囲が広い。

### FC-C-001：MobilityType 拡張

**対象ファイル:** `data/types.ts`  
**変更:**

```ts
// 現在
export type MobilityType = 'biped' | 'wheeled' | 'hybrid' | 'stationary';

// 追加
export type MobilityType = 'biped' | 'wheeled' | 'wheel-legged' | 'hybrid' | 'stationary' | 'unknown';
```

**理由:** Leju KUAVO 5-W や wheel-legged モデルが今後追加されたときに対応するため。  
**連動変更:** `lib/labels.ts`（MobilityType → 表示名）・`lib/display.ts`（表示順）

---

### FC-C-002：scopeStatus フィールド追加

**対象ファイル:** `data/types.ts`  
**変更:**

```ts
export type ScopeStatus =
  | 'in-scope'
  | 'borderline'
  | 'research-only'
  | 'out-of-scope'
  | 'needs-confirmation';
```

Robot 型に optional フィールドとして追加:

```ts
scopeStatus?: ScopeStatus;
scopeNote?: string;
```

**連動変更:** `lib/labels.ts`・`lib/visualSemantics.ts`（色トーン）・ロボット詳細ページ・一覧カード  
**UI案:** 一覧カードに `research-only` や `borderline` ラベルを薄く表示。詳細ページ上部に注意書きを表示。

---

### FC-C-003：marketAvailability フィールド追加

**対象ファイル:** `data/types.ts`  
**変更:**

```ts
export type MarketAvailability =
  | 'enterprise-deployment'
  | 'enterprise-pilot'
  | 'developer-platform'
  | 'research-platform'
  | 'reservation'
  | 'internal-use'
  | 'planned-production'
  | 'company-claimed-delivery'
  | 'unknown';
```

Robot 型に追加:

```ts
marketAvailability?: MarketAvailability;
```

**理由:** 現行 `deploymentStage` は「製品の成熟段階」、`marketAvailability` は「調達可能性の実態」として役割を分ける。  
**連動変更:** `lib/labels.ts`・`lib/display.ts`・ロボット詳細ページ  
**UI案:** `/robots/[slug]` の「入手・調達」セクションで `marketAvailability` を優先表示。`deploymentStage` は補助情報として維持。

---

### FC-C-004：evidenceLevel を sources[] に追加

**対象ファイル:** `data/types.ts`（MediaSource 型）  
**変更:**

```ts
export type EvidenceLevel =
  | 'official-product-page'
  | 'official-press-release'
  | 'official-demo'
  | 'official-company-claim'
  | 'major-media-report'
  | 'distributor-page'
  | 'secondary-db'
  | 'unverified';

// MediaSource に追加
evidenceLevel?: EvidenceLevel;
```

**連動変更:** 全 data/*.ts の sources[] に `evidenceLevel` を追記（作業量大）

---

### FC-C-005：UI 反映

**対象ファイル:** `components/` 内のロボット関連コンポーネント  
**変更方針:**
- 一覧カードに `scopeStatus` バッジを表示（`research-only` / `borderline` のみ）
- 詳細ページに `marketAvailability` セクションを追加
- `evidenceLevel` は詳細ページの sources 欄に小さく表示
- `research-only` ロボットはデフォルトフィルタ（「すべて」表示）では薄く表示する

**注意:** UI 変更は必ずモバイル幅（375px）と PC 幅（1280px）の両方で確認する。

---

**Phase C コミット構成（別ブランチ）**

```
FC-C-001: feat(types): extend MobilityType with wheel-legged and unknown
FC-C-002: feat(types): add scopeStatus and scopeNote to Robot type
FC-C-003: feat(types): add marketAvailability to Robot type
FC-C-004: feat(types): add evidenceLevel to MediaSource
FC-C-005: feat(data): backfill scopeStatus for all published robots
FC-C-006: feat(data): backfill marketAvailability for all published robots
FC-C-007: feat(ui): display scopeStatus badge in robot list cards
FC-C-008: feat(ui): display marketAvailability in robot detail page
FC-C-009: feat(ui): display evidenceLevel in sources section
```

---

## 全体スケジュール（目安）

```
Phase A  fix/usecase-data-scope-cleanup（現ブランチ）  今すぐ着手可
Phase B  fix/usecase-data-scope-cleanup（現ブランチ）  Phase A 後
Phase C  feat/robot-data-model-v2（新ブランチ）        Phase A/B マージ後
```

---

## 検証コマンド（全フェーズ共通）

```bash
npm run validate:data   # 型・参照整合チェック
npm run build           # TypeScript ビルド・静的生成
```

手動確認（Phase A/B 完了後）:
- `/robots` → フィルタ（mobility=wheeled）で変更後ロボットが正しく出るか
- `/robots/onex-eve`・`/robots/sanctuary-phoenix` → mobilityラベルが「車輪」表示に変わっているか
- `/robots/wandercraft-calvin` → deploymentStage 表示が変わっているか
- `/robots/[新規追加スラッグ]` → draft の場合は 404 になることを確認

手動確認（Phase C 完了後）:
- モバイル幅（375px）でロボット一覧のバッジが崩れないか
- `scopeStatus: 'research-only'` のロボットが適切に表示されるか
- URLパラメータ直打ち（`/robots?mobility=wheel-legged`）で壊れないか

---

## 残るリスク

| リスク | 対処 |
|---|---|
| Galbot G1 / RobotEra Q5 の公式 mobility が確認できない | `draft` または `publishStatus: 'published'` のまま description に「要確認」を追記 |
| agibot-g1 / unitree-h2-d が公式ページ上で独立モデルでない可能性 | 追加しない（既存モデルの variant として description に注記するにとどめる） |
| Phase C の marketAvailability / evidenceLevel の全データバックフィルは作業量が大きい | Phase C を段階的に実施（型追加 → 一部データ → UI → 残データ） |
| `wheel-legged` 追加後に既存 validates が変わる可能性 | types.ts 変更後に validate を通してから次 task へ進む |
