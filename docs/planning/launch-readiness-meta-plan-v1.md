# 公開前メタ情報・共有表示・計測ポリシー整備計画 v1

作成日: 2026-06-18
ブランチ: `fix/launch-readiness-meta`

## 目的

公開前後に外部から見える品質を整える。対象は OGP/SNS共有、検索結果、sitemap/robots、構造化データ、計測・録画・Cookie/プライバシー、問い合わせ導線、画像権利表記、スマホ表示の確認。

この計画は、実装済み/一部実装済みの要素を壊さず、公開時に問題になりやすい順に小さく修正するためのもの。

## 現状確認

### 実装済み・概ね実装済み

- `src/app/opengraph-image.tsx` に共通 OGP 画像生成がある。
- `src/app/layout.tsx` に基本 metadata、favicon、GA/Clarity/Vercel Analytics の設置がある。
- 各主要ページに `metadata` または `generateMetadata` がある。
- `src/app/robots.ts` と `src/app/sitemap.ts` がある。
- `src/app/not-found.tsx` に 404 ページがある。
- `/contact` と `/privacy` があり、footer から導線がある。
- Robot / Manufacturer / Article の JSON-LD ビルダーがある。
- 画像データには `rights` / `credit` / `sourceUrl` が多く入っている。
- `lib/data.ts` の `getRobots()` は `publishStatus === 'published'` のみを返す。コメントにも「一覧・比較・sitemap は published のみ」と明記されているため、archived robot の sitemap 除外は現状維持の確認対象。
- AnalyticsScripts は `isVercelProduction || (isProd && !process.env.VERCEL_ENV)` でガードされており、開発環境と Vercel Preview では GA/Clarity は発火しない。
- README の環境変数表では `NEXT_PUBLIC_GA_MEASUREMENT_ID` の未設定時デフォルトが仕様として明記されている。

### 不足・要修正

- 詳細ページの HTML では `title` / `description` は個別化されるが、`og:title` / `twitter:title` はサイト共通のままになっている。
- OGP 画像は全ページ共通で、記事・ロボット・メーカーごとの画像が使われていない。
- `sitemap.xml` に `privacy` / `for-manufacturers` が含まれていない。
- noindex と sitemap 掲載対象の整合に確認余地がある。
- Privacy page は GA4 と Formspree には触れているが、Microsoft Clarity、Vercel Analytics、Cookie、録画について明記していない。
- `NEXT_PUBLIC_CLARITY_PROJECT_ID` と `NEXT_PUBLIC_GA_MEASUREMENT_ID` のデフォルト値は既存仕様だが、公開前に「env 明示時のみ有効」に変えるべきか再検討する。
- 構造化データは詳細ページ中心で、BreadcrumbList / WebSite / Guide / UseCase は未対応。
- 画像権利表記は詳細ページの一部では出るが、一覧カードやメーカー画像など全表示面で一貫しているとは言えない。
- `.env.example` / README にある `NEXT_PUBLIC_MEDIA_USAGE_POLICY` と本番の画像表示ポリシーが、公開時の意図と一致しているか未確認。
- スマホ表示と SNS 実プレビューはコード上の確認のみで、実表示確認が未完了。

## 対応優先順

### P0. 外部プレビュー・検索メタ情報

目的: URL共有時と検索結果で、ページ固有の内容が正しく出る状態にする。

タスク:

- 共通の metadata helper を作るか、既存 `generateMetadata` に最小追加する。
- 詳細ページに `openGraph` / `twitter` を追加する。
- `openGraph.url` / canonical / metadataBase の整合を確認する。
- 記事詳細は `heroImage` を OGP 画像に使う。画像がない場合は共通 `/opengraph-image` に fallback する。
- ロボット詳細は displayable hero image を使う。なければ共通画像に fallback する。
- メーカー詳細はロゴや代表画像の扱いを決める。まずは共通画像 fallback でもよいが、title/description/url は個別化する。
- 一覧・固定ページも必要に応じて `openGraph` / `twitter` を個別化する。

完了条件:

- `/robots/unitree-g1` の `og:title` がロボット名になる。
- `/reports/...` の `og:title` が記事タイトルになる。
- `/contact` の `og:title` が問い合わせページとして出る。
- `npm run build` が通る。

### P1. Sitemap / Robots / Indexing 整合

目的: Google が拾うURLと noindex 方針を揃える。

タスク:

- `src/app/sitemap.ts` の static paths に `/privacy` と `/for-manufacturers` を追加するか、noindexにするか決める。
- guide/useCase と同じように article/robot/manufacturer も noindex 対象を除外する。
- archived robot が sitemap から除外され続けることを現状維持として確認する。`getRobots()` が published のみを返すため、現時点では対応済み。
- sample article は現時点で0件。将来 `contentKind: 'sample'` を持つ記事を追加した時に sitemap へ混ざらないよう、予防的に除外条件を入れるか検討する。P1内では低優先。
- production で `NEXT_PUBLIC_SITE_URL` が必須になる現行ガードを維持する。

完了条件:

- sitemap に noindex ページが混ざらない。
- robots.txt の sitemap URL が本番URLになる前提が明確。
- `npm run build` が通る。

### P2. プライバシー / Cookie / 計測・録画の明記

目的: 計測・録画・問い合わせデータの扱いをユーザーに説明できる状態にする。

タスク:

- `src/app/privacy/page.tsx` に以下を追記する。
  - Google Analytics 4
  - Vercel Analytics
  - Microsoft Clarity
  - Clarity による行動記録・ヒートマップ・セッション録画の可能性
  - Cookie または類似技術の利用
  - Formspree によるフォーム送信処理
- `lib/env.ts` の GA/Clarity デフォルト値を削除するか、README記載どおりの既存仕様として残すか判断する。
- local/dev/preview/production の発火条件を整理する。現状は dev/preview では発火しないため、この安全性は維持する。

完了条件:

- Privacy page に実際に使っている外部サービスがすべて載る。
- GA/Clarity のデフォルト値を残すか削除するかの方針が README とコードで一致している。
- production で env がある場合のみ計測が発火する。

### P3. 構造化データ拡張

目的: 検索エンジンがページの意味を読み取りやすい状態にする。

タスク:

- 既存の Product / Organization / Article JSON-LD は維持する。
- 詳細ページに BreadcrumbList JSON-LD を追加する。
- トップページに WebSite / Organization JSON-LD を追加する。
- Guide と UseCase は `Article` または `TechArticle` として扱うか判断する。

完了条件:

- 主要詳細ページの JSON-LD が複数 script として出る。
- URLは `siteUrl` を使った絶対URLになる。
- build が通る。

### P4. 画像権利表記と表示ポリシー確認

目的: 権利情報をデータに持つだけでなく、ユーザーが見える場所に必要十分に出す。

タスク:

- 詳細ページ:
  - Robot carousel の credit/source 表示を確認する。
  - Article hero の credit/source 表示を確認する。
  - Manufacturer logo/hero の表示方針を確認する。
- 一覧ページ:
  - RobotCard / NewsCard / NewsFeatureCard / ManufacturerCard で画像が出る箇所を洗う。
  - すべてに表示するか、詳細ページに集約するかを決める。
- `/about` と footer の権利方針文言と実表示が矛盾しないようにする。
- `NEXT_PUBLIC_MEDIA_USAGE_POLICY` の本番値を確認する。
  - `reference-attributed`: 出典明記の参照利用を許容する初期運用。
  - `commercial-strict`: 商用許諾済み素材だけを表示する厳格運用。
- README / `.env.example` / Vercel 環境変数で、公開時の画像表示ポリシーが一致しているか確認する。

完了条件:

- 「出典を明記」と書いている箇所と実表示が矛盾しない。
- 少なくとも詳細ページでは画像近傍に credit/source がある。
- 本番の `NEXT_PUBLIC_MEDIA_USAGE_POLICY` が公開方針と一致している。

### P5. スマホ表示・実SNSプレビュー確認

目的: 実際の見え方を最後に確認する。

タスク:

- ローカルまたは preview URL でスマホ幅を確認する。
- 対象:
  - `/`
  - `/robots`
  - `/robots/unitree-g1`
  - `/manufacturers/unitree`
  - `/reports/...`
  - `/compare`
  - `/contact`
  - `/privacy`
- 可能なら Slack / X / LINE / Notion の URL preview を本番または preview URL で確認する。
- OGPキャッシュが残るサービスは再取得ツールを使う。

完了条件:

- 主要ページで横スクロールや本文/ボタンの破綻がない。
- SNSプレビューでタイトル・説明・画像が期待通り。
- `npm run build` が通る。

## 推奨実装順

1. P0: metadata helper とページ別 OG/Twitter metadata の整備。
2. P1: sitemap と noindex 方針の整合。
3. P2: プライバシー文言と analytics env 挙動の整理。
4. P3: BreadcrumbList / WebSite JSON-LD の追加。
5. P4: 画像権利表記の監査と最小限の UI 修正。
6. P5: build と手動プレビュー確認。

## 変更可能性のあるファイル

- `src/app/layout.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/about/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/sitemap.ts`
- `lib/env.ts`
- `lib/jsonLd.ts`
- possible new helper: `lib/metadata.ts`

## 検証コマンド

```bash
npm run validate:data
npm run build
```

UI/手動確認:

```bash
npm run dev
```

## 未決事項

- `privacy` と `for-manufacturers` を index 対象にするか noindex にするか。
- GA/Clarity のデフォルトIDをすぐ削除するか、明示的な env override 前提で本番向けに残すか。
- すべてのカード画像に visible credit が必要か、詳細ページの credit と全体方針の明記で足りるか。
- コンテンツ別 OGP 画像に元メディア素材を直接使うか、生成したブランドカードを使うか。
