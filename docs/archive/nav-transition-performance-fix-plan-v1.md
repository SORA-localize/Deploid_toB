# Global Navigation Transition Performance Fix Plan v1

作成日: 2026-06-15

## 1. 背景

本番サイトでグローバルナビから `/robots`、`/manufacturers`、`/compare` などへ移動すると、クリックから画面切り替えまで 1 秒弱の待ちが見える。

調査時点では、`components/Header.tsx` のグローバルナビは通常の `next/link` であり、クリック時に重い処理をしている形跡はない。主因はナビ実装ではなく、SEO改善の過程で主要ハブページが動的レンダリング寄りになり、かつ遷移中 UI が接続されていないことにある可能性が高い。

## 2. 現状の観測

- `PageSuspenseFallback` は存在するが、現在は未使用。
- `src/app/**/loading.tsx` は存在しない。
- `npm run build` では、以下の主要ハブがオンデマンド server render 扱いになっている。
  - `/robots`
  - `/manufacturers`
  - `/compare`
  - `/reports`
  - `/guides`
  - `/use-cases`
- 静的生成されているページもある。
  - `/`
  - `/about`
  - `/contact`
  - `/privacy`
  - 各詳細ページ
- お気に入りは `localStorage` ベースであり、サーバーでユーザー固有 HTML を生成する必要はない。
- ログイン状態、認証ユーザー、Cookie、Header、外部 API fetch は主要ハブの初期表示では使われていない。
- `docs/planning/seo-hub-prerender-plan-v1.md` には、Page 側で `await searchParams` を使うと `.next/server/app/*.html` が期待通り出ない可能性がある、と既に懸念が記録されている。

## 3. 原因仮説

SEO改善時に、一覧ページの初期 HTML に本文・カード・内部リンクを出すため、Page Server Component 側で `searchParams` を読む設計に寄せた。

その結果、主要ハブページがクエリパラメータ依存の server render になり、グローバルナビクリック後に次の RSC payload と route chunks が揃うまで、現在画面が残る挙動になっている。

さらに、遷移中の skeleton / pulse fallback が `loading.tsx` や Suspense boundary に接続されていないため、ユーザーには「押したのに反応していない」ように見える。

## 4. 基本方針

このサイトでは、グローバルナビの主要遷移先を原則として静的表示に戻す。

動的レンダリングを使うのは、次の条件を満たす場合に限定する。

- ログイン状態やユーザーごとの権限で HTML が変わる
- Cookie や request header によって初期表示が変わる
- 外部データをリクエスト時に必ず取りに行く必要がある
- クエリ付き URL そのものを SEO 対象として、初期 HTML もクエリごとに変える必要がある

現在の主要ハブでは、上記に該当する理由は薄い。

## 5. SEO 方針

クエリ付き URL は、まず「共有用の操作状態」として扱う。

例:

- `/robots?industry=manufacturing`
- `/manufacturers?country=japan`
- `/reports?section=market`
- `/compare?compare=unitree-g1,figure-02`

これらを直接 SEO 流入の着地 URL として強く狙わない限り、base path を canonical とし、base path の静的 HTML を安定させる。

SEOで明確に狙う切り口がある場合は、クエリ URL ではなく、将来的に静的 landing path を追加する。

例:

- `/robots/industries/manufacturing`
- `/robots/tasks/logistics`
- `/manufacturers/countries/japan`
- `/reports/sections/market`

## 6. 修正対象の分類

### 静的化を優先するページ

- `src/app/robots/page.tsx`
- `src/app/manufacturers/page.tsx`
- `src/app/reports/page.tsx`

これらは SEO ハブとして重要であり、グローバルナビからの体感速度も重要。

### ユーザー操作状態として扱うページ

- `src/app/compare/page.tsx`

`compare` クエリはユーザーが選んだ比較状態であり、SEO対象としての価値は限定的。初期HTMLをクエリごとに動的生成するより、静的な比較ハブとクライアント側の選択復元に寄せる。

### 公開準備中のページ

- `src/app/guides/page.tsx`
- `src/app/use-cases/page.tsx`

`ComingSoonGate` があるため、まずは遷移体感と静的化の整合だけ確認する。公開時にSEO方針を再検討する。

## 7. 実装計画

### Phase 0: ベースライン確認

目的:

現在の遅さとビルド状態を、Chrome に依存せず確認する。

確認内容:

- `npm run build`
- build output の route classification
- `.next/server/app/*.html` の有無
- `next start` 後の `curl` timing
- 本番URLが分かる場合は `curl -w` で TTFB と total time を確認

検証コマンド例:

```bash
npm run build
find .next/server/app -maxdepth 2 \( -name '*.html' -o -name '*.rsc' \) | sort
```

本番または `next start` の確認例:

```bash
curl -o /dev/null -sS -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://example.com/robots
curl -o /dev/null -sS -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://example.com/manufacturers
curl -o /dev/null -sS -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://example.com/compare
```

### Phase 1: 遷移中 UI の復活

目的:

根本修正前に、クリック直後の無反応感を減らす。

変更候補:

- `src/app/robots/loading.tsx`
- `src/app/manufacturers/loading.tsx`
- `src/app/reports/loading.tsx`
- `src/app/compare/loading.tsx`
- `src/app/guides/loading.tsx`
- `src/app/use-cases/loading.tsx`

実装方針:

既存の `components/PageSuspenseFallback.tsx` を使う。

```tsx
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';

export default function Loading() {
  return <PageSuspenseFallback />;
}
```

注意:

- これは体感改善であり、根本的な静的化ではない。
- root `src/app/loading.tsx` にすると影響範囲が広いため、まずは対象 route ごとの `loading.tsx` に限定する。
- skeleton の高さや見た目がページと大きくズレる場合は、ページ種別ごとの fallback variant を検討する。

### Phase 2: クエリ付き URL の扱いを固定

目的:

静的化してよいページと、動的HTMLが必要なページを明確に分ける。

決めること:

- `/robots?industry=...` を SEO インデックス対象にするか
- `/manufacturers?country=...` を SEO インデックス対象にするか
- `/reports?section=...` を SEO インデックス対象にするか
- `/compare?compare=...` を SEO インデックス対象にするか

推奨:

- query URL は共有用。
- SEO は base path と詳細ページで担保。
- SEO で狙う切り口は、後で静的 landing path として作る。

### Phase 3: Robots の静的化

目的:

`/robots` をグローバルナビから即時遷移しやすい静的ハブに戻す。

変更対象:

- `src/app/robots/page.tsx`
- `components/RobotsBrowser.tsx`
- 必要なら新規 hook
  - `lib/useClientRobotFilters.ts`
  - または `lib/useClientUrlState.ts`

修正方針:

- `src/app/robots/page.tsx` で `searchParams` を受け取らない。
- server 側では default filter の一覧を出す。
- `RobotsBrowser` は初期表示後、クライアント側で `window.location.search` を読み、必要ならフィルター状態を復元する。
- `useSearchParams()` は使わないか、使う場合は小さい Client island に閉じ込める。
- お気に入りは現状通り `localStorage` から読む。

期待する改善:

- `/robots` の build output が静的扱いに戻る。
- `.next/server/app/robots.html` または同等の静的成果物が確認できる。
- グローバルナビから `/robots` への初回遷移の待ちが減る。

リスク:

- クエリ付き URL 直アクセス時、SSR HTML は default list になり、hydration 後にフィルターが反映される可能性がある。
- このリスクは、query URL を SEO 対象にしない方針なら許容しやすい。

### Phase 4: Manufacturers の静的化

目的:

`/manufacturers` を静的ハブに戻す。

変更対象:

- `src/app/manufacturers/page.tsx`
- `components/ManufacturersBrowser.tsx`
- 必要なら `lib/useClientManufacturerFilters.ts`

修正方針:

- `searchParams` を Page Server Component で読まない。
- default filters を server で作る。
- country / route / q はクライアント側で URL から復元する。
- canonical は `/manufacturers` に寄せる。

期待する改善:

- `/manufacturers` のナビ遷移が軽くなる。
- メーカー一覧の初期HTMLと内部リンクは維持される。

### Phase 5: Reports の静的化

目的:

`/reports` を静的な記事ハブとして安定させる。

変更対象:

- `src/app/reports/page.tsx`
- `components/ReportsBrowser.tsx`

修正方針:

- `section` と pagination の初期状態を server `searchParams` から読まない。
- base path では最新または既定セクションを静的に出す。
- `section` / page はクライアント側の操作状態として復元する。
- SEO でセクション別流入を狙う場合は、将来的に `/reports/sections/[section]` のような静的 route を追加する。

### Phase 6: Compare の user-state 化

目的:

`/compare?compare=...` を動的SSRではなく、共有可能なクライアント状態として扱う。

変更対象:

- `src/app/compare/page.tsx`
- `components/CompareClient.tsx`
- 必要なら `lib/useClientCompareSelection.ts`

修正方針:

- `src/app/compare/page.tsx` で `searchParams` を読まない。
- server 側ではロボット・メーカーの静的データだけ渡す。
- `CompareClient` が mount 後に `window.location.search` から `compare` を復元する。
- URL更新は既存の router push / replace 方針を維持する。

期待する改善:

- `/compare` へのグローバルナビ遷移が軽くなる。
- ユーザーが共有した比較URLは hydration 後に復元される。

リスク:

- 共有URLの初期HTMLは未選択状態になる。
- 比較ページはSEO対象としての優先度が低いため、許容しやすい。

### Phase 7: Guides / Use Cases の整理

目的:

公開準備中ページの遷移体感を悪化させない。

変更対象:

- `src/app/guides/page.tsx`
- `src/app/use-cases/page.tsx`
- `components/GuidesBrowser.tsx`
- `components/UseCasesBrowser.tsx`

修正方針:

- `searchParams` を Page Server Component で読まない。
- gate 表示が主であれば、まずは静的ページとして扱う。
- 公開時に検索・フィルター・SEO landing path の設計を再確認する。

### Phase 8: Header の補助的な体感改善

目的:

静的化後も本番ネットワークで遷移が見える場合に、ナビ側で補助する。

変更候補:

- `components/Header.tsx`
- 必要なら新規 `components/NavTransitionIndicator.tsx`

実装案:

- リンククリック時に pending state を立てる。
- `usePathname()` の変化で pending state を解除する。
- ヘッダー下に 2px 程度の progress / pulse line を出す。

注意:

- これは補助策であり、静的化や `loading.tsx` の代替ではない。
- クリック直後の反応を示す目的に限定する。

## 8. 優先度

### High

- 対象 route に `loading.tsx` を追加し、既存 `PageSuspenseFallback` を接続する。
- query URL を SEO 対象にするか、共有用に限定するか決める。
- `/robots` と `/manufacturers` の server `searchParams` 依存を外す。

### Medium

- `/reports` の section / pagination を client state 化する。
- `/compare` の `compare` param を client state 化する。
- build output で主要ハブが静的扱いになることを検証する。
- canonical 方針を `/reports`、`/compare`、`/guides`、`/use-cases` まで揃える。

### Low

- Header に nav pending indicator を追加する。
- SEO 用の静的 landing path を追加する。
- route ごとの fallback skeleton variant を作る。

## 9. 検証計画

### Build

```bash
npm run build
```

確認:

- `/robots`、`/manufacturers`、`/reports`、`/compare` の route classification
- build warning の増減
- `.next/server/app` の静的成果物

### HTML

```bash
rg -n "Unitree|Figure|ヒューマノイド|メーカー|記事|比較" .next/server/app
rg -n "ページを読み込み中" .next/server/app
```

確認:

- base path の HTML に主要本文、カード、内部リンクが出ている。
- 主要ハブ本文が `PageSuspenseFallback` だけになっていない。

### Runtime

```bash
npm run start
curl -o /dev/null -sS -w 'robots ttfb=%{time_starttransfer} total=%{time_total}\n' http://localhost:3000/robots
curl -o /dev/null -sS -w 'manufacturers ttfb=%{time_starttransfer} total=%{time_total}\n' http://localhost:3000/manufacturers
curl -o /dev/null -sS -w 'compare ttfb=%{time_starttransfer} total=%{time_total}\n' http://localhost:3000/compare
```

確認:

- ローカル production server で TTFB が大きく悪化していない。
- query URL でも hydration 後に操作状態が復元される。

### Manual

Chrome が不安定なため、まずはブラウザ実測に依存しない検証を優先する。

必要なら後で、安定した環境で以下を確認する。

- グローバルナビクリック直後に loading UI が出るか
- `/robots`、`/manufacturers`、`/reports`、`/compare` の初回遷移が改善したか
- フィルター操作後の URL 更新が壊れていないか
- 戻る/進むでフィルター状態が復元されるか
- お気に入り表示が hydration 後に正しく反映されるか

## 10. 実装順序

1. Phase 0 のベースライン確認。
2. Phase 1 の `loading.tsx` 追加。
3. query URL の SEO 方針を固定。
4. `/robots` を静的化。
5. `/manufacturers` を静的化。
6. `/reports` を静的化。
7. `/compare` を user-state 化。
8. `/guides`、`/use-cases` を整理。
9. 必要なら Header の pending indicator を追加。
10. SEO landing path の追加要否を別計画で判断。

## 11. 判断ポイント

実装前に最終確認すべき判断は以下。

1. クエリ付き一覧 URL を SEO インデックス対象にするか。
2. query URL 直アクセス時に、hydration 前は default list が見えることを許容するか。
3. `/compare?compare=...` の初期HTMLが未選択状態でもよいか。
4. 一時対応として `loading.tsx` を先に入れるか、静的化を先に行うか。

推奨判断:

- query URL は共有用に限定する。
- base path の静的HTMLを優先する。
- `loading.tsx` は先に入れる。
- 静的化は `/robots`、`/manufacturers` から進める。

## 12. 変更しないこと

- `ai_implementation_workflow_prompt.md` は変更しない。
- デザイン全体の大規模リファクタリングはしない。
- データ構造は変更しない。
- SEO本文のコンテンツ増減はこの計画の対象外。
- お気に入りをサーバー管理へ移すことはしない。

