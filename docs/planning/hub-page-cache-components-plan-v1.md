# ハブページ Cache Components 導入計画 v2（全体ゲート対応 + /robots キャッシュ先行）

作成日: 2026-06-23
改訂日: 2026-06-23

## 目的

`/robots` `/manufacturers` `/compare` `/reports` `/guides` `/use-cases` の6ハブページは、グローバルナビからの遷移ごとに毎回サーバーでレンダリングし直しており、クリックから表示まで1秒弱の無反応な待ちが発生する（`nav-transition-performance-fix-plan-v1.md` で確認済み）。

Next.js 16 の Cache Components（`cacheComponents: true` + `'use cache'`）を検証し、クエリ付きURLのSEO価値を維持したまま、同じレンダリング処理の再実行を避けられるかを確認する。

ただし、実装試行により、`cacheComponents: true` はアプリ全体のビルド制約を変えるため、**`/robots` だけを先に実装してフラグを有効化する段階導入は成立しない**ことが分かった。本計画は次の2段階に改める。

1. **全体ゲート対応**：`cacheComponents: true` でビルドを通すために、6ハブページ・Footer・トップページ演出・sitemapを先に整える
2. **/robots キャッシュ最適化**：全体ゲートが通った後で、`/robots` だけに `'use cache'` を追加して効果を測る

## 現在の状態

- `HEAD` は `4f74016 docs(plan): add hub page Cache Components plan for /robots, reclassify seo-hub-prerender-plan`
- 計画見直し前の確認時点では `git status --short` は空で、実装試行のコード変更は残っていなかった
- 現行コードでは `cacheComponents: true` はまだ入っていない

## 実装試行で判明した事実

### 1. Root Layout配下のFooterが全ページのゲートになる

`components/Footer.tsx:6` の `new Date().getFullYear()` は root layout 経由で全ページに入る。`cacheComponents: true` を有効にすると、ハブページ以外も含めてビルドを止める。

Next.js公式も、現在時刻をServer Componentで読む場合は `use cache` で固定値として扱うか、request timeへ明示的に逃がす必要があるとしている。

採用方針：

- `Footer` の年表示はリクエストごとに変わる必要がない
- `async function getCopyrightYear() { 'use cache'; return new Date().getFullYear(); }` のような小さいcached helperへ分離する
- `'use cache'` は `cacheComponents: true` とセットでしか使えないため、Footer修正と `next.config.mjs` のフラグ追加は同じ実装ステップで扱う

### 2. 6ハブページ全部を同時にSuspense対応する必要がある

`cacheComponents: true` では、`searchParams` を読むコンポーネントは `<Suspense>` 境界内に置く必要がある。公式docsでも、runtime APIs（`cookies`、`headers`、`searchParams`、一部の`params`）へアクセスするコンポーネントは `<Suspense>` で包むとされている。

現行で該当するページは以下6つのみ。

- `src/app/compare/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/manufacturers/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/robots/page.tsx`
- `src/app/use-cases/page.tsx`

このうち1つでも未対応だと `cacheComponents: true` でビルド全体が落ちる。したがって、旧計画の「`/robots` だけ先行、他5ページは後で横展開」は撤回する。

採用方針：

- 6ページすべてで、Page本体は `searchParams` を読まず `<Suspense>` を返すだけにする
- 既存ロジックは `*PageContent` のような async child へ移し、その子を `<Suspense fallback={<PageSuspenseFallback />}>` の内側に置く
- この段階では `'use cache'` / `cacheLife` / `cacheTag` は入れない
- 目的は高速化ではなく、`cacheComponents: true` のビルドゲートを通すこと

### 3. /robotsのキャッシュ最適化はゲート対応後にページ単位で検証できる

6ページをSuspense対応した後なら、`/robots` のみに `CachedRobotsList` を追加し、`normalizeRobotFilters()` の戻り値をprimitive引数として渡す形でキャッシュ検証できる可能性がある。

ただし、Next.js公式docsでは、serverless環境のruntime cacheはリクエスト間で永続しない場合があるとされている。Vercel本番で「2回目以降のクローラーアクセスが必ず速くなる」とは言い切れない。ローカル `next start` の結果だけで採用判断せず、本番またはVercel Previewで応答時間とログを確認する。

### 4. トップページのClient Componentでも非決定的処理がゲートになる

`components/ui/encrypted-text.tsx:31` の `Math.random()` は Client Component 内だが、初期レンダリング時に実行されるため `cacheComponents: true` でビルドを止める。

現行コードでは `useRef` の初期値で `generateGibberishPreservingSpaces()` を呼び、render pathで `Math.random()` に到達する。

採用方針：

- `scrambleCharsRef` の初期値は空配列にする
- scramble文字列の生成は `useEffect` 内、つまりブラウザ側でのみ行う
- mounted前や未生成時は元の文字を返し、render中に `Math.random()` を呼ばない
- トップページ全体をSuspenseで包んで逃がす案は、static shellを広く削るため採用しない

### 5. sitemapの現在時刻も未確認ゲートとして扱う

`src/app/sitemap.ts:26` に `new Date()` がある。metadata routeでの影響は未検証だが、`cacheComponents: true` はGET Route Handlerにも同じprerender modelを適用するため、sitemapもゲート対象として扱う。

採用方針：

- static pathの `lastModified` に現在時刻を使わない
- データ群の `updatedAt` の最大値、または固定のサイト更新日を使う
- `new Date(record.updatedAt)` はデータ由来の決定的変換なので維持してよいが、ビルドで確認する

### 6. use-casesのgenerateMetadataは別途検証が必要

`src/app/use-cases/page.tsx` は Page本体だけでなく `generateMetadata()` でも `searchParams` を読む。Next.js公式docsでは、Cache Components有効時の `generateMetadata` は他コンポーネントと同じルールに従い、`searchParams` などruntime dataに依存するmetadataはrequest timeへ defer される。

採用方針：

- まず現行のquery依存metadataを維持する
- `UseCasesPageContent` がSuspense内で `searchParams` を読む構造にしたうえでビルドする
- `generateMetadata` 起因のエラーが出た場合は、公式docsのdynamic marker pattern（`connection()` をSuspense内の空コンポーネントで呼ぶ）を使うか、query別metadataを捨てて静的metadataへ戻すかを判断する

## 既存計画との関係

### `seo-hub-prerender-plan-v1.md`

調査の結果、計画が求めていた「`searchParams` をサーバー側で読み、フィルタ済み本文を初期HTMLに出す」構成は実装済み。`docs/planning/README.md` の「(d) archive 移動対象」に登録済みで、実装手順1で `docs/planning/archive/` へ移動する。

### `nav-transition-performance-fix-plan-v1.md`

この計画は「`searchParams` をサーバーで読まない設計に戻す」方向だったが、SEO改善と逆方向なので採用しない。

ただし、Cache Componentsの本番効果が弱い場合は、同計画の問題意識（ナビ遷移の1秒遅延）は未解決のまま残る。その場合は、改めて「SEO維持」と「ナビ体感」を両立する別案を作る。

## 変更対象

### 全体ゲート対応

- `next.config.mjs`
  - `cacheComponents: true` を追加
- `components/Footer.tsx`
  - `new Date().getFullYear()` をcached helperへ移す
- `components/ui/encrypted-text.tsx`
  - render pathから `Math.random()` を除去し、scramble生成をeffect内へ移す
- `src/app/sitemap.ts`
  - static pathの `lastModified` から `new Date()` を除去
- 6ハブページ
  - `src/app/compare/page.tsx`
  - `src/app/guides/page.tsx`
  - `src/app/manufacturers/page.tsx`
  - `src/app/reports/page.tsx`
  - `src/app/robots/page.tsx`
  - `src/app/use-cases/page.tsx`

### /robots キャッシュ最適化

- `src/app/robots/page.tsx`
  - `RobotsPageContent` は `searchParams` を読み正規化するだけ
  - `CachedRobotsList` に `'use cache'` / `cacheLife('hours')` / `cacheTag('robots-list')` を付ける
  - `CachedRobotsList` の引数は `normalizeRobotFilters()` の戻り値6フィールド（`industry`/`task`は`string | null`、その他はprimitive）に限定する

### ドキュメント

- `docs/planning/README.md`
  - archive移動後に `(d)` を空へ戻す
- `docs/planning/archive/README.md`
  - `seo-hub-prerender-plan-v1.md` の移動理由を追記
- `docs/planning/nav-transition-performance-fix-plan-v1.md`
  - `/robots` の検証結果が出た後に更新する

## 実装手順

1. `seo-hub-prerender-plan-v1.md` を `docs/planning/archive/` へ移動し、`docs/planning/README.md` の `(d)` から外す。移動理由は `docs/planning/archive/README.md` に追記する
2. `rg -n "new Date\\(|Date\\.now\\(|Math\\.random\\(|crypto\\.randomUUID\\(|await searchParams|pickSearchParams\\(|cookies\\(|headers\\(|connection\\(" src components lib data scripts` で再監査し、今回の既知箇所以外がないことを記録する
3. `components/ui/encrypted-text.tsx` と `src/app/sitemap.ts` を、`cacheComponents` なしでも成立する決定的実装へ直す
4. 6ハブページをすべて `Page -> Suspense -> *PageContent` 構造へ機械的に分離する。この段階では `'use cache'` を入れない
5. `next.config.mjs` に `cacheComponents: true` を追加し、同じ変更単位で `Footer` の年表示を `use cache` helperへ移す
6. `npm run build` を実行する。新しいbuild errorが出たら、`use cache`・`Suspense`・effect移動・sitemap決定化のどれで扱うべきか分類して修正する
7. `use-cases` の `generateMetadata` がquery依存のまま通るか確認する。通らない場合はdynamic markerか静的metadata化を選ぶ
8. 全体ゲート対応がgreenになったら、`/robots` にだけ `CachedRobotsList` を追加する
9. `CachedRobotsList` に一時ログを入れ、同一クエリで関数本体が再実行されないか、異なるクエリで別キーになるかを確認する
10. 一時ログを削除し、`npm run validate:data` と `npm run build` を再実行する
11. `npm run start` でローカル確認し、可能ならVercel Previewでも応答時間・キャッシュ挙動を確認する
12. `/robots` の結果を見て、他5ハブページにもcache最適化を横展開するか、Cache Components以外の改善策へ戻るか判断する

## 検証コマンド

```bash
npm run validate:data
npm run build
```

追加の確認:

```bash
rg -n "new Date\\(|Date\\.now\\(|Math\\.random\\(|crypto\\.randomUUID\\(" src components lib data scripts
rg -n "await searchParams|pickSearchParams\\(|cookies\\(|headers\\(|connection\\(" src/app components lib
```

## 手動確認チェックリスト

- [ ] `cacheComponents: true` 有効後に全routeのbuildが通る
- [ ] `/robots` `/manufacturers` `/compare` `/reports` `/guides` `/use-cases` の初期HTMLに必要な実データが残っている
- [ ] `/robots?industry=manufacturing` のようなクエリ付きURLで、JS実行前のHTMLにフィルタ済み内容が出る
- [ ] `use-cases` のquery別metadata/noindexが維持される、または静的metadataへ落とす判断が明文化されている
- [ ] `Footer` の年表示が出る
- [ ] トップページの `EncryptedText` 演出がhydration errorなしで動く
- [ ] sitemapが生成され、`lastModified` が妥当な値になる
- [ ] `/robots` の `CachedRobotsList` 一時ログで、同一引数の再実行有無を確認した
- [ ] `<Activity>` によるルート保持の影響確認：ハブページ間を往復してもフィルタ状態・検索入力・スクロール位置・GA pageviewが破綻しない
- [ ] Vercel Previewで、ローカルと同じ前提でcache効果を期待してよいか確認した
- [ ] 検証用の一時ログを削除した
- [ ] `next start` のプロセスを検証後に終了した

## リスクと判断基準

| リスク | 重大度 | 判断基準 |
| --- | --- | --- |
| `cacheComponents: true` の全体ゲート対応が想定以上に広がる | High | 既知箇所修正後も別routeでbuild errorが続く場合は、Cache Components導入を中断して計画を再作成する |
| `/robots` のruntime cacheがVercelで期待ほど効かない | High | Preview/本番で応答時間・ログに改善が見えなければ、他ページ横展開はしない |
| `use-cases` のquery別metadataがCache Componentsと相性悪い | Medium | dynamic markerで通すか、query別metadataをやめるかを明示判断する |
| Suspense fallbackが増えて初期表示の体感が悪化する | Medium | fallback表示時間・CLS・生HTMLを確認し、悪化する場合は導入を止める |
| `<Activity>` による状態保持でUI/計測が変わる | Medium | 戻る/進む・ハブ間往復・GA pageviewを手動確認する |

## 参考にする公式docs

- Next.js Caching / Cache Components: https://nextjs.org/docs/app/getting-started/caching
- `cacheComponents`: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- `use cache`: https://nextjs.org/docs/app/api-reference/directives/use-cache
- `generateMetadata` with Cache Components: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- current time in Client/Server Components: https://nextjs.org/docs/messages/next-prerender-current-time-client
