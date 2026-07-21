# DATA-R02 マスターレポート

調査日: 2026-07-17（Asia/Tokyo）
対象: `data/robots.ts` の実行時 `publishStatus: 'published'` 61機（コードから再集計）
体制: メーカー別10バッチ（B01〜B10）を独立調査エージェントへ並列委譲し、各バッチが公式一次資料を再訪・再判定した。

Status: **DATA-R02 一次再調査完了**。DATA-R01の判定を正解として引き継がず、全61機について公式原典を再度開いて lifecycleStatus・全16スペック項目・価格・活用事例・用途接続を再判定した。

## 0. 完了条件チェック

- [x] 全published Robotを1回ずつ調査（61/61）
- [x] 欠落0件・重複0件・対象外混入0件（機械検証済み、後述§1）
- [x] 全RobotでlifecycleStatusを判定
- [x] 全16スペック項目にstatusを付与（機械検証: 欠落0件）
- [x] すべてのfound値に原典URLとevidenceScopeがある（機械検証: found値でsourceUrl欠落0件）
- [x] 現行情報と旧世代情報を分離（recordScope / evidenceScope で明示）
- [x] variant未確定を理由に、現行製品ページの共通情報まで一括棄却していない（§4「修正された過剰保留の例」参照）
- [x] 公式サイトに見当たらないだけでdiscontinued判定していない（消失のみのケースは全てmanual-reviewまたはsuperseded＝公式な後継/世代表明がある場合のみ）
- [x] `data/*.ts` とUIを変更していない

## 1. 対象Robot数・整合性

| 項目 | 件数 |
|---|---:|
| `data/robots.ts` 実行時 `publishStatus: 'published'` （再集計） | **61** |
| DATA-R02バッチJSON収録数（B01〜B10合計） | **61** |
| 欠落 | **0** |
| 重複 | **0** |
| 対象外混入 | **0** |
| JSON parse失敗（malformed） | **0** |
| 16スペックキー欠落のあるRobot | **0** |

機械検証スクリプトで、10バッチ全JSONをparseし、`data/robots.ts`から再計算したpublished ID集合と突合した（一致）。

## 2. バッチ実施状況

| Batch | メーカー | 対象数 | 状態 | 備考 |
|---|---|---:|---|---|
| B01 | Unitree | 10 | 完了 | 1回目で完走 |
| B02 | AgiBot | 8 | 完了 | セッション制限に遭遇後、直接curlで継続・完走 |
| B03 | UBTECH | 6 | 完了 | セッション制限で2回中断、3回目（再起動）で完走 |
| B04 | Fourier Intelligence | 4 | 完了 | 1回目で完走 |
| B05 | EngineAI | 4 | 完了 | 1回目で完走 |
| B06 | Apptronik + 1X | 4 | 完了 | 1回目で完走 |
| B07 | Booster + Kepler | 4 | 完了 | 1回目で完走 |
| B08 | Leju + PAL + LimX | 6 | 完了 | セッション制限で2回中断、3回目（再起動）で完走 |
| B09 | 米欧・その他大手 | 8 | 完了 | セッション制限に遭遇後、reset待ちで再開・完走 |
| B10 | その他 | 7 | 完了 | セッション制限で1回中断、再開で完走 |

セッション全体のAPI利用上限（複数回、それぞれ16:00 JST・22:50 JSTにリセット）により、B03/B08は担当エージェントのtranscriptが失われ、該当バッチのみ完全に再実行した（他バッチへの影響なし、値の重複・欠落なし）。

## 3. lifecycleStatus別件数

| lifecycleStatus | 件数 |
|---|---:|
| current | 48 |
| limited-current | 8 |
| announced | 2 |
| superseded | 3 |
| discontinued | 0 |
| historical | 0 |
| unknown | 0 |
| **合計** | **61** |

## 4. publicationRecommendation別件数

| publicationRecommendation | 件数 | 対象Robot |
|---|---:|---|
| keep-published | 56 | — |
| move-to-draft | 1 | `agibot-a2-max` |
| archive | 3 | `fourier-gr1`, `fourier-gr2`, `apptronik-apollo` |
| manual-review | 1 | `robotera-m7` |

詳細な判定理由・根拠URLは `docs/data/DATA-R02-publication-review.json` および `docs/data/DATA-R02-unresolved.md` §1 を参照。

### 修正された過剰保留の例（DATA-R01の問題への対応）

DATA-R01が「旧世代導入事例との同一性不明」を理由に現行製品ページの直接記載情報まで一括保留していた例のうち、本調査で解消したもの:

- `unitree-g1-d`: DATA-R01はStandard/Flagship variant不確定を理由にほぼ全項目を保留。現行Unitree公式ページはvariant別のクリーンな数値（体重約90kg共通、DoF 17/19、稼働時間2h/6h等）を明記しており、family-common情報として採用した。
- `ubtech-walker-s`, `ubtech-walker-c`: 現行公式製品ページに直接記載の速度・バッテリー容量値をfoundへ格上げ（DATA-R01ではneeds-review）。
- `pal-kangaroo`: 4/5/7-DoFアーム構成別の荷重値は公式データシートに明記された個別行であり、一括不採用にせず`loadRatings[]`として個別採用した。
- `aeolus-aeo`: 現行aeolusbot.comトップページの顧客証言（Marubun社について言及）から、日本国内代理店情報をDATA-R01の保留状態から確定情報へ格上げした。

## 5. スペック項目別found率（16項目 × 61機 = 976セル）

| 項目 | found | not-published | conflict | needs-review | source-inaccessible | not-applicable | found率 |
|---|---:|---:|---:|---:|---:|---:|---:|
| mobility | 56 | 0 | 0 | 3 | 2 | 0 | 91.8% |
| heightCm | 44 | 8 | 2 | 3 | 4 | 0 | 72.1% |
| weightKg | 38 | 9 | 4 | 6 | 4 | 0 | 62.3% |
| speedMps | 25 | 25 | 4 | 3 | 3 | 1 | 41.0% |
| dof | 33 | 9 | 8 | 8 | 3 | 0 | 54.1% |
| payloadKg | 8 | 43 | 0 | 3 | 3 | 4 | 13.1% |
| runtimeMin | 36 | 14 | 2 | 6 | 3 | 0 | 59.0% |
| batteryCapacityWh | 16 | 33 | 0 | 7 | 4 | 1 | 26.2% |
| chargeTimeMin | 15 | 42 | 1 | 0 | 3 | 0 | 24.6% |
| batterySystem | 46 | 12 | 0 | 0 | 3 | 0 | 75.4% |
| controlMethod | 51 | 7 | 0 | 1 | 2 | 0 | 83.6% |
| sdk | 27 | 28 | 2 | 2 | 1 | 1 | 44.3% |
| computePlatform | 27 | 22 | 5 | 4 | 3 | 0 | 44.3% |
| ipRating | 6 | 54 | 0 | 0 | 0 | 1 | 9.8% |
| operatingTemperature | 8 | 51 | 0 | 1 | 1 | 0 | 13.1% |
| safetyStandard | 7 | 53 | 0 | 0 | 1 | 0 | 11.5% |

`payloadKg`のfound率が低いのは意図的（設計方針）: 片腕・両腕・全身・搬送等の条件別荷重は`loadRatings[]`へ分離登録しており、scalar `payloadKg`へ強制的に統合していないため（DATA-R01からの継続方針）。IP等級・動作温度・安全規格は多くのメーカーが現行製品ページ上で非公開のままであり、これは「調査不足」ではなく「公式に非公開」という確認結果である。

## 6. スペック0〜2件のRobot一覧と理由（8機）

| robotId | found件数/16 | lifecycleStatus | 理由 |
|---|---:|---|---|
| `fourier-gr1` | 0 | superseded | 現行製品ページ消滅（archive推奨、§4参照） |
| `fourier-gr2` | 1 | superseded | 同上（SDKのみ現行サポート継続） |
| `robotera-m7` | 1 | current | 専用ページがJS描画のためこのセッションのfetchツールでは本文取得不可 |
| `ubtech-walker-s1` | 2 | current | 数値スペックの多くが画像ベースのブローシャーPDFに存在しOCR不可 |
| `agibot-g2` | 2 | current | 直近投入モデルでプレスリリース中心の情報のみ、詳細データシートは要ログインのDocument Center内 |
| `onex-eve` | 2 | limited-current | 2025年以降の公式更新がNEOに集中、EVE専用の現行技術情報が乏しい |
| `tesla-optimus` | 2 | limited-current | tesla.com/AI、ir.tesla.com が全試行でHTTP 403（source-inaccessible） |
| `sanctuary-phoenix` | 2 | limited-current | 2026-06-17付でソフトウェア戦略への転換発表があり、ハードウェア仕様の現行更新に乏しい |

## 7. variant未確定一覧（12機）

`docs/data/DATA-R02-unresolved.md` §3 を参照。`unitree-g1-d`, `ubtech-walker-s`, `ubtech-walker-tienkung`, `fourier-gr3c`, `engineai-pm01`, `engineai-t800`, `booster-t1`, `booster-k1`, `kepler-k2`, `pal-kangaroo`, `tesla-optimus`, `kawasaki-kaleido` の12機。

## 8. 現行製品でない可能性があるRobot一覧

§4のpublicationRecommendation非keep-published 5機に加え、以下は「current」を維持しつつも継続監視が必要:

- `kepler-k1`: K2への実質世代交代の可能性があるが、公式な後継声明が確認できないため現状current扱いを継続（`humanReviewRequired`）。
- `onex-eve`: ページ自体は存在するがCMS更新が2025-02-26で止まっており、2025-2026の公式発表はすべてNEOのみ。

## 9. foundなのに実装不能な項目

**0件**。機械検証の結果、`found`ステータスを持つ全スペック値に`evidence.sourceUrl`が付与されていることを確認した（found値は443件、うち`sourceUrl`欠落0件）。

## 10. USE_CASE_GAP一覧

**51件**。既存`data/useCases.ts`のUseCaseに対応しない、メーカー公式に明記された用途。全リストは各バッチJSON`useCaseGaps[]`を参照。新規UseCase作成は本調査の範囲外（AIによる用途の推測接続は行っていない）。

参考: 既存UseCaseへの接続候補（`officialUseCases[]`）は合計**81件**。

## 11. 価格調査状況

| 区分 | 件数 |
|---|---:|
| メーカー公式公開価格あり（`priceOffers`にmanufacturer-public） | 14 |
| 正規代理店公開価格あり（`priceOffers`にauthorized-distributor-public） | 0 |
| 公開価格なし → `inquiry-fallback`記録 | 41 |
| 公開価格なし・inquiry-fallbackも未設定（要確認） | 6（`unitree-g1-edu`, `unitree-h1-2`, `unitree-h2-edu`, `unitree-g1-d`, `booster-t1`, `kepler-k1` — いずれも同一ファミリー内の他variantでinquiry-fallbackまたは価格ありのため、当該6機は個別の価格窓口記載が公式に存在しないことを意味する） |

問い合わせ価格を0円・不明として扱った例はない。中古・非正規・マーケットプレイス価格は採用していない。

## 12. 活用事例（usageExamples）状況

| 区分 | 件数 |
|---|---:|
| 活用事例が1件以上見つかったRobot | 33 / 61 |
| 活用事例が見つからなかったRobot | 28 / 61 |
| 活用事例の総件数 | 63 |
| うち commercial-deployment | 17 |
| うち pilot | 15 |
| うち demonstration | 17 |
| うち research | 13 |
| うち historical-family-only | 1 |

DATA-R01比で新規に確認できた実導入事例の例: UBTECH Walker S1×BYD（現行公式ソリューションページに直接記載）、Walker S×NIO（現行公式ページで「世界初の事例」と明記）、EngineAI PM01×南京市（交通補助ロボット、南京市建鄴区・南京市発改委の公式発表）、EngineAI PM01×深圳JD.com旗艦店（深圳市発改委の公式発表）。いずれもメーカー自身のデモ動画ではなく、導入主体・自治体側の公式発表を根拠とした。

## 13. 公式資料の取得エラー一覧

| 対象 | 内容 |
|---|---|
| Tesla | `tesla.com/AI`, `tesla.com/we-robot`, `tesla.com/master-plan-part-4`, `ir.tesla.com`配下PDF — 全試行でHTTP 403 |
| NEURA Robotics | `neura-robotics.com`のHTML（製品・予約・トップページ）— 403（PDFホスト`neurarobotics.px.media`のみアクセス可） |
| UBTECH | Walker S2ブローシャーPDF、Walker S1/S2のHKEX調PDF — 画像ベースでテキスト抽出不可 |
| RobotEra | `robotera.com`全体がJS描画SPA — L7/Q5は部分的に、M7は本文取得不可のまま |
| PAL Robotics | KANGAROOデータシートPDFのバッテリー容量欄が抽出時に文字化け |
| AgiBot | Document Center（サイトログイン必要）未到達 |
| Leju Robotics | 天猫（Tmall）公式フラッグシップストアがログインゲートで価格確認不可 |
| Agility Robotics | Digitのspec-sheet PDF本体（資料請求フォーム経由）は未取得 |
| Kawasaki | iREX2025公式プレスリリース原本・配布資料PDFは未取得、第三者報道のnumbersのみneeds-review |

詳細は `docs/data/DATA-R02-unresolved.md` §5 を参照。

## 14. 成果物一覧

- `docs/data/DATA-R02-source-plan.json` / `.md` — 資料計画（61機、候補資料260件）
- `docs/data/DATA-R02-B01.json`〜`B10.json` — バッチ別調査結果（61機分、1機1オブジェクト）
- `docs/data/DATA-R02-B01.md`〜`B10.md` — バッチ別人間可読サマリー
- `docs/data/DATA-R02-publication-review.json` — 61機分のidentity判定一覧（lifecycleStatus / publicationRecommendation / reason / 根拠URL）
- `docs/data/DATA-R02-unresolved.md` — 未解決事項の集約（本レポートの詳細版）
- `docs/data/DATA-R02-master-report.md` — 本ドキュメント

## 15. 実装・公開状態への提言（次フェーズ）

本フェーズでは `data/*.ts` を一切変更していない。次フェーズで実装する場合の一覧:

### 実装（値の反映）へ進められるRobot

`publicationRecommendation: keep-published` の56機のうち、conflict/needs-reviewが少ない（§2・§6参照）Robotから優先着手を推奨。特にDATA-R01が過剰に保留していた `unitree-g1-d`, `ubtech-walker-s`, `ubtech-walker-c`, `pal-kangaroo` の荷重条件別値、`aeolus-aeo` の国内代理店情報は、公式一次資料で確認済みのため優先反映候補。

### 公開状態の変更が必要なRobot（5機）

- `agibot-a2-max` → draftへの変更を検討（announced段階、価格・在庫・導入事例なし）
- `fourier-gr1` → archiveへの変更を検討（後継: `fourier-gr2`）
- `fourier-gr2` → archiveへの変更を検討（後継: `fourier-gr3`）
- `apptronik-apollo` → archiveへの変更を検討（後継: `apptronik-apollo-2`）
- `robotera-m7` → 現状維持だが公開前にmanual-reviewの解消を推奨

### 人間確認が必要なRobot（32機・42件、代表例）

`limx-oli`（EDU/Super variant取り違えの解消）、`ubtech-walker-tienkung`（代表モデルコードの確定）、`kepler-k2`（configuration別レコード分割の要否）、`pal-kangaroo`（Kangaroo PROの別SKU要否）、`agibot-a2`/`agibot-a2-max`（ナビゲーション上の扱いの意味確認）、`tesla-optimus`/`kawasaki-kaleido`/`neura-4ne-1`/`agility-digit`/`sanctuary-phoenix`（一次資料の追加取得）。全件は `docs/data/DATA-R02-unresolved.md` §6 を参照。
