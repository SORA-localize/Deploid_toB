# Robot Catalog Full-stack Implementation Plan v2

Status: implementation and validation complete / Draft PR ready
Created: 2026-07-14
Last reviewed: 2026-07-14
Branch: `feature/robot-catalog-fullstack-20260714`
Plan review rule: `ai/rules/10-workflow.md`
Implementation review rule: `docs/planning/ai_fullstack_development_guardrails_v1.md`

## 1. 目的

ロボット一覧カードとロボット詳細ページを、データ型、SSOT、resolver、validator、UI、欠損状態、出典、関連取得まで一貫して再実装する。

同時に、プロジェクト内の短いラベル–値表示を役割別の共通部品へ整理する。ただし、記事本文、長文説明、真の多列表まで同じ見た目へ統一しない。

今回の構造・UI改修が完了してから、published robot全件の最新情報を公式情報中心に再調査する。現行データの値の正しさを先に直すことは本計画の構造実装フェーズに含めない。

## 2. 実装開始前のGitゲート

2026-07-14時点:

| ref | commit | 状態 |
|---|---|---|
| `origin/main` | `d25108e` | ロゴbaseline PR #1をmerge済み |
| local `main` | `d25108e` | origin/mainと同期済み |
| `feature/robot-catalog-fullstack-20260714` | branch HEAD | merge後mainへrebase済み。本計画の実装branch |

実装開始条件（2026-07-14完了）:

1. GitHub CLI認証を復旧した。
2. ロゴbaselineをPR #1でレビューし、`origin/main`へmergeした。
3. local mainをorigin/mainへ同期した。
4. 本branchをmerge後mainへrebaseし、重複cherry-pickを除外した。
5. cleanなworktreeから本計画の実装を開始した。

`archive/robot-detail-prototype-20260714` と `archive/local-media-preview-20260714` は履歴参照のみとし、mergeしない。著作権無視プロトタイプの素材・権利判断・データを採用しない。

## 3. 計画監査で確認した事実

### 3.1 再利用できる既存実装

- 通常一覧カード: `components/RobotCard.tsx`
- Home・記事・メーカー解説の視覚カード: `components/FeaturedRobotCard.tsx`
- Homeのレール外枠: `components/FeaturedRobotsGrid.tsx`
- 画像権利gate: `lib/media.ts`
- 画像権利メタデータ: `ImageAsset` / `RightsMeta`
- スペック項目SSOT: `lib/specSchema.ts`
- 表示整形: `lib/robotDisplay.ts`
- データ取得・関連解決: `lib/data.ts`
- 用途関係SSOT: `UseCase.candidateRobots`
- 出典SSOT: 各Robotの `sources[]`
- 詳細の出典UI: `components/SourceList.tsx`
- カルーセル基盤: `components/uilayouts/carousel.tsx`
- semantic token: `src/app/globals.css`

### 3.2 存在しなかった共通部品

`RobotCardRail` は存在しない。横レールのclassとカード幅は次の3箇所へ重複している。

- `components/FeaturedRobotsGrid.tsx`
- `components/ManufacturerGuideArticleBody.tsx`
- `src/app/reports/[slug]/page.tsx`

関連ロボットへ「既存の共通レールを流用する」とは書けない。先に共通部品を抽出する。

### 3.3 ラベル–値UIの実装箇所

短いfact表示として共通化対象:

- `RobotStickyAside` の基本スペック
- `ManufacturerFactSheet`
- `ManufacturerCard` の4項目
- `RobotCard` のスペック項目
- `CompareClient.CompareCardSpecList`
- `ComparisonRobotPanel` の比較行
- 新しい詳細仕様右パネル

共通化対象外:

- `DefinitionList` の長文説明（about / privacy / for-manufacturers / use-case）
- メーカー解説の導入分類、調達チャネル、FAQ
- メーカー解説ラインナップの真の多列表
- `SourceList`、関連記事、ナビ、件数表示

### 3.4 現行文書とコードの矛盾

- `design_system_v1.md` はRobotCard画像を4:3とするが、コードと画像READMEは7:6。
- `data/types.ts`、`RobotImageCarousel`、画像READMEは7固定スロットを前提とする。
- 新仕様は表示可能な実画像だけを並べ、空roleをスライドにしない。
- `ManufacturerGuideLineupItem.priceLabel` はRobotの `priceNote` と価格SSOTを二重化している。
- 詳細ページの「導入判断」と `comparison` 自由記述は、今回求める公式スペック中心の構成と一致しない。

これらはdocsだけでなく、型・validator・消費UIを同じtaskで整合させる。

## 4. 確定したプロダクト契約

### 4.1 desktopロボットカード

表示順を次の4項目に固定する。

1. 用途
2. サイズ
3. 価格
4. 稼働時間

ルール:

- 「国内」「段階」「可搬」はdesktopカードから外す。
- 用途は公式根拠付きで既存UseCaseへ接続できる項目だけを使う。
- 複数用途は代表1件 + `ほかN件`。
- サイズは `身長 / 重量`。両方なければ `—`。
- 価格はメーカー公式公開価格、国内正規代理店公開価格、Deploid問い合わせの順。
- 公開価格がなければ `問い合わせ` を `/contact` へリンクする。
- 推測価格、非正規販売店価格、出典不明価格を表示しない。
- 腕荷重・payloadはカードに表示しない。
- 画像比率は7:6。4項目化で本文が1行分縮み、画像の相対比率が上がる。カードへ固定最小高を追加しない。
- 概要文は表示しない。

mobile専用の新カードは今回実装しない。`mobileVisual` の画像 + 名前表示と、メーカー詳細で使う既存mobile行表示を維持する。desktop変更をmobile対応済みとは扱わない。

### 4.2 ロボット詳細ページ

表示順:

1. 概要
2. 画像 + 基本スペック
3. 詳細仕様
4. 想定用途（該当時のみ）
5. 活用事例（該当時のみ、最大3件）
6. 関連ロボット（該当時のみ）
7. 出典（最終の情報セクション）
8. 前後機体ナビ（本文外のページ送りフッター）

撤去する表示:

- 導入段階を中心とする「導入判断」
- AI生成の「実務ラベル」
- 自由記述の向く用途、向かない用途、不向きな現場
- 巨大な空欄仕様表
- 活用事例のサムネイル、タグ、注釈、研究システムの補足文

データは一度に削除しない。今回表示しなくなる `buyerReadiness`、`comparison`、旧 `priceNote` 等は、他画面と全件データ移行が終わるまでdeprecated扱いで残す。

### 4.3 画像

- Robotでは `Robot.images` をSSOTとする。
- `BaseRecord.heroImage` は記事・メーカー向けに残すが、Robotの新規登録では使わない。
- 表示可能画像0枚: 単一placeholder。
- 1枚: 静止表示。dot、prev/next、drag cursorを出さない。
- 2枚以上: 実画像だけでカルーセルを構成する。
- 未投入ImageRoleを空スライドにしない。
- role label、credit、sourceを表示する。
- RobotCard、FeaturedRobotCard、ComparisonRobotPanel、JSON-LDも共通primary-image resolverを使う。

### 4.4 詳細仕様

desktopの固定規格:

- 全体高: 480px。
- 左ナビ: 11rem。
- 左は4項目を等分する。
- 右表示領域は選択によらず同じ幅・高さを維持する。
- 1グループ最大6行。値は原則2行以内。
- overflowは長い公式値に対する安全弁として右パネルだけに許可する。
- hover、focus、clickで選択する。keyboardではArrow/Home/Endを使えるようにする。
- `role=tablist/tab/tabpanel`、`aria-selected`、`aria-controls`、visible focusを付ける。

4グループ:

1. 本体・可動
2. 電源・稼働
3. 操作・開発
4. 環境・安全

初期項目は `specSchema` に登録する。公開値がない行は原則省き、グループが空なら右領域に `公開情報なし` を1回だけ表示する。右領域を空欄の羅列で埋めない。

mobileでは新しいhover UIを作らず、同じview modelを単純な縦積みFactListで表示する。

### 4.5 想定用途

- SSOTは `UseCase.candidateRobots`。
- `basis === 'official-use-case'` かつ `evidenceSourceUrls` がある関係だけを表示する。
- 表示は `想定用途：研究開発 / 仕分け` の1行。
- 用途名は `/use-cases/[slug]` へのリンク。
- 説明文、タグ風UI、reasonは表示しない。
- 該当0件なら行・セクションごと表示しない。
- 並びは `sortUseCases()` の日本語名順で固定する。
- 公式サイトに用途があるが既存UseCaseに対応先がない場合、AIは自動追加せず `USE_CASE_GAP <robotId> <公式表現> <sourceUrl>` を人間へ報告する。

### 4.6 活用事例

- Robotは `usageExampleSourceUrls` だけを最大3件持つ。
- URLは同じRobotの `sources[]` に存在しなければならない。
- UIタイトル、publisher、publishedAtは該当Sourceから解決し、Robotへ複製しない。
- 外部記事・YouTubeのタイトルをそのままリンクテキストとして表示する。
- 補助表示はpublisherと公開日のみ。
- 本文、リード、画像、サムネイル、タグ、独自注釈を転載しない。

### 4.7 関連ロボット

- `manufacturerId` 一致から導出する。
- 現在開いているrobotを除外する。
- 対象はpublishedのみ。draftは出さず、archivedは関連レールへ出さない。
- `sortRobots(..., 'featured')` で並べ、最大8件。
- 0件ならセクションを表示しない。
- `FeaturedRobotCard` と新設する `RobotCardRail` を使う。

### 4.8 出典

- セクション名は「出典」。`SourceList`を再利用する。
- 詳細ページの最終情報セクションにする。本文外の前後機体ナビだけはその下へ置ける。
- 仕様、価格、load rating、活用事例からRobot.sourcesのURLを追跡可能にする。
- 外部URLのリンク切れ修正は全件再調査フェーズで行い、構造PRへ混ぜない。

## 5. データSSOT

### 5.1 価格

追加する最小構造:

```ts
type RobotPriceChannel = 'manufacturer-public' | 'authorized-distributor-public';

interface RobotPriceOffer {
  channel: RobotPriceChannel;
  display: string;
  amount?: number;
  currency?: string;
  taxStatus?: 'included' | 'excluded' | 'unknown';
  variant?: string;
  sellerName?: string;
  sourceUrl: string;
}
```

- `display` は公式表記を短く保持する。amountへ変換できない値を捏造しない。
- `authorized-distributor-public` は `sellerName` 必須。
- `sourceUrl` はRobot.sources内のURL必須。
- resolverは公式offerを優先し、なければ代理店offer、それもなければ問い合わせを返す。
- `priceNote` は移行中のdeprecated field。新カード・新詳細・メーカー解説ラインナップは参照しない。

### 5.2 load rating

既存 `specs.payloadKg` を片腕荷重へ読み替えない。

```ts
interface RobotLoadRating {
  scope: 'single-arm' | 'dual-arm' | 'whole-body' | 'carrier' | 'manufacturer-wording';
  rating: 'rated' | 'maximum' | 'unspecified';
  kg: number;
  condition?: string;
  variant?: string;
  sourceUrl: string;
}
```

- 詳細仕様でだけ使う。
- scopeとratingを確認できない旧payloadは自動移行しない。
- 同一variant・scope・ratingの重複をvalidatorで拒否する。

### 5.3 スペックとfield evidence

`specSchema` のgroupを4グループへ揃え、既存項目に加えて次のoptional項目を登録する。

- `batteryCapacityWh`
- `chargeTimeMin`
- `batterySystem`（交換式等の公式短文）
- `controlMethod`
- `sdk`
- `computePlatform`
- `operatingTemperature`
- `safetyStandard`

値は全件再調査まで未設定でよい。項目を追加しただけで空行を全表示しない。

Robotは、仕様keyと価格・load ratingから `sources[]` へ接続するoptional evidence mapを持つ。URL joinはUseCase候補と同じ既存方式に合わせる。新しいSource ID体系は今回導入しない。

### 5.4 活用事例

Robotに `usageExampleSourceUrls?: string[]` を追加する。新しい外部記事型、画像型、タグ型は作らない。

### 5.5 用途

Robot側に用途ID・タグ・名称を複製しない。公式用途はUseCaseから逆引きする。カード代表用途も同じ配列から導出する。

### 5.6 画像・許諾

既存 `ImageAsset.rights` をロゴ・ロボット画像で共有する。メーカー提供素材の許諾原本を公開repoへ保存しない。許諾記録の別SSOT化は `manufacturer-logo-usage-spec-v1.md` の残課題であり、このロボットUI PRでは新しい契約DBを作らない。

## 6. 共通UI契約

### 6.1 `FactList`

短い基本情報・仕様向け。

- `compact`: sidebar用、ラベル7rem。
- `standard`: 本文用、ラベル8rem。
- label/valueは左揃え。
- `dl/dt/dd`、行罫線、折返し、欠損表示を共通化。
- ラベル末尾にコロンを付けない。
- mobileでは1列へ積む。

使用: RobotStickyAside、ManufacturerFactSheet、詳細仕様右パネル。

### 6.2 `CardFactGrid`

カード内の4項目向け。

- 2列×2行。
- ラベル上、値下。両方左揃え。
- 値最大2行。
- 項目数は4固定で、カードごとの独自行を増やさない。

使用: RobotCard、ManufacturerCard。

### 6.3 `ComparisonSpecList`

比較画面専用。

- 数値だけ右揃え + `tabular-nums`。
- 状態名・文章・欠損値は左揃え。
- valueKindをview modelで明示し、文字列の正規表現から配置を推測しない。

使用: CompareClient、ComparisonRobotPanel。

### 6.4 `RobotCardRail`

- 子カード: `FeaturedRobotCard`。
- card width: 44%（既存mobile維持）、30%（sm）、12rem（md以上）。
- gap: 0.75rem、sm以上1rem。
- `overflow-x-auto`、`overscroll-x-contain`、`snap-x snap-mandatory`。
- cardは `shrink-0 snap-start`。
- rail自身が見出し・データ取得を持たない。

使用: Home、記事関連ロボット、メーカー解説ラインナップ、ロボット詳細の関連ロボット。

## 7. 最終変更ファイル一覧

### 新規

- `components/FactList.tsx`
- `components/CardFactGrid.tsx`
- `components/ComparisonSpecList.tsx`
- `components/RobotSpecExplorer.tsx`
- `components/RobotCardRail.tsx`
- `lib/robotCatalog.ts`
- `lib/robotMedia.ts`

### 変更予定

- `data/types.ts`
- `data/articles.ts`
- `lib/specSchema.ts`
- `lib/labels.ts`
- `lib/uiText.ts`
- `lib/data.ts`
- `lib/validate.ts`
- `lib/robotDisplay.ts`
- `lib/jsonLd.ts`
- `components/RobotCard.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturerRobotsGrid.tsx`
- `components/ManufacturerCard.tsx`
- `components/ManufacturerFactSheet.tsx`
- `components/RobotStickyAside.tsx`
- `components/RobotImageCarousel.tsx`
- `components/FeaturedRobotCard.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `components/CompareClient.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/ManufacturerGuideArticleBody.tsx`
- `components/CardGridSkeleton.tsx`
- `components/ManufacturerCardGridSkeleton.tsx`
- `components/ManufacturerDetailSkeleton.tsx`
- `components/RobotDetailSkeleton.tsx`
- `src/app/robots/page.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `public/images/robots/README.md`
- 本計画書

### 構造PRでは変更しない

- `data/robots.ts` の全件値
- `data/useCases.ts` の用途内容
- `data/deployments.ts`
- `lib/robotFilters.ts`、検索・URL state
- `lib/tagRegistry.ts`（想定用途用の新タグは作らない）
- contact form実装
- メーカーロゴresolver・rights構造
- archive branch / prototype route
- mobile専用カード・hover仕様
- CMS、外部DB、API

全件調査PRでは `data/robots.ts`、`data/useCases.ts`、必要に応じて `data/deployments.ts` を小分けに変更する。

## 8. 実装task

### GIT-00 ロゴbaselineを先に統合

Files: なし（Git操作のみ）

Problem: 本branchが未pushのロゴ実装・レビュー修正へ依存しており、origin/mainから直接レビューできない。

Change: §2のGitゲートを実行し、本branchをmerge後mainへrebaseする。

Completion: `git merge-base --is-ancestor origin/main HEAD` が成功し、ロゴ修正が1系列だけ存在し、worktreeがclean。

Validation: `git log --graph --decorate --oneline --all`、`git status --short`、`git diff origin/main...HEAD --check`。

Depends on: GitHub CLI再認証。

### DS-01 デザイン・データ契約を正本へ反映

Files: `docs/planning/design_system_v1.md`, `docs/planning/ui_architecture_and_development_policy_v1.md`, `docs/data/README.md`, `docs/planning/data-maintenance-checklist-v1.md`, `public/images/robots/README.md`

Problem: 4:3カード、7空スロット、存在しない共通railなど文書とコード・新仕様が矛盾する。

Change: §4〜6のカード、rail、FactList、固定パネル、実画像カルーセル、価格・用途・活用事例の契約を記録する。

Completion: 現行正本に4:3/7空スロット/legacy priceLabelを正とする記述が残らない。

Validation: `rg -n 'aspect-\[4/3\]|7スロット|空スライド|priceLabel' docs/planning/design_system_v1.md public/images/robots/README.md docs/data/README.md`。

Depends on: GIT-00。Commit: docs only。

### DATA-01 Robotデータ契約を追加

Files: `data/types.ts`, `lib/specSchema.ts`, `lib/labels.ts`, `lib/uiText.ts`

Problem: priceNote、payloadKg、固定画像roleだけでは、価格優先順、荷重の意味、4仕様グループ、活用事例選択を型で表せない。

Change: §5のprice offer、load rating、field evidence、usageExampleSourceUrls、追加SpecKeyをoptionalで定義する。legacy fieldはdeprecatedにするが削除しない。

Completion: 型が曖昧値の自動変換を要求せず、既存dataを変更しなくてもcompileできる。

Validation: `npm run build`。

Depends on: DS-01。Commit: type/schema only。

### DATA-02 resolverとvalidatorを実装

Files: `lib/robotCatalog.ts`（new）, `lib/robotDisplay.ts`, `lib/data.ts`, `lib/validate.ts`

Problem: ページとカードがRobotのraw fieldを直接組み立て、価格・用途・出典・関連のルールが散る。

Change: card view model、価格、公式用途、基本fact、4仕様group、活用事例、同一メーカー関連をpure resolverへ集約する。validatorへsource join、最大件数、価格channel、load意味、重複を追加する。

Completion:

- 新UIがraw `priceNote`、`industryTags[0]`、`comparison` を直接読まない。
- `usageExampleSourceUrls` は最大3・Robot.sources内だけ。
- official use case relationは根拠URL必須。
- related robotは現robot除外・published・最大8件。

Validation: `npm run validate:data`, `npm run build`。

Depends on: DATA-01。Commit: resolver/validation only。

### DATA-03 メーカー解説の価格二重管理を解消

Files: `data/types.ts`, `data/articles.ts`, `lib/data.ts`, `lib/validate.ts`, `components/ManufacturerGuideArticleBody.tsx`

Problem: `ManufacturerGuideLineupItem.priceLabel` がRobot価格と二重管理される。

Change: `priceLabel` を記事データから削除し、ラインナップ表示をDATA-02のprice resolverへ接続する。`roleLabel` は記事編集情報として残す。

Completion: `rg -n 'priceLabel' data components lib` が0件。価格未登録機体は問い合わせ表示になる。

Validation: `npm run validate:data`, `npm run build`。

Depends on: DATA-02。Commit: one SSOT migration。

### UI-01 FactListを追加し、短いfact面を移行

Files: `components/FactList.tsx`（new）, `components/RobotStickyAside.tsx`, `components/ManufacturerFactSheet.tsx`, `components/ManufacturerDetailSkeleton.tsx`

Problem: sidebarはtable + 右揃え、メーカー基本情報は独自grid + コロンで、同種情報の規格がない。

Change: compact/standard FactListを作り、両面を左揃えの同じsemantic構造へ移行する。CTAやメーカー固有の内容はFactListへ押し込まない。

Completion: RobotStickyAsideの基本スペックtableがなくなり、ManufacturerFactSheetの独自dt/dd gridがなくなる。

Validation: build、320/1280pxで長URL・複数代理店・欠損値を目視。

Depends on: DS-01。Commit: shared fact primitive。

### UI-02 CardFactGridを追加し、メーカーカードを移行

Files: `components/CardFactGrid.tsx`（new）, `components/ManufacturerCard.tsx`, `components/ManufacturerCardGridSkeleton.tsx`

Problem: ManufacturerCardの4行が独自justify-between + 右揃えで、RobotCardの4項目と規格を共有できない。

Change: 2×2・左揃えのCardFactGridを追加し、メーカー4項目を移行する。ロボットカード接続はCARD-01で行う。

Completion: ManufacturerCardのfact行に `justify-between` / `text-right` が残らず、skeletonが2×2に一致する。

Validation: build、カード全5列時の長文・欠損を目視。

Depends on: DS-01。Commit: card primitive + one consumer。

### UI-03 比較専用リストを統合

Files: `components/ComparisonSpecList.tsx`（new）, `components/CompareClient.tsx`, `components/ComparisonRobotPanel.tsx`, `lib/robotDisplay.ts`

Problem: 同じ比較行UIが2実装あり、すべて右揃えで、数値と状態文の区別がない。

Change: valueKind付きComparisonSpecListへ統合する。DnD、favorite、URL、view切替は変更しない。

Completion: CompareCardSpecListのローカル実装とComparisonRobotPanelの重複dlがなくなる。

Validation: build、DnD・favorite・visual/compact切替・keyboardを目視。

Depends on: DATA-02。Commit: comparison-only refactor。

### RAIL-01 RobotCardRailを抽出

Files: `components/RobotCardRail.tsx`（new）, `components/FeaturedRobotsGrid.tsx`, `components/ManufacturerGuideArticleBody.tsx`, `src/app/reports/[slug]/page.tsx`

Problem: rail幅・gap・snap・scrollbar classが3箇所へ重複し、関連ロボットで再利用できない。

Change: §6.4のrailを抽出する。見出しとデータ取得は各親へ残す。

Completion: `FeaturedRobotCard` を直接mapして横スクロールする実装がRobotCardRail内だけになる。

Validation: build、Home/記事/メーカー解説でsnap・横スクロール・card幅を目視。

Depends on: DS-01。Commit: behavior-preserving extraction。

### CARD-01 desktopロボットカードを4項目化

Files: `components/RobotCard.tsx`, `components/RobotsBrowser.tsx`, `components/ManufacturerRobotsGrid.tsx`, `components/CardGridSkeleton.tsx`, `src/app/robots/page.tsx`, `src/app/manufacturers/[slug]/page.tsx`, `lib/robotDisplay.ts`

Problem: 6項目に根拠の弱い国内・段階・可搬が入り、用途はindustryTag、価格は非表示。

Change: server側でcard view model mapを生成し、RobotCardは4factを描画するだけにする。CardFactGridを使い、価格問い合わせだけpointer操作可能にする。mobileVisualと既存mobile行は維持する。

Completion:

- desktopは用途/サイズ/価格/稼働時間だけ。
- card内に `japanAvailability` / `deploymentStage` / `payloadKg` の直接参照がない。
- 画像7:6、本文2行、固定min-heightなし。
- skeletonが7:6 + 2×2。

Validation: validate、build、画像有無・複数用途・価格3状態・長い名前を1280/1536pxで目視。360pxは既存表示が変わっていないことだけ確認。

Depends on: DATA-02, UI-02, MEDIA-01。Commit: desktop card behavior。

### MEDIA-01 Robot.imagesと表示画像resolverを統一

Files: `lib/robotMedia.ts`（new）, `components/RobotImageCarousel.tsx`, `components/RobotCard.tsx`, `components/FeaturedRobotCard.tsx`, `components/ComparisonRobotPanel.tsx`, `lib/jsonLd.ts`, `data/types.ts`, `lib/validate.ts`

Problem: primary image fallbackが各所へ重複し、カルーセルは常に7slide扱いになる。

Change: `getRobotPrimaryImage()` と表示可能image配列resolverを追加する。Robot.heroImage使用をvalidatorで拒否し、actual imageだけを0/1/複数表示する。

Completion:

- `imageRoleOrder.map` で空slideを作らない。
- 1画像時にCarousel操作がない。
- 主要4消費面とJSON-LDが同じprimary imageを使う。
- Robotの非空heroImageがvalidator errorになる。

Validation: validate、build、0/1/2/7画像fixtureを目視。SVG/PNG/JPEGのrights gateを維持。

Depends on: DATA-01。Commit: robot media SSOT。

### DETAIL-01 固定詳細仕様パネルを実装

Files: `components/RobotSpecExplorer.tsx`（new）, `components/FactList.tsx`, `lib/robotCatalog.ts`, `lib/uiText.ts`

Problem: 現行は全項目を縦に並べ、空値が増える。モックのhover UIは固定右領域とkeyboard契約が未実装。

Change: §4.4の480px/11rem/4groupパネルを実装する。右パネルはFactListを使い、group view modelだけを受け取る。

Completion: hover/focus/click/Arrow/Home/Endが同じactive stateを更新し、右領域の外寸が変わらない。mobileは縦積みfallback。

Validation: build、keyboard、focus visible、reduced motion、空group、6行、長い2行値、overflowを目視。

Depends on: DATA-02, UI-01。Commit: isolated detail component。

### DETAIL-02 詳細ページを新構成へ接続

Files: `src/app/robots/[slug]/page.tsx`, `components/RobotStickyAside.tsx`, `components/RobotSpecExplorer.tsx`, `components/RobotCardRail.tsx`, `lib/data.ts`, `lib/robotCatalog.ts`, `lib/uiText.ts`

Problem: 導入判断・自由記述適性・重複スペックが主で、想定用途・活用事例・関連ロボット・出典の責務が曖昧。

Change: §4.2の順へ再構成し、各セクションをresolverへ接続する。前後ナビは出典の下で本文外のページ送りフッターとして扱う。metadata、JSON-LD、previousSlug redirect、archived/successorを維持する。

Completion:

- 想定用途0件、活用事例0件、関連0件はsectionなし。
- 活用事例はSource titleリンク最大3、publisher/dateだけ。
- 関連は同メーカー最大8のRobotCardRail。
- SourceListが最後の情報セクションで、その下には前後ナビだけがある。
- 「導入判断」「実務ラベル」「不向きな現場」がUIにない。

Validation: validate、build、G1 + 用途なし + archived + relatedなしfixtureをdesktopで目視。360pxは致命的崩れがないことだけ確認。

Depends on: RAIL-01, CARD-01, MEDIA-01, DETAIL-01。Commit: page composition。

### REG-01 skeleton・docs・不要参照を同期

Files: `components/RobotDetailSkeleton.tsx`, `components/CardGridSkeleton.tsx`, `components/ManufacturerDetailSkeleton.tsx`, `components/ManufacturerCardGridSkeleton.tsx`, DS-01のdocs、必要なdead import/comment

Problem: skeletonと正本文書が旧レイアウトのままだと、loading時のlayout shiftと次回実装の逆戻りが起きる。

Change: 最終UIの比率・行数・カラムへ同期し、旧resolver/import/commentを除去する。

Completion: staleな6項目、4:3、7空slide、priceLabel、旧decision UI参照が対象ファイルから消える。

Validation: 下記の再検索、validate、build、diff check。

Depends on: 全実装task。Commit: regression alignment。

### DATA-R01 published robot全件再調査（別PR群）

Files: `data/robots.ts`, `data/useCases.ts`, 必要に応じて `data/deployments.ts`, `public/images/robots/*`

Problem: 現行値は不明・推測・古い情報を含み、新構造が空のまま。

Change: 1PRあたり1メーカーまたは5〜8機体で、公式用途、サイズ、公式価格、国内正規代理店価格、稼働時間、load rating、詳細仕様、画像、活用事例、field evidenceを再調査する。

Completion: 各値が公式または明示した信頼できる出典に接続し、`USE_CASE_GAP` をPR本文に列挙する。

Validation: validate、build、source link check。構造PRとは別にreviewする。

Depends on: REG-01の構造merge。Commit/PR: manufacturer batch。

## 9. 順序制約

```text
GIT-00
  └─ DS-01
      ├─ DATA-01 ─ DATA-02 ─ DATA-03
      │      │         ├─ UI-03
      │      │         └─ DETAIL-01
      │      └─ MEDIA-01
      ├─ UI-01 ─────────── DETAIL-01
      ├─ UI-02
      └─ RAIL-01

DATA-02 + UI-02 + MEDIA-01 ─ CARD-01
RAIL-01 + CARD-01 + MEDIA-01 + DETAIL-01 ─ DETAIL-02
DETAIL-02 ─ REG-01 ─ DATA-R01
```

同じファイルを触るtaskは順番どおり実行する。特に `data/types.ts`、`lib/robotDisplay.ts`、`lib/validate.ts`、`RobotCard.tsx` を並列実装しない。

## 10. 影響範囲とリスク

| Risk | 影響 | 軽減 |
|---|---|---|
| server view modelをclientへ渡す形の変更 | RobotsBrowser cache/hydration | serializableなplain objectだけを渡し、function/Mapをpropsに含めない |
| priceNote非参照化 | 調査前は問い合わせが増える | データ品質を捏造せず、全件調査を別PRで実施 |
| specSchema追加 | 比較・validatorへの波及 | optional keyだけ追加し、比較項目は明示選抜を維持 |
| fixed 480px panel | 低いviewport・長文overflow | desktop限定、右panelだけoverflow-y、mobileはstack |
| hover切替 | keyboard/touch不可 | button/tab semantic、focus/click、mobile fallback |
| shared rail変更 | Home/記事/解説の回帰 | extraction commitを先にbehavior-preservingで検証 |
| generic FactListの過剰化 | 長文UIまで均一化 | 使用箇所を§3.3に限定、DefinitionListを維持 |
| Robot.images強制 | legacy heroImageの消失 | 現在Robot heroImage登録0件を再確認し、validatorで逆戻り防止 |
| 外部タイトル表示 | 長いタイトル・権利 | 最大2行、リンク+publisher/dateのみ、本文・画像転載なし |
| 現行source-link失敗 | 構造PRが無関係なdata修正へ膨張 | 既存7失敗をbaseline化し、新規失敗0を完了条件にする |

## 11. 検証

既存scriptだけを使う。lint/test/e2e scriptは現時点で存在しないため、実行済みとは扱わない。

各task:

```bash
npm run validate:data
npm run build
git diff --check
```

外部リンク:

```bash
npm run check:source-links
```

2026-07-14 baselineは既存データ由来で7 URL failure。構造PRの完了条件は「0件」ではなく「baselineから新規failure 0件」。既存7件の修正はDATA-R01へ送る。

最終再検索:

```bash
rg -n 'priceLabel|getRobotCardSpecRows|getRobotDetailDecisionRows' data components lib src
rg -n 'aspect-\[4/3\]|7スロット|空スライド' docs public/images/robots data/types.ts components
rg -n 'text-right|justify-between' components/RobotStickyAside.tsx components/ManufacturerFactSheet.tsx components/ManufacturerCard.tsx components/CompareClient.tsx components/ComparisonRobotPanel.tsx
rg -n 'heroImage' data/robots.ts
```

`text-right` は比較の数値、フッター、ナビ等の正当な用途までゼロにしない。対象fact面に残る理由を確認する。

## 12. 手動確認

Viewport:

- 1280×900
- 1536×900
- 360×800（新mobile設計ではなく既存回帰だけ）

ページ:

- `/robots`
- `/robots/unitree-g1`
- 画像0件・1件・複数件のrobot detail
- 用途0件・複数件
- 活用事例0件・3件
- 同メーカー関連0件・8件超
- archived + successor
- `/manufacturers/unitree`
- manufacturer guide記事
- related robotを持つ通常記事
- `/compare`
- Home

操作:

- 詳細仕様: hover、click、Tab、Arrow、Home、End
- carousel: 1枚時操作なし、2枚時prev/next/dot、focus visible
- rail: trackpad、shift+wheel、keyboard focus、snap
- price問い合わせリンク
- favorite、compare DnD、filter、URL back/forwardが従来どおり
- dark/light、reduced motion
- console error、hydration warningなし

## 13. 実装しないこと

- mobile専用の新カード・詳細仕様UI
- DIYパーツ、交換ハンド、カスタムパーツ市場
- CMS・外部DB・API
- 画像許諾契約の新DB
- 活用事例のサムネイル・汎用外部記事カード
- AIによるUseCase自動新設
- 根拠のない職業適性・導入推奨
- データ全件調査を構造PRへ同梱
- remote stale branchの削除

## 14. 計画監査の反映

反映済み:

- 存在しないRobotCardRail前提を、新規抽出taskへ変更。
- task ID、Files、Problem、Change、Completion、Validation、依存、commit境界を追加。
- changed/unchanged fileを明記。
- Robot.imagesとheroImageの移行契約を明記。
- manufacturer guideのpriceLabel二重SSOTをtask化。
- related robotの除外、status、順序、上限を確定。
- official use case順とUSE_CASE_GAP報告形式を確定。
- 4:3/7空slotのstale docs修正をtask化。
- broadなFactList移行を実在する短いfact面だけへ縮小。
- mobileは新設計なし・致命的回帰確認だけと明記。
- 全件調査を別PR batchへ分離。
- source-link既存失敗をbaselineとして分離。

反映しない案:

- Storybook・テストframeworkの新規導入: 今回だけのための依存追加が大きく、既存実ページとbuildで確認する。
- 外部記事画像・YouTubeサムネイル: 権利・layout・取得運用を増やすため不採用。
- Robot側への用途タグ複製: UseCase SSOTと競合するため不採用。
- symbolとwordmarkの自動合成、ロボット画像契約DBの同時新設: 今回のロボットUI範囲を超えるため不採用。

## 15. 全体完了条件

- desktopカードが用途・サイズ・価格・稼働時間の4項目だけを表示する。
- カードと詳細が同じprice/use-case/spec/source SSOTから導出される。
- 詳細ページから導入判断・自由記述適性が消える。
- 詳細仕様の右領域が480px内で固定され、keyboardでも操作できる。
- 想定用途は公式根拠付きUseCaseだけ。
- 活用事例はSource参照最大3件で、画像・注釈なし。
- 関連ロボットは同メーカーpublishedから現機体を除外して最大8件。
- 出典が最終セクション。
- Robot.imagesが全消費面の画像SSOT。
- FactList、CardFactGrid、ComparisonSpecList、RobotCardRailの責務が一意。
- skeletonとdocsが最終UIに一致する。
- validate/build/diff checkが通り、source-linkに新規failureがない。
- prototypeとハードコードmockを本番依存へ入れない。
- mobileと全件再調査を未完のまま完了扱いしない。
