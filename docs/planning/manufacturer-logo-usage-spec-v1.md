# メーカーロゴ利用仕様 v1

Last created: 2026-07-09 / Last updated: 2026-07-14（origin/main候補レビュー反映）

## 位置づけ

メーカー名表示に使うロゴのデータ構造、表示解決、素材受入、検証の現行仕様を定める。

- 権利・商標判断の正本: `copyright_and_media_rights_policy_v1.md`
- データ運用の正本: `../data/README.md` と `data-maintenance-checklist-v1.md`
- 型と実装の正本: `data/types.ts`、`lib/manufacturerLogo.ts`、`lib/validate.ts`

この文書はローカルの著作権無視プロトタイプを根拠にしない。公開候補として権利確認した素材と、origin/mainへ載せる実装だけを扱う。

## 現在の反映状況

ローカル `main` のorigin/main候補実装に、権利確認済みの8社分を登録した。GitHubへの反映はレビュー、検証、Draft PRを経て行う。

- Unitree Robotics: `wordmark`
- Agility Robotics: `combined`
- 川崎重工業: `combined`
- Wandercraft: `wordmark`
- NEURA Robotics: `wordmark`
- XPENG Robotics: `combined`
- Fourier Intelligence: `combined`（PNG）
- AgiBot: `combined`（PNG）

TeslaのCommonsファイルは第三者による著作権主張とDMCA警告が明記されていたため、`commercial-permitted` 判定を撤回し、公開アセットと `logos.symbol` 登録を削除した。公式brand/press素材または個別許諾から再調達する。

## 基本原則

1. ロゴは `symbol`、`wordmark`、`combined` を区別する。
2. `symbol` と `wordmark` をCSSで合成して、存在しない公式 `combined` を作らない。
3. 画像寸法とアスペクト比はファイルから実測し、`data/*.ts` に手入力しない。
4. variant、権利状態、出典は機械推測せず、人が根拠を確認して記録する。
5. 表示面は個別に素材を選ばず、共通resolverへ希望variantを渡す。
6. 表示可能なロゴがなくても、メーカー名テキストだけでUIが成立する。
7. 未許諾・blocked素材を `public/` に置かない。`public/` のファイルはURLを直接指定すると配信されるため、表示gateだけでは非公開を保証できない。

## ロゴ種別

| variant | 内容 | 主な用途 |
|---|---|---|
| `symbol` | アイコン、図形、頭文字など | 小さい正方形枠 |
| `wordmark` | 会社名文字を読ませる横長ロゴ | 世界地図、記事の関連メーカー |
| `combined` | 公式配布のシンボル + ワードマーク複合ロゴ | カード、詳細見出し |

独立したsymbolを持たず、wordmarkが正式ロゴであるメーカーもある。欠けたvariantを無理に作らず、resolverのfallbackとメーカー名テキストで補う。

## データ構造

```ts
interface Manufacturer {
  /** deprecated: logosがない旧レコードだけで使う */
  logo?: ImageAsset;
  logos?: {
    symbol?: ImageAsset;
    wordmark?: ImageAsset;
    combined?: ImageAsset;
  };
}
```

新規素材は `Manufacturer.logos` に登録する。legacy `Manufacturer.logo` を増やさない。

`ImageAsset` はロゴ、ロボット画像、記事画像で共有するメディアSSOTであり、ファイル参照と権利メタデータを同じ単位で持つ。現行フィールドは次の用途を担う。

- `src`, `alt`: 公開ファイルと代替テキスト
- `credit`, `sourceUrl`: 表示クレジットと原典
- `rights.status`, `sourceType`, `rightsHolder`, `checkedAt`: 利用判断
- `licenseUrl`, `permissionNote`: ライセンス・個別許諾の根拠
- `aspectRatio`: サーバー側で実測して付与する派生値。raw dataには保存しない

## 配置規格

```text
public/images/manufacturers/logos/<manufacturer-id>-<variant>.<ext>
```

- 原本無改変を原則とする。
- PNGをSVGへトレースしない。
- 外部ホットリンクを使わない。
- 同名差し替えでも権利根拠と `checkedAt` を再確認する。
- SVGを受け取った場合は、script、event handler、`foreignObject`、外部参照がないか確認する。

## 権利確認とメーカー提供素材

Wikimedia CommonsはAPIのライセンス名だけで判断しない。正確なファイルページでテンプレート、出典、履歴、削除依頼、第三者の著作権主張を確認する。ロゴ集積サイトや出所不明の再配布物は採用しない。

メーカー・権利者から直接素材を受け取る場合は、少なくとも次を確認する。

- 対象ファイルと権利者
- Webサイトでの商用利用可否
- 利用媒体と地域
- 改変、トリミング、背景色変更の可否
- 利用期限、撤回条件
- クレジット、リンク、ブランドガイドライン
- 許諾メール・契約書・素材原本の管理先

現件数では `licenseUrl` / `permissionNote` で運用できる。ただし、許諾素材が増えて複数画像で同じ契約を共有する段階では、契約記録を `MediaPermission` のような別SSOTにし、`ImageAsset` から不変IDで参照する設計へ移行する。メールや契約書そのものを公開リポジトリへ保存しない。

ロボット画像にも同じ `ImageAsset.rights` を使う。今回のロゴ実装だけでロボット画像の役割・カルーセル構造まで変更せず、ロボットカタログ改修計画で `Robot.images` のSSOT移行と一緒に決める。

## 表示解決

`resolveManufacturerLogo()` は「存在する最初」ではなく、`canDisplayAsset()` を通過する最初の候補を返す。

| 希望variant | `logos` 内のfallback順 |
|---|---|
| `combined` | `combined` → `wordmark` → `symbol` |
| `wordmark` | `wordmark` → `combined` → `symbol` |
| `symbol` | `symbol` → `combined` → `wordmark` |

- `logos` があるレコードでは、種別未分類のlegacy `logo`を候補に含めない。
- `logos` がない旧レコードだけ、legacy `logo` をcombined相当として扱う。
- JSON-LDも共通resolverを使う。
- 移行期間中の呼び出し側は `logo` と `logos` の両方を渡し、旧レコードの表示を壊さない。

## 寸法と表示

`lib/imageDimensions.ts` がローカルPNG/JPEG/SVGの寸法を読み、`lib/manufacturerLogoEnrich.ts` がサーバー側で `aspectRatio` を付与する。

`getLogoBoxSize()` は目標面積と最小高・最大高・最大幅から表示枠を計算する。極端に横長なロゴで最小高と最大幅が両立しない場合は、レイアウト保護のため最大幅を優先する。

- 画像は `object-contain` で表示する。
- ロゴの配布色をdark mode用に改変しない。
- 黒版・濃色版をdark modeでも読めるよう、ロゴ画像だけに白いメディアバックプレートを置く。
- 装飾画像として `alt="" aria-hidden="true"` にし、メーカー名を視覚表示または `sr-only` で必ず保持する。
- `hideName` 指定時でも、ロゴなし、または名前を読ませる面でsymbolしかない場合はメーカー名を視覚表示する。

## 表示面

| 面 | variant | 名前表示 |
|---|---|---|
| ロボット一覧カード | `combined` | 視覚表示 |
| Home世界地図 | `wordmark` | 視覚表示 |
| メーカー一覧カード | `combined` | 原則sr-only。symbol fallback/画像なしは視覚表示 |
| メーカー詳細見出し | `combined` | 視覚表示 |
| ロボット詳細のメーカーリンク | `combined` | 原則sr-only。symbol fallback/画像なしは視覚表示 |
| メーカー詳細の取り扱いロボット | 非表示 | 同一メーカー文脈なのでカード内表示を省く |
| 比較のメーカー見出し・お気に入り | `combined` | 原則sr-only。symbol fallback/画像なしは視覚表示 |
| 記事詳細の関連メーカー | `wordmark` | 原則sr-only。symbol fallback/画像なしは視覚表示 |
| Organization JSON-LD | `combined` | UI外。表示可能なURLだけを出力 |

Home「注目ロボット」と比較D&D中の小型カードは今回変更しない。ロボットカード共通化の対象として、ロボットカタログ改修計画で扱う。

## 自動検証

`lib/validate.ts` は空でない全 `ImageAsset` に対して次を確認する。

- ローカルパスが `public/` 内に収まり、ファイルが実在する
- `alt` と `rights` がある
- `sourceType !== 'own'` なら `rightsHolder` がある
- `licensed` / `commercial-permitted` なら `licenseUrl` または `permissionNote` がある
- 参照表示系statusなら `credit` と `sourceUrl` がある
- raw dataに派生値 `aspectRatio` を手入力していない
- `logos.*` に空 `src` のプレースホルダーを登録していない

必須確認:

```bash
npm run validate:data
npm run build
git diff --check
```

## 2026-07-14レビューで修正した問題

- 極端に横長なロゴが `maxWidthPx` を超える問題
- dark modeで黒・濃色ロゴが消える問題
- 一部呼び出し側が `logos` だけを渡し、legacy `logo` の旧レコードを壊す問題
- `logos.*` 以外のローカル画像に実在チェックがなかった問題
- 許諾・商用利用可の根拠が空でもvalidatorを通る問題
- `public/` 外を指す相対パスを解決できる問題
- Teslaロゴの権利判定誤り

## 残課題

1. 既存legacy `logo` を一括でvariant判定し、`logos` へ移行して二重SSOTを解消する。
2. メーカー提供素材が増える前に、非公開の許諾原本保管先と公開コードから参照する不変IDを決める。
3. SVG受入時のサニタイズを手順だけでなくCIで機械検査するか決める。
4. ロボットカタログ改修で、ロゴ・ロボット画像を含む共通メディアSSOTとカルーセル規格を確定する。
