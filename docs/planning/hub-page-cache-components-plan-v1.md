# ハブページ Cache Components 導入計画 v1（/robots 先行）

作成日: 2026-06-23

## 目的

`/robots` `/manufacturers` `/compare` `/reports` `/guides` `/use-cases` の6ハブページは、グローバルナビからの遷移ごとに毎回サーバーでレンダリングし直しており、クリックから表示まで1秒弱の無反応な待ちが発生する（`nav-transition-performance-fix-plan-v1.md` で確認済み）。

Next.js 16 の Cache Components（`cacheComponents: true` + `'use cache'`）を使い、`searchParams` の組み合わせごとにレンダリング結果をキャッシュすることで、クエリ付きURLのSEO価値を維持したまま、2回目以降のアクセス（クローラー含む）で同じ再計算を避け、待ち時間を短縮する。

まず `/robots` 1ページだけに適用し、ビルド・実際のHTML・キャッシュ挙動を確認したうえで他の5ページへ展開するかを判断する。

## 監査で反映した指摘

外部レビューで3点の指摘を受け、すべて反映した。

- **High（設計の誤り）**：`cacheComponents: true` では `searchParams` のような runtime API は `<Suspense>` 境界の内側で読む必要がある。前リビジョンは「ページ自体は今のまま `searchParams` を読む」としており、これは `src/app/robots/page.tsx:17`-`31` の現状構造（Suspense無し）をそのまま残すだけで、静的シェル＋キャッシュ済み動的コンテンツという狙いを実現できない設計だった。→「採用するアプローチ」を、Page（静的）→ Suspense → uncached child（`searchParams` を読む）→ cached child（`'use cache'`）という3層構造に修正した。
- **High（影響範囲の過小評価）**：`cacheComponents: true` はアプリ全体に効くフラグであり、`/manufacturers` `/reports` `/guides` `/use-cases` `/compare` も同様に `searchParams` をトップレベルで読んでいる（`src/app/manufacturers/page.tsx:17`、`reports/page.tsx:15`、`guides/page.tsx:15`、`use-cases/page.tsx:32`、`compare/page.tsx:12`）。コードを変更しなくても、フラグを立てた瞬間にこれら5ページのビルド挙動が変わる可能性がある。→ 実装手順に「全hub pageのsearchParams利用箇所の事前監査」と「フラグだけ立てた時点でのベースラインビルド確認」、ビルドが壊れた場合のロールバック基準を追加した。
- **Medium（検証方法が弱い）**：「2回curlして速いか」だけでは、Next.jsのウォームアップ、OS/プロセスキャッシュ、HTTPキャッシュとキャッシュヒットを区別できない。→ cached関数内に一時的な`console.log`（呼び出されたfilter引数とタイムスタンプ）を入れ、同一URLへの複数アクセスで関数本体が再実行されないこと、異なるURLでは実行されることをサーバーログで直接確認する手順を追加した。検証後にログを削除する。

2回目の外部レビューで追加で3点の指摘を受け、すべて反映した。

- **Medium（ドキュメント整合）**：`docs/planning/README.md`で`seo-hub-prerender-plan-v1.md`を「archiveへ移動」と書きながら、`(d) archive 移動対象`には「移動待ちの文書はありません」と矛盾していた。→ `(d)`に`seo-hub-prerender-plan-v1.md`を明記し、計画段階のため未実施であることを注記した。
- **Medium（クライアント側の影響を過小評価）**：`cacheComponents: true`はNext.js公式ドキュメント（[cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)の「Navigation with Activity」）によると、クライアント側遷移でReactの`<Activity>`を使い、前のルートをunmountせず`hidden`状態で保持する。戻る操作で状態が維持される一方、「マウントされ続けるUIパターンは挙動が変わりうる」と明記されている。→「クライアント側の挙動は不変」という見立てを撤回し、`/robots`↔他ハブページ間の往復、フィルタ操作後の再訪問、GA pageview計測への影響を手動確認チェックリストに追加した。
- **Low（表現が強すぎる）**：「即時表示」「fallbackはキャッシュ未済の一瞬だけ」という言い切りは、Suspense配下のrequest time streamingの実態より強い表現だった。→「再実行を避けて待ちを短縮する」程度の表現に弱めた。

## 既存計画との関係（重要）

このリポジトリには関連する計画が既に2つある。内容を確認した結果、両方とも前提が古いか、目的が逆方向だったため、本計画はその矛盾を解消する位置づけになる。

### `seo-hub-prerender-plan-v1.md`（2026-06-14、`docs/planning/README.md` の「(d) archive 移動対象」に登録済み。MECE管理のため「(c) 未実装・作業計画」からは除外した）

このページのハブ本体が Client Component (`'use client'` の `*Browser`) で、`useSearchParams()` に依存しているため初期HTMLが `ページを読み込み中` のまま JS 実行待ちになっている（`BAILOUT_TO_CLIENT_SIDE_RENDERING`）、という問題を指摘し、「`searchParams` をサーバー側で読み、フィルタ済みの本文を初期HTMLに出す」方向の改修を提案していた。

今回調査した結果、**この計画は既に実装済みだった**。`src/app/robots/page.tsx` 他5ページすべてが、`lib/searchParams.ts` の `pickSearchParams()` で `searchParams` をサーバー側で読み、`normalize*Filters()` で正規化し、結果を `initialFilters` として `*Browser` へ props で渡す構成になっている。`useSearchParams()` を直接呼ぶ箇所は `GoogleAnalyticsPageView.tsx` のみで、`lib/useUrlFilters.ts` / `lib/useActiveArticleSection.ts` はどこからも使われていないデッドコードになっている。

`npm run start` 後に `curl http://localhost:3000/robots` と `curl 'http://localhost:3000/robots?industry=manufacturing'` を実行し、JS実行前の生HTMLに `Unitree` `Figure` 等の実データが含まれ、`ページを読み込み中` / `BAILOUT_TO_CLIENT_SIDE_RENDERING` が0件であることを確認した。計画が想定した問題は解消済みである。

このplanは `docs/planning/archive/` へ移動し、`docs/planning/README.md` の分類を「完了済み」に更新する（本計画の実装手順1に含める）。

### `nav-transition-performance-fix-plan-v1.md`（2026-06-15、同じく「(c) 未実装・作業計画」扱い）

ハブページが `searchParams` をサーバーで読む設計になったことで動的レンダリング（`ƒ`）になり、ナビ遷移が遅く感じる、という問題を指摘し、対策として「`searchParams` をサーバーで読まない設計に戻し、フィルタをクライアント側の状態に移して静的生成に戻す」方向を提案していた。

これは `seo-hub-prerender-plan-v1.md` の改修（サーバー側でフィルタ済み本文を出す）と**逆方向**の対策であり、採用すると前者の成果（クエリ付きURLでも実データを返すSEO改善）を打ち消してしまう。

本計画（Cache Components）は、`searchParams` をサーバーで読む構成を維持したまま、レンダリング結果だけをキャッシュすることで、`nav-transition-performance-fix-plan-v1.md` が問題にした「毎回1秒待つ」を解消する。`searchParams` をサーバーから外す案は採用しない。

このplanは本計画の実装後に再検証し、問題が解消していれば `docs/planning/archive/` へ移動する（実装手順の最終ステップで判断する）。

## 調査したファイル

- `docs/planning/nav-transition-performance-fix-plan-v1.md`
- `docs/planning/seo-hub-prerender-plan-v1.md`
- `docs/planning/README.md`
- `ai/rules/00-index.md` / `10-workflow.md` / `80-doc-governance.md`
- `src/app/robots/page.tsx` / `manufacturers/page.tsx` / `reports/page.tsx` / `compare/page.tsx` / `guides/page.tsx` / `use-cases/page.tsx`
- `components/RobotsBrowser.tsx`
- `lib/searchParams.ts`（`pickSearchParams` / `readFirstSearchParam` / `resolveSearchParams`）
- `lib/robotFilters.ts`（`normalizeRobotFilters` / `getRobotFilterOptions`）
- `lib/data.ts`（`getRobots` / `getManufacturers`）
- `lib/useUrlFilters.ts` / `lib/useActiveArticleSection.ts`（未使用確認）
- `next.config.mjs`
- `package.json`（`next: ^16.2.6`、利用可能スクリプト）
- ビルド出力のルート分類（`npm run build` で `/robots` 等が `ƒ` であることを確認）
- `next start` 後の `curl` による生HTML確認（上記の通り実データ確認済み）

## 採用するアプローチ

`cacheComponents: true` の下では、`searchParams` のような runtime API は、Page本体ではなく **`<Suspense>` で囲んだ内側のコンポーネント**で読む必要がある。Page本体（または `<Suspense>` の外側にある部分）が runtime API に触れると、そこから静的にプリレンダーできなくなり、ページ全体が今までと同じ「毎回動的レンダリング」のままになってしまう。これが前リビジョンの設計ミスだった。

そのため、`/robots` を3層構造にする。

1. **`src/app/robots/page.tsx`（Page、静的）**：`searchParams` を受け取るが自分では読まない。`metadata` 等の静的な部分だけを持ち、本体は `<Suspense fallback={<PageSuspenseFallback />}>` で `RobotsPageContent` を囲んで返すだけにする。
2. **`RobotsPageContent`（uncached、Suspense境界の内側）**：ここで初めて `await pickSearchParams(searchParams, [...])` を呼び、`normalizeRobotFilters()` で正規化する。この関数自体は `'use cache'` を付けない（`searchParams` を読む箇所は cache 不可のため）。正規化済みの値だけを次のcached componentに渡す。
3. **`CachedRobotsList`（`'use cache'`）**：`RobotsPageContent` から渡された `normalizeRobotFilters()` の戻り値（`industry: string | null`、`task: string | null`、`manufacturer: string`、`availability: string`、`release: 'pre' | 'active'`、`query: string`。`lib/robotFilters.ts:31-53` 参照）を引数として受け取る。`null` も `use cache` がシリアライズ可能なprimitiveとして扱うため、空文字等への変換は行わず、既存の型のまま渡す（`RobotFilters`型との不整合を避ける）。内部で `getRobots()` / `getManufacturers()` を呼び直し、`<RobotsBrowser robots={...} manufacturers={...} initialFilters={...} />` を返す。`cacheLife('hours')` と `cacheTag('robots-list')` をここで呼ぶ。

引数の正規化済み文字列がそのままキャッシュキーの一部になるため、フィルタの組み合わせごとに個別にキャッシュされる。データは `data/robots.ts` のローカルTSファイルでビルド時にしか変わらないため、キャッシュキーに自動で入る Build ID により、再デプロイ時には全キャッシュが自動的に無効化される（手動の `revalidateTag` は不要）。

`<Suspense>` の `fallback`（既存 `PageSuspenseFallback`）は、`RobotsPageContent` が `searchParams` を解決し `CachedRobotsList` の結果が揃うまでの間、request time に表示される。キャッシュは「同じ引数の組み合わせに対する再計算を避ける」ものであり、fallbackの表示自体がキャッシュ未済時のみに限られるとは言い切れない（Next.jsの公式説明上も、動的部分はSuspense配下でstreamされるという説明であり、初回missだけがfallbackを見るとは明記されていない）。本計画の効果は「キャッシュヒット時に同じレンダリング処理を繰り返さない」ことであり、それによって待ち時間の短縮を期待する、という表現に留める。

`next.config.mjs` に `cacheComponents: true` を追加する。これは旧 `experimental.ppr` の後継で、**アプリ全体に効くフラグ**。`/manufacturers` `/reports` `/guides` `/use-cases` `/compare` も現状すべて `searchParams` をPage本体でトップレベルに読んでおり（後述の事前監査参照）、フラグを立てた時点でこれら5ページの挙動にも影響しうる。本計画では5ページのコード自体は変更しないが、フラグ投入直後にこれらが壊れていないかを実装手順の早い段階で確認する。

さらに、Next.js公式ドキュメント（[cacheComponents: Navigation with Activity](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)）によると、`cacheComponents: true` を有効にすると、クライアント側遷移でReactの `<Activity>` を使い、離脱したルートをunmountせず`hidden`状態で保持する。これにより、戻る操作で前のページのコンポーネント状態（フォーム入力、開いていたdropdown等）が維持される一方、「常にマウントされ続ける前提でないUIパターンは挙動が変わりうる」と明記されている。`RobotsBrowser`配下の検索入力・dropdown・お気に入り表示、および`GoogleAnalyticsPageView.tsx`（`useSearchParams()`を直接呼ぶページビュー計測）がこの影響を受ける可能性があるため、手動確認チェックリストでハブページ間の往復・再訪問時の挙動とGA計測を確認する。

## 再利用する既存コード

- `lib/searchParams.ts` の `pickSearchParams`（変更なし）
- `lib/robotFilters.ts` の `normalizeRobotFilters` / `getRobotFilterOptions`（変更なし）
- `lib/data.ts` の `getRobots` / `getManufacturers`（変更なし）
- `components/RobotsBrowser.tsx`（変更なし。`initialFilters` を渡す既存の受け口をそのまま使う）
- `components/PageSuspenseFallback.tsx`（既存だが現在未使用。Suspense fallbackとして初めて実際に使う）

## 新規作成するコード

`src/app/robots/page.tsx` 内に以下3つを追加する（ファイルを分けるかは実装時に判断するが、3つの責務は混在させない）。

- `RobotsPageContent`（async、`'use cache'`なし）
  - `searchParams: RouteSearchParams` を受け取り `await pickSearchParams(...)` する
  - `normalizeRobotFilters()` で正規化する
  - `<CachedRobotsList industry={...} task={...} manufacturer={...} availability={...} release={...} query={...} />` を返す
- `CachedRobotsList`（async、`'use cache'`）
  - 引数: `normalizeRobotFilters()` の戻り値6フィールド（`industry`/`task`は`string | null`、`manufacturer`/`availability`/`query`は`string`、`release`は`'pre' | 'active'`）をそのまま渡す。オブジェクトや配列は渡さない（`manufacturers` 等は内部で `getRobots()` / `getManufacturers()` を呼び直す。クロージャに大きい配列を持たせるとキャッシュキー計算のコストや意図しないキー分裂につながるため避ける）
  - 内部で `cacheLife('hours')` と `cacheTag('robots-list')` を呼ぶ
  - 検証中だけ、関数先頭に `console.log('[robots-cache-miss]', { industry, task, ... , at: Date.now() })` を一時的に入れる（手動確認チェックリストの検証完了後に削除する）
  - `getRobots()` / `getManufacturers()` / `getRobotFilterOptions()` を呼び、`normalizeRobotFilters()` 相当の絞り込み結果から `<RobotsBrowser robots={...} manufacturers={...} initialFilters={...} />` を返す
- `RobotsPage`（Page本体）
  - `searchParams` を自分では読まず、そのまま `RobotsPageContent` へ渡す
  - `<Suspense fallback={<PageSuspenseFallback />}><RobotsPageContent searchParams={searchParams} /></Suspense>` を返す

## 変更するファイル

- `next.config.mjs`（`cacheComponents: true` を追加）
- `src/app/robots/page.tsx`（3層構造への再構成）
- `docs/planning/README.md`（本計画の登録、`seo-hub-prerender-plan-v1.md` の分類更新）

## 変更しないファイル

- `components/RobotsBrowser.tsx` とその配下（`SelectControl` 等）
- `lib/robotFilters.ts` / `lib/searchParams.ts` / `lib/data.ts`
- 他5つのハブページ（`/manufacturers` 等）。`/robots` での検証後に横展開するかを判断する
- `lib/useUrlFilters.ts` / `lib/useActiveArticleSection.ts`（デッドコードだが、本計画の対象外。削除する場合は別途確認する）

## 実装手順

1. `seo-hub-prerender-plan-v1.md` を `docs/planning/archive/` へ移動する。`docs/planning/README.md` の「(d) archive 移動対象」からこの項目を削除し「現時点で移動待ちの文書はありません」に戻す（(d)は移動待ちキューであり、移動後に残すのはMECEに反する）。移動の経緯は `docs/planning/archive/README.md` の既存の日付見出し（既存の棚卸し記録と同じ形式）に追記する
2. **事前監査**：`/manufacturers` `/reports` `/guides` `/use-cases` `/compare` の5ページについて、`searchParams` を読んでいる箇所がPage本体（Suspense外）かどうかを再確認し、一覧化する（既に今回の調査で5ページとも該当することを確認済みなので、ここでは「他に見落としがないか」の再チェックに留める）
3. `next.config.mjs` に `cacheComponents: true` を追加する。**この時点では `/robots` 以外のコードはまだ変更しない**
4. `npm run build` を実行する。`/robots` を含む6ハブページすべてでビルドエラー・型エラーが出ていないかを確認する（ベースライン確認）。この時点で `/robots` 以外のページが壊れた場合は、いったん `cacheComponents: true` を外して原因を切り分け、影響範囲が想定以上に広いと判断したらこの計画を中断し、5ページ分の対応も含めた計画に作り直す（`/robots` だけで進められない）
5. `src/app/robots/page.tsx` を `RobotsPage` / `RobotsPageContent` / `CachedRobotsList` の3層に再構成する
6. `CachedRobotsList` に `cacheLife('hours')` / `cacheTag('robots-list')` を付け、検証用の一時 `console.log` を入れる
7. `npm run validate:data && npm run build` を実行し、`/robots` のビルド結果とビルド警告を確認する
8. `npm run start` 後、`curl` でHTML内容を確認し、サーバーログで `CachedRobotsList` の呼び出し回数を確認する（検証コマンド参照）
9. 検証用の `console.log` を削除する
10. 問題なければ `nav-transition-performance-fix-plan-v1.md` を再読し、`/robots` について解消済みと判断できれば、同計画に「`/robots` は cache components で解消済み、残り5ページは横展開を検討」と追記する（archiveへの移動は5ページ全部の対応が終わってから判断する）

## 影響範囲

- 直接影響：`/robots` のみ（コード変更）
- 間接影響：`next.config.mjs` の `cacheComponents: true` はアプリ全体のフラグ。`/manufacturers` `/reports` `/guides` `/use-cases` `/compare` はコード変更なしでも、フラグ投入だけでビルド挙動が変わる可能性がある（いずれも `searchParams` をPage本体でトップレベルに読んでいるため）。手順4のベースラインビルドで確認する
- クライアント側への影響：`cacheComponents: true` はReactの `<Activity>` によるルート状態保持を有効にするため、ハブページ間を往復する際のコンポーネント状態（フィルタUI、検索入力、GA pageview計測）が今までの「都度unmount」前提と挙動が変わる可能性がある。`initialFilters` の受け渡し方法自体は変えないが、「クライアント側の挙動は不変」とは言い切れないため、手動確認チェックリストで往復・再訪問時の挙動を確認する

## リスクと軽減策

| リスク | 重大度 | なぜ問題か | 軽減策 |
| --- | --- | --- | --- |
| `cacheComponents: true` 投入だけで他5ハブページのビルドが壊れる | High | 5ページとも `searchParams` をPage本体トップレベルで読んでおり、`/robots` の3層化と同じ問題を抱えている | 手順4でコード変更前にフラグだけ入れてビルドし、5ページ全部を確認する。壊れた場合は計画を中断し、5ページ分の対応を含めて作り直す |
| `searchParams` を読む場所をSuspense境界の外に置いてしまい、静的化の効果が出ない | High | Cache Componentsの制約を誤解すると、見た目は実装したのに実際は何も改善しない | `RobotsPageContent`（uncached、Suspense内側）と `CachedRobotsList`（`'use cache'`）を分離する3層構造を厳守する |
| キャッシュ関数の引数設計を誤り、意図しない粒度でキャッシュが分裂・共有される | Medium | クロージャ変数や大きいオブジェクトを渡すと、キーが意図せず変わる/巨大化する | 引数は`normalizeRobotFilters()`の戻り値（`string \| null`または`string`のprimitiveのみ）に絞り、`manufacturers` 等は関数内部で取得し直す |
| 「速くなった」が実はキャッシュヒットではなくウォームアップ等の見せかけ | Medium | curlの応答時間比較だけでは原因を区別できない | `CachedRobotsList` に一時ログを入れ、同一クエリへの複数アクセスで関数本体が再実行されないことをサーバーログで直接確認する |
| `<Activity>`によるルート状態保持で、ハブページ間往復時にフィルタUI・GA計測の挙動が変わる | Medium | `cacheComponents: true` は前のルートをunmountせずhidden保持するため、「毎回まっさらにマウントされる」前提のコードがある場合に影響する | 手動確認チェックリストで往復・再訪問時のフィルタ状態・GA pageview発火を確認する。問題が出た場合は `RobotsBrowser` 側の影響範囲を個別に調査する（本計画のスコープでは対症療法のみ） |
| キャッシュにより、データ更新後も古い一覧が一定時間表示される | Low | このサイトはデプロイ時にしかデータが変わらないため実害は小さいが、念のため明示する | Build IDがキャッシュキーに入るため再デプロイで自動的に無効化されることを検証で確認する。手動更新が必要な運用に変わった場合は別途 `revalidateTag` 運用を検討する |
| Suspense fallbackが実際のレイアウトと高さがズレ、CLSが悪化する | Low | `PageSuspenseFallback` が現在のカードグリッドの高さを想定していない可能性 | 手動確認チェックリストでモバイル/PC幅の見た目を確認する |
| `/robots` 以外のSEO効果（`seo-hub-prerender-plan-v1.md` の成果）を誤って後退させる | High | このplanは「searchParamsをサーバーから外す」方向ではないが、実装中に誤ってクライアント側フィルタへ寄せてしまうと後退になる | `RobotsPageContent`がサーバー側で`searchParams`を読み続ける構造を維持し、`initialFilters` props受け渡し自体は変えない |

## 検証コマンド

```bash
npm run validate:data
npm run build
```

## 手動確認チェックリスト

- [ ] `cacheComponents: true` 投入直後（`/robots` 未変更時点）のビルドで、6ハブページすべてにエラー・新規警告が出ていない
- [ ] `npm run build` のルート一覧で `/robots` の分類を記録する。Cache Componentsは完全な静的化ではなく部分キャッシュなので、分類記号自体は変わらない可能性がある点に注意し、分類記号よりも下記HTML/ログの実測を優先する
- [ ] `npm run start` 後、`curl http://localhost:3000/robots` の生HTMLに実際のロボット名が出ている（JS実行前でも内容が見える）
- [ ] 同一クエリへの複数回アクセスで、サーバーログに `[robots-cache-miss]` が初回だけ出て、以降は出ない（キャッシュヒットの直接確認）
- [ ] 異なるクエリ（例: `?industry=manufacturing` と `?industry=logistics`）はそれぞれ別に `[robots-cache-miss]` ログが出る（キーが正しく分かれている確認）
- [ ] `curl 'http://localhost:3000/robots?industry=manufacturing'` でフィルタ済みの内容が生HTMLに出ている
- [ ] ブラウザで `/robots` のフィルタ操作（業種・タスク・メーカー・入手性・検索・release切り替え）が今までと同じ挙動になっている
- [ ] お気に入り（localStorage）が今までと同じ挙動になっている
- [ ] モバイル幅・PC幅でSuspense fallback表示時にレイアウト崩れがない
- [ ] `/manufacturers` `/compare` `/reports` `/guides` `/use-cases` `/` など他ページが`/robots`のコード変更後も壊れていない
- [ ] `<Activity>`によるルート保持の影響確認：`/robots`でフィルタ操作後に別のハブページへ移動し、ブラウザの「戻る」で`/robots`に戻った際、フィルタ状態・検索入力・スクロール位置が破綻していない
- [ ] `/robots`↔`/manufacturers`等を複数回往復しても、表示内容や件数がズレない（古い状態が誤って残っていない）
- [ ] GA pageview（`GoogleAnalyticsPageView.tsx`）が、ハブページ間の往復時に重複発火・発火漏れしていない
- [ ] 検証用の一時 `console.log` を削除したことを確認する
- [ ] `next start` のプロセスを検証後に終了している

## 残るリスク

- Cache Componentsの本番（Vercel）環境での挙動はローカル `next start` だけでは完全には確認できない。デプロイ後にVercelのキャッシュ関連ログ・応答時間を別途確認する
- 他5ページへの展開は本計画のスコープ外。`/robots` の結果を見てから、横展開の優先順位と影響範囲を別途計画する
- `lib/useUrlFilters.ts` / `lib/useActiveArticleSection.ts` のデッドコード削除は本計画の対象外として残っている
