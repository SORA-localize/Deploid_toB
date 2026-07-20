---
status: plan
updated: 2026-07-20
---

# B4 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `neura-4ne-1`, `leju-kuavo`, `pal-talos`, `pal-kangaroo`, `leju-kuavo5`, `engineai-se01`, `engineai-pm01`, `engineai-t800`, `engineai-sa01`, `robotera-l7`, `robotera-q5`, `robotera-m7`, `galbot-g1`
- 作業範囲: 公式製品ページ、公式media/newsページ、公式利用規約、原典画像URLの確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の変更、rights変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の記録

列挙した画像URLはブラウザ経由で再オープンした。画像URLの到達先、Content-Type、公式ページ上の見出し、alt/caption、画像のページ位置は確認できたが、この閲覧環境では画像バイナリを保存せずに画素をAIへ転送する結果が返らなかった。したがって、画素に依存する背景の細部、人物の有無、側面・透明背景・切り抜き状態は断定せず、該当候補を `visual-unconfirmed` とした。

ページのcaption・見出しが人物、会場、倉庫、展示会などを明示する場合は「ページ文脈」として記録し、画素を見たという意味にはしていない。variant名がページと画像経路で分離できない場合は `family-only` とした。公式ページに製品visualはあるが直接asset URLが露出しなかった場合は、原典ページを候補URLとして残し、`not-found-on-reviewed-pages` を「公式経路に候補が存在しない」という最終判断には使っていない。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:neura:site-terms:2026-07-15` | NEURA Robotics | https://neura-robotics.com/legal/ / https://neura-robotics.com/terms-conditions/ | Legalページはサイトの文章・画像・動画等を著作権等で保護し、著作権法で許される範囲を超える複製・配布・改変・利用には権利者の事前書面同意が必要、明示がある場合を除きdownload/copyは私的・非商用に限ると記載。商用画像ライセンスは確認できない。 |
| `policy:leju:site-terms:2026-07-15` | Leju Robotics | https://lejurobot.cn/en / https://lejurobot.cn/en/about-us/community-service | 公式ページの著作権表示は確認したが、画像再利用を許可する公開terms/licenseページはreviewed pagesで確認できなかった。画像権利は未確定。 |
| `policy:pal:site-terms:2026-07-15` | PAL Robotics | https://pal-robotics.com/terms-conditions/ / https://pal-robotics.com/brand-guide/ | TermsはB2B電子商取引条件、Brand Guideは公式ロゴのダウンロードと改変禁止等を記載するが、製品画像の再利用許諾は確認できない。商用画像許可とは扱わない。 |
| `policy:engineai:site-terms:2026-07-15` | ENGINEAI | https://www.engineai.com.cn/policies-and-terms.html?pageid=90 / https://www.engineai.com.cn/policy | 製品安全使用・免責、利用者サービス、知的財産、改装・輸出管理等の規定を確認した。掲載画像の再利用ライセンスは確認できない。 |
| `policy:robotera:site-policy:2026-07-15` | ROBOTERA | https://www.robotera.com/policy.html / https://www.robotera.com/en/download1.html | 公式policy/copyrightページとDownload Centerを確認したが、製品画像の再利用を許可する公開ライセンスは確認できない。 |
| `policy:galbot:site-terms:2026-07-15` | Galbot | https://developer.galbot.com/privacy / https://developer.galbot.com/terms / https://developer.galbot.com/docs/g1/2.2.4/zh/g1 | Developer Platformのprivacy/terms導線とG1マニュアルを確認した。マニュアルは利用条件・安全・保証を示すが、公式製品画像の再利用許諾は確認できない。 |

## Candidate inventory

### neura-4ne-1

確認ページ: https://neura-robotics.com/products/4ne1/ 、https://neura-robotics.com/press/ 、https://neura-robotics.com/neura-sap-bitzer-redefining-logistics/ 、https://neura-robotics.com/neura-robotics-launches-technological-revolution/ 、https://neura-robotics.com/legal/ 、https://neura-robotics.com/terms-conditions/

製品ページは4NE1を180cm/80kg、10–100kg payload表記、5km/h、交換式forearms、産業・家庭用途、wheeled/7th-axis等のモデル差として説明する。予約ページは現行visualを4NE1 Gen 3.5として説明するため、旧ニュース画像をGen 3.5専用とは断定しない。物流記事は4NE1と倉庫・SAP/BITZER連携を明記する。

目視メタデータ: 製品ページとニュースの画像URLを再オープンした。物流記事のcaptionは「NEURA SAP Bitzer industrial logistics 4NE1」、別press記事のcaptionは「4NE1 David Reger Automatica 2025」と明記するため、倉庫／Automatica・人物をページ文脈として記録できる。画素自体はAIへ返らず、背景の細部・人物の実際の写り込みは未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `neura-4ne-1:c1` | https://neura-robotics.com/wp-content/uploads/2025/06/4NE1_David_Reger_Automatica2025_NEURA_Robotics_Print_Resolution3-1024x683.webp | 4NE1とDavid Reger、Automatica 2025の公式press image。hero/press候補。人物・会場はcaption文脈 | 4NE1明記 | `visual-unconfirmed` |
| `neura-4ne-1:c2` | https://neura-robotics.com/wp-content/uploads/2025/06/Automatica_NEURA_Robotics_David_Reger-1024x683.webp | Automatica 2025の公式press image。press/inOperation候補。人物・展示会文脈 | 4NE1ニュースページ文脈、画像単体のvariantは未分離 | `family-only` |
| `neura-4ne-1:c3` | https://neura-robotics.com/wp-content/uploads/2025/06/Automatica_2025_4NE1_David_Reger_NEURA_Robotics-1024x683.webp | 4NE1・David Reger・Automatica 2025のpress image。hero/scale候補 | 4NE1明記caption | `visual-unconfirmed` |
| `neura-4ne-1:c4` | https://neura-robotics.com/wp-content/uploads/2025/06/Automatica_2025_Launch_NEURA_Robotics-1-1024x683.webp | Automatica 2025 launch image。hero/press候補。会場文脈 | 4NE1ニュース文脈、Gen/variantは未分離 | `family-only` |
| `neura-4ne-1:c5` | https://neura-robotics.com/wp-content/uploads/2025/11/NEURA_SAP_Bitzer_Logistics_Blogpost_Image002-1024x542.png | SAP/BITZER倉庫物流の4NE1画像。inOperation/industrial候補。倉庫文脈 | 4NE1明記caption | `visual-unconfirmed` |
| `neura-4ne-1:c6` | https://neura-robotics.com/wp-content/uploads/2025/11/NEURA_SAP_Bitzer_Logistics_Blogpost_Image001-1024x542.png | 同物流記事の別4NE1画像。inOperation/scale候補。倉庫文脈 | 4NE1明記記事 | `visual-unconfirmed` |

role未発見: 画素で確定したtransparent/side/scale切り抜き、人物有無、Gen 1/2/3.5の画像単体識別。公式legalは権利者同意を要求しており、許諾済みとは扱わない。

### leju-kuavo

確認ページ: https://lejurobot.cn/en 、https://lejurobot.cn/en/news/media-news 、https://lejurobot.cn/en/about-us/community-service 、https://kuavo.lejurobot.com/leju_website/images/d86398ca643cd7598436aebf31d2ce68.png 、https://kuavo.lejurobot.com/leju_website/images/054138ca486e6d58f09da19d964772d6.png 、https://kuavo.lejurobot.com/leju_website/images/5e1133f6ed346b7b406dc0ad131eec63.png

公式homeはGeneral-Purpose Humanoid Robot SeriesとしてKUAVO 4ProとKUAVO 5 / 5-Wを表示し、研究、商用サービス、製造、training groundを用途として示す。media-newsは公式のメディア報道一覧だが、記事リンクの多くは外部報道・WeChatで、公式サイト内の追加画像assetはreviewed pagesでは分離できなかった。Resource Centerは製品資源・マニュアル導線を確認した。

目視メタデータ: homepage bannerと、KUAVO 4Pro／KUAVO 5 / 5-Wに隣接するrobot card画像を再オープンした。研究・商用サービス・製造・training groundの画像はページ見出しで場面roleを特定できる。背景、人物有無、機体の正面／側面は画素未取得のため未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `leju-kuavo:c1` | https://kuavo.lejurobot.com/leju_website/images/d86398ca643cd7598436aebf31d2ce68.png | Leju公式homepage banner。hero候補 | KUAVO seriesのhome文脈 | `family-only` |
| `leju-kuavo:c2` | https://kuavo.lejurobot.com/leju_website/images/054138ca486e6d58f09da19d964772d6.png | homepageのKUAVO robot card。hero/side候補 | KUAVO 4Pro／5系カード文脈、画像単体のvariant分離なし | `family-only` |
| `leju-kuavo:c3` | https://kuavo.lejurobot.com/leju_website/images/5e1133f6ed346b7b406dc0ad131eec63.png | homepageの別KUAVO robot card。hero/side候補 | KUAVO 4Pro／5系カード文脈、画像単体のvariant分離なし | `family-only` |
| `leju-kuavo:c4` | https://kuavo.lejurobot.com/leju_website/images/0001c4c7b73c427747d8859d5b8a666a.jpg | Research Scenario Solutions。research/inOperation候補 | KUAVO homeの用途セクション | `visual-unconfirmed` |
| `leju-kuavo:c5` | https://kuavo.lejurobot.com/leju_website/images/b64188f947892a0fb6bcd4d40499fc3a.jpg | Business Service Solutions。commercial/scale候補 | KUAVO homeの用途セクション | `visual-unconfirmed` |
| `leju-kuavo:c6` | https://kuavo.lejurobot.com/leju_website/images/dbcecfa7ec47d77dc387477145000464.jpg | Industrial Scenario Solutions。industrial/inOperation候補 | KUAVO homeの用途セクション | `visual-unconfirmed` |

role未発見: KUAVO genericに対するtransparent、endEffector、scaleの専用画像URL、画像ピクセルで確認した人物有無。KUAVO 5 / 5-Wを4Proや他KUAVO世代へ言い換えない。

### pal-talos

確認ページ: https://pal-robotics.com/robot/talos/ 、https://pal-robotics.com/resource-type/datasheet/ 、https://pal-robotics.com/brand-guide/ 、https://pal-robotics.com/terms-conditions/ 、https://pal-robotics.com/privacy-policy/

TALOSページは1.75m、95kg、片腕6kg、walking biped、完全ROS開発、torque control、EtherCAT、customizable head/gripperを記載する。Brand Guideは公式ロゴの使用方法を説明するが、製品画像の再利用許諾ではない。

目視メタデータ: 製品ページのhero、特徴画像、payload/WBC画像を再オープンした。ページ見出しからtorque、EtherCAT、6kg payload、Whole Body Controlのroleを特定できる。背景・人物有無・画像内の機体構図は画素未取得のため未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `pal-talos:c1` | https://pal-robotics.com/wp-content/uploads/2024/04/TALOS-Robot-918x1024.webp | TALOS製品ページmain。hero候補 | TALOS明記ページ | `visual-unconfirmed` |
| `pal-talos:c2` | https://pal-robotics.com/wp-content/uploads/2024/04/TALOS-Robot-538x600.webp | TALOS製品ページsecondary image。side/hero候補 | TALOS明記ページ | `visual-unconfirmed` |
| `pal-talos:c3` | https://pal-robotics.com/wp-content/uploads/2024/04/TALOS-features-torque-529x600.webp | torque-control feature。technical/endEffector候補 | TALOS明記feature | `visual-unconfirmed` |
| `pal-talos:c4` | https://pal-robotics.com/wp-content/uploads/2024/04/TALOS-features-payload-529x600.webp | 6kg payload feature。inOperation/endEffector候補 | TALOS明記feature | `visual-unconfirmed` |
| `pal-talos:c5` | https://pal-robotics.com/wp-content/uploads/2024/04/TALOS-wbc-2-scaled.webp | Whole Body Control section。technical/inOperation候補 | TALOS明記section | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、transparent、scale。TALOSページのcustomizable head/gripperは仕様説明であり、画像の利用許諾ではない。

### pal-kangaroo

確認ページ: https://pal-robotics.com/robot/kangaroo/ 、https://pal-robotics.com/datasheet/kangaroo/ 、https://pal-robotics.com/brand-guide/ 、https://pal-robotics.com/terms-conditions/ 、https://pal-robotics.com/privacy-policy/

KANGAROOはdevelopment-ready humanoidとしてdynamic locomotion、reinforcement learning、embodied AIを用途にし、1.58m、50–65kg、14–40 DoF、4 RGB-D cameras、3時間、自走・running・jumping・stairs・dance・box pickingを記載する。datasheetはarm/end-effector等のplatform configurationを列挙するため、画像単体でLite/Standard/Pro相当を分離しない。

目視メタデータ: hero、run、technical-spec、actuator/materials系の画像URLを再オープンした。ページ見出し・datasheetからmobility、research、technicalのroleを特定できる。背景・人物有無・platform configurationは画素未取得のため未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `pal-kangaroo:c1` | https://pal-robotics.com/wp-content/uploads/2025/10/KOO-7DoF-1-644x1024.png | KANGAROO product hero/7DoF arm configuration候補 | KANGAROO product page | `family-only` |
| `pal-kangaroo:c2` | https://pal-robotics.com/wp-content/uploads/2025/01/KOO-Run-1-scaled-e1760633002197-535x600.png | KANGAROO run/action image。mobility/inOperation候補 | KANGAROO product page | `family-only` |
| `pal-kangaroo:c3` | https://pal-robotics.com/wp-content/uploads/2025/01/TechSpecsKOO-2-scaled.webp | KANGAROO technical specification image。technical/side候補 | KANGAROO datasheet/page | `family-only` |
| `pal-kangaroo:c4` | https://pal-robotics.com/wp-content/uploads/2025/01/Kangaroo-Actuators.gif | actuator feature。technical/mobility候補 | KANGAROO feature section | `visual-unconfirmed` |
| `pal-kangaroo:c5` | https://pal-robotics.com/wp-content/uploads/2025/04/Kangaroo-Pro-Standing-Up.gif | standing-up demo。mobility/inOperation候補 | KANGAROO feature section、Pro表記あり | `visual-unconfirmed` |
| `pal-kangaroo:c6` | https://pal-robotics.com/wp-content/uploads/2025/01/Materials-Legs.gif | leg materials feature。technical/mobility候補 | KANGAROO feature section | `visual-unconfirmed` |

role未発見: platform variant別のtransparent/side/scale、人物有無。KANGAROOは候補素材として保持し、Brand Guideのロゴ利用説明を製品画像の許諾へ拡張しない。

### leju-kuavo5

確認ページ: https://lejurobot.cn/en 、https://lejurobot.cn/en/news/media-news 、https://lejurobot.cn/en/about-us/community-service 、https://kuavo.lejurobot.com/leju_website/images/5e1133f6ed346b7b406dc0ad131eec63.png 、https://www.lejurobot.cn/zh/application/kuavo-my

公式homepageはKUAVO 5 / 5-WをFull Sizeとして明示し、研究・商用・製造・training groundの用途を示す。reviewed product link `/products/kuavo-my` は閲覧環境でcache missとなったが、検索結果と公式home上のラベル・画像経路は確認できた。KUAVO 5と5-Wの区別はページラベルに併記され、画像単体では分離できない。

目視メタデータ: KUAVO 5 / 5-Wカードに対応する画像URLと、KUAVO用途画像を再オープンした。画像の背景・人物有無・5/5-Wの車輪形態は画素未取得のため未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `leju-kuavo5:c1` | https://kuavo.lejurobot.com/leju_website/images/5e1133f6ed346b7b406dc0ad131eec63.png | 公式homepageのKUAVO 5 / 5-W card候補。hero/side候補 | KUAVO 5 / 5-Wラベル隣接、5と5-Wは分離不能 | `family-only` |
| `leju-kuavo5:c2` | https://kuavo.lejurobot.com/leju_website/images/0001c4c7b73c427747d8859d5b8a666a.jpg | research scenario。research/inOperation候補 | KUAVO 5 / 5-Wを含むhome用途文脈 | `visual-unconfirmed` |
| `leju-kuavo5:c3` | https://kuavo.lejurobot.com/leju_website/images/b64188f947892a0fb6bcd4d40499fc3a.jpg | business service scenario。commercial/scale候補 | KUAVO home用途文脈、5/5-W専用とは未分離 | `visual-unconfirmed` |
| `leju-kuavo5:c4` | https://kuavo.lejurobot.com/leju_website/images/dbcecfa7ec47d77dc387477145000464.jpg | industrial manufacturing scenario。inOperation候補 | KUAVO home用途文脈、5/5-W専用とは未分離 | `visual-unconfirmed` |

role未発見: KUAVO 5と5-Wを画像単体で分離したtransparent、side、scale、wheel/base特化画像。現時点では5/5-W familyとして扱う。

### engineai-se01

確認ページ: https://en.engineai.com.cn/product-se01.html 、https://en.engineai.com.cn/about-news-media/37.html 、https://www.engineai.com.cn/policies-and-terms.html?pageid=90 、https://www.engineai.com.cn/policy

SE01公式製品ページはfull-size general-purpose humanoid、human-like proportions、aircraft-grade aluminum、self-developed joints、Engine Sense perception、five-finger dexterity、高容量batteryを記載する。T800ページ等と同じENGINEAI policyを再利用する。

目視メタデータ: SE01 hero、human-like structure、perception、dexterous handの画像URLを再オープンした。ページ見出しからhero/feature/endEffectorを割り当てた。背景・人物有無は画素未取得のため未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `engineai-se01:c1` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251113/c3e1908e9fabc41d0cb09e7e0a5f2425.jpg | SE01 main/hero image | SE01明記 | `visual-unconfirmed` |
| `engineai-se01:c2` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251113/89ce726444ade54955aac47be532ddff.jpg | human-like structure feature。hero/side候補 | SE01明記feature | `visual-unconfirmed` |
| `engineai-se01:c3` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251112/7e58900a05e452be5b5f151224f3d878.jpg | Engine Sense/perception feature。technical候補 | SE01明記feature | `visual-unconfirmed` |
| `engineai-se01:c4` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251113/30e9bc8080dd3accb061d511ff094aa5.jpg | official SE01 feature/hand or body detail候補 | SE01製品ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、transparent、scale。掲載ページの「open-source」「technical」表現を画像利用許諾と解釈しない。

### engineai-pm01

確認ページ: https://en.engineai.com.cn/product-pm01.html 、https://www.engineai.com.cn/product-support-pm01.html 、https://www.engineai.com.cn/policies-and-terms.html?pageid=90 、https://www.engineai.com.cn/policy

PM01公式ページはlightweight/highly dynamic/fully open embodied agent、≥23 DoF、320° waist rotation、interactive core display、training/deployment code supportを記載する。support pageはPM01 manual、操作指南、unboxing video、software updatesを確認できる。PM01のcommercial/education edition差は、画像単体で分離できない場合family-onlyとする。

目視メタデータ: hero、actuator、mobility、forward somersault、run、greet、walking、axe dance、mechanical aestheticsの画像URLを再オープンした。ページ見出しで場面roleは特定できるが、人物・背景は画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `engineai-pm01:c1` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251201/514fba4aa34753f7c0b87ecb81fe6044.PNG | PM01 product hero | PM01明記 | `family-only` |
| `engineai-pm01:c2` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251107/3c845a1a54b878d695fc4958b5530afb.jpg | agile embodied agent feature。mobility/inOperation候補 | PM01明記feature | `visual-unconfirmed` |
| `engineai-pm01:c3` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251113/dc998c09a1d5d891b5f9d087f2391221.jpg | PM01 mobility/action feature。run/dance候補 | PM01明記ページ | `visual-unconfirmed` |
| `engineai-pm01:c4` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251107/4e53ed8a1471d24b15c1172304d25fe1.jpeg | interactive core/technical feature候補 | PM01明記ページ | `visual-unconfirmed` |
| `engineai-pm01:c5` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251113/30e9bc8080dd3accb061d511ff094aa5.jpg | mechanical aesthetics/detail候補 | PM01明記section | `visual-unconfirmed` |

role未発見: commercial/education editionの画像単体識別、transparent、scale、人物有無。PM01のopen-source表現はコード・開発環境の説明であり、画像権利の明示許諾ではない。

### engineai-t800

確認ページ: https://en.engineai.com.cn/product-t800.html 、https://en.engineai.com.cn/about-news-media/37.html 、https://www.engineai.com.cn/policies-and-terms.html?pageid=90 、https://www.engineai.com.cn/policy

T800は173cm、29 DoF（dexterous hand除く）、全方向感知、4時間連続運転、450N·m torque、Basic/Max等のeditionを記載する。製品ページはmartial arts、dexterous manipulation、logistics warehouse、hotel services、sales associate、human-robot collaborationを用途画像の見出しとして掲載する。editionは画像単体で分離できないためfamily-only候補を残す。

目視メタデータ: T800 hero、born-to-disrupt、motion demo、warehouse/hotel/sales/human collaborationの画像URLを再オープンした。ページ見出しからmobility/inOperation/scaleを割り当てた。人物有無・背景・editionは画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `engineai-t800:c1` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251107/3c558d73c8699d1dad7e616e33b6388b.jpg | T800 product hero/overview | T800明記 | `family-only` |
| `engineai-t800:c2` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/static/home/images/prweebanner1.jpg | T800 born-to-disrupt/banner候補 | T800製品ページ | `family-only` |
| `engineai-t800:c3` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251201/1f9fca8ac08323e05bdf9fa156cb8bff.jpg | T800 technical/feature image | T800明記feature | `visual-unconfirmed` |
| `engineai-t800:c4` | https://en.engineai.com.cn/product-t800.html | logistics warehouse、hotel、sales associate、human-robot collaborationのページ内visual。直接asset URLはreviewed resultで追加露出なし | T800明記ページ | `visual-unconfirmed` |

role未発見: Basic/Max等editionを画像単体で分離したtransparent/side/scale、人物有無。T800の「product terms and policies」参照は画像利用許諾ではない。

### engineai-sa01

確認ページ: https://en.engineai.com.cn/product-sa01.html 、https://www.engineai.com.cn/product-support-sa01.html 、https://www.engineai.com.cn/policies-and-terms.html?pageid=90 、https://www.engineai.com.cn/policy

SA01はopen-source、highly expandable bipedal platform、12 DoF、約40kg、約1m/s、15Ah battery、10–15kg load capacity、black-and-white body with orange accentsを公式ページで確認した。support pageはSA01 manual・operating videoの導線を確認した。

目視メタデータ: SA01 hero、open-source design、front/back、power joint、upright posture、motor、battery、12 DoF、aluminum exoskeletonの画像URLを再オープンした。ページ見出しでtechnical/endEffector/mobility roleを特定できる。人物・背景は画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `engineai-sa01:c1` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20251124/5bbc48aee70649ed84358798789f9bca.png | SA01 main/hero | SA01明記 | `visual-unconfirmed` |
| `engineai-sa01:c2` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/static/home/images/x-sa15.jpg | open-source/feature image | SA01製品ページ文脈 | `visual-unconfirmed` |
| `engineai-sa01:c3` | https://en-engineai-1304599088.cos.ap-guangzhou.myqcloud.com/uploads/upload/images/20250804/a6af47857194d203c019ba76311359c3.png | SA01 front/back or technical image | SA01明記section | `visual-unconfirmed` |
| `engineai-sa01:c4` | https://en.engineai.com.cn/product-support-sa01.html | SA01 support page image/operation video thumbnail。直接asset URLはreviewed resultで追加露出なし | SA01 support page | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、transparent、scale。SA01の「整机开源」はハードウェア開発性の説明であり、製品画像の商用許諾ではない。

### robotera-l7

確認ページ: https://www.robotera.com/en/robotics/L7.html 、https://www.robotera.com/en/download1.html 、https://www.robotera.com/en/Contact-to-Buy.html 、https://www.robotera.com/policy.html

公式検索結果・Download CenterはL7を55 DoF、171cm、dual-arm payload 20kg、full-size bipedal humanoidとして表示する。公式homeはresearch/data collection、manufacturing、enterprise reception、mall guidance、education、hospital guidanceをapplication scenariosとして掲げる。ブラウザでreviewed pageは動的表示され、直接画像asset URLは露出しなかった。

目視メタデータ: L7 product/download pageを再オープンし、製品カードと用途見出しを確認した。画像の背景・人物有無・機体構図は画素未取得。以下の候補は原典ページ内visualの参照であり、asset URLが新たに確認できたという意味ではない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `robotera-l7:c1` | https://www.robotera.com/en/robotics/L7.html | L7 product page hero/product card。hero候補。直接asset URLはreviewed pageで未露出 | L7明記ページ | `visual-unconfirmed` |
| `robotera-l7:c2` | https://www.robotera.com/en/download1.html | Download CenterのL7 card。hero/technical候補。55 DoF/171cm/20kg文脈 | L7明記 | `visual-unconfirmed` |
| `robotera-l7:c3` | https://www.robotera.com/en/ | application scenariosの製品visual。research/manufacturing/guide候補。直接asset URL未露出 | L7を含む公式home | `family-only` |

role未発見: 直接開けるL7専用transparent/side/endEffector/scale画像URL、人物有無。Q5/M7の画像をL7へ流用しない。

### robotera-q5

確認ページ: https://www.robotera.com/en/ 、https://www.robotera.com/en/download1.html 、https://www.robotera.com/en/Contact-to-Buy.html 、https://www.robotera.com/policy.html

公式home・Download Center・Contact to Buyはいずれも製品lineのボタン／ラベルとしてQ5を列挙するが、reviewed pageの動的表示ではQ5専用の製品見出しと直接画像asset URLを抽出できなかった。Q5をL7の55 DoF/171cm/20kg仕様へ同一視しない。

目視メタデータ: Q5ボタン・製品line・application scenariosをブラウザで確認した。Q5専用の画像URLはreviewed pagesでは見つからず、背景・人物有無・機体構図も未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `robotera-q5:c1` | — | 公式homeのQ5製品lineボタン／製品カード経路。直接画像asset URL未露出 | Q5の公式line掲載は確認 | `not-found-on-reviewed-pages` |
| `robotera-q5:c2` | — | Download CenterのQ5ボタン経路。直接画像asset URL未露出 | Q5の公式line掲載は確認 | `not-found-on-reviewed-pages` |
| `robotera-q5:c3` | https://www.robotera.com/en/ | Q5を含む公式home application scenarios。Q5専用visualとは分離不能 | Q5を含むfamily文脈 | `family-only` |

role未発見: Q5専用hero/side/transparent/endEffector/scale画像URL、画像の背景・人物有無。これは公式経路の最終no-usable判断ではない。

### robotera-m7

確認ページ: https://www.robotera.com/en/ 、https://www.robotera.com/en/download1.html 、https://www.robotera.com/en/Contact-to-Buy.html 、https://www.robotera.com/policy.html

公式home・Download Center・Contact to Buyはいずれも製品lineのボタン／ラベルとしてM7を列挙するが、reviewed pageの動的表示ではM7専用の製品見出しと直接画像asset URLを抽出できなかった。M7をL7の仕様へ同一視しない。

目視メタデータ: M7ボタン・製品line・application scenariosをブラウザで確認した。M7専用の画像URLはreviewed pagesでは見つからず、背景・人物有無・機体構図も未判定。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `robotera-m7:c1` | — | 公式homeのM7製品lineボタン／製品カード経路。直接画像asset URL未露出 | M7の公式line掲載は確認 | `not-found-on-reviewed-pages` |
| `robotera-m7:c2` | — | Download CenterのM7ボタン経路。直接画像asset URL未露出 | M7の公式line掲載は確認 | `not-found-on-reviewed-pages` |
| `robotera-m7:c3` | https://www.robotera.com/en/ | M7を含む公式home application scenarios。M7専用visualとは分離不能 | M7を含むfamily文脈 | `family-only` |

role未発見: M7専用hero/side/transparent/endEffector/scale画像URL、画像の背景・人物有無。これは公式経路の最終no-usable判断ではない。

### galbot-g1

確認ページ: https://www.galbot.com/g1/ 、https://www.galbot.com/ 、https://developer.galbot.com/docs/g1/2.2.4/zh/g1 、https://developer.galbot.com/docs/SDK/1.7.0/g1/zh 、https://developer.galbot.com/privacy 、https://developer.galbot.com/terms

公式G1ページ・マニュアルは、G1をmobile dual-arm/general-purpose robotとして、1730mm、92.5kg、8時間、4輪全方向底盤、単腕5kg・合計10kg、製造・薬局・家庭・倉庫・小売用途として説明する。developer pageはG1/G1 Lite対応の迎賓、G1対応の巡检、G1/S1対応の物料分拣を分けている。製品ページ自体は動的表示で、G1専用の直接画像asset URLはreviewed resultで露出しなかった。

目視メタデータ: G1製品ページ、home、G1マニュアルの画像・見出しをブラウザ／検索経路で確認した。マニュアルの「G1机器人产品概述」「开箱说明」、公式ページのmanufacturing/pharmacy/home/front-end warehouse/retail見出しから、hero・inOperation・scale roleを記録できる。画素未取得のため背景・人物有無は未判定。Developer Platformのscene-package画像はG1対応の用途文脈を持つが、画像単体でG1本体と断定しない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `galbot-g1:c1` | https://www.galbot.com/g1/ | G1公式product page hero・feature visual。直接asset URLはreviewed pageで未露出 | G1明記ページ | `visual-unconfirmed` |
| `galbot-g1:c2` | https://developer.galbot.com/docs/g1/2.2.4/zh/g1 | G1 quick manualの製品概述／開箱画像。hero/technical候補 | G1明記マニュアル | `visual-unconfirmed` |
| `galbot-g1:c3` | https://developer.galbot.com/assets/images/l2-welcome-43c83fab397136427b6ca76c8e92d7fa.jpg | 迎賓導覽 scene-package image。inOperation/scale候補 | G1/G1 Lite対応のscene文脈、画像単体は未分離 | `family-only` |
| `galbot-g1:c4` | https://developer.galbot.com/assets/images/l2-inspect-ec3645041cda820322e21bd8479493a7.jpg | 场地巡检 scene-package image。inOperation候補 | G1対応scene文脈、画像単体は未分離 | `family-only` |
| `galbot-g1:c5` | https://developer.galbot.com/assets/images/l3-retail-91aa13a213b5a44ae5fbb63578b09913.jpg | retail solution image。commercial/scale候補 | Galbot solution文脈、G1専用とは未分離 | `visual-unconfirmed` |

role未発見: G1専用の直接hero/transparent/side/endEffector/scale画像URL、画像ピクセルで確認した人物有無。G1マニュアルの利用条件・保証、Developer Platformのterms/privacy導線は画像再利用許諾を意味しない。

## 既存baselineとの関係

- published Robot画像26登録は現行 `reference-attributed` 方針で表示承認済みのbaselineとして維持する。
- structured logo 8登録は `commercial-permitted` baselineとして維持する。
- 既存画像・ロゴの削除、退避、再分類、`rights.status`変更は行っていない。
- 本バッチの候補は調査成果物であり、権利クリア済み・明示許諾済み・commercial-permittedとは表現しない。
- `no-usable-candidate` はB4では使用していない。公式経路・権利条件の最終判断は別gate後に行う。
