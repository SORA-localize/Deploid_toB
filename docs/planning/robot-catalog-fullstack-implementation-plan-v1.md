# Robot Catalog Full-stack Implementation Plan v1

Status: approved scope / implementation not started
Created: 2026-07-14
Branch: `feature/robot-catalog-fullstack-20260714`
Base: local `main` at `5d96160`

## 1. 目的

ロボット一覧カードとロボット詳細ページを、表示だけでなくデータ型、SSOT、resolver、validator、欠損状態、出典、関連取得まで一貫して再実装する。

同時に、プロジェクト内で分散しているラベル–値UIを、情報の役割ごとの共通部品へ整理する。

今回の本実装は、過去の `/robots/mock-1` をそのまま本番化する作業ではない。モックで確認した情報量と操作を参考にしつつ、local `main` から作った新branchで本番構造を設計・移行する。

## 2. Git基準点

2026-07-14時点のローカル状態:

| ref | 状態 | 扱い |
| --- | --- | --- |
| `main` | `5d96160`。remote mainより2commit先 | 今回の基準。権利確認済みメーカーロゴと記事関連メーカーへのロゴ表示を含む |
| `feature/robot-catalog-fullstack-20260714` | `main`と同じ`5d96160`から作成 | 本計画と本実装の作業branch |
| `archive/robot-detail-prototype-20260714` | `7dbbcbf` | G1ハードコードモック、UI試作、旧計画の参照用。mergeしない |
| `archive/local-media-preview-20260714` | `1080561` | 旧実験を無損失で保管。mergeしない |

削除済み:

- `.claude/worktrees/logo-assets`: cleanかつmainと同一だったためworktreeを削除。
- `feature/manufacturer-logos-20260713`: mainと同一だったためローカルbranchを削除。

remote mainは`59d3bcd`であり、local mainの2commitは未push。remote上の旧branch削除も今回の準備作業では行わない。

## 3. 確定している表示契約

### 3.1 ロボット一覧カード

表示順を次の4項目に固定する。

1. 用途
2. サイズ
3. 価格
4. 稼働時間

ルール:

- 「国内」「段階」「可搬」はカードから外す。
- 用途は、公式根拠付きで既存UseCaseへ接続できるものだけを使う。
- 複数用途は代表用途＋`ほかN件`。詳細では全件表示する。
- 価格は、メーカー公式公開価格、国内正規代理店公開価格、Deploid問い合わせの順。
- 推測価格、非正規販売店価格、出典不明価格は表示しない。
- 腕荷重はカードに表示しない。
- desktop画像比率は7:6。概要文は表示しない。
- mobileの新UIは今回実装しない。既存mobileを壊さないことだけを確認する。

### 3.2 ロボット詳細ページ

表示順:

1. 概要
2. 画像カルーセル＋基本スペック
3. 詳細仕様
4. 想定用途（公式用途がある場合のみ）
5. 活用事例（存在する場合のみ、最大3件）
6. 関連ロボット
7. 出典

撤去するもの:

- 根拠の弱い「導入判断」
- AI生成の「実務ラベル」
- 自由記述の「向く用途」「不向きな現場」
- カードと重複する巨大な空欄仕様表
- 活用事例のサムネイル、状態タグ、導入説明、補足文

### 3.3 画像

- `Robot.images`をSSOTとする。
- 表示可能画像0枚は単一placeholder。
- 1枚は静止表示。
- 2枚以上でカルーセル操作を表示。
- 未投入のImageRoleを空スライドとして表示しない。
- creditとsourceを画像上または直下へ表示する。

### 3.4 詳細仕様

desktopでは次の4グループを基本とする。

1. 本体・可動
2. 電源・稼働
3. 操作・開発
4. 環境・安全

UI基準:

- 高さ480px。
- 左ナビ13rem、4項目を等分。
- hover、focus、clickで切り替える。
- 右領域は固定し、1グループ3〜6行へ内容を精査する。
- 内部スクロールは長い公式値に対する安全弁としてのみ使う。

### 3.5 想定用途

- UseCaseをSSOTとし、`getUseCasesForRobot(robot.id)`で逆引きする。
- `basis: 'official-use-case'`かつ根拠URLを持つ関係だけを表示する。
- UIは`想定用途：研究開発 / 仕分け`のような1行。
- 各用途名を`/use-cases/[slug]`へリンクする。
- 説明文、独自タグ、長いreasonは表示しない。
- 該当がなければ行ごと表示しない。
- 公式用途が既存UseCaseにない場合は自動追加せず、`USE_CASE_GAP`として人間へ報告する。

### 3.6 活用事例

- 最大3件。
- 主語と機種名を原則省き、「何をしたか」をDeploidの言葉で短く記述する。
- タイトル自体を外部URLへリンクする。
- 表示する補助情報は媒体名と公開日だけ。
- 外部記事タイトル、リード、画像、YouTubeサムネイルを転載しない。
- 記事または動画の正規URLを使う。

### 3.7 関連ロボット・出典

- 関連ロボットは`manufacturerId`一致から導出する。新しい関連タグは作らない。
- Home・記事・メーカー解説でも使う`FeaturedRobotCard`＋共通railを利用する。
- 最終セクション名は「出典」。
- 重要な仕様・価格・保証・開発対応は、どのSourceが支えるか追跡可能にする。

## 4. ラベル–値UIの全体規格

統一とは、全ページを同じ見た目にすることではなく、情報の種類ごとに同じ部品を使うこととする。

### 4.1 `FactList`

短い基本情報・仕様向け。

- `compact`: 約300pxのサイドバー。ラベル列7rem。
- `standard`: 本文・メーカー基本情報。ラベル列8rem。
- ラベル・値とも左揃え。
- 行罫線、欠損表示、折返し、mobile縦積みを共通化。
- `dl/dt/dd`を使う。単なる2列データに`table`を使わない。
- ラベル末尾のコロンは付けない。

移行対象:

- `RobotStickyAside`の基本スペック。
- 新しいrobot detailの基本スペック。
- `ManufacturerFactSheet`。
- 詳細仕様の右パネル内。
- Aboutの短い運営者情報。

### 4.2 `CardFactGrid`

一覧カード内の少数項目向け。

- 2列×2行を基本とする。
- ラベル上、値下、両方左揃え。
- タイトル行数、値の最大行数、欠損表示を統一。

移行対象:

- `RobotCard`。
- `ManufacturerCard`。

prototype専用カードは本番へ持ち込まない。

### 4.3 `ComparisonSpecList`

比較画面専用。

- `CompareClient`と`ComparisonRobotPanel`の重複行UIを統合する。
- 数値は右揃え＋`tabular-nums`。
- 状態名・文章は左揃え。
- 行高、項目順、欠損表示を全機種で揃える。
- 値の種類を文字列から推測せず、表示view modelに`valueKind`等の意味を持たせる。

### 4.4 `DefinitionList`に残すもの

- About、for-manufacturers、privacyの長文説明。
- UseCaseの「向く場所 / 向かない場所 / 成立条件」。
- その他、ラベルに対して複数文の説明を読む用途。

### 4.5 独自UIのまま維持するもの

- メーカー解説の導入実績: 分類＋説明。
- 調達チャネル: 会社・窓口＋役割。
- ラインナップ: 真の多列table。
- SourceList、FAQ、関連記事、ナビゲーション、件数表示。

## 5. データ構造

### 5.1 価格

`priceNote`の自由文だけに表示判断を依存しない。

最小構造は次を保持できるものにする。

- 価格値または表示文字列。
- 通貨。
- 税込・税別・不明。
- 対象構成またはvariant。
- `manufacturer-official` / `authorized-distributor`の根拠種別。
- 代理店の場合の名称。
- Source URL。

公開価格がなければ構造化価格を捏造せず、UI resolverがDeploid問い合わせを返す。

### 5.2 腕荷重・可搬

既存`payloadKg`を、そのまま片腕荷重へ変換しない。

必要な意味:

- 対象: 片腕 / 両腕 / 全身 / 搬送台等。
- 種別: 最大 / 定格 / 公式表現不明。
- kg値。
- 姿勢・リーチ等の条件。
- 対象variant。
- Source URL。

意味を再確認できない既存値はmigrationせず空にする。

### 5.3 field evidence

レコード全体の`sources[]`を再利用し、重要フィールドからSource URLを参照する任意mapを追加する。

対象:

- カード4項目の根拠となるサイズ、価格、稼働時間。
- 基本・詳細仕様で表示する値。
- 保証。
- 開発・SDK対応。
- 腕荷重。

validatorで次を確認する。

- evidence URLが同じRobotの`sources[]`に存在する。
- 公開価格のsource kindと価格優先順が矛盾しない。
- 意味付き荷重に対象・種別・sourceがある。

### 5.4 活用事例

Robotに最大3件の最小参照を持たせる。

- Deploid要約タイトル。
- Source URL。

publisherとpublishedAtは同じURLの`Source`から解決し、重複入力しない。validatorでSource登録を必須にする。

### 5.5 用途

Robot側に用途配列を複製しない。UseCaseの`candidateRobots`を正本として維持する。

カード用代表用途と`ほかN件`はresolverで導出する。

## 6. resolverと表示view model

ページやカードからデータ構造を直接組み立てない。

追加・整理する責務:

- card用4項目を返すresolver。
- 価格優先順を解決するresolver。
- 公式用途だけを返すresolver。
- 基本スペックを選抜するresolver。
- 4グループの詳細仕様を返すresolver。
- 同一メーカーの関連ロボットを返すresolver。
- 活用事例とSource metadataを結合するresolver。

UIはresolverのview modelを描画するだけにする。

## 7. 実行フェーズ

### Phase 0: 基準点と計画

- branch/worktreeを整理する。
- local mainの採用済み変更を基準に新branchを作る。
- 本計画をcommitする。
- この段階では本番コードを変更しない。

完了条件:

- 新branchがmainと同じcommitから始まる。
- prototypeと旧実験がarchive branchに残る。
- worktreeが1つでclean。

### Phase 1: UI正本と共通部品

- `FactList`、`CardFactGrid`、`ComparisonSpecList`の契約を確定する。
- design systemとUI architectureへ責務を記録する。
- 先にStorybook等を導入せず、実ページの最小fixtureで確認する。

### Phase 2: Robotデータ契約

- 価格、意味付き荷重、field evidence、活用事例の型を追加する。
- resolverとvalidatorを先に実装する。
- 既存データの安全なmigration規則を作る。
- 意味が曖昧な値を自動変換しない。

### Phase 3: ロボット一覧カード

- `getRobotCardSpecRows()`の旧6項目を廃止する。
- 4項目view modelへ変更する。
- desktop画像7:6、CardFactGrid 2×2へ変更する。
- 価格問い合わせ、複数用途、欠損、長い機種名を確認する。

### Phase 4: ロボット詳細ページ

- 旧導入判断・自由記述適性UIを撤去する。
- 画像、基本スペック、詳細仕様、想定用途、活用事例、関連、出典を新resolverへ接続する。
- 詳細仕様ナビを本番共通部品として実装する。
- URL、metadata、JSON-LD、archived/successor挙動を維持する。

### Phase 5: ラベル–値UIの全体移行

- RobotStickyAsideを新detailへ統合または撤去する。
- ManufacturerFactSheetをFactListへ移行する。
- ManufacturerCardをCardFactGridへ移行する。
- CompareClientとComparisonRobotPanelをComparisonSpecListへ統合する。
- Aboutの短い事実一覧だけをFactListへ移行する。
- 長文DefinitionListと記事本文リストは変更しない。

### Phase 6: skeleton・状態・回帰

- RobotDetailSkeleton。
- ManufacturerDetailSkeleton。
- ManufacturerCardGridSkeleton。
- CardGridSkeleton。
- 必要なUseCaseDetailSkeleton。

確認状態:

- 画像0 / 1 / 複数。
- 値なし。
- 価格なし。
- 用途なし / 複数。
- 活用事例なし。
- 関連ロボットなし。
- archived / successor。
- hover / focus / keyboard / reduced motion。

### Phase 7: 全ロボット再調査

構造とUIの完成後に、published robot全件を公式情報から再調査する。

- 用途、サイズ、公式価格、国内正規代理店価格、稼働時間。
- 腕荷重の意味と条件。
- 仕様、保証、SDK、画像。
- 活用事例。
- Source、checkedAt、field evidence。
- `USE_CASE_GAP`。

既存の`robot-data-factcheck-impl-plan-2026-07-01.md`は候補修正の参考にするが、古いデータ型へ先に大量投入しない。

## 8. 検証

各実装単位で実行する。

- `npm run validate:data`
- `npm run build`
- `npm run check:source-links`
- `git diff --check`

画面確認:

- 1280×900。
- 1536×900。
- 既存mobileの360px。
- 長い日本語・英語機種名。
- 画像・値・用途・活用事例の各欠損状態。
- keyboardのみで仕様切替とリンク操作が可能。

## 9. コミット境界

推奨順:

1. `docs: plan robot catalog full-stack rebuild`
2. `refactor(ui): add shared fact display primitives`
3. `refactor(data): add robot catalog evidence contracts`
4. `refactor(robots): rebuild catalog card view model`
5. `refactor(robots): rebuild robot detail page`
6. `refactor(ui): migrate fact and comparison surfaces`
7. `test: align skeletons and catalog regression states`
8. データ再調査はメーカーまたは小さいrobot batch単位。

型、UI、全件データを1commitへまとめない。

## 10. 今回実装しないこと

- mobile専用の新カード・詳細仕様UI。
- DIYパーツ、交換ハンド、カスタムパーツ市場機能。
- CMS移行。
- 活用事例用の汎用外部記事カード。
- 外部記事画像・YouTubeサムネイル転載。
- AIによる用途の自動新設。
- 根拠のない職業適性・導入推奨。
- remote branch削除やmainへのpush。

## 11. 全体完了条件

- ロボットカードが用途・サイズ・価格・稼働時間の4項目だけを表示する。
- カード値がRobot / UseCase / pricing / SourceのSSOTから導出される。
- 詳細ページから旧導入判断・自由記述適性が消える。
- 基本・詳細仕様の意味と出典を追跡できる。
- 想定用途は公式根拠付きUseCaseだけを表示する。
- 活用事例は最大3件の簡潔な外部リンクになる。
- 関連ロボットはmanufacturerIdから導出される。
- FactList、CardFactGrid、ComparisonSpecListの責務が一意になる。
- 対応するskeletonと欠損状態が同期する。
- build、data validation、source link checkが通る。
- prototype routeとハードコードmockを本番依存に残さない。
- mobileとDIYを未実装のまま対応済みと扱わない。
