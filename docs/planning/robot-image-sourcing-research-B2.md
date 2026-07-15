# B2 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `unitree-g1`, `unitree-g1-edu`, `unitree-h1`, `unitree-h2`, `unitree-h2-edu`, `unitree-h2-plus`, `ubtech-walker-s2`, `fourier-gr3`, `booster-t1`, `kawasaki-kaleido`, `booster-k1`, `limx-oli`, `mentee-menteebotv3`, `unitree-g1-d`
- 作業範囲: 公式製品ページ、公式media/newsページ、公式利用規約、原典画像URLの確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の変更、rights変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の制約

列挙した原典画像URLはブラウザ経由で再オープンした。閲覧環境では画像URLの存在、原典ページ上の見出し、alt/caption、画像のページ位置は確認できたが、画像バイナリを保存せずに画素表示をAIへ転送する結果は返らなかった。そのため、画素そのものに依存する背景・人物・細部・左右側面の断定は行わず、該当候補を `visual-unconfirmed` とした。ページ文脈でvariantを分離できないものは `family-only` とした。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:unitree:shop-terms:2026-07-15` | Unitree Robotics | https://shop.unitree.com/policies/terms-of-service / https://www.unitree.com/terms/ | サービスの複製、コピー、再販売、その他の利用には明示的な書面許可が必要。公開画像の再利用ライセンスは確認できない。 |
| `policy:ubtech:site-terms:2026-07-15` | UBTECH Robotics | https://www.ubtrobot.com/en/privacy/term-of-use | サイト内容は原則として個人・非商用利用のみ。事前の書面許可なしに複製、配布、表示、他サーバーへのアップロード、商用利用は不可。 |
| `policy:fourier:site-terms:2026-07-15` | Fourier Intelligence | https://www.fftai.com/term_use / https://www.fftai.com/legal-affairs | B1で確認した同一policyを再利用。画像の再利用許諾条項は確認できず、法務窓口は掲載されている。 |
| `policy:booster:service-terms:2026-07-15` | Booster Robotics | https://www.booster.tech/service/ | 製品・サイトの利用規約と、利用者がコンテンツをupload/share/downloadする際の遵守事項は確認できたが、公式画像の再利用許諾は確認できない。 |
| `policy:kawasaki:global-site-policy:2026-07-15` | Kawasaki Robotics | https://global.kawasaki.com/en/site_policy/index.html / https://kawasakirobotics.com/eu-africa/imprint-emea/ | サイト情報・画像は著作権保護対象。個人・非商用閲覧以外の複製、公開送信、改変、販売等は事前同意が必要。画像・本文の利用には事前の書面許可が必要。 |
| `policy:limx:site-policy:2026-07-15` | LimX Dynamics | https://limxdynamics.com/en/policy | Terms、disclaimer等の公式policy入口を確認。製品ページは画像・動画・画面が説明用で実際の構成と異なり得ると記載するが、画像再利用許諾は確認できない。 |
| `policy:mentee:site-terms:2026-07-15` | Mentee Robotics | https://www.menteebot.com/ / https://www.menteebot.com/bot/ | 公式サイトのTerms of Useリンクは確認したが、本文をこの閲覧経路では取得できず、画像再利用許諾は未確認。 |
| `policy:mobileye:terms-of-use:2026-07-15` | Mobileye | https://www.mobileye.com/terms-of-use/ | サイトの画像・動画・商標等についてライセンスは付与されず、書面許可なしの複製、配布、利用、commercial exploitationは不可。プレスキットのvisual assetsも自動的な再利用許諾とは扱わない。 |

## Candidate inventory

### unitree-g1

確認ページ: https://www.unitree.com/g1/ 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

G1ページはG1とG1 EDUの仕様を同一ページで比較する。ページ上でG1の23 DoF、G1 EDUの23–43 DoF、手・手首のオプション等は分かるが、gallery画像URLにはvariant名が付いていない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-g1:c1` | https://www.unitree.com/images/a20ba1ebc0724df8a8135744dee8bbea_2740x1720.jpg | G1公式gallery。hero候補 | G1製品ページ文脈、画像単体のvariantラベルなし | `visual-unconfirmed` |
| `unitree-g1:c2` | https://www.unitree.com/images/8992fd91eed0495696ca876f86699523_2740x1720.jpg | G1公式gallery。transparent/hero候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c3` | https://www.unitree.com/images/5e100d4349924287869c7f1ff6c0316b_2740x1720.jpg | G1公式gallery。side候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c4` | https://www.unitree.com/images/ee3fc23204054aa491c7950bfa399c1a_2740x1720.jpg | G1公式gallery。inOperation/mobility候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c5` | https://www.unitree.com/images/5378760356e14e25be18bd24a3d49660_2740x1720.jpg | G1公式gallery。inOperation候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c6` | https://www.unitree.com/images/221d6574eff346eeb3d2bb5e6dbe5773_2740x1720.jpg | G1公式gallery。mobility候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c7` | https://www.unitree.com/images/f778ae0a23f9480e89f5e6b60b340e51_2740x1720.jpg | G1公式gallery。endEffector/feature候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c8` | https://www.unitree.com/images/f38cf975d6a242a489079fc2160f4a83_2740x1720.jpg | G1公式gallery。feature候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c9` | https://www.unitree.com/images/87d23aa3708e4677aba22b14352bb779_2000x1470.png | G1公式gallery。feature候補 | G1 family | `visual-unconfirmed` |
| `unitree-g1:c10` | https://www.unitree.com/images/773f6a21c6764bc8bfd9da5f9d714ecf_3840x3600.jpg | G1公式gallery。feature/endEffector候補 | G1 family | `visual-unconfirmed` |

role未発見: variant名付きのG1専用画像、人物有無、確実な`scale`、専用`transparent`は画像ピクセル未確認。公式News Centerも確認したが、今回のG1候補を追加できるG1固有press素材は確認できなかった。

### unitree-g1-edu

確認ページ: https://www.unitree.com/g1/ 、https://shop.unitree.com/products/unitree-g1 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

同一G1ページの仕様欄ではG1 EDUを明示的に区別できるが、galleryとshop画像のURL単体にはvariant名がない。したがってG1/G1 EDU共用候補は、G1 EDU専用と断定せず `family-only` とする。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-g1-edu:c1` | https://www.unitree.com/images/a20ba1ebc0724df8a8135744dee8bbea_2740x1720.jpg | G1/G1 EDU共通gallery。hero候補 | G1 family、EDU専用とは分離不能 | `family-only` |
| `unitree-g1-edu:c2` | https://www.unitree.com/images/8992fd91eed0495696ca876f86699523_2740x1720.jpg | G1/G1 EDU共通gallery。hero/transparent候補 | G1 family | `family-only` |
| `unitree-g1-edu:c3` | https://www.unitree.com/images/5e100d4349924287869c7f1ff6c0316b_2740x1720.jpg | G1/G1 EDU共通gallery。side候補 | G1 family | `family-only` |
| `unitree-g1-edu:c4` | https://www.unitree.com/images/ee3fc23204054aa491c7950bfa399c1a_2740x1720.jpg | G1/G1 EDU共通gallery。inOperation/mobility候補 | G1 family | `family-only` |
| `unitree-g1-edu:c5` | https://www.unitree.com/images/5378760356e14e25be18bd24a3d49660_2740x1720.jpg | G1/G1 EDU共通gallery。inOperation候補 | G1 family | `family-only` |
| `unitree-g1-edu:c6` | https://www.unitree.com/images/221d6574eff346eeb3d2bb5e6dbe5773_2740x1720.jpg | G1/G1 EDU共通gallery。mobility候補 | G1 family | `family-only` |
| `unitree-g1-edu:c7` | https://www.unitree.com/images/f778ae0a23f9480e89f5e6b60b340e51_2740x1720.jpg | G1/G1 EDU共通gallery。endEffector/feature候補 | G1 family | `family-only` |

role未発見: EDU専用とページまたはURLで識別できる`transparent`, `side`, `scale`, `endEffector`。G1 EDUの仕様差は確認できたが、写真へのvariant紐付けはできない。

### unitree-h1

確認ページ: https://www.unitree.com/h1/ 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

H1ページはH1とH1-2を同一ページで扱う。H1は約180cm/47kg、H1-2は約178cm/70kg・27 DoF等として別仕様で記載されるため、画像URLに世代表示がない候補はH1/H1-2 familyとして扱う。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-h1:c1` | https://www.unitree.com/images/d01aae29f6ed4165b0b2e01c811fb3b8_1419x852.png | H1/H1-2公式ページの製品画像。hero候補 | H1 page family、世代ラベルなし | `family-only` |
| `unitree-h1:c2` | https://www.unitree.com/images/da1ecbd107434a03b068aa503311f43a_3840x7000.jpg?x-oss-process=image%2Fquality%2Cq_80%2Fformat%2Cwebp | 仕様・製品紹介用の縦長画像。hero/side候補 | H1 page family | `family-only` |
| `unitree-h1:c3` | https://www.unitree.com/images/6112d3308ac842cd9e0557e89a47e405_389x225.png | H1ページのfeature画像。mobility/inOperation候補 | H1 page family | `family-only` |
| `unitree-h1:c4` | https://www.unitree.com/images/3acae84730004063af2d60d36a4b6956_389x225.png | H1ページのfeature画像。mobility/inOperation候補 | H1 page family | `family-only` |

role未発見: H1専用とH1-2専用を同時に満たすvariantラベル付き`transparent`, `side`, `scale`, `endEffector`。H1ページには歩行・走行・深度視覚の説明があるが、画像ピクセル上の人物・背景は未確認。

### unitree-h2

確認ページ: https://shop.unitree.com/products/unitree-h2 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

H2ショップページはH2とH2 EDUを同一商品ページで説明し、EDUのみsecondary development対応と記載する。画像URL単体ではEDU差を識別できない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-h2:c1` | https://shop.unitree.com/cdn/shop/files/1.banner_2d63a110-f36d-44c7-b83a-165df2b828d5_1024x1024.jpg?v=1769743817 | H2商品banner。hero候補 | H2商品ページ明記 | `visual-unconfirmed` |
| `unitree-h2:c2` | https://shop.unitree.com/cdn/shop/files/1_310a5bdb-64dd-4206-8806-0c8bfdea6314_1024x1024.jpg?v=1769744850 | H2商品紹介。hero/side候補 | H2/H2 EDU共通ページ文脈 | `visual-unconfirmed` |
| `unitree-h2:c3` | https://shop.unitree.com/cdn/shop/files/265ec2c5989f2d024a5b3ea2dace32ce_07caf041-27cc-47b4-ae1f-81f7cff7d5b6_1024x1024.jpg?v=1770139020 | H2商品紹介。inOperation候補 | H2 product context | `visual-unconfirmed` |
| `unitree-h2:c4` | https://shop.unitree.com/cdn/shop/files/5_6ac8803e-522f-479d-8398-e81758a55914_1024x1024.jpg?v=1770139063 | H2商品紹介。mobility/inOperation候補 | H2 product context | `visual-unconfirmed` |
| `unitree-h2:c5` | https://shop.unitree.com/cdn/shop/files/9e2408f5f928b2d429150abf75a6b707_1024x1024.jpg?v=1769748400 | H2商品紹介。feature候補 | H2 product context | `visual-unconfirmed` |
| `unitree-h2:c6` | https://shop.unitree.com/cdn/shop/files/H2_Long_Spec_1024x1024.jpg?v=1769770468 | H2仕様図。technical/side候補 | H2 product context | `visual-unconfirmed` |

role未発見: H2専用と明記された`transparent`, `scale`, `endEffector`。ページ記載からは180cm、31 DoF、作業シナリオは確認できるが、候補画像の人物・背景・variantは未確認。

### unitree-h2-edu

確認ページ: https://shop.unitree.com/products/unitree-h2 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

H2 EDUは商品ページの「EDU only supports secondary development」という文脈で存在を確認した。個別画像URLにEDU表記がないため、全候補をH2 familyの `family-only` とする。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-h2-edu:c1` | https://shop.unitree.com/cdn/shop/files/1.banner_2d63a110-f36d-44c7-b83a-165df2b828d5_1024x1024.jpg?v=1769743817 | H2/H2 EDU共通商品banner。hero候補 | H2 family、EDU専用とは分離不能 | `family-only` |
| `unitree-h2-edu:c2` | https://shop.unitree.com/cdn/shop/files/1_310a5bdb-64dd-4206-8806-0c8bfdea6314_1024x1024.jpg?v=1769744850 | H2/H2 EDU共通商品紹介。side候補 | H2 family | `family-only` |
| `unitree-h2-edu:c3` | https://shop.unitree.com/cdn/shop/files/265ec2c5989f2d024a5b3ea2dace32ce_07caf041-27cc-47b4-ae1f-81f7cff7d5b6_1024x1024.jpg?v=1770139020 | H2/H2 EDU共通商品紹介。inOperation候補 | H2 family | `family-only` |
| `unitree-h2-edu:c4` | https://shop.unitree.com/cdn/shop/files/5_6ac8803e-522f-479d-8398-e81758a55914_1024x1024.jpg?v=1770139063 | H2/H2 EDU共通商品紹介。mobility候補 | H2 family | `family-only` |
| `unitree-h2-edu:c5` | https://shop.unitree.com/cdn/shop/files/9e2408f5f928b2d429150abf75a6b707_1024x1024.jpg?v=1769748400 | H2/H2 EDU共通商品紹介。feature候補 | H2 family | `family-only` |

role未発見: EDU専用と識別できる`transparent`, `scale`, `endEffector`。EDUの機能差はページ文脈で確認したが、画像への対応付けは未確認。

### unitree-h2-plus

確認ページ: https://www.unitree.com/H2plus/ 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

H2 PLUSページは75 total body+hand DoF、五指ハンド、腕のpayload、stereo/wrist camerasなどを明記する。画像のpixel確認はできなかったが、候補はH2 PLUS専用ページのページ位置で分類した。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-h2-plus:c1` | https://www.unitree.com/images/497ccc95bdde4668b7a9ef8392732239_3840x2160.jpg | H2 PLUSページの大判製品画像。hero候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c2` | https://www.unitree.com/images/62cdd01f099d432a8ae881447f9bf24d_3840x2160.jpg | H2 PLUSページのfeature画像。inOperation候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c3` | https://www.unitree.com/images/92b628ad4e194477a9b28c731ae76dcb_170x170.png | hand/camera feature thumbnail候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c4` | https://www.unitree.com/images/739562ac27604ed18adf82f3e954f5ff_170x170.png | hand/camera feature thumbnail候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c5` | https://www.unitree.com/images/9b2071089a9d4712954897a4e805d903_170x170.png | hand/camera feature thumbnail候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c6` | https://www.unitree.com/images/d31c967a75e34028b10362cb9f80ad39_170x170.png | hand/camera feature thumbnail候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c7` | https://www.unitree.com/images/9654f83894fe4ad1a277ece3c3344e80_170x170.png | hand/camera feature thumbnail候補 | H2 PLUS明記ページ | `visual-unconfirmed` |
| `unitree-h2-plus:c8` | https://www.unitree.com/images/27aca3e8a26649fc9069785f1bc40021_3840x3760.jpg | H2 PLUSページの大判feature/technical画像 | H2 PLUS明記ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, 人物有無。小型PNGは手・カメラ等のfeature文脈に対応するが、画像そのものの被写体断定は保留。

### ubtech-walker-s2

確認ページ: https://www.ubtrobot.com/en/humanoid/products/walker-s2 、https://www.ubtrobot.com/en/about/news 、https://www.ubtrobot.com/en/product-brochure 、https://www.ubtrobot.com/en/privacy/term-of-use

製品ページはWalker S2を「New Generation of Industrial Humanoid Robot」とし、自律battery swap、24/7 operation、15kg payload、RGB binocular stereo vision、production-line swarm intelligenceを記載する。News一覧とproduct-brochureも確認したが、Walker S2固有の追加press/brochure素材は確認できなかった。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-s2:c1` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/17/698770661040197.png | Walker S2製品ページmain画像。hero候補 | Walker S2のalt・製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c2` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/17/698770322690117.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | battery swap/continuous operation feature付近。inOperation候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c3` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/25/701620707123269.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | battery/operation feature付近。inOperation候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c4` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/17/698771297820741.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | manipulation/work feature付近。inOperation/endEffector候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c5` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/17/698771693350981.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | work/vision feature付近。inOperation候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c6` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/08/21/711094481948741.jpg?id=711094481948741&sid=433803009003589%3Fimage_process%3Dformat%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10&st=AliyunOSS&type=resource | RGB binocular stereo vision feature付近。sensor/feature候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c7` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/22/700482984697925.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | Co-Agent/BrainNet feature付近。inOperation候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c8` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/11/19/743037272154181.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | production-line/mass-production feature付近。inOperation候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |
| `ubtech-walker-s2:c9` | https://owebsite-cdn.ubtrobot.com/resources/image/2025/07/24/701244770754629.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | product specification section。technical/side候補 | Walker S2製品ページ文脈 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, 人物有無。News一覧とbrochureページではWalker S2固有候補を確認できなかった。

### fourier-gr3

確認ページ: https://www.fftai.com/products-gr3 、https://www.fftai.com/products-gr3series 、https://www.fftai.com/newsroom-humanoid/26 、https://support.fftai.com/en/getting-started/general-information 、https://www.fftai.com/term_use 、https://www.fftai.com/legal-affairs 、https://www.fftai.com/uploads/upload/files/20251022/425294838296d52b62b802c68128c30f.pdf

GR-3製品・newsページでは標準GR-3（Meow-bot）の説明を確認した。seriesページはGR-3C（Cosmo）も同列に扱うため、GR-3C専用と分離できないseries候補は標準GR-3へ直接割り当てない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `fourier-gr3:c1` | https://www.fftai.com/uploads/upload/images/20251201/e47841042bbf37eebec6f3e65e1b6f00.jpg | GR-3製品ページmain画像。hero候補 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c2` | https://www.fftai.com/uploads/upload/images/20251224/74dc0c38f85c0929342aad9d489c2d2b.png | `A Softer Presence` section。hero/inOperation候補 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c3` | https://www.fftai.com/uploads/upload/images/20251201/fa107bad8883e1b6a889cc9b03ea7a0d.png | tactile/visual/audio perception feature。endEffector/feature候補 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c4` | https://www.fftai.com/uploads/upload/images/20251201/55be75fbe6f535752a658a11956fa6e7.png | GR-3製品ページfeature画像 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c5` | https://www.fftai.com/uploads/upload/images/20251201/27b0b2321f030cad1eecf26e76ad989a.png | GR-3製品ページfeature画像 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c6` | https://www.fftai.com/uploads/upload/images/20251201/efa4ef2533a0aff8aa7c879d25c71dd5.png | GR-3製品ページfeature画像 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c7` | https://www.fftai.com/uploads/upload/images/20251201/ae2d27bd56491bed51f94b9248378828.png | GR-3製品ページfeature画像 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c8` | https://www.fftai.com/uploads/upload/images/20251201/975e28b1b3913cc94dabf73cfc372b1a.png | GR-3製品ページfeature画像 | GR-3明記ページ | `visual-unconfirmed` |
| `fourier-gr3:c9` | https://www.fftai.com/uploads/upload/images/20250825/d34ae962b7f61222e58c7204c4ce64b2.png | GR-3 newsroom記事画像。inOperation/social候補 | GR-3 newsroom記事文脈 | `visual-unconfirmed` |
| `fourier-gr3:c10` | https://www.fftai.com/uploads/upload/images/20250825/955d18cef44b55f7e8547d578c61d5b8.png | GR-3 newsroom記事画像。inOperation候補 | GR-3 newsroom記事文脈 | `visual-unconfirmed` |
| `fourier-gr3:c11` | https://www.fftai.com/uploads/upload/images/20250825/0bccd02072085be04eb32fde4793f4c1.png | GR-3 newsroom記事画像。real-world/service候補 | GR-3 newsroom記事文脈 | `visual-unconfirmed` |
| `fourier-gr3:c12` | https://www.fftai.com/uploads/upload/images/20250825/e93465d6490a9d209eeb3bf9cb04f8b4.png | GR-3 newsroom記事画像。inOperation候補 | GR-3 newsroom記事文脈 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`, 人物有無。GR-3Cとの外観差を画像単体から確定できる候補は未確認。PDFは仕様確認に使ったが、PDFスクリーンショットを画像候補としては登録していない。

### booster-t1

確認ページ: https://www.booster.tech/booster-t1/ 、https://www.booster.tech/robocup/ 、https://www.booster.tech/news/ 、https://www.booster.tech/open-source/ 、https://www.booster.tech/service/

T1製品ページはBasic、Standard、Customizedを別variantとして表示し、約1.2m/約30kg、23–41 DoF、RoboCup 2025 AdultSize champion等を記載する。画像URLはvariant別heroとして分かるものと、ページ内の共通仕様画像を分けた。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `booster-t1:c1` | https://www.booster.tech/_astro/hero-basic.BQe3HROB_Z1VSNvX.webp | T1 Basic hero | T1 Basicのページ文脈 | `family-only` |
| `booster-t1:c2` | https://www.booster.tech/_astro/hero-standard.D2CO_ooJ_1C5L4O.webp | T1 Standard hero | T1 Standardのページ文脈 | `family-only` |
| `booster-t1:c3` | https://www.booster.tech/_astro/hero-customized.CUVCzENC_ZbY8i4.webp | T1 Customized hero | T1 Customizedのページ文脈 | `family-only` |
| `booster-t1:c4` | https://www.booster.tech/_astro/specification-t1.CmWYO9Pz_zox76.webp | T1 specification image | T1製品ページ明記 | `visual-unconfirmed` |
| `booster-t1:c5` | https://www.booster.tech/_astro/booster-t1-icon.sJSfQkhB_Z1JPU0J.webp | RoboCup pageのT1 icon。hero/transparent候補 | T1ラベル付き | `visual-unconfirmed` |
| `booster-t1:c6` | https://www.booster.tech/_astro/application-1.DLQHaPdO_5Up9m.webp | RoboCup/customer application。inOperation/mobility候補 | T1/K1 application page文脈、個別機種は要画像確認 | `visual-unconfirmed` |
| `booster-t1:c7` | https://www.booster.tech/_astro/customer-case-1.CBLdM2rK_Yy95Q.webp | customer case。inOperation/scale候補 | T1/K1 customer case page文脈、個別機種は要画像確認 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、確実な`side`, `endEffector`, `scale`。Basic/Standard/Customizedのvariant名はページ位置で分かるが、generic T1 targetへの単一variant確定は行わない。

### kawasaki-kaleido

確認ページ: https://kawasakirobotics.com/asia-oceania/blog/20260316_kaleido9/ 、https://kawasakirobotics.com/asia-oceania/blog/202511_kaleido/ 、https://kawasakirobotics.com/jp/blog/category/kaleido/ 、https://kawasakirobotics.com/asia-oceania/blog/category/kaleido-humanoid-robot/page/2/ 、https://global.kawasaki.com/en/site_policy/index.html 、https://kawasakirobotics.com/eu-africa/imprint-emea/

ローカルinventory上の対象はKaleido 9（2025/2026文脈）だが、target名はgeneric `Kaleido`。Kaleido 9ページの候補は対象世代のページ文脈、系譜ページの旧世代画像は `family-only` とした。既存heroの旧世代RHP Kaleido treadmill画像は変更しない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `kawasaki-kaleido:c1` | https://kawasakirobotics.com/tachyon/sites/3/2026/03/Kaleido2603_2.png | Kaleido 9公式記事のmain画像。hero/inOperation候補 | Kaleido 9ページ明記 | `visual-unconfirmed` |
| `kawasaki-kaleido:c2` | https://kawasakirobotics.com/tachyon/sites/4/2026/01/Kaleido-keifu_EN-1.jpg | Kaleido系譜図。family/technical候補 | Kaleido lineage、単一世代ではない | `family-only` |
| `kawasaki-kaleido:c3` | https://kawasakirobotics.com/tachyon/sites/3/2025/11/Kaleido3.jpg?w=900 | 旧世代Kaleido系譜記事画像。family/inOperation候補 | 旧世代ページ文脈 | `family-only` |
| `kawasaki-kaleido:c4` | https://kawasakirobotics.com/tachyon/sites/3/2025/11/Kaleido4.png?w=900 | 旧世代Kaleido系譜記事画像。family/inOperation候補 | 旧世代ページ文脈 | `family-only` |
| `kawasaki-kaleido:c5` | https://kawasakirobotics.com/tachyon/sites/3/2025/11/Kaleido7.png?w=900 | 旧世代Kaleido系譜記事画像。family/inOperation候補 | 旧世代ページ文脈 | `family-only` |
| `kawasaki-kaleido:c6` | https://kawasakirobotics.com/tachyon/sites/3/2025/11/92526203b440315665dba698e31d6fcb.jpg | 系譜記事の実機候補。family/scale候補 | 旧世代または系譜ページ文脈 | `family-only` |

role未発見: Kaleido 9専用の`transparent`, `side`, `endEffector`, 人物有無。Kaleido 9ページでLiDAR/SLAM、障害物・人物・階段回避、Kaleido Stationの説明は確認できるが、旧世代画像をKaleido 9へ流用しない。

### booster-k1

確認ページ: https://www.booster.tech/booster-k1/ 、https://www.booster.tech/robocup/ 、https://www.booster.tech/news/ 、https://www.booster.tech/open-source/ 、https://www.booster.tech/service/

K1製品ページはGeek、Education、Professionalのvariantを表示し、95cm/約19.5kg、22 DoF、RoboCup 2025 KidSize関連実績を記載する。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `booster-k1:c1` | https://www.booster.tech/_astro/hero-geek.CeXOLaGf_1PBGV.webp | K1 Geek hero | K1 Geekのページ文脈 | `family-only` |
| `booster-k1:c2` | https://www.booster.tech/_astro/hero-education.CH1Ty4ev_LmfbO.webp | K1 Education hero | K1 Educationのページ文脈 | `family-only` |
| `booster-k1:c3` | https://www.booster.tech/_astro/hero-professional.BqT93m7t_VyGAY.webp | K1 Professional hero | K1 Professionalのページ文脈 | `family-only` |
| `booster-k1:c4` | https://www.booster.tech/_astro/specification-k1.CqLuX2Lk_2pgwi9.webp | K1 specification image | K1製品ページ明記 | `visual-unconfirmed` |
| `booster-k1:c5` | https://www.booster.tech/_astro/booster-k1-icon.B4spZbUt_21E9sx.webp | RoboCup pageのK1 icon。hero/transparent候補 | K1ラベル付き | `visual-unconfirmed` |
| `booster-k1:c6` | https://www.booster.tech/_astro/application-1.DLQHaPdO_5Up9m.webp | RoboCup/customer application。inOperation/mobility候補 | T1/K1 application page文脈、個別機種は要画像確認 | `visual-unconfirmed` |
| `booster-k1:c7` | https://www.booster.tech/_astro/customer-case-1.CBLdM2rK_Yy95Q.webp | customer case。inOperation/scale候補 | T1/K1 customer case page文脈、個別機種は要画像確認 | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、確実な`side`, `endEffector`, `scale`。generic K1へのvariant単一割当は行わない。

### limx-oli

確認ページ: https://limxdynamics.com/en/products/oli 、https://limxdynamics.com/en/products/oli/video 、https://www.limxdynamics.com/en/news 、https://www.limxdynamics.com/en/news/BK000043 、https://support.limxdynamics.com/en/docs-center 、https://limxdynamics.com/en/policy

Oliページは165cm、31 DoF、複数end-effector、quick-swap battery、depth cameras、複数バージョンを記載する。また、ページ上の画像・動画・画面は説明用で実際の外観・構成と異なり得る旨がある。candidate roleはページセクションまたは動画タイトルから付与した。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `limx-oli:c1` | https://limx-video.oss-cn-beijing.aliyuncs.com/limx-website/products/oli/oli-run.webp | Oli製品ページmain/run画像。hero/mobility候補 | Oli製品ページ明記 | `visual-unconfirmed` |
| `limx-oli:c2` | https://limx-video.oss-cn-beijing.aliyuncs.com/limx-website/products/oli/m-oli-run.webp | Oli mobile/alternate run画像。mobility候補 | Oli製品ページ明記 | `visual-unconfirmed` |
| `limx-oli:c3` | https://oss.limxdynamics.com/uploads/image/2026/01/05/1767600253924_%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_2025-07-30_093758_628.jpg | Oli Introduction Video thumbnail。hero/inOperation候補 | Oli video centerのタイトル・ページ文脈 | `visual-unconfirmed` |
| `limx-oli:c4` | https://oss.limxdynamics.com/uploads/image/2026/01/26/1769408353872_%E6%97%A5%E5%BF%97%E4%B8%8B%E8%BD%BD.png | Log Download thumbnail。technical候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c5` | https://oss.limxdynamics.com/uploads/image/2026/01/26/1769408424406_%E8%BD%AF%E4%BB%B6%E5%8D%87%E7%BA%A7.png | Software Upgrade thumbnail。technical候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c6` | https://oss.limxdynamics.com/uploads/image/2026/01/26/1769408542524_%E8%AE%BE%E5%A4%87%E5%85%85%E7%94%B5.png | Device Charging Example thumbnail。inOperation/technical候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c7` | https://oss.limxdynamics.com/uploads/image/2026/01/26/1769408597704_%E6%A0%A1%E9%9B%B6.png | Zero Calibration thumbnail。technical候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c8` | https://oss.limxdynamics.com/uploads/image/2026/01/26/1769408918467_%E9%81%A5%E6%8E%A7%E6%93%8D%E4%BD%9C%E7%A4%BA%E4%BE%8B.png | Remote Control Operation Example thumbnail。inOperation候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c9` | https://oss.limxdynamics.com/uploads/image/2026/05/05/1777953543167_%E5%AF%BC%E8%A7%88%E5%B0%81%E9%9D%A2.webp | Smart Guidance story thumbnail。inOperation候補 | Oli video center | `visual-unconfirmed` |
| `limx-oli:c10` | https://oss.limxdynamics.com/uploads/image/2026/01/05/1767609953115_%E8%8B%B1%E6%96%87.jpeg | Oli cultural/story thumbnail。inOperation/scale候補 | Oli video center | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `endEffector`, 人物有無。動画centerにはconstruction debris、autonomous tennis-ball pickup等のOli記事タイトルもあるが、今回の再オープンでは別の画像URLが取得できなかった。

### mentee-menteebotv3

確認ページ: https://www.menteebot.com/bot/ 、https://www.menteebot.com/ 、https://www.menteebot.com/aifirst/ 、https://www.menteebot.com/blog/ 、https://www.menteebot.com/news/ 、https://www.mobileye.com/press-kit/mobileye-agrees-to-acquire-mentee-robotics/ 、https://www.mobileye.com/terms-of-use/

MenteeBot公式ページはaltで`MenteeBot humanoid robot V3`を明記し、175cm/70kg、1.5m/s、25kg carry、40 DoF等を記載する。Mobileyeの公式press kitは「official press materials and visual assets」としてMenteeBot 3.0の倉庫・家庭・操作シーンを掲載するが、Mobileye規約上、press kit表示だけで再利用許諾済みとは扱わない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `mentee-menteebotv3:c1` | https://www.menteebot.com/demo-videos/MenteeBot_v3_head.png | MenteeBot V3 head。transparent/endEffector候補 | 公式alt・ページ文脈でV3明記 | `visual-unconfirmed` |
| `mentee-menteebotv3:c2` | https://www.menteebot.com/demo-videos/MenteeBot_v3.png | MenteeBot V3全身。hero/transparent候補 | 公式alt・ページ文脈でV3明記 | `visual-unconfirmed` |
| `mentee-menteebotv3:c3` | https://static.mobileye.com/website/us/corporate/images/afa43d0bb6d179df2aea3f407dd39b28_1767531378872.jpg | Mobileye press kitのMenteeBot 3.0 hero/banner | MenteeBot 3.0 press-kit文脈 | `visual-unconfirmed` |
| `mentee-menteebotv3:c4` | https://static2.mobileye.com/img?h=504&p=top&s=us%2Fcorporate%2Fimages%2Fb59d93a65a22f25f2af0aee8c5875671_1767307915456.png&t=240&w=1072 | AI-first vertical integration説明画像。hero/feature候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c5` | https://static2.mobileye.com/img?h=504&p=top&s=us%2Fcorporate%2Fimages%2F52c63020e358d7138369de74fe3173e0_1767527380378.jpg&w=1072 | locomotion/scene understanding/manipulationの説明画像。inOperation候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c6` | https://static2.mobileye.com/img?h=504&p=top&s=us%2Fcorporate%2Fimages%2F5183ac452bccfd3474d278ca7832afb1_1767307979553.png&w=1072 | camera-only sensing・motors・dexterity説明画像。endEffector/feature候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c7` | https://static2.mobileye.com/img?h=504&p=bottom&s=us%2Fcorporate%2Fimages%2F9fc72b7ae3c1c352da484123f170a7db_1767527567772.jpg&w=1072 | hands full range説明画像。endEffector候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c8` | https://static2.mobileye.com/img?h=504&p=auto&s=us%2Fcorporate%2Fimages%2F5f7588f3c0140dfaadcf96d10977f75a_1767527628086.jpg&w=1072 | hot-swappable battery説明画像。inOperation候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c9` | https://static2.mobileye.com/img?h=504&p=auto&s=us%2Fcorporate%2Fimages%2Ff3e1654bee4f9f0ed75ffaa250ed6f00_1767527696951.jpg&w=1072 | household/industrial warehouse dexterity。inOperation候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c10` | https://static2.mobileye.com/img?h=504&p=auto&s=us%2Fcorporate%2Fimages%2Fc283358632d89ef9223731aedb55227c_1767308160268.jpg&w=1072 | 2 robots transferring 32 boxes。inOperation/scale候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c11` | https://static2.mobileye.com/img?h=504&p=auto&s=us%2Fcorporate%2Fimages%2Feb2b96dd02d9d320f0288dd6af75df86_1767308140493.png&w=1072 | autonomous task workflow。inOperation候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c12` | https://static2.mobileye.com/img?h=504&p=auto&s=us%2Fcorporate%2Fimages%2Fb38fae77fd572fe2ac104f1426aa2c6c_1767308179900.jpg&w=1072 | coordinated warehouse workflow。inOperation/scale候補 | MenteeBot press-kit caption | `visual-unconfirmed` |
| `mentee-menteebotv3:c13` | https://static2.mobileye.com/img?h=504&p=top&s=us%2Fcorporate%2Fimages%2Fda462d73801363cf25da3ed482fc8f6f_1767308205129.jpg&t=550&w=1072 | steady locomotion/manipulation。mobility/inOperation候補 | MenteeBot press-kit caption | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した人物有無、確実な`transparent`, `side`, `scale`。公式MenteeサイトのTerms of Use本文は閲覧経路上で取得できなかったため、権利状態は未確定のまま。Mobileye press kit候補はMobileye policy IDを紐付ける。

### unitree-g1-d

確認ページ: https://www.unitree.com/mobile/G1-D/ 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

G1-DページはEnd-to-End Platform for Humanoid Robotとして、data acquisition、training/inference、higher-DoF platform、wheel/liftによる0–2m workspace、Service/Life/Retail/Industryのシナリオ、Standard/Flagshipの比較を掲載する。以下はページのfeature順・画像URLの原典文脈でまとめた候補で、pixel未確認のため人物・背景は断定しない。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-g1-d:c1` | https://www.unitree.com/images/7f4f8e4ff1b64850842fbc819f75d27e_1450x1834.png | Higher-DOF robot platform feature。hero/technical候補 | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c2` | https://www.unitree.com/images/06b395ae98ec49c0a6344dfa49e10aab_1450x1834.png | Expanded workspace/lift feature候補。mobility/inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c3` | https://www.unitree.com/images/9faf12d3ad1a4be59d244c738ee8e251_1450x1834.png | Lower-latency control/gripper feature候補。endEffector/inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c4` | https://www.unitree.com/images/676abf15fe5940dfa3b6e2d48dbbc5b1_1692x882.png | data acquisition/training pipeline feature候補。technical | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c5` | https://www.unitree.com/images/6b618dfc61d643d884f15978c1949343_1692x882.png | data pipeline feature候補。technical | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c6` | https://www.unitree.com/images/9590b8c8a0b04b0cb265ae289b31f4ac_1692x882.png | training/inference feature候補。technical | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c7` | https://www.unitree.com/images/ba2ca974149d4408b2a657a95a4cfeb1_1692x882.png | training/inference feature候補。technical | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c8` | https://www.unitree.com/images/7277d80a920746bab517079ee7ca6102_1692x882.png | Service/Life/Retail/Industry scenario feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c9` | https://www.unitree.com/images/2398d34df4e6470fbca8fb3d0537ec56_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c10` | https://www.unitree.com/images/8b7ec4fcf9cc4244842b725c68833da7_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c11` | https://www.unitree.com/images/9798a45b325244b184a1a4a15b7b1baf_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c12` | https://www.unitree.com/images/71b56f12d3b04d0da8e0624f4ab8f844_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c13` | https://www.unitree.com/images/c9d6233d8e1c439986259947508c5477_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c14` | https://www.unitree.com/images/b8b5a0212a0f47deb564a2e79125f330_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c15` | https://www.unitree.com/images/69e5130831e6496187da0eed0c1f2261_1692x882.png | scenario/application feature候補。inOperation | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c16` | https://www.unitree.com/images/7d86422e67fd4d16b471cd715067fa13_782x582.jpg | application example候補。inOperation/scale | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c17` | https://www.unitree.com/images/3acf50d3772d43daa4a5b4c93f867bc4_604x582.jpg | application example候補。inOperation/scale | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c18` | https://www.unitree.com/images/bf8ed588a9c04af5ad6f1d2a40697c2d_604x582.jpg | application example候補。inOperation/scale | G1-D明記ページ | `visual-unconfirmed` |
| `unitree-g1-d:c19` | https://www.unitree.com/images/dc506b51d3db4f3f9b404b8ae0eb8e40_782x582.jpg | application example候補。inOperation/scale | G1-D明記ページ | `visual-unconfirmed` |

role未発見: 画像ピクセルで確認した`transparent`, `side`, `scale`、Standard/Flagshipを画像単体で特定できる候補。G1-Dページのfeature/application文脈からrole候補は整理できるが、公開台帳へ直接転記する作業はしていない。

## Existing baseline check

- B2対象の既存画像は現行`reference-attributed`表示承認済みbaselineとして維持する。
- 既存Robot画像26件、structured logo 8件の削除、退避、再分類、`rights.status`変更なし。
- `reference-attributed`を`commercial-permitted`または明示許諾済みとは表現していない。
- このファイルは調査成果物であり、公開データ・アプリコードではない。
- `no-usable-candidate`は使用していない。B2では、候補が確認できないroleや確認ページについてのみ `not-found-on-reviewed-pages` 相当の記録を残し、全公式経路と権利条件の最終判断は保留する。
