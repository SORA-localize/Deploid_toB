# ロボット・メーカーデータ ファクトチェック研究プロンプト

**作成日:** 2026-07-01  
**対象:** Deploid 掲載済みメーカー 25 社・ロボット 58 機種  
**用途:** 任意の AI（Claude / GPT / Gemini 等）に与えるファクトチェック指示  
**更新契機:** 掲載ロボット・メーカーの追加・削除・大規模改版のたびに本ファイルを更新すること

---

## 目的

Deploid に掲載中のヒューマノイドロボットデータについて、各メーカーの最新公式情報と照合し、以下の誤りを発見・修正候補として報告する。

1. **名称の誤り・旧称の残存**（例：Walker E → Walker Tienkung への改称未反映）
2. **スペックの誤り**（身長・重量・自由度・可搬重量・最高速度）
3. **デプロイ段階の誤り**（prototype / pilot / limited-production / production）
4. **日本展開状況の誤り**（代理店名・直販可否）
5. **掲載範囲の漏れ**（新モデルの未掲載）
6. **スコープ外エントリの混入**（双腕二足 or 双腕車輪ヒューマノイド以外）

---

## スコープ定義（判定基準）

掲載対象は以下のいずれかに該当するものに限る：

- **双腕二足歩行ヒューマノイド**：人型の上半身（双腕）＋ 二足歩行（biped）
- **双腕車輪型ヒューマノイド**：人型の上半身（双腕）＋ 車輪移動（wheeled）で、人型フォームファクタを持つもの

除外：
- 遠隔操作専用リグ（テレオペレーション機器）
- 単腕 AMR（Autonomous Mobile Robot）
- 非ヒューマノイド形状のサービスロボット
- 展示・エンターテインメント専用の小型ロボット

---

## チェック対象マスターリスト（2026-07-01 時点）

| # | manufacturerId | メーカー名 | robotId | ロボット名 | mobility |
|---|---|---|---|---|---|
| 1 | aeolus-robotics | Aeolus Robotics | aeolus-aeo | aeo | wheeled |
| 2 | agibot | AgiBot | agibot-a2 | A2 | biped |
| 3 | agibot | AgiBot | agibot-a2-ultra | A2-Ultra | biped |
| 4 | agibot | AgiBot | agibot-a2-max | A2-Max | biped |
| 5 | agibot | AgiBot | agibot-a2-lite | A2-Lite | biped |
| 6 | agibot | AgiBot | agibot-x1 | X1 | biped |
| 7 | agibot | AgiBot | agibot-x2 | X2 | biped |
| 8 | agibot | AgiBot | agibot-x2-ultra | X2-Ultra | biped |
| 9 | agility-robotics | Agility Robotics | agility-digit | Digit | biped |
| 10 | apptronik | Apptronik | apptronik-apollo | Apollo | biped |
| 11 | booster-robotics | Booster Robotics | booster-t1 | T1 | biped |
| 12 | booster-robotics | Booster Robotics | booster-k1 | K1 | biped |
| 13 | boston-dynamics | Boston Dynamics | boston-dynamics-atlas | Atlas | biped |
| 14 | engine-ai | EngineAI | engineai-se01 | SE01 | biped |
| 15 | engine-ai | EngineAI | engineai-pm01 | PM01 | biped |
| 16 | engine-ai | EngineAI | engineai-t800 | T800 | biped |
| 17 | engine-ai | EngineAI | engineai-sa01 | SA01 | biped |
| 18 | figure-ai | Figure AI | figure-03 | Figure 03 | biped |
| 19 | fourier-intelligence | Fourier Intelligence | fourier-gr2 | GR-2 | biped |
| 20 | fourier-intelligence | Fourier Intelligence | fourier-gr3 | GR-3 | biped |
| 21 | fourier-intelligence | Fourier Intelligence | fourier-gr1 | GR-1 | biped |
| 22 | fourier-intelligence | Fourier Intelligence | fourier-gr3c | GR-3C | biped |
| 23 | galbot | Galbot | galbot-g1 | Galbot G1 | biped |
| 24 | kawasaki-heavy-industries | 川崎重工業 | kawasaki-kaleido | Kaleido | biped |
| 25 | kepler-robotics | Kepler Robotics | kepler-k2 | K2 | biped |
| 26 | kepler-robotics | Kepler Robotics | kepler-k1 | K1 | biped |
| 27 | leju-robotics | Leju Robotics | leju-kuavo | KUAVO | biped |
| 28 | leju-robotics | Leju Robotics | leju-kuavo5 | KUAVO 5 | biped |
| 29 | limx-dynamics | LimX Dynamics | limx-oli | OLI | biped |
| 30 | limx-dynamics | LimX Dynamics | limx-luna | Luna | biped |
| 31 | mentee-robotics | Mentee Robotics | mentee-menteebotv3 | MenteeBot v3 | biped |
| 32 | neura-robotics | NEURA Robotics | neura-4ne-1 | 4NE-1 | biped |
| 33 | onex | 1X Technologies | onex-neo | NEO | biped |
| 34 | onex | 1X Technologies | onex-eve | EVE | biped ※要確認 |
| 35 | pal-robotics | PAL Robotics | pal-talos | TALOS | biped |
| 36 | pal-robotics | PAL Robotics | pal-kangaroo | Kangaroo | biped |
| 37 | robotera | RobotEra | robotera-l7 | L7 | biped |
| 38 | robotera | RobotEra | robotera-q5 | Q5 | biped |
| 39 | robotera | RobotEra | robotera-m7 | M7 | biped |
| 40 | sanctuary-ai | Sanctuary AI | sanctuary-phoenix | Phoenix | biped |
| 41 | tesla | Tesla | tesla-optimus | Optimus | biped |
| 42 | ubtech | UBTECH Robotics | ubtech-walker-s2 | Walker S2 | biped |
| 43 | ubtech | UBTECH Robotics | ubtech-walker-s1 | Walker S1 | biped |
| 44 | ubtech | UBTECH Robotics | ubtech-walker-x | Walker X | biped |
| 45 | ubtech | UBTECH Robotics | ubtech-walker-s | Walker S | biped |
| 46 | ubtech | UBTECH Robotics | ubtech-walker-c | Walker C | biped |
| 47 | ubtech | UBTECH Robotics | ubtech-walker-tienkung | Walker Tienkung | biped |
| 48 | unitree | Unitree Robotics | unitree-g1 | G1 | biped |
| 49 | unitree | Unitree Robotics | unitree-g1-edu | G1 Edu | biped |
| 50 | unitree | Unitree Robotics | unitree-h1 | H1 | biped |
| 51 | unitree | Unitree Robotics | unitree-h1-2 | H1-2 | biped |
| 52 | unitree | Unitree Robotics | unitree-h2 | H2 | biped |
| 53 | unitree | Unitree Robotics | unitree-h2-edu | H2 Edu | biped |
| 54 | unitree | Unitree Robotics | unitree-h2-plus | H2 Plus | biped |
| 55 | unitree | Unitree Robotics | unitree-r1 | R1 | biped |
| 56 | unitree | Unitree Robotics | unitree-r1-standard | R1 Standard | biped |
| 57 | wandercraft | Wandercraft | wandercraft-calvin | CALVIN-40 | biped |
| 58 | xpeng-robotics | XPENG Robotics | xpeng-iron | IRON | biped |

> ※ onex-eve は DB 上 `biped` だが、1X Technologies EVE は実際には車輪移動型の可能性あり。要確認。

---

## ファクトチェック実行プロセス（ループ構造）

以下の手順を **ロボット単位**で繰り返し実行する。全ロボット完了後に総括レポートを出力すること。

### ステップ 0：初期化

```
チェック済みリスト = []
要修正リスト = []
スコープ外候補リスト = []
未確認リスト = 上記マスターリスト全 58 件
```

### ステップ 1：対象選択

`未確認リスト` の先頭からロボットを 1 件取り出す。

### ステップ 2：公式情報の取得

以下の優先順でソースにアクセスし、最新情報を収集する：

1. メーカー公式 HP の当該モデルページ（英語 / 日本語）
2. 公式プレスリリース（直近 12 か月）
3. 日本代理店公式 HP（存在する場合）
4. 主要テック媒体のスペックシート記事（IEEE Spectrum / TechCrunch / The Robot Report 等）

### ステップ 3：各項目のチェック

以下の項目を DB 値と照合する。差異がある場合は `要修正リスト` に追記。

| チェック項目 | DB フィールド | 確認内容 |
|---|---|---|
| 正式名称 | `name` / `nameJa` | 旧称が残っていないか。大文字・数字表記は正確か |
| メーカー帰属 | `manufacturerId` | 正しいメーカーのロボットか |
| カテゴリ | `category` | humanoid / upper-body-humanoid / mobile-manipulator のどれが正確か |
| 移動方式 | `specs.mobility` | biped / wheeled / hybrid / stationary の正確な分類 |
| 身長 (cm) | `specs.heightCm` | 公式スペックと一致するか（±5cm 以内） |
| 重量 (kg) | `specs.weightKg` | 公式スペックと一致するか（±5kg 以内） |
| 自由度 | `specs.dofTotal` | 全関節自由度の合計が一致するか |
| 可搬重量 (kg) | `specs.payloadKg` | 片腕・両腕のいずれかを明示しているか確認 |
| 最高速度 (m/s) | `specs.maxSpeedMs` | 公式値と一致するか |
| デプロイ段階 | `deploymentStage` | 概念実証 / パイロット / 限定量産 / 量産のどれが現時点で正確か |
| 日本展開状況 | `japanAvailability` | 直販 / 代理店 / 要問合わせ / 不明のどれが正確か |
| 代理店名 | `distributorJapan` | 正式社名か。現在も契約継続中か |
| スコープ判定 | — | 上記スコープ定義に合致するか（合致しない場合 `スコープ外候補リスト` へ） |

### ステップ 4：新モデルの発見

当該メーカーの公式ラインナップを確認し、マスターリストに**ない**新モデルが存在する場合、以下を記録する：

- モデル名
- 発表・発売時期
- スペック概要
- スコープ定義への適合可否
- 追加推奨度（高 / 中 / 低）

### ステップ 5：結果の記録

```
チェック済みリスト に robotId を追加
未確認リスト から当該ロボットを除去
```

### ステップ 6：ループ継続判定

`未確認リスト` が空でない場合 → ステップ 1 へ戻る  
`未確認リスト` が空の場合 → ステップ 7 へ進む

---

## ステップ 7：総括レポートの出力

以下の形式で出力すること：

### 7-1 要修正サマリー

```
## 要修正（修正優先度：高）
- robotId: <id>
  - フィールド: <fieldName>
  - 現在値: <current>
  - 正確値: <correct>
  - ソース: <URL>

## 要修正（修正優先度：中）
（同上形式）

## 要修正（修正優先度：低）
（同上形式）
```

### 7-2 スコープ外候補

```
## スコープ外候補
- robotId: <id>
  - 理由: <explanation>
  - 推奨対応: delete / draft / keep
```

### 7-3 掲載候補（新モデル）

```
## 新規掲載候補
- メーカー: <name>
  - モデル名: <name>
  - スコープ適合: yes / no / borderline
  - 推奨優先度: 高 / 中 / 低
  - ソース: <URL>
```

### 7-4 メーカーレベルの気づき

各メーカーの戦略・製品ラインの変化について、データ管理上重要な変更があれば記述。

---

## 注意事項

- **スペックシートのバージョンに注意**：モデル名が同じでも仕様改定があることがある（例：GR-2 Rev.2 等）。発表日を必ず確認すること
- **日本語・英語の表記揺れ**：公式日本語 HP と英語 HP でスペックが異なる場合は英語公式を優先し、日本語訳を `nameJa` に反映
- **代理店情報の鮮度**：代理店契約は終了・変更されることがある。「取り扱い開始」プレスリリースだけでなく、現在も HP に掲載されているかを確認すること
- **deploymentStage の定義**：Deploid では `concept / prototype / pilot / limited-production / production / internal-use / discontinued` を使用。メーカー発表の "mass production" や "shipping" が `production` 相当か `limited-production` 相当かは出荷台数・受注状況で判断
- **Aeolus aeo の特記事項**：車輪型双腕ヒューマノイドとしてスコープ内。7-DOF 双腕・車輪移動が公式確認済み（CES 2023 発表）
- **1X Technologies EVE の特記事項**：DB 上 `biped` だが実機は車輪移動型の可能性がある。EVE の mobility を公式情報で必ず確認すること

---

## このプロンプトの更新方法

マスターリストの増減・スコープ定義の変更があった場合は、本ファイルの該当セクションを直接編集すること。プロンプト自体も「最新のロボットリストを反映した版で自己更新」する要素として扱う。
