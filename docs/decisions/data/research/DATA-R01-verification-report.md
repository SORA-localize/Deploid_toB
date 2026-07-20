# DATA-R01 verification report

- checkedAt: `2026-07-16`
- input: existing `DATA-R01-B01`〜`B14` raw JSON（raw JSONは変更していない）
- scope: runtime `publishStatus: published` の61機、`lib/specSchema.ts` の16 field
- rule: 今回Webで実際に開いた原典URLを `openedSourceUrls` / `sourceReview` に記録し、取得エラー・variant未確定・raw conflict/needs-reviewは `verified` にしない

## 統合結果

VERIFY JSONは14件、Robotは61件で、重複0・欠落0です。field recordは976件、priceOffersは20件、loadRatingsは54件、usageExamplesは52件、officialUseCase接続は124件、USE_CASE_GAPは52件です。procurementは61機×5下位項目=305 recordです。

| batch | robots | fields | price | load | usage | officialUseCase | gap | open-error | file |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| B01 | 10 | 160 | 7 | 11 | 5 | 9 | 5 | 1 | [JSON](./DATA-R01-VERIFY-B01.json) |
| B02 | 8 | 128 | 3 | 10 | 3 | 9 | 7 | 2 | [JSON](./DATA-R01-VERIFY-B02.json) |
| B03 | 6 | 96 | 0 | 2 | 7 | 14 | 3 | 2 | [JSON](./DATA-R01-VERIFY-B03.json) |
| B04 | 4 | 64 | 0 | 3 | 3 | 14 | 3 | 1 | [JSON](./DATA-R01-VERIFY-B04.json) |
| B05 | 4 | 64 | 6 | 1 | 0 | 8 | 4 | 1 | [JSON](./DATA-R01-VERIFY-B05.json) |
| B06 | 2 | 32 | 0 | 1 | 3 | 7 | 2 | 0 | [JSON](./DATA-R01-VERIFY-B06.json) |
| B07 | 2 | 32 | 2 | 3 | 3 | 1 | 2 | 0 | [JSON](./DATA-R01-VERIFY-B07.json) |
| B08 | 2 | 32 | 2 | 0 | 5 | 4 | 4 | 1 | [JSON](./DATA-R01-VERIFY-B08.json) |
| B09 | 2 | 32 | 0 | 2 | 3 | 6 | 7 | 1 | [JSON](./DATA-R01-VERIFY-B09.json) |
| B10 | 2 | 32 | 0 | 1 | 3 | 7 | 3 | 7 | [JSON](./DATA-R01-VERIFY-B10.json) |
| B11 | 2 | 32 | 0 | 7 | 3 | 5 | 0 | 0 | [JSON](./DATA-R01-VERIFY-B11.json) |
| B12 | 2 | 32 | 0 | 3 | 1 | 5 | 4 | 0 | [JSON](./DATA-R01-VERIFY-B12.json) |
| B13 | 8 | 128 | 0 | 6 | 8 | 18 | 5 | 5 | [JSON](./DATA-R01-VERIFY-B13.json) |
| B14 | 7 | 112 | 0 | 4 | 5 | 17 | 3 | 2 | [JSON](./DATA-R01-VERIFY-B14.json) |

## raw field status 集計

| field | found | not-published | needs-review | conflict |
| --- | ---: | ---: | ---: | ---: |
| mobility | 49 | 2 | 10 | 0 |
| heightCm | 41 | 12 | 5 | 3 |
| weightKg | 35 | 14 | 6 | 6 |
| speedMps | 18 | 30 | 8 | 5 |
| dof | 26 | 16 | 11 | 8 |
| payloadKg | 0 | 59 | 2 | 0 |
| runtimeMin | 30 | 19 | 9 | 3 |
| batteryCapacityWh | 14 | 29 | 18 | 0 |
| chargeTimeMin | 14 | 44 | 3 | 0 |
| batterySystem | 44 | 14 | 3 | 0 |
| controlMethod | 52 | 7 | 2 | 0 |
| sdk | 24 | 26 | 9 | 2 |
| computePlatform | 22 | 27 | 7 | 5 |
| ipRating | 6 | 53 | 2 | 0 |
| operatingTemperature | 8 | 51 | 2 | 0 |
| safetyStandard | 2 | 54 | 5 | 0 |

合計: found 385 / not-published 457 / needs-review 102 / conflict 32。

## VERIFY status 集計

| 対象 | verified | corrected | unresolved | rejected |
| --- | ---: | ---: | ---: | ---: |
| fields | 659 | 0 | 317 | 0 |
| priceOffers | 10 | 0 | 10 | 0 |
| loadRatings | 45 | 0 | 9 | 0 |
| usageExamples | 42 | 0 | 8 | 2 |
| officialUseCases | 85 | 0 | 39 | 0 |
| useCaseGaps | 38 | 0 | 14 | 0 |
| procurement | 120 | 34 | 151 | 0 |

`not-published`は、今回原典ページを開いて公開値なしを確認した field を `verified` としたものを含みます。`needs-review`/`conflict`は原典を再確認しても採用条件を確定できないため `unresolved` です。

## 価格

rawのpriceResearchStatus別にpriceOffersを集計すると found 14、conflict 3、needs-review 3です。conflict/needs-reviewの6 offerは採用せず、VERIFYでも unresolved のままです。さらに原典取得エラーまたはvariant未確定の4 offerも採用していません。価格offerのvariant、通貨、税、販売導線、Contact/予約・在庫状態は各offerの rawValue / proposedValue / sourceUrl / reason に保持しています。

## 荷重・用途・活用事例

- loadRatingsは54件すべてにscope・rating（rated/maximum等）・variant・sourceUrlを保持し、payloadKgへ片腕荷重を流用していません。
- officialUseCase接続124件は、既存UseCase ID、公式表現、evidenceSourceUrl、対応理由を保持しています。
- USE_CASE_GAP 52件は、公式表現を既存UseCaseへ無理に割り当てず、各VERIFY JSONの`useCaseGaps[].rawValue`と`evidenceSourceUrl`に保存しています。
- usageExamples 52件は対象機種・事例区分・要約・URLを再確認しました。製品発表としてrejectedにしたものは次の2件です。
  - `boston-dynamics-atlas` — Boston Dynamics Unveils New Atlas Robot to Revolutionize Industry ([source](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/))
  - `xpeng-iron` — XPENG UNVEILS KUNPENG SUPER ELECTRIC SYSTEM AND AI-DEFINED MOBILITY INNOVATIONS AT XPENG AI DAY ([source](https://www.xpeng.com/news/019301d2135392fa562d8a0282200016))

### USE_CASE_GAP 原文一覧

- USE_CASE_GAP unitree-h1 "industrial / service industry; full-size general-purpose humanoid" https://www.unitree.com/operate/h1/
- USE_CASE_GAP unitree-h1-2 "full-size universal humanoid robot / 360° depth sensing" https://www.unitree.com/mobile/h1/
- USE_CASE_GAP unitree-h2 "multiple work scenarios / humanoid robot" https://www.unitree.com/mobile/H2/
- USE_CASE_GAP unitree-h2-edu "multiple work scenarios / secondary development" https://www.unitree.com/mobile/H2/
- USE_CASE_GAP unitree-g1-d "Service / Life / Retail / Industry" https://www.unitree.com/mobile/G1-D/
- USE_CASE_GAP agibot-a2 "marketing / business consultation" https://agibot.com/products/A2
- USE_CASE_GAP agibot-a2-ultra "cultural and commercial performances / brand endorsements" https://store.agibot.com/products/a2-ultra
- USE_CASE_GAP agibot-a2-max "material handling / palletizing / heavy-duty object handling" https://www.agibot.com/products/A2_Max
- USE_CASE_GAP agibot-a2-lite "entertainment / cultural and commercial performances / theme-park promotion" https://agibot.com/products/A2_Pro
- USE_CASE_GAP agibot-x2 "entertainment and commercial performance" https://store.agibot.com/products/x2
- USE_CASE_GAP agibot-x2-ultra "entertainment performance / tourism ambassador" https://store.agibot.com/products/x2-ultra
- USE_CASE_GAP agibot-g2 "wheeled industrial precision assembly / continuous operations" https://www.agibot.com/article/231/detail/44.html
- USE_CASE_GAP ubtech-walker-x "Smart Home Control / household appliance operation" https://www.ubtrobot.com/en/humanoid/products/walker-x
- USE_CASE_GAP ubtech-walker-c "public-zone entertainment / shopping-mall voice broadcasting" https://www.ubtrobot.com/en/humanoid/products/walker-c
- USE_CASE_GAP ubtech-walker-tienkung "education" https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/5/
- USE_CASE_GAP fourier-gr3 "personal spaces / social companion at home" https://fftai.com/products-gr3series
- USE_CASE_GAP fourier-gr1 "Performances and Exhibitions" https://www.fftai.com/uploads/upload/files/20250515/3f8dfafee28ab3d5c6688016d8e36eaf.pdf
- USE_CASE_GAP fourier-gr3c "high-risk operations" https://www.fftai.com/products-gr3c
- USE_CASE_GAP engineai-se01 "industrial and household general-purpose operation" https://www.engineai.com.cn/about-news-media/23.html
- USE_CASE_GAP engineai-pm01 "education" https://www.engineai.com.cn/about-news-media/23.html
- USE_CASE_GAP engineai-t800 "公安交管指挥与警务导服" https://www.engineai.com.cn/about-news-media/53.html
- USE_CASE_GAP engineai-sa01 "education" https://www.engineai.com.cn/about-news-media/34.html
- USE_CASE_GAP apptronik-apollo "retail, home delivery and elder care" https://apptronik.com/news-collection/apptronik-unveils-apollo
- USE_CASE_GAP apptronik-apollo-2 "retail and future healthcare/home applications" https://apptronik.com/news-collection/welcome-to-robot-park-where-apptroniks-apollo-goes-to-work
- USE_CASE_GAP onex-neo "household chores / personal domestic assistance / companionship" https://www.1x.tech/neo
- USE_CASE_GAP onex-eve "autonomous industrial factory task handling" https://www.1x.tech/about
- USE_CASE_GAP booster-t1 "RoboCup AdultSize robot soccer competition" https://www.booster.tech/robocup/
- USE_CASE_GAP booster-t1 "embodied AI education / robotics soccer training courses" https://www.booster.tech/cn/education/
- USE_CASE_GAP booster-k1 "embodied AI education / K12 and higher-education training" https://www.booster.tech/cn/education/
- USE_CASE_GAP booster-k1 "RoboCup KidSize robot soccer competition" https://www.booster.tech/robocup/
- USE_CASE_GAP kepler-k2 "warehousing and logistics" https://www.gotokepler.com/productDetailK2?id=2
- USE_CASE_GAP kepler-k2 "specialized industries / high-risk operations" https://www.gotokepler.com/productDetailK2?id=2
- USE_CASE_GAP kepler-k2 "outdoor tasks" https://www.gotokepler.com/productDetailK2?id=2
- USE_CASE_GAP kepler-k1 "Education" https://gotokepler.com/productDetailK1
- USE_CASE_GAP kepler-k1 "Warehousing & Logistics" https://gotokepler.com/productDetailK1
- USE_CASE_GAP kepler-k1 "High-risk Environment" https://gotokepler.com/productDetailK1
- USE_CASE_GAP kepler-k1 "Outdoor Tasks" https://gotokepler.com/productDetailK1
- USE_CASE_GAP leju-kuavo "automotive manufacturing / 3C electronics / logistics" https://lejurobot.cn/en
- USE_CASE_GAP leju-kuavo "training ground / data and model services" https://lejurobot.cn/en
- USE_CASE_GAP leju-kuavo5 "Home Service" https://www.lejurobot.com/zh/products/kuavo-5
- USE_CASE_GAP limx-oli "Entertainment & Performance" https://www.limxdynamics.com/en/products/oli
- USE_CASE_GAP limx-oli "Property Management" https://www.limxdynamics.com/en/products/oli
- USE_CASE_GAP limx-luna "shopping malls / museums / theme parks / live stages" https://www.limxdynamics.com/en/products/luna
- USE_CASE_GAP limx-luna "Entertainment & Performance / brand activations" https://www.limxdynamics.com/en/news/BK000062
- USE_CASE_GAP agility-digit "automated putwall / nesting / AMR loading and unloading" https://www.agilityrobotics.com/content/agility-robotics-announces-new-innovations-for-market-leading-humanoid-robot-digit
- USE_CASE_GAP figure-03 "household tasks like laundry, cleaning, and doing dishes" https://www.figure.ai/figure
- USE_CASE_GAP sanctuary-phoenix "retail store picking, packing, cleaning, tagging, labelling and folding" https://sanctuary.ai/news/sanctuary-ai-deploys-first-humanoid-general-purpose-robot-commercially
- USE_CASE_GAP kawasaki-kaleido "remote operation for hazardous sites and disaster response" https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/
- USE_CASE_GAP neura-4ne-1 "everyday assistance and home routines" https://neura-robotics.com/products/4ne1/
- USE_CASE_GAP robotera-l7 "Education - classroom" https://www.robotera.com/application.html
- USE_CASE_GAP galbot-g1 "Home: cleaning, organizing, fetching and package handling" https://www.galbot.com/
- USE_CASE_GAP aeolus-aeo "hospital specimen/medical-item delivery" https://www.aeolusbot.com/meet-aeo

## enum投影

raw値は削除せず、各procurement recordの`rawValue`に保持しました。現行enumへ意味を安全に保てるものだけ`proposedValue`へ投影し、その他はnull/unresolvedです。

### procurementModels raw値

- `custom-delivery`: 1
- `customization`: 1
- `developer-platform`: 1
- `enterprise-deployment`: 2
- `evaluation-loan`: 1
- `inquiry`: 57
- `internal-use`: 2
- `lease`: 1
- `not-for-sale`: 2
- `partner-program`: 9
- `pilot`: 8
- `planned-production`: 1
- `pre-order`: 1
- `purchase`: 36
- `purchase-inquiry`: 4
- `raas`: 2
- `rental`: 2
- `research-partnership`: 9
- `research-platform`: 1
- `reservation`: 1
- `subscription`: 1

現行enum外の `rental` は `lease` に補正しました。`pilot`、`evaluation-loan`、`research-partnership`、`customization`、`pre-order`、`purchase-inquiry`、`custom-delivery`等は、purchase/lease/raas/subscription/partner-program等へ同一意味で投影できないためnull/unresolvedです。

### marketAvailability raw値

- `coming-soon`: 1
- `commercial-pilot-and-production-ramp`: 1
- `conflict`: 1
- `customer-site-deployment-and-commercial-ramp`: 1
- `developer-platform`: 2
- `early-access-preorder`: 1
- `enterprise-deployment`: 3
- `enterprise-deployment-inquiry`: 1
- `found`: 6
- `global-store-listed`: 3
- `inquiry-required`: 4
- `limited-commercial`: 1
- `limited-production`: 1
- `listed-contact-price`: 1
- `manufacturer-sales-inquiry`: 1
- `mass-production-and-delivery`: 1
- `mass-production-delivery`: 1
- `mass-production-or-sales-inquiry`: 1
- `needs-review`: 16
- `production-customer-shipping`: 1
- `public-price-sales`: 1
- `public-purchase`: 1
- `public-purchase-and-batch-delivery`: 1
- `public-sale-and-mass-production`: 1
- `reservation`: 2
- `sales-inquiry`: 2
- `unknown`: 5

`mass-production-delivery`/`mass-production-and-delivery`は `company-claimed-delivery`、`coming-soon`/`limited-production`は `planned-production`、`inquiry-required`/`global-store-listed`/`public-purchase`/`manufacturer-sales-inquiry`は確定的な提供形態を示さないため `unknown` に投影しました。その他の意味を保持できないraw値はnullです。

### japanAvailability raw値

- `authorized-distributor`: 2
- `distributor-japan`: 5
- `inquiry-required`: 5
- `needs-review`: 6
- `not-published`: 33
- `unknown`: 10

`authorized-distributor`は `distributor-japan`、`not-published`は `unknown` に投影しました。`needs-review`や取得エラーはnull/unresolvedです。

## 原典URLの再確認

raw記録から抽出したURLをB01〜B14で再オープンしました。取得エラーは23件（重複除去後23 URL）で、該当recordをverifiedにしていません。

- DATA-R01-VERIFY-B01: [https://docs.ccsu.edu/IT/2026_IT_AnnualReport.pdf](https://docs.ccsu.edu/IT/2026_IT_AnnualReport.pdf)
- DATA-R01-VERIFY-B02: [https://agibot.com/contact/](https://agibot.com/contact/), [https://store.agibot.com/products/a2-ultra](https://store.agibot.com/products/a2-ultra)
- DATA-R01-VERIFY-B03: [https://owebsite-cdn.ubtrobot.com/resources/file/2025/05/06/673306119077957.pdf](https://owebsite-cdn.ubtrobot.com/resources/file/2025/05/06/673306119077957.pdf), [https://www.ubtrobot.com/en/contact-us](https://www.ubtrobot.com/en/contact-us)
- DATA-R01-VERIFY-B04: [https://www.fftai.com/products-gr2.html](https://www.fftai.com/products-gr2.html)
- DATA-R01-VERIFY-B05: [https://www.engineai.com.cn/product-t800.html](https://www.engineai.com.cn/product-t800.html)
- DATA-R01-VERIFY-B08: [https://www.tohasen-robotics.com/news/tohasen-robotics%E3%80%81booster-robotics%E7%A4%BE%E3%81%A8%E6%97%A5%E6%9C%AC%E5%9B%BD%E5%86%85%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E6%AD%A3%E8%A6%8F%E4%BB%A3%E5%BA%97%E5%A5%91%E7%B4%84/](https://www.tohasen-robotics.com/news/tohasen-robotics%E3%80%81booster-robotics%E7%A4%BE%E3%81%A8%E6%97%A5%E6%9C%AC%E5%9B%BD%E5%86%85%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E6%AD%A3%E8%A6%8F%E4%BB%A3%E5%BA%97%E5%A5%91%E7%B4%84/)
- DATA-R01-VERIFY-B09: [https://www.gotokepler.com/contact?type=ordering](https://www.gotokepler.com/contact?type=ordering)
- DATA-R01-VERIFY-B10: [https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/), [https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/1%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D/](https://kuavo.lejurobot.com/manual/basic_usage/kuavo-ros-control/docs/1%E4%BA%A7%E5%93%81%E4%BB%8B%E7%BB%8D/), [https://lejurobot.cn/en](https://lejurobot.cn/en), [https://lejuznsb.tmall.com/shop/view_shop.htm](https://lejuznsb.tmall.com/shop/view_shop.htm), [https://mp.weixin.qq.com/s/CkBN249IkqKusRoVxZZAmw](https://mp.weixin.qq.com/s/CkBN249IkqKusRoVxZZAmw), [https://mp.weixin.qq.com/s/FbeeOQtYsHpJtRN82VWXYA](https://mp.weixin.qq.com/s/FbeeOQtYsHpJtRN82VWXYA), [https://www.lejurobot.com/zh/products/kuavo-5](https://www.lejurobot.com/zh/products/kuavo-5)
- DATA-R01-VERIFY-B13: [https://kawasakirobotics.com/asia-oceania/japan/](https://kawasakirobotics.com/asia-oceania/japan/), [https://neura-robotics.com/products/4ne-1](https://neura-robotics.com/products/4ne-1), [https://www.tesla.com/optimus](https://www.tesla.com/optimus), [https://www.xpeng.com/pressroom/news/019bc56e17389bc16cb78a028c710035c](https://www.xpeng.com/pressroom/news/019bc56e17389bc16cb78a028c710035c), [https://xpeng.pr.co/241106-xpeng-ai-day-2024-press-kit](https://xpeng.pr.co/241106-xpeng-ai-day-2024-press-kit)
- DATA-R01-VERIFY-B14: [https://www.robotera.com/en/robotics/M7.html](https://www.robotera.com/en/robotics/M7.html), [https://www.robotera.com/en/robotics/Q5.html](https://www.robotera.com/en/robotics/Q5.html)

主要な公式製品ページ（各Robotの詳細URL・field sourceUrlはJSON内）:

- `aeolus-robotics`: [https://www.aeolusbot.com/meet-aeo](https://www.aeolusbot.com/meet-aeo)
- `agibot`: [https://www.agibot.com/products/G2](https://www.agibot.com/products/G2)
- `agility-robotics`: [https://www.agilityrobotics.com/solutions](https://www.agilityrobotics.com/solutions)
- `apptronik`: [https://apptronik.com/apollo/apollo-2](https://apptronik.com/apollo/apollo-2)
- `booster-robotics`: [https://www.booster.tech/booster-k1/](https://www.booster.tech/booster-k1/)
- `boston-dynamics`: [https://bostondynamics.com/products/atlas/](https://bostondynamics.com/products/atlas/)
- `engine-ai`: [https://www.engineai.com.cn/product-sa01.html](https://www.engineai.com.cn/product-sa01.html)
- `figure-ai`: [https://www.figure.ai/figure](https://www.figure.ai/figure)
- `fourier-intelligence`: [https://www.fftai.com/products-gr3c](https://www.fftai.com/products-gr3c)
- `galbot`: [https://www.galbot.com/g1/](https://www.galbot.com/g1/)
- `kawasaki-heavy-industries`: [https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/](https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/)
- `kepler-robotics`: [https://gotokepler.com/productDetailK1](https://gotokepler.com/productDetailK1)
- `leju-robotics`: [https://www.lejurobot.com/zh/products/kuavo-5](https://www.lejurobot.com/zh/products/kuavo-5)
- `limx-dynamics`: [https://www.limxdynamics.com/en/products/luna](https://www.limxdynamics.com/en/products/luna)
- `mentee-robotics`: [https://www.menteebot.com/bot/](https://www.menteebot.com/bot/)
- `neura-robotics`: [https://neura-robotics.com/products/4ne1/](https://neura-robotics.com/products/4ne1/)
- `onex`: [https://www.1x.tech/eve](https://www.1x.tech/eve)
- `pal-robotics`: [https://pal-robotics.com/robot/kangaroo/](https://pal-robotics.com/robot/kangaroo/)
- `robotera`: [https://www.robotera.com/en/robotics/M7.html](https://www.robotera.com/en/robotics/M7.html)
- `sanctuary-ai`: [https://sanctuary.ai/news/sanctuary-ai-releases-new-generation-of-ai-robots-for-high-quality-data-capture/](https://sanctuary.ai/news/sanctuary-ai-releases-new-generation-of-ai-robots-for-high-quality-data-capture/)
- `tesla`: [https://www.tesla.com/AI](https://www.tesla.com/AI)
- `ubtech`: [https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/6/](https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/6/)
- `unitree`: [https://www.unitree.com/mobile/G1-D/](https://www.unitree.com/mobile/G1-D/)
- `wandercraft`: [https://en.wandercraft.eu/calvin-40](https://en.wandercraft.eu/calvin-40)
- `xpeng-robotics`: [https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7](https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7)

## 機械検証

- VERIFYファイル数: 14（期待値14）
- Robot unique: 61（期待値61）
- Robot duplicate: 0
- raw→VERIFY missing: 0
- VERIFY extra: 0
- field record: 976（期待値976）
- price/load/usage/officialUseCase/gap: 20/54/52/124/52
- 全Robotの16 fieldキー: あり
- raw DATA-R01 JSON、`data/*.ts`、UI: 今回の作業では変更なし

## 残る人手確認

`unresolved`は調査未実施の意味ではなく、原典を開いた上でvariant競合、公式ページ取得エラー、公開情報の意味不足、価格・調達条件の矛盾を採用保留にした記録です。公開実装へ反映する前に、`humanReviewRequired`、`conflicts`、各recordの`reason`を優先確認してください。
