---
status: plan
updated: 2026-07-20
---

# B5 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `agility-digit`, `onex-neo`, `boston-dynamics-atlas`, `tesla-optimus`, `kepler-k2`, `xpeng-iron`, `kepler-k1`, `wandercraft-calvin`, `onex-eve`
- 作業範囲: 公式製品ページ、公式media/pressページ、公式利用規約・legalページ、公式ページから辿れる原典画像URLの確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の変更、rights変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の記録

列挙した画像URLはブラウザ経由で再オープンした。画像URLの到達先、Content-Type、公式ページの見出し、alt/caption、画像の配置は確認できたが、この閲覧環境では画像バイナリを保存せずに画素表示がAIへ返らないURLがあった。したがって、画素に依存する背景の細部、人物の実際の写り込み、切り抜き・透明背景、左右側面は断定せず `visual-unconfirmed` とした。

ページのalt/captionまたは見出しが「warehouse」「factory」「person」等を明記する場合はページ文脈として記録し、画素を目視したという意味にはしていない。世代・variantがページと画像URLから分離できない場合は `family-only` とした。Keplerのように公式ページ内の画像は検索結果で確認できても直接asset URLがレビュー画面へ露出しない場合は `not-found-on-reviewed-pages` と記録したが、「公式経路をすべて確認した最終的な候補なし」という意味ではない。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:agility:site-terms:2026-07-15` | Agility Robotics | https://www.agilityrobotics.com/terms / https://www.agilityrobotics.com/solutions | Websiteの画像・動画等は会社、ライセンサー等の知的財産で、personal/non-commercial以外の複製・配布・公開表示・download等を禁止。商用利用・別媒体利用の公開許諾は確認できない。Digit等の商標も事前書面許可が必要。 |
| `policy:1x:press-gallery-and-site-terms:2026-07-15` | 1X Technologies | https://www.1x.tech/press / https://www.1x.tech/terms-and-conditions | Press galleryはnews mediaの編集記事用途に限定し、`Courtesy of 1X`、広告・promotion・commercial use不可、範囲外は事前書面同意と明記。Site termsも画像等のproperty・copy/reproduce等にはexpress written permissionを要求。Deploid向けの商用許諾とは扱わない。 |
| `policy:boston-dynamics:site-terms:2026-07-15` | Boston Dynamics | https://bostondynamics.com/terms/ / https://bostondynamics.com/faq/ | Siteの写真・graphics等は所有・licensed contentで、商用のcopy/reproduce/public display/distributionにはexpress prior written consentが必要。download用datasheetの無改変利用条項は確認したが、写真ライセンスではない。 |
| `policy:tesla:site-ip:2026-07-15` | Tesla | https://www.tesla.com/legal/additional-resources / https://www.tesla.com/legal/terms | 公式Additional Resourcesはサイトのtext/images/graphics/video等をcommercial use/distribution、modify、repostできないと記載。Tesla Optimus画像の公開再利用ライセンスは確認できない。 |
| `policy:kepler:site-legal:2026-07-15` | Kepler Robotics | https://www.gotokepler.com/ / https://www.gotokepler.com/about / https://www.gotokepler.com/news | 公式footerのcopyrightとcookie同意文のUser Agreement/Privacy Policy導線を確認。別規約本文はreviewed browser経路で露出せず、画像再利用ライセンスも確認できない。 |
| `policy:xpeng:global-user-agreement:2026-07-15` | XPENG | https://www.xpeng.com/user-agreement / https://www.xpeng.com/ie/legal-notices | Global user agreementはsite/appのtext、image、video、audio等のIPをXPENGまたはlicensorに帰属。公式legal noticeはcommercial copy/distribution、modify、repost不可・license grantedではないと明記。 |
| `policy:wandercraft:legal-notice:2026-07-15` | Wandercraft | https://en.wandercraft.eu/mentions-legales / https://en.wandercraft.eu/calvin-40 | Legal Noticeはsiteのimages等をWandercraftのexclusive propertyとし、構成要素のuse/reproductionはprior written consentなしには禁止。Photo/VideosはWandercraft credit。 |

## Candidate inventory

### agility-digit

確認ページ: https://www.agilityrobotics.com/ 、https://www.agilityrobotics.com/solutions 、https://www.agilityrobotics.com/sales 、https://www.agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada 、https://www.agilityrobotics.com/terms

公式home/solutionsはDigitを商用展開済みのgeneral-purpose humanoidとして扱い、manufacturing、warehouse、logistics、distributionを用途として示す。solutionsのDigit詳細は35 lb carrying capacity、4 hour battery、interchangeable end effectorsを記載する。画像URLは現行Webflow assetを再オープンした。世代名は画像単体に付かないため現行Digit familyとして保持する。

目視メタデータ: `Agility_Digit_07`はaltが「白いhead・teal torso・metallic legs、plain gray background」の立位機体、`digit-profile`はside view、`nrtl-final-cover`はyellow binsをwarehouseでstackingするDigit、sales画像はcrateを持つDigit、`Agility_Digit_01`はmetallic panelを扱うDigitのalt文脈。人物の有無、実際の背景・姿勢の細部は画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agility-digit:c1` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/699fdc1510423641b8d84d45_Agility_Digit_07.avif | 立位Digit、plain gray背景のproduct hero候補。人物はalt記載なし | Digit明記の公式home | `visual-unconfirmed` |
| `agility-digit:c2` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/698c88da0a3bf08e257409ea_digit-profile.jpg | Digitのside-view候補。背景はplain、人物はalt記載なし | Digit公式home | `visual-unconfirmed` |
| `agility-digit:c3` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/699fdc15e860d79128b81476_Agility_Digit_08.jpg | product cardのDigit。hero/transparent相当の切り抜き候補だが透明状態は未確認 | Digit公式solutions | `visual-unconfirmed` |
| `agility-digit:c4` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/698e0487862f6c968d491df9_69248ebe0a275215d37cd308_nrtl-final-cover.jpg | yellow binsをstackingするwarehouse/inOperation候補。人物はalt記載なし | Digit明記の公式solutions | `visual-unconfirmed` |
| `agility-digit:c5` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/699fdc15d1e9e4e839c2963f_Agility_Digit_06.jpg | crateを持つDigit。handling/inOperation候補。背景はgray文脈 | Digit公式sales | `visual-unconfirmed` |
| `agility-digit:c6` | https://cdn.prod.website-files.com/68d6ca150ffa11fdc25d7575/699fdc16d3c0aca895e5b80e_Agility_Digit_01.jpg | 金属panelを扱うDigit。endEffector/inOperation候補 | Digit公式solutions | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、透明背景、世代別variant、scale専用。Toyota pressはDigitのmanufacturing/supply-chain導入文脈を確認したが、記事の画像はlogos/banner中心で、別の機体assetとしては切り分けなかった。

### onex-neo

確認ページ: https://www.1x.tech/ 、https://www.1x.tech/discover/neo-home-robot 、https://www.1x.tech/discover/neo-factory 、https://www.1x.tech/press 、https://www.1x.tech/discover/introducing-neo-gamma 、https://www.1x.tech/terms-and-conditions

公式製品記事は現行NEOをhome robotとして、laundry folding、shelf organizing、home navigation、clothes rack、companion用途と説明する。NEO FactoryはNEOがfactory内でparts stocking、warehousing/logisticsを行うページ文脈を明記する。NEO Gammaは別世代のhome humanoidとして確認したが、現行NEO候補と混同しない。

目視メタデータ: current NEOのproduct画像はaltで「1X NEO Home Robot」「Clothes」「Companion」と区別され、Factory画像は「NEO Robot ... Working Inside A Factory」と明記される。Press galleryのNEO画像も再オープンしたが、画像単体の背景・人物有無・色variantは画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `onex-neo:c1` | https://www.1x.tech/_next/image?q=100&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2Fcbbb8e86aa20cb42945089e491d4aeeef52e7e2f-2048x1194.png%3Frect%3D0%2C68%2C2048%2C1058%26w%3D2400%26h%3D1240%26q%3D100%26fit%3Dmax%26auto%3Dformat&w=3840 | current NEO product image。hero/home候補 | `NEO Home Robot`明記 | `visual-unconfirmed` |
| `onex-neo:c2` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2F1f08ffa0334b26c239c82599f3d6e22536d083be-1100x655.jpg%3Fw%3D2440%26q%3D100%26fit%3Dmax%26auto%3Dformat&w=3840 | NEO clothes/clothes-rack文脈。home/inOperation候補 | current NEO product article | `visual-unconfirmed` |
| `onex-neo:c3` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2F95ebb85eb73c5aa395dd3646e9917e9af85230a7-1100x655.jpg%3Fw%3D2440%26q%3D100%26fit%3Dmax%26auto%3Dformat&w=3840 | NEO companion文脈。home/scale候補 | current NEO product article | `visual-unconfirmed` |
| `onex-neo:c4` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2F9b2e774a3cbe73de3b7d4bb7beaae79fe43c8cfe-2559x1440.jpg%3Fw%3D2440%26q%3D100%26fit%3Dmax%26auto%3Dformat&w=3840 | NEO factory内作業。industrial/inOperation候補。factory背景文脈、人物はalt未記載 | NEO Factoryページ明記 | `visual-unconfirmed` |
| `onex-neo:c5` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2F32aad1c5c00b8a98d984852682f6e3c04976a78c-1920x1079.png%3Ffit%3Dmax%26auto%3Dformat&w=3840 | 1X Press galleryのNEO collection image。press/hero候補 | NEO collection、画像単体の色・世代は未分離 | `family-only` |

role未発見: current NEOの画素で確定した正面/側面、人物有無、transparent、色別asset。Press galleryの利用条件はニュース媒体の編集記事に限定され、Deploidでの表示許諾を意味しない。

### boston-dynamics-atlas

確認ページ: https://bostondynamics.com/products/ 、https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/ 、https://bostondynamics.com/news/introducing-electric-atlas/ 、https://bostondynamics.com/wp-content/uploads/2026/01/atlas-spec-sheet.pdf 、https://bostondynamics.com/faq/ 、https://bostondynamics.com/terms/

公式blogは2026 product versionのfully electric Atlasをmanufacturing、material handling、order fulfilment向けenterprise humanoidとして明記する。ProductsページはAtlasをindustrial revolution/enterprise humanoidとして掲載し、spec sheetは1.9m、90kg、56 DoF、50kg instant/30kg sustained、2–4h battery、360° camera等を記載する。hydraulic Atlasとelectric Atlasを同一候補に混ぜず、ページごとの世代文脈を残した。

目視メタデータ: blog画像altは「Atlas robotのthree-quarters profile」、news画像altは「new electric Atlasのfaceplate warm yellow light」。背景・人物有無・実際の構図は画素未取得。PDFは仕様確認のみで、PDFのスクリーンショットを画像候補にはしていない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `boston-dynamics-atlas:c1` | https://bostondynamics.com/wp-content/uploads/2026/01/atlas-announcement.jpg | New Atlas product announcement。three-quarters/hero候補 | product version Atlas明記の公式blog | `visual-unconfirmed` |
| `boston-dynamics-atlas:c2` | https://bostondynamics.com/wp-content/uploads/2024/04/atlas-yellow.jpg | electric Atlasの顔面・yellow light文脈。hero/detail候補 | Introducing Electric Atlasページ | `visual-unconfirmed` |
| `boston-dynamics-atlas:c3` | https://bostondynamics.com/wp-content/uploads/2025/03/atlas-tire.jpg | Atlas product pageのfeature image。industrial/mobility候補 | ProductsページのAtlas section文脈 | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、透明背景、side、endEffector、scale。FAQはAtlasがearly commercial journeyで、製品はcommercial/industrial/enterprise/university research向けと確認したが、画像再利用許諾とは別である。

### tesla-optimus

確認ページ: https://www.tesla.com/AI?redirect=no 、https://www.tesla.com/ns_videos/2024-tesla-impact-report-highlights.pdf 、https://www.tesla.com/legal/additional-resources 、https://www.tesla.com/legal/terms

公式AI & RoboticsページはTesla Optimusをgeneral-purpose、bi-pedal、autonomous humanoidとして、unsafe/repetitive/boring tasks向けに説明する。Impact Reportはwork/homeでtime-consuming、unsafe、repetitive tasksを自動化するautonomous humanoidとして補強する。ページはOptimusの世代名を指定しない。

目視メタデータ: AIページのaltは「Tesla Bot」。画像URLを再オープンしたが、背景・人物有無・機体世代は画素未取得。Impact ReportはPDF本文を確認したが、画像URLとして抽出・保存していない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `tesla-optimus:c1` | https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto%2Cq_auto/Tesla-Bot-AI.jpg | Tesla AI & RoboticsページのTesla Bot。hero候補 | Tesla Optimus見出しと同一ページ | `family-only` |

role未発見: Optimus世代を画像単体で特定したside/transparent/scale/endEffector、人物有無。公式AIページは候補経路として残し、rights clearance済みとは扱わない。

### kepler-k2

確認ページ: https://www.gotokepler.com/productDetailK2?id=2 、https://www.gotokepler.com/productDetail 、https://www.gotokepler.com/about 、https://www.gotokepler.com/news 、https://www.gotokepler.com/contact?type=ordering 、https://developer.gotokepler.com/apps/cmros/home/resourceCenter

公式検索表示・ページ文脈はK2を`KEPLERBOT Forerunner K2`として、1-hour charge/8-hour endurance、175cm/75kg、52 DoF、25–30kg dual-arm handling、bipedal/wheeled/basic versions、intelligent manufacturing、warehousing/logistics、specialized industries、research/educationを記載する。Product URLをブラウザで開くとJS未実行のため本文・画像URLは返らず、検索表示で製品文脈のみ再確認できた。公式newsはreviewed pageで`Coming soon`、別media/press画像assetは公開経路から分離できなかった。

目視メタデータ: 公式ページ内にhero、version configuration、industrial、warehouse、research/educationの画像位置があることは検索表示で確認したが、直接asset URLと画素は取得できない。bipedal/wheeled/basicのvariantはページ内で併記され、候補画像単体との対応は曖昧。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `kepler-k2:c1` | —（公式ページ内画像。reviewed browserでは直接asset URL未露出） | K2 product hero、bipedal/wheeled/basic version configuration。industrial/warehouse/research role候補 | K2 product URL・検索表示は明記、画像variantは未分離 | `not-found-on-reviewed-pages` |
| `kepler-k2:c2` | —（公式ページ内画像。直接asset URL未露出） | K2のhuman-like joints、skeletal structure、perception、actuator feature。technical/endEffector候補 | K2 product page文脈 | `not-found-on-reviewed-pages` |
| `kepler-k2:c3` | —（公式ページ内画像。直接asset URL未露出） | K2のintelligent manufacturing、warehousing/logistics、research/education用途画像。inOperation/scale候補 | K2 product page文脈 | `not-found-on-reviewed-pages` |

role未発見: 実画像URL、画像ピクセルで確認した背景・人物有無、bipedal/wheeled/basicの個別対応。公式ページにvisualがあることを理由にasset URLや許諾を推測していない。`no-usable-candidate`は未使用。

### xpeng-iron

確認ページ: https://www.xiaopeng.com/airobot.html 、https://www.xpeng.com/nl/model/ai-robot 、https://www.xpeng.com/pressroom/news/019a56f54fe99a2a0a8d8a0282e402b7 、https://www.xiaopeng.com/news/company_news/5511.html 、https://www.xpeng.com/user-agreement 、https://www.xpeng.com/ie/legal-notices

公式AI robot pageはIRONを「最も人間らしい」humanoidとして、appearance、hands、conversation、walking、private guide、smart tour、professional patrolを示す。Global pressroomは2025 AI DayのNext-Gen IRONを、82 DoF、22 DoF hands、flexible skin、commercial guide/tour/traffic diversion、Baosteel inspection等の文脈で説明する。中国公式newsも同イベントのIRONを確認する。

目視メタデータ: 公式画像のasset名は`Humanoid-Appearance`、`Humanoid-Hands`、`Humanoid-Conversation`、`Humanoid-Walking`とroleを区別する。press画像はNext-Gen IRON sectionの画像で、AI Day/event文脈。人物・会場・背景の細部は画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `xpeng-iron:c1` | https://s-cdn.xpeng.com/commoncms/prod/2026-03-02/1ec39a3989a24d0b80d22d7c7db62f71.jpg?name=Humanoid-Appearance-ai-robot | IRON humanoid appearance。hero候補 | 公式AI robot pageのIRON | `visual-unconfirmed` |
| `xpeng-iron:c2` | https://s-cdn.xpeng.com/commoncms/prod/2026-03-02/653485b4fc39442989b5cf0161e1d601.jpg?name=Humanoid-Hands-ai-robot | IRON hands。endEffector/detail候補 | 公式AI robot pageのIRON | `visual-unconfirmed` |
| `xpeng-iron:c3` | https://s-cdn.xpeng.com/commoncms/prod/2026-03-02/8a81073a7a5e4074854c8812d7df49ac.jpg?name=Humanoid-Conversation-ai-robot | IRON conversation/interaction。inOperation候補 | 公式AI robot pageのIRON | `visual-unconfirmed` |
| `xpeng-iron:c4` | https://s-cdn.xpeng.com/commoncms/prod/2026-03-02/9cfb0970900a4f848d1c5d757f6cfa14.jpg?name=Humanoid-Walking-ai-robot | IRON walking。mobility候補 | 公式AI robot pageのIRON | `visual-unconfirmed` |
| `xpeng-iron:c5` | https://s-cdn.xpeng.com/xpwebsite/prod/2025-11-06/4280fecb9cd04fa3a64acbeac0e0cf8f.png | AI Day press image。hero/press候補、Next-Gen IRON section | Next-Gen IRONの公式pressroom | `visual-unconfirmed` |
| `xpeng-iron:c6` | https://s-cdn.xpeng.com/xpwebsite/prod/2025-11-06/094e4fd50fbc46d2ae60cf6496813c88.png | AI Day press image。event/scale候補 | Next-Gen IRONの公式pressroom | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、第一世代/Next-Genの画像単体判別、transparent/side/scaleの専用asset。XPENGのvehicle-related user agreementとlegal noticeを画像利用許諾へ拡張しない。

### kepler-k1

確認ページ: https://gotokepler.com/productDetailK1 、https://www.gotokepler.com/productDetail 、https://www.gotokepler.com/about 、https://www.gotokepler.com/news 、https://developer.gotokepler.com/apps/cmros/home/resourceCenter

公式K1 URLの検索表示はForerunner seriesを178cm/85kg/40 DoF/100 TOPSとして、education & research、smart inspection、automated production line、warehousing/logistics、high-risk environment、outdoor tasksを用途に列挙する。本文はseries共通説明とK1 URLの組み合わせで、画像がK1専用かは分離できない。K2と同様、reviewed browserではJS未実行のため直接画像URLは露出しなかった。

目視メタデータ: product pageのhero、visual perception、flexible hand、walking、inspection/production/outdoor用途の画像位置は検索表示で確認したが、背景・人物有無・K1専用variantの画素確認はできない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `kepler-k1:c1` | —（公式K1ページ内画像。reviewed browserでは直接asset URL未露出） | Forerunner series hero、standing/transparent相当候補 | K1 URLだが本文・画像はseries共通 | `not-found-on-reviewed-pages` |
| `kepler-k1:c2` | —（公式K1ページ内画像。直接asset URL未露出） | visual perception、flexible hand、walking。technical/endEffector/mobility候補 | K1 page family、画像専用variant不明 | `family-only` |
| `kepler-k1:c3` | —（公式K1ページ内画像。直接asset URL未露出） | inspection、production line、warehouse/logistics、high-risk/outdoor。inOperation/scale候補 | K1 page family | `family-only` |

role未発見: K1の直接画像URL、画素で確認した人物有無・背景、K1専用transparent/side/scale。公式経路の追加確認対象として残し、`no-usable-candidate`は未使用。

### wandercraft-calvin

確認ページ: https://en.wandercraft.eu/calvin-40 、https://en.wandercraft.eu/blog/news 、https://www.wandercraft.eu/articles/renault-group-finalises-a-strategic-partnership-with-wandercraft 、https://www.wandercraft.eu/articles/wandercraft-and-sapa-announce-deployment-partnership-in-industrial-manufacturing-cementing-europes-emerging-championship-in-the-humanoids-race 、https://en.wandercraft.eu/mentions-legales

Calvin-40公式製品ページはheavy-load、precision tasks、factory/logistics、assembly-line production、8–22 hours/day、industrial navigation/safetyを明記する。公式newsはRenault提携、SAPA manufacturing deploymentを掲載し、Calvin-40のindustrial humanoid／factory文脈を確認できる。

目視メタデータ: product pageの`CALVIN 05 walking.png`はwalking/mobility文脈、Renault提携記事の画像はCalvin-40 partnership/press文脈。人物・工場背景・機体の細部は画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `wandercraft-calvin:c1` | https://cdn.prod.website-files.com/622f44804ae66481b4e5532d/6a310e1aec7dbcbab8f221d7_CALVIN%2005%20walking.png | Calvin walking。mobility/hero候補 | Calvin-40公式product page | `visual-unconfirmed` |
| `wandercraft-calvin:c2` | https://cdn.prod.website-files.com/62362d41598eaaeb495b3d62/6842221cab1642d0276aaaa_renault%20group%20x%20wandercraft.jpg | Renault Group × Wandercraft press image。industrial/scale/press候補 | Calvin-40公式press記事 | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、factory scene、transparent/side/endEffector。Legal NoticeのPhoto creditsはWandercraftであり、表示用の公開許諾ではない。

### onex-eve

確認ページ: https://www.1x.tech/eve 、https://www.1x.tech/press 、https://www.1x.tech/terms-and-conditions 、https://www.1x.tech/legal

1X公式EVEページは見出しを`Eve Industrial`とし、Press galleryにも`EVE Industrial` collection（6 images / 1 video）を掲載する。NEOとEVEを同一画像へ統合せず、EVEはindustrial/fleet/inOperation候補として分けた。Press galleryの条件はonex-neoと同じ1X policy IDを再利用する。

目視メタデータ: EVEページのvideo thumbnailとPress galleryのEVE Industrial画像URLをブラウザで再オープンした。EVE Industrialというページ文脈は確認できるが、人物、工場・倉庫背景、機体の構図は画素未取得。WandercraftのEve（personal exoskeleton）とは別メーカー・別製品である。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `onex-eve:c1` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fimage.mux.com%2Fuw4pe1rSWH6ho4sahqI5VFAJskWuNEaQYlxsqxYONSY%2Fthumbnail.webp%3Fwidth%3D1920%26height%3D1080%26time%3D0&w=3840 | EVE Industrial pageのvideo thumbnail。hero/inOperation候補 | EVE Industrialページ | `visual-unconfirmed` |
| `onex-eve:c2` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2Fefda54ece424abb58c7bd887ea0a263fc730f12c-2480x1460.png%3Ffit%3Dmax%26auto%3Dformat&w=3840 | Press gallery EVE Industrial image。industrial/hero候補 | EVE Industrial collection | `visual-unconfirmed` |
| `onex-eve:c3` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2F5f8053806272114ee891bba1091ceddca06c32af-1920x1281.png%3Ffit%3Dmax%26auto%3Dformat&w=3840 | Press gallery EVE Industrial image。inOperation/scale候補 | EVE Industrial collection | `visual-unconfirmed` |
| `onex-eve:c4` | https://www.1x.tech/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqka6yvsc%2Fproduction%2Fd40fa251392c260a9a9edb0eccd0130ce8f381f4-2480x1460.png%3Ffit%3Dmax%26auto%3Dformat&w=3840 | Press gallery EVE Industrial image。industrial/action候補 | EVE Industrial collection | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、factory/warehouse背景、transparent/side/scale。1X press galleryのeditorial-only条件をcommercial-permittedや明示許諾済みとは言い換えない。

## B5の扱い

- 9機体分の公式製品・media/press・legal経路を確認し、候補URLと画像roleを保存した。
- Kepler K1/K2は公式ページに候補visualの文脈があるが、直接asset URLがreviewed browserへ露出しないため、ページ候補を失わず `not-found-on-reviewed-pages` / `family-only` とした。
- `no-usable-candidate`は使用していない。候補の公開可否・rights.status・許諾の有無は確定していない。
- 既存のreference-attributed画像baselineおよびstructured logo baselineには触れていない。
