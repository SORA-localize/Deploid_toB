---
status: current
updated: 2026-07-26
---

# ヒューマノイド導入プラットフォーム — 技術スタック v1

> **2026-07-26 更新**: Next.js / React / Tailwind / Vercel の判断は継続する。CMS・DB・GitHubの役割分担は [`content-platform-and-database-architecture-v2.md`](content-platform-and-database-architecture-v2.md) が上位の正本であり、旧 Sanity / microCMS 候補比較と「閲覧サイトではDB不要」という判断を置き換えた。

---

## 1. 全体像

このサイトは **React系フロントエンドを中核にした公開サイト** として作る。

最初からフルバックエンドを持つのではなく、

- 公開サイト
- 記事・ロボット情報・メーカー情報などのコンテンツ管理
- 将来必要になる保存機能や問い合わせ管理

を段階的に足していく。

現時点の基本思想は次の通り。

1. まずは **公開品質のフロントエンド** を固める
2. 公開コンテンツは **Payload CMS + managed PostgreSQL** で管理し、公開サイトはサーバー経由で読む
3. ユーザー状態や問い合わせ等も PostgreSQL に追加するが、コンテンツcollectionとは責務を分離する

---

## 2. 今回の基本方針

### 採用方針

- **フレームワーク**：Next.js
- **UI実装**：React
- **スタイリング**：Tailwind CSS を使ってよい。ただしデザイントークンを明示し、量産的な見た目に寄せない
- **公開先**：Vercel を第一候補。Cloudflare Pages / Workers は必要に応じて再検討
- **コンテンツ管理**：現在の `data/*.ts` を移行元とし、Payload CMS の管理画面へ段階移行
- **DB**：managed PostgreSQL をコンテンツの永続化先として導入。初期プロバイダー候補は Supabase
- **AI編集**：Payload MCP を制限付きで接続し、Codexは原則 draft 作成まで

### 採用しない方針

- Astro static を本番の前提にはしない
- 「Markdown/JSONを手で増やし続ける」運用を長期前提にしない
- ページやコンポーネントから直接SQL / CMS SDKを呼び、データ取得を分散させない
- GitHubとPostgreSQLの両方を同一レコードの正本にする二重書き込みはしない

---

## 3. なぜ Next.js か

今回のサイトは、単なる読み物サイトではなく、将来的に次の性質を持つ。

- robots / manufacturers / guides / reports / use-cases の多層一覧＋詳細
- SEO流入を狙う記事詳細ページ
- フィルタ、比較、ショートリストのようなインタラクティブUI
- 将来の問い合わせ管理、保存機能、認証の追加余地

この前提だと、Vite は「試作」には向くが、「本番サイトとして育てる器」としては途中で不足しやすい。

Next.js を選ぶ理由は以下。

1. **公開サイトとして育てやすい**
   ルーティング、メタ情報、静的生成、サーバー処理、デプロイの道筋が最初から揃っている。

2. **SEOとの相性がよい**
   reports / robot detail / manufacturer detail / use-case detail を検索流入の主戦場にしやすい。

3. **Reactのまま将来機能を足しやすい**
   API、認証、問い合わせ保存、ショートリスト保存などを後から自然に足せる。

4. **CMS連携と相性がよい**
   Payload を同じ Next.js アプリに統合でき、型・認証・preview・cache invalidation を同じコードベースで管理できる。

---

## 4. なぜ Vite を本番の前提にしないか

Vite が悪いわけではない。UI探索用としては非常に優秀。

ただし今回の懸念は、

- AIに頼りつつ公開まで持っていけるか
- 記事やロボット情報の追加が楽か
- 将来の管理UIやDB接続に無理なく拡張できるか

なので、UI試作速度だけでなく **運用と拡張のしやすさ** まで含めて考える必要がある。

Vite を本番の前提にしない理由：

- ルーティングや公開構造を後で組み替える必要が出やすい
- SEOのための構造を後付けで整理する手間が増える
- 将来 Next.js へ移す時に `react-router` やページ構成の移行コストが発生する

結論として、

- **UIの探索だけなら Vite**
- **本番公開を育てるなら Next.js**

と整理する。

---

## 5. 各ツールの役割

| 名前 | 役割 | 一言 |
|---|---|---|
| **Next.js** | 公開サイト本体 | ページ、一覧、詳細、SEO、将来のAPIの土台 |
| **React** | UI実装 | 比較、絞り込み、保存導線などの体験を作る |
| **Tailwind CSS** | 実装速度を上げるスタイル基盤 | 使ってよいが、トークン設計で意匠を制御する |
| **Payload CMS** | 記事・ロボット情報・メーカー情報の管理 | 非エンジニア向け管理画面、draft / publish、権限、MCP |
| **GitHub** | コード管理 | AI作業・レビュー・履歴管理の中心 |
| **Vercel** | 公開 | Next.js との相性が最も良い第一候補 |
| **managed PostgreSQL** | CMSデータと将来のアプリデータの永続化 | 初期プロバイダー候補は Supabase。責務はschema / collectionで分離 |
| **オブジェクトストレージ** | 画像・添付ファイルの実体保存 | PostgreSQLにはメタデータと参照を保存 |

---

## 6. CSS / UI実装の判断

今回は **Tailwind CSS を許容** する。

ただし、以前の「TailwindはAI感が出やすい」という懸念自体は有効なので、無制限に使う前提ではない。

### ルール

- 色、余白、タイポ、罫線、角丸は **デザイントークン** で統一する
- `shadcn/ui` 等の部品を使ってもよいが、見た目は既製品のままにしない
- 「よくあるSaaSテンプレ顔」を避ける
- 各画面は情報設計とB2Bの信頼感を優先する

### 判断

- **素のCSSにこだわること** より **開発速度と再現性** を優先する
- デザインの独自性は、CSS手法ではなく **情報設計・トークン・余白設計・コピー** で作る

---

## 7. CMSの考え方

今回の重要点は、DBだけでなく **管理画面・権限・公開フロー・AI接続まで含む運用**。

ロボット情報や記事が増えると、TS/JSON/MDX を手で触り続けるのはすぐ辛くなる。

現行データモデルを維持しながら、Payload CMS + managed PostgreSQL へ移行する。

### CMSに期待する役割

- articles の追加・更新
- robots / manufacturers / use-cases の構造化管理
- deployments / articlePlacements の構造化管理
- 関連付け
  - robot ↔ manufacturer
  - robot ↔ use-case
  - article ↔ company / robot / use-case
- draft / review / publish とpreview
- 編集者・公開者・Codex用サービスアカウントの権限制御

### 採用

| 名前 | 採用理由 |
|---|---|---|
| **Payload CMS** | Next.jsへの統合、TypeScript定義、管理画面、アクセス制御、version / draft、PostgreSQL adapter、MCPを一体で管理できる |
| **managed PostgreSQL** | 現行の構造化参照と将来の問い合わせ・認証・保存機能を、責務を分けながら同じ標準DB技術で扱える |

### 今回採用しない候補

- **Sanity / microCMS / Contentful**: 十分有力だが、アプリ側の型・認証・AI接続と別サービスの設定を増やす利点が今回は小さい。
- **Git型CMS**: Git履歴との相性はよいが、非エンジニアの公開運用、構造化参照、将来のアプリデータまで含む最終形にはしない。
- **直接SQL管理**: 管理画面・権限・validation・draftを独自実装する必要があり、避ける。

---

## 8. DBの責務

2026-07-26時点で、公開コンテンツを含め PostgreSQL へ移行する判断を確定した。ただし、すべてを同じ用途・権限で混在させない。

### コンテンツデータ

- Payload collectionを唯一の書込み窓口とする
- robots / manufacturers / articles / useCases / deployments / articlePlacements 等を管理する
- 公開サイトはサーバー専用repositoryからpublishedデータを読む
- GitHubにはschema、migration、importer、テストを残し、運用レコードの正本にはしない

### 将来のアプリデータ

- shortlist / お気に入り
- 問い合わせ・案件・会員・企業別ダッシュボード
- 掲載管理・課金

同じmanaged PostgreSQLを利用できるが、CMS collectionとはテーブル、サービス、権限を分ける。ブラウザからコンテンツテーブルを直接更新させない。

---

## 9. 推奨ロードマップ

### Phase 0：今すぐ

- **スタック**：Next.js ＋ React ＋ Tailwind CSS ＋ ローカルデータ
- **目的**：IA、ナビ、一覧、詳細、比較UIの型を固める
- **データ管理**：`data/*.ts` と `lib/data.ts` で開始（完了済み）
- **公開**：必要ならプレビュー公開

### Phase 1：MVP公開

- **スタック**：Next.js ＋ Vercel
- **目的**：公開品質の robots / manufacturers / use-cases / reports を出す
- **データ管理**：ローカルデータを移行元として固定し、品質ゲートを追加
- **フォーム**：Formspree などで十分

### Phase 2：コンテンツ基盤を移行

- **追加**：Payload CMS + managed PostgreSQL + オブジェクトストレージ
- **目的**：記事・ロボット情報・メーカー情報をブラウザとCodexから安全に管理
- **移行方法**：repository境界、再実行可能importer、parity検証、collection単位cutover
- **詳細**：[`../plans/content-platform-migration-plan-v1.md`](../plans/content-platform-migration-plan-v1.md)

### Phase 3：状態を持つ機能を追加

- **追加**：アプリデータ用schema / service、認証、保存機能
- **対象**：shortlist、問い合わせ管理、会員機能、掲載管理

---

## 10. WordPressを使わない理由

WordPress は「管理画面込み」で一見相性がよさそうに見えるが、今回は採らない。

理由：

- robots / manufacturers / use-cases / guides / reports の構造化関係が扱いづらい
- モダンなフロント体験を作るには結局分離設計が必要になりやすい
- 見た目の自由度と開発体験で Next.js + Headless CMS の方が相性がよい

---

## 11. 判断基準まとめ

- 今回の主戦場は、バックエンドではなく **公開品質のフロントエンドと情報設計**。
- ただし長く育てる前提なら、最初から **Next.js を本番の器** にした方がよい。
- コンテンツは Payload、永続化は managed PostgreSQL、コードとschemaは GitHubを正本とする。
- DBへ移すだけでは不十分で、管理画面・権限・validation・draft / publish・preview・MCPまで一体で整備する。
- 公開ページはrepository境界から読み、直接SQL・直接CMS SDK・巨大な全件クライアント転送を避ける。
- Tailwindは使ってよいが、トークン設計なしで雑に量産しない。
