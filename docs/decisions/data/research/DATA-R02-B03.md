# DATA-R02-B03 — UBTECH Robotics 再調査報告

- checkedAt: `2026-07-17`
- 対象: 6機体 (`ubtech-walker-s2`, `ubtech-walker-s1`, `ubtech-walker-x`, `ubtech-walker-s`, `ubtech-walker-c`, `ubtech-walker-tienkung`)
- JSON: [DATA-R02-B03.json](./DATA-R02-B03.json)
- 方法: DATA-R01 (`DATA-R01-B03-ubtech.json/.md`) と `DATA-R02-source-plan.json` は候補URL発見のみに使用し、値・結論はすべて本セッションで一次情報源から再検証した。DATA-R01が「過度に慎重」だった箇所（現行公式ページに直接書かれている情報を、無関係な過去の導入事例のvariant識別不能を理由に不掲載にしていた）を修正するのが本バッチの主目的。

## 総括（このバッチで判断を変えた点）

1. **BYD × Walker S1** と **NIO × Walker S** の商用導入事例を新たに `officialUseCases` / `usageExamples` として採用した。DATA-R01は「導入先が読み取れない」「HKEX開示から間接的に推測」として慎重姿勢だったが、UBTECH公式の現行 Industrial Solutions ページ (`https://www.ubtrobot.com/en/humanoid/solutions/industry`) に企業名・機種名・作業内容が直接明記されていることを本セッションで確認した。これは古い曖昧な事例ではなく、**現行の公式ページに直接書かれた情報**であるため、そのまま採用する。
2. **Walker C の speedMps（6km/h）と batteryCapacityWh（48V×15Ah=720Wh）** を `needs-review` から `found` に格上げした。DATA-R01は「steady running paceかmax速度か不明」「Wh直記載でない」ことを理由に保留していたが、両方とも**現行の公式製品ページ本文に直接記載**されている数値であり、単純な単位換算（V×Ah）は「推測」ではないため採用する。
3. Walker S1 の身長・重量等の数値仕様の画像 (`cs_en.png`) を実際に画像として開いて目視確認した。**中身は製品写真のみで数値表は存在しない**ことを確認し、「読み取れないので保留」ではなく「公式に公開されていないことを確認済み」として `not-published` を維持した（DATA-R01と同じ結論だが、根拠の確度が上がった）。
4. Walker Tienkung について、「UBTECH自社ブランド製品か、中国机器人創新中心の別プロジェクトか」を再確認した。**UBTECH自社ドメイン（ubtrobot.com / docs.ubtrobot.com）と日本正規代理店GA Roboticsの3者が一致してWalker Tienkungを現行UBTECH製品として扱っている**ことを確認。ただし海外プレス（TechNode等、本セッションでは一次情報として開いていない）が報じる「Tiangong Walker」（北京人形ロボットイノベーションセンター共同開発）はスペックがTK2101と酷似しており、混同の可能性を`unresolved`に明記した（断定はしていない）。
5. GA Robotics の現行取扱いページを `curl` で直接確認し、`walker-s1`・`walker-s`・`walker-c` の個別URLがそれぞれ `walker-s2` / `walker-c1` にリダイレクトされ、`walker-x` は404であることを確認した（JP代理店の現行個別販売ページはS2・C1・Tienkung・Tienkung DEXのみ）。既存repoの `japanAvailability: inquiry-required` 判定と整合するため変更なし。

いずれの機体も `lifecycleStatus` は **current**、`publicationRecommendation` は **keep-published** とした（既存repoの published 状態と一致）。

---

## Walker S2

**lifecycleStatus: current / publicationRecommendation: keep-published**

UBTECH公式Company Profileが "Industrial: Walker S2, Walker S1, Walker S" を現行製品として明記。自社製品ページ（タイトル自体が "Autonomous Battery Swapping for Mass Production Delivery"）とGA Robotics（JP代理店）の専用ページ・2025年11月PRが揃って現行製品として扱う。

身長・重量・DoFはGA RoboticsのPRページ（176cm/73kg/52DoF）と製品ページ（172cm/60-73kg/20-41DoF）で一致せず、`conflict`として維持。特にDoFの「20/41」という数字はWalker TienkungのTK2101/TK2301の値と酷似しており、代理店ページ側のデータ混入を疑い `humanReviewRequired` に記録した。

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped |
| heightCm | conflict | 176cm(PR) vs 172cm(製品ページ) |
| weightKg | conflict | 73kg(PR) vs 60/73kg(標準/AI拡張) |
| speedMps | found | 2 m/s |
| dof | conflict | 52(PR) vs 20/41(標準/AI拡張) |
| payloadKg | not-published | (loadRatingsに15kg/0-1.8m作業域を計上) |
| runtimeMin | found | 3h継続稼働 / 8h待機 |
| batteryCapacityWh | needs-review | 30Ah+3Ah、電圧未記載のためWh未算出 |
| chargeTimeMin | not-published | — |
| batterySystem | found | 自律ホットスワップ3分、デュアルバッテリー |
| controlMethod | found | BrainNet 2.0 + Co-Agent、ROSA 2.6（代理店記載） |
| sdk | not-published | — |
| computePlatform | found | Intel Core(4.7GHz)+16GB RAM+256GB SSD + Jetson AGX Orin |
| ipRating / operatingTemperature / safetyStandard | not-published | — |

導入事例: SANY RE（commercial-deployment、ボルト脱着・仕分け）、Foxconn（pilot、SPS部品供給・複数台協調のvalidation段階）— いずれも公式Industrial Solutionsページに直接記載。

価格: 公式・代理店とも非公開。`priceFallback: inquiry-fallback`。

---

## Walker S1

**lifecycleStatus: current / publicationRecommendation: keep-published**

Company Profileの現行Industrial製品リストに明記。自社製品ページはLLMタスク計画・2段階セマンティックVSLAM・全身学習制御を確認できるが、数値仕様表は画像セクションのみで、実際に画像を取得・目視したところ製品写真のみで数値は含まれていなかった（=非公開であることを確認、単なるアクセス不可ではない）。

`successorRobot: ubtech-walker-s2` を記録（自社ページがS2を後継、Walker Sを前身と明言しているため）が、S1自体は現行製品として引き続き販売中のため `lifecycleStatus` は `superseded` ではなく `current` とした。

**主要な変更点**: 公式Industrial Solutionsページが **BYD** を Walker S1 の導入先として直接明記（"autonomous logistics application that humanoid robots coordinate with autonomous logistics vehicles, AMRs/AGVs"）。commercial-deploymentとして採用。

数値仕様（身長・重量・速度・DoF・payload・稼働時間・電池等）はすべて `not-published`（画像確認済み、真に非公開）。

GA Roboticsに専用ページなし（`/products/walker-s1/` は `walker-s2` へリダイレクト、curlで確認）。

---

## Walker X

**lifecycleStatus: current / publicationRecommendation: keep-published**

Company Profileの現行Commercial製品リストに明記。自社製品ページは**テキストで読み取り可能な完全な仕様表**を持つ（画像ではない）。

| spec key | status | 値 |
|---|---|---|
| mobility | found | biped, U-SLAM/FPV AR nav |
| heightCm | found | 130cm |
| weightKg | found | 63kg |
| speedMps | found | 3km/h → 0.8333 m/s |
| dof | found | 41 (脚6x2/腕7x2/手6x2/首3) |
| payloadKg | needs-review | 片腕1.5kg(伸展) / 運搬10kg / 両手3kg、単一値に統合不可 → loadRatingsに3件登録 |
| runtimeMin | found | 2h |
| batteryCapacityWh | found | 54.6V×10Ah=546Wh |
| chargeTimeMin | found | 2h |
| batterySystem | found | リチウム電池 54.6V/10Ah/3.6kg |
| controlMethod | found | ROSA、U-SLAM、AIoTインターフェース |
| sdk | not-published | — |
| computePlatform | found | Intel i7-8665U×2 + NVIDIA GT1030、Ubuntu+LinuxRT+Android |
| ipRating / operatingTemperature / safetyStandard | not-published | — |

officialUseCasesは接続なし（自社ページが「多様なシナリオでのサービス」と意図的に汎用表現に留め、受付・案内等の具体的シナリオを明言していないため）。スマートホーム家電操作（AIoT）は既存UseCaseに該当なくUSE_CASE_GAPとして記録。

GA Roboticsに専用ページなし（`/products/walker-x/` は404、curlで確認）。

---

## Walker S

**lifecycleStatus: current / publicationRecommendation: keep-published**

Company Profileの現行Industrial製品リストに明記（Walker S Liteとは別モデル）。`successorRobot: ubtech-walker-s1` を記録（自社ページがS1/S2を後継バリアントとして言及）が、Sそのものが引き続き現行製品のため `current` を維持。

**主要な変更点**: 公式Industrial Solutionsページが **NIO** を Walker S の導入先として"world's first instance"の商用導入と明記（自動車組立＋品質検査）。commercial-deploymentとして採用（DATA-R01はHKEX開示等からの間接推測に留まり慎重姿勢だったが、現行公式ページの直接記載で確定）。Dongfeng Liuzhou Motorはdemonstration分類。

なお同じ公式ページに載る Zeekr（Geely）・FAW-Volkswagen青島の事例は **Walker S Lite**（別SKU）向けであり、`ubtech-walker-s` には帰属させていない（variant混同防止）。

| spec key | status | 値 |
|---|---|---|
| heightCm | found | 1.7m |
| dof | found | 41サーボ関節（力覚フィードバック付） |
| controlMethod | found | ROSA 2.0、GUI、遠隔操作、AIOT、マルチモーダル大規模モデル判断、6D姿勢認識 |
| 他（重量・速度・payload・電池等） | not-published | 画像なし・テキストなし |

---

## Walker C

**lifecycleStatus: current / publicationRecommendation: keep-published**

Company Profileの現行Commercial製品リストに明記（Walker C1とは別モデル、両者は並存する現行製品）。自社製品ページはテキストで読み取り可能な仕様表を持つ。

| spec key | status | 値 |
|---|---|---|
| heightCm | found | 163cm |
| weightKg | found | 43kg |
| speedMps | found | 6km/h → 1.6667 m/s（現行公式ページ記載、DATA-R01のneeds-reviewから格上げ） |
| dof | found | 20 |
| payloadKg | needs-review | 「Arm Weight: 5kg」がアーム自重か可搬重量か判別不可 |
| runtimeMin | found | 歩行2h/立位4h |
| batteryCapacityWh | found | 48V×15Ah=720Wh（現行公式ページ記載の2値を単純換算、DATA-R01のneeds-reviewから格上げ） |
| chargeTimeMin | found | 1.5h |
| controlMethod | found | 関節/通信インターフェース、U-SLAM自律ナビ、AI障害物検知、多言語対応の自社開発対話大規模モデル |
| sdk / computePlatform / ipRating / operatingTemperature / safetyStandard | not-published | — |

導入事例: Expo 2025大阪 中国館ツアーガイド（demonstration）、Strawberry Music Festival 2025（demonstration）、広東省春節晩会2025香港（demonstration）— いずれも自社製品ページに直接記載。

GA Roboticsの`/products/walker-c/`は`walker-c1`へリダイレクト（curlで確認）— C1が代理店の現行取扱いSKUだが、UBTECH自社ページ・Company ProfileではCとC1は並存する現行製品として扱われているため、Walker Cを`superseded`とはしない。

---

## Walker Tienkung

**lifecycleStatus: current / publicationRecommendation: keep-published / recordScope: product-family**

UBTECH自社ドメイン（ubtrobot.com、docs.ubtrobot.com）とGA Robotics（JP代理店）が揃って現行UBTECH製品として扱う（Walker E/E Proからの改称、GA Robotics公式ページで確認）。TK2101（base, 20DoF）／TK2201（Voice & Vision, 21DoF）／TK2301（Embodied Intelligence, 42DoF）の3モデルコードがUBTECH公式ドキュメントに存在する。

**重要な保留事項**: 海外プレス報道の「Tiangong Walker」（北京人形ロボットイノベーションセンターとの共同開発、約$41,000、170cm/20DoF）は、スペックがTK2101と酷似しており同一製品を指している可能性が高いが、本セッションでは一次情報での確認に至っていない。また、同イノベーションセンターが自前で運用する（2025年ヒューマノイド・ハーフマラソン走行等）別の「天工/Tiangong」ロボットとは異なる可能性が高いが、これも断定はしていない。`unresolved`/`humanReviewRequired`に明記。

さらにGA Roboticsは「Walker Tienkung DEX」という別SKU（169cm/64.5kg/31DoF/Jetson AGX Thor 2070TOPS）を掲載しており、TK21xx/TK2301のいずれとも一致しない — より新しいハードウェア改訂の可能性があるが、本robotId（`ubtech-walker-tienkung`）の対象範囲には含めていない。

| spec key | status | 備考 |
|---|---|---|
| mobility | found (family-common) | biped |
| heightCm | found (family-common) | 1730±10mm(docs、全variant共通) ≈ 172cm(GA)、近似で整合 |
| weightKg | needs-review | docs: 64/68/75kg(3段階) vs GA: ~61/~73kg(2段階) 不整合 |
| speedMps | needs-review | GA「標準7km/h」のみ、docsに速度記載なし |
| dof | needs-review | docs: 20/21/42(3段階) vs GA: 21/42(2段階) 不整合 |
| payloadKg | not-published | — |
| runtimeMin | needs-review | docs「3.5h超」(全variant共通) vs GA「待機8h/継続3h」 不整合 |
| batteryCapacityWh | needs-review | 48V、30Ah+3Ahだが直並列不明でWh未算出 |
| chargeTimeMin | found (family-common) | 4時間未満（docs、全variant共通） |
| batterySystem | found (family-common) | 三元系リチウム、48V、デュアルパック |
| controlMethod | found (family-common) | ROS2 SDK、全関節/センサーのオープンインターフェース |
| sdk | found (family-common) | Walker Tienkung SDK（ROS2、Ubuntu 22.04専用） |
| computePlatform | needs-review | TK2101: i7-1355Uのみ / TK2201: +Orin AGX×1(275TOPS) / TK2301: +Orin AGX×2(550TOPS) |
| ipRating / operatingTemperature / safetyStandard | not-published | — |

officialUseCases: `research-development`、`research-prototype-dev`（自社AI Educationページの「Academic Research, Education & Secondary Development」記載に直接接続）。教育（classroom/curriculum）用途は既存UseCaseに該当なくUSE_CASE_GAPとして記録。

GA Roboticsは評価貸出しサービスを明記（レンタル/販売両対応）。価格は非公開。

---

## 出典ログ（主要ソースのみ、詳細はJSON documentsReviewed参照）

| タイトル | URL | Publisher | checkedAt |
|---|---|---|---|
| UBTECH Walker S2 official page | https://www.ubtrobot.com/en/humanoid/products/walker-s2 | UBTECH Robotics | 2026-07-17 |
| Walker S2 | GA Robotics product page | https://ga-robotics.co.jp/products/walker-s2/ | GA Robotics | 2026-07-17 |
| Walker S2 Japan announcement (PR) | https://ga-robotics.co.jp/pr/42088/ | GA Robotics | 2026-07-17 |
| UBTECH Walker S1 | https://www.ubtrobot.com/en/humanoid/products/walker-s1 | UBTECH Robotics | 2026-07-17 |
| Walker S1 spec-section image (visually inspected, photos only) | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/01/693097528242245.png | UBTECH Robotics | 2026-07-17 |
| UBTECH Walker X | https://www.ubtrobot.com/en/humanoid/products/walker-x | UBTECH Robotics | 2026-07-17 |
| UBTECH Walker S | https://www.ubtrobot.com/en/humanoid/products/walker-s | UBTECH Robotics | 2026-07-17 |
| UBTECH Walker C | https://www.ubtrobot.com/en/humanoid/products/walker-c | UBTECH Robotics | 2026-07-17 |
| UBTECH Walker C1 (separate product, no succession statement) | https://www.ubtrobot.com/en/humanoid/products/walker-c1 | UBTECH Robotics | 2026-07-17 |
| UBTECH industrial humanoid solutions (deployment case table: SANY RE, Foxconn, BYD, NIO, Dongfeng Liuzhou, Zeekr, FAW-VW Qingdao) | https://www.ubtrobot.com/en/humanoid/solutions/industry | UBTECH Robotics | 2026-07-17 |
| Humanoid Solutions (category index) | https://www.ubtrobot.com/en/humanoid/solutions | UBTECH Robotics | 2026-07-17 |
| Company Profile (current Industrial/Commercial/Education lineup) | https://www.ubtrobot.com/en/about/company-profile | UBTECH Robotics | 2026-07-17 |
| UBTECH Walker Tienkung (AI Education) | https://www.ubtrobot.com/en/ai-education/products/walker-tienkung | UBTECH Robotics | 2026-07-17 |
| Walker Tienkung model specifications (TK2101/TK2201/TK2301) | https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/6/ | UBTECH Robotics | 2026-07-17 |
| Walker Tienkung SDK docs | https://docs.ubtrobot.com/walker-tienkung/en/docs/sdk/7/ | UBTECH Robotics | 2026-07-17 |
| Walker Tienkung | GA Robotics（旧Walker E/E Pro改称を明記） | https://ga-robotics.co.jp/products/walker-tienkung/ | GA Robotics | 2026-07-17 |
| Walker Tienkung DEX | GA Robotics（別SKU） | https://ga-robotics.co.jp/products/walker-tienkung-dex/ | GA Robotics | 2026-07-17 |
| GA Robotics product index | https://ga-robotics.co.jp/products/ | GA Robotics | 2026-07-17 |
| GA Robotics support service page | https://ga-robotics.co.jp/service/ | GA Robotics | 2026-07-17 |
| GA Robotics / UBTECH distributor partnership announcement | https://ga-robotics.co.jp/pr/41810/ | GA Robotics | 2026-07-17 |

## 保留事項サマリ

- Walker S2: 身長・重量・DoFのconflict未解消（メーカーPDFが画像形式でOCR不可）。
- Walker Tienkung: 「Tiangong Walker」プレス報道との関係、「Walker Tienkung DEX」の位置づけが未確定。variant別数値（weightKg/dof/runtimeMin/computePlatform）は単一値に統合不可のためneeds-review。
- 全機体共通: メーカー公式・代理店公式の価格情報は確認できず、`priceFallback: inquiry-fallback`（第三者小売の価格推定は不採用）。
