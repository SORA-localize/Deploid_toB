---
status: plan
updated: 2026-07-20
---

# B3 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `unitree-h1-2`, `apptronik-apollo`, `fourier-gr2`, `agibot-a2-ultra`, `agibot-a2-max`, `limx-luna`, `agibot-a2-lite`, `agibot-x1`, `agibot-x2`, `agibot-x2-ultra`, `ubtech-walker-s`, `ubtech-walker-c`, `ubtech-walker-tienkung`, `fourier-gr3c`, `apptronik-apollo-2`, `agibot-g2`
- 作業範囲: 公式製品ページ、公式media/newsページ、公式利用規約、原典画像URLの確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の変更、rights変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の制約

候補として列挙した画像URLはブラウザ経由で再オープンした。閲覧環境では画像URLの存在、原典ページ上の見出し、alt/caption、画像のページ位置は取得できたが、画像バイナリを保存せずに画素表示をAIへ転送する結果は返らなかった。そのため、画素に依存する背景、人物の有無、細部、左右側面の断定は行わず、該当候補を `visual-unconfirmed` とした。ページ文脈からvariantを分離できない場合は `family-only` とした。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:unitree:shop-terms:2026-07-15` | Unitree Robotics | https://shop.unitree.com/policies/terms-of-service / https://www.unitree.com/terms/ | B2で確認済みのUnitree policyを再利用。明示的な書面許可なしの複製・再利用を許可する画像ライセンスは確認できない。 |
| `policy:apptronik:site-terms:2026-07-15` | Apptronik | https://apptronik.com/terms-of-use | 個人・非商用目的に限り改変せず表示・複製・配布・downloadできるが、それ以外の複製、公開、表示、download、送信は事前の書面許可が必要。明示的な商用画像ライセンスはない。 |
| `policy:fourier:site-terms:2026-07-15` | Fourier Intelligence | https://www.fftai.com/term_use / https://www.fftai.com/legal-affairs | B1/B2で確認済みのFourier policyを再利用。画像の再利用許諾条項は確認できない。 |
| `policy:agibot:store-terms:2026-07-15` | AGIBOT | https://store.agibot.com/policies/terms-of-service | B1で確認済みのAGIBOT policyを再利用。個人・非商用利用以外の画像再利用許諾は確認できない。 |
| `policy:limx:site-policy:2026-07-15` | LimX Dynamics | https://limxdynamics.com/en/policy | B2で確認済みのLimX policyを再利用。製品画像は説明用で実際の構成と異なり得る旨はあるが、画像再利用許諾は確認できない。 |
| `policy:ubtech:site-terms:2026-07-15` | UBTECH Robotics | https://www.ubtrobot.com/en/privacy/term-of-use | B2で確認済みのUBTECH policyを再利用。個人・非商用閲覧以外の複製・表示・商用利用には書面許可が必要。 |

## Candidate inventory

### unitree-h1-2

確認ページ: https://www.unitree.com/h1/ 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

H1ページはH1とH1-2を同一ページで扱い、H1-2について約178cm/70kg、27 DoF等の別仕様を記載する。画像URLには世代名が付かないため、H1-2専用とは断定せずH1 familyとした。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-h1-2:c1` | https://www.unitree.com/images/d01aae29f6ed4165b0b2e01c811fb3b8_1419x852.png | H1/H1-2公式ページ製品画像。hero候補 | H1 page family、H1-2専用ラベルなし | `family-only` |
| `unitree-h1-2:c2` | https://www.unitree.com/images/da1ecbd107434a03b068aa503311f43a_3840x7000.jpg?x-oss-process=image%2Fquality%2Cq_80%2Fformat%2Cwebp | H1/H1-2縦長製品紹介。side/hero候補 | H1 page family | `family-only` |
| `unitree-h1-2:c3` | https://www.unitree.com/images/6112d3308ac842cd9e0557e89a47e405_389x225.png | H1/H1-2 feature。mobility/inOperation候補 | H1 page family | `family-only` |
| `unitree-h1-2:c4` | https://www.unitree.com/images/3acae84730004063af2d60d36a4b6956_389x225.png | H1/H1-2 feature。mobility/inOperation候補 | H1 page family | `family-only` |

role未発見: H1-2専用と識別できる`transparent`, `side`, `scale`, `endEffector`。既存H1-2画像はbaselineとして変更していない。

### apptronik-apollo

確認ページ: https://apptronik.com/ 、https://apptronik.com/news-collection/apptronik-unveils-apollo 、https://apptronik.com/news-collection/meet-apollo-the-iphone-of-humanoid-robots 、https://apptronik.com/company/press-releases 、https://apptronik.com/terms-of-use

Apolloの公式pressは約5'8"/160lb、55lb lift、warehouse/manufacturing、bipedal/wheeled/stationaryのmodularity、swappable batteryを記載する。CNN転載を含むApptronik公式掲載ページの画像は、caption上でApolloと分かるものを選び、Valkyrie画像は候補から除外した。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `apptronik-apollo:c1` | https://cdn.prod.website-files.com/6a0dd86942776facbc2f6baa/6a0dd86942776facbc2f6d47_230822165611-06-apptronik-apollo-robot.jpeg | 公式掲載caption `Apollo, Apptronik's latest robot`。hero候補 | Apollo明記caption | `visual-unconfirmed` |
| `apptronik-apollo:c2` | https://cdn.prod.website-files.com/6a0dd86942776facbc2f6baa/6a0dd86942776facbc2f6d48_230822164529-05-apptronik-apollo-robot.jpeg | `Apollo has been designed to meet needs in logistics...`。inOperation/mobility候補 | Apollo明記caption | `visual-unconfirmed` |
| `apptronik-apollo:c3` | https://cdn.prod.website-files.com/6a0dd86942776facbc2f6baa/6a0dd86942776facbc2f6d4c_230822164522-04-apptronik-apollo-robot.jpeg | `Apollo carries a tote`。inOperation/endEffector候補 | Apollo明記caption | `visual-unconfirmed` |
| `apptronik-apollo:c4` | https://apptronik.com/news-collection/apptronik-unveils-apollo | Press page内のApollo掲載画像。ページ内の直接asset URLは閲覧結果で追加露出しなかった | Apollo press page文脈 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、確実な`transparent`, `side`, `scale`。ValkyrieをApollo候補へ誤帰属しない。Termsは個人・非商用の表示等に限定される。

### fourier-gr2

確認ページ: https://www.fftai.com/products-gr2 、https://www.fftai.com/newsroom-newintech/14 、https://www.fftai.com/resources-download 、https://support.fftai.com/en/getting-started/general-information 、https://www.fftai.com/term_use 、https://www.fftai.com/legal-affairs

製品ページ・newsroomはGR-2を175cm/63kg、53 DoF、12-DoF dexterous hands、dynamic mobility、VR/lead-through/direct commandとして明記する。Fourierのdownload centerにGR-2 brochureも確認したが、PDFのスクリーンショットは画像候補として扱っていない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `fourier-gr2:c1` | https://www.fftai.com/uploads/upload/images/20240925/5e0abc6609f69166d3ad5bfcc21170bf.jpg | GR-2製品ページmain画像。hero候補 | GR-2明記ページ | `visual-unconfirmed` |
| `fourier-gr2:c2` | https://www.fftai.com/uploads/upload/images/20240925/1fd588eedccf47be6f938a05564cd15e.png | `New Member of Fourier GRx Robot Series`。hero/feature候補 | GR-2明記ページ | `visual-unconfirmed` |
| `fourier-gr2:c3` | https://www.fftai.com/uploads/upload/images/20240925/05d2b8431fe3e057b3d71c17f707da26.jpg | `Precision in Motion`。endEffector/inOperation候補 | GR-2明記ページ | `visual-unconfirmed` |
| `fourier-gr2:c4` | https://www.fftai.com/uploads/upload/images/20240925/45893cefd5408450c01d43405542a41f.jpg | `Powering Dynamic Mobility`。mobility候補 | GR-2明記ページ | `visual-unconfirmed` |
| `fourier-gr2:c5` | https://www.fftai.com/static/cms//images/x-gr6.png | GR-2 feature画像。endEffector/technical候補 | GR-2製品ページ文脈 | `visual-unconfirmed` |
| `fourier-gr2:c6` | https://www.fftai.com/static/cms//images/x-gr10.png | Fourier Toolkit/SDK feature候補。technical | GR-2製品ページ文脈 | `visual-unconfirmed` |
| `fourier-gr2:c7` | https://www.fftai.com/uploads/upload/images/20240926/453ccb3f784b5a1755ae86869bfb7316.jpg | GR-2 newsroom記事画像。inOperation候補 | GR-2 newsroom文脈 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`、人物有無。GR-2の公式rightsは未許諾のまま。

### agibot-a2-ultra

確認ページ: https://agibot.com/products/A2_Ultra 、https://www.agibot.com/news 、https://www.agibot.com/article/231/detail/32.html 、https://www.agibot.com/article/231/detail/35.html 、https://store.agibot.com/policies/terms-of-service

A2 Ultraページは106.286km Guinness歩行、24-hour outdoor walking livestream、exhibition guide、entertainment performance、navigation/obstacle avoidance、battery swapを明記する。候補画像はA2 Ultraページのasset pathを再オープンした。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-a2-ultra:c1` | https://agibot.com/public/static/index/en/images/A2_Ultra/banner.jpg | A2 Ultra製品ページbanner。hero候補 | A2 Ultra明記ページ | `visual-unconfirmed` |
| `agibot-a2-ultra:c2` | https://agibot.com/public/static/index/en/images/A2_Ultra/20260113-110338.png | Guinness/long-distance mobility section。mobility候補 | A2 Ultra明記ページ | `visual-unconfirmed` |
| `agibot-a2-ultra:c3` | https://agibot.com/public/static/index/en/images/A2_Ultra/20260113-1523.jpg | 24/7 outdoor walking section。inOperation/mobility候補 | A2 Ultra明記ページ | `visual-unconfirmed` |
| `agibot-a2-ultra:c4` | https://agibot.com/public/static/index/en/images/A2_Ultra/A2Ultra_Thre-img1.jpg | exhibition/interaction section。inOperation候補 | A2 Ultra明記ページ | `visual-unconfirmed` |
| `agibot-a2-ultra:c5` | https://agibot.com/public/static/index/en/images/A2_Ultra/A2Ultra_Thre-img4.jpg | entertainment/performance section。inOperation候補 | A2 Ultra明記ページ | `visual-unconfirmed` |
| `agibot-a2-ultra:c6` | https://agibot.com/public/static/index/en/images/A2_Ultra/A2Ultra_Five-img1.jpg | reliability/production section。technical/inOperation候補 | A2 Ultra明記ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, end-effector主被写体、人物有無。newsページは候補ページとして確認したが、製品ページ以外にA2 Ultraへ確実に紐付く別assetは追加できなかった。

### agibot-a2-max

確認ページ: https://jp.agibot.com/products/A2_Max 、https://www.agibot.com/products 、https://www.agibot.com/news 、https://store.agibot.com/policies/terms-of-service

公式日本語ページはA2-Maxを「近日公開予定」とし、175cm/85kg、1m/s、67 DoF（53 active）、40kg搬送、19-DoF industrial dexterous handを記載する。英語の現行menuにはA2-Maxの入力項目はあるが専用英語製品ページを確認できず、日本語ページを主経路とした。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-a2-max:c1` | https://jp.agibot.com/public/static/index/images/a2max-l1.jpg | A2-Max `力強さ` section。hero/inOperation候補 | A2-Max公式日本語ページ | `visual-unconfirmed` |
| `agibot-a2-max:c2` | https://jp.agibot.com/public/static/index/images/a2max-l2.jpg | A2-Max `巧みな作業` section。endEffector/inOperation候補 | A2-Max公式日本語ページ | `visual-unconfirmed` |

role未発見: 公式reviewed pagesで別の`transparent`, `side`, `scale`、人物有無。A2-Maxは「近日公開予定」のため、A2 Ultra画像をA2-Maxへ流用しない。

### limx-luna

確認ページ: https://limxdynamics.com/en/products/luna 、https://www.limxdynamics.com/en/news/BK000062 、https://limxdynamics.com/en/products/luna/spec 、https://limxdynamics.com/en/products/luna/faq 、https://limxdynamics.com/en/policy

Lunaは160cm/27 DoF、premium textile finish、dance/gymnastics/catwalk、multimodal interaction、200+ unit synchronized control、shopping mall/museum/theme park/live stageを公式ページで確認した。ページはLunaシリーズに複数versionがある旨も記載するため、variant名がない画像はfamily-only相当の注意を付ける。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `limx-luna:c1` | https://www.limxdynamics.com/en/news/BK000062 | 公式news内 `LimX Luna - All-New Full-Size Humanoid Robot` 画像。hero候補。直接asset URLは本文抽出で露出しなかった | Luna news文脈 | `visual-unconfirmed` |
| `limx-luna:c2` | https://www.limxdynamics.com/en/news/BK000062 | `High Dynamics Motions`画像。mobility/inOperation候補。直接asset URL未露出 | Luna news文脈 | `visual-unconfirmed` |
| `limx-luna:c3` | https://www.limxdynamics.com/en/news/BK000062 | facial expression画像。inOperation/interaction候補。直接asset URL未露出 | Luna news文脈 | `visual-unconfirmed` |
| `limx-luna:c4` | https://www.limxdynamics.com/en/news/BK000062 | `Customerized Humanoid Robot`画像。inOperation/scale候補。直接asset URL未露出 | Luna news文脈 | `visual-unconfirmed` |

role未発見: review経路で直接開けるLuna専用`transparent`, `side`, `endEffector`画像URL、人物有無。製品ページにはLuna画像があるが、画像URLが本文抽出に出なかったため、ページURLを候補ページとして記録し、asset URLの不存在を断定していない。

### agibot-a2-lite

確認ページ: https://store.agibot.com/products/a2-lite 、https://www.agibot.com/products/A2_Pro 、https://www.agibot.com/news 、https://store.agibot.com/policies/terms-of-service

A2 Liteはfull-size、entertainment/commercial performance、group control、choreography、VR teleoperation、Black Knight Edition、169cm/約63kg等を公式store/製品ページで確認した。storeのgallery URLを再オープンした。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-a2-lite:c1` | https://store.agibot.com/cdn/shop/files/1_07d72ac2-c1cf-4115-b8fd-cee132accc8f.png?v=1765520440&width=2520 | A2 Lite store gallery。hero候補 | A2 Lite product page | `visual-unconfirmed` |
| `agibot-a2-lite:c2` | https://store.agibot.com/cdn/shop/files/2.png?v=1763689257&width=2520 | action skills/group performance section。inOperation候補 | A2 Lite product page | `visual-unconfirmed` |
| `agibot-a2-lite:c3` | https://store.agibot.com/cdn/shop/files/3.png?v=1763689257&width=2520 | group control/performance section。inOperation/scale候補 | A2 Lite product page | `visual-unconfirmed` |
| `agibot-a2-lite:c4` | https://store.agibot.com/cdn/shop/files/4_b50eaff4-893e-454d-8e0f-b3bf17499cc6.png?v=1765520441&width=2520 | VR teleoperation/creative authoring section。inOperation候補 | A2 Lite product page | `visual-unconfirmed` |
| `agibot-a2-lite:c5` | https://store.agibot.com/cdn/shop/files/Frame_1437254091_8a6d9a0b-a321-4def-9515-9b3f4c3bce1c.png?v=1764817192&width=838 | A2 Lite specification/feature image。technical候補 | A2 Lite product page | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, end-effector主被写体、人物有無。A2 Lite store termsはB1 policy IDを再利用。

### agibot-x1

確認ページ: https://agibot.com/products/X1 、https://agibot.com/news 、https://agibot.com/open-source 、https://store.agibot.com/policies/terms-of-service

X1は34 DoF、130cm/33kg、1m/s、full-stack open-source、modular designとして公式製品ページに記載される。モーター/OmniPickerはアクセサリ候補であり、X1本体画像と混同しない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-x1:c1` | https://agibot.com/public/static/index/en/images/prolx1-banner-img.png | X1製品ページbanner。hero候補 | X1明記ページ | `visual-unconfirmed` |
| `agibot-x1:c2` | https://agibot.com/public/static/index/en/images/prolx1One-img.png | X1製品紹介画像。side/hero候補 | X1明記ページ | `visual-unconfirmed` |
| `agibot-x1:c3` | https://agibot.com/public/uploads/images/20241031/40f7b04583c7e38bd0894e3c9dfcf87b.png | X1 pageのcore component/PowerFlow画像。technical候補 | X1ページ文脈、robot本体ではない可能性あり | `visual-unconfirmed` |

role未発見: X1本体の確実な`transparent`, `side`, `scale`, end-effector、人物有無。X1ページは本体と開発部品を同一ページに載せるため、`c3`は本体候補ではなくtechnical候補として分離した。

### agibot-x2

確認ページ: https://agibot.com/products/X2 、https://store.agibot.com/products/x2-ultra 、https://agibot.com/news 、https://store.agibot.com/policies/terms-of-service

公式X2ページはX2 seriesとして25–30 DoF、multimodal interaction、humanoid gait/dance、autonomous navigation等を説明する一方、掲載画像・仕様注記はX2 Ultraを基準とし、他モデルはspec sheet参照としている。したがってX2標準候補への直接割当は `family-only` とした。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-x2:c1` | https://agibot.com/public/static/index/en/images/X2/banner.jpg | X2 series banner。hero候補 | X2 series、標準X2/Ultra分離不能 | `family-only` |
| `agibot-x2:c2` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj1.jpg | Affinity/human-like interaction section。inOperation候補 | X2 series、ページ注記はUltra基準 | `family-only` |
| `agibot-x2:c3` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj2.jpg | Agility/lifelike feature。mobility/inOperation候補 | X2 series | `family-only` |
| `agibot-x2:c4` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj3.jpg | Intelligent/autonomous task feature。mobility/inOperation候補 | X2 series | `family-only` |
| `agibot-x2:c5` | https://agibot.com/public/static/index/en/images/X2/X2_Thre-img1.jpg | X2 feature image。technical/inOperation候補 | X2 series | `family-only` |

role未発見: X2標準専用の`transparent`, `side`, `scale`, `endEffector`。X2 Ultra専用のend-effector/LiDAR/RGB-D画像を標準X2へ帰属しない。

### agibot-x2-ultra

確認ページ: https://agibot.com/products/X2 、https://store.agibot.com/products/x2-ultra 、https://agibot.com/news 、https://store.agibot.com/policies/terms-of-service

X2ページの明示注記「以下の内容と画像はX2 Ultraを参照」を機種一致根拠とした。X2 UltraはLiDAR、RGB-D、front/rear cameras、automatic charging、OmniHand/OmniPicker対応がページ文脈で明示される。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-x2-ultra:c1` | https://agibot.com/public/static/index/en/images/X2/banner.jpg | X2 series/Ultra基準banner。hero候補 | X2ページ注記でX2 Ultra基準 | `visual-unconfirmed` |
| `agibot-x2-ultra:c2` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj1.jpg | Affinity/human-like interaction。hero/inOperation候補 | X2 Ultra基準ページ | `visual-unconfirmed` |
| `agibot-x2-ultra:c3` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj2.jpg | Agility/lifelike feature。mobility候補 | X2 Ultra基準ページ | `visual-unconfirmed` |
| `agibot-x2-ultra:c4` | https://agibot.com/public/static/index/en/images/X2/X2_One-bj3.jpg | Intelligent autonomous tasks。mobility/inOperation候補 | X2 Ultra基準ページ | `visual-unconfirmed` |
| `agibot-x2-ultra:c5` | https://agibot.com/public/static/index/en/images/X2/X2_Thre-img1.jpg | High-DoF body/feature。side/technical候補 | X2 Ultra基準ページ | `visual-unconfirmed` |
| `agibot-x2-ultra:c6` | https://agibot.com/public/static/index/en/images/X2/X2_Thre-img2.jpg | High-DoF/sensor feature。endEffector/technical候補 | X2 Ultra基準ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `scale`、人物有無。X2 Ultraのvariant一致はページ注記に基づくが、画像ピクセルは未確認。

### ubtech-walker-s

確認ページ: https://www.ubtrobot.com/en/humanoid/products/walker-s 、https://www.ubtrobot.com/en/about/news 、https://www.ubtrobot.com/en/product-brochure 、https://www.ubtrobot.com/en/privacy/term-of-use

Walker Sはindustrial humanoidとしてfactory assembly line、all-terrain adaptation、self-balancing、hand-eye coordination、U-SLAM、whole-body manipulationを公式ページで確認した。News一覧とbrochureページを確認したが、Walker S専用の追加press/brochure画像は主製品ページ以外では追加確認できなかった。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-s:c1` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/09/02/586164763738181.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | Walker S product image。hero候補 | Walker S product page | `visual-unconfirmed` |
| `ubtech-walker-s:c2` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/09/02/586164794347589.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | Walker S industrial feature image。inOperation/mobility候補 | Walker S product page | `visual-unconfirmed` |

role未発見: 公式reviewed pagesで直接開ける追加の`transparent`, `side`, `endEffector`, `scale`画像、人物有無。Walker S2/S1画像をWalker Sへ流用しない。

### ubtech-walker-c

確認ページ: https://www.ubtrobot.com/en/humanoid/products/walker-c 、https://www.ubtrobot.com/en/about/news 、https://www.ubtrobot.com/en/product-brochure 、https://www.ubtrobot.com/en/privacy/term-of-use

Walker Cはfull-size electric-driven embodied intelligent humanoid、Expo 2025 Osaka China Pavilion tour guide、多言語interaction、exhibition hall/office building用途として公式ページに記載される。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-c:c1` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/04/25/669353050329157.png | Walker C page main/banner。hero候補 | Walker C製品ページ | `visual-unconfirmed` |
| `ubtech-walker-c:c2` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/04/25/669353072398405.png | Walker C service feature。inOperation候補 | Walker C製品ページ | `visual-unconfirmed` |
| `ubtech-walker-c:c3` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/04/25/669439190188101.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | Expo 2025/guide feature。inOperation/scale候補 | Walker C製品ページ | `visual-unconfirmed` |
| `ubtech-walker-c:c4` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/04/25/669352946278469.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | Walker C service/application feature。inOperation候補 | Walker C製品ページ | `visual-unconfirmed` |
| `ubtech-walker-c:c5` | https://www.ubtrobot.com/en/humanoid/products/walker-c | `WalkerC_page1.jpg`/`WalkerC_page3_en.jpg`等のページ内候補。直接asset URLは一部のみ取得 | Walker C product page | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `endEffector`、人物有無。Expo page contextからscale候補はあるが人物の存在は未確認。

### ubtech-walker-tienkung

確認ページ: https://www.ubtrobot.com/en/ai-education/products/walker-tienkung/ 、https://docs.ubtrobot.com/walker-tienkung/en/docs/sdk/4/ 、https://docs.ubtrobot.com/walker-tienkung/en/docs/user-guide/6/ 、https://www.ubtrobot.com/en/product-brochure 、https://www.ubtrobot.com/en/privacy/term-of-use

公式教育ページはacademic research/education/secondary development、adaptive locomotion、dynamic balance、embodied operation/dexterous controlを記載する。公式docsはWalker Tienkung seriesと、TK2101/TK2201/TK2301のモデル差、最大42 DoF、research/education用途を明記する。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-tienkung:c1` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/12/17/752937244278853.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | education product page banner。hero候補 | Walker Tienkung product page | `visual-unconfirmed` |
| `ubtech-walker-tienkung:c2` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/12/17/752940032745541.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | terrain/adaptive locomotion section。mobility候補 | Walker Tienkung product page | `visual-unconfirmed` |
| `ubtech-walker-tienkung:c3` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/12/18/753316150296645.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | open-platform/research feature。technical/inOperation候補 | Walker Tienkung product page | `visual-unconfirmed` |
| `ubtech-walker-tienkung:c4` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/12/18/753204908609605.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | education application section。inOperation/scale候補 | Walker Tienkung product page | `visual-unconfirmed` |
| `ubtech-walker-tienkung:c5` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/12/18/753205215010885.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | application/research feature。inOperation候補 | Walker Tienkung product page | `visual-unconfirmed` |
| `ubtech-walker-tienkung:c6` | https://docs.ubtrobot.com/walker-tienkung/en/images_sdk/15.png | official docs joint-layout image。technical/side候補 | Walker Tienkung docs | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `endEffector`, 人物有無。series内のLite/Plus/Pro等variantは、ページ画像単体で分離せずfamilyとして扱う。

### fourier-gr3c

確認ページ: https://www.fftai.com/products-gr3c 、https://www.fftai.com/products-gr3series 、https://www.fftai.com/resources-download 、https://www.fftai.com/term_use 、https://www.fftai.com/legal-affairs

GR-3C製品ページはreinforced shell、LED ring-screen head、vision modules、dexterous hands、whole-body teleoperation、industrial assembly/remote inspectionを明記する。GR-3 standardとの共通series画像は、GR-3C専用ページの画像と分けた。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `fourier-gr3c:c1` | https://www.fftai.com/uploads/upload/images/20251224/3b2b1c36a0a685465293297d6dddb4c5.png | `A Futuristic and Capable Assistant`。hero候補 | GR-3C明記ページ | `visual-unconfirmed` |
| `fourier-gr3c:c2` | https://www.fftai.com/uploads/upload/images/20251201/c4bc196962ea0bdef917be1986c375e8.png | Vision Modules。feature/endEffector候補 | GR-3C明記ページ | `visual-unconfirmed` |
| `fourier-gr3c:c3` | https://www.fftai.com/uploads/upload/images/20251201/6fe462152c8aeae4e40a1c039180f4e7.png | Dexterous Hands。endEffector候補 | GR-3C明記ページ | `visual-unconfirmed` |
| `fourier-gr3c:c4` | https://www.fftai.com/uploads/upload/images/20251201/694a75c277ceb35122fd52243f9832e2.png | Whole-Body Teleoperation。inOperation候補 | GR-3C明記ページ | `visual-unconfirmed` |
| `fourier-gr3c:c5` | https://www.fftai.com/uploads/upload/images/20251201/d6f6573eaf8cc5df621308c34e96e239.png | Customized Head Modular。hero/feature候補 | GR-3C明記ページ | `visual-unconfirmed` |
| `fourier-gr3c:c6` | https://www.fftai.com/uploads/upload/images/20251201/5ab99ed688a35ee47277e2ef3c6c3034.png | Precision hands/full-body teleoperation section。endEffector/inOperation候補 | GR-3C明記ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`、人物有無。GR-3 seriesのSocial Companion画像は標準GR-3文脈のため、GR-3C候補へ直接帰属しない。

### apptronik-apollo-2

確認ページ: https://apptronik.com/apollo/apollo-2 、https://apptronik.com/news-collection/welcome-to-robot-park-where-apptroniks-apollo-goes-to-work 、https://apptronik.com/company/press-releases 、https://apptronik.com/terms-of-use

Apollo 2ページとRobot Park pressは、Apollo 2をcurrent platform、bipedal/wheeled-baseの両構成、real-world data collection、dexterous manipulation、human interaction、7x22 operationとして明記する。Apollo 2ページの主要画像はCSS/埋め込み経路で、閲覧結果では直接の画像asset URLが露出しなかった。旧Apolloの画像URLをApollo 2へ流用していない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `apptronik-apollo-2:c1` | https://apptronik.com/apollo/apollo-2 | Apollo 2 product pageの製品visual。hero候補。直接asset URLはreviewed pageで未露出 | Apollo 2明記ページ | `visual-unconfirmed` |
| `apptronik-apollo-2:c2` | https://apptronik.com/news-collection/welcome-to-robot-park-where-apptroniks-apollo-goes-to-work | Robot Parkで稼働するApollo 2のpress visual。inOperation/mobility候補。直接asset URLは未露出 | Apollo 2明記press | `visual-unconfirmed` |
| `apptronik-apollo-2:c3` | https://apptronik.com/apollo/apollo-2 | bipedal/wheeled modular configuration visual。mobility候補。直接asset URLは未露出 | Apollo 2明記ページ | `visual-unconfirmed` |
| `apptronik-apollo-2:c4` | https://apptronik.com/apollo/apollo-2 | chest/face display・human-centered interaction visual。hero/feature候補。直接asset URLは未露出 | Apollo 2明記ページ | `visual-unconfirmed` |

role未発見: 直接asset URL、画像ピクセルで確認した`transparent`, `side`, `scale`, 人物有無。これは「公式ページに候補visualがない」という意味ではなく、再利用候補として記録できる原典画像URLの露出が不足しているという意味である。

### agibot-g2

確認ページ: https://agibot.com/products/G2 、https://agibot.com/news 、https://agibot.com/products 、https://store.agibot.com/policies/terms-of-service

G2はindustrial-grade interactive embodied operation robotとして、IP42、force-control operation、sub-millimeter precision assembly、Genie RL、facial animation、human-like movement、multi-user conversation、eye-gaze trackingを公式ページで確認した。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-g2:c1` | https://agibot.com/public/static/index/en/images/G2/banner.jpg | G2 product banner。hero候補 | G2明記ページ | `visual-unconfirmed` |
| `agibot-g2:c2` | https://agibot.com/public/static/index/en/images/G2/G2One-img2.jpg | industrial-grade/feature section。hero/technical候補 | G2明記ページ | `visual-unconfirmed` |
| `agibot-g2:c3` | https://agibot.com/public/static/index/en/images/G2/G2One-img3.jpg | force-control/precision assembly。inOperation/endEffector候補 | G2明記ページ | `visual-unconfirmed` |
| `agibot-g2:c4` | https://agibot.com/public/static/index/en/images/G2/G2Two-img1.jpg | interactive intelligence section。inOperation候補 | G2明記ページ | `visual-unconfirmed` |
| `agibot-g2:c5` | https://agibot.com/public/static/index/en/images/G2/G2Two-img2.jpg | facial animation/conversation section。inOperation/interaction候補 | G2明記ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, 人物有無。G2 user-guide/technical imageは本体候補と混同せず、製品ページのrole候補を優先した。

## Existing baseline check

- B3対象の既存`reference-attributed`画像は表示承認済みbaselineとして維持する。
- 既存Robot画像26件、structured logo 8件の削除、退避、再分類、`rights.status`変更なし。
- `reference-attributed`を`commercial-permitted`または明示許諾済みとは表現していない。
- このファイルは調査成果物であり、公開データ・アプリコードではない。
- `no-usable-candidate`は使用していない。候補を直接確認できなかったroleやasset URLについては、公式経路を追加確認する余地を残したまま `not-found-on-reviewed-pages` 相当で記録し、最終判断を保留する。
