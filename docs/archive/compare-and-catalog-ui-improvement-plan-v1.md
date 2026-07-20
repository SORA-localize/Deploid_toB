# 比較タブ再構成・カタログ表示改善 実装計画 v1

作成日: 2026-07-10
対象ブランチ: `experiment/local-media-preview`（worktree: `/private/tmp/deploid-local-media-preview`）
ステータス: 計画（未実装）

計画レビューは `ai/rules/10-workflow.md` §1.5（計画の監査フェーズ）のプロンプトで実施する。実装レビューは `docs/planning/ai_fullstack_development_guardrails_v1.md` の Phase 0〜6 自己監査ループと §4 チェックリスト、および `ai/rules/10-workflow.md` §3・§3.5 に従う。UI実装時は `ai/rules/30-ui-design.md` と `docs/planning/design_system_v1.md` を併読する。

## 1. 背景と目的

動画ベースのUI/UXレビューをコードと突き合わせた実情調査、およびその後の設計相談の結果、次の3点を実装対象として合意した。

第一に、比較タブの構造的な欠陥。現在の比較シート（`components/CompareClient.tsx`）は縦長カード（`components/ComparisonRobotPanel.tsx`、aspect 5:7）を3カラムで並べるだけで、スペックは1機ずつ右スライドドロワーで開くしかない。「AとBの可搬重量はどちらが上か」という比較ページの基本的な問いに横並びで答えられない。これをカード＝列ヘッダーの比較表に再構成し、あわせて選択状態が既にURLに載っていることを活かした共有リンクボタンを付ける。

第二に、欠損スペックの見せ方。カードや比較行の欠損値が「要確認」（`lib/labels.ts` の `TBD_LABEL`）で繰り返し表示され、サイト側の作業残しに見える。閲覧者向けの値表示を控えめな「—」に変える。

第三に、ロボット一覧のフィルター。最頻の絞り込み軸（業種）がドロップダウンに隠れており、選択肢の件数も見えない。用途一覧で実績のあるタブ切り替えUIをロボット一覧にも導入し、ドロップダウン選択肢に件数を出し、選択肢が少ないのに検索窓が出る問題（地域2件で検索窓）を閾値で解消する。

サイト全体のリデザインは行わない。検討フェーズの階段（ロボット＝探索 → 比較＝絞り込み → メーカー＝信頼確認 → 問い合わせ）という情報設計自体は維持し、踏み抜ける段だけを直す。

## 2. 調査済みの事実（計画の前提）

計画は以下のコード調査に基づく。実装前に再確認が必要な箇所は各タスクに記す。

- 比較ページの選択状態はURLが正本。`lib/compareParams.ts` の `normalizeCompareRobotIds` がパースし、`MAX_COMPARE_ROBOTS = 20`。並べ替え順は `CompareClient.tsx` のローカルstateが真実源で、`useUrlParamUpdater` 経由でURLへ副作用同期する（同ファイル冒頭のコメント参照）。
- 比較用スペック行データは `lib/robotDisplay.ts` の `getComparisonCoreRows` / `getComparisonDetailRows` が label/value ペアで返す。データ層の変更なしで表へ転置できる。
- D&D は dnd-kit（`SortableContext` + `rectSortingStrategy`）。列並べ替えには `horizontalListSortingStrategy` へ切り替えるだけで流用可能。D&D は pointer:fine デバイス限定（`ComparisonRobotPanel.tsx` 内で判定）。
- `TBD_LABEL = '要確認'`（`lib/labels.ts:29`）の使用箇所は `lib/robotDisplay.ts`（数値・文字列欠損のフォールバック多数）、`lib/manufacturerDisplay.ts`、`components/ManufacturerFactSheet.tsx`、`components/ComparisonRobotPanel.tsx`（空リスト表示）、`lib/labels.ts:110,123`（`japanAvailability` / `deploymentStage` の enum `unknown` のラベル）の5系統。
- `components/PageTabBar.tsx` は汎用タブ部品として `count`（件数表示）・`disabled`・ツールチップに既に対応している。記事一覧の棚タブで使用中。
- `components/SelectControl.tsx` の `SelectControlOption` は `count?: number` を既にサポートし「ラベル (件数)」表示になる。件数が出ていないのは呼び出し側が渡していないだけ。
- `searchable` 指定は無条件に検索窓付きドロップダウンを出す。使用箇所は `RobotsBrowser.tsx:197`、`ManufacturersBrowser.tsx:101,112`、`CompareClient.tsx:590`（モバイル用メーカー選択）の4箇所。
- ロボット一覧のフィルタ軸は業種・タスク・メーカー・国内入手性の4ドロップダウン（`RobotsBrowser.tsx:175-205`）。選択肢は同ファイルの `useMemo` で生成。フィルタロジックの正本は `lib/robotFilters.ts`。業種タグは `lib/tagRegistry.ts` に8種（＋「すべて」でタブ9個）。
- 選択肢の実数（検索窓閾値の根拠）: 地域（国）は9カ国＋「すべて」で10、メーカーは26社＋「すべて」で27。
- `ComparisonRobotPanel` の import 元は `CompareClient.tsx` のみ（`FeaturedRobotCard.tsx` の言及はコメント内の類似説明で、依存なし）。比較ページ専用として改修してよい。
- `CompareClient.tsx` の `DragOverlay` は sheet 内並べ替え時に `ComparisonRobotPanel` を実物大で描画している。カード形状を変えるとここも追従が必要。
- `uiText.comparison.tabBasic` / `tabDetailed` は現在未使用（dead text）。実際に使われている行グループ見出しは `coreVariables`（基本スペック）と `detailedData`（詳細データ）。
- 検証コマンドは `npm run validate:data`、`npm run build`（validate 込み）、`npm run check:source-links` のみ。typecheck 単体スクリプトは無い（build が兼ねる）。

## 3. タスク

1 タスク = 1 コミットとする。挙動変更と見た目変更を同一コミットに混ぜない。

### T1: 欠損値表示を「要確認」から「—」へ（閲覧者向け値表示のみ）

Files: `lib/labels.ts`, `lib/robotDisplay.ts`, `lib/manufacturerDisplay.ts`, 表示側で muted スタイルを当てるカード/パネル（`components/RobotCard.tsx`, `components/ComparisonRobotPanel.tsx`, `components/ManufacturerFactSheet.tsx`）

問題: 値の欠損（サイズ・可搬・稼働時間・設立年など）が「要確認」という編集者向けTODOに読める文言で並び、繰り返されると未完成に見える。

変更方針: `lib/labels.ts` に閲覧者向け欠損表示の正本として `EMPTY_VALUE_LABEL = '—'` を追加し、値のフォールバック系（`robotDisplay.ts` の `formatNumber` / `formatRuntime` ほか、`manufacturerDisplay.ts`、`ManufacturerFactSheet` の設立年）を差し替える。ここで仕分けが1つ必要になる。`labels.ts:110,123` の enum `unknown` ラベル（国内入手性・導入段階の「要確認」）は「不明なので確認が要る」という意味のあるステータス表示であり、無味な「—」に変えると情報が減る。推奨は Option B: enum `unknown` は「要確認」のまま残し、値欠損のみ「—」化する。Option A（`TBD_LABEL` の値自体を一括変更）は最小差分だが enum の意味を潰すため採らない。採用判断は計画レビュー時に確定する。

muted スタイルは、`DisplayRow` 型（`lib/robotDisplay.ts`）に optional な `muted?: boolean` を持たせて表示側でクラスを切り替えるか、表示側で `value === EMPTY_VALUE_LABEL` の文字列比較にするかの二択。前者が型安全だが行生成関数すべての変更が要る。値が「—」1文字であればスタイル無しでも十分薄く見える可能性があるため、まず文言差し替えのみで画面確認し、必要な場合だけ `muted` フラグを追加する二段構えとする。

完了条件: ロボット一覧カード・比較パネル・メーカー基本情報で欠損値が「—」表示になり、enum の「要確認」は従来どおり。`npm run build` が通る。

### T2a: ロボット一覧に業種タブを導入

Files: `components/RobotsBrowser.tsx`（業種 SelectControl をタブに置き換え）、必要なら `lib/robotFilters.ts`

問題: 最頻の絞り込み軸である業種がドロップダウンに隠れ、切り替えのテンポが悪い。

変更方針: 既存の汎用 `PageTabBar` を再利用し、フィルタ行の上に業種タブ（「すべて」＋8業種の計9タブ、モバイルは `PageTabBar` 既存の横スクロールで対応）を置く。業種の URL パラメータと state は現行のものをそのまま使い、入力UIだけをドロップダウンからタブに替える（正本の重複を作らない）。業種ドロップダウンは撤去し、タスク・メーカー・国内入手性の3ドロップダウンを残す。`UseCasesBrowser` に独自実装のタブがあるが、あちらはタスク件数バッジ等の固有要素があるため今回は統合しない（実装しないことに記載）。

完了条件: 業種タブで1クリック絞り込みができ、URL・戻る/進む・直接アクセスで状態が復元される。タブはキーボード操作可能（`PageTabBar` の既存挙動を確認）。モバイル幅では横スクロールで破綻しない。

### T2b: フィルタ選択肢に件数を表示

Files: `components/RobotsBrowser.tsx`（選択肢生成の useMemo）、必要なら `lib/robotFilters.ts`（件数計算 helper）、`components/ManufacturersBrowser.tsx`（同様に適用する場合）

問題: 選択肢を選ぶまで該当件数が分からず、0件デッドエンドを踏み得る。

変更方針: `SelectControlOption.count` は実装済みなので、選択肢生成時に件数を計算して渡すだけ。件数の定義は「キーワード検索を含む、他の軸の現在の絞り込みを適用した上での該当数」（ファセット標準）とし、計算は `lib/robotFilters.ts` に helper を置いて UI から分離する。0件の選択肢は `disabled`（既存サポートあり）にする。ただし現在選択中の選択肢は0件でも disabled にしない（解除操作が塞がるトラップを避ける）。T2a の業種タブにも同じ helper で件数を渡す（`PageTab.count` は実装済み）。まずロボット一覧に入れ、同じ helper 構造でメーカー一覧にも展開できる形にする（展開自体は本タスクに含めてよいが、複雑になるなら別コミットに割る）。

完了条件: 各ドロップダウンに「ラベル (件数)」が表示され、0件選択肢が選択不可になる。件数が他の軸の選択に追従する。

### T2c: SelectControl の検索窓に閾値を導入

Files: `components/SelectControl.tsx` のみ

問題: `searchable` が無条件で検索窓を出すため、地域2件のような場面でも検索UIが出て過剰（動画レビュー指摘・事実確認済み）。

変更方針: 共通部品内に閾値定数（`SEARCHABLE_MIN_OPTIONS = 12`、正本はこのファイル）を置き、`searchable` かつ選択肢数が閾値未満の場合は通常の Select にフォールバックする。閾値12の根拠は §2 の実数検算: 地域は10選択肢（検索窓を消したい側）、メーカーは27選択肢（残したい側）で、8だと地域に検索窓が残り今回の指摘を解消できない。呼び出し側4箇所（RobotsBrowser・ManufacturersBrowser×2・CompareClient モバイル）の props は変更しない。共通部品の変更なので、4箇所すべての画面で退行がないことを手動確認する。

完了条件: 選択肢が少ないドロップダウン（地域など）から検索窓が消え、多いもの（メーカーなど）では残る。4使用箇所すべてで選択操作が正常。

### T3a: 比較シートをカード＝列ヘッダーの比較表に再構成（本命）

Files: `components/CompareClient.tsx`（シート部のレイアウト）、`components/ComparisonRobotPanel.tsx`（列ヘッダーカードへの改修、またはヘッダーカードの新規切り出し）、`components/SortableCompareCard.tsx`、必要に応じ `components/compare/CompareParts.tsx`

問題: 横並びのスペック表が存在せず、比較ページで比較ができない。ドロワーは1機分しか表示できず、開くと他のカードが隠れる。

変更方針: シート領域を「上段: コンパクトなカードヘッダー（画像・機体名・★・✕・ドラッグハンドル）を列として横に並べ、スクロール時は上部にスティッキー固定」「下段: `getComparisonCoreRows` / `getComparisonDetailRows` を転置したスペック行グリッド（1行=1項目、列=機体、行ラベルは先頭列）」の構成に変える。行データ関数は再利用しデータ層は触らない。列の並べ替えは既存 dnd-kit を `horizontalListSortingStrategy` に切り替えて維持し、「並べ替えの気持ちよさ」を殺さない。既存の右スライドドロワーは「詳細」ボタンとして残し、挙動を消さない（Behavior Preservation）。基本/詳細の行グループ見出しは実際に使用中の `uiText.comparison.coreVariables` / `detailedData` を再利用する（`tabBasic` / `tabDetailed` は未使用の dead text であり参照しない）。`DragOverlay`（sheet 内並べ替え時に実物大カードを描画）も新しい列ヘッダーカードに追従させる。

レイアウト上の前提と壊れやすい点: `MAX_COMPARE_ROBOTS = 20` なので20列があり得る。表全体を `overflow-x: auto` のコンテナに入れ、行ラベル列を左スティッキー、カードヘッダー行を上スティッキーにする（sticky の入れ子と z-index は `--z-*` トークンに従う。`ai/rules/30-ui-design.md` 参照）。列幅は min-width を持たせ、モバイルは横スクロール前提。D&D 不可環境（タッチ）では従来同様並べ替えなしで閲覧のみ。空状態（0台）・1台のみ・欠損値（T1の「—」）の表示を明示的に扱う。★・✕・ドラッグの各操作は既存の stopPropagation 構造を踏襲する。

順序制約: T1 を先に入れる（本タスクの表示確認で欠損値表示が最終形になるため。両タスクとも `robotDisplay.ts` 周辺に触る可能性があり、コンフリクトを避ける）。

完了条件: 3台選択時にスペックが横並びで見比べられ、ドラッグで列が入れ替わり、URLの順序も追従する。キーボードでの並べ替え（既存 `sortableKeyboardCoordinates`）が機能する。モバイル幅・PC幅で表が破綻しない。ドロワーも従来どおり開ける。

### T3b: 比較の共有リンクボタン

Files: `components/CompareClient.tsx`（シートヘッダーへのボタン追加）、必要なら小さなフィードバック表示部品（新規・自前、ライブラリ追加なし）

問題: 比較状態はURLで完全に再現できるのに、共有の入口がない。B2Bの実利用（稟議・社内共有）に直結する機能が眠っている。

変更方針: シートヘッダー（件数表示の並び）に「この比較を共有」ボタンを置き、`navigator.clipboard.writeText(location.href)` でコピー、成功時に「リンクをコピーしました」の短いインラインフィードバック（またはボタン自身のラベル変化）を出す。clipboard API が使えない環境ではボタンを出さないか、失敗メッセージを出す。文言は `lib/uiText.ts` に追加する（直書き禁止）。選択0台のときはボタンを無効化する。

完了条件: ボタンでURLがコピーされ、そのURLを別タブで開くと同じ選択・順序が再現される。フィードバックがスクリーンリーダーに伝わる（`role="status"` 等）。

### T3c（任意・T3b完了後に判断）: お気に入り追加時のフィードバック

T3b のフィードバック部品が汎用化できる場合のみ、★トグル時にも同じ部品で通知を出す。無理に共通化せず、T3b の実装を見てから着手可否を決める。

### T0（運用・コード変更なし）: `.env.local` に `NEXT_PUBLIC_FORMSPREE_FORM_ID` を設定

ローカルで問い合わせフォームに「現在準備中です」バナーが出るのは env 未設定が原因（`components/ContactForm.tsx:36`、`lib/env.ts`）。値の用意はユーザー作業。secrets なので計画・コードには値を書かない。

## 4. 実装順序と依存関係

推奨順: T1 → T2c → T2a → T2b → T3a → T3b（→ T3c）。小さい確実な変更から入り、本命の T3a に進む。厳密な依存は「T1 が T3a より先」（同一表示系ファイルへの変更衝突と、表の欠損値表示を最終形で確認するため)と「T3b は T3a の後」（設置場所がT3aで確定する）の2つのみで、T2 系は独立しており順序を入れ替えてもよい。T2a と T2b は同じ `RobotsBrowser.tsx` を触るため連続して行うこと。

## 5. 実装しないこと

- サイト全体・トンマナのリデザイン、ページ構成（3タブ＋用途）の変更
- 左サイドバー型ファセット検索（現在のデータ規模に対して過剰と判断済み)
- `RobotCard` のカード構造・スロット構成の変更（T1 の文言・スタイル差し替えのみ）
- 記事「ロボット解説」タブの空一覧対応（ユーザー指示で今回スコープ外）
- メーカー解説記事内のメーカー個別問い合わせCTA（別途検討）
- `UseCasesBrowser` の独自タブ実装と `PageTabBar` の統合リファクタ（挙動変更と混ぜない。必要なら別計画）
- トースト等の外部UIライブラリ追加（sonner 等は入れない）
- データモデル・`data/*.ts`・validate の変更

## 6. リスクと軽減策

最大のリスクは T3a のレイアウト複雑性で、sticky の入れ子（上=カードヘッダー、左=行ラベル）と横スクロール、dnd-kit の座標系が干渉し得る。軽減策として、まず D&D なしの静的な表レイアウトを組んで各幅で確認し、その後に並べ替えを載せる二段実装とする。次点は T2c の共通部品変更で、4使用箇所の退行を手動確認リストに含める。T1 は「要確認」の意味の仕分けを誤ると情報が減るため、enum ラベルを温存する Option B を既定とし、監査で再確認する。`ComparisonRobotPanel` が比較ページ専用であることは grep で確認済み（§2）。もう1点、ロボット一覧は非絞り込み時に「販売中・限定販売」「開発中・プロトタイプ」の2セクション表示に分かれ、絞り込み時は横断表示に切り替わる既存挙動があるため、T2a のタブ絞り込みでもこの切り替えが期待どおり動くことを手動確認に含める。

## 7. 検証

各タスク完了時に `npm run build`（validate:data 込み・型チェック兼務)を実行する。データは触らないが、build が正本の検証手段のため省略しない。存在しないコマンド（test / lint 等）は実行しない。

手動確認チェックリスト（該当タスクのみ):

- 比較: 0台・1台・3台・20台での表表示、ドラッグ/キーボード並べ替え、URL同期、戻る/進む、共有URLの別タブ再現、ドロワー開閉、モバイル幅の横スクロール
- ロボット一覧: 業種タブの切り替えとURL復元、件数表示の追従、0件選択肢の無効化（選択中の選択肢は無効化されないこと）、絞り込み時の販売中/開発中セクション横断表示への切り替え、モバイル幅のタブ横スクロール
- ドロップダウン4使用箇所（ロボット・メーカー×2・比較モバイル）の選択操作と検索窓の出現条件
- 欠損値: 「—」表示になった箇所と「要確認」が残るべき箇所（国内入手性・導入段階の unknown）の目視確認
- コンソールエラー・hydration warning がないこと

画面確認はdevサーバー＋スクリーンショットで行い、確認後にheadless Chromeを必ず終了する。

## 8. 全体完了条件

T1・T2a〜c・T3a・T3b がそれぞれ独立コミットとして worktree ブランチに入り、`npm run build` が通り、§7 の手動確認が全項目済みであること。本ブランチは実験用のため push しない運用を維持する。

## 8.5. 改訂: ロボット一覧のタブ統合（2026-07-10 実装後レビューでの合意）

T2a/T2b の画面確認後、「販売中/開発中タブ（sticky header）と業種タブ（リスト直上）の2段構成はタブの意味が競合する」「業種絞り込み時に販売中:0件と表示される」というフィードバックを受け、以下に改訂する。

方針: 販売中/開発中はタブ（相互排他ビュー）としては廃止し、情報としてはリストの常時2セクション表示（販売中・限定販売 / 開発中・プロトタイプ、0件セクションは非表示）と各カードの「段階」行で残す。sticky header には業種タブ＋件数をミラー表示する（リスト直上の業種タブは常設のまま。sticky bar はスクロール後にしか出現しないため、移設ではなくミラーが正しい）。業種はタブとsticky 両方でアクティブ表示されるため、アクティブフィルタチップからは業種を外す。あわせてタスクのドロップダウンを廃止する（タスク起点探索は用途から探すページの役割。タスクタグ自体は用途ページ・検索で使用中のため残す）。

変更ファイル: `lib/robotFilters.ts`（normalize/filter/facet から task・release 軸を除去、`filtered` 返却値を廃止し2セクション返却に）、`src/app/robots/page.tsx`（パラメータpick・normalize呼び出し・cacheキー props・meta description からタスク除去）、`components/RobotsHeader.tsx`（販売中/開発中タブ→業種 PageTabBar ミラー）、`components/RobotsBrowser.tsx`（タスクselect・release切替・業種チップ除去、常時2セクション）、`lib/uiText.ts`（activeModels / preReleaseModels / crossReleaseCountsAria / filteredAcrossRelease の dead text 削除、robots.description からタスク除去）、`lib/catalogLayoutClasses.ts`（フィルタ2軸のグリッドへ）。

確認済みの前提: filterRobots / RobotsHeader の利用元は RobotsBrowser のみ。getRobotFilterOptions は RobotsBrowser + robots/page.tsx のみ。`uiText.common.allTasks` と `uiText.filters.task` は用途一覧（facetConfig / useCaseFilters）で使用中のため残す。/robots への task= / industry= 付き内部リンクは存在しない。旧URLの ?release= / ?task= は pickSearchParams の対象から外れるため単に無視される（破壊なし）。

## 8.6. 改訂: 比較シートをラベル内蔵カードの折り返しグリッドへ（2026-07-11 合意）

共有ラベル固定列方式（§8.5時点の表）に対して「縦幅を使えていない」「左上コーナーの空白が視線移動的に悪い」「横スクロール時に固定列境界のボーダー残像が見える」という指摘を受け、共有ラベル列を全廃する。各カードが画像ヘッダー＋自分のラベル+値のスペック一覧を内蔵し、`rectSortingStrategy` の折り返しグリッド（元実装と同じ）で並ぶ。行構成・順序は robotDisplay の関数が全ロボット同一のため、min-h を揃えることで隣接カードとの行整列＝横スキャン比較が成立する。横スクロール・sticky左列・角セルは不要になり、指摘の3問題は構造ごと消える。フリップ/個別アコーディオンは「画像とスペックの同時視認が壊れる」「N回クリックが要る」「行整列が崩れる」ため不採用（スペック常時表示）。

あわせてメーカーメニューはアコーディオンを廃止し、常時展開ツリー（メーカー名=スクロール内sticky見出し、機体行は常時表示）にする。ホバー展開のフライアウトは、メニューがD&Dのドラッグ元であることと（パネル消失との競合）、タッチにホバーが無いことから不採用。

## 8.7. 改訂: 比較のD&D縮小・一括表示トグル・メニュー検索（2026-07-11 合意）

§8.6実装後のレビューで「スペック常時表示はUIが悪い」「ツリーメニューが使いにくい（開閉クリックをスクロール距離に置き換えただけ）」「カラム間移動にD&Dの必然性がない」という指摘を受け、以下に改訂した。

(1) D&Dはシート内並べ替え専用に縮小。カラム間（メニュー→シート、お気に入り⇄シート、シート→メニュー削除）のドラッグ・ドロップ受け皿・挿入プレビューは全廃し、クリック操作＋ホバー/フォーカスで現れる「追加」ラベルに置換（タッチでは常時表示）。`lib/compare/dnd.ts` は不要になり削除。
(2) 表示モードはシート全体の一括トグル（ビジュアル=大きな画像カード ⇄ スペック=小ヘッダー+スペック行）。カード個別のフリップ/開閉は行ズレと識別性喪失のため不採用。モードは view URLパラメータに載せ共有リンクで再現される。
(3) メニュー最上部に機体名・メーカー名のローカル検索を追加（約90行のツリーの最短ナビゲーション。URLには載せない）。

なおメーカーロゴがこのブランチで表示されないのは退行ではない: main系のデータは logo.src が空（権利未確認のため）で、実験ブランチのみがローカル無許諾画像を注入していた。正式表示は権利確認済みアセットの投入が前提（別トラック）。

## 8.8. 改訂: カスケードメニューと運用方針（2026-07-11 合意）

メニューはツリー（§8.7）から**カスケード**へ: メーカー行の hover/クリック/フォーカスで行の右に機体リストのフライアウトパネルを出す。§8.6でホバー展開を不採用とした根拠は「メニューがD&Dのドラッグ元」だったが、§8.7でカラム間D&Dを廃止したため前提が消えた。パネルは position:fixed（メニューの overflow-y に切られないため）、メニュースクロールで閉じる、Escape/mouseleave で閉じる。メーカー行には選択中インジケータ（左ボーダー）と件数を表示。表示トグルは下線タブ式に変更。

運用方針の確定: **実験はプロトタイプ画像のあるこの worktree（experiment ブランチ、never-push）で行い、良くなった実装を main へ移植する**。feature/catalog-compare-ui ブランチは削除済み（内容は本ブランチへ cherry-pick 済み）。権利未確認のためメイン系ではメーカーロゴ・多くの機体画像が出ない＝見た目の設計判断はこの worktree でしか行えない、が理由。

