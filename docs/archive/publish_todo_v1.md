# 公開までの TODO v1

実装（Figma UI 復元・データモデル監査対応）は完了。残りは **公開作業・コンテンツ投入・SEO周り**。

## 0. 直近の状況（チェック済み）
- [x] `main` に全成果をマージ・push 済み
- [x] Formspree 接続、メール到達確認済み（フォームIDは `NEXT_PUBLIC_FORMSPREE_FORM_ID` で管理）
- [x] データモデル監査の 4 点（body / seo / 関係正規化 / 参照整合）反映済み
- [x] 旧Astro残骸 撤去済み

## 1. 公開（Vercel）
- [ ] Vercel で `SORA-localize/Deploid_toB` を Import（Framework: Next.js、Root: `./`、Build: default、Production Branch: `main`）
- [ ] Deploy → `xxxxx.vercel.app` で表示確認
- [ ] 主要導線をクリックして 404 が無いか確認（/, /robots, /robots/[slug], /compare, /manufacturers, /guides, /use-cases, /reports, /about, /contact）
- [ ] Contact フォームから 1 件テスト送信（メール到達確認）
- [ ] （任意）独自ドメイン接続

## 2. コンテンツの実投入（最優先・サイトの存在意義）
- [ ] **メインのガイド `decision-variables` の `body` を書く**（`data/guides.ts`）
  - 「意思決定変数の地図」本文。型に追加済みの `body?: string` に Markdown 段落を入れる。空行で段落分け
- [ ] `poc-planning` の `body` も書く（任意・余力で）
- [ ] ロボット 3〜4 件追加（出典付き）：例 Unitree H1、Tesla Optimus、Apptronik Apollo、1X Neo 等。`data/robots.ts`
- [ ] メーカー 2〜3 件追加（代理店含む）：例 TechShare（Unitreeの国内）、Apptronik、1X、Tesla 等。`data/manufacturers.ts`
- [ ] 用途 2〜3 件追加：例「夜間警備」「展示・受付」など。`data/useCases.ts`
- [ ] 記事 1〜2 件（任意）：観測した一次情報 or 解説。`data/reports.ts`

> データ追加のたびに `npm run dev` で立ち上げると、`lib/validate.ts` が **存在しないslug参照・slug重複** をconsoleに通知します。

## 3. SEO・公開品質
- [ ] `public/favicon.ico`（または `favicon.svg`）を置く
- [ ] OGP 画像（`public/og.png` など）と `app/layout.tsx` の metadata に `openGraph.images` を追加
- [ ] `app/sitemap.ts` を作成（全ページの URL を `getRobots()` 等から自動生成）
- [ ] `app/robots.ts` を作成（`/` を許可、`sitemap` を指定）
- [ ] 各detailの seo（`metaTitle/metaDescription`）を必要に応じて個別設定（generateMetadataは対応済み）
- [ ] モバイル表示の崩れ確認

## 4. 仕上げ（任意）
- [ ] `body` を Markdown でちゃんと描画したい → `react-markdown` 追加（依存は軽量）
- [x] ロボット詳細に複数画像ギャラリー → `Robot.images?: Partial<Record<ImageRole, ImageAsset>>` と静的カルーセルで対応済み
- [ ] `archived` ステータスの扱い分岐（現状 `published 以外` は非表示）
- [ ] CMS 接続（件数が増えてから）：Sanity または microCMS。`types.ts` と整合するスキーマを CMS 側に作り、`lib/data.ts` の取得部だけ差し替え

## 5. 凍結（やらない/後回し）
- Formspree 有料機能（Allowed Domains / Redirect URL）：必要性が出たら検討
- AI 機能（質問アシスタント等）：launch 後

---

## 推奨着手順
1. **Vercel デプロイで公開（数分）**
2. **メインのガイドの `body` を書く**（数時間〜半日：これがサイトの「質と本気度」の証拠）
3. **favicon / OGP / sitemap / robots.ts**（30分〜1時間）
4. ロボット/メーカーを追加して件数を厚くする
