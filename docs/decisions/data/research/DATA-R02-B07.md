# DATA-R02-B07 — Booster Robotics + Kepler Robotics

調査日: 2026-07-17（全て本日、公式一次情報源を再取得して再検証）

対象: `booster-t1`, `booster-k1`, `kepler-k2`, `kepler-k1`（4機）

本バッチはDATA-R01の結論を証拠として採用せず、候補URLの発見にのみ利用した。全ての値は本日開いた一次情報源（メーカー公式サイト・公式プレスリリース・メーカー公式SNS投稿・GitHub公式リポジトリ）から再確認している。

---

## booster-t1（Booster T1）

- **lifecycleStatus**: `current`
- **publicationRecommendation**: `keep-published`
- **recordScope**: `product-family`（Basic / Standard / Customized。寸法・重量は3構成共通、DoF・演算構成は構成別）

### 理由

T1はbooster.techのトップページ・ストアページで、新製品T2・K1と並んで現行製品として掲載されている。「Available for worldwide shipping」の表記もあり、廃番・後継機の公式声明はない。T2は並行して販売される上位フラッグシップであり、T1の後継としては位置付けられていない。

### スペック状況

| キー | ステータス | 値 |
| --- | --- | --- |
| mobility | found | biped（共通） |
| heightCm | found | 118cm（共通） |
| weightKg | found | 30kg（共通） |
| speedMps | not-published | — |
| dof | **needs-review** | Basic/Standard 23、+グリッパー31、+器用手41（構成別） |
| payloadKg | not-published | — |
| runtimeMin | found | 歩行120分／立位240分（共通、歩行値を採用） |
| batteryCapacityWh | not-published | 10.5Ahのみ公開、電圧非公開のため換算不可 |
| chargeTimeMin | not-published | — |
| batterySystem | found | 10.5Ahバッテリー（共通） |
| controlMethod | not-published | — |
| sdk | found | Booster Robotics SDK / Gym / Train / Deploy / RoboCup Demo |
| computePlatform | **needs-review** | BasicはAGX Orin 200TOPSのみ、Standard/CustomizedはIntel i7-1370P併載（構成別） |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 価格

`priceFallback: inquiry-fallback`。公式製品ページ・/storeとも金額非公開（問い合わせフォームのみ、宛先sales@booster.tech）。

### 活用事例（上限3件）

1. Purdue University — 卓球ロボット研究（`research`）
2. Carnegie Mellon University — FALCON強化学習フレームワーク研究（`research`）
3. Tsinghua University（Hephaestusチーム）— 2025 World Humanoid Robotics Games Federation優勝（`demonstration`）

補足: Frodobots（ロボット格闘ゲーム）、UC Berkeley（FastTD3）も公式T1ページに記載あり（supplementary）。

### 未解決事項

- dofは構成により23/31/41と異なり単一値を確定できない。
- computePlatformも構成別（Basic vs Standard/Customized）で単一値を確定できない。
- 公式価格が一切非公開。

---

## booster-k1（Booster K1）

- **lifecycleStatus**: `current`
- **publicationRecommendation**: `keep-published`
- **recordScope**: `product-family`（Geek / Education / Professional。寸法・DoFは共通、稼働時間・演算・保証は構成別）

### 理由

K1はbooster.techのトップ・ストアで現行製品として掲載され、公式開始価格「From $5,999」が明記されている。廃番・後継機の公式声明はない。

### スペック状況

| キー | ステータス | 値 |
| --- | --- | --- |
| mobility | found | biped（共通） |
| heightCm | found | 95cm（共通） |
| weightKg | found | 19.5kg（共通） |
| speedMps | found | 0.4 m/s（稼働時間の測定基準速度として共通表記） |
| dof | found | 22 DoF（共通、EN/CN両ページで確認） |
| payloadKg | not-published | — |
| runtimeMin | **needs-review** | Geek 30分（2Ah）／Education・Professional 80分（5Ah） |
| batteryCapacityWh | not-published | Ah表記のみ、電圧非公開 |
| chargeTimeMin | not-published | — |
| batterySystem | found | Geek 2Ah／Education・Professional 5Ah（構成別を明記） |
| controlMethod | not-published | — |
| sdk | found | Booster Robotics SDK / Gym / Train / Deploy / RoboCup Demo（Booster GymのREADMEがK1対応の新RLパイプラインを明記） |
| computePlatform | **needs-review** | Geek 48 TOPS／Education 117 TOPS／Professional 200 TOPS |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 価格

| channel | 表示 | 金額 | variant注記 |
| --- | --- | --- | --- |
| manufacturer-public | From $5,999 | 5,999 USD | 構成・税区分不明 |
| manufacturer-public | 3.99万起 | 39,900 CNY | 構成・税区分不明（中国語公式ページ） |

### 活用事例

1. HTWK Team（ドイツ）— RoboCup 2025 KidSize優勝（`demonstration`）
2. 2025 World Humanoid Robotics Games Federation — センターステージ出演（`demonstration`）

### 未解決事項

- runtimeMin・computePlatformは構成別（Geek/Education/Professional）で単一値を確定できない。
- 開始価格が対象構成・税条件を明記していない。

---

## kepler-k2（Kepler Forerunner K2 / "Bumblebee"）

- **lifecycleStatus**: `current`
- **publicationRecommendation**: `keep-published`
- **recordScope**: `product-family`（Basic 30DoF・75kg／Bipedal Development 52DoF／Wheeled Development 52DoF・135kg）

### 理由

Kepler Robotics自身が発表した2025-09-26付プレスリリース（PR Newswire配信）で、量産開始・顧客への出荷開始（「数千台規模の枠組み契約、契約総額は数億元」）を確認した。公式トップページでも現行主力製品として掲載されている。

### スペック状況

| キー | ステータス | 値 |
| --- | --- | --- |
| mobility | **needs-review** | Bipedal Development=biped、Wheeled Development=wheeled。Basic版の移動方式は非明示 |
| heightCm | found | 175cm（共通） |
| weightKg | **needs-review** | Basic 75kg／Wheeled Development 135kg |
| speedMps | not-published | — |
| dof | **needs-review** | Basic 30／開発版（二足・車輪）52 |
| payloadKg | not-published | 双腕荷重は下記loadRatingsで管理 |
| runtimeMin | found | 8時間（共通表記、プレスリリースでも「up to eight hours」と確認） |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | found | 1時間（共通） |
| batterySystem | found | 充電式バッテリー（約1時間充電・最大8時間稼働） |
| controlMethod | found | 自律ナビゲーション（Visual SLAM）／マルチモーダル対話／動作計画・制御 |
| sdk | found | Kepler OS / Kepler Developer Platform（モジュール設計、遠隔デバッグ、マルチロボット連携、OTA更新予定） |
| computePlatform | **needs-review** | 「100 TOPS」の記載はあるが全構成（特にBasic）共通適用かは非明示 |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 荷重（loadRatings）

- dual-arm / unspecified / 25kg（公式範囲25-30kgの下限、K2 industrial configuration）
- dual-arm / unspecified / 30kg（公式範囲25-30kgの上限、プレスリリースでも「up to 30 kg」と確認）

### 価格

| channel | 表示 | 金額 | variant注記 |
| --- | --- | --- | --- |
| manufacturer-public | RMB 248,000 per unit | 248,000 CNY | プレスリリースは構成を明記せず。製品ページのBasic/Bipedal Development/Wheeled Developmentのどれに対応するか不明 |

### 活用事例（上限3件、いずれもKepler公式LinkedIn投稿）

1. SAIC-GM（上海の自動車工場）— 「real-world tests」との自社表現、`pilot`
2. Zhaofeng Motor — 「now working on the real production line」「officially getting to work」、`commercial-deployment`
3. VEICHI Electric — 「real-world trials」、`pilot`

### UseCase接続

- `research-development` ← "Research & Education"
- `factory-assembly-support` ← "Intelligent Manufacturing"
- `factory-visual-inspection` ← "Product verification and quality alerting"

### USE_CASE_GAP

- "Warehousing and logistics"（具体タスク非明示、既存UseCaseは個別タスク単位のため接続不可）
- "Specialized Industries / high-risk operations"（同様に一般的表現で接続不可）

### 未解決事項

- weightKg・dof・mobilityは構成別で単一値を確定できない。
- computePlatform「100 TOPS」がBasic構成にも適用されるか非明示。
- プレスリリース価格の対象構成が不明。

---

## kepler-k1（Kepler Forerunner K1）

- **lifecycleStatus**: `limited-current`
- **publicationRecommendation**: `keep-published`
- **recordScope**: `specific-variant`（K2のようなBasic/Development分割は確認できず、単一構成の製品として扱う）

### 理由

K1の公式製品ページは本日時点でも生存しており、購入相談用の問い合わせページ（`contact?type=ordering`）も稼働中で、公式トップページからも参照されている。廃番・後継機の公式声明は一切ない。一方で公式ページ自身が「will be commercialized and mass-produced in near future（近い将来に量産・商用化する）」という未来形の表現を使っており、K2（2025-09-26付で量産・顧客出荷を公式発表済み）のような現行量産の確定的な記述はない。ページと問い合わせ窓口が2023～2024年頃から存在し続けている点を踏まえ、「発表のみ（announced）」ではなく、研究・開発者・個別引き合い向けの限定的な現行提供（`limited-current`）と判断した。

### スペック状況

| キー | ステータス | 値 |
| --- | --- | --- |
| mobility | found | biped（"Walk on complex terrain with ease, explore autonomously"という明文のテキスト根拠。画像からの推測ではない） |
| heightCm | found | 178cm |
| weightKg | found | 85kg |
| speedMps | not-published | — |
| dof | found | 全身40 DoF（手の12 DoFは別枠、加算せず） |
| payloadKg | not-published | — |
| runtimeMin | not-published | — |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | not-published | — |
| batterySystem | not-published | 電池に関する記載が製品ページ・開発者ページとも一切なし |
| controlMethod | found | Visual SLAM／自律経路計画／動作計画・制御／マルチモーダル対話・ハンドアイ協調 |
| sdk | found | Kepler Developer Platform（K1ページから参照。Kepler OSの詳細は共通の開発者ページに記載） |
| computePlatform | found | Nebula system + 100 TOPS高性能マザーボード（ボード型番非公開） |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### 価格

`priceFallback: inquiry-fallback`。公式製品ページ・購入相談ページとも金額非公開（WeChat／メール問い合わせのみ）。2023～2024年頃の第三者記事に「予想小売価格2万～3万ドル」という記載があるが、現行の一次情報源ではなく、グレー・非公式情報のため採用しない。

### 活用事例

該当なし。公式ページに教育・検査・生産ライン・物流等の用途表現はあるが、K1固有の名前付き導入事例（顧客・研究機関の実名）は確認できなかった。K2の事例をK1へ流用していない。

### UseCase接続

- `research-development` ← "Education & Research"
- `factory-assembly-support` ← "Automated Production Line"
- `factory-visual-inspection` ← "Smart Inspection"

### USE_CASE_GAP

- "Warehousing & Logistics"
- "High-risk Environment"
- "Outdoor Tasks"

### 未解決事項

- 稼働時間・電池・荷重・充電時間・IP等級・動作温度・安全規格が製品ページ・開発者ページ・問い合わせページのいずれにも見当たらない。
- 公式価格が一切非公開（第三者の古い推定額は不採用）。
- 「近い将来に量産化」という未来形の表現と、2023年頃から継続する製品ページ・問い合わせ窓口の存在が整合しづらく、現行の出荷・量産状況を公式情報のみで断定できない。

---

## 主要確認ページ（一次情報源、本日2026-07-17取得）

### Booster Robotics

- [Booster Robotics 公式トップページ](https://www.booster.tech/)
- [Booster T1 公式製品ページ](https://www.booster.tech/booster-t1/)
- [Booster K1 公式製品ページ（英語）](https://www.booster.tech/booster-k1/)
- [Booster K1 公式製品ページ（中国語）](https://www.booster.tech/cn/booster-k1/)
- [Booster 教育ソリューション（中国語）](https://www.booster.tech/cn/education/)
- [Booster RoboCupソリューション](https://www.booster.tech/robocup/)
- [Booster T2 公式製品ページ（文脈確認用）](https://www.booster.tech/booster-t2/)
- [Booster 公式ストア](https://www.booster.tech/store/)
- [Booster Robotics booster_gym（GitHub公式）](https://github.com/BoosterRobotics/booster_gym)
- [Tohasen Robotics 国内正規代理店契約発表（2025-11-03）](https://www.tohasen-robotics.com/news/tohasen-robotics%E3%80%81booster-robotics%E7%A4%BE%E3%81%A8%E6%97%A5%E6%9C%AC%E5%9B%BD%E5%86%85%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B%E6%AD%A3%E8%A6%8F%E4%BB%A3%E7%90%86%E5%BA%97%E5%A5%91%E7%B4%84/)

### Kepler Robotics

- [Kepler Robotics 公式トップページ](https://www.gotokepler.com)
- [Kepler Forerunner K2 公式製品ページ](https://www.gotokepler.com/productDetailK2?id=2)
- [Kepler Forerunner K1 公式製品ページ](https://gotokepler.com/productDetailK1)
- [Kepler Developer Platform / Kepler OS](https://www.gotokepler.com/apps/mobile/pages/developerPlatform/index)
- [Kepler 購入相談ページ](https://gotokepler.com/contact?type=ordering)
- [Kepler About（会社概要）](https://www.gotokepler.com/about)
- [K2量産・顧客出荷の公式発表（2025-09-26、PR Newswire配信）](https://www.prnewswire.com/news-releases/worlds-first-commercially-available-hybrid-architecture-humanoid-robot-moves-into-mass-production-kepler-marks-the-start-of-a-new-industrial-era-302568138.html)
- [K2 SAIC-GM 公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-humanoid-robot-lands-at-saic-gm-activity-7321418311701815298-9Hyn)
- [K2 Zhaofeng Motor 公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_keplerrobotics-keplerk2-humanoidrobots-activity-7409791717769601024-bi4K)
- [K2 VEICHI Electric 公式LinkedIn投稿](https://www.linkedin.com/posts/kepler-exploration-robotics_kepler-k2-humanoid-begins-work-at-veichi-activity-7397106664631554048-E29L)

## 出典ログ（要約）

| タイトル | URL | Publisher | checkedAt |
| --- | --- | --- | --- |
| Booster Robotics 公式トップページ | https://www.booster.tech/ | Booster Robotics | 2026-07-17 |
| Booster T1 公式製品ページ | https://www.booster.tech/booster-t1/ | Booster Robotics | 2026-07-17 |
| Booster K1 公式製品ページ（EN/CN） | https://www.booster.tech/booster-k1/ , https://www.booster.tech/cn/booster-k1/ | Booster Robotics | 2026-07-17 |
| Booster 教育ソリューション | https://www.booster.tech/cn/education/ | Booster Robotics | 2026-07-17 |
| Booster RoboCupソリューション | https://www.booster.tech/robocup/ | Booster Robotics | 2026-07-17 |
| Booster T2 製品ページ | https://www.booster.tech/booster-t2/ | Booster Robotics | 2026-07-17 |
| Booster 公式ストア | https://www.booster.tech/store/ | Booster Robotics | 2026-07-17 |
| booster_gym（GitHub） | https://github.com/BoosterRobotics/booster_gym | Booster Robotics | 2026-07-17 |
| Tohasen Robotics 代理店契約発表 | https://www.tohasen-robotics.com/news/... | Tohasen Robotics | 2026-07-17（発表日2025-11-03） |
| Kepler 公式トップページ | https://www.gotokepler.com | Kepler Robotics | 2026-07-17 |
| Kepler K2 公式製品ページ | https://www.gotokepler.com/productDetailK2?id=2 | Kepler Robotics | 2026-07-17 |
| Kepler K1 公式製品ページ | https://gotokepler.com/productDetailK1 | Kepler Robotics | 2026-07-17 |
| Kepler Developer Platform | https://www.gotokepler.com/apps/mobile/pages/developerPlatform/index | Kepler Robotics | 2026-07-17 |
| Kepler 購入相談ページ | https://gotokepler.com/contact?type=ordering | Kepler Robotics | 2026-07-17 |
| Kepler About | https://www.gotokepler.com/about | Kepler Robotics | 2026-07-17 |
| K2量産・出荷開始 公式発表 | https://www.prnewswire.com/news-releases/... | Kepler Robotics（PR Newswire配信） | 2026-07-17（発表日2025-09-26） |
| K2 SAIC-GM / Zhaofeng Motor / VEICHI Electric 公式LinkedIn投稿 | 上記3件 | Kepler Robotics | 2026-07-17 |

JSON: [`DATA-R02-B07.json`](./DATA-R02-B07.json)
