# DATA-R01-B02 AgiBot 調査報告

- checkedAt: 2026-07-16
- 対象: AgiBotのpublished Robot 8機
- JSON: [DATA-R01-B02-agibot.json](./DATA-R01-B02-agibot.json)
- 対象ID: `agibot-a2`, `agibot-a2-ultra`, `agibot-a2-max`, `agibot-a2-lite`, `agibot-x1`, `agibot-x2`, `agibot-x2-ultra`, `agibot-g2`

## まとめ

AgiBot公式の英語・日本語製品ページ、公式グローバルストア、A2 Ultra／X2の公式開発ドキュメント、公式セキュリティ更新期間資料、公式ニュース・導入記事を確認した。価格は公式ストアを先に確認し、公開金額がない機体へ推測価格や「問い合わせ」offerは登録していない。

カード用の確定値は、A2、A2 Ultra、A2 Max、A2 Lite、X2、X2 Ultraで公式身長・重量・稼働時間または条件付き値を確認した。X1は公式ページの言語版・revision間でDoF／runtime／速度が異なり、G2は公式製品ページが詳細数値を掲載していないため、コードにあった値を再利用していない。

主な要確認は次のとおり。

- A2: `169cm / 69kg / 700Wh / 2h / 40+ active DoF`。速度、荷重、計算基盤、価格は対象A2ページで未公開。A2 Ultraストア値はvariantが違うため流用していない。
- A2 Ultra: `169cm / 約69kg / 40 active DoF / 14.4Ah / 立位3h・歩行1.5h / 充電2h`。公式ストアはA2 Ultraを掲載するが、価格金額は公開していない。製品ページの最大1.2m/sとストア詳細の最大0.8m/sが競合する。
- A2 Max: `175cm / 85kg / 1m/s / 2h`。Coming soon。DoFは`67 total / 53 active`表記でscopeが曖昧。40kgはsingle-arm値へ変換せず`manufacturer-wording`で記録した。
- A2 Lite: `169cm / 約63kg / 23 DoF / 最大0.8m/s・日常≤0.6m/s / 2h充電 / 1.5kg single-arm rated load`。runtimeは公式製品ページとストア比較表で立位・歩行条件の値が競合する。公式ストア価格は`$44,560 USD`。
- X1: 英語ページは`34DoF / 33kg / 2h / 1m/s`、日本語ページは`31/41DoF configurable / ≤33kg / ≥4h / ≥1m/s`、公式開発ガイドは29 body joints＋grippers。variant/revisionを確定できないためconflictとした。公式X1開発ガイドのinference/training codeとLinux SDKはfound。
- X2: 公式ストア価格は`$24,240 USD`。英語・ストアの`25DoF / 最大1.8m/s`と日本語公式の`27DoF / 最大1.5m/s`を併記し、価格以外はconflictを保持した。
- X2 Ultra: `131cm / 約39kg / 30DoF / 約500Wh / 2h（0.5m/s歩行時） / ≤1.5h充電 / Orin NX 157TOPS`。ストアに`$999,999`のSale price表示とContact Usが併存するため、価格はneeds-reviewであり確定価格として扱わない。
- G2: 公式製品ページで`wheeled humanoid`、IP42、精密組立を確認。身長・重量・速度・DoF・payload・runtime・電池容量・計算基盤は公開値なし。Longcheerのタブレット量産ライン導入は公式deployment事例として登録した。

## 2026-07-16 公式ページ再確認差分

- [A2 Lite公式ストア](https://store.agibot.com/products/a2-lite)の専用ページで、約169cm、約63kg、最大0.8m/s、日常使用≤0.6m/s、立位4時間35分・歩行1.5時間、14.4Ah、充電≤2時間、IP5X（Joint Module）、0〜40℃、片腕rated 1.5kgを再確認した。製品ページとストア比較表のruntime差は`conflict`のまま保持し、A2 Ultraの値をA2 Liteへ流用していない。
- [A2 Max公式](https://www.agibot.com/products/A2_Max)は175cm、85kg、1m/s、2時間、67 total/53 active DoF、全作業範囲で最大40kgの物体を扱う表現を掲載する。40kgはscope・rated/maximumの正式定義がないため`manufacturer-wording / maximum`の荷重として保持し、片腕荷重へ読み替えていない。
- [X2公式ストア](https://store.agibot.com/products/x2)はX2を`$24,240.00 USD`で表示し、25 DoF、最大1.8m/s・通常≤0.8m/s、約500Wh、0.5m/s歩行時約2時間、充電≤1.5時間、最大3kg（特定姿勢）／全範囲≤1kgを掲載している。日本語公式ページの27 DoF・最大1.5m/sとの差は`conflict`として残した。
- [X2 Ultra公式ストア](https://store.agibot.com/products/x2-ultra)は30 DoF、約39kg、最大1.8m/s、約500Wh、Orin NX 157 TOPS等を掲載するが、`$999,999`表示とContact Usが併存するため価格は確定Offerにせず`needs-review`状態を維持した。
- [Longcheer量産導入の公式記事](https://www.agibot.com/article/231/detail/60.html)はG2がタブレット量産ラインでMMIT stationの搬送・投入・仕分けを行ったと説明する。製品ページのG2固有数値がないため、導入事例の実績を他A2/X2 variantのスペックへ流用していない。

## 用途接続とUSE_CASE_GAP

公式表現が既存published UseCaseに直接対応する場合だけ接続した。

- `agibot-a2`: `customer-reception`（customer service / front desk reception）と`facility-wayfinding`（exhibition hall presentations / supermarket guidance）。
- `agibot-a2-ultra`: `customer-reception`（customer service / showroom explanations）と`facility-wayfinding`（autonomous reception / route guidance）。
- `agibot-a2-lite`: 既存UseCaseに性能・公演を直接表す項目がないため接続せず、以下をgapにした。
- `agibot-a2-max`: material handling / palletizingは既存UseCaseの粒度と一致しないためgapにした。
- `agibot-x1`: full-stack open-source robot、公式inference/training codeを`research-prototype-dev`へ接続した。
- `agibot-x2`: entertainment and commercial performanceは既存UseCaseに直接対応しないためgapにした。
- `agibot-x2-ultra`: exhibition guideを`facility-wayfinding`、in-store receptionistを`customer-reception`、research and education advocateを`research-development`へ接続した。
- `agibot-g2`: high-precision force-control / sub-millimeter assemblyを`factory-assembly-support`へ接続した。

JSON内の`useCaseGaps`に次を記録した。

```text
USE_CASE_GAP agibot-a2 "marketing / business consultation" https://agibot.com/products/A2
USE_CASE_GAP agibot-a2-ultra "cultural and commercial performances / brand endorsements" https://store.agibot.com/products/a2-ultra
USE_CASE_GAP agibot-a2-lite "entertainment / cultural and commercial performances / theme-park promotion" https://agibot.com/products/A2_Pro
USE_CASE_GAP agibot-a2-max "material handling / palletizing / heavy-duty object handling" https://www.agibot.com/products/A2_Max
USE_CASE_GAP agibot-x2 "entertainment and commercial performance" https://store.agibot.com/products/x2
USE_CASE_GAP agibot-x2-ultra "entertainment performance / tourism ambassador" https://store.agibot.com/products/x2-ultra
USE_CASE_GAP agibot-g2 "wheeled industrial precision assembly / continuous operations" https://www.agibot.com/article/231/detail/44.html
```

## 活用事例

variantを確定できる公式記事だけを登録した。A2はFortuneイベント出演とGuinness歩行記録を`demonstration`として登録した。G2はLongcheerの量産ラインでのMMIT搬送・投入・仕分けを`deployment`として登録した。A2 Ultra／A2 Lite／X2系について、A2 Series／X2 Seriesとしか書かれていないイベント記事はvariant流用を避けて登録していない。

## 価格・調達・日本情報

- 公式ストアで公開価格が確認できたのはA2 Lite（`$44,560 USD`）とX2（`$24,240 USD`）。
- X2 Ultraの`$999,999`はContact Us表示と競合するためneeds-review。A2、A2 Ultra、A2 Max、X1、G2は価格offerなし。
- A2 Maxは公式にComing soon。A2 Ultra、X2、X2 Ultra、A2 Liteはグローバルストア掲載・購入導線を確認したが、日本の正規代理店や国内在庫を確認できない。
- G2はLongcheer量産ラインへの導入が確認できるが、一般公開価格・日本販売を意味しない。
- 公式ストアの海外発送、問い合わせフォーム、開発ドキュメントは、日本国内で購入可能・商用提供中・正規代理店ありという根拠にはしていない。

## 仕様状態

各RobotのJSONで`lib/specSchema.ts`の16キー（`payloadKg`を含む）を省略せず記録した。A2 Ultra／A2 Lite／X2系の荷重は`loadRatings`へ分離し、A2 Maxの40kgとX2系の3kg／1kgはメーカー記載scopeのまま登録した。X1の公式revision差、A2 Ultraの速度差、A2 Liteのruntime差、X2 Ultraの価格表示は`conflicts`と`humanReviewRequired`に残している。

このバッチは調査報告のみで、`data/*.ts`、UI、画像ファイルは変更していない。
