# 記事候補ソーシング・リファレンス v1

Last reviewed: 2026-06-24

> このドキュメントは、Deploid の記事候補（`data/articles.ts` に書く前のネタ）を探す段階の運用方針を定める。
> 書き方・文体・分量は `editorial_style_guide_v1.md`、題材選定の判断軸は同ファイル §1.5 を参照。
> このドキュメントは「どこを探すか・どう検索するか・何を除外するか」専用。
> ChatGPT Scheduled Tasks で日次ニュース記事データを出力し CLI 側AIへ渡す場合、および CLI 側AIが公開済み記事から週次ニュースレターを作る場合の変換ルールは `news-automation-prompt-contract-v1.md` を正本とする。

---

## 1. 優先する情報源

### A. メーカー公式（最優先）

各社の公式ニュースルーム / プレスページを最優先で確認する。製品仕様・価格・導入発表は一次情報がここにある。

- Figure AI: `figure.ai/news`
- Tesla (Optimus): `tesla.com/AI`, Tesla公式X/IR資料
- Unitree: `unitree.com`, 公式WeChat/X
- Agility Robotics: `agilityrobotics.com/news`
- Apptronik: `apptronik.com/news`
- Boston Dynamics: `bostondynamics.com/news`
- Sanctuary AI, Fourier Intelligence, UBTech, Kepler, Booster Robotics, AgiBot, PAL Robotics, Neura Robotics, Kawasaki Heavy Industries: 各社公式ニュースルーム

### B. プレスリリース配信サービス

- PR Newswire, Business Wire, GlobeNewswire
- 共同通信PRワイヤー、@Press（日本企業の発表）

### C. 信頼できる業界専門メディア

- The Robot Report
- IEEE Spectrum (Robotics)
- Robotics & Automation News
- TechCrunch（Hardware/Robotics タグ）
- Nikkei Asia、日経ロボティクス、ロボスタ
- Reuters Technology、Bloomberg Technology（資金調達・M&A・量産関連の数字に強い）

### D. 政策・規制・標準

- 経済産業省、厚生労働省、デジタル庁の発表
- NIST、ISO、ANSI/RIA の標準化関連リリース
- 各国の労働安全衛生当局の発表

---

## 2. 除外する情報源（原則）

- arXiv、bioRxiv、SSRN、Papers with Code などのプレプリント/論文サイト
- 大学・研究室単体のプレスリリース（商用化や導入に接続しない研究発表）
- 出典1本のみで公式確認が取れない噂・リーク記事
- バイラル動画単体（X/YouTubeの話題化のみで、一次発表元が確認できないもの）

**例外**：論文・研究発表が商用導入、安全規制、製品仕様、PoC設計に直接つながり、かつ信頼できる二次報道で裏取りできる場合のみ、`editorial_style_guide_v1.md` §1.5「扱いを下げる題材」の例外規定に従って候補にしてよい。単独の論文紹介は不可。

---

## 3. 検索クエリの組み方

### 導入・商用契約を探す

```
"<メーカー名>" (deployment OR pilot OR "PoC" OR "production line" OR 導入 OR 実証)
"<メーカー名>" "humanoid" customer site:prnewswire.com
"<メーカー名>" 日本 導入
```

### 製品・価格・販売条件を探す

```
"<メーカー名>" (price OR pricing OR "RaaS" OR subscription OR preorder OR 予約販売)
"<メーカー名>" "available" OR "ships" OR "delivery"
```

### 量産・供給体制・資金調達を探す

```
"<メーカー名>" (raises OR funding OR "Series" OR IPO OR valuation)
"<メーカー名>" (factory OR "production capacity" OR units OR 量産)
```

### 安全・規制・認証・標準を探す

```
humanoid robot (safety standard OR certification OR ISO OR regulation)
"<国・省庁名>" humanoid robot policy OR guideline
```

### 大手企業との提携・導入準備を探す

```
"<大手企業名>" humanoid (pilot OR trial OR partnership OR "working with")
```

### Google News / ニュース検索の使い方

- 日付フィルタを必ず使う（直近1週間〜1ヶ月で絞る。古い再掲記事を拾わない）
- `site:` 演算子で C カテゴリのドメインを優先的に絞る
- 英語クエリと日本語クエリの両方を打つ（日本市場関連は日本語クエリでしか出ないことが多い）

---

## 4. 鮮度・優先度の判断

- hero候補：数日以内の公式発表または信頼できる報道
- 通常記事候補：直近数週間以内
- 週次メモ・調査候補：それより古い、または出典が弱いもの（記事化せず保留）

---

## 5. データ追加ワークフローとの関係

候補が見つかった後は `ai/rules/21-data-maintenance-workflow.md` の G2（出典確認）・G6（sources記録）に進む。このリファレンスは「候補を見つける」段階専用で、データ記録のルールはそちら側が正本。
