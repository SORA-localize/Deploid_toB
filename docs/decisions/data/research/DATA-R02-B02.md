# DATA-R02-B02 AgiBot 再調査報告

- checkedAt: 2026-07-17
- 対象: AgiBot published Robot 8機（B02バッチ）
- JSON: [DATA-R02-B02.json](./DATA-R02-B02.json)
- 対象ID: `agibot-a2`, `agibot-a2-ultra`, `agibot-a2-max`, `agibot-a2-lite`, `agibot-x1`, `agibot-x2`, `agibot-x2-ultra`, `agibot-g2`

## 方針

DATA-R01（docs/data/DATA-R01-B02-agibot.json/.md）は「旧顧客導入事例と現行製品の同一性が確認できない」という理由で、現行公式ページに直接書かれている情報まで一部保留していた。本バッチはその判断を採用せず、**すべての値を自分でゼロから一次情報に当たり直した**。具体的には、AgiBot公式サイト（agibot.com / jp.agibot.com）の現行製品ページ、公式グローバルストア（store.agibot.com、HTMLを直接取得しJSON-LD/spec tableを解析）、公式ニュース記事（2025-12〜2026-06、直近1か月以内のものを含む）、公式SDK/開発者ドキュメント（open.agibot.com、x2-aimdk.agibot.com）、GitHub公式リポジトリ（github.com/AgibotTech）を本日2026-07-17に開いて確認した。

## まとめ（lifecycleStatus / publicationRecommendation の変更点）

DATA-R01・現行repoの記述から変わった、または明確化した判断:

- **agibot-a2**: lifecycleStatus=`current`を維持。ただし現行サイトのナビゲーション上で「AGIBOT A2」カテゴリ見出し自体にはhrefが無く（A2 Ultra/Lite/A2-Wのみ直接リンク）、目立つカルーセルには出ない。それでも独立した現行ページが生きており、2025-12-02・2026-01-19の直近公式記事がA2を名指しして「2025年に1,000台以上を大量納品し、フルサイズ二足ヒューマノイド分野で世界一」と明言しているため、historicalではなくcurrentと判断。marketAvailabilityを`unknown`から`company-claimed-delivery`へ引き上げた。
- **agibot-a2-ultra**: ストア・製品ページの一次情報を自分で開いた結果、「世界初の商用スケール展開フルサイズヒューマノイド」「20以上の主要企業に導入」「1,000台以上の実運用」という公式の強い文言を確認。marketAvailabilityを`unknown`から`enterprise-deployment`へ引き上げた。速度（製品ページ1.2m/s vs ストア表0.8/0.6m/s）は自分で両方読んで矛盾を再確認し、`conflict`として保持（DATA-R01の指摘を追認）。
- **agibot-a2-max**: サイトのnavドロップダウンで当該項目に`display:none`が付与され隠されていることを発見。ただし単独ページ自体は本日も"Coming soon"のまま生きており詳細スペックも変わっていない。discontinuedではなく`announced`と判定し、publicationRecommendationを`move-to-draft`とした（ルール上「announced=原則move-to-draft」に従った変更）。
- **agibot-g2**: 2026-06-28付の公式プレスリリース（記事82）で「AGIBOTの累計15,000台目のロボットはAGIBOT G2」「Longcheerの工場で実働约100時間の生工場ライブ配信」と明言されており、これは前バッチには無かった非常に新しい一次証拠。marketAvailabilityを`enterprise-deployment`で維持・強化し、lifecycleStatusを`current`として確定した。
- **agibot-x2 / agibot-x2-ultra**: 自分でJP公式ページ（jp.agibot.com/products/X2）を追加確認した結果、DoFと最高速度がEN公式ストア表と数値レベルで食い違うことを新たに特定した。X2（無印）はEN「25 DoF・首0」vs JP「27 DoF・首2」で`conflict`、X2 Ultraは両言語で30 DoFと一致（`found`）。最高速度はX2・X2 Ultra共通でEN「1.8m/s」vs JP「1.5m/s」の`conflict`。
- **agibot-a2-lite**: 製品ページとストア表を突き合わせた結果、重量が≈64kg（製品ページ）vs ≈63kg（ストア表）で軽微な`conflict`。また計算基盤（basic board）はrepoの既存値「14コア」に対し、本日確認した製品ページ・ストア表は両方とも「16コア」を明記しており、既存データの誤りの可能性を`humanReviewRequired`に記録した。

## ロボット別詳細

### agibot-a2 (A2)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant（A2無印。A2 Ultra/Lite/Maxとは別ページ・別スペック）
- 理由: https://www.agibot.com/products/A2 、https://agibot.com/jp/products/A2 が現行かつ完全なスペックを持つ。廃止告知なし。直近記事（2025-12-02, 2026-01-19）でA2として言及・実績訴求が継続。

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 169cm |
| weightKg | found | 69kg |
| speedMps | not-published | - |
| dof | needs-review | 40+ Active DoF（単一値不確定） |
| payloadKg | not-published | - |
| runtimeMin | found | 120分（2h、バッテリー交換対応） |
| batteryCapacityWh | found | 700Wh |
| chargeTimeMin | not-published | - |
| batterySystem | found | クイックスワップ＋通常充電の2方式 |
| controlMethod | found | リモート／スマートフォン／PC |
| sdk | not-published | - |
| computePlatform | not-published | - |
| ipRating | not-published | - |
| operatingTemperature | not-published | - |
| safetyStandard | found | PLd級安全保護（3層監視） |

usageExamples: Fortune China Macauイベント（demonstration, 2025-12-02）、Guinness世界記録106.286km歩行（demonstration, 記事公開2026-01-19、本文中に「2025年1,000台以上納品・フルサイズ二足分野世界一」の会社発言を含む）。

### agibot-a2-ultra (A2 Ultra)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 169cm |
| weightKg | found | ≈69kg |
| speedMps | **conflict** | 製品ページ「最大1.2m/s」 vs ストア表「最大0.8m/s・日常≤0.6m/s」 |
| dof | found | 40（Total DOF） |
| payloadKg | found | 片腕定格2kg（エンドエフェクタ除く） |
| runtimeMin | needs-review | 立位3h／歩行1.5h+（条件により倍近く異なる） |
| batteryCapacityWh | needs-review | 14.4Ah・充電電圧48V DC（公式Wh値なし） |
| chargeTimeMin | found | 2h |
| batterySystem | found | 急速充電＋交換式バッテリー対応 |
| controlMethod | found | 無線リモコン／AimMaster／VR遠隔操作（オプション） |
| sdk | found | AimDK for A2 Ultra v2.1 |
| computePlatform | found | 16コアCPU＋NVIDIA Jetson AGX Orin 64G |
| ipRating | found | 関節モジュール IP5X |
| operatingTemperature | found | 0～40℃・RH10～90%結露なし |
| safetyStandard | found | 国際認証 CR／CE-MD／CE-RED／FCC |

loadRatings: single-arm rated 2kg。priceOffers: なし（ストア表示$999,999はplaceholderと判定、priceFallback=inquiry-fallback）。usageExamples: 自社発表の「1,000台以上の実運用・20社以上導入」（commercial-deployment、単一顧客名なし）、CCTV等メディア出演（demonstration）。

### agibot-a2-max (A2 Max)

- lifecycleStatus: **announced** / publicationRecommendation: **move-to-draft**
- recordScope: specific-variant
- 理由: EN/JP公式ページとも本日時点で"Coming soon"／「近日公開予定」。navドロップダウン項目がdisplay:noneで隠されている（ページ自体は現行かつ詳細）。ストア未掲載・価格なし。

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped（しゃがみ・前屈可能） |
| heightCm | found | 175cm |
| weightKg | found | 85kg |
| speedMps | found | 1m/s |
| dof | needs-review | 総数67／能動53 |
| payloadKg | found | 全作業域で40kg（scope未定義、manufacturer-wording） |
| runtimeMin | found | 120分（2h） |
| batteryCapacityWh | not-published | - |
| chargeTimeMin | not-published | - |
| batterySystem | found | 交換式（化学系・電圧非開示） |
| controlMethod | not-published | - |
| sdk | not-published | - |
| computePlatform | not-published | - |
| ipRating | not-published | - |
| operatingTemperature | not-published | - |
| safetyStandard | not-published | - |

useCaseGap: 重量物搬送・パレタイズ（既存UseCaseと粒度不一致）。usageExamples: なし（未発売）。

### agibot-a2-lite (A2 Lite)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 169cm |
| weightKg | **conflict** | 製品ページ≈64kg vs ストア表≈63kg |
| speedMps | found | 最大0.8m/s・日常≤0.6m/s |
| dof | found | 23（Total DOF） |
| payloadKg | found | 片腕定格1.5kg（ソフト義手ハンド、エンドエフェクタ除く） |
| runtimeMin | needs-review | 立位4.5h(≈4h35min)／歩行1.5h+ |
| batteryCapacityWh | needs-review | 14.4Ah・48V DC（Wh値非公表） |
| chargeTimeMin | found | 2h |
| batterySystem | found | 48V DC充電・交換式 |
| controlMethod | found | 無線リモコン／VR遠隔操作（オプション） |
| sdk | not-published | - |
| computePlatform | found | 16コアCPU、高演算ボードなし（**既存repoの「14コア」と不一致、要修正候補**） |
| ipRating | found | 関節モジュール IP5X |
| operatingTemperature | found | 0～40℃・RH10～90%結露なし |
| safetyStandard | not-published | - |

priceOffers: 公式ストア $44,560.00 USD。

### agibot-x1 (X1)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant
- 理由: 現行navに直接リンク、GitHub公式リポジトリ（agibot_x1_infer / agibot_x1_train / agibot_x1_hardware）が稼働中のオープンソースプラットフォーム。

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 130cm |
| weightKg | found | 33kg（EN）／≤33kg（JP、実質一致） |
| speedMps | found | 1m/s（EN）／≥1m/s（JP、実質一致） |
| dof | **conflict** | EN 34DoF vs JP 31/41DoF（カスタマイズ可能） |
| payloadKg | found | 片腕0.5kg |
| runtimeMin | **conflict** | EN 2h vs JP ≥4h |
| batteryCapacityWh | not-published | - |
| chargeTimeMin | not-published | - |
| batterySystem | not-published | - |
| controlMethod | not-published | - |
| sdk | found | DCU用Linux開発SDK＋GitHub公開の推論／学習／ハードウェア設計 |
| computePlatform | found | Domain Controller DCU（1kHz通信、EtherCAT→3系統FDCAN、最大16台カスケード） |
| ipRating | not-published | - |
| operatingTemperature | not-published | - |
| safetyStandard | not-published | - |

officialUseCases: research-prototype-dev（オープンソース研究開発プラットフォーム）。usageExamples: なし。

### agibot-x2 (X2)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant（X2無印。X2 Ultraとは別列でスペック管理）

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 約1.31m |
| weightKg | found | 約35kg |
| speedMps | **conflict** | EN/ストア「最大1.8m/s・実用≤0.8m/s・実験室≤2m/s」 vs JP公式「最大1.5m/s・通常≤0.8m/s」 |
| dof | **conflict** | EN/ストア25（首0） vs JP27（首2）。腕・腰・脚の内訳は一致。 |
| payloadKg | found | 特定姿勢最大3kg／全域≤1kg（エンドエフェクタ除く） |
| runtimeMin | found | 約2h（0.5m/s歩行時） |
| batteryCapacityWh | found | 約500Wh |
| chargeTimeMin | found | ≤1.5h |
| batterySystem | found | 直接充電・交換式バッテリー |
| controlMethod | found | ハンドヘルドコントローラー・モバイルアプリ、**二次開発は非対応** |
| sdk | not-applicable | 「Secondary Development: Not supported」と明記（X2 Ultra専用のAimDK_X2はX2無印では使えない） |
| computePlatform | found | RK3588×2、高演算ボードなし |
| ipRating | not-published | - |
| operatingTemperature | found | -10～40℃ |
| safetyStandard | not-published | - |

priceOffers: 公式ストア $24,240.00 USD。特記: X2無印は自律ナビゲーション・障害物回避・自動充電を**明示的に非対応**（X2 Ultraのみ対応）。

### agibot-x2-ultra (X2 Ultra)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 約1.31m |
| weightKg | found | 約39kg |
| speedMps | **conflict** | EN/ストア最大1.8m/s vs JP最大1.5m/s（X2無印と同型の食い違い） |
| dof | found | 30（EN・JP一致、X2無印と違い言語間の矛盾なし） |
| payloadKg | found | 特定姿勢最大3kg／全域≤1kg |
| runtimeMin | found | 約2h |
| batteryCapacityWh | found | 約500Wh |
| chargeTimeMin | found | ≤1.5h |
| batterySystem | found | 直接充電・交換式・オプション自動充電ドック |
| controlMethod | found | ハンドヘルドコントローラー・モバイルアプリ・二次開発対応 |
| sdk | found | AimDK_X2 1.0.0（Python／C++） |
| computePlatform | found | RK3588×2＋NVIDIA Orin NX 157TOPS |
| ipRating | not-published | - |
| operatingTemperature | found | -10～40℃ |
| safetyStandard | not-published | - |

officialUseCases: facility-wayfinding（自律ナビゲーション対応の案内用途）。priceOffers: ストア表示$999,999はA2 Ultra同様のplaceholderと判断、priceFallback=inquiry-fallback。

### agibot-g2 (G2)

- lifecycleStatus: **current** / publicationRecommendation: **keep-published**
- recordScope: specific-variant
- 理由: 2026-06-28付公式プレスリリース（記事82）が「AGIBOT累計15,000台目はAGIBOT G2」と明言。Longcheer社への商用導入（記事60・79・82の3本で相互裏付け）。

| spec key | status | 値 |
|---|---|---|
| mobility | found | wheeled（公式記事「wheeled humanoids」、2026-03-02 MWC記事） |
| heightCm〜safetyStandard（ipRating除く全て） | not-published | 公式ページ・JPページとも数値スペック非開示 |
| ipRating | found | IP42 |

usageExamples（最大3件を主候補として記録）:
1. Longcheer Technology（Nanchang工場、tablet生産ライン） — commercial-deployment（記事60: 2026-04-14、MMITステーションでの搭載・搬送、310台/時、成功率99%超、1シフト約3,000台）
2. AGIBOT累計15,000台目マイルストーン＝G2（記事82: 2026-06-28、Longcheerラインで累計約100時間のライブ配信稼働）
3. Longcheer南昌工場グローバルライブ配信（記事79: 2026-06、6日間、ロボット機種名は本文中に明記なし・supplementary扱い）

useCaseGap: 車輪型モバイルマニピュレータによる継続稼働の品質検査・搭載工程（既存UseCaseと粒度不一致）。第三者スペック集約サイト（humanoid.guide等）の数値（175cm/55kg、26-49DoF、Jetson Thor T5000等）は発見用途のみで採用せず（サイト間で相互に矛盾し、AgiBot公式ページで裏取りできないため）。

## 主な出典一覧（抜粋、全件はJSON documentsReviewed参照）

| タイトル | URL | publisher | checkedAt |
|---|---|---|---|
| AGIBOT公式サイト製品一覧 | https://www.agibot.com/ | AgiBot | 2026-07-17 |
| AGIBOT A2 product page | https://www.agibot.com/products/A2 | AgiBot | 2026-07-17 |
| AgiBot A2 公式ページ(JP) | https://agibot.com/jp/products/A2 | AgiBot | 2026-07-17 |
| AGIBOT A2 Ultra product page | https://www.agibot.com/products/A2_Ultra | AgiBot | 2026-07-17 |
| AGIBOT A2 Ultra 公式ストア | https://store.agibot.com/products/a2-ultra | AgiBot | 2026-07-17 |
| AGIBOT A2 Lite 公式ストア | https://store.agibot.com/products/a2-lite | AgiBot | 2026-07-17 |
| AGIBOT A2 Max product page(EN/JP) | https://www.agibot.com/products/A2_Max , https://jp.agibot.com/products/A2_Max | AgiBot | 2026-07-17 |
| AGIBOT X1 product page(EN/JP) | https://www.agibot.com/products/X1 , https://agibot.com/jp/products/X1 | AgiBot | 2026-07-17 |
| AgibotTech GitHub | https://github.com/AgibotTech | AgiBot | 2026-07-17 |
| AGIBOT X2 product page | https://www.agibot.com/products/X2 | AgiBot | 2026-07-17 |
| AGIBOT X2 公式ストア | https://store.agibot.com/products/x2 | AgiBot | 2026-07-17 |
| AGIBOT X2 Ultra 公式ストア | https://store.agibot.com/products/x2-ultra | AgiBot | 2026-07-17 |
| AgiBot X2シリーズ 公式ページ(JP) | https://jp.agibot.com/products/X2 | AgiBot | 2026-07-17 |
| AimDK_X2 SDK doc | https://x2-aimdk.agibot.com/en/latest/get_sdk/index.html | AgiBot | 2026-07-17 |
| AimDK A2 Ultra v2.1 dev guide | https://open.agibot.com/docs/en/aimdk/a2/v2_1/dev_guide | AgiBot | 2026-07-17 |
| AGIBOT G2 product page(EN/JP) | https://www.agibot.com/products/G2 , https://jp.agibot.com/products/G2 | AgiBot | 2026-07-17 |
| G2 at MWC2026 Barcelona | https://www.agibot.com/article/231/detail/44.html | AgiBot | 2026-07-17 |
| AGIBOT×Longcheer導入 | https://www.agibot.com/article/231/detail/60.html | AgiBot | 2026-07-17 |
| グローバルライブ配信告知 | https://www.agibot.com/article/231/detail/79.html | AgiBot | 2026-07-17 |
| 15,000台目=G2マイルストーン | https://www.agibot.com/article/231/detail/82.html | AgiBot | 2026-07-17 |
| A2 Fortuneイベント | https://www.agibot.com/article/231/detail/32.html | AgiBot | 2026-07-17 |
| A2 Guinness記録 | https://www.agibot.com/article/231/detail/35.html | AgiBot | 2026-07-17 |
| VR Teleoperation Kit | https://agibot.com/products/VR | AgiBot | 2026-07-17 |

このバッチは調査報告のみで、`data/*.ts`、UI、画像ファイル、publishStatusは変更していない。
