# メーカーロゴ利用仕様 v1

Last created: 2026-07-09 / Last updated: 2026-07-13（本番反映開始）

## 本番反映状況（2026-07-13）

`feature/manufacturer-logos-20260713` で、権利確認済みの9社分を本番データに登録した。

**素材規格（確定）**

- 置き場所: `public/images/manufacturers/logos/<manufacturer-id>-<variant>.svg|png`
- 原本無改変。**PNG→SVGのトレース変換はしない**（再作画＝改変にあたり、権利ポリシー§7の改変禁止に触れる）。低解像度PNGは小〜中枠用途には十分で、大枠で粗い場合のみ高解像度素材を別途調達する
- 寸法はデータに書かず実測（`lib/imageDimensions.ts`）
- rights: `status: 'commercial-permitted'` + `sourceType: 'third-party'` + `licenseUrl`にWikimedia Commonsファイルページ + `permissionNote`にPD-textlogo根拠と商標留意を記録

**権利判定の方法（今後の追加時も同じ手順）**

- Commons APIで`LicenseShortName`を確認し、`Public domain`＋ファイルページに`PD-textlogo`テンプレートがある場合のみ使用可
- `Copyrighted: True`＋個人の自己ライセンス（CC BY等）は不可。**Boston Dynamics（Own work自称の模写）とFigure AI（seeklogo.com転載）はこれに該当し使用不可と判定済み**。公式press/brandページからの再調達待ち
- seeklogo等のロゴ集積サイトを出所とするファイルは、ライセンス表示があっても使わない

**登録済み9社**: Unitree(wordmark) / Agility Robotics(combined) / Tesla(symbol・名前併記対象) / 川崎重工業(combined) / Wandercraft(wordmark) / NEURA Robotics(wordmark) / XPENG(combined) / Fourier(combined・PNG) / AgiBot(combined・PNG)

**監査A〜Jの反映状況**: A（symbol単独時の名前併記）はManufacturerLogoNameの`resolvedVariant`検知で実装済み。B・C・D・E・Fは実験ブランチ側で修正済みのコードをそのまま移植。G・HはL3/L5の現状（名前併記あり）を正とする。

## 位置づけ

この文書は、メーカー名表示に使うロゴの種類、表示面ごとの使い分け、将来のデータ構造案を整理する簡易仕様書。

権利・商標判断の正本は `copyright_and_media_rights_policy_v1.md`。この文書は「どの形のロゴをどのUIで使うべきか」に限定し、許諾や掲載可否の判断を置き換えない。

## 背景

この文書では、用語を次のように使う。

- シンボルマーク: アイコン、図形、頭文字など、会社名文字を含まない、または文字が主役ではないマーク。
- ロゴ: ワードロゴ/ワードマーク。会社名文字を読ませる横長ロゴ。
- シンボル・ロゴ: シンボルマーク + ワードロゴの複合ロゴ。

現行データは `Manufacturer.logo` 1フィールドだけで、全UIに同じ画像を流用する前提になっている。実装確認では、この1フィールド運用だと以下の問題が出やすい。

- 横長のロゴを小さい正方形枠に入れると、Apptronik のように大きく見えすぎる、または窮屈に見える。
- シンボル単体を横長枠に入れると、Agility Robotics のように小さすぎる、余白が目立つ。
- 世界地図やロボットカードでは「会社名をロゴとして読ませる」役割があり、シンボル単体では情報量が不足しやすい。
- 比較タブのリストやD&D中の小型UIでは、ワードマークまで入れると視認性が落ち、シンボルの方が向く。

つまり、ロゴは少なくとも「シンボルマーク」「ロゴ（ワードロゴ）」「シンボル・ロゴ」を区別して扱う必要がある。

## ロゴ種別

| 種別 | 内容 | 主な用途 |
|---|---|---|
| `symbol` | シンボルマーク、アイコン、頭文字マーク | 小さい正方形枠、比較リスト、D&D中の小型表示 |
| `wordmark` | ロゴ。会社名文字を読ませる横長ワードロゴ | 横長枠、世界地図、見出し横のブランド表示 |
| `combined` | シンボル・ロゴ。シンボルマーク + ワードロゴの横並び | ロボットカード、世界地図、カード表示 |

優先順位は、表示枠によって変える。1つの画像を全枠へ流用しない。

## 表示面別の使い分け

| # | 表示面 | 現行実装 | 推奨ロゴ | 理由 |
|---|---|---|---|---|
| L1 | ロボット一覧カード内メーカー表示 | `RobotCard` -> `ManufacturerLogoName` | `combined` | 現状はロボット名の下に「ロゴ + メーカー名テキスト」を出す箇所。今後はシンボル・ロゴだけを表示し、メーカー名テキストは削除する |
| L2 | Home「注目ロボット」 | 現状ロゴなし | 追加するなら `combined` | カード内でブランド認知を補うなら、シンボル・ロゴが向く |
| L3 | Home世界地図マーカー | `ManufacturerMapStage.Wordmark` | `combined` | シンボル・ロゴのみ。メーカー名テキストは既存の地図ラベルと重複する場合は削除/縮退を検討 |
| L4 | メーカー一覧カード | `ManufacturerCard` -> `ManufacturerLogoName` | `combined` | シンボル・ロゴのみ。メーカー名テキストは削除する |
| L5 | メーカー詳細ページ見出し | `ManufacturerDetailHero` -> `ManufacturerLogoName` | `combined` | シンボル・ロゴを見出しの主表示にする。アクセシビリティ/metadata用のテキスト名は保持する |
| L6 | ロボット詳細ページ上部メーカーリンク | `src/app/robots/[slug]/page.tsx` -> `ManufacturerLogoName` | `combined` | メーカー名テキストは削除し、シンボル・ロゴ自体をメーカー詳細へのリンクにする |
| L7 | メーカー詳細の取り扱いロボット欄 | `ManufacturerRobotsGrid` -> `RobotCard` | 原則非表示、またはL1に従う | これは「関連ロボット専用ロゴ」ではなく、メーカー詳細ページの取り扱いロボット一覧で `RobotCard` を再利用しているだけ。同一メーカー文脈なのでメーカー表示自体を隠す案が自然 |
| L8 | 比較タブのメーカーグループ見出し | `CompareClient` -> `ManufacturerLogoName` | `combined` | シンボル・ロゴのみ。メーカー名テキストは削除する |
| L9 | 比較タブのお気に入りカード | `FavoriteCard` -> `ManufacturerLogoName` | `combined` | シンボル・ロゴのみ。メーカー名テキストは削除する |
| L10 | 比較タブの挿入/ドラッグ用小型カード | `CompareParts.CompareDragOverlayCard` 等 | `combined` | シンボル・ロゴのみ。メーカー名テキストは削除する。小さすぎる場合のみ `symbol` fallbackを検討 |
| L11 | Organization JSON-LD | `manufacturerJsonLd` | `combined` または `wordmark` | 画面には出ない。Google等に組織ロゴURLを伝える構造化データ。公式ロゴとして読める画像を使い、権利上不安なら出さない |

現行の通常比較パネル `ComparisonRobotPanel` は、ロゴではなくメーカー名テキストだけを表示する。ここはロゴ消費地点ではない。

## 用語確認メモ

- 「ロボットカード内のメーカー表示」とは、`RobotCard` 内でロボット名の下に出ている `ManufacturerLogoName` のこと。現状は `logo + manufacturerName`。
- 「メーカー詳細の取り扱いロボット欄」とは、メーカー詳細ページの「取り扱いロボット」セクション。実装上は `ManufacturerRobotsGrid` が通常の `RobotCard` を再利用している。
- Organization JSON-LD はユーザーに見えるUIではなく、検索エンジン向けの構造化データ。`manufacturerJsonLd` が `manufacturer.logo` を `Organization.logo` として出している。

## データ構造案

現行:

```ts
interface Manufacturer {
  logo?: ImageAsset;
}
```

推奨:

```ts
interface Manufacturer {
  logo?: ImageAsset; // 後方互換。combined と同義として扱う
  logos?: {
    combined?: ImageAsset; // シンボル・ロゴ
    symbol?: ImageAsset;
    wordmark?: ImageAsset; // ロゴ（ワードロゴ）
  };
}
```

fallback方針:

| 呼び出し用途 | fallback |
|---|---|
| `combined` が欲しいUI | `logos.combined ?? logo ?? logos.wordmark ?? logos.symbol` |
| `symbol` が欲しいUI | `logos.symbol ?? logos.combined ?? logo ?? logos.wordmark` |
| `wordmark` が欲しいUI | `logos.wordmark ?? logos.combined ?? logo ?? logos.symbol` |
| JSON-LD | `logos.combined ?? logos.wordmark ?? logo ?? logos.symbol` |

`logo` を即削除しない。既存UIとデータの後方互換を守るため、移行期間は `logo` を `combined` 相当として扱う。

## UI実装方針

1. `ManufacturerLogoName` に `variant: 'combined' | 'symbol' | 'wordmark'` と `showName?: boolean` を追加する。
2. 表示側は `variant` だけを指定し、データのfallback順は共通helperに閉じ込める。
3. 画像枠は用途ごとに固定寸法を維持する。
4. `symbol` は正方形枠で `object-contain`。
5. `combined` / `wordmark` は横長寄りの枠で `object-contain`。
6. 今回の方針では、ロゴ表示面のメーカー名テキストは原則削除する。アクセシブルネーム、title、metadata、JSON-LDではテキスト名を保持する。
7. 世界地図・カード見出し・ロボットカードのようにロゴ自体に会社名を読ませたい面では `combined` / `wordmark` を使う。

## 権利・運用メモ

- ロゴは商標リスクがあるため、公式ブランドガイドライン、media kit、書面許諾、または少なくとも出典とrights metadataを必ず持つ。
- 同じメーカーでも `symbol` / `wordmark` / `combined` の権利条件が違う場合がある。`ImageAsset` ごとに `rights` を持たせる。
- 公式色・比率・余白を改変しない。
- 切り抜き、余白削除、背景透過化は加工にあたる可能性があるため、公開用では許諾またはガイドライン確認後に行う。
- ローカル検証用の未許諾ロゴは `prototype-only` として `_local-prototype` に閉じる。

## 実装タスク案

1. `data/types.ts` に `ManufacturerLogos` を追加し、`Manufacturer.logos?` を定義する。
2. `lib/media.ts` または新規 `lib/manufacturerLogo.ts` に `getManufacturerLogoAsset(manufacturer, variant)` を作る。
3. 既存 `Manufacturer.logo` を `combined` fallbackとして維持する。
4. `ManufacturerLogoName` に `variant` と `showName` propを追加する。
5. L1-L11の表示面にvariantとメーカー名テキスト表示有無を割り当てる。
6. validatorで `logos.*` の `ImageAsset` を検証する。
7. ローカルプロトタイプで Agility / Apptronik / Unitree / Figure AI を最低限の比較対象にして、サイズ差を確認する。

## 確認チェックリスト

- Agility Robotics のシンボル・ロゴが世界地図で小さすぎないか。
- Apptronik のシンボル・ロゴが比較リストで大きすぎないか。
- メーカー名テキストを削除しても、シンボル・ロゴだけで会社名を読めるか。
- `combined` 表示時、ワードロゴが小さく潰れていないか。
- 白背景バックプレートで黒/カラー/白抜きロゴが読めるか。
- dark mode / light mode の両方でロゴの背景が破綻しないか。
- `commercial-strict` で表示できないロゴがテキスト表示へ落ちるか。

## 本番実装計画（材料が揃った後に着手）

この節は「(c) 未実装・作業計画」。ここに書く実装はまだ着手しない。材料（本番素材）が揃ってから、まず`experiment/local-media-preview`サンドボックスで本番同様の構造を試作し、問題なければ`content/data-maintenance`ブランチで本番反映する。

### 設計方針：測れるものはコードが測る、判断が要るものだけ人が決める

サンドボックスで一度、メーカーロゴのアスペクト比を手動計算してハードコードするテーブル（`lib/manufacturerLogoAspect.ts`）を作ったが、これは筋が悪いと判断した。画像の**寸法**はファイルさえあれば機械的に測定できる事実であり、人間が入力・維持すべきデータではない。ファイルを差し替えるたびに手動更新が必要になり、ズレたまま放置されるリスクがある。

本番実装では、寸法を`data/*.ts`に一切書かない。サーバー側の共通関数がファイル本体から都度実測する。

- PNG: 先頭バイトのIHDRチャンク（8バイト目以降、幅・高さがbig-endian uint32で埋め込まれている）を`fs.readFileSync`で数バイト読むだけ。追加ライブラリ不要。
- SVG: XMLの`viewBox`属性を正規表現かXMLパースで読むだけ。

一方、「このロゴが`symbol`か`wordmark`か`combined`か」は機械には判定できない意味的な分類であり、これは人間が1回だけ判断して`data/manufacturers.ts`に記録する（`rights.status`や`sourceType`を人が判断して記録するのと同じ性質の作業）。「測定」と「分類」を混同しないことが今回学んだ教訓。

### 実装ステップ

1. `data/types.ts`に`ManufacturerLogos`を追加。寸法フィールドは追加しない（実測するため不要）。

   ```ts
   export interface ManufacturerLogos {
     symbol?: ImageAsset;
     wordmark?: ImageAsset;
     combined?: ImageAsset;
   }
   ```

   `Manufacturer.logo?: ImageAsset`は後方互換のため残し、`logos.combined`のエイリアスとして扱う。

2. `lib/imageDimensions.ts`（新規）に、絶対パスを受け取ってPNG/SVGの実寸を返す関数を実装する。`public/`配下の実ファイルパスを解決して読む。

3. `lib/data.ts`の`getManufacturers()`内で、各`logos.*`アセットに実測したアスペクト比を都度計算し、コンポーネントに渡す前に付与する（データ自体は変更せず、レンダリング直前の enrichment として扱う）。

4. `lib/manufacturerLogoAspect.ts`の`getLogoBoxSize()`は面積ベース計算のロジックだけ残し、ハードコードされた`manufacturerLogoAspectRatio`テーブルは削除して手順3の実測値を受け取るように差し替える。

5. `ManufacturerLogoName`に`variant: 'combined' | 'symbol' | 'wordmark'`と`showName?: boolean`を追加し、`logo`単発propではなく`logos`オブジェクト全体（またはfallback解決後のアセット）を受け取れるようにする。fallback順は本文の「fallback方針」表のとおり。

6. `scripts/validate-data.mjs`に、`logos.*`が参照する`src`のファイルが実在するかのチェックを追加する（`ImageAsset`の必須項目`rights`等の既存チェックと同様の粒度）。

7. L1〜L11の表示面に`variant`と`showName`を実際に割り当てる（本文の表のとおり）。

8. サンドボックスで実際に本番同様のデータ（下記チェックリストで集めた素材）を入れて`npm run validate:data` / `tsc --noEmit` / 目視確認する。

9. 問題なければ、`content/data-maintenance`ブランチで本番の`rights.status`（`reference-attributed`等）を付けて反映する。

### 素材調達チェックリスト（2026-07-09時点、追加調査反映済み）

サンドボックスの`public/images/_local-prototype/manufacturers/`にある26社分を目視で再分類した。**L1〜L11のほぼ全箇所が`combined`を第一希望としているため、`combined`を持たない社は本番相当の見た目にならない。**

**重要な発見（追加調査で判明）**：「combined」は必ずしも1枚の完成ファイルとして配布されているとは限らない。多くのブランドは symbol と wordmark を別々のファイルとして持っていて、実装側（このサイト）がCSSで横に並べて合成する前提になっている（Figure AI、Tesla、EngineAIで実例確認）。逆に、**そもそも独立したsymbolを持たず、ロゴ自体がwordmark単体として設計されているブランドも存在する**（PAL Robotics、Wandercraftは公式ブランドガイド/公式サイトを直接確認した上で、独立アイコンが無いことを確認済み）。この場合「combinedを探す」のではなく「wordmarkがブランドの正式な姿である」と理解すべきで、無理にアイコンを作る/探す必要はない。

| メーカー | 現状の種別（実測） | 本番で欲しい優先度 | 状況（2026-07-09全社調査完了） |
|---|---|---|---|
| Unitree Robotics | wordmark | combined必要 | **未確認（JS描画サイトで自動取得不可、要目視訪問）** |
| Figure AI | symbol | **要相談：symbol・wordmark個別入手済み** | 公式サイト(figure.ai)から wordmark「FIGURE」を新規発見。既存symbolとは別ファイル |
| Apptronik | wordmark（アイコン分離不可） | wordmarkのまま採用 | 公式サイト(apptronik.com)ヘッダーを直接確認・高解像度版取得。独立symbolなし |
| Agility Robotics | combined | 十分 | 対応不要 |
| 1X Technologies | symbol相当 | combined必要 | 公式サイトに別途wordmark無し。symbol単体が正式ロゴの可能性が高い |
| Boston Dynamics | combined | 十分 | 対応不要 |
| Tesla | wordmark | **要相談：wordmark・T symbol個別入手済み** | Wikimedia Commonsに独立した`Tesla_T_symbol.svg`を確認・取得済み。既存wordmarkとは別ファイル |
| Sanctuary AI | symbol | **combined入手済み** | 公式サイトのニュース記事画像から、シンボル+「SANCTUARY AI」の正真combinedロゴを発見・取得済み |
| AgiBot | combined | 十分 | 対応不要 |
| UBTECH Robotics | wordmark（アイコン分離不可） | wordmarkのまま採用 | スマイルマークは文字デザインに一体化しており独立symbolは存在しない |
| Fourier Intelligence | combined | 十分 | 対応不要 |
| Booster Robotics | wordmark | combined必要 | **未確認**。公式サイトのロゴ候補は販促バナーで不採用 |
| 川崎重工業 | combined（タグライン付き） | 十分（タグライン無し版も追加取得済み） | 公式サイトからタグライン無しの「River Mark + Kawasaki Robotics」版を新規取得 |
| NEURA Robotics | wordmark（アイコン分離不可） | wordmarkのまま採用 | 公式サイト(neura-robotics.com)ヘッダーを直接確認（headless Chromeで再描画）。独立symbolなし |
| Kepler Robotics | symbol | combined必要 | **未確認（JS描画サイトで自動取得不可）** |
| Leju Robotics | combined | 十分 | 対応不要 |
| PAL Robotics | wordmark（アイコン分離不可） | wordmarkのまま採用 | 公式ブランドガイド(pal-robotics.com/brand-guide/)を直接確認。独立symbolなし。ダークモード用の色違いは入手済み |
| LimX Dynamics | symbol | combined必要 | **未確認（JS描画サイトで自動取得不可）** |
| XPENG Robotics | symbol | **combined入手済み** | 公式サイトのSVGを再描画したところ、Xマーク+「XPENG」の正真combinedロゴと判明（以前はsymbol部分だけを誤って切り出していた） |
| EngineAI | symbol | **combined入手済み** | 公式サイトのヘッダーから、歯車アイコン+「ENGINEAI」の正真combinedロゴを発見・取得済み |
| Wandercraft | wordmark（アイコン分離不可） | wordmarkのまま採用 | 公式サイト(en.wandercraft.eu)ヘッダーを直接確認。独立symbolなし。ダークモード用の白抜き版は入手済み |
| RobotEra | symbol（72x72 favicon、低品質） | combined必要、現品質は要交換 | 確認済み・SVGなし（公式サイトにfaviconしかない） |
| Mentee Robotics | symbol | combined必要 | **未確認（JS描画サイトで自動取得不可）** |
| Galbot | symbol | combined必要 | **未確認（JS描画サイトで自動取得不可）** |
| Aeolus Robotics | wordmark（アイコン分離不可） | wordmarkのまま採用 | 公式サイト(aeolusbot.com)ヘッダーを直接確認・高解像度版取得。独立symbolなし（"wafer logo"という別マークの情報はあるが現行サイトでは未使用の可能性） |
| Pudu Robotics | combined | 十分 | 対応不要 |

**全26社の調査を完了した。** 内訳：
- **対応不要（既にcombined）**：8社（Agility, Boston Dynamics, AgiBot, Fourier, Leju, Pudu, Sanctuary AI, XPENG, Kawasaki）※Kawasakiはタグライン無し版に更新
- **wordmarkが正式な姿（アイコン分離不可、探索完了・追加対応不要）**：7社（Apptronik, UBTECH, PAL, NEURA, Wandercraft, Aeolus, 1X）
- **symbol・wordmarkを個別入手済み、合成するか要相談**：2社（Figure AI, Tesla）
- **完全に未確認（自動取得ツールがJS描画に阻まれた。ブラウザで直接訪問すれば判定できる見込み）**：6社（Unitree, Booster, Kepler, LimX, Mentee, Galbot）
- **低品質で要交換**：1社（RobotEra、faviconのみ）
- **完全に未着手**：2社（AgiBot系列の細分類なし、川崎重工業は取得済みなので実質0社）

自動検索ツールがJS描画サイトを苦手とする（サーバーサイドで`<img>`タグが出力されず、Reactコンポーネントが実行時にロゴを描画するケース）ことが、今回はっきりわかった。残り6社はブラウザで直接開いて`F12`開発者ツールでロゴ画像URLを確認するのが最も確実。

### 完了の目安

- 26社中、`combined`（またはL1-L11が要求するvariant）を持つ社数。
- 各社の素材が本物のSVGまたは高解像度PNG＋実測寸法で扱えている。
- `data/*.ts`に寸法・アスペクト比の手打ち数値が一切ないこと。

## 実装監査（2026-07-09、サンドボックス実装 vs 本計画の突合）

`experiment/local-media-preview`ブランチの実装を本計画と突き合わせた結果。データブロック・画像ファイル・全呼び出し箇所をコード読解で確認した。

### 素材の現状（メーカーカードでの実際の解決結果、26社内訳）

- **combinedが表示される**: 11社（Agility, Boston Dynamics, AgiBot, Fourier, 川崎, Leju, XPENG, EngineAI, Sanctuary AI, Pudu, Mentee）
- **wordmarkにフォールバック（計画どおりの正しい挙動）**: 11社（Unitree, Figure AI, Apptronik, Tesla, UBTECH, Booster, NEURA, Kepler, PAL, Wandercraft, Aeolus）
- **symbolが単独表示（違反）**: 4社（1X, LimX, Galbot, RobotEra）

### 発見した問題と根本原因

**A. symbol単独表示 4社 — 根本原因: 素材不足**
1Xは公式サイト自体がsymbolのみ使用でwordmark素材が未発見。LimX/GalbotはJS描画サイトでheadless Chromeでも取得不可（白画面/読み込み停止）。RobotEraは公式にfavicon以外の素材が存在しない。計画には「combinedが無ければwordmark」までしか規定がなく、**「wordmarkも無い場合」の視覚フォールバック規定が無い**（計画漏れ）。現状はhideNameで名前も消えるため、symbolだけの判読不能なカードになる。「symbolしか無い社はメーカー名テキストを併記する」という規定の追加が必要。

**B. 経路間で同じ会社のロゴが食い違う — 根本原因: 計画の後方互換規定の設計欠陥＋実装不統一**
計画は「legacy `logo`をcombined相当として扱う」と規定したが、legacy logoの中身は実際にはsymbolだったりwordmarkだったりする（1ファイル時代の遺物で種別未分類）。さらに実装が不統一で、コンポーネント7箇所は`logos`だけを渡す（legacyがチェーン外）のに対し、世界地図とJSON-LDは`getManufacturerLogoAsset(manufacturer, ...)`にfullオブジェクトを渡す（legacyがチェーン内）。結果、**Figure AIとKeplerはカードでwordmark・世界地図でsymbolが出る**。ユーザーの言う「ハードコードのせいか」に最も近い真因はこれ——legacy logoという“種別未分類の1枚”がチェーンに残っていること。対処: `logos`が存在する社ではlegacyをチェーンから外す（または移行完了後にlegacy自体を廃止）。

**C. fallbackが「存在」ベースで「表示可否」を見ない — 根本原因: 実装バグ（本番モードで全カード匿名化）**
`getManufacturerLogoAsset`は「最初に存在するアセット」を返し、表示可否（`canDisplayAsset`）はその後で単一アセットに対してのみ判定される。チェーン先頭が「存在するが表示不可」（blocked・empty-src・本番でのprototype-only）だと、後続に表示可能なアセットがあってもプレースホルダーに落ちる。本計画チェックリスト最終項目「`commercial-strict`で表示できないロゴがテキスト表示へ落ちるか」に対し、現実装は**テキストにも落ちない**（下記Dと複合し、CameraOffの箱だけが残る）。fallbackは「表示可能な最初のアセット」を返すべき。

**D. `hideName`がDOM削除でアクセシブルネームを喪失 — 根本原因: 実装ミス（計画UI方針6違反）**
計画は「視覚的には削除、アクセシブルネーム・title・metadataではテキスト名を保持」と明記しているが、実装の`hideName`は名前を完全にDOMから消す。ロゴ画像は`alt=""`+`aria-hidden`なので、ManufacturerCardの外部リンク・L6のメーカー詳細リンク・L8の開閉ボタンが**スクリーンリーダーから無名**になる。`sr-only`での保持に修正が必要。あわせて計画のprop名`showName`に対し実装は`hideName`（極性逆）。

**E. L7未対応 — 根本原因: 実装漏れ**
計画L7は「メーカー詳細の取り扱いロボット欄では原則非表示」。実装（`ManufacturerRobotsGrid`）は`manufacturerName`/`logos`をRobotCardへ渡しており、同一メーカーのページ内で全カードに自社ロゴが繰り返し表示される。

**F. JSON-LDのfallback順が計画と不一致 — 根本原因: 実装の簡略化**
計画のJSON-LD順は`combined ?? wordmark ?? logo ?? symbol`だが、実装は汎用の'combined'チェーン（`combined ?? logo ?? wordmark ?? symbol`）を流用しており、legacyの位置が異なる。

**G. L3世界地図の名前併記 — 未対応（soft要件）**
計画は「地図ラベルと重複する場合は削除/縮退を検討」。現状はWordmark＋`m.name`テキストが常時併記。Bの経路問題も地図に影響する。

**H. L5の表示は計画自体が曖昧 — 要決定**
「combinedを主表示、テキスト名は保持」が視覚的併記を許すのかsr-only化を求めるのか未定義。現実装は両方を視覚表示。

**I. XPENGの品質 — 修正時の妥協**
背景不透明バグは修正済みだが、現ファイルは154×25pxと低解像度（headless Chromeの等倍キャプチャ由来）。SVG素材は入手済みなので高解像度で再ラスタライズ可能。

**J. L1は計画を上書き済み（違反ではない）**
計画L1は「メーカー名テキスト削除」だったが、その後の指示で「ロゴ＋名前をメーカー詳細へのリンクにする」へ変更済み。本計画のL1行は更新が必要。

### 根本原因の総括

| 分類 | 該当問題 |
|---|---|
| 素材不足 | A（4社）、I（品質） |
| 計画の設計欠陥（legacy logo=combined決め打ち） | B |
| 計画の規定漏れ | A（wordmarkも無い場合）、H（L5曖昧） |
| 実装バグ | C（表示可否無視）、D（a11y喪失） |
| 実装漏れ | E（L7）、F（JSON-LD順）、G（L3、soft） |
| ハードコード | ロゴ表示経路には現存しない（アスペクト比テーブルは実測方式へ置換済み）。残存する最も近いものはlegacy `logo`フィールド自体（B参照） |

### 推奨修正順序

1. C+D（fallbackの表示可否対応＋sr-only化）— 本番モードの挙動を壊している複合バグで最優先
2. B（`logos`があればlegacyをチェーンから除外、地図/JSON-LDも同じ解決関数の同じ挙動に統一）
3. A（symbol単独の4社は名前テキスト併記にフォールバック＋LimX/Galbotの素材再調達）
4. E（L7の非表示化）、F（JSON-LD順）
5. G/H/I/J（軽微・要決定事項）
