# Korthos 調査プロファイル（2026-07-16）

## 基本情報

| 項目 | 内容 |
|---|---|
| URL | https://korthos.xyz/ |
| 種別 | 類似メディア（コンセプト近いが読者レイヤーが違う） |
| 言語・地域 | 英語・グローバル |
| 運営主体 | 小規模（創業者の個人X @AGkorthos あり。チーム規模非公開） |
| 対象読者 | robotics founders / operators / investors / suppliers / market watchers（サイトに明記） |
| SNS・購読者規模 | X @korthosxyz 約2.2万（2026-07時点）。ニュースレターあり（無料、規模非公開） |

## ポジショニング

- タグライン: **"Market intelligence for the machine economy"** / "Signals from the physical frontier"
- 中心にある読者のクエリ: 「どの会社が伸びるか、どこに資金が流れているか、サプライチェーンはどう繋がっているか」= **投資家・業界プレイヤー側の市場理解**
- Deploidとの読者の重なり: **低〜中** — Deploidの中心クエリは「うちの現場に導入できるか・いくらかかるか・どこに頼むか」= 購買側。同じ「ロボティクスの構造化データ+編集」でも用途が違う

## サイト構造・内容

6本柱の構成:

| セクション | 内容 |
|---|---|
| Intelligence | **Verified Events フィード（心臓部）**。日次更新、1日複数件。各エントリに headline / 日付 / イベント種別タグ（FUNDING, DEPLOYMENT, CONTRACT AWARD, PRODUCT LAUNCH等）/ 企業 / **元ソースへの "View source" リンク** |
| Ecosystem | 企業ディレクトリ（1,000社超）+ 製品ディレクトリ。一覧自体は名前+カテゴリ+国だけの薄いリスト（フィルタなし、アルファベット順） |
| Data | Funding Monitor、Event Trends、Company Map |
| Supply Chain | サプライヤー能力プロファイル。データ出自を「supplier-submitted / inferred / evidence-backed」の3段階でラベル分け |
| Markets | セクター別、上場企業 |
| The Record | 記事タイムライン（ARTICLE / NEWS / NOTE 等のタグ付き）。ほぼ毎日更新 |

- 鮮度の仕組み: 静的DBではなく**日次のイベントフィードが更新の主軸**。ディレクトリ（企業・製品）は各エンティティのページにイベントが紐づいて自動的に育つ構造

## 掲載ロボット・メーカー

- カバー範囲: **全ロボティクス横断**。ヒューマノイドの他に quadruped / 産業アーム / ドローン / AMR / グリッパー・ハンド / 水中 / サービスロボ / ソフトウェア（Isaac Lab等）まで
- 規模感: 企業1,000社超、製品も数百件規模
- **一覧は薄く、個別ページが深い**。Figure 03 の例:
  - スペック: 身長173cm / 61kg / 可搬20kg / 稼働5h / 2.3kWhバッテリー / 1.2m/s / 指先3g検知の触覚センサー
  - **運用実績メトリクス**: 350台納入、生産1台/時（120日で24倍）、バッテリーライン一発良品率99.3%、アクチュエータ9,000個生産
  - **イベントタイムライン**: 発表(2025-10)→BotQ工場→BMW展開(2026-06)…と時系列で紐づく
  - 企業ページ側: 資金調達履歴（3ラウンド計$1.745B、投資家名まで）+ BMWパイロットの稼働1,250時間・9万パーツ処理などの実績
- **無いもの: 価格・TCO・納期・調達条件・国内サポート情報**（意図的に載せていない）

## モバイルUI・実装

- 技術スタック: **フレームワークなしの素の静的HTML+CSS**（Next.js等ではない）。トップページ1枚で約500KBのHTML
- モバイルナビ: **768pxを境にハンバーガー+スライドアウトシート**に切替（デスクトップは横並びナビ）。ヘッダー+ティッカーは fixed で `scroll-padding-top` で調整
- ヒーロー画像はデスクトップ用とモバイル用（縦長）を `media` 属性で出し分け、`fetchpriority="high"` で preload
- フォント: Archivo Black（見出し）+ Inter + 自前 Akkurat。紙っぽい背景 #faf9f7 + 墨色バンド #20201c + rust系アクセント
- **AI可読性への独自の工夫**: `<head>` 冒頭に `korthos-readable-head` として `korthos-page-title` / `korthos-page-summary` メタを自前定義。「crawlable robotics intelligence」を標榜し、**LLM/AIクローラーに引用されることを明確に狙った設計**

## 運営方法

- 生産体制: Verified Events は日次で複数件、記事（The Record）もほぼ毎日。イベント1件は「見出し+タグ+出典リンク」の軽量フォーマットなので少人数で回る設計
- 信頼性の作り方:
  1. **全イベントに出典リンク必須**
  2. **Coverage / Methodology ページ**でカバー範囲の in/out を明文化（例:「物理システムに繋がらない汎用AI企業は除外」）
  3. データ出自の3段階ラベル（submitted / inferred / evidence-backed）
  4. tips@korthos.xyz + 訂正受付導線 — 外部からの情報提供をデータ鮮度の入口にしている
- 流通チャネル: **X（鮮度の発信・2.2万人）→ サイト（構造化データの受け皿・SEO/AI引用）→ ニュースレター（定着）**の三段構え。サイトにペイウォールなし
- マネタイズ: 広告・有料購読・アフィリエイトの形跡なし。現状は**オーディエンス構築フェーズ**。本命はB2Bデータライセンス/エンタープライズ購読と推測

## Deploidとの違い

1. **読者レイヤー**: Korthos=投資家・業界側の market intelligence、Deploid=導入検討者側の buyer intelligence。競合というより隣のレイヤー
2. **広さ vs 深さ**: Korthos=全ロボティクス×グローバル×英語、Deploid=ヒューマノイド×日本×導入判断変数
3. **価格・調達情報の有無**: Korthosは意図的に載せない。Deploidの差別化軸そのもの
4. **鮮度の構造**: Korthosは日次イベントフィードが心臓部。Deploidは現状静的データ配列のみ（構造的弱点）

## Deploidへの適用

（前提: 構築フェーズ→運営フェーズへの移行期。外部認知ほぼゼロの段階なので、認知獲得と更新の仕組み化を優先して読む）

### 真似する

1. **X→サイト→ニュースレターの三段構え**。認知ゼロからの立ち上げはまずXでの鮮度発信。サイトは検索/AI引用の受け皿、メールが定着チャネル。Korthosが2.2万人まで来ているのはこの型が機能している証拠
2. **軽量イベントフィード運営**。「見出し+種別タグ+出典リンク」だけの導入事例・製品発表フィードなら1人でも日次で回せる。記事を毎回書こうとしない。イベントをロボット/メーカーページに紐づければ静的DBが自動的に育つ
3. **製品ページ = スペック + 導入実績タイムライン**の統合。BMW稼働1,250時間のような運用実績メトリクスはまさに「導入判断変数」。robotに deployments の時系列を持たせる
4. **信頼性インフラ3点セット**: 全データに出典リンク / Coverage・Methodology ページ（1枚でよい）/ 情報提供・訂正受付の導線
5. **AI可読性の設計**（korthos-readable-head 相当）。ページごとの title/summary メタ、構造化データ。認知ゼロでもLLM経由の引用・流入が取れる
6. **モバイルの型**: 768pxハンバーガー+シート、モバイル専用ヒーローの出し分け。実装として素直で参考にしやすい

### 真似しない

1. **カバレッジの横拡大**（ドローン・AMR等）。広さは投資家向けだから意味がある。ヒューマノイド特化を崩さない
2. **Funding Monitor / Markets / Supply Chain 等の投資家向けセクション**。ただしメーカーの資金調達状況は「このメーカーは5年後も存在するか」という**継続性リスク**の1項目としてメーカーページに翻訳して載せるのは有効
3. **aspirationalなヒーロービジュアル**（ロボットと緑の都市のイラスト等）。Deploidのデザインルール（neutral・矩形・情報密度）と「業務ツール」方針に反する
4. **フィルタなしの素朴なディレクトリ一覧**。Deploidのfilter/search付きブラウザの方が既に上

### 差別化として意識する（相手に無い・うちが取るべき領域）

1. **価格・TCO・リードタイム・PoC条件** — Korthosは明示的に空白にしている領域
2. **国内サポート体制・代理店・安全認証・規制** — 日本の導入担当者にしか要らない情報こそ参入障壁
3. **日本語**でこの深さをやる競合は現時点で確認できず

## 出典

- 調査日: 2026-07-16
- 参照URL:
  - https://korthos.xyz/ （トップ・HTML実装確認含む）
  - https://korthos.xyz/ecosystem/products
  - https://korthos.xyz/ecosystem/product/figure-03
  - https://korthos.xyz/ecosystem/companies
  - https://korthos.xyz/ecosystem/company/figure-ai
  - https://korthos.xyz/intelligence/feed
  - https://korthos.xyz/record
  - https://korthos.xyz/coverage
  - https://korthos.xyz/about
  - https://korthos.xyz/supply-chain
  - https://korthos.xyz/topnav.css （モバイルナビ実装）
  - X: https://x.com/korthosxyz （直接取得不可。フォロワー約2.2万はユーザー提供情報）
