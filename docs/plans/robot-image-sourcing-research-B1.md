---
status: plan
updated: 2026-07-20
---

# B1 読み取り専用素材候補調査

- 確認日: 2026-07-15 (JST)
- 対象: `aeolus-aeo`, `unitree-r1`, `unitree-r1-standard`, `agibot-a2`, `fourier-gr1`
- 作業範囲: 公式製品ページ、公式media/newsページ、公式利用規約、原典画像URLの確認
- 禁止操作: 画像保存・ダウンロード、`public/`・`data/`登録、既存素材の変更、rights変更、問い合わせ送信
- 調査状態: `visual-confirmed` / `family-only` / `visual-unconfirmed` / `not-found-on-reviewed-pages`

## 視覚確認の制約

原典ページの画像リンクはブラウザ経由で再オープンした。今回の閲覧環境では、画像URLの存在・原典ページ上の見出し・alt/caption・ページ位置は取得できたが、画像バイナリを保存せずに画素表示をAIへ転送する結果は返らなかった。したがって、画素そのものに依存する判定は `visual-unconfirmed` とし、ページ文脈だけで機種を推定しない。

## Manufacturer policy

| policyId | manufacturer | 確認ページ | 調査結果 |
|---|---|---|---|
| `policy:aeolus:site-terms:2026-07-15` | Aeolus Robotics | https://aeolusbot.com/policy/terms-of-use | 個人・非商用の閲覧以外の複製、再公開、表示、他サイトへの組み込み等は事前の明示的な書面同意が必要。 |
| `policy:unitree:shop-terms:2026-07-15` | Unitree Robotics | https://shop.unitree.com/policies/terms-of-service | サービスの複製、コピー、再販売、利用等に明示的な書面許可が必要。画像再利用許可は確認できない。 |
| `policy:agibot:store-terms:2026-07-15` | AGIBOT | https://store.agibot.com/policies/terms-of-service | 画像等は個人・非商用利用のみ。複製、公開表示、再公開、download等に事前の書面同意が必要。 |
| `policy:fourier:site-terms:2026-07-15` | Fourier Intelligence | https://www.fftai.com/term_use | 画像の再利用許諾条項は確認できない。知財窓口は https://www.fftai.com/legal-affairs 。 |

## Candidate inventory

### aeolus-aeo

確認ページ: https://www.aeolusbot.com/ 、https://www.aeolusbot.com/why-aeolus 、https://aeolusbot.com/policy/terms-of-use

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `aeolus-aeo:c1` | https://www.aeolusbot.com/_next/static/media/future.0a3b5f18.png | Why Aeolus内の`robot`画像。hero候補 | aeoページ文脈のみ | `visual-unconfirmed` |
| `aeolus-aeo:c2` | https://www.aeolusbot.com/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Ftsa.7e45747f.png&w=640 | Taipei Songshan Airport導入画像。inOperation候補 | 顧客導入ページ文脈のみ | `visual-unconfirmed` |
| `aeolus-aeo:c3` | https://www.aeolusbot.com/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Ftya.d3213572.png&w=640 | Taoyuan Airport導入画像。inOperation候補 | 顧客導入ページ文脈のみ | `visual-unconfirmed` |
| `aeolus-aeo:c4` | https://www.aeolusbot.com/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fmcs.1c66ad7b.png&w=384 | MCS導入画像。inOperation候補 | 顧客導入ページ文脈のみ | `visual-unconfirmed` |
| `aeolus-aeo:c5` | https://www.aeolusbot.com/_next/image?q=75&url=%2F_next%2Fstatic%2Fmedia%2Fntcg.427e629c.png&w=640 | Taipei City Government導入画像。inOperation候補 | 顧客導入ページ文脈のみ | `visual-unconfirmed` |

role未発見: `transparent`, `side`, `scale`, 専用`endEffector`。`mobility`は導入画像を候補としたが、移動機構が主被写体か未確認。

### unitree-r1 / unitree-r1-standard

確認ページ: https://www.unitree.com/mobile/R1/ 、https://shop.unitree.com/products/unitree-r1 、https://www.unitree.com/news/ 、https://shop.unitree.com/policies/terms-of-service

ショップページはR1 Air、R1、R1 EDUの複数variantを同一ページで扱う。画像URL単体からAIRと標準R1を分離できないため、両targetは `family-only` とする。

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `unitree-r1:c1` | https://www.unitree.com/images/a9cbd5e0306e4b2aad8e0438bb44d676_1080x1524.jpg?x-oss-process=image%2Fquality%2Cq_60%2Fformat%2Cwebp | 公式R1ページのgallery。hero候補 | R1 family | `family-only` |
| `unitree-r1:c2` | https://www.unitree.com/images/ae70258f7fb6440eaa0f60fef09bb710_1080x1524.jpg?x-oss-process=image%2Fquality%2Cq_60%2Fformat%2Cwebp | 公式R1ページのgallery。hero候補 | R1 family | `family-only` |
| `unitree-r1:c3` | https://www.unitree.com/images/49d6773476984ba68aea4527d8838c7f_1080x1524.jpg?x-oss-process=image%2Fquality%2Cq_60%2Fformat%2Cwebp | 公式R1ページのgallery。hero候補 | R1 family | `family-only` |
| `unitree-r1:c4` | https://shop.unitree.com/cdn/shop/files/1.banner_b6ba48d8-d887-42c0-a94b-0d7dc997f121_1024x1024.jpg?v=1774859583 | ショップbanner。hero候補 | R1 family | `family-only` |
| `unitree-r1:c5` | https://shop.unitree.com/cdn/shop/files/1.banner_a8ee7de9-07fb-435a-a4b2-2f4fd81a261c_1024x1024.jpg?v=1774859608 | ショップbanner。hero候補 | R1 family | `family-only` |
| `unitree-r1:c6` | https://shop.unitree.com/cdn/shop/files/6._5c229421-393b-4c5b-928a-60e39b8d271f_1024x1024.jpg?v=1774859640 | `Move First, Execute Tasks`画像。inOperation/mobility候補 | R1 family | `family-only` |
| `unitree-r1:c7` | https://shop.unitree.com/cdn/shop/files/6._4c2b6c71-28e0-4057-95e9-674adb23c6d1_1024x1024.jpg?v=1774859665 | 同上 | R1 family | `family-only` |
| `unitree-r1:c8` | https://shop.unitree.com/cdn/shop/files/PC_774ffd47-cf07-4657-8f36-fae8a1f813c5_1024x1024.jpg?v=1773038913 | 同上 | R1 family | `family-only` |
| `unitree-r1:c9` | https://shop.unitree.com/cdn/shop/files/8._85040cce-76ae-43ff-ad28-7c797581f2ab_1024x1024.jpg?v=1773038971 | 同上 | R1 family | `family-only` |
| `unitree-r1:c10` | https://shop.unitree.com/cdn/shop/files/PC_70badfeb-fe8d-40d0-9404-182f818fcef8_1024x1024.jpg?v=1773039040 | 同上 | R1 family | `family-only` |
| `unitree-r1:c11` | https://shop.unitree.com/cdn/shop/files/4ab06d5d0fae9e3779190a5378aa9b02_539e04c6-374f-40df-9c8a-1a2134bef99b_1024x1024.jpg?v=1773039058 | 同上 | R1 family | `family-only` |
| `unitree-r1:c12` | https://shop.unitree.com/cdn/shop/files/9._416f182c-29f9-4b56-a425-c9346a54fc54_1024x1024.jpg?v=1773040914 | 同上 | R1 family | `family-only` |
| `unitree-r1:c13` | https://shop.unitree.com/cdn/shop/files/cd07654259771888d6f86f2d91bf1457_1024x1024.jpg?v=1773041025 | 同上 | R1 family | `family-only` |

role未発見: `transparent`, `side`, `scale`, 専用`endEffector`。`inOperation`と`mobility`は同一candidate poolであり、同じ画像を両roleへ重複登録しない。

### agibot-a2

確認ページ: https://agibot.com/products/A2 、https://www.agibot.com/article/231/detail/32.html 、https://www.agibot.com/article/231/detail/35.html 、https://store.agibot.com/policies/terms-of-service

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `agibot-a2:c1` | https://agibot.com/public/static/index/en/images/proA2Two-img.png | A2製品ページのmain image。hero候補 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c2` | https://agibot.com/public/static/index/en/images/proA2Two-wrapimg.png | A2製品ページのlayout image。hero候補 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c3` | https://agibot.com/public/static/index/en/images/a2-l1.jpg | 製品紹介画像。side/endEffector候補だがrole未確定 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c4` | https://agibot.com/public/static/index/en/images/a2-l2.jpg | 製品紹介画像。role未確定 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c5` | https://agibot.com/public/static/index/en/images/a2-l3.jpg | 自律移動・歩行セクション付近。mobility候補 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c6` | https://agibot.com/public/static/index/en/images/a2-l4.jpg | 安全セクション付近。role未確定 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c7` | https://agibot.com/public/static/index/en/images/a2-l5.jpg | 操作・保守セクション付近。role未確定 | A2明記ページ | `visual-unconfirmed` |
| `agibot-a2:c8` | https://www.agibot.com/file/ueditor/php/upload/image/20260108/1767865701918803.png | Fortuneイベント画像。inOperation候補 | 記事本文でA2明記 | `visual-unconfirmed` |
| `agibot-a2:c9` | https://www.agibot.com/file/ueditor/php/upload/image/20260108/1767865877934127.jpg | Fortuneイベント画像。inOperation候補 | 記事本文でA2明記 | `visual-unconfirmed` |
| `agibot-a2:c10` | https://www.agibot.com/file/ueditor/php/upload/image/20260119/1768815242440863.jpg | Guinness歩行記録画像。inOperation/mobility候補 | 記事本文でA2明記 | `visual-unconfirmed` |
| `agibot-a2:c11` | https://www.agibot.com/file/ueditor/php/upload/image/20260119/1768815257277590.jpg | Guinness歩行記録画像。inOperation/mobility候補 | 記事本文でA2明記 | `visual-unconfirmed` |

role未発見: `transparent`, `scale`。専用`endEffector`は製品仕様上の記載はあるが、手先主被写体の画像としては未確認。

### fourier-gr1

確認ページ: https://www.fftai.com/products-gr1 、https://www.fftai.com/newsroom-newintech/15 、https://www.fftai.com/term_use 、https://www.fftai.com/legal-affairs

| candidate | assetUrl | 内容・role候補 | 機種一致 | 調査状態 |
|---|---|---|---|---|
| `fourier-gr1:c1` | https://www.fftai.com/static/cms//images/x-gr1.png | GR-1製品ページmain image。hero候補 | GR-1明記ページ | `visual-unconfirmed` |
| `fourier-gr1:c2` | https://www.fftai.com/static/cms//images/x-gr5.jpg | Physical Dexterityセクション。endEffector候補 | GR-1明記ページ | `visual-unconfirmed` |
| `fourier-gr1:c3` | https://www.fftai.com/static/cms//images/x-gr14.jpg | Solutions for the Real World。inOperation/mobility候補 | GR-1明記ページ | `visual-unconfirmed` |
| `fourier-gr1:c4` | https://www.fftai.com/uploads/upload/images/20240926/395fc49117d1596042bec0ec887acdd4.jpg | GR-1 vision記事画像。role未確定 | 記事本文でGR-1明記 | `visual-unconfirmed` |
| `fourier-gr1:c5` | https://www.fftai.com/uploads/upload/images/20240926/9da8de33e1b27881e5feeb61eafa559a.jpg | GR-1 vision記事画像。role未確定 | 記事本文でGR-1明記 | `visual-unconfirmed` |
| `fourier-gr1:c6` | https://www.fftai.com/uploads/upload/images/20240926/68c9ff894040ea0f223586880b614526.jpg | 屋外歩行試験画像。inOperation/mobility候補 | 記事本文でGR-1明記 | `visual-unconfirmed` |

role未発見: `transparent`, `side`, `scale`。公式GR-1 PDFは確認したが、PDFのスクリーンショットを画像候補として扱っていない。

## Existing baseline check

- `aeolus-aeo`, `unitree-r1`, `unitree-r1-standard`, `agibot-a2`の既存`reference-attributed`画像は維持。
- `fourier-gr1`の既存hero `src`は空であり、今回の候補調査のみを実施。
- 既存26 Robot画像およびstructured logo 8件の削除、退避、再分類、rights変更なし。
- このファイルは調査成果物であり、公開データ・アプリコードではない。
