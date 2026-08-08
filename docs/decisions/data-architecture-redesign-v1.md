---
status: current
updated: 2026-08-08
---

# データアーキテクチャ再設計 v1（CMS見据え・保守性主眼）

> **2026-07-26 更新**: 本書の id / slug 分離、参照、検証、公開状態などのデータモデル判断は引き続き有効。保存先とCMSの判断は [`content-platform-and-database-architecture-v2.md`](content-platform-and-database-architecture-v2.md) が上位の正本であり、旧 Keystatic / TinaCMS 案は Payload CMS + managed PostgreSQL へ置き換えた。

> **2026-06-28 撤去注記（Guide）**: `Guide` エンティティと `/guides` は撤去済み。本書の現行データ設計から Guide / `relatedGuideIds` / 「useCase ⇄ guide 双方向」「guide sources」の記述は削除済み。判断層は構造化データ（use-cases の `candidateRobots` evidence / compare / robots）側で担う。撤去理由と復活手順は [`../archive/guides-retirement-v1.md`](../archive/guides-retirement-v1.md)、計画は [`../archive/guides-retirement-plan-v1.md`](../archive/guides-retirement-plan-v1.md) を参照。

## 0. このドキュメントの位置づけ

- **目的**: Deploid のデータ構造を「正本がどこにあり、何を変えれば何が追従するか」が一目で分かる形に再設計する。保存先に依存せず長期保守できる骨格を定義する。
- **スコープ**: 本ドキュメントはデータモデルの設計と現行実装状況を扱う。CMS / DB への実データ移行は [`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md) を正本とする。
- **対の成果物**: 運用面の実行チェックリストは `data-maintenance-checklist-v1.md`（追加・更新・slug変更・公開・鮮度レビューの手順）。
- **既存ドキュメントとの関係**:
  - `../reference/humanoid_data_management_guide_v1.md` / `../reference/humanoid_data_model_policy_v1.md` / `../planning/nextjs_data_types_v1.ts` を **上書きせず上位に立つ再設計提案**として扱う。
  - 本書で確定した方針は、実装フェーズで上記3ファイルへ反映する。
  - **本書が解消する2つの既存矛盾**（詳細は §1）:
    1. slug が「URL」と「外部キー」を兼任している（slug変更不可問題の正体）
    2. 現ガイドは reports を「非速報」と定義するが、運用方針は「業界ニュースメディア」へ拡張する

### 確定済みの前提（ユーザー判断）

| 論点 | 決定 |
|---|---|
| データ管理先 | **現在は `data/*.ts`、移行先は Payload CMS + managed PostgreSQL**。GitHub はコード・スキーマ・移行履歴の正本 |
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
4. **UI非依存**: データはUIレイアウトの都合を持ち込まない（列数・色・装飾的な並び順はデータに入れない。一覧・ランキングの意味的な順序は order レジストリや `featuredRank` などの明示フィールドで管理する。ただし `related*Ids` / `candidateRobots` の配列順は、その関連欄内の編集優先度として扱い、`getRelated*()`系は入力順を保持して解決する）。
5. **出典必須・未確認は明示**: 事実値には `sources`。不明値はハードコードせず省略（UIが「要確認」を表示）。
6. **検証可能**: 参照整合・id一意・未登録タグ・slug衝突を `validate` で機械検出。
7. **保存先をページから隠す**: ページは repository / query 境界を経由する。現在の `lib/data.ts` から Payload へ物理保存先が変わっても、ページ固有コードにDBアクセスを散らさない。

---

## 3. 識別子モデル（最重要）

### 3-1. 3層の識別子

| 層 | フィールド | 可変性 | 用途 | 例 |
|---|---|---|---|---|
| **安定ID** | `id` | **不変**（発番後変更禁止） | 外部キー・一意性・CMSのレコードキー | `unitree-g1` |
| **URLスラッグ** | `slug` | 可変（いつでも変更可） | 公開URLのパスセグメントのみ | `unitree-g1` |
| **旧スラッグ** | `previousSlugs?: string[]` | 追記のみ | slug変更時の301リダイレクト元 | `['unitree-g1-old']` |

**運用ルール**:
- 作成時は `id === slug`（人間可読な安定キーを発番）。
- 製品名が変わったら **slug だけ** 更新し、旧 slug を `previousSlugs` に追記。`id` は据え置き。
- `id` はやや陳腐化してもよい（非ユーザー向け）。安定性が陳腐化回避より優先。
- `agibot-a2-max` 問題: id は `agibot-a2-max` のまま据え置き、slug を `agibot-a2-ultra` に変更、name を正す。参照は id なので無傷。

> **なぜ opaque な ULID/nanoid にしないか**: 移行時の照合、管理画面での調査、ログや差分の読解では `unitree-g1` のような可読IDの方が保守しやすい。一意・不変でありさえすればよく、ランダム性は不要。

### 3-2. 参照フィールドの改名（slug → id）

| 現フィールド | 新フィールド |
|---|---|
| `Robot.manufacturerSlug` | `Robot.manufacturerId` |
| `UseCase.candidateRobotSlugs` | `UseCase.candidateRobots[].robotId` |
| `Report.relatedRobotSlugs` | `Article.relatedRobotIds` |
| `Report.relatedManufacturerSlugs` | `Article.relatedManufacturerIds` |
| `Report.relatedUseCaseSlugs` | `Article.relatedUseCaseIds` |
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
  distributors    国内の提供事業者（代理店・直販窓口）★2026-08-08 新設
  robotSeries     製品ファミリ（買える構成が複数ある製品の傘）★2026-08-08 新設
  robots          導入判断の個票＝買える構成（SKU）

編集コンテンツ（鮮度・読み物）
  articles        ニュースメディア（旧 reports を改称・拡張）★

意思決定支援（逆引き）
  useCases        用途からの逆引き

派生・補助
  deployments     導入事例（ワールドマップ用 + useCases の根拠データ）
  placements      記事の掲載枠（旧 reportPlacements）
  tags            タグ正本（lib/tagRegistry.ts）
  specSchema      スペック項目正本（新設）★
```

### 4-2. 参照関係図（すべて id 参照）

```
manufacturers ──< robotSeries            (manufacturer has many series)
manufacturers ──< robots                 (manufacturer has many robots)
robotSeries   ──< robots                 (series has many configurations)★
distributors  >──< manufacturers          (多対多。1事業者が複数メーカーを扱う)★
robots         ──< deployments           (robot deployed at many sites)
useCases       >── robots (candidate)    (useCase ← candidate robots)
useCases       <── deployments           (deployment.relatedUseCaseIds が一方向に useCase を指す。双方向対称は強制しない)
articles       >── robots, manufacturers, useCases
placements     >── articles
```

- `<` = 1対多、`>──` = 多対多 or 参照。
- `deployments.relatedUseCaseIds`（任意項目）は「この導入事例がどの用途の根拠になるか」を示す。`UseCase.candidateRobots[].evidenceDeploymentIds` と組み合わせて、候補ロボットの `strong` / `adjacent-deployment` 根拠にも使う。無理な紐付けはしない（該当しない事例は空のままでよい）。
- `UseCase.candidateRobots`は単なるid配列ではなく`{robotId, fit, basis, evidenceDeploymentIds?, evidenceSourceUrls?, reason}[]`（`fit`: strong/possible/watch）。「なぜ候補なのか」と「どの根拠でそう言えるのか」をデータ自身が持つ。`fit: 'strong'`は`evidenceDeploymentIds`で同じrobotId・同じuseCaseのpublished deploymentを明示できる場合だけ使う（量産・商用展開の事実だけでは`strong`にしない）。published UseCase の候補に残せる `basis` は `deployment` / `official-use-case` / `adjacent-deployment` のみとし、`product-capability` / `market-signal` / `editorial-watch` は draft の調査メモまたは非公開候補として扱う。`lib/data.ts`の`getRelated*()`は呼び出し側が渡した順序を保持する（関連ID配列の順序は編集上の関連優先度）。
- `Article.relatedUseCaseIds` は用途詳細の「関連記事」の正本。記事側の編集判断で「この用途の追加理解になる」と明示した場合だけ付与する。`industryTags` / `taskTags` / `themeTags` の一致だけで用途の関連記事を自動生成しない。
- `robotSeries` は**スペックも価格も持たない**。名前・メーカー・概要・出典・画像だけを持つ識別単位。買えるのは `robots`（構成）のほう。`Robot.seriesId?` は**任意** — 構成が1つしかない製品にはシリーズを作らない。詳細は `../plans/robot-data-import-plan-v1.md` DEC-S08。
- `UseCase.candidateRobots[]` は `robotId` または `seriesId` のどちらか一方を持つ。**用途の根拠はシリーズ粒度にしか存在しないことが多い**（実測: 該当14件すべてが `basis: 'official-use-case'` で、根拠URLはメーカーのシリーズ製品ページ）。特定構成の実証がある場合だけ `robotId` を使う。
- `distributors` は多対多。`Tohasen Robotics` は Unitree と Booster、`Robots International` は EngineAI・RobotEra・CASBOT を扱う（実測）。メーカーの中に埋め込むと同じ事業者が重複するため独立させる。**取扱モデルは機種単位**（代理店シートの「対応モデル」列）なので、関係の実体は `distributors ⇄ robots` にも及ぶ。
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
| article → robots/mfr/useCase | article が一方的に持つ（単方向） | articleが主、被参照側は知らなくてよい |
| robot ← useCase（候補） | useCase が `candidateRobots[].robotId`（fit/reason付き）、robot側は持たず導出 | robotページは `lib/data.ts` で逆引き |

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

> 現行実装では `category`（編集上の記事種別）、`type`（フォーマット）、`section`（記事タブのサブジェクト）を別軸として保持する。`section` は `/reports?section=` のタブ分類、タグは下記の軸別ファセットに分ける。

### 7-2. 編集ポリシーの矛盾解消

- 旧方針: 「reports は速報ではない」。
- **新方針**: **速報（news）も扱う。ただし全記事に `whyItMatters`（買い手にとっての意味）を必須**とし、単なる転載速報にしない。
- これにより「専門メディアとして速報を載せる」と「導入判断ポータルとしての付加価値」を両立させる。
- `../reference/humanoid_data_management_guide_v1.md` の該当記述は参照用として残す（整合更新はしない。正本は本書）。

### 7-3. articles の主要フィールド（案）

```
BaseRecord（id, slug, previousSlugs, summary, publishStatus,
            updatedAt, reliability, sources, heroImage, seo）
+ title, titleJa
+ category          ← 必須・第一軸（news/interview/company-report/analysis/policy）
+ type              ← フォーマット（analysis/deployment-report/news-brief 等）
+ section           ← 記事タブのサブジェクト（digest/deployment/business/tech/policy/entertainment）
+ publishedAt       ← 一覧の鮮度ソート
+ author?
+ industryTags?     ← tagRegistry kind:'industry'。検索・絞り込み用
+ regionTags?       ← tagRegistry kind:'region'。地域非依存なら省略
+ themeTags?[]      ← tagRegistry kind:'theme'。任意・0〜4個（section が主題）。企業・機種はタグにしない
+ whyItMatters      ← 必須（速報でも省略不可）
+ keyTakeaways?[]
+ body?             ← Markdown
+ readingTimeMin?
+ featured?
+ relatedRobotIds[] / relatedManufacturerIds[] /
  relatedUseCaseIds[]
```

---

## 8. スペックの書き換え耐性（specSchema 新設）

ユーザーの「ロボットスペックの書き換えの可能性」への対応。

### 8-1. 問題

起票当時 `RobotSpecs` はスカラー7項目。新項目（ハンド把持力・リーチ・充電時間・認証）を足すたびに、型・UI・ラベルを別々に直す必要がある。

> **2026-08-07 時点の実数は17項目**（`lib/specSchema.ts`）。§16の「現行8項目」も段階C実施時点の数。
> 件数は増減するので、正本は常にコード側を見ること。

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

> **2026-08-07 更新: この節が起票した問題は解消済み。** 実測で `data/robots.ts` の画像は
> **ローカル27件・外部ホットリンク0件**。下記の「現状の問題」は起票当時（2026-07）の記述として残す。
> 方針（ローカル配置・id基準の命名・`rights` 必須）は引き続き有効。

起票当時の問題: ロボット画像・メーカーロゴの**大半が他社サイトへの外部ホットリンク**（`https://www.unitree.com/...` 等）。ローカル化されているのは agility-digit・onex-neo の2体とロゴ1件のみ。脆い（リンク切れ・403・ホットリンク禁止・権利リスク・バックアップ対象外）。

**方針**:
- 画像実体は**ローカル `public/` に置く**ことを原則とする（外部ホットリンク廃止）。
- 配置規約: `public/images/{robots,manufacturers}/<id>-<role>.<ext>`
  - 例: `public/images/robots/unitree-g1-hero.jpg`、`public/images/manufacturers/unitree-logo.png`
  - **ファイル名を id 基準**にすることで、レコードと画像が1対1で対応し「どこに置いたか」が一意に定まる。
- `ImageAsset.rights`（credit / sourceUrl / rights）は引き続き必須。ローカル保存＝権利クリアではない。
- 外部URLを暫定で使う場合は「未ローカル化」として validate で警告（§10）。
- CMS移行後はオブジェクトストレージを画像実体の正本とし、同じ id ベースの命名規約・権利メタデータを維持する。移行完了までは現行 `public/` が正本。

---

## 10. 検証（validate 拡張方針）

現 `lib/validate.ts` を id モデルへ拡張:

| 既存 | 拡張後 |
|---|---|
| slug 重複検出 | **id 重複検出**＋ slug 重複検出（別々に） |
| 参照先 slug 存在チェック | **参照先 id 存在チェック** |
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

**Manufacturer**: name, nameJa?, companyType, companyStatus, country, hqCity?, headquarters?, foundedYear?, website, logo?, logos?, contactUrl?, description, japanPresence, supportNote?, procurementNote?, vendorRiskNote?, featuredRank?
→ `domesticDistributors?`（埋め込み配列）は `distributors` コレクションへ移す。`distributorNote?` は同じ事実を自由文で持つ重複なので、移行完了後に削除する。

**Distributor**（★2026-08-08 新設）: name, nameJa?, website?, providerType（`maker-direct` / `reseller` / `other`）, handledManufacturerIds[], handledRobotIds?[], acquisitionMethods[]（購入 / レンタル 等）, inquiryUrl?, note?

**RobotSeries**（★2026-08-08 新設）: name, nameJa?, **manufacturerId**, description?, images?, industryTags?, taskTags?
→ **スペック・価格・入手性を持たない。** 買えるのは構成（`Robot`）のほう。

**Robot**: name, nameJa?, **manufacturerId**, **seriesId?**★, category, description, featuredRank?, deploymentStage, **specs（specSchema駆動）**, procurementModels[], priceOffers?, loadRatings?, fieldEvidence?, japanAvailability, images?, industryTags?, taskTags?
→ 2026-08-08 に `buyerReadiness` / `marketAvailability` / `safetyNote` / `vendorRiskNote` / `comparison` を削除（`../plans/robot-data-import-plan-v1.md` DEC-S05・S06）。`buyerReadiness` は `UseCase` 側には残る。

**Article（旧Report）**: title, titleJa?, **category★**, type, section, publishedAt, author?, industryTags?, regionTags?, **themeTags?[]**, whyItMatters, keyTakeaways?, body?, readingTimeMin?, featured?, **related*Ids[]**

**UseCase**: title, titleJa?, subtitle?, featuredRank?, maturityLevel, buyerReadiness, environment, requiredCapabilities[], **primaryDomain, secondaryDomains?**, industryTags[], taskTags[], atAGlance, overview, whyItMatters, capabilityNotes, environmentRequirements, whyHardToday, japanDeploymentConditions, **candidateRobots[]{robotId? | seriesId?, fit, basis, evidenceDeploymentIds?, evidenceSourceUrls?, reason}**★

**Deployment**: **manufacturerId, robotId?**, customer, siteName?, country, location, status, startedAt?

---

## 11.4. ファイル分割方針（★2026-08-08 追加）

1コレクション = 1ファイルの巨大配列をやめる。**編集する人が開くファイルを小さく保つ**ことが目的で、
実行時の性能ではない（`lib/data/localContentSnapshot.ts` が結合するので読み込み側は変わらない）。

### 現状（2026-08-08 実測）

| ファイル | 行数 | 件数 | 1件あたり |
|---|---|---|---|
| `data/robots.ts` | 5,039 | 63 | 約80行 |
| `data/useCases.ts` | 2,980 | 44 | 約68行 |
| `data/articles.ts` | 2,732 | 34 | 約80行 |
| `data/manufacturers.ts` | 1,946 | 26 | 約75行 |
| `data/deployments.ts` | 332 | 11 | 約30行 |

`robots` は177機になるため**約15,800行**になる。分割しないと編集も差分レビューも成立しない。

### 分割の基準

**「一緒に変更されるものを同じファイルに置く」**（changes-together / lives-together）。
行数だけを基準にしない。

| コレクション | 分割単位 | 理由 |
|---|---|---|
| `robots` | **メーカー別** `data/robots/<manufacturer-id>.ts` | 1メーカーの機体は同じ出典・同じ調査回で一緒に更新される。最大は Unitree 19機・Leju 18機 |
| `robotSeries` | 単一ファイル `data/robotSeries.ts` | 28件・スペックを持たないため小さい |
| `distributors` | 単一ファイル `data/distributors.ts` | 10件未満 |
| `manufacturers` | 単一ファイル | 59社・約4,400行。分割は後で判断する |
| `articles` | **記事種別 × 年** `data/articles/<type>/<slug>.ts` | 記事は1本ずつ書かれ、あとから触らない。既に `manufacturer-guide/` で1本1ファイルの前例がある |
| `useCases` | **1件1ファイル** `data/useCases/<slug>.ts` | 1件68行と大きく、`candidateRobots` の更新が個別に発生する |
| `deployments` | 単一ファイル | 41件・小さい |

### 前例と制約

- `data/articles.ts` は既に `data/articles/manufacturer-guide/*.ts` を3本 import している。同じ形を広げる
- `scripts/check-data-import-boundaries.mjs` の走査対象は `components` / `lib` / `scripts` / `src` / `tests` で `data/` を含まないため、`data/` 内の相互 import は抵触しない
- **分割は値の変更と混ぜない。** 分割前後で件数と `id` ソート後の sha256 が一致することを機械確認する
  （長さ比較では並び替えもレコード取り違えも検出できない）

### CMS移行後

Payload + PostgreSQL へ移ると、この分割は消える（レコードはDBの行になる）。
つまりファイル分割は**移行までの数か月を運用可能にするための措置**であり、
恒久的なアーキテクチャではない。**分割方針に凝りすぎない。**

---

## 11.45. 出典（`Source`）の持ち方（★2026-08-08 追加）

現状、`Source` は各レコードに埋め込まれた配列で、**6コレクション合計581本**ある。
同じ製品ページURLが複数のレコードに別々にコピーされている。

**当面は埋め込みのまま維持する。** 理由:

- 出典は「そのレコードがいつ・何を根拠に書かれたか」を示すもので、`checkedAt` と
  `reliability` はレコードごとに意味が違う。共有すると更新の意味が壊れる
- `fieldEvidence`（455項目）は「どのスペックがどのURLに基づくか」をレコード内で解決している。
  外部化すると2段参照になる

**独立コレクション化を検討する条件**: 同一URLの重複が3桁に達し、URLの死活確認
（`npm run check:source-links`）が重複ぶんだけ無駄に走るようになったとき。
177機投入後に `check:source-links` の対象URL数を実測して判断する。

---

## 11.46. `articles` に形の違うものが2種類入っている（★2026-08-08 追加）

記事34件のうち3件が `type: 'manufacturer-guide'` で、**これだけ構造化された本文**を持つ
（`ManufacturerGuideContent`: 導入事例リスト・調達チャネル・ラインアップ表・FAQ・動画）。
残る31件は `body` の文章。同じ `Article` という入れ物に形の違うものが同居している。

**当面は分離しない。** 型は既に `StandardArticle | ManufacturerGuideArticle` の判別可能
ユニオンになっており、型レベルでは区別できている。3件しかないうちにコレクションを分けると、
`articlePlacements` や記事一覧の棚（`lib/articleShelves.ts`）の分岐が増えるだけで得がない。

**分離を検討する条件**: `manufacturer-guide` が10件を超えるか、
`ManufacturerGuideContent` に `robots` / `deployments` への構造化参照が増えて
「記事」ではなく「メーカーの派生ビュー」になったとき。後者なら
`manufacturers` の一部として持つほうが自然になる。

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
- **スケール前提**: SSG＋`lib/data.ts` の `O(n)` 逆引きは現件数では成立している。ただし非エンジニア編集、公開ワークフロー、クライアントバンドル肥大の問題が先に顕在化したため、件数上限を待たず Payload のサーバークエリへ移行する。
- **sample/demoデータ規約**: `contentKind:'sample'`（現状reportsのみ）を全collection共通の概念に一般化。サンプルは **本番一覧から除外可・必ず noindex・sources空を許容**。本番データと混ざらない境界を明示。

---

## 12. CMS / DB 移行パス

旧段階 A〜D（id、参照、specSchema、articles）は実装済み。旧段階 E「Git上の個別ファイル化」と F「Keystatic接続」は採用せず、次の方針へ置き換える。

1. 現行品質ゲートを固定し、Payload CMS を既存 Next.js アプリへ統合する。
2. 既存の型と不変 id を保ったまま Payload collection / PostgreSQL schema を定義する。
3. ページから直接 Payload / SQL を呼ばず、サーバー専用 repository 境界を設ける。
4. `data/*.ts` から再実行可能な importer で投入し、件数・slug・参照・公開URLの一致を検証する。
5. collection 単位で読取先を切り替え、問題時は環境変数でローカルデータへ戻せる期間を設ける。
6. 管理画面、Codex向けMCP、権限、draft / publish、preview、cache invalidation を整備した後に旧データを読み取り専用化する。

設計判断は [`content-platform-and-database-architecture-v2.md`](content-platform-and-database-architecture-v2.md)、実装順序・完了条件・ロールバックは [`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md) を参照。

---

## 13. 運用フロー（再設計後）

**ロボット追加**
1. 公式/press/信頼できる報道で事実確認 → 2. **id を発番**（=初期slug）→ 3. `publishStatus:'draft'` で作成 → 4. `sources` に確認日・信頼度 → 5. 参照 id（manufacturerId 等）の存在確認 → 6. specSchema にある項目を埋める（不明は省略）→ 7. validate OK → 8. `published`

**slug 変更（命名修正）**
1. 新 slug を決める → 2. 旧 slug を `previousSlugs` に追記 → 3. `slug` を更新 → 4. **id・参照は触らない** → 5. validate（衝突チェック）

**ニュース記事追加**
1. category / type / section を選ぶ → 2. **whyItMatters を必ず書く**（速報でも）→ 3. related*Ids を id で結ぶ → 4. themeTags（任意0〜4個）/ industryTags / regionTags は registry から軸別に選ぶ

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
| 非エンジニアとAIの双方で安全に更新したい | Payload管理画面 + 制限付きMCP + PostgreSQLへの段階移行（§12） |
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

次の実装は [`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md) の Task 1（品質ゲート固定）から始める。既存URLと不変idを維持し、1 collection ずつ parity を確認して切り替える。

> 本書は設計のみ。実装着手は別途指示を待つ。

---

## 16. 実装ステータス（2026-07-26）

**実装済み**（各ステージ1コミット・build green）:

| 項目 | 本書の節 |
|---|---|
| 段階A: 全114レコードに不変 `id` 導入（`previousSlugs` / `nextReviewBy` / `supersededById` フィールド含む） | §3, §12-A |
| 段階B: 参照フィールドの id 化（`manufacturerId` / `*Ids` / `articleId`）・`lib/data.ts` の id 解決 | §3-2, §12-B |
| validate のビルドゲート化（error=build失敗 / warning=ログ。`npm run build` 前段で実行） | §10-1 |
| 段階C: `lib/specSchema.ts` 新設・`RobotSpecs` をスキーマ導出に（現行8項目を登録） | §8, §12-C |
| 段階D: reports→articles 内部改称＋`category` 必須導入（UI挙動・/reports URL・コンポーネント名は不変） | §7, §12-D |
| `previousSlugs` 301（permanentRedirect・5詳細ルート）・archived 可視化（提供終了表示）・`supersededById`（figure-02→figure-03） | §3-3, §6.5 |
| お気に入り・比較URLの id 化（保存値は現状無変化） | §6.5-3 |
| canonical・JSON-LD（Product / Organization / NewsArticle）・noindex（archived / sample） | §11.7 |
| 鮮度 warning（`nextReviewBy` 超過 or checkedAt 180日超）・外部画像 warning | §11.6, §9-1 |

**未実装**:

- Payload CMS + managed PostgreSQL への移行、repository境界、管理画面、MCP → §12
- 画像の実ローカル化作業（warning による可視化まで実施。ダウンロード・権利確認は別タスク）→ §9-1
- specSchema への新項目追加（リーチ・把持力・充電時間等。登録は1行だが値の裏取りが別作業）→ §8-3
- category への UI 一本化（タブ=section・バッジ=type は現状維持。置換は別フェーズ判断）→ §7-1
- `/reports`→`/news` URL 変更（当面 /reports 維持）→ §7
- フィールド単位 reliability・価格構造化 → §11.8
