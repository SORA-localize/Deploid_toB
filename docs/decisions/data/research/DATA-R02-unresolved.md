# DATA-R02 未解決事項一覧

作成日: 2026-07-17（Asia/Tokyo）
対象: 全61機（B01〜B10、欠落0・重複0・対象外混入0を機械検証済み）

このドキュメントは、DATA-R02の各バッチ調査で見つかった「実装前に人手判断が必要な事項」を集約したものである。個別の出典URL・evidenceは各 `docs/data/DATA-R02-B0X.json` を参照。

## 1. lifecycleStatus / publicationRecommendation の変更提案（5機）

| robotId | lifecycleStatus | publicationRecommendation | 後継機 | 概要 |
|---|---|---|---|---|
| `agibot-a2-max` | announced | **move-to-draft** | — | EN/JP公式ページとも "Coming soon"。ナビ項目もdisplay:noneで現行導線から隠されている。価格・在庫・導入事例なし。 |
| `fourier-gr1` | superseded | **archive** | `fourier-gr2` | fftai.comの旧GR-1製品ページ・ブローシャー・展示事例ページが全て404。現行「About GRx」ページが「三世代の技術継承（GR-1→GR-2→GR-3 Series）」と明記。 |
| `fourier-gr2` | superseded | **archive** | `fourier-gr3` | 同上。現行マーケティングページなし。ただしAurora SDK（GitHub）はGR-2を現行サポート対象として維持 — 販売ページの不在とSDKサポート継続は別軸として記録。 |
| `apptronik-apollo` | superseded | **archive** | `apptronik-apollo-2` | apptronik.com/apollo は現在404（2026-07-17 curl -I確認）。フッターナビのApolloカテゴリ配下はApollo 2への1本のみ。2026-06-30公式発表もApollo 2のみを現行稼働プラットフォームとして記載。 |
| `robotera-m7` | current | **manual-review** | — | 公式ナビには存在するが、M7専用ページがJS描画でこのセッションでは本文取得不可。現在の数値はリセラー経由の間接情報のみに依存。 |

**この5機以外の56機はkeep-published**（現行製品として公式に確認済み）。

## 2. スペック競合（conflict、22機・35件）

公式資料間で数値・定義が一致しないもの。両方の生値と出典を保持し、単一値へ勝手に解決していない。

| robotId | 項目 | 概要 |
|---|---|---|
| `unitree-h1` | priceOffers | ストア掲載$90,000だが商品タイトル自体が「実際の価格は問い合わせを」と明記 |
| `unitree-h2-plus` | computePlatform | 同一ページ内で「Jetson T5000」と「Jetson Thor」が併用（NVIDIA公式PRは「Jetson Thor」） |
| `unitree-g1-d` | weightKg | DATA-R01時点のTechShare表記（Standard 50kg/Ultimate 80kg）を今回再訪したが同ページに該当数値なし。現行Unitree公式は両variant共通90kg |
| `agibot-a2-ultra` | speedMps / runtimeMin | 製品ページ「最大1.2m/s」 vs ストア表「最大0.8m/s・常用0.6m/s以下」；起立3h vs 歩行1.5h+ |
| `agibot-a2-lite` | weightKg / computePlatform | 製品ページ≈64kg vs ストア≈63kg；既存repo値14-coreだが両一次資料とも16-core |
| `agibot-x1` | dof / runtimeMin | EN34DoF vs JP31/41DoF（カスタム可）；EN2h vs JP4h以上 |
| `agibot-x2` | speedMps / dof | EN/ストア1.8m/s vs JP1.5m/s；EN25（首0）vs JP27（首2） |
| `agibot-x2-ultra` | speedMps | EN/ストア1.8m/s vs JP1.5m/s |
| `ubtech-walker-s2` | heightCm / weightKg / dof | GA Robotics社内でもPR（176cm/73kg/52DoF）と製品ページ（172cm/60・73kg/20・41DoF）が不一致。20/41というDoF値はWalker Tienkung（TK2101/TK2301）の値と酷似しており、代理店ページでのデータ混在の可能性あり（未解決） |
| `ubtech-walker-tienkung` | weightKg / dof / runtimeMin | UBTECH公式SDK文書（3段階：64/68/75kg、20/21/42DoF）vs GA Robotics（2段階：61/73kg、21/42DoF）；稼働時間もdocsは単一値「3.5h超」、GAは「静止8h/連続3h」の2モード表記で全く別体系 |
| `fourier-gr3` | speedMps | 開発者ドキュメント6.1km/h vs 現行マーケティングページ5.5km/h（両方とも公式・両方とも本日確認） |
| `engineai-se01` | batterySystem | 「1000mAh」表記と「大容量高性能电池」という訴求文言の単位整合性が公式ページのみでは判断不能 |
| `engineai-pm01` | priceOffers | 現行¥188,000にedition（商业版/教育版）・税区分の明記なし。2025年1月FAQ記載の¥88,000（期間限定オファー）とは別物として扱い済み |
| `engineai-t800` | dof / weightKg / runtimeMin | 概要29DoF（ハンド除く）とedition別パラメータ表（25/43/46）が不一致；重量75-85kgの範囲のみでedition別内訳非公開；「最大4時間」と「4-5時間」の併存 |
| `engineai-sa01` | heightCm | 寸法表記「1350×250×350mm」の順序・値が身長として不自然（大腿+下腿だけで800mm超） |
| `onex-neo` | dof | 現行/neoページの手部22DoF×2 と、2026-07-09公式発表の片手25DoF（22+手首3）が不一致 |
| `pal-kangaroo` | heightCm | 製品ページ1.58m vs データシートPDF抽出1.60m |
| `limx-oli` | dof / runtimeMin / computePlatform | **重要**: 登録中の「Oli EDU」のdof=33・runtimeMin=90は、現行スペック表の「EDU」列（31DoF・約120分）ではなく「Super」列の値と一致。computePlatform（Orin NX）もEDU列は「標準搭載なし」表記で、Super/Proのみ標準 |
| `figure-03` | batterySystem/chargeTimeMin | 「2kWワイヤレス誘導充電」と「2kW急速充電（アクティブ冷却）」の関係が文言上明確でない |
| `xpeng-iron` | computePlatform | Turing AIチップの実効算力表記が3000TOPS（2025-11-05発表）と2250TOPS（2026年1月別記事、Next P7と共通表記）で不一致 |
| `robotera-l7` | weightKg | 2025-07公式PR 65kg vs 2026-01 CES2026関連報道 70kg。RBTX公式ストアページにも両数値混在 |
| `galbot-g1` | dof | 製品ページ「車輪4基含む24駆動関節」 vs 公式マニュアル「シャーシ・エンドエフェクタ除く21自由度」— 定義域の違いによるもので、単純な誤記ではない可能性 |

## 3. variant/製品ファミリー未確定（12機）

`recordScope: product-family` または明示的にvariant名称が確定できないもの。共通情報はfoundとして保持し、variant固有値のみnedes-reviewとした。

- `unitree-g1-d` — Standard / Flagship（Unitree公式） vs Standard / Ultimate（TechShare）の名称対応未確認
- `ubtech-walker-s` — 「Walker S」ベース版と「Walker S Lite」の区別
- `ubtech-walker-tienkung` — TK2101 / TK2201 / TK2301 の3段階 + GA Robotics独自「Walker Tienkung DEX」の位置づけ、および報道の「Tiangong Walker」との同一性
- `fourier-gr3c` — GR-3 Series内の機能特化variant
- `engineai-pm01` — 商业版 / 教育版
- `engineai-t800` — Basic / Development(Eco・Open-Source) / Pro / Max
- `booster-t1` — Basic / Standard / Customized
- `booster-k1` — Geek / Education / Professional
- `kepler-k2` — Basic(30DoF,75kg) / Bipedal Development(52DoF) / Wheeled Development(52DoF,135kg) — 差異が大きく1レコードでの代表値選定が困難
- `pal-kangaroo` — 4/5/7-DoFアーム構成の選択制ベースプラットフォーム
- `tesla-optimus` — 現行社内使用世代（Gen 2.5相当）。Gen 3は開発中・未発表
- `kawasaki-kaleido` — 2015年プロトタイプ〜2025年Kaleido 9までの世代横断シリーズ名。単一世代の確定仕様なし

## 4. スペックfound件数が少ないRobot（8機、found≤2/16）

| robotId | found件数 | lifecycleStatus | 主因 |
|---|---:|---|---|
| `fourier-gr1` | 0 | superseded | 現行製品ページ消滅（archive推奨） |
| `fourier-gr2` | 1 | superseded | 同上（archive推奨） |
| `robotera-m7` | 1 | current | 専用ページがJS描画で本文取得不可 |
| `agibot-g2` | 2 | current | 直近投入モデルで公式資料がプレスリリース中心、詳細データシート未確認（Document Center要フォローアップ） |
| `ubtech-walker-s1` | 2 | current | 数値スペックの多くがnot-published（画像ベースのブローシャーPDFがOCR不可） |
| `onex-eve` | 2 | limited-current | 2025年以降の公式更新がNEO中心でEVE専用の現行技術情報が乏しい |
| `tesla-optimus` | 2 | limited-current | tesla.com/AI、ir.tesla.comが全アクセスで403（source-inaccessible扱い） |
| `sanctuary-phoenix` | 2 | limited-current | 2026-06-17付でソフトウェアへの戦略転換発表があり、ハードウェア仕様の現行更新が乏しい |

## 5. 一次資料へアクセスできなかった項目（40フィールド、代表例）

- Tesla: `tesla.com/AI`, `tesla.com/we-robot`, `tesla.com/master-plan-part-4`, `ir.tesla.com`配下PDFが全試行でHTTP 403
- NEURA Robotics: `neura-robotics.com`のHTML（製品・予約・トップページ）が403（PDFホスト`neurarobotics.px.media`のみアクセス可）
- UBTECH: Walker S2ブローシャーPDF、Walker S1/S2のHKEX調PDFが画像ベースでテキスト抽出不可
- RobotEra: `robotera.com`がJS描画SPAのため、L7/Q5/M7の本文取得に制限（M7は未解決のまま）
- PAL Robotics: KANGAROOデータシートPDFのバッテリー容量欄が抽出時に文字化け
- AgiBot: Document Center（サイトログイン必要）が未到達、G2詳細データシート候補として残る
- Leju: 天猫（Tmall）公式フラッグシップストアがログインゲートで価格確認不可

詳細な出典・エラー内容は各バッチMarkdown（`DATA-R02-B0X.md`）の「evidence log」セクションを参照。

## 6. 人手確認が必要な事項の集約（32機・42件）

代表的なもの（全件は各バッチJSONの `humanReviewRequired[]` を参照）：

- **`limx-oli`**: EDU/Superのvariant取り違えを次回公開前に解消すること（§2参照）。
- **`ubtech-walker-tienkung`**: どのモデルコード（TK2101/TK2201/TK2301/DEX）を単一レコードの代表値にするか編集判断が必要。「Tiangong Walker」報道との同一性も未確認のまま採用しないこと。
- **`fourier-gr1` / `fourier-gr2`**: 「superseded」と「historical」のどちらの語がサイト上の表現として適切か（Fourier自身は「discontinued」等の明示語を使っていない）。
- **`kepler-k2`**: Basic/Bipedal Development/Wheeled Developmentの差異が大きく、1レコードのままneeds-reviewで残すか、configuration別レコードに分割するかは編集判断。
- **`kepler-k1`**: K2への実質的な世代交代が起きているかどうか、公式な後継声明がないため現状は判定不能。
- **`pal-kangaroo`**: 「Kangaroo PRO」が別SKUとして存在するか要確認（Automatica 2025関連の第三者報道のみで、公式ページ上には未確認）。
- **`agibot-a2` / `agibot-a2-max`**: ナビゲーション上の扱い（リンク欠落・非表示）が実際の販売終了/開始判断を意味するかは、AgiBotへの直接確認が望ましい。
- **`agility-digit` / `kawasaki-kaleido` / `neura-4ne-1` / `tesla-optimus` / `sanctuary-phoenix`**: いずれもWebFetch/WebSearch経由でアクセスできなかった一次資料（PDF資料請求、IR資料、別ネットワークでの再取得）を人手で追加取得することを推奨。

## 7. USE_CASE_GAP（51件）

既存 `data/useCases.ts` に対応するUseCaseが存在しない、公式に明記された用途。全リストは各バッチJSONの `useCaseGaps[]` を参照（新規UseCase作成はこの調査の範囲外）。
