# データアーキテクチャ再設計 v1（CMS見据え・保守性主眼）

## 0. このドキュメントの位置づけ

- **目的**: Deploid のデータ構造を「正本がどこにあり、何を変えれば何が追従するか」が一目で分かる形に再設計する。Git型CMS移行と長期保守に耐える骨格を定義する。
- **スコープ**: 本ドキュメントは **設計のみ**。実データ移行・コード変更は次フェーズ（本書 §12 に移行手順を示す）。
- **対の成果物**: 運用面の実行チェックリストは `data-maintenance-checklist-v1.md`（追加・更新・slug変更・公開・鮮度レビューの手順）。
- **既存ドキュメントとの関係**:
  - `humanoid_data_management_guide_v1.md` / `humanoid_data_model_policy_v1.md` / `nextjs_data_types_v1.ts` を **上書きせず上位に立つ再設計提案**として扱う。
  - 本書で確定した方針は、実装フェーズで上記3ファイルへ反映する。
  - **本書が解消する2つの既存矛盾**（詳細は §1）:
    1. slug が「URL」と「外部キー」を兼任している（slug変更不可問題の正体）
    2. 現ガイドは reports を「非速報」と定義するが、運用方針は「業界ニュースメディア」へ拡張する

### 確定済みの前提（ユーザー判断）

| 論点 | 決定 |
|---|---|
| データ管理先 | **Git型CMS**（Keystatic/TinaCMS想定。TS/MDをリポジトリに残し編集UIを後付け） |
| 参照の持ち方 | **不変 id と slug を分離**。参照は id、slug は可変URL |
| 今回の成果物 | **設計ドキュメントのみ** |
| reports の役割 | **ヒューマノイド専門ニュースメディア**（業界最新情報・取材記事・企業レポート・分析） |

---

## 1. 現状の問題分析（なぜ作り直すか）

### 1-1. slug の役割過多（核心）

現状 `slug` は3つの役割を1フィールドで兼任している:

```
slug ──┬── URL識別子        /robots/unitree-g1
       ├── 外部キー（参照先）  Robot.manufacturerSlug, Report.relatedRobotSlugs[]
       └── 一意性キー         validate の重複検出
```

結果として **slug は実質「永久凍結」** される。`agibot-a2-max`（実際の製品名は A2 Ultra）のような命名ミスを直したくても、変更すると URL も全参照も壊れる。

→ **解決**: 役割を分離する（§3）。
- **不変 id** … 外部キー＋一意性キー。発番したら二度と変えない。
- **可変 slug** … URLのみ。いつでも変更可。旧slugは301リダイレクトで保護。

### 1-2. 正本の散在（共通化されていないもの）

| データ | 正本化されているか | 現状 |
|---|---|---|
| タグ | ✅ 済 | `lib/tagRegistry.ts`（型union生成＋validate検出）。理想形 |
| enumの表示ラベル | ✅ 済 | `lib/labels.ts` |
| enumの表示順 | ✅ 済 | `lib/display.ts` |
| メーカー事実 | ✅ 済 | `manufacturers` を robots が参照 |
| **ロボットの name** | ❌ 各エントリ直書き | 1箇所管理の仕組みなし |
| **スペック項目の定義（単位・ラベル）** | ❌ 散在 | 型に項目はあるが、単位・表示ラベルが UI 側に分散 |

→ **解決**: tagRegistry のパターンを **スペック項目とenum全体へ横展開**（§5, §8）。

### 1-3. ニュースメディア化に対する設計不足

現 `reports` は型は豊富（`type` 9種・`section` 5種）だが、運用方針が「分析中心・非速報」に縛られている。専門ニュースメディアにするには **記事種別の第一軸を明確化**し、速報・取材・企業レポートを一級市民として扱う必要がある（§7）。

---

## 2. 設計原則（再設計の判断基準）

1. **正本主義（Single Source of Truth）**: あらゆる事実・ラベル・列挙・単位は「1箇所」に置き、他はそれを参照する。「変えたら追従」はこの原則の帰結。
2. **id と表示の分離**: 機械が使う識別子（id）と、人間が見るもの（slug/name/label）を分ける。
3. **参照は id、表示は導出**: レコード間リンクは不変 id で持つ。表示名は参照先から都度引く（コピーしない）。
4. **UI非依存**: データはUIレイアウトの都合を持ち込まない（列数・色・並び順の装飾はデータに入れない。意味的な順序は別途 order レジストリ）。
5. **出典必須・未確認は明示**: 事実値には `sources`。不明値はハードコードせず省略（UIが「要確認」を表示）。
6. **検証可能**: 参照整合・id一意・未登録タグ・slug衝突を `validate` で機械検出。
7. **CMS移行で呼び出し形を変えない**: ページは常に `lib/data.ts` 経由。物理配置（配列TS→個別ファイル）が変わっても上位は不変。

---

## 3. 識別子モデル（最重要）

### 3-1. 3層の識別子

| 層 | フィールド | 可変性 | 用途 | 例 |
|---|---|---|---|---|
| **安定ID** | `id` | **不変**（発番後変更禁止） | 外部キー・一意性・CMSのレコードキー（=将来のファイル名） | `unitree-g1` |
| **URLスラッグ** | `slug` | 可変（いつでも変更可） | 公開URLのパスセグメントのみ | `unitree-g1` |
| **旧スラッグ** | `previousSlugs?: string[]` | 追記のみ | slug変更時の301リダイレクト元 | `['unitree-g1-old']` |

**運用ルール**:
- 作成時は `id === slug`（人間可読な安定キーを発番）。
- 製品名が変わったら **slug だけ** 更新し、旧 slug を `previousSlugs` に追記。`id` は据え置き。
- `id` はやや陳腐化してもよい（非ユーザー向け）。安定性が陳腐化回避より優先。
- `agibot-a2-max` 問題: id は `agibot-a2-max` のまま据え置き、slug を `agibot-a2-ultra` に変更、name を正す。参照は id なので無傷。

> **なぜ opaque な ULID/nanoid にしないか**: Git型CMSでは人間がファイル名・差分を読む。`unitree-g1` のような可読IDの方が保守性が高い。一意・不変でありさえすればよく、ランダム性は不要。

### 3-2. 参照フィールドの改名（slug → id）

| 現フィールド | 新フィールド |
|---|---|
| `Robot.manufacturerSlug` | `Robot.manufacturerId` |
| `UseCase.candidateRobotSlugs` | `UseCase.candidateRobotIds` |
| `Report.relatedRobotSlugs` | `Article.relatedRobotIds` |
| `Report.relatedManufacturerSlugs` | `Article.relatedManufacturerIds` |
| `Report.relatedUseCaseSlugs` | `Article.relatedUseCaseIds` |
| `Report.relatedGuideSlugs` | `Article.relatedGuideIds` |
| `Guide.relatedRobotSlugs` / `relatedUseCaseSlugs` | `relatedRobotIds` / `relatedUseCaseIds` |
| `Deployment.manufacturerSlug` / `robotSlug` | `manufacturerId` / `robotId` |

> 命名は `~Id` / `~Ids` に統一。「何を参照しているか」がフィールド名で自明になる。

### 3-3. リダイレクト解決

- ルーティング: `/robots/[slug]` で受け、`slug` 一致がなければ `previousSlugs` を走査し、ヒットしたら現 slug へ 301。
- `lib/data.ts` に `getRobotBySlugOrRedirect(slug)` を追加（実装フェーズ）。返り値で「正規slug」と「リダイレクト要否」を返す。

---

## 4. コレクション全体像

### 4-1. レイヤー分類

```
コアエンティティ（事実の個票）
  manufacturers   供給体制
  robots          導入判断の個票

編集コンテンツ（鮮度・読み物）
  articles        ニュースメディア（旧 reports を改称・拡張）★

意思決定支援（フレーム・逆引き）
  guides          意思決定フレーム
  useCases        用途からの逆引き

派生・補助
  deployments     導入事例（ワールドマップ用）
  placements      記事の掲載枠（旧 reportPlacements）
  tags            タグ正本（lib/tagRegistry.ts）
  specSchema      スペック項目正本（新設）★
```

### 4-2. 参照関係図（すべて id 参照）

```
manufacturers ──< robots                 (manufacturer has many robots)
robots         ──< deployments           (robot deployed at many sites)
useCases       >── robots (candidate)    (useCase ← candidate robots)
guides         >── robots, useCases
articles       >── robots, manufacturers, useCases, guides
placements     >── articles
```

- `<` = 1対多、`>──` = 多対多 or 参照。
- **逆向きは導出**（§6）。robots は自分が属する useCases を持たない。`lib/data.ts` が逆引きする。

---

## 5. 正本マトリクス（「何をどこで管理するか」の答え）

ユーザーの問い「slug以外の管理方法、個別管理すべきか共通化か」への直接回答。

| 情報 | 正本の置き場 | 種別 | 「変えたら追従」する範囲 |
|---|---|---|---|
| レコードの存在・一意性 | 各 collection の `id` | 個別 | 参照整合（validate） |
| 公開URL | 各レコードの `slug` | 個別 | そのページのURLのみ（旧URLは301保護） |
| ロボットの事実値（スペック等） | `robots` 各レコード | 個別 | 詳細・一覧・比較に自動反映 |
| メーカーの事実値 | `manufacturers` | 共通（robotsが参照） | 全関連ロボット・記事に追従 |
| タグの値とラベル | `lib/tagRegistry.ts` | 共通レジストリ | 全コレクションのタグ表示 |
| **スペック項目の単位・ラベル・グループ** | `lib/specSchema.ts`（新設） | 共通レジストリ | スペック表・比較表の表示 |
| enum のラベル | `lib/labels.ts` | 共通レジストリ | 全UI |
| enum の表示順 | `lib/display.ts` | 共通レジストリ | フィルタ・並び |
| 記事の掲載枠・スポンサー | `placements` | 個別 | 記事一覧の枠 |

**判断基準**:
- 複数レコードで**同じ値を共有**するもの（メーカー名、タグ、単位、ラベル）→ **共通レジストリ**。
- レコード**固有の事実**（このロボットの身長）→ **個別レコード**。
- 「個別レコードだが、項目の定義（単位やラベル）は共通」→ **値は個別 / メタは共通レジストリ**（スペックが典型。§8）。

---

## 6. 関連の向き（双方向 vs 片方向）

維持する既存の良い設計:

| 関連 | 持ち方 | 理由 |
|---|---|---|
| robot → manufacturer | robot が `manufacturerId` を持つ（単方向） | 多対1。robotが主 |
| useCase ⇄ guide | **双方向**（互いに id を持つ）＋ validate で整合チェック | 両側UIで使うため |
| article → robots/mfr/useCase/guide | article が一方的に持つ（単方向） | articleが主、被参照側は知らなくてよい |
| robot ← useCase（候補） | useCase が `candidateRobotIds`、robot側は持たず導出 | robotページは `lib/data.ts` で逆引き |

**原則**: 双方向は「両側のUIが対称に必要」な時だけ。それ以外は単方向＋導出（コピー二重管理を避ける）。

---

## 6.5. レコードのライフサイクルと client 状態（archive挙動・お気に入り）

### 6.5-1. publishStatus の可視性セマンティクス（現状の穴を明文化）

現状: `getRobots()` は `published` のみ返す（`lib/data.ts:12`）。結果、**draft / archived はどのサーフェスにも出ず、関連リンクからも無言で脱落**する（`getRelatedRobots` も published フィルタを通すため）。

| status | 一覧/比較 | 詳細ページ | 関連リンクからの被参照 |
|---|---|---|---|
| `published` | 表示 | 表示 | 表示 |
| `draft` | 非表示 | notFound | **無言脱落（要改善）** |
| `archived` | 非表示 | notFound | **無言脱落（要改善）** |

**方針**: archived は「提供終了」として**関連欄には残し、ラベルで状態を示す**（完全に消さない）。後継機がある場合は §6.5-2 の `supersededById` で誘導する。draft は本番非表示のままでよい。

### 6.5-2. 後継関係（supersession）

実データに既に存在する関係（`figure-02` archived → `figure-03` published）が、現状は本文テキストでしか表現されていない。**`supersededById?: Id` フィールド**を追加し、「この機種は X に置き換わった」を構造化する。

- archived 詳細ページ・関連欄で「後継機: Figure 03」を自動表示。
- 旧機種を消さずに導線を残せる（B2Bでは旧モデル情報も判断材料）。

### 6.5-3. client 状態は id で持つ

- お気に入り（localStorage `deploid_favorites`）と比較URL（`?compare=`）は現状 **slug 依存**。slug を変えると保存済みお気に入りが無言で消える（`CompareClient.tsx:86` で stale slug を黙って破棄）。
- **id で保持**すれば slug 変更に耐える。比較URLも id ベースにし、必要なら slug を表示用に解決する。

---

## 7. articles コレクション（ニュースメディア再設計）

旧 `reports` を `articles` に改称・拡張。専門ニュースメディアの中身（業界最新情報・取材記事・企業レポート・分析）を一級で扱う。

> **改称の扱い**: collection概念は `articles`。公開URLは `/reports` を当面維持（URL破壊回避）するか、`/news` へ移すかは実装フェーズの別判断。本書では内部モデルのみ定義。

### 7-1. 第一軸 = `category`（記事種別）

ユーザーのメディア像に合わせ、編集者が必ず1つ指定する主分類:

| category | 内容 | 速報性 |
|---|---|---|
| `news` | 業界最新情報・発表まとめ | 高 |
| `interview` | 取材記事・インタビュー | 中 |
| `company-report` | 企業レポート（動向・決算・戦略） | 中 |
| `analysis` | 分析・市場考察 | 低 |
| `policy` | 政策・規制アップデート | 中 |

> 既存の `type`（フォーマット）と `section`（サブジェクト）は維持可能だが、第一軸を `category` に一本化し役割重複を整理する（実装フェーズで `type`/`section` を `category` ＋ `tags` に吸収できるか精査）。

### 7-2. 編集ポリシーの矛盾解消

- 旧方針: 「reports は速報ではない」。
- **新方針**: **速報（news）も扱う。ただし全記事に `whyItMatters`（買い手にとっての意味）を必須**とし、単なる転載速報にしない。
- これにより「専門メディアとして速報を載せる」と「導入判断ポータルとしての付加価値」を両立させる。
- `humanoid_data_management_guide_v1.md` の該当記述は実装フェーズで更新する。

### 7-3. articles の主要フィールド（案）

```
BaseRecord（id, slug, previousSlugs, summary, publishStatus,
            updatedAt, reliability, sources, heroImage, seo）
+ title, titleJa
+ category          ← 必須・第一軸（news/interview/company-report/analysis/policy）
+ publishedAt       ← 一覧の鮮度ソート
+ author?
+ tags[]            ← tagRegistry 'report'（→ 'article' に改称検討）
+ whyItMatters      ← 必須（速報でも省略不可）
+ keyTakeaways?[]
+ body?             ← Markdown
+ readingTimeMin?
+ featured?
+ relatedRobotIds[] / relatedManufacturerIds[] /
  relatedUseCaseIds[] / relatedGuideIds?[]
```

---

## 8. スペックの書き換え耐性（specSchema 新設）

ユーザーの「ロボットスペックの書き換えの可能性」への対応。

### 8-1. 問題

現状 `RobotSpecs` はスカラー7項目。新項目（ハンド把持力・リーチ・充電時間・認証）を足すたびに、型・UI・ラベルを別々に直す必要がある。

### 8-2. 解決: スペック項目を共通レジストリ化

`lib/specSchema.ts`（新設）を **スペック項目の正本**にする（tagRegistry と同じ思想）:

```ts
// イメージ（実装フェーズで確定）
export const specSchema = [
  { key: 'heightCm',  group: 'physical',     label: '身長',     unit: 'cm' },
  { key: 'weightKg',  group: 'physical',     label: '重量',     unit: 'kg' },
  { key: 'payloadKg', group: 'manipulation', label: '可搬重量', unit: 'kg' },
  { key: 'reachCm',   group: 'manipulation', label: 'リーチ',   unit: 'cm' },
  { key: 'gripForceN',group: 'manipulation', label: '把持力',   unit: 'N' },
  { key: 'runtimeMin',group: 'power',        label: '連続稼働', unit: '分' },
  { key: 'chargeMin', group: 'power',        label: '充電時間', unit: '分' },
  { key: 'dof',       group: 'mobility',     label: '自由度',   unit: 'DOF' },
  { key: 'ipRating',  group: 'environment',  label: '保護等級', unit: '' },
  // …追加はここ1箇所
] as const;
```

- **追加は specSchema に1行**。型・スペック表・比較表が自動追従。
- `Robot.specs` は `Partial<Record<SpecKey, number | string>>`。値は個別、項目メタは共通。
- 未設定キーは UI が「要確認」を表示（既存方針踏襲）。
- グループ（physical/power/mobility/manipulation/environment/compliance/integration）で詳細ページのスペック表をセクション化。

### 8-3. 収集すべき追加項目（優先度順）

| 項目 | group | 理由 |
|---|---|---|
| ハンド仕様（指数・把持力・ハンドDOF） | manipulation | 「何をつかめるか」は導入判断の核心 |
| アームリーチ(cm) | manipulation | 作業レイアウト設計 |
| 充電時間(分) | power | 稼働計画（runtimeはあるが充電がない） |
| 本体寸法（幅・奥行） | physical | 通路・設備制約 |
| 取得認証（CE/UL/安全規格） | compliance | 日本導入の規制対応 |
| ROS対応・SDK言語 | integration | 統合コスト見積もり |

---

## 9. 出典・信頼度・権利（既存を踏襲）

良くできているため維持。再設計でも全 BaseRecord に必須:

- `sources: Source[]`（title/url/publisher/publishedAt/checkedAt/reliability/note）
- `reliability`（verified/official/reported/estimated）
- 画像は `ImageAsset.rights`（RightsMeta）必須
- 一次出典優先・報道は `reported`・推定は `estimated`・AI生成値を事実に混ぜない

### 9-1. メディアの物理配置ポリシー（現状の分散を解消）

現状の問題: ロボット画像・メーカーロゴの**大半が他社サイトへの外部ホットリンク**（`https://www.unitree.com/...` 等）。ローカル化されているのは agility-digit・onex-neo の2体とロゴ1件のみ。脆い（リンク切れ・403・ホットリンク禁止・権利リスク・バックアップ対象外）。

**方針**:
- 画像実体は**ローカル `public/` に置く**ことを原則とする（外部ホットリンク廃止）。
- 配置規約: `public/images/{robots,manufacturers}/<id>-<role>.<ext>`
  - 例: `public/images/robots/unitree-g1-hero.jpg`、`public/images/manufacturers/unitree-logo.png`
  - **ファイル名を id 基準**にすることで、レコードと画像が1対1で対応し「どこに置いたか」が一意に定まる。
- `ImageAsset.rights`（credit / sourceUrl / rights）は引き続き必須。ローカル保存＝権利クリアではない。
- 外部URLを暫定で使う場合は「未ローカル化」として validate で警告（§10）。
- Git型CMSへ移行後も同じディレクトリ規約を踏襲（Keystatic の image field がこの配置を生成）。

---

## 10. 検証（validate 拡張方針）

現 `lib/validate.ts` を id モデルへ拡張:

| 既存 | 拡張後 |
|---|---|
| slug 重複検出 | **id 重複検出**＋ slug 重複検出（別々に） |
| 参照先 slug 存在チェック | **参照先 id 存在チェック** |
| 双方向ズレ（useCase⇄guide） | 維持（id ベースに） |
| 未登録タグ検出 | 維持 |
| 日付・URL・画像権利 | 維持 |
| （新規）| **`previousSlugs` が現存slugと衝突しない** |
| （新規）| **specs のキーが specSchema に登録済み** |
| （新規）| **slug の文字種（小文字・ハイフン・英数）** |
| （新規）| **画像が外部ホットリンク（未ローカル化）なら警告** |
| （新規）| **`supersededById` の参照先が存在する** |

### 10-1. validate を build ゲートにする（最重要・現状の核心的欠陥）

**現状の欠陥**: `runValidationInDev` は **dev のコンソール出力のみ・本番では即 return・build を止めない**（`lib/validate.ts`）。参照切れや未登録タグがあっても **`npm run build` は通る**。「データが壊れても気づかない」状態。

**方針**: 検証を2段階に分ける。

| レベル | 失敗時の挙動 | 対象 |
|---|---|---|
| **error** | **build を失敗させる**（exit code ≠ 0） | id重複・参照切れ・未登録タグ・slug衝突・publish必須項目欠落（§11.5） |
| **warning** | ログのみ（buildは通す） | 未ローカル画像・確認日が古い（§後述の鮮度） |

- `npm run build` の前段（または CI）で `validate` を error レベルで実行し、**壊れたデータをデプロイさせない**。
- これが成立して初めて、ユーザーの問い「エラーがあれば明示的に分かるか」が **Yes** になる。

---

## 11. 各コレクション最終スキーマ（サマリ）

> 完全な型は実装フェーズで `nextjs_data_types_v1.ts` / `data/types.ts` に落とす。ここは骨格。

**BaseRecord（全コレクション共通・改定）**
```
id            ★新規・不変
slug          URL（可変）
previousSlugs?★新規・301用
summary, publishStatus, updatedAt, reliability, sources, heroImage?, seo?
```

**Manufacturer**: name, nameJa?, companyType, companyStatus, country, hqCity?, headquarters?, foundedYear?, website, logo?, contactUrl?, description, japanPresence, domesticDistributors?, *Note群, featuredRank?

**Robot**: name, nameJa?, **manufacturerId**, category, description, featuredRank?, deploymentStage, buyerReadiness, **specs（specSchema駆動）**, procurementModels[], priceNote?, japanAvailability, distributorJapan?, *Note群, images?, industryTags?, taskTags?, comparison

**Article（旧Report）**: title, titleJa?, **category★**, publishedAt, author?, tags[], whyItMatters, keyTakeaways?, body?, readingTimeMin?, featured?, **related*Ids[]**

**Guide**: title, titleJa?, description, stage, order, topics[], targetReaders[], readingTimeMinutes?, checklistItems?, body?, **relatedRobotIds[], relatedUseCaseIds[]**

**UseCase**: title, titleJa?, subtitle?, maturityLevel, buyerReadiness, environment, requiredCapabilities[], industryTags[], taskTags[], atAGlance, overview, whyItMatters, capabilityNotes, environmentRequirements, whyHardToday, japanDeploymentConditions, **candidateRobotIds[], relatedGuideIds[]**

**Deployment**: **manufacturerId, robotId?**, customer, siteName?, country, location, status, startedAt?

---

## 11.5. サーフェス別・必須フィールド表（追加時のチェックリスト）

「名称だけ出すUIと詳細スペックを出すUIが分散している」感覚への回答。**データ源は1つ（`Robot`）で一元化済み**。分散して見えるのは各サーフェスが要求するフィールドの違い。下表で「どの面が何を要求するか」を一覧化し、新規追加時の充足チェックに使う。

### Robot

| フィールド | 一覧カード | 比較表 | 詳細ページ | 関連リンク | 公開ゲート |
|---|---|---|---|---|---|
| id / slug | ✅ | ✅ | ✅ | ✅ | **必須** |
| name / manufacturerId | ✅ | ✅ | ✅ | ✅ | **必須** |
| summary | ✅ | — | ✅ | — | **必須** |
| category / deploymentStage / buyerReadiness | ✅ | ✅ | ✅ | — | **必須** |
| japanAvailability | ✅ | ✅ | ✅ | — | **必須** |
| specs（specSchema駆動） | 一部 | ✅ | ✅ | — | 推奨（不明は省略可） |
| comparison | — | ✅ | ✅ | — | 推奨 |
| images.hero / transparent | ✅ | ✅ | ✅ | — | 推奨 |
| sources | （信頼度表示） | — | ✅ | — | **必須（空不可）** |
| description / *Note群 | — | — | ✅ | — | 任意 |

### Manufacturer

| フィールド | 一覧 | 詳細 | ロボットからの参照 | 公開ゲート |
|---|---|---|---|---|
| id / slug / name | ✅ | ✅ | ✅ | **必須** |
| country / companyType / japanPresence | ✅ | ✅ | — | **必須** |
| logo | ✅ | ✅ | ✅(名前のみ) | 推奨 |
| description / *Note群 | — | ✅ | — | 任意 |
| sources | — | ✅ | — | **必須** |

> 「公開ゲート」列 = §10-1 の error レベル検証で `published` 昇格時にチェックする必須項目。draft の間は欠落可。

---

## 11.6. 鮮度管理（再確認サイクル）

導入判断ポータルの価値＝事実の正確さ。価格・スペックは陳腐化するため、鮮度を運用に組み込む。

- **`sources[].checkedAt`**（既存）= 最後に確認した日。
- **`nextReviewBy?: ISODate`**（新規・任意）= 次回確認の目安日。未設定はカテゴリ既定（例: ロボット=180日、価格を含むものは90日）。
- **古いデータの可視化**: `checkedAt` から既定日数を超えたら validate の **warning**（§10-1）で一覧表示。UI上は詳細ページに「最終確認: YYYY-MM（◯ヶ月前）」を出す。
- **揮発性の高い値**（価格・在庫・代理店）は短サイクル。安定値（身長・DOF）は長サイクル。
- 鮮度レビューは保守チェックリスト（別ドキュメント）の定期項目にする。

---

## 11.7. SEO・構造化データ・サイトマップ

メディアサイトの発見性と、slug/redirect 設計の出口。

- **canonical**: 各詳細ページに正規URL。slug が正、`previousSlugs` は 301 で正へ寄せる（§3-3）。
- **JSON-LD（構造化データ）**:
  - Robot 詳細 → `Product`（name, brand=manufacturer, image, description）
  - Manufacturer 詳細 → `Organization`
  - Article → `NewsArticle` / `Article`（datePublished, author, publisher）
- **`sitemap.xml`**: published のみ列挙（draft/archived 除外）。`lib/data.ts` の getter から自動生成。
- **`robots.txt` / noindex**: draft・`contentKind:'sample'`・archived（方針次第）は `noindex`。`SeoFields.noindex` を活用。
- **OGP/メタ**: `seo.metaTitle` / `metaDescription` を正本に、未設定は name+summary から導出。
- 301配線: ルーティングで `previousSlugs` を解決（§3-3）し、検索評価を引き継ぐ。

---

## 11.8. 事実性の粒度（フィールド単位の信頼度・価格）

`sources` はレコード単位のため「身長は official だが価格は estimated」を表現できない。これを補う。

- **フィールド単位の信頼度（任意）**: 重要値に `reliability` を個別付与できる形を許す。例（実装フェーズで確定）:
  ```ts
  // specs を {value, reliability?, sourceRef?} で持てるようにする案
  specs: { heightCm: { value: 127, reliability: 'official' },
           // 省略時はレコードの reliability を継承
  }
  ```
  - 既定はレコードの `reliability` を継承（冗長記述を避ける）。重要・不確実な値だけ上書き。
- **価格の構造化**: `priceNote`（自由文）に加え、可能なら:
  - `priceModel`（purchase/lease/raas/subscription/inquiry）, `priceRange?`, `currency?`
  - **`priceVolatility: 'high'`** を既定とし、鮮度サイクルを短く（§11.6）。
  - 価格は確認必須・出典必須。不明は「要確認」（推測値を入れない）。

---

## 11.9. 運用前提の明文化

将来の事故防止のため、暗黙の前提を明文化する。

- **単一ロケール方針**: 当面は日本語単一。`name` = 正本（英語正式表記）、`nameJa` = 日本語表示。**多言語collectionは作らない**。将来 i18n が要るなら別途設計（今のフィールドに各国語を混ぜない）。
- **スケール前提**: SSG＋`lib/data.ts` の `O(n)` 逆引きは **数百レコードまで問題なし**。それを超えたら索引（Map）化やCMS側クエリへ移行。現規模（robots 約60）は余裕。
- **sample/demoデータ規約**: `contentKind:'sample'`（現状reportsのみ）を全collection共通の概念に一般化。サンプルは **本番一覧から除外可・必ず noindex・sources空を許容**。本番データと混ざらない境界を明示。

---

## 12. CMS移行パス（無破壊・段階移行）

Git型CMS（Keystatic想定）への到達手順。各段階で `npm run build` と validate を通す。

| 段階 | 内容 | 破壊性 |
|---|---|---|
| **A. id 導入** | 全レコードに `id`（=現slug）を追加。参照はまだ slug のまま | 非破壊（追加のみ） |
| **B. 参照を id へ** | `manufacturerSlug` 等を `manufacturerId` に改名し id 参照に切替。validate を id ベースに | 内部のみ（URL不変） |
| **C. specSchema 導入** | スペック項目をレジストリ化。`RobotSpecs` を Partial Record 化 | 内部のみ |
| **D. articles 改称** | reports → articles、category 軸導入、編集ポリシー更新 | URLは別判断 |
| **E. 個別ファイル化** | `data/robots.ts` 配列 → `content/robots/<id>.{json,md}` per-record。`lib/data.ts` は読込元だけ変更（呼び出し形は不変） | 内部のみ |
| **F. Keystatic 接続** | `keystatic.config.ts` で各 collection をファイルにマッピング、編集UI起動 | 追加のみ |

> ページ側（`src/app/**`）は **A〜F を通して `lib/data.ts` 経由のまま**。物理配置が変わっても上位は無改修。これが §2-7 の「呼び出し形を変えない」の実利。

---

## 13. 運用フロー（再設計後）

**ロボット追加**
1. 公式/press/信頼できる報道で事実確認 → 2. **id を発番**（=初期slug）→ 3. `publishStatus:'draft'` で作成 → 4. `sources` に確認日・信頼度 → 5. 参照 id（manufacturerId 等）の存在確認 → 6. specSchema にある項目を埋める（不明は省略）→ 7. validate OK → 8. `published`

**slug 変更（命名修正）**
1. 新 slug を決める → 2. 旧 slug を `previousSlugs` に追記 → 3. `slug` を更新 → 4. **id・参照は触らない** → 5. validate（衝突チェック）

**ニュース記事追加**
1. category を選ぶ（news/interview/company-report/analysis/policy）→ 2. **whyItMatters を必ず書く**（速報でも）→ 3. related*Ids を id で結ぶ → 4. tags は registry から

**スペック項目追加**
1. `lib/specSchema.ts` に1行追加 → 2. 該当ロボットの `specs` に値を入れる → 3. 型・スペック表・比較表が自動追従

**タグ追加**
1. `lib/tagRegistry.ts` に追加 → 2. 該当レコードに付与（未登録は validate が検出）

---

## 14. この再設計が解決すること（まとめ）

| 元の悩み | 解決 |
|---|---|
| slug を変えたら全部壊れる | id/slug 分離。slug はいつでも変更可、旧slugは301保護（§3） |
| マスター変えたら自動追従させたい | 正本マトリクス＋レジストリ横展開（§5, §8） |
| ニュース記事を載せたい | articles へ拡張・category 軸・速報も whyItMatters 必須（§7） |
| スペック書き換えが頻発しそう | specSchema で項目を1箇所管理（§8） |
| 将来CMSへ移したい | Git型CMSへの無破壊6段階パス（§12） |
| 命名ミス（agibot-a2-max 等） | id据え置き・slug修正で参照無傷（§3-1） |
| エラーが明示されない（build通過） | validate を build ゲート化・error/warning2段階（§10-1） |
| 画像/ロゴが外部リンクで分散 | id基準でローカル配置を規約化（§9-1） |
| 比較に変更が反映されない感覚 | draft不可視の明文化＋client状態をid化（§6.5） |
| 旧モデルの扱い（Figure 02等） | archivedを関連に残す＋supersededById（§6.5-2） |
| 追加時に何を埋めるか不明 | サーフェス別・必須フィールド表（§11.5） |
| データの陳腐化に気づけない | nextReviewBy＋鮮度warning（§11.6） |
| メディアの発見性・301 | JSON-LD・sitemap・canonical・previousSlugs301（§11.7） |
| 値ごとの確度を示せない | フィールド単位reliability・価格構造化（§11.8） |
| 暗黙の前提による事故 | 単一ロケール・スケール・sample規約の明文化（§11.9） |

---

## 15. 次フェーズの最初の一手（参考）

設計確定後の実装は **§12 段階A（id 導入）から**。これは純粋な追加で最も安全。A完了→validate拡張→B（参照id化）の順。1段階ずつ build と git diff を確認して進める。

> 本書は設計のみ。実装着手は別途指示を待つ。
