# ヒューマノイド導入メディア — 構築メモ＆公開TODO（議事録 v1）

> 姉妹文書：情報設計は `humanoid_media_IA_v1.md`、技術判断は `humanoid_platform_tech_stack_v1.md`、データ型は `nextjs_data_types_v1.ts`、スコープ確定は `humanoid_mvp_scope_decision_v1.md` を参照。  
> 本書は「Next.js 前提で、何をどう作って公開するか」の作業メモ。

---

## 1. 決定事項サマリ

- **ポジション**：日本の toB 事業者が、ヒューマノイド導入を判断するときの入口メディア
- **主戦場**：robots / manufacturers / compare / guides / use-cases / reports
- **本番の器**：Next.js
- **UI実装**：React
- **公開先**：Vercel を第一候補
- **コンテンツ管理**：最初はローカルデータでも可。ただし CMS 移行前提で設計
- **DB**：最初は不要。shortlist / 問い合わせ管理 / 認証が必要になったら追加

---

## 2. 制作の進め方

設計済みの IA をそのままコード化するのではなく、次の順序で進める。

1. **UIの型を決める**
   - Home
   - Robots
   - Manufacturers
   - Compare
   - Guides
   - Use Cases
   - Reports

2. **公開に必要な最小ページを切り出す**
   - Home
   - About
   - Guide detail
   - Contact
   - 余力があれば robots / use-cases / reports の一覧

3. **データ構造を固定する**
   - robots
   - manufacturers
   - guides
   - reports
   - useCases

4. **Next.js のルーティングに落とす**
   - 一覧
   - 詳細
   - 共通レイアウト

5. **Vercel で公開**

6. **運用しながら CMS 接続の要否を判断**

---

## 3. AIの使い方

原則は以前と同じで、**AIに実装をやらせ、人間が構造と審美を握る**。

### AIに渡すもの

- `humanoid_media_IA_v1.md`
- `humanoid_platform_tech_stack_v1.md`
- 画面ごとの Figma Make プロンプト
- 参考 UI の方向性
- データモデルのフィールド定義

### AIに任せやすいもの

- Next.js 初期構成
- レイアウト実装
- 一覧 / 詳細ページの骨格
- ローカルデータ読み込み
- 型定義
- SEO メタの実装
- Vercel 公開までの設定

### AIに丸投げしないもの

- ナビ構成
- どのページを主役にするか
- コピーの主張
- ロボット情報の一次確認
- 日本市場向けの評価軸

---

## 4. デザイン実装ルール

- Tailwind CSS は使ってよい
- ただし、トークンなしで場当たり的にクラスを積まない
- 角丸、影、色、余白のルールを最初に軽く決める
- 量産 SaaS 顔にしない
- guide / report / use-case は「ブログ」ではなく「判断ページ」に見せる

最低限持つトークン例：

- `background`
- `foreground`
- `muted`
- `border`
- `accent`
- `space scale`
- `type scale`

---

## 5. Next.js 実装方針

### 5-1. まずの前提

- App Router を前提にする
- TypeScript を使う
- ルートはページの役割に沿って切る

### 5-2. 想定ルート

- `/`
- `/about`
- `/contact`
- `/robots`
- `/robots/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/compare`
- `/guides`
- `/guides/[slug]`
- `/use-cases`
- `/use-cases/[slug]`
- `/reports`
- `/reports/[slug]`

### 5-3. 想定ディレクトリ

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
  types.ts
  robots.ts
  manufacturers.ts
  guides.ts
  reports.ts
  useCases.ts
lib/
styles/
```

---

## 6. データ管理方針

### Phase 0

ローカルデータでよい。

- `data/types.ts`（`nextjs_data_types_v1.ts` をコピー）
- `data/robots.ts`
- `data/manufacturers.ts`
- `data/guides.ts`
- `data/reports.ts`
- `data/useCases.ts`

### Phase 1

CMS 接続を検討。

有力候補：

- Sanity
- microCMS

### CMSを入れる目安

- 記事追加が頻繁になる
- ロボットやメーカーの件数が増える
- 自分以外が更新したくなる
- 管理画面が欲しい

---

## 7. 公開手順

### 7-1. ローカル

- Node.js LTS を入れる
- `create-next-app` で初期化
- `npm run dev` で起動
- 主要ルートの空ページだけ先に作る

### 7-2. GitHub

- リポジトリ作成
- 初回 push

### 7-3. Vercel

1. GitHub リポジトリを接続
2. Framework Preset は Next.js
3. ビルド設定は原則デフォルト
4. Deploy
5. Preview URL / Production URL を確認

### 7-4. 公開直前チェック

- title / description
- OGP
- favicon
- noindex の有無
- モバイル表示
- 404
- 内部リンク

---

## 8. TODO

### A. 基盤

- [ ] Next.js の初期構成を作る
- [ ] App Router 前提のルート構成を作る
- [ ] 共通レイアウト、ヘッダー、フッターを入れる
- [ ] トークンとベーススタイルを決める

### B. データ

- [ ] `nextjs_data_types_v1.ts` を `data/types.ts` にコピー
- [ ] robots / manufacturers / guides / reports / useCases のサンプルが型に合っている
- [ ] サンプルデータを最低1件ずつ用意
- [ ] 関連付けのルールを決める

### C. 画面

- [ ] Guides 一覧 / 詳細
- [ ] Use Cases 一覧 / 詳細
- [ ] Reports 一覧 / 詳細
- [ ] Robots 一覧 / 詳細
- [ ] Manufacturers 一覧 / 詳細
- [ ] Compare

### D. 公開

- [ ] Vercel に一度早めに出す
- [ ] OGP / favicon / metadata
- [ ] Contact 導線
- [ ] 更新通知導線

---

## 9. 次のアクション

1. Next.js プロジェクトを作る
2. `app/` ルートだけ先に切る
3. `guides / use-cases / reports` の3系統を先に実装する
4. Vercel に仮公開する
5. その後 CMS 接続要否を判断する
