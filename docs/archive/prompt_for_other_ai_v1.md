# プロンプト：日本のtoB向けヒューマノイド導入プラットフォーム（Next.js実装）

> この文書は、別AIツールにそのまま渡せる実装仕様書。  
> 技術方針は Next.js / React / Vercel / CMS前提。  
> 情報設計は `humanoid_media_IA_v1.md`、技術方針は `humanoid_platform_tech_stack_v1.md`、データ型は `nextjs_data_types_v1.ts` を参照。

---

## A. ビジネス文脈

### A-1. ゴール

日本の toB 事業者が、ヒューマノイド導入を検討するときの入口になること。

MVP時点では、

- 質と本気度
- 買い手目線の判断材料
- 今後拡張していく器

を示すことを優先する。

### A-2. ポジショニング

これは単なるロボット一覧サイトではない。

- 人型ロボット限定
- 日本市場向け
- 導入判断支援が主役
- DB、ガイド、逆引き、レポートを統合した構造

### A-3. 想定読者

- 主：設備、DX、新規事業、現場責任者、調達
- 副：メーカー、代理店、SIer、同業

### A-4. 重要な差別化

- 国内入手可否
- 代理店 / サポート体制
- 法規、安全、運用、PoCの現実
- 用途や業務からの逆引き
- 一次情報やレポート

---

## B. 技術要件

### B-1. フレームワーク

- Next.js
- App Router
- TypeScript

### B-2. UI

- React
- Tailwind CSS 使用可
- ただしトークン設計を持ち、量産的SaaS顔にしない

### B-3. 公開

- Vercel を前提

### B-4. データ

最初はローカルデータでよい。CMS移行前提で設計する。

`nextjs_data_types_v1.ts` を `data/types.ts` にコピーして使う。

扱うデータ型：

- robots
- manufacturers
- guides
- reports
- useCases

### B-5. DB

最初は不要。

ただし将来以下が必要になったら追加しやすい構造にする。

- shortlist
- saved items
- inquiry management
- authentication

---

## C. 作るページ

### C-1. 優先ページ

1. `/`
2. `/about`
3. `/contact`
4. `/guides`
5. `/guides/[slug]`

### C-2. 並行して型を固めたいページ

6. `/robots`
7. `/robots/[slug]`
8. `/manufacturers`
9. `/manufacturers/[slug]`
10. `/compare`
11. `/use-cases`
12. `/use-cases/[slug]`
13. `/reports`
14. `/reports/[slug]`

---

## D. ナビゲーション

グローバルナビは次を前提にする。

- ロボット
- メーカー
- 比較
- ガイド
- 用途から探す
- 記事
- 会社概要
- お問い合わせ

URL の推奨：

- `/robots`
- `/manufacturers`
- `/compare`
- `/guides`
- `/use-cases`
- `/reports`
- `/about`
- `/contact`

---

## E. デザイン原則

### E-1. トーン

- industrial
- editorial
- serious
- practical
- not playful
- not startup-marketing

### E-2. 見た目

- 明るい neutral 背景
- 白カード
- 細い罫線
- 黒とグレー中心
- 角丸は小さくする
- 過剰なグラデ、影、ガラス表現は禁止

### E-3. 禁止

- 紫や青のSaaSグラデ
- 丸いカード3枚の generic feature section
- 大げさなヒーローコピー
- AIっぽい抽象ビジュアル
- 中身より演出が前に出る構成

### E-4. 重視

- 情報階層
- グリッドの規律
- B2Bの信頼感
- 一覧と詳細の読みやすさ
- 判断に必要な情報の整理

---

## F. データモデル要件

### F-1. robots

持ちたい項目の例：

- slug
- name
- manufacturer
- country
- price note
- domestic availability
- distributor
- deployment status
- specs
- safety note
- vendor risk note
- related use cases
- related guides
- sources

### F-2. manufacturers

- slug
- name
- country
- overview
- japan presence
- support model
- related robots
- related reports

### F-3. guides

- slug
- title
- summary
- stage
- topics
- target reader
- updated date
- related robots
- related use cases

### F-4. reports

- slug
- title
- summary
- type
- topic
- published date
- related robot
- related manufacturer
- related use case

### F-5. useCases

- slug
- title
- subtitle
- maturity level
- buyer readiness
- industry tags
- required capabilities
- why humanoids may fit
- why this is hard
- candidate robots

---

## G. ページごとの役割

### G-1. Guides

- ブログ一覧ではなく意思決定ライブラリ
- `Learn / Evaluate / Act`
- topic filter
- featured guide
- practical templates

### G-2. Guide Detail

- ブログ記事ではなく判断支援ページ
- left TOC
- center article
- right decision summary
- related robots / reports / use cases

### G-3. Use Cases

- 業界説明ではなく discovery page
- task 起点で探せる
- featured opportunities
- filters
- related guides / robots / compare 導線

### G-4. Use Case Detail

- feasibility page
- where it fits / where it does not fit
- required capabilities
- deployment conditions in Japan
- candidate robots

### G-5. Reports

- generic blog ではなく buyer intelligence archive
- featured report
- archive filters
- why it matters を明示

### G-6. Report Detail

- 何が起きたか
- なぜ重要か
- 日本の買い手にどう関係するか
- signals vs hype

### G-7. Robots

- カタログ一覧 + 詳細
- specs より判断変数を重視

### G-8. Manufacturers

- 会社紹介ではなく、日本でどう調達・保守できるかを前に出す

---

## H. 実装方針

### H-1. ディレクトリ

```text
app/
  page.tsx
  about/page.tsx
  contact/page.tsx
  robots/page.tsx
  robots/[slug]/page.tsx
  manufacturers/page.tsx
  manufacturers/[slug]/page.tsx
  compare/page.tsx
  guides/page.tsx
  guides/[slug]/page.tsx
  use-cases/page.tsx
  use-cases/[slug]/page.tsx
  reports/page.tsx
  reports/[slug]/page.tsx
components/
data/
lib/
```

### H-2. 実装の優先順位

1. 共通レイアウト
2. ナビ
3. guides / use-cases / reports
4. robots / manufacturers / compare
5. about / contact の仕上げ

### H-3. まずはローカルデータ

CMS接続は後でもよい。  
ただし、後で Sanity や microCMS に移しやすい shape にしておく。

---

## I. CMS方針

### I-1. 今は不要

最初の実装では CMS 接続必須ではない。

### I-2. ただし設計はCMS前提

以下を意識する：

- slug中心
- relation を張りやすい構造
- 一覧と詳細が分離されている
- 表示ロジックとデータを分離する

### I-3. 将来候補

- Sanity
- microCMS

---

## J. AIへの指示

### J-1. 任せてよい

- Next.js 初期構成
- ページ雛形
- 型定義
- データモック
- UIコンポーネント
- metadata実装

### J-2. 任せすぎない

- IAの変更
- ナビ構成
- コピーの主張
- 日本市場向け判断軸の省略

### J-3. 注意

- 「いい感じに」ではなく、画面単位で指示すること
- 参考にするのは UI の型だけ
- generic SaaS design に寄せないこと

---

## K. 完了条件

- Next.js で主要ルートが動く
- guides / use-cases / reports の一覧と詳細がある
- robots / manufacturers / compare の型がある
- metadata と基本SEOが入っている
- Vercel に公開できる
- 後で CMS / DB を足せる構造になっている
