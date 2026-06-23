# Layout And Data Structure Audit Plan v1

Status: active/unimplemented investigation plan
Last updated: 2026-06-23

この文書は、Deploid 全体のテキスト表示レイアウトと、ページ上の文字情報が適切なデータ構造から供給されているかを調査するための実行計画です。

この計画は実装判断の正本ではありません。調査完了後は、結果を修正計画・実装・正本文書へ反映し、この文書は archive へ移動します。

## 背景

一部の静的ページで、画面幅に対して本文の表示領域が不自然に狭く、早い位置で折り返されている。特に会社概要、プライバシーポリシー、問い合わせ、メーカー・代理店向けページでは、ページごとの個別 grid や `max-width` 指定が混在している可能性がある。

また、全ページの文字情報について、事実データ、UI文言、静的本文、法務・ポリシー文言、権利関連情報が適切な場所に置かれているかを確認する必要がある。

## 参照する正本

調査時は、以下を現在の判断基準として使う。

- `docs/planning/README.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/data/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`
- `docs/planning/editorial_style_guide_v1.md`
- `docs/planning/humanoid_media_IA_v1.md`

実装の正本は、常に現行コードと型定義を優先する。

- `src/app/globals.css`
- `data/types.ts`
- `lib/data.ts`
- `lib/uiText.ts`
- `lib/tagRegistry.ts`
- `lib/labels.ts`
- `lib/display.ts`
- `lib/validate.ts`

## 調査対象

### ページ

全 route の `page.tsx` と、ページから直接使われる表示コンポーネントを対象にする。

- `/`
- `/robots`
- `/robots/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/reports`
- `/reports/[slug]`
- `/guides`
- `/guides/[slug]`
- `/use-cases`
- `/use-cases/[slug]`
- `/compare`
- `/about`
- `/privacy`
- `/contact`
- `/for-manufacturers`
- error / not-found

### 文字情報の分類

ページ上の文字情報は、以下に分類して調査する。

- `record_fact`: ロボット、メーカー、記事、ガイド、用途、導入事例などの事実情報
- `ui_text`: ナビ、ボタン、フィルター、タブ、空状態、補助ラベル
- `static_page_content`: 会社概要、問い合わせ案内、メーカー向け説明などの固定本文
- `legal_policy`: プライバシーポリシー、免責、問い合わせ先、運営者情報
- `derived_value`: 掲載件数、最終更新日、カテゴリ数など算出できる値
- `rights_sensitive`: ロゴ、画像、引用、外部動画、掲載許諾、クレジットに関係する文言

## 調査観点

### A. レイアウト構造

1. `site-container`、`site-container-content`、`content-col`、ページ固有の `max-w-*` がどこで使われているか確認する。
2. 画面幅に対して本文が不自然に狭い箇所を特定する。
3. `md:grid-cols-[8rem_1fr]` など、固定値の grid が本文幅を圧迫していないか確認する。
4. 同じ見た目の定義リスト、セクション、問い合わせフォームがページごとに独自実装になっていないか確認する。
5. 記事本文や詳細ページの読みやすさ目的の幅制限と、静的情報ページの不要な幅制限を分けて判断する。
6. mobile / tablet / desktop / wide desktop で、折り返し、余白、列幅、テキスト重なりを確認する。

### B. データ構造

1. ページが `data/*.ts` を直接 import していないか確認する。
2. 事実情報が `lib/data.ts` 経由の構造化データから供給されているか確認する。
3. `record_fact` に source / reliability / checkedAt 相当の確認経路があるか確認する。
4. `ui_text` がページ内に散らばりすぎていないか、`lib/uiText.ts` に寄せるべきものを洗い出す。
5. `static_page_content` を無理に data 化していないか、逆に複数ページで重複してズレる状態になっていないか確認する。
6. `derived_value` がハードコードされていないか確認する。
7. `rights_sensitive` が権利ポリシーと矛盾していないか確認する。
8. slug と id の責務が混ざっていないか確認する。
9. タグ、カテゴリ、表示ラベルが registry / labels / display の正本に沿っているか確認する。

## 実行手順

### Phase 1: インベントリ作成

目的: 全ページ、主要コンポーネント、データ供給元、幅制限を一覧化する。

実行内容:

- `src/app` の全 `page.tsx` を列挙する。
- 各ページが import している主要 components / lib / data を記録する。
- `max-w-`, `grid-cols-[`, `content-col`, `site-container`, `prose`, `ch` 系の指定を検索する。
- ページ内に直接書かれた日本語本文、ラベル、説明文を抽出する。

成果物:

- route 別の layout source map
- route 別の data/text source map
- 調査対象外にできるものと、詳細確認が必要なものの分離

### Phase 2: レイアウト問題の分類

目的: どの幅制限が意図的で、どれが不自然な折り返しの原因かを分ける。

実行内容:

- 静的情報ページの本文幅を優先確認する。
- 詳細ページの記事本文、カード内テキスト、フィルターUI、比較表は別カテゴリとして扱う。
- 同じ構造なのにページごとに個別 class になっている箇所を抽出する。
- 共通化候補を `StaticPageShell`、`StaticSection`、`DefinitionList`、`FormShell` などに分類する。

成果物:

- layout issue list
- 共通化候補リスト
- 修正優先度

優先度:

- P0: 文字が重なる、読めない、横スクロールが発生する
- P1: 大画面で本文が不自然に狭く、早く折り返される
- P2: 同じ構造が複数ページに重複し、今後ズレやすい
- P3: 見た目の微調整で済むもの

### Phase 3: データ配置の分類

目的: 文字情報が適切な場所に置かれているかを全ページで判定する。

実行内容:

- 各ページの文字情報を `record_fact` / `ui_text` / `static_page_content` / `legal_policy` / `derived_value` / `rights_sensitive` に分類する。
- `record_fact` は `data/*.ts` と `lib/data.ts` の構造に沿っているか確認する。
- `ui_text` は `lib/uiText.ts`、labels、display、tag registry に寄せるべきか確認する。
- `static_page_content` はページ内固定でよいものと、サイト共通 content に出すべきものを分ける。
- `legal_policy` は実際の利用サービス、問い合わせ経路、計測スクリプト、フォーム送信先と矛盾しないか確認する。
- `rights_sensitive` は権利ポリシーと照合する。

成果物:

- data placement issue list
- 移動不要の判断リスト
- 修正候補リスト

優先度:

- P0: 事実情報が未出典または誤った場所にあり、誤情報につながる
- P1: 変動する値がハードコードされ、更新漏れしやすい
- P2: UI文言や固定本文が重複し、ページ間でズレる
- P3: 直ちに問題ではないが、整理すると保守しやすい

### Phase 4: 修正計画への変換

目的: 調査結果を、そのまま実装できる粒度の修正計画に落とす。

実行内容:

- レイアウト修正とデータ構造修正を別の実装単位に分ける。
- 静的ページ共通レイアウトの導入範囲を決める。
- data / uiText / site content / legal policy の移動対象を決める。
- 修正対象外にする箇所を明記する。
- build / validate / visual check の検証項目を決める。

成果物:

- 修正実行計画
- 変更対象ファイル一覧
- 検証チェックリスト

## 初期仮説

調査開始時点では、以下を仮説として扱う。確定判断は Phase 1 から Phase 3 の結果で行う。

1. 会社概要、プライバシーポリシー、問い合わせ、メーカー・代理店向けページの狭い折り返しは、`content-col` とページ個別の固定 grid が主因の可能性が高い。
2. 記事本文や詳細ページの `ch` ベースの幅制限は、読みやすさのために意図された可能性が高く、静的情報ページの問題とは分けて扱う。
3. ロボット、メーカー、記事、ガイド、用途の主要事実データは、概ね `lib/data.ts` 経由で供給されている可能性が高い。
4. 静的ページの本文は、必ずしも data 化する必要はない。ただし、複数ページで繰り返されるサイト説明、更新される可能性のある件数・日付・サービス利用情報は整理対象になる。
5. 権利・素材・問い合わせ先・計測ツールに関する文言は、実装や運用実態と照合する必要がある。

## 調査で作る一覧

調査結果では、最低限以下の表を作る。

### Route Layout Table

| route | main component | container | max width | grid pattern | issue | priority |
| --- | --- | --- | --- | --- | --- | --- |

### Text Source Table

| route | text category | current location | expected location | issue | priority |
| --- | --- | --- | --- | --- | --- |

### Data Flow Table

| route/component | current source | expected source | direct data import | source/reliability concern |
| --- | --- | --- | --- | --- |

### Fix Candidate Table

| target | type | proposed fix | risk | verification |
| --- | --- | --- | --- | --- |

## 検証方針

調査後の実装修正では、最低限以下を確認する。

- `npm run build`
- データを変更した場合は `npm run validate:data`
- 主要 viewport での表示確認
  - 360px
  - 768px
  - 1280px
  - 1440px 以上

優先して確認するページ:

- `/about`
- `/privacy`
- `/contact`
- `/for-manufacturers`
- `/`
- `/robots`
- `/manufacturers`
- `/reports`
- `/guides`
- `/use-cases`
- 代表的な詳細ページ

## 完了条件

- 全 route の layout source map がある。
- 全 route の text/data source map がある。
- レイアウト問題とデータ構造問題が別々に分類されている。
- 修正不要、要修正、要確認が明確に分かれている。
- 次の実装フェーズで触るファイルと触らないファイルが明確になっている。
- この計画が `docs/planning/README.md` に active/unimplemented plan として登録されている。
