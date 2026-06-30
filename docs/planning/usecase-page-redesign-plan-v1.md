# UseCase ページ全面再設計 実装計画 v1

Status: 未着手  
作成日: 2026-06-30  
ブランチ: `feat/usecase-page-redesign`（新規作成）

この文書は「用途から探す」ページの概念・データ・UIをゼロから再設計する実行計画です。
実装者がこの1ファイルを読めば作業順・変更対象・完了条件が分かる状態を目指します。
実装判断の正本はコードと `data/types.ts` です。不整合があればコードを優先してください。

---

## 0. なぜ再設計するか

現行の「用途から探す」ページはロボット開発者視点の分類軸（`use-case-domain`：運搬・組立・点検など）でユースケースを整理している。しかし実際の読者（B2B調達担当者・業務改善担当者）は「自分の産業」「自社の現場タスク」から検索する。現行の分類はその視点に合っておらず、「ナンセンス」と判断された。

再設計方針：
- 入口を「産業」に変える（製造・物流・建設…）
- 産業を選んだあとにタスク（シーン）で絞り込む
- 各シーンには実導入事例の有無を明示する
- use-case-domain 軸は廃止し primaryIndustry に置き換える
- ユースケース数を現行8件 → 最大42件に拡張する

---

## 1. 調査済みファイル

| ファイル | 役割 |
|---|---|
| `data/types.ts` | UseCase 型定義の正本（L165–L310） |
| `lib/tagRegistry.ts` | industry / task / use-case-domain タグ値の正本 |
| `lib/validate.ts` | UseCase バリデーションルール（L540–L560） |
| `lib/search.ts` | 全文検索インデックス構築（L270–L285） |
| `lib/useCaseFilters.ts` | フィルタ状態正規化・絞り込みロジック |
| `lib/tags.ts` | getUseCaseDomainOptions / getUseCaseIndustryTagOptions（L90–L115） |
| `lib/useCaseDisplay.ts` | getUseCaseDomainLabel（L17–L37） |
| `lib/useCaseEvidence.ts` | 候補ロボット根拠のラベル変換 |
| `lib/visualSemantics.ts` | tagKind → semantic tone マッピング（L174） |
| `lib/uiText.ts` | フィルタ・ページ文言（L23, L38, L61, L136, L165） |
| `components/UseCasesBrowser.tsx` | 一覧ページのクライアントコンポーネント |
| `components/UseCaseCard.tsx` | 一覧カード |
| `src/app/use-cases/page.tsx` | 一覧ページサーバーコンポーネント |
| `src/app/use-cases/[slug]/page.tsx` | 詳細ページ |
| `lib/facetConfig.ts` | FacetConfig 型・ARTICLE_FACETS（USE_CASE_FACETS はまだ存在しない） |
| `data/useCases.ts` | 現行8件のユースケースデータ |
| `data/robots.ts` | 現行57件のロボットデータ |

---

## 2. 作業変数（確定した定数）

実装時はここの値をそのままコードに転記してください。勝手に変更しないこと。

### 2-A. 産業タグ（`kind: 'industry'`）— 移行後の正規セット

| value | label | 備考 |
|---|---|---|
| `manufacturing` | 製造 | 既存。`plant` を統合 |
| `logistics` | 物流 | 既存。`e-commerce` を統合 |
| `construction` | 建設・インフラ | 既存 `construction-infrastructure` から改名 |
| `agriculture` | 農業・食品生産 | 既存 |
| `healthcare` | 医療・介護 | 既存 `healthcare-care` から改名 |
| `retail` | 小売・店舗 | 既存。`hospitality` を統合 |
| `facility-management` | 施設管理 | **新規追加** |
| `research` | 研究・開発 | 既存。`education` を統合 |

削除する産業タグ値（既存データ移行後に tagRegistry から除去）:
`plant`, `facility`, `e-commerce`, `marketing`, `healthcare-care`, `construction-infrastructure`, `hospitality`, `public-sector`, `education`

### 2-B. タスクタグ（`kind: 'task'`）— 移行後の正規セット

| value | label | 備考 |
|---|---|---|
| `material-handling` | 搬送・マテハン | 既存 |
| `picking` | ピッキング・仕分け | 既存。`shelf-stocking` を統合 |
| `assembly` | 組立・加工 | 既存 |
| `inspection` | 点検・検査 | 既存。`quality-inspection` を統合 |
| `patrol` | 巡回・警備 | 既存 |
| `cleaning` | 清掃・衛生管理 | 既存 |
| `physical-assistance` | 身体介助・リハビリ | 既存 |
| `customer-service` | 接客・案内・配膳 | 既存 |
| `agricultural-work` | 農作業・収穫 | 既存 |
| `hazardous-work` | 危険作業・インフラ保守 | **新規追加**。`disaster-response` を統合 |
| `research-task` | 研究・実験・検証 | **新規追加**。`r-and-d` の改名 |

削除するタスクタグ値:
`quality-inspection`, `shelf-stocking`, `r-and-d`, `hri`, `control`, `demo`, `exhibition`, `disaster-response`

### 2-C. UseCase 型変更サマリ

| フィールド | 現行 | 変更後 |
|---|---|---|
| `primaryDomain` | `TagValue<'use-case-domain'>` | **削除** |
| `secondaryDomains` | `TagValue<'use-case-domain'>[]` optional | **削除** |
| `primaryIndustry` | なし | **追加** `TagValue<'industry'>` 必須 |
| `industryTags` | `TagValue<'industry'>[]` | 維持（多値フィルタ用） |
| `taskTags` | `TagValue<'task'>[]` | 維持 |

`primaryIndustry` はリスト表示で産業グルーピングに使う単一値。`industryTags` は複数産業にまたがるケース（例: 農業×食品加工）でのフィルタ一致に使う。

### 2-D. 既存8件データの migration マップ

| slug | primaryDomain → 削除 | industryTags 修正 | taskTags 修正 | primaryIndustry 付与 |
|---|---|---|---|---|
| `warehouse-tote-material-handling` | move-goods | `e-commerce` → `logistics` | — | `logistics` |
| `factory-inspection` | inspect-and-record | `plant` → 削除 | `quality-inspection` → `inspection` | `manufacturing` |
| `research-development` | validate-new-tech | — | `r-and-d`,`hri`,`control` → `research-task` | `research` |
| `demo-exhibition` | demonstrate-capability | `marketing` → 削除, `facility` → `facility-management` | `demo`,`exhibition` → 削除 | `facility-management` |
| `customer-reception` | communicate-with-people | `hospitality` → `retail`, `facility` → 削除 | — | `retail` |
| `retail-shelf-stocking` | move-goods | — | `shelf-stocking` → `picking` | `retail` |
| `care-physical-assistance` | assist-human-body | `healthcare-care` → `healthcare` | — | `healthcare` |
| `factory-assembly-support` | manipulate-and-assemble | `plant` → 削除 | — | `manufacturing` |

### 2-E. 追加が必要なロボットデータ

以下は `data/robots.ts` に存在しないため、UseCaseデータから参照する前に追加が必要。

| slug（予定） | ロボット名 | メーカー | 主な根拠シーン |
|---|---|---|---|
| `kawasaki-nextage` | NEXTAGE | 川崎重工（現川崎ロボティクス） | 製造・農業・研究 |
| `galbot-g1` | Galbot G1 | Galbot（中国） | 小売・物流 |
| `aeolus-aeo` | aeo | Aeolus Robotics（日本・台湾） | 医療・施設管理 |
| `telexistence-ghost` | TX GHOST | Telexistence（日本） | 小売 |
| `zizai-zeroshiki` | 零式人機 | ZIZAI（日本） | 建設・インフラ |

既存データで使用可能（参照可能なslug）:
`ubtech-walker-s`、`ubtech-walker-s1`、`ubtech-walker-s2`、`agility-digit`、
`onex-eve`、`onex-neo`、`figure-02`、`figure-03`、`boston-dynamics-atlas`、
`fourier-gr1`、`fourier-gr2`、`fourier-gr3`、`unitree-h1`、`unitree-h2`、
`kepler-k1`、`kepler-k2`、`agibot-a2`

### 2-F. 追加ユースケース一覧（42シーン）

各シーンの slug・産業・タスク・成熟度・主な候補ロボット。Data entry はタスク E で産業別に追加する。

**製造（manufacturing）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `factory-sheet-metal-supply` | 板金部品供給 | material-handling | pilot-phase | figure-02, ubtech-walker-s |
| `factory-assembly-kit-transport` | アセンブリキット搬送 | material-handling | production-ready | ubtech-walker-s, ubtech-walker-s1 |
| `factory-powder-weighing` | 精密粉体秤量 | assembly | production-ready | kawasaki-nextage |
| `factory-visual-inspection` | 外観品質検査 | inspection | production-ready | ubtech-walker-s, kawasaki-nextage |
| `factory-machine-tending` | マシンテンディング | assembly, material-handling | production-ready | kawasaki-nextage |

※ `factory-assembly-support`（既存）は `factory-machine-tending` と重複するため既存維持、新規は別シーンとして追加。

**物流（logistics）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `logistics-tote-sortation` | トート仕分け・パレタイズ | material-handling, picking | production-ready | agility-digit |
| `logistics-devanning` | デバンニング | material-handling | pilot-phase | boston-dynamics-atlas |
| `logistics-shelf-picking` | 棚ピッキング | picking | pilot-phase | onex-eve |
| `logistics-cage-loading` | カゴ車積載 | material-handling | production-ready | ubtech-walker-s1 |
| `logistics-returns-sorting` | 返品仕分け | picking | pilot-phase | agility-digit |

※ `warehouse-tote-material-handling`（既存）は `logistics-tote-sortation` と重複するため既存維持のうえ slug を将来統合検討。

**建設・インフラ（construction）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `construction-cone-placement` | 工事コーン配置 | hazardous-work, material-handling | early-stage | （候補なし・watch） |
| `construction-site-patrol` | 建設現場巡視 | patrol, inspection | pilot-phase | zizai-zeroshiki |
| `construction-material-transport` | 現場資材搬送 | material-handling | early-stage | kawasaki-nextage |
| `infrastructure-ultrasonic-inspection` | 超音波橋梁点検 | inspection, hazardous-work | production-ready | zizai-zeroshiki |
| `infrastructure-overhead-wire-maintenance` | 架線保守 | hazardous-work | production-ready | zizai-zeroshiki |

**農業・食品生産（agriculture）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `agriculture-seedling-transplant` | 苗移植 | agricultural-work | pilot-phase | kawasaki-nextage |
| `agriculture-fruit-harvest` | 果菜収穫 | agricultural-work | pilot-phase | onex-eve |
| `agriculture-food-sorting` | 食材仕分け箱詰め | picking, agricultural-work | production-ready | kawasaki-nextage |
| `agriculture-fruit-transport` | 果実コンテナ運搬 | material-handling | early-stage | （汎用humanoid watch） |
| `agriculture-machine-maintenance` | 農業機械メンテ | assembly | early-stage | （watch） |

**医療・介護（healthcare）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `healthcare-specimen-transport` | 検体・物品搬送 | material-handling | production-ready | aeolus-aeo |
| `healthcare-rehabilitation` | リハビリ支援 | physical-assistance | pilot-phase | fourier-gr2, fourier-gr3 |
| `healthcare-care-patrol` | 見守り巡回 | patrol | production-ready | aeolus-aeo |
| `healthcare-disinfection` | 消毒・衛生管理 | cleaning | production-ready | aeolus-aeo |
| `healthcare-surgery-assist` | 手術補助 | physical-assistance | early-stage | （watch） |

※ `care-physical-assistance`（既存）は `healthcare-rehabilitation` とは別シーン（移乗介助）として既存維持。

**小売・店舗（retail）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `retail-beverage-restocking` | 飲料品棚出し | picking, material-handling | production-ready | galbot-g1, telexistence-ghost |
| `retail-hotel-reception` | ホテルフロント受付 | customer-service | pilot-phase | aeolus-aeo |
| `retail-room-service` | ルームサービス配送 | material-handling, customer-service | pilot-phase | aeolus-aeo |
| `retail-food-serving` | 飲食店配膳 | customer-service, material-handling | production-ready | galbot-g1 |
| `retail-barista` | バリスタ調理 | assembly, customer-service | production-ready | galbot-g1 |

※ `retail-shelf-stocking`（既存）は `retail-beverage-restocking` と重複するため既存維持・将来統合検討。
※ `customer-reception`（既存）は `retail-hotel-reception` と重複のため既存維持。

**施設管理（facility-management）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `facility-floor-cleaning` | 床清掃 | cleaning | early-stage | （dual-arm実績なし・watch） |
| `facility-waste-collection` | ごみ回収・整理 | cleaning, material-handling | pilot-phase | onex-neo |
| `facility-wayfinding` | 道案内・館内ガイド | customer-service, patrol | production-ready | aeolus-aeo |
| `facility-security-patrol` | 警備巡回 | patrol | production-ready | onex-eve, aeolus-aeo |
| `facility-desk-tidying` | 机・棚整理 | material-handling, cleaning | pilot-phase | aeolus-aeo |

※ `demo-exhibition`（既存）はこのカテゴリに primaryIndustry を付与するが、内容は施設管理でなく展示向けなので将来整理対象。

**研究・開発（research）**

| slug | タスク名 | taskTags | maturityLevel | 主な候補robot slug |
|---|---|---|---|---|
| `research-drug-discovery` | 創薬・実験自動化 | research-task, assembly | production-ready | kawasaki-nextage |
| `research-ai-simulation` | AI学習・シミュレーション環境 | research-task | production-ready | figure-02, figure-03 |
| `research-ros-bench` | ROSベンチ・開発環境 | research-task | production-ready | fourier-gr1, unitree-h1 |
| `research-hri-study` | HRI実験・社会受容研究 | research-task | pilot-phase | figure-02 |
| `research-prototype-dev` | 試作・実証開発 | research-task | pilot-phase | figure-03 |

※ `research-development`（既存）は `research-ros-bench` と重複するため既存維持。

---

## 3. 実装タスク

依存を明示するため ID を付けます。1 task = 1 commit が原則。

### Phase A: tagRegistry 再設計（`lib/tagRegistry.ts` のみ触る）

**A-01 産業タグ正規化**

- 変更ファイル: `lib/tagRegistry.ts`
- 変更内容（2ステップ）:
  - ステップ1（このタスクで実施）: `construction` / `healthcare` / `facility-management` を新値として追加。旧値はまだ削除しない
  - ステップ2（B-09・B-09b 完了後に別 commit で実施）: 旧値 `plant`, `facility`, `e-commerce`, `marketing`, `hospitality`, `public-sector`, `education`, `construction-infrastructure`, `healthcare-care` を削除
- 完了条件:
  - ステップ1: `npx tsc --noEmit` が通過する
  - ステップ2: `npm run validate` が通過し `grep -r "construction-infrastructure\|healthcare-care" data/` が 0 件

**A-02 タスクタグ正規化**

- 変更ファイル: `lib/tagRegistry.ts`
- 変更内容（2ステップ）:
  - ステップ1（このタスクで実施）: `hazardous-work`（label: '危険作業・インフラ保守'）と `research-task`（label: '研究・実験・検証'）を新値として追加。旧値はまだ削除しない
  - ステップ2（B-09・B-09b・B-09c 完了後に別 commit で実施）: 旧値 `quality-inspection`, `shelf-stocking`, `r-and-d`, `hri`, `control`, `demo`, `exhibition`, `disaster-response` を削除
- 完了条件:
  - ステップ1: `npx tsc --noEmit` が通過する
  - ステップ2: `npm run validate` が通過し `grep -r "r-and-d\|hri\b\|exhibition\|shelf-stocking" data/` が 0 件

**A-03 use-case-domain kind 削除**

- 変更ファイル: `lib/tagRegistry.ts`
- 変更内容: `'use-case-domain'` の TagKind 定義と 7 件の tag 値エントリをすべて削除
- 注意: この前に B-01（types.ts から primaryDomain 削除）と B-02（validate.ts から use-case-domain 参照削除）を終わらせておくこと
- 完了条件: `grep -r "use-case-domain" lib/ src/ components/ data/` の結果が 0 件

### Phase B: 型・バリデーション・ロジック変更

**B-01 types.ts: primaryIndustry 追加 + primaryDomain/secondaryDomains 削除**

- 変更ファイル: `data/types.ts`
- 変更内容:
  - `UseCase` に `primaryIndustry: TagValue<'industry'>` を追加（`industryTags` の直前に配置）
  - `primaryDomain: TagValue<'use-case-domain'>` フィールドを削除
  - `secondaryDomains?: TagValue<'use-case-domain'>[]` フィールドを削除
- 注意: `TagValue<'use-case-domain'>` の型参照がなくなることで TypeScript 型エラーが各所に連鎖する。後続タスクで順次解消する
- 完了条件: `npx tsc --noEmit` が型エラー 0（B-02 以降のタスクと合わせて通過させる）

**B-02 validate.ts: domain バリデーション更新**

- 変更ファイル: `lib/validate.ts`
- 変更内容:
  - L551–L555 の `primaryDomain` / `secondaryDomains` / `domain-duplicate` チェックブロックを削除
  - `primaryIndustry` のバリデーションを追加: `checkTags('useCase', u.slug, 'primaryIndustry', 'industry', [u.primaryIndustry])`
- 完了条件: `npm run validate` が既存8件に対してエラーなし（B-09 でデータ修正後に最終確認）

**B-03 search.ts: use-case-domain インデックス削除**

- 変更ファイル: `lib/search.ts`
- 変更内容: `use-case-domain` を kind に指定している L270 付近のブロックを削除
- 完了条件: `grep "use-case-domain" lib/search.ts` が 0 件

**B-04 useCaseFilters.ts: domain フィルタ削除**

- 変更ファイル: `lib/useCaseFilters.ts`
- 変更内容:
  - `UseCaseFilters` インターフェースから `domain: string | null` を削除
  - `normalizeUseCaseFilters` の引数から `domain` / `domainValues` を削除
  - L55 の `filters.domain` を使った `matchesTag` 呼び出しを削除
  - L61 の `active` 計算式から `filters.domain` を削除
- 完了条件: 型エラーなし

**B-05 tags.ts: getUseCaseDomainOptions 削除**

- 変更ファイル: `lib/tags.ts`
- 変更内容:
  - `getUseCaseDomainOptions` 関数（L104–L110）を削除
  - 同関数を export している場合は export 元からも削除
- 完了条件: `grep "getUseCaseDomainOptions" lib/ src/ components/` が 0 件

**B-06 useCaseDisplay.ts: getUseCaseDomainLabel 削除**

- 変更ファイル: `lib/useCaseDisplay.ts`
- 変更内容:
  - `getUseCaseDomainLabel` 関数（L17–L37）を削除
  - `getUseCaseOverviewFacts` 内で `getUseCaseDomainLabel` を呼んでいる行を削除（表示行ごと消す）
- 完了条件: `grep "primaryDomain\|use-case-domain\|getUseCaseDomainLabel" lib/useCaseDisplay.ts` が 0 件

**B-07 visualSemantics.ts: use-case-domain エントリ削除**

- 変更ファイル: `lib/visualSemantics.ts`
- 変更内容: L174 の `'use-case-domain': 'brand'` 行を削除
- 完了条件: `grep "use-case-domain" lib/visualSemantics.ts` が 0 件

**B-08 uiText.ts: domain 関連文言の整理**

- 変更ファイル: `lib/uiText.ts`
- 変更内容:
  - `common.allDomains` キー削除（'すべての得意分野'）
  - `filters.domain` キー削除（'得意分野'）
  - `useCases.description` を更新: '産業・現場タスクからヒューマノイドの実適用シーンを探す。実導入事例の有無を明示しています。'
  - `useCases.all` 文言を更新: 産業別・成熟度別表示に合わせる（UI 実装と同時でよい）
- 完了条件: `grep "allDomains\|filters.domain" lib/uiText.ts` が 0 件

**B-09 data/useCases.ts: 既存8件のデータ移行**

セクション 2-D の migration マップに従い全件更新する。

- 変更ファイル: `data/useCases.ts`
- 変更内容: 各レコードについて
  1. `primaryDomain` フィールド行を削除
  2. `secondaryDomains` フィールド行を削除（存在する場合）
  3. `primaryIndustry` フィールドを追加（2-D の値を使う）
  4. `industryTags` の古い値を 2-D の修正後の値に変更
  5. `taskTags` の古い値を 2-D の修正後の値に変更
- 完了条件: `npm run validate` が 8 件全員エラーなし

**B-09b data/robots.ts: industryTags 移行**

削除・リネーム予定の産業タグ値が `data/robots.ts` にも使われているため、A-01 ステップ2（旧値削除）より前に更新する。

- 変更ファイル: `data/robots.ts`
- 対象行（確認済み）:
  - L1116, L1170, L2666: `healthcare-care` → `healthcare`
  - L1274: `construction-infrastructure` → `construction`, `public-sector` → 削除
  - L1720: `plant` → 削除
  - L2087: `healthcare-care` → `healthcare`, `education` → `research`
  - L2139: `healthcare-care` → `healthcare`, `hospitality` → `retail`
- 変更内容: 各行の旧タグ値を 2-A の新値に置き換え、対応する新値がない値（`plant`, `public-sector` 等）は削除する
- 完了条件: `grep "healthcare-care\|construction-infrastructure\|public-sector\|plant\b\|hospitality\|education\b" data/robots.ts` が 0 件

**B-09c data/robots.ts: taskTags 移行**

削除・リネーム予定のタスクタグ値が `data/robots.ts` に多数存在するため、A-02 ステップ2（旧値削除）より前に更新する。

- 変更ファイル: `data/robots.ts`
- 対象行（確認済み）:
  - L57, L114, L170, L227, L494, L656, L714, L787, L843 ほか: `r-and-d` → `research-task`
  - L1005 ほか: `exhibition` → 削除、`hri` → 削除
  - その他 `quality-inspection`, `shelf-stocking`, `control`, `demo`, `disaster-response` が存在する行も同様に対応
- 変更内容: `r-and-d` → `research-task` に置き換え。`exhibition`, `hri`, `demo`, `control` は robots.ts に適切な移行先がないため削除する。`quality-inspection` → `inspection`, `shelf-stocking` → `picking`, `disaster-response` → `hazardous-work` に置き換える
- 完了条件: `grep "r-and-d\|hri\b\|exhibition\|shelf-stocking\|quality-inspection\|disaster-response\b\|demo\b\|control\b" data/robots.ts` が 0 件

### Phase C: UI 再設計

**C-01 src/app/use-cases/page.tsx: domain パラメータ削除**

- 変更ファイル: `src/app/use-cases/page.tsx`
- 変更内容:
  - import から `getUseCaseDomainOptions`, `getTagLabel` の domain 用呼び出しを削除
  - `pickSearchParams` の配列から `'domain'` を削除
  - `resolveFilters` から `domain` と `domainValues` の引き渡しを削除
  - `generateMetadata` 内の `filters.domain ? getTagLabel(...)` 呼び出しを削除
- 完了条件: 型エラーなし、`grep "domain" src/app/use-cases/page.tsx` が 0 件

**C-02 components/UseCasesBrowser.tsx: ドメインドロップダウン削除・産業タブ追加**

設計方針：産業を横スクロールタブで選択 → その産業に属するタスクのドロップダウンが動的に出現 → 成熟度別にカードグループ表示。

- 変更ファイル: `components/UseCasesBrowser.tsx`
- 変更内容:
  - `getUseCaseDomainOptions` のインポートと `domainOptions` state を削除
  - 既存の industry SelectControl を削除し、産業タブ（横スクロール行）に一本化する。URL param `industry` は同じキーを流用するため `useUrlParamUpdater` の変更は不要
  - domain SelectControl を削除
  - 産業タブ行を追加: 「全産業」+ 2-A の8産業値ボタン、選択中は下線・強調
  - 産業フィルタのマッチロジック: `useCase.primaryIndustry === selectedIndustry` で一致判定する（`industryTags` は複数産業にまたがる場合の補助フィルタとして残すが、産業タブのグルーピング基準は `primaryIndustry` 単一値に限定する）
  - 産業タブ選択後、その産業の UseCase が持つ `taskTags` の和集合のみ taskOptions に表示する
  - 結果グリッドを成熟度別セクション（production-ready / pilot-phase / early-stage）に分割し見出しを表示
  - `activeChips` から domain の chip 生成ロジックを削除
- 完了条件: `npm run build` が通過、ブラウザで産業タブ切替・タスク絞り込み・成熟度別表示が動作する

**C-03 components/UseCaseCard.tsx: 実績バッジ追加**

- 変更ファイル: `components/UseCaseCard.tsx`
- 変更内容:
  - カード下部に maturityLevel バッジを追加（production-ready = '実導入あり'、pilot-phase = 'PoC実証'、early-stage = '研究段階'）
  - `candidateRobots.length` の表示を「候補 N 件」から具体的なロボット名（最大2件）に変更
  - maturityLevel ラベルは `lib/labels.ts` の既存 `maturityLabels: Record<UseCaseMaturity, string>` を使う（L168 付近に存在確認済み）
- 完了条件: カードに maturityLevel が表示される

### Phase D: 新規ロボットデータ追加

**D-01 data/robots.ts: 5 ロボット追加**

2-E で列挙した5ロボットを追加する。各ロボットのデータは `docs/planning/data-maintenance-checklist-v1.md` の事前チェックゲートに従うこと。

- 対象: `kawasaki-nextage`, `galbot-g1`, `aeolus-aeo`, `telexistence-ghost`, `zizai-zeroshiki`
- 変更ファイル: `data/robots.ts`, `data/manufacturers.ts`（メーカー未登録の場合）
- 完了条件: `npm run validate` が通過、各 slug が `/robots/[slug]` でアクセス可能

### Phase E: 新規ユースケースデータ追加（産業別・計8 commit）

2-F で定義した42シーンを産業ごとに分けて追加する。既存8件の slug と重複するシーンは追加しない（2-F の※注参照）。追加は実質34シーン前後になる。

各 commit の前に `npm run validate` を実行し、通過後に commit すること。

各エントリに必要な最低限フィールド:
- `id`, `slug`, `title`, `titleJa`, `subtitle`, `publishStatus: 'published'`
- `maturityLevel`, `buyerReadiness`, `environment`, `requiredCapabilities`
- `primaryIndustry`, `industryTags`, `taskTags`
- `atAGlance` (whereFits, whereDoesNotFit, mustBeTrue)
- `overview`, `whyItMatters`, `environmentRequirements`, `whyHardToday`, `japanDeploymentConditions`
- `capabilityNotes`（省略可）, `keyTakeaways`（省略可）
- `candidateRobots`（fit, basis, reason, evidenceDeploymentIds or evidenceSourceUrls）
- `sources`（最低1件）
- `relatedUseCaseIds: []`

| タスク ID | 対象産業 | 新規追加シーン数 | 依存 |
|---|---|---|---|
| E-01 | manufacturing | 5 | A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-02 | logistics | 4（tote 系は既存あり）| A-01, A-02, B-09, B-09b, B-09c |
| E-03 | construction | 5 | A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-04 | agriculture | 5 | A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-05 | healthcare | 4（care-physical は既存）| A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-06 | retail | 3（customer-reception, retail-shelf-stocking は既存）| A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-07 | facility-management | 5 | A-01, A-02, B-09, B-09b, B-09c, D-01 |
| E-08 | research | 4（research-development は既存）| A-01, A-02, B-09, B-09b, B-09c, D-01 |

---

## 4. タスク順序制約

```
A-01 ステップ1 ─┐
A-02 ステップ1 ─┤─→ B-01 ─→ B-02 ─→ A-03（use-case-domain 完全消去）
               │          ├─→ B-03
               │          ├─→ B-04 ─→ C-01 ─→ C-02
               │          ├─→ B-05 ─→ C-02
               │          ├─→ B-06
               │          ├─→ B-07
               │          └─→ B-08 ─→ C-02
               │
               ├─→ B-09（useCases.ts 移行）──┐
               ├─→ B-09b（robots.ts industryTags 移行）─┤─→ A-01 ステップ2（産業旧値削除）
               └─→ B-09c（robots.ts taskTags 移行）────┤─→ A-02 ステップ2（タスク旧値削除）
                                                        └─→ E-01〜E-08

D-01 は A-01/A-02 ステップ1 と並行可能。E タスクは D-01、B-09、B-09b、B-09c 完了後。
C-03 は C-02 と並行可能（独立したコンポーネント）。
```

同じファイルを触るタスクのペア（逐次実行すること）:
- A-01, A-02, A-03 は `lib/tagRegistry.ts` を触るため逐次
- B-01〜B-09 のうち同一ファイルのものは逐次（B-01: types.ts, B-02: validate.ts など各タスクは別ファイル）

---

## 5. 実装しないこと

- `/use-cases/[slug]` 詳細ページの構造変更（現行のままでよい）
- URL パラメータ名の変更（`industry`, `task`, `q` は現行のまま。`domain` は削除するが rename しない）
- `FacetFilterBar` を UseCase 用に追加する（A-02 以前のスコープ。現行 `SelectControl` で産業タブは実装する）
- ユースケース間の `relatedUseCaseIds` の網羅的な相互参照設定（空配列でよい）
- 新規ロボット5件の詳細ページ用コンテンツ（`publishStatus: 'published'` で最低限追加すれば可）
- `atAGlance`, `overview` 等のコピーライティング最適化（最低限の内容で追加する。磨き込みは別 task）

---

## 6. リスクと軽減策

| リスク | 軽減策 |
|---|---|
| `construction-infrastructure` slug を `construction` にリネームした場合、既存データが参照失敗 | B-09（データ移行）で全件書き換えてから A-01 で旧値を削除する。validate が参照失敗を検出する |
| `healthcare-care` 等の旧値が `data/robots.ts` に残ったまま A-01 旧値削除を実行すると validate が壊れる | B-09b を A-01 ステップ2 より先に完了させること。`grep "healthcare-care" data/robots.ts` が 0 件を確認してから削除 |
| 既存 URL `?domain=move-goods` 等がブックマークされている場合 404 でなく無効フィルタとして無視される | `normalizeUseCaseFilters` で未知の param を null に倒しているため既存挙動で問題なし |
| 新規ロボット5件のメーカー登録漏れ | D-01 前に `data/manufacturers.ts` を確認し、未登録の場合は manufacturers から追加 |
| E タスクで candidateRobots に存在しない slug を指定するとビルドエラー | E タスク前に D-01 を完了させること。validate がロボット参照を確認する |

---

## 7. 完了条件と検証コマンド

### 自動検証

```bash
# データ検証（全タスク後に必ず実行）
npm run validate

# 型チェック
npx tsc --noEmit

# ビルド確認
npm run build

# use-case-domain の残存確認（A-03 完了後）
grep -r "use-case-domain" lib/ src/ components/ data/ --include="*.ts" --include="*.tsx"

# 削除済みタグ値の残存確認（useCases.ts と robots.ts の両方を対象にする）
grep -r "healthcare-care\|construction-infrastructure\|quality-inspection\|shelf-stocking\|r-and-d\b\|primaryDomain\|secondaryDomains" data/useCases.ts data/robots.ts
```

### 手動確認チェックリスト

- [ ] `/use-cases` を開き、産業タブが8産業分表示される
- [ ] 産業タブを選択するとその産業に絞られ、URL に `?industry=manufacturing` 等が反映される
- [ ] タスクドロップダウンが選択中の産業に紐づいたタスクのみ表示する
- [ ] 結果が成熟度別（実導入あり / PoC実証 / 研究段階）に分かれて表示される
- [ ] カードに maturityLevel バッジとロボット名が表示される
- [ ] フィルタなしで全42件（＋既存8件から重複除いた件数）が表示される
- [ ] `/use-cases/[slug]` 詳細ページが既存8件・新規追加件いずれも正常表示される
- [ ] `?domain=move-goods` を URL に直接入力しても壊れない（無視して全件表示する）
- [ ] モバイル幅（375px）で産業タブが横スクロール可能

---

## 8. docs/planning/README.md への登録

このファイルを `(c) 未実装・作業計画` セクションに追加すること（別 commit）。
