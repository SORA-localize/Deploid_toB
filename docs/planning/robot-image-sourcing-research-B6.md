# B6 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `figure-03`, `sanctuary-phoenix`, `ubtech-walker-s1`, `ubtech-walker-x`
- 作業範囲: 公式製品ページ、公式news/mediaページ、公式利用規約・IPページ、公式ページから辿れる原典画像URLの再確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の削除・退避・再分類、`rights.status`変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の記録

列挙した直接画像URLは、公式ページの画像リンクをブラウザ経由で再オープンした。Figure、Sanctuary、UBTECHの各URLについて、公式ページとの対応、URL、alt・ファイル名・周辺見出しは確認できた。一方、この閲覧環境では画像バイナリを保存せずに画素がAIへ返らないURLがあり、画像そのものの色、背景の細部、人物の実際の写り込み、透明背景、切り抜き、左右側面は断定していない。

したがって、B6の直接画像候補はすべて、画素を受信できなかったものを `visual-unconfirmed` とした。ページ見出しが示す機体、用途、場面はページ文脈として記録しており、画素を目視したという意味ではない。Phoenixの世代表記のように、ページ文脈と既存素材のaltが一致しないものは `family-only` とした。`no-usable-candidate` は使用していない。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:figure:site-terms:2026-07-15` | Figure AI | https://www.figure.ai/terms-and-conditions / https://www.figure.ai/figure | Termsはsiteのtext、graphics、logos、images等をFigureまたはsupplierのpropertyとし、personal use only、変更・公開・送信・販売・derivative works等を禁止。その他の利用にはFigureと著作権者のexpress written permissionが必要で、implied licenseはない。 |
| `policy:sanctuary:site-terms:2026-07-15` | Sanctuary AI | https://www.sanctuary.ai/terms / https://sanctuary.ai/ip-notice/ | Termsはsiteのgraphics、products、designs、media、files等をSanctuaryまたはlicensorのIPとし、個人的なvisit以外の権利を付与しない。copy、modify、distribute、commercialize等はexpress prior written consentなしに不可。IP noticeもsite contentのreproduce、store、transmitにはwritten permissionが必要とする。 |
| `policy:ubtech:site-terms:2026-07-15` | UBTECH Robotics | https://www.ubtrobot.com/en/privacy/term-of-use | Websiteへのアクセス権はpersonal、revocable、non-transferable、non-exclusive、non-commercial。画像を含むsite contentはUBTECHまたはlicensorのcopyrightで、prior written permissionなしのcopy、distribute、display、commercial useを禁止。 |

## Candidate inventory

### figure-03

確認ページ: https://www.figure.ai/figure 、https://www.figure.ai/news/introducing-figure-03?id=Figure03 、https://www.figure.ai/news 、https://www.figure.ai/news/production-at-bmw 、https://www.figure.ai/terms-and-conditions

`/figure`はページタイトルを`Figure 03`とし、laundry、cleaning、dishes等のhome task、5'8"、20KG payload、61KG、5HR runtimeを掲載する。公式紹介記事はFigure 03を3rd-generation humanoidとして、Helix、home、mass manufacturing、commercial applications向けに説明し、camera、palm camera、tactile hand、wireless charging、soft textileを記載する。variantはページ文脈からFigure 03と特定できる。

目視メタデータ: `human-form-module-figure-3-image-v3.png`とmobile版は公式Figure 03ページのresponsive画像リンクとして展開できた。ページのhome/product文脈は確認できるが、人物の有無、背景、立位・動作、実際のトリミングは画素未取得。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `figure-03:c1` | https://images.ctfassets.net/qx5k8y1u9drj/6rREWE2DjWe7W3AFbZYSyH/21889f6a8f17464410b45c9ae12b718a/human-form-module-figure-3-image-v3.png?fm=webp&q=70&w=3840 | Figure 03のhuman-form/product module画像。hero/product候補。背景・人物は画素未確認 | `/figure`のページタイトルとファイル名がFigure 03を明記 | `visual-unconfirmed` |
| `figure-03:c2` | https://images.ctfassets.net/qx5k8y1u9drj/3Cc9Kd1x25aka6drALqU6V/be9423fb4658c2b93c76b71587cd21ed/human-form-module-figure-3-image-mobile-v3.png?fm=webp&q=70&w=3840 | 同じFigure 03 moduleのmobile responsive候補。hero/product候補。背景・人物は画素未確認 | `/figure`のFigure 03ページ | `visual-unconfirmed` |
| `figure-03:c3` | —（`introducing-figure-03`本文内の画像はreviewed browserで直接asset URLが露出しない） | Helix/home/hand sensory文脈のinline product/detail画像候補。背景・人物は未確認 | Figure 03紹介記事の見出し・本文が明記 | `visual-unconfirmed` |

role未発見: Figure 03として画素で確定した人物有無、transparent/side専用asset、現行Figure 03のendEffector専用asset。既存のendEffector出典ページは下記の再確認欄に分けた。

### sanctuary-phoenix

確認ページ: https://sanctuary.ai/news/sanctuary-ai-unveils-phoenix-a-humanoid-general-purpose-robot-designed-for-work/ 、https://sanctuary.ai/news/ 、https://www.sanctuary.ai/terms 、https://sanctuary.ai/ip-notice/

公式Phoenix記事はPhoenixをCarbonで動くsixth-generation general-purpose humanoidとして掲載し、5'7"、155 lbs、55 lbs payload、3 mph、20 DoF hands、haptic technology、bolder color palette/elevated texturesを記載する。記事本文はwork tasksとcommercial deploymentの文脈を持つ。画像リンクのaltにもCarbonとsixth-generationの説明がある。

既存ローカルheroのaltは`Sanctuary AI Phoenix Gen 8 torso`だが、現行出典ページ本文はsixth-generationと記載している。この世代差は同一画像の画素から解消できていないため、機体familyの候補として保持し、既存baselineのstatusや分類は変更しない。

目視メタデータ: `main-image-phoenix-annoucement-1.webp`を公式記事の画像リンクから開いた。PhoenixとCarbon、sixth-generationのページ文脈は確認できるが、人物の有無、背景、実際のtorso crop、色・世代の画素判定は未確認。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `sanctuary-phoenix:c1` | https://sanctuary.ai/wp-content/uploads/2023/05/main-image-phoenix-annoucement-1.webp | Phoenix announcementのhero/product画像。general-purpose work/Carbon文脈。背景・人物は画素未確認 | Phoenix記事の画像altと本文がPhoenix sixth-generationを明記。ただし既存altのGen 8とは差がある | `family-only` |
| `sanctuary-phoenix:c2` | —（Phoenix記事内のhands/detail画像候補はreviewed browserで直接asset URLが露出しない） | 20 DoF hands、haptic、fine manipulationのdetail/endEffector候補。画像の人物・背景は未確認 | Phoenix記事のAbout Phoenix文脈 | `visual-unconfirmed` |

role未発見: 世代を画素で確定したheroとendEffectorの組、transparent/side、factory-specific背景。`c1`は公式候補として残すが、sixth-generationと既存Gen 8の差を解消済みとは扱わない。

### ubtech-walker-s1

確認ページ: https://www.ubtrobot.com/en/humanoid/products/walker-s1 、https://www.ubtrobot.com/en/privacy/term-of-use

Walker S1ページはindustrial domains向けのWalker S1として、LLM general task planning、semantic VSLAM navigation、whole-body motion control、車両製造assembly lineへの投入を記載する。ページ内画像はhero、仕様、navigation、motion control、industrial applicationに分かれており、variantはWalker S1とページ文脈から特定できる。

目視メタデータ: 下表の画像URLは、ページ内のalt/file nameと見出しに対応するリンクを実際に開いた。画素は返らなかったため、人物、工場の実背景、機体の姿勢・色・切り抜きは未確認。`walkers1_bg8.png`のみ、ページ本文の「vehicle manufacturing assembly lines」と同じindustrial application sectionの画像としてroleを記録する。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-s1:c1` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/10/13/600678134571077.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `walkers1_bg1_wap.jpg`。Walker S1 hero/product候補。industrial domain文脈、背景・人物は画素未確認 | Walker S1ページのhero | `visual-unconfirmed` |
| `ubtech-walker-s1:c2` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/10/14/601089298387013.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerS1_info_en.png`。spec/product infographic候補。人物・背景は画素未確認 | Walker S1ページの仕様section | `visual-unconfirmed` |
| `ubtech-walker-s1:c3` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/10/13/600691792588869.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `walkers1_bg4.jpg`。semantic VSLAM/navigation候補。実環境・人物は画素未確認 | Walker S1ページのSemantic VSLAM section | `visual-unconfirmed` |
| `ubtech-walker-s1:c4` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/10/13/600679979450437.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `walkers1_bg5.jpg`。whole-body motion/manipulation候補。背景・人物は画素未確認 | Walker S1ページのmotion-control section | `visual-unconfirmed` |
| `ubtech-walker-s1:c5` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/10/14/601106640814149.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `walkers1_bg8.png`。vehicle manufacturing assembly-line/inOperation・scale候補。factory背景・人物はページ本文でなく画素未確認 | Walker S1のindustrial application section | `visual-unconfirmed` |
| `ubtech-walker-s1:c6` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/08/16/580157404647493.jpg?id=580157404647493&sid=433803009003589%3Fimage_process%3Dformat%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10&st=AliyunOSS&type=resource | `walkerS_pc9.jpg`。partner/contactまたはproduct contextの追加候補。場面・人物は画素未確認 | Walker S1ページ内の追加画像 | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、toteを持つ正確な構図、transparent/side。既存heroのaltが示す「factoryでtoteを持つ」文脈は、source pageのindustrial applicationと整合する候補として記録するが、既存素材は変更しない。

### ubtech-walker-x

確認ページ: https://www.ubtrobot.com/en/humanoid/products/walker-x 、https://www.ubtrobot.com/en/privacy/term-of-use

Walker XページはWalker Xをhumanoid service robotとして、new appearance、41 servo joints、hand-eye coordination、full-body safe interaction、U-SLAM navigation、visual intelligence、smart home controlを掲載する。身長130cm、重量63kg、41 DoF、3km/h等のWalker X固有仕様も同ページにあるため、下表のvariantはWalker Xと特定できる。

目視メタデータ: 下表のdirect asset URLはWalker Xページの画像リンクを開いたもの。`WalkerXStructured`はstructured terrain、`WalkerXHandEye`はobject manipulation、`WalkerXSafe`はsafe interaction、`WalkerX_wep(5).jpg`はU-SLAM sectionのページ文脈でroleを付けた。画素は返らず、人物の実際の有無、背景、姿勢、透明処理は未確認。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `ubtech-walker-x:c1` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/products/WalkerX/WalkerXbuilderpc.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerXbuilderpc.png`。Walker X product builder/hero候補。背景・人物は画素未確認 | Walker Xページのhero/product section | `visual-unconfirmed` |
| `ubtech-walker-x:c2` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/products/WalkerX/WalkerXNew.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerXNew.jpg`。new appearance/product候補。背景・人物は画素未確認 | Walker XページのNew Appearance section | `visual-unconfirmed` |
| `ubtech-walker-x:c3` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/products/WalkerX/WalkerXStructured.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerXStructured.jpg`。gravel/tile/carpet/lawn等のstructured terrain walking/inOperation候補。人物・背景は画素未確認 | Walker Xページのstructured terrain section | `visual-unconfirmed` |
| `ubtech-walker-x:c4` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/products/WalkerX/WalkerXHandEye.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerXHandEye.png`。hand-eye/object manipulation・endEffector候補。対象物・人物は画素未確認 | Walker XページのHand-Eye Coordination section | `visual-unconfirmed` |
| `ubtech-walker-x:c5` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/products/WalkerX/WalkerXSafe.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerXSafe.png`。full-body flexibility/safe interaction候補。人物の実際の有無は画素未確認 | Walker XページのFull-Body Flexibility section | `visual-unconfirmed` |
| `ubtech-walker-x:c6` | https://owebsite-cdn.ubtrobot.com/resources/image/2024/03/25/529310087573573.jpg?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `WalkerX_wep(5).jpg`。U-SLAM/navigation・dynamic scene候補。背景・人物は画素未確認 | Walker XページのU-SLAM section | `visual-unconfirmed` |
| `ubtech-walker-x:c7` | https://owebsite-cdn.ubtrobot.com/en/uploadfiles/1WalkerXControl.png?image_process=format%2Cwebp%2Fquality%2CQ_50%2Fblur%2C3%2Fresize%2Cfw_10%2Cfh_10 | `1WalkerXControl.png`。self-balancing/interference resistance・motion候補。背景・人物は画素未確認 | Walker Xページのcontrol section | `visual-unconfirmed` |

role未発見: 画素で確定した人物有無、透明背景、正面/側面の優先画像、interactionの実人物構図。variantはページとasset pathでWalker Xに一致し、別Walker familyへの曖昧さはない。

## 既存published素材の出典再確認（baseline維持）

| robot | 既存登録role | 現行source page再確認 | 再確認結果 | 今回の扱い |
|---|---|---|---|---|
| `figure-03` | `hero`, `endEffector` | https://www.figure.ai/figure / https://www.figure.ai/news/production-at-bmw | `/figure`は現行Figure 03で、heroの機種文脈は一致。`production-at-bmw`の現行記事タイトルはF.02で、bodyもFigure 02のBMW実証・手/前腕を説明するため、Figure 03専用endEffectorとしての機種一致は未確定 | 既存の`reference-attributed`、ファイル、出典、rightsは変更しない。候補c1/c2をFigure 03向け追加検討材料として残す |
| `sanctuary-phoenix` | `hero`, `endEffector` | https://sanctuary.ai/news/sanctuary-ai-unveils-phoenix-a-humanoid-general-purpose-robot-designed-for-work/ | 出典記事はPhoenix sixth-generation。既存hero altのGen 8と世代表記が一致しないため、同一variantの確定は保留 | 既存の`reference-attributed`、ファイル、出典、rightsは変更しない。世代差を再審査事項として残す |
| `ubtech-walker-s1` | `hero`, `endEffector` | https://www.ubtrobot.com/en/humanoid/products/walker-s1 | ページタイトル、画像section、industrial applicationがWalker S1で一致。既存heroのfactory/tote文脈はページ用途と整合するが、画素は今回も取得していない | 既存の`reference-attributed`、ファイル、出典、rightsは変更しない |
| `ubtech-walker-x` | `hero`, `endEffector` | https://www.ubtrobot.com/en/humanoid/products/walker-x | ページタイトル、Walker X asset path、new appearance/hand-eye sectionsが一致 | 既存の`reference-attributed`、ファイル、出典、rightsは変更しない |

## B6の扱い

- 4機体の公式製品・media/news・legal経路を確認し、候補ページ、直接画像URL、ページ文脈、機種一致、role、確認日を保存した。
- 直接画像URLはブラウザで再オープンしたが、画素がAIに返らないため `visual-confirmed` は付けていない。背景・人物の有無を推測していない。
- Figure 03の現行製品ページは直接asset URLまで確認できた。Figure 03の既存endEffector出典は現行ページ上でF.02文脈、Phoenixは既存Gen 8表記と公式sixth-generation表記に差があるため、同一性の再審査事項を残した。
- `no-usable-candidate`は使用していない。候補の公開可否、commercial-permitted、明示許諾済み、`rights.status`は確定していない。
- 既存の`reference-attributed`画像baselineを維持し、削除・退避・再分類・rights変更を行っていない。structured logo baselineにも触れていない。
