# DATA-R02 資料計画

作成日: 2026-07-17（Asia/Tokyo）
対象: `data/robots.ts` の実行時 `publishStatus: 'published'` 61機（コードから再集計、欠落0・重複0・対象外混入0）

## 目的

DATA-R01は一次調査として全61機を調査したが、次の既知の問題を持つ。

- 旧世代の導入事例と現行製品の同一性が不明という理由で、現行製品ページに直接記載された現行製品情報まで一括保留した例がある。
- `marketAvailability` / `japanAvailability` / `procurementModels` の現行enumへの正規化が未完了（131件）。
- `needs-review` 102件、`conflict` 32件が未解決のまま残っている。

DATA-R02はDATA-R01の判定を正解として引き継がず、各Robotについて公式原典を再度開いて lifecycleStatus と全16スペック項目を再判定する。DATA-R01のJSON/MDおよび`Robot.sources[]`は調査対象URLの**候補発見**にのみ使用し、値の正しさの根拠にはしない。

## 候補資料の作り方

各Robotについて以下を優先順位順の候補資料として列挙した（`docs/data/DATA-R02-source-plan.json`）。

1. `documentType: official-product-index` — `data/manufacturers.ts` に登録されたメーカー公式サイトURL（メーカーごとに1件、priority 1固定）
2. DATA-R01調査時点で発見済みだった `Robot.sources[].url`（`data/robots.ts` 実行時値）を、ホスト名とパスから機械的に分類
   - メーカー公式ドメイン配下 → `official-product`（`/news`, `/press`, `/blog` を含む場合は `official-news`）
   - `shop.` / `store.` サブドメインまたは `/products/` パス（メーカードメイン系） → `official-store`
   - `github.com` → `official-sdk`
   - 既知の正規代理店ドメイン（例: techshare.co.jp） → `authorized-distributor`
   - `.edu` 等の教育・研究機関ドメイン → `customer-primary`
   - 上記に該当しない場合 → `third-party-discovery`

`title` / `publisher` / `publishedAt` / `updatedAt` は本調査前計画の時点では機械分類できないため `null`。本調査で実際にページを開いた際に確定させる。

## 重要な注意（本調査を行う担当者へ）

- この資料計画はDATA-R01由来の候補URLの**再訪**を保証するものであり、それだけで十分とはみなさない。各Robotについて、メーカー公式サイトの現行製品一覧・現行製品ページ・公式ニュースを実際に検索し、候補計画にない新しい一次資料（後継機発表、ディスコン発表、最新スペックPDFなど）を追加で発見すること。
- 候補が1件しかない、または `official-product` 系候補が存在しないRobotは、`documentType` 上位（1〜6）を優先して追加調査すること。
- `official-product-index` のメーカー公式サイトURLはトップページであり、そこから現行製品ページへ実際に辿れるかを確認すること（辿れない場合は `lifecycleStatus` 判定へ反映する）。

## 集計

- 対象Robot数: **61**（欠落0、重複0、対象外混入0）
- 候補資料の総数: **260件**（Robotあたり平均 約4.3件）
- メーカー別Robot数:

| manufacturerId | Robot数 |
|---|---:|
| unitree | 10 |
| agibot | 8 |
| ubtech | 6 |
| fourier-intelligence | 4 |
| engine-ai | 4 |
| apptronik | 2 |
| onex | 2 |
| booster-robotics | 2 |
| kepler-robotics | 2 |
| leju-robotics | 2 |
| pal-robotics | 2 |
| limx-dynamics | 2 |
| robotera | 3 |
| agility-robotics | 1 |
| figure-ai | 1 |
| boston-dynamics | 1 |
| tesla | 1 |
| sanctuary-ai | 1 |
| kawasaki-heavy-industries | 1 |
| neura-robotics | 1 |
| xpeng-robotics | 1 |
| wandercraft | 1 |
| mentee-robotics | 1 |
| galbot | 1 |
| aeolus-robotics | 1 |
| **合計** | **61** |

## バッチ分割（DATA-R01と同一グルーピングを踏襲）

| Batch | メーカー / 対象数 | Robot IDs |
|---|---:|---|
| B01 | Unitree / 10 | unitree-g1, unitree-g1-edu, unitree-h1, unitree-h1-2, unitree-h2, unitree-h2-edu, unitree-h2-plus, unitree-r1, unitree-r1-standard, unitree-g1-d |
| B02 | AgiBot / 8 | agibot-a2, agibot-a2-ultra, agibot-a2-max, agibot-a2-lite, agibot-x1, agibot-x2, agibot-x2-ultra, agibot-g2 |
| B03 | UBTECH / 6 | ubtech-walker-s2, ubtech-walker-s1, ubtech-walker-x, ubtech-walker-s, ubtech-walker-c, ubtech-walker-tienkung |
| B04 | Fourier / 4 | fourier-gr2, fourier-gr3, fourier-gr1, fourier-gr3c |
| B05 | EngineAI / 4 | engineai-se01, engineai-pm01, engineai-t800, engineai-sa01 |
| B06 | Apptronik + 1X / 4 | apptronik-apollo, apptronik-apollo-2, onex-neo, onex-eve |
| B07 | Booster + Kepler / 4 | booster-t1, booster-k1, kepler-k2, kepler-k1 |
| B08 | Leju + PAL + LimX / 6 | leju-kuavo, leju-kuavo5, pal-talos, pal-kangaroo, limx-oli, limx-luna |
| B09 | 米欧・その他大手 / 8 | agility-digit, figure-03, boston-dynamics-atlas, tesla-optimus, sanctuary-phoenix, kawasaki-kaleido, neura-4ne-1, xpeng-iron |
| B10 | その他 / 7 | wandercraft-calvin, mentee-menteebotv3, robotera-l7, robotera-q5, robotera-m7, galbot-g1, aeolus-aeo |
| **合計** | **61** | |

詳細な候補資料一覧は `docs/data/DATA-R02-source-plan.json` を参照。
