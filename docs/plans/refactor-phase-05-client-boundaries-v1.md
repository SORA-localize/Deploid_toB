---
status: plan
updated: 2026-08-01
---

# Phase 5 Client Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一覧・比較画面へraw domain record全体を渡す構造と、client filter後にRSCを再取得する二重処理を解消する。

**Architecture:** server pageでdisplay/filter用view modelを生成し、client browserは小さいserializable objectだけを受け取る。現在の件数ではclient filterを維持し、URL同期はHistory API + `useSyncExternalStore`で完結させる。cardの常時motion依存を外し、favorite、popover、carousel、DnDだけをclient interactionとして残す。

**Tech Stack:** React 19、Next.js App Router、History API、TypeScript、Vitest/Testing Library、Playwright

## Global Constraints

- DB query、server action、API route、async repositoryを追加しない。
- filter/share URLのparameter名と意味を維持する。
- browser back/forwardでfilter、compare選択、viewが復元される。
- raw `Robot`、`Manufacturer`、`UseCase`、`Article`配列をcatalog client propsへ渡さない。
- `sources`、`fieldEvidence`、本文、未使用mediaをcatalog view modelへ含めない。この制約は**key名だけでなく値の中身にも及ぶ**。本文をJSON keyとして持たなくても、連結済みのsearch textとして同じ文字列をclientへ送るのは違反とする。
- 現行件数ではpagination/filterをclientで完結する。
- `router.push`/`router.replace`によるfilterごとのRSC再取得を廃止する。
- cardの情報、リンク、favorite、compare、popover機能を維持する。
- `/reports`、`/robots`、`/manufacturers`、`/use-cases`の**route固有JS**を下記の上限以下にする（2026-08-01改訂。旧「総量から30%削減」は達成不能だったため差し替え）。

### JS削減目標の再定義（2026-08-01決定）

初版の「first-load JS総量をPhase 1 baselineから30%削減」は**算術的に達成不能**だった。first-load JSの大半はPhase 5が触れない全route共通の共有フロアだからである。実測（Task 1+2適用後）:

| route | first-load総量 | 共有フロア | route固有 | 旧目標（総量-30%） | 旧目標が要求するroute固有 |
|---|---|---|---|---|---|
| `/robots` | 917,181 | 591,394 | 325,787 | 646,159 | 54,765 |
| `/manufacturers` | 769,805 | 591,394 | 178,411 | 637,214 | 45,820 |
| `/use-cases` | 859,601 | 591,394 | 268,207 | 602,884 | **11,490** |
| `/reports` | 1,825,083 | 591,394 | 1,233,689 | 785,122 | 193,728 |

共有フロア591,394バイトは`/privacy`、`/about`、`/for-manufacturers`、`/_not-found`の4つのstatic routeすべてで完全に一致する値であり、react-dom（226KB）を含む全route共通の下限である。旧目標は総量基準だったため、Phase 5が制御できる36%の部分に対して83〜96%の削減を要求していた。`/use-cases`ではfilter・card・tab・paginationを持つclient componentを11,490バイトに収めろという要求になり、達成不能である。

したがって**目標をroute固有JS（first-load chunkのうち共有フロアに含まれないもの）の絶対値上限へ再定義する**。

| route | 現在のroute固有 | 上限 | 削減対象（すべて実測で経路特定済み） |
|---|---|---|---|
| `/reports` | 1,233,689 | **180,000** | 生data 968,993（Task 4）＋motion 4経路（Task 5: `ReportsHeader`→`PageTabBar`、`NewsHeroCarousel`、`uilayouts/carousel`、`ui/card-hover-effect`） |
| `/robots` | 325,787 | **180,000** | motion 134,910（Task 5: `PageTabBar`→`ui/AnimatedTooltip`）＋`lib/search.ts`全体の巻き込み 53,958（Task 5: `normalizeSearchText`切り出し）→ 136,919見込み |
| `/use-cases` | 268,207 | **180,000** | motion 134,910（Task 5: `UseCaseCard`が`motion/react`を直接import。**`PageTabBar`は経由しない**）→ 133,297見込み |
| `/manufacturers` | 178,411 | **180,000** | 既に達成済み |

**上限180,000の根拠と、その限界:** `/manufacturers`の実績値178,411を基準にした。ただしこのrouteが軽いのは手法の成果だけではなく、構造的に2つの重い依存を持たないためでもある。

1. `PageTabBar`を使わない（motion chunk 134,910が乗らない）
2. `@/lib/search`をimportしない（`RobotsBrowser.tsx:20`が`normalizeSearchText`のためだけにimportし、53,958のchunkを生んでいる。`ManufacturersBrowser`にこのimportは無い）

したがって「同じ手法を適用すれば自動的に到達する」値ではない。**両方の依存を明示的に断つTask 5を経て初めて到達可能になる**（`/robots` 136,919、`/use-cases` 133,297の見込み）。Task 5完了時点で実測し、届かないrouteがあれば内訳を取り直してTask 8で対処する。上限そのものを緩めるのは最後の手段とする。

**共有フロア591,394の内訳（後続phaseの候補）:** 本phaseのscope外だが、「手を付けられない」わけではない。調査で判明した分を記録する。

- `37mz4g7000ovi.js`（70,848バイト、sonner×126・lucide・motion・`@vercel/analytics`）は`src/app/layout.tsx`の`<Toaster />`により`/privacy`にも配信されている。toast UIはcatalog／compareの操作feedback用であり、全route必須ではない。必要なrouteのlayoutへ下ろすか`next/dynamic`で遅延化する余地がある。
- `0lhgyw8-y7hhl.js`（154,015バイト）は中身未特定。フロア削減を本格的に検討するなら、まずこのchunkの内訳を取るtaskが必要。

フロアのうち少なくとも約71KBは手を付けられる。後続phaseの独立planとして起票する。

**baselineの扱い:** Phase 1 baselineは測定条件が現行buildと同一である保証がないため、相対削減率の判定には使わない。Task 8で現行build条件による測定値を`docs/reference/refactor-baseline-2026-07-26.md`へ追記し、以後はroute固有JSの絶対値だけをhard gateとする。総量は参考値として記録する。

### Catalog検索範囲（2026-07-31決定、2026-08-01改訂）

**原則:** catalog view modelの`searchText`は、**そのcardが実際に描画する文字列**と**その一覧のfacet選択肢のlabel**だけを対象とする。詳細ページにしか無い本文は一覧の検索対象にしない。id、slug、内部enum値は表示もfacet labelでもないため含めない（enumはlabel経由で引ける）。

`lib/search.ts`の`create*SearchDocument()`は本文fieldを`fields`に含む。これをそのまま連結してVMへ載せると上のGlobal Constraintに反する。実測値:

| route | VM全体 | うちsearchText | 本文除外時の削減 |
|---|---|---|---|
| `/robots`（57件） | 67,185字 | 28,357字（42.2%） | VM全体の **-27.7%** |
| `/manufacturers`（25件） | 24,171字 | 11,401字（47.2%） | VM全体の **-38.8%** |

したがってcatalogの`searchText`は`lib/search.ts`のsearch documentを再利用せず、`lib/catalog/search.ts`がcollectionごとに対象fieldを明示的に列挙して生成する。

**この表は実データ（`data/types.ts`の型定義とcard componentの描画内容）と突き合わせて作成すること。** 初版はrobots／manufacturersのみ実測で決め、use-cases／reportsを実データ確認なしに横展開した結果、存在しないfield名を書き、実際に存在する本文fieldを取りこぼした。

| collection | searchTextへ含める | 含めない |
|---|---|---|
| robots | 機種名（`nameJa`/`name`）、メーカー名、`distributorJapan`、category／stage／readiness／availability／mobility／procurementの各label、card facts（用途・サイズ・価格・稼働時間）の値、`industryTags`、`taskTags` | `summary`、`description`、`comparison.*`、`supportNote`、`safetyNote`、`vendorRiskNote`、`manufacturerId`（内部id） |
| manufacturers | 社名（`nameJa`/`name`）、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabel | `description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note` |
| use-cases | `titleJa`/`title`、`subtitle`、`summary`（`UseCaseCard.tsx:68`が`subtitle ?? summary`を描画）、maturity label、代表ロボット名、`primaryIndustry`、`industryTags`、`taskTags` | `overview`、`whyItMatters`、`whyHardToday`、`environmentRequirements`、`japanDeploymentConditions`、`capabilityNotes`、`sources` |
| reports | `titleJa`/`title`、`summary`、種別label、`themeTags` | `whyItMatters`、`keyTakeaways`、`body`、`manufacturerGuideContent`、`sources` |

`UseCase`に`description`fieldは存在しない（実フィールドは`subtitle?`／`summary`／`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`）。report側の本文は`body`／`manufacturerGuideContent`ではなく`whyItMatters`／`keyTakeaways`が`createReportSearchDocument`へ入っている。

reportsの`summary`を全件持つ理由は「cardに表示するから」では**ない**。`NewsCard`は`summary`を描画せず、描画するのは`NewsFeatureCard.tsx:54`と`NewsHeroCarousel.tsx:131`、つまりhero/featureに選ばれた数件だけである。それでも全件に持たせるのは、**placementがserver側で決まりVMの形をplacement依存にしたくないため、かつ記事数が少なく全件保持のコストが許容範囲だから**。この理由付けを誤ると、次に同じ判断をする人が誤って一般化する。

**受け入れるトレードオフ（2件、別々の劣化）:**

1. **本文検索の喪失。** 一覧の検索範囲は現行より狭くなる。現在は紹介文中の語（例「バッテリー」）でも部分一致でhitするが、今後はhitしない。**このサイトには全体検索ページが存在しない**（`src/app`に`search`ルート無し）ため、一覧から本文検索を外すとサイトから本文検索が完全に消える。退避先は無い。robots／manufacturersの現行実装は関連度ranking無しの単純部分一致（`lib/search.ts`の`matchesSearchDocument`）であり、注記中の一語が偶然一致した無関係なrecordが機種名一致と同列に並ぶ状態でもある。
2. ~~MiniSearchの喪失~~ → **撤回。MiniSearchは維持する（2026-08-01決定）。**

  一度は「first-load JS削減のためMiniSearchを廃止し`includes()`部分一致へ置換する」と決定したが、削減効果を実測したところ**18,690バイト**（chunk `0ugbjz6g929ty.js`。`/use-cases`と`/reports`の両方に載る）にすぎなかった。同じrouteに乗る`PageTabBar`経由のmotion 134,910バイト、`/reports`の生データ968,993バイトと比べて2桁小さく、日本語検索品質（`fuzzy: 0.2`のタイポ許容、`Intl.Segmenter('ja')`の語境界分割）を落とす対価に見合わない。廃止を決めた際の「30%削減目標のため」という根拠自体が、上記「JS削減目標の再定義」の通り誤った目標設定に基づいていた。

  **したがってMiniSearchは残し、索引対象をwhitelist後のfieldへ絞る。** `lib/searchIndex.ts`の`create*SearchIndex`は`lib/search.ts`のsearch documentではなく、`lib/catalog/search.ts`のcatalog searchTextを索引する。これにより本文流出は止まり、検索品質は維持される。Task 6で実施する。

本文全文検索を復活させる場合、build時生成の静的JSONを`public/`へ置き検索窓focus時にfetchする方式が「API routeを追加しない」制約下でも成立する（first-load JSにもRSC payloadにも乗らない）。本phaseのscope外とし、後続phaseの独立taskとして起票する。

**検索窓placeholder:** `lib/uiText.ts`のrobots「ロボット名・メーカー・用途キーワードで検索」とmanufacturers「メーカー名・地域・取扱ロボットで検索」は本決定後の挙動と整合するため変更しない。reportsの「タイトル・トピック・キーワードで検索」は本文検索を想起させるため、Task 3で文言を再検討する。0件時の空状態文言も併せて確認する。

**CMS移行との関係:** whitelistを明示列挙する形にしておくと、将来PostgreSQLの全文検索（`tsvector`／`pg_trgm`）へ移る際に「どのcolumnを索引するか」の仕様がそのまま引き継げる。汎用search documentの再利用のままだと移行時に同じ判断をやり直すことになる。

**`lib/search.ts`／`lib/searchIndex.ts`の行き先:** catalogがこれらを使わなくなると`createReportSearchDocument`等の利用者が消える。Task 3完了時点で残存利用者を`rg`で洗い出し、削除するか後続phaseの削除対象として記録するかを決める。放置すると「2つの検索定義が併存し片方だけメンテされる」という次の事故の種になる。

### 制約のゲート設計

`searchText`の肥大は**Task 5の`check-client-budgets.mjs`では検知できない**。同scriptが見るのは`firstLoadUncompressedJsBytes`（JS chunkのサイズ）だが、server componentからclient componentへ渡るprops（VM）はJS chunkではなくRSC flight payloadに載るためである。実測でも、Task 2適用後の`/robots`のVMデータはJS chunkにもprerendered HTMLにも現れない（PPRでrequest時にstreamされる）。

流出には**2つの独立した経路**があり、それぞれ別のgateが要る。

| 経路 | 例 | 載る場所 |
|---|---|---|
| A. VM factory経由 | 本文を連結した`searchText`をpropsで渡す | RSC flight payload |
| B. import chain経由 | client componentが`localContentSnapshot`をimportする | JS chunk |

**「一番壊れやすい制約のgateは、その制約に最初に触れるtaskへ置く」**をこのplanの構造ルールとし、下記すべてをTask 3で導入する。

経路A（VM側）:

1. **payload byte budget** — `scripts/check-home-payload.mjs`（`.next/server/app/index.html`のバイト数をgateする既存の先例）と同形の`scripts/check-catalog-payload.mjs`。何が増えても発火するため、field列挙の抜けに依存しない。文字数ではなく`Buffer.byteLength`で測る（日本語はUTF-8で1文字3バイトのため、文字数では実転送量を約3倍過小評価する）。
2. **正規化を揃えた本文値assertion** — 下記の通り両辺を同じ関数で正規化する。

経路B（bundle側）:

3. **record slugカウント** — buildされたclient chunkに、record由来のslugが閾値を超えて含まれないことを確認する。**field名では判定しない**（理由は下記）。
4. **size異常検査** — 単一chunkが250,000バイトを超えたら失敗。marker非依存のbackstop。
5. **静的import graph検査** — `'use client'` moduleから`data/**`および`lib/data/localContentSnapshot`へ到達しないことを検証する。buildが不要で、結果ではなく**原因側**を直接見る。

両経路の共通防御:

6. **import境界の遮断** — `lib/viewModels/**`と`lib/catalog/**`から`lib/search.ts`／`lib/searchIndex.ts`のimportを禁止する。既存の`scripts/check-data-import-boundaries.mjs`と同形。
7. **計画書のcode blockの型検査** — 上記「計画書自身の型検査」を参照。

**経路Bが必要な理由:** 1〜2はいずれも**VM factoryの出力しか見ていない**。しかしPhase 5最大の制約違反はfactoryを経由しない。`components/ReportsBrowser.tsx` → `lib/articlePlacements.ts:3` → `lib/data/localContentSnapshot`のchainにより、`.next/static/chunks/3r7-bj8a3uy6f.js`が968,993バイトの生dataそのものになっている。VM側のgateを厚くしただけではbundle側が無防備になる。

**field名markerを使わない理由（実測）:** `fieldEvidence`／`vendorRiskNote`／`usageExampleSourceUrls`を現ビルドに当てると、`fieldEvidence`だけで3 chunkにhitし、うち2つ（7,364バイトと13,510バイト）は生datasetではない。field名は`lib/uiText.ts`のUIラベルkeyや`lib/search.ts`のbuilder内のproperty accessとしても出現するため、**field名の出現とrecord値の流出を区別できない**。

さらにcoverageの穴がある。3つのmarkerはいずれも`Robot`／`Manufacturer`が宣言するfieldであり、`data/articles.ts`（228,785バイト）や`data/useCases.ts`（177,085バイト）が単独で漏れても検知できない。現在の違反が捕まるのは`localContentSnapshot`が4 collectionを束ねているからで、設計ではなく偶然である。

record slugカウントは実測で誤検知0だった。

```
total slugs: 133
  968993  3r7-bj8a3uy6f.js  distinct-slugs=133
  （他のchunkはすべて0）
```

slugは全recordが`BaseRecord`から持つため、collectionが増えても自動的にcoverageへ入る。閾値は5とする（UIファイルがslugを1〜2個ハードコードすることはありうるため）。

**値assertionの正規化について（重要）:** `expect(JSON.stringify(vm)).not.toContain(rawText)`は**実測で7.9%取りこぼす**。現行の違反実装に対し12文字以上の本文値343件を検査したところ、343件すべてが実際にsearchTextへ含まれているのに、raw文字列比較で検出できたのは316件だった。原因は`createSearchDocument`→`uniqueSearchValues`が各値に`.normalize('NFKC').trim()`をかけるため、全角括弧・全角数字を含む本文が原文と一致しないこと（例「移動速度3.3m/s（潜在能力5m/s超）」）。加えて新builderは連結後に`normalizeSearchText`（`toLowerCase()`を含む）をかけるためASCIIを含む本文はほぼ全て素通りし、`JSON.stringify`のescape（`"`／`\n`／`\\`）でも一致しなくなる。必ず両辺を同じ関数で正規化し、JSON文字列ではなく`searchText`自体を対象にすること。

```ts
const haystack = normalizeSearchText(items.map((i) => i.filter.searchText).join(' '));
expect(haystack).not.toContain(normalizeSearchText(text));
```

### 計画書自身の型検査（2026-08-01決定）

この計画は3巡連続で**同じ故障モード**を起こした。散文で「実データと突き合わせよ」と決めた直後に、その節のcode例が存在しないfieldを参照していた。

| 巡 | 内容 |
|---|---|
| 1 | `UseCase.description`が存在しないと指摘 → 表は修正、code例は未修正 |
| 2 | 表と code例の食い違い（`manufacturerId`）を指摘 → 当該箇所は修正、別箇所に同型が残存 |
| 3 | Task 6 Step 1のcode例に`useCase.description`、`useCaseMaturityLabels`、`useCase.maturity`（実際は`subtitle`／`summary`、`maturityLabels`、`maturityLevel`）|

「Global Constraints ⇄ Task 対応表を目視確認する」という前回の対策は**この種の誤りを検出できない**。対応表が追跡するのは「どのtaskが担当するか」であり、「そのtaskのcode例が実型と一致するか」ではないからである。実際、対応表を新設した改訂で上記3巡目の誤りが混入した。

**したがって計画書のcode blockを機械的に型検査する。**

```
scripts/check-plan-snippets.mjs
  docs/plans/*.md の ```ts / ```tsx block を .plan-snippets/ へ抽出し、
  tsc --noEmit にかける
```

抽出したsnippetは`data/types.ts`と`lib/**`をimportできる状態でcompileする。これにより`useCase.description`も`useCase.maturity`も実装着手前に落ちる。過去3巡の誤りはすべてこれで防げていた。

snippetは断片であり単体ではcompileできないものが多いため、次のいずれかを満たすblockだけを対象とする。

- 先頭行が`// <path>`形式のfile pathコメントで始まる（そのpathのmoduleとして検査）
- 明示的に`// @plan-check`を付けたblock

対象外のblockには`// @plan-check-skip`を付け、理由を併記する。skipを増やすほどgateは形骸化するため、skipの総数をscriptが出力し、増加に気づけるようにする。

Task 3で導入する。

### 見送った案: searchTextの重複排除（searchExtra）

whitelist後の`searchText`の大半が同一item内の重複であることは実測で確認した（robots: 7,346字のうちVMから復元できないのは3,065字）。VMに`searchText`を持たせず、client側で`item.name`／`facts`等からhaystackを組み、復元できない分だけを`searchExtra`として持たせる案を検討したが、**採用しない**（2026-08-01決定）。

理由:

1. **削減がgateに効かない。** 差分の約4,300字はRSC payloadであり、本phaseのhard gateである route固有JS 180,000バイトには1バイトも寄与しない。
2. **MiniSearch維持と噛み合わない。** MiniSearchは1文書につき1本のテキストを索引する。use-cases／reportsでMiniSearchを維持すると決めた以上、それらには`searchText`相当が必要になる。robots／manufacturersだけ別モデルにすると`lib/catalog/search.ts`が2つの検索モデルを抱える。
3. **一貫性のコストが上回る。** 4 collectionで2方式を併存させる保守コストは、`searchText`を持つことによる payload 増より高い。

**4 collectionすべてで明示的な`searchText`を維持する。** 本文除外による削減（robots -27.7%、manufacturers -38.8%）はそのまま得られる。`searchExtra`と、それに付随する検索対象field集合のpin testは導入しない。


## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `lib/catalog/urlState.ts` | History API storeとReact hook |
| `lib/catalog/urlSearch.ts` | server/client共通の初期query serialize |
| `lib/catalog/search.ts` | collectionごとのcatalog searchText生成（対象fieldをここで明示列挙する）とnormalized search。Task 2で作成、Task 3でwhitelist是正、Task 6でuse-case/article対応 |
| `lib/viewModels/shared.ts` | serializable image/logo/fact型 |
| `lib/viewModels/logo.ts` | domain logoからdisplay logoへのserver変換 |
| `lib/viewModels/robots.ts` | robot list VM |
| `lib/viewModels/manufacturers.ts` | manufacturer list VM |
| `lib/viewModels/useCases.ts` | use-case list VM |
| `lib/viewModels/articles.ts` | report list/hero VM |
| `lib/viewModels/compare.ts` | compare VM |
| `lib/useMediaQuery.ts` | motion package不要のmedia query hook |
| `components/FavoriteButton.tsx` | favoriteだけのclient island |
| `components/compare/CompareMenu.tsx` | selection menu |
| `components/compare/CompareSheet.tsx` | comparison cards/table |
| `components/compare/CompareViewToggle.tsx` | view state |
| `tests/components/catalog-url-state.test.tsx` | push/replace/popstate |
| `tests/unit/view-models/*.test.ts` | serialization/filter contract |
| `tests/e2e/catalog-url-state.spec.ts` | URL共有とback/forward |
| `scripts/check-catalog-payload.mjs` | VM factory出力のbyte budget（Task 3） |
| `scripts/check-client-bundle-content.mjs` | client chunkのrecord slugカウント＋size異常検査（Task 3） |
| `scripts/check-client-import-graph.mjs` | `'use client'`から`data/**`への到達検査（Task 3） |
| `scripts/check-plan-snippets.mjs` | 計画書code blockの`tsc --noEmit`（Task 3） |
| `lib/normalizeSearchText.ts` | `lib/search.ts`から切り出した正規化関数（Task 5） |
| `scripts/check-client-budgets.mjs` | route固有JS budget（Task 8） |

### 変更

| Path | Responsibility |
|---|---|
| `lib/useUrlParamUpdater.ts` | 削除。新storeへ置換 |
| `lib/robotFilters.ts` | Robot VMをfilter |
| `lib/manufacturerFilters.ts` | Manufacturer VMをfilter |
| `lib/useCaseFilters.ts` | UseCase VMをfilter |
| `lib/articleFilters.ts` | Article VMをfilter |
| `components/RobotCard.tsx` | Robot VM props、motion削除 |
| `components/ManufacturerCard.tsx` | Manufacturer VM props、motion削除 |
| `components/ManufacturerLogoName.tsx` | 解決済みdisplay logoを受付 |
| `components/UseCaseCard.tsx` | UseCase VM props、motion削除 |
| `components/NewsCard.tsx` | Article VM props |
| `components/NewsFeatureCard.tsx` | Article VM props |
| `components/NewsHeroCarousel.tsx` | Article VM props、motion hook削除 |
| `components/*Browser.tsx` | VM + local URL state |
| `components/CompareClient.tsx` | coordinatorへ縮小 |
| `components/ComparisonRobotPanel.tsx` | Compare VM props |
| `components/FavoriteCard.tsx` | Compare VM props |
| `src/app/{robots,manufacturers,use-cases,reports,compare}/page.tsx` | server VM生成 |
| `package.json` | client budget gate |

---

### Task 1: URL状態をHistory API storeへ置換する

**Files:**
- Create: `lib/catalog/urlState.ts`
- Create: `tests/components/catalog-url-state.test.tsx`
- Create: `tests/e2e/catalog-url-state.spec.ts`
- Delete: `lib/useUrlParamUpdater.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/CompareClient.tsx`

**Interfaces:**
- Produces:
  - `useCatalogUrlState(initialSearch): { searchParams; updateParams }`
  - `updateCatalogUrl(updates, mode): void`
- Removes: `isPending`とfilter時のRSC navigation

- [ ] **Step 1: hook contract testを書く**

```tsx
// tests/components/catalog-url-state.test.tsx
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCatalogUrlState } from '@/lib/catalog/urlState';

describe('useCatalogUrlState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/robots?q=old');
  });

  it('replaces a parameter without navigating the document', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: 'new', industry: 'logistics' }, 'replace'));
    expect(window.location.pathname).toBe('/robots');
    expect(window.location.search).toBe('?q=new&industry=logistics');
    expect(result.current.searchParams.get('q')).toBe('new');
  });

  it('deletes null and blank values', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => result.current.updateParams({ q: ' ', industry: null }));
    expect(window.location.search).toBe('');
  });

  it('reacts to popstate', () => {
    const { result } = renderHook(() => useCatalogUrlState('?q=old'));
    act(() => {
      window.history.replaceState(null, '', '/robots?q=back');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.searchParams.get('q')).toBe('back');
  });
});
```

- [ ] **Step 2: testがmodule未存在で失敗することを確認する**

Run: `npm run test -- tests/components/catalog-url-state.test.tsx`

Expected: module not foundでFAIL。

- [ ] **Step 3: URL storeを実装する**

```ts
// lib/catalog/urlState.ts
'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type UrlParamValue = string | null | undefined;
export type UrlUpdateMode = 'push' | 'replace';

const URL_CHANGE_EVENT = 'deploid:urlchange';

function normalizeInitialSearch(initialSearch: string) {
  if (!initialSearch) return '';
  return initialSearch.startsWith('?') ? initialSearch : `?${initialSearch}`;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(URL_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(URL_CHANGE_EVENT, onStoreChange);
  };
}

function getBrowserSnapshot() {
  return window.location.search;
}

export function updateCatalogUrl(
  updates: Record<string, UrlParamValue>,
  mode: UrlUpdateMode = 'push',
) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    const normalized = value?.trim();
    if (!normalized) params.delete(key);
    else params.set(key, normalized);
  }
  const query = params.toString();
  const href = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const method = mode === 'replace' ? 'replaceState' : 'pushState';
  window.history[method](window.history.state, '', href);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
}

export function useCatalogUrlState(initialSearch: string) {
  const serverSnapshot = normalizeInitialSearch(initialSearch);
  const search = useSyncExternalStore(subscribe, getBrowserSnapshot, () => serverSnapshot);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const updateParams = useCallback(updateCatalogUrl, []);
  return { searchParams, updateParams };
}
```

- [ ] **Step 4: browserを1つずつ移行する**

各browser propの`initialFilters`/`initialQuery`/`selectedIds`を`initialSearch: string`へ置換する。filterは毎renderで`searchParams`から正規化する。

```ts
const { searchParams, updateParams } = useCatalogUrlState(initialSearch);
const filters = normalizeRobotFilters({
  manufacturer: searchParams.get('manufacturer'),
  availability: searchParams.get('availability'),
  industry: searchParams.get('industry'),
  query: searchParams.get('q'),
  manufacturerValues,
  availabilityValues,
  industryValues,
});
```

`isPending`、`CardGridSkeleton`分岐を削除する。compareは`compare`と`view`を`searchParams`から毎render解決する。

- [ ] **Step 5: server pageからinitial searchを渡す**

各pageで既に取得しているparamsを次でserializeする。

```ts
// lib/catalog/urlSearch.ts
export function toInitialSearch(entries: Record<string, string | null>) {
  const params = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}
```

このhelperは`lib/catalog/urlSearch.ts`へ置き、server/clientどちらからも使えるpure functionにする。対象parameter以外を含めない。

- [ ] **Step 6: E2Eを書く**

```ts
// tests/e2e/catalog-url-state.spec.ts
import { expect, test } from '@playwright/test';

test('robot filters update immediately and survive back/forward', async ({ page }) => {
  await page.goto('/robots');
  const before = await page.locator('[data-catalog-item]').count();
  await page.getByRole('tab', { name: /物流/ }).click();
  await expect(page).toHaveURL(/industry=logistics/);
  const filtered = await page.locator('[data-catalog-item]').count();
  expect(filtered).toBeLessThan(before);
  await page.goBack();
  await expect(page).not.toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(before);
  await page.goForward();
  await expect(page).toHaveURL(/industry=logistics/);
  await expect(page.locator('[data-catalog-item]')).toHaveCount(filtered);
});
```

- [ ] **Step 7: old updaterを削除してgateを実行する**

```bash
rg -n "useUrlParamUpdater|useRouter\\(|router\\.(push|replace)" components lib
npm run test -- tests/components/catalog-url-state.test.tsx
npm run build
npm run test:e2e -- tests/e2e/catalog-url-state.spec.ts
```

Expected: catalog browser内のold updater/router navigation 0件、test PASS。

- [ ] **Step 8: commit**

```bash
git add lib/catalog lib/useUrlParamUpdater.ts components src/app tests/components tests/e2e/catalog-url-state.spec.ts
git commit -m "refactor: keep catalog filters in browser URL state"
```

---

### Task 2: Robot / Manufacturer一覧をview model化する

> **状態: 実装済み（commit `f42ecbf`）。** このtaskはgate類が計画へ追加される前にcommitされている。
> gate（payload budget、import境界、bundle内容検査、計画書の型検査）はTask 3が担当する。
> 本節のStepは実装済みの記録として残す。ただしStep 3のsearchText builderは
> `manufacturerId`を含めない形へ修正済みであり、Task 3で実装を合わせる。

**Files:**
- Create: `lib/viewModels/shared.ts`
- Create: `lib/viewModels/robots.ts`
- Create: `lib/viewModels/manufacturers.ts`
- Create: `lib/catalog/search.ts`
- Create: `scripts/check-catalog-payload.mjs`
- Create: `tests/unit/view-models/robots.test.ts`
- Create: `tests/unit/view-models/manufacturers.test.ts`
- Modify: `scripts/check-data-import-boundaries.mjs`（`lib/viewModels/**`→`lib/search.ts`／`lib/searchIndex.ts`のimport禁止を追加）
- Modify: `package.json`（`check:catalog-payload`を追加し`check`へ組み込む）
- Modify: `lib/robotFilters.ts`
- Modify: `lib/manufacturerFilters.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/ManufacturersBrowser.tsx`
- Modify: `components/RobotCard.tsx`
- Modify: `components/ManufacturerCard.tsx`
- Modify: `components/ManufacturerLogoName.tsx`
- Modify: `src/app/robots/page.tsx`
- Modify: `src/app/manufacturers/page.tsx`

**Interfaces:**
- Produces:
  - `createRobotCatalogItems(robots, manufacturers, useCases): RobotCatalogItem[]`
  - `createManufacturerCatalogItems(manufacturers, robots): ManufacturerCatalogItem[]`

- [ ] **Step 1: serializable VM typesを定義する**

```ts
// lib/viewModels/shared.ts
import type { ManufacturerLogoVariant } from '@/lib/manufacturerLogo';
import type { VisualTone } from '@/lib/visualSemantics';

export interface CatalogImage {
  src: string;
  alt: string;
}

export interface CatalogLogoAsset {
  src: string;
  alt: string;
  credit?: string;
  aspectRatio?: number;
}

export interface CatalogLogo {
  asset?: CatalogLogoAsset;
  resolvedVariant?: ManufacturerLogoVariant;
}

export interface CatalogTag {
  label: string;
  tone: VisualTone;
}

export interface CatalogFact {
  key: string;
  label: string;
  value: string;
  href?: string;
}
```

```ts
// lib/viewModels/logo.ts
import type { Manufacturer } from '@/data/types';
import {
  resolveManufacturerLogo,
  type ManufacturerLogoVariant,
} from '@/lib/manufacturerLogo';
import type { CatalogLogo } from './shared';

export function createCatalogLogo(
  manufacturer: Manufacturer | undefined,
  variant: ManufacturerLogoVariant,
): CatalogLogo {
  if (!manufacturer) return {};
  const { asset, resolvedVariant } = resolveManufacturerLogo(manufacturer, variant);
  return {
    asset: asset
      ? {
          src: asset.src,
          alt: asset.alt,
          credit: asset.credit,
          aspectRatio: asset.aspectRatio,
        }
      : undefined,
    resolvedVariant,
  };
}
```

```ts
// lib/viewModels/robots.ts
export interface RobotCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  image?: CatalogImage;
  manufacturer: CatalogLogo & { id: string; name: string };
  stage: CatalogTag;
  facts: [CatalogFact, CatalogFact, CatalogFact, CatalogFact];
  filter: {
    manufacturerId: string;
    industryTags: string[];
    japanAvailability: string;
    deploymentStage: string;
    searchText: string;
  };
}
```

```ts
// lib/viewModels/manufacturers.ts
export interface ManufacturerCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  website: string;
  logo: CatalogLogo;
  filter: {
    country: string;
    consultationRoute: string;
    searchText: string;
  };
  facts: {
    establishedRegion: string;
    representativeRobot: string;
    consultationRoute: string;
    distributors: Array<{ name: string; website?: string }>;
    distributorLabel: string;
    hasDistributor: boolean;
  };
}
```

- [ ] **Step 2: forbidden field testを書く**

```ts
// tests/unit/view-models/robots.test.ts
import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { normalizeSearchText } from '@/lib/search';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

describe('robot catalog view models', () => {
  const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());
  const json = JSON.stringify(items);

  it('exclude editorial evidence and full domain records', () => {
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"fieldEvidence"');
    expect(json).not.toContain('"comparison"');
    expect(json).not.toContain('"priceOffers"');
  });

  it('exclude body text content, not just its keys', () => {
    // key名の不在だけでは、連結済みsearch textとして本文が載っている場合を検出できない。
    // JSON文字列ではなくsearchText自体を、両辺同じ関数で正規化して比較する。
    // raw文字列比較では実測7.9%取りこぼす（Global Constraints「制約のゲート設計」参照）。
    const haystack = normalizeSearchText(
      items.map((item) => item.filter.searchText).join(' '),
    );
    for (const robot of getRobots()) {
      for (const text of [
        robot.description,
        robot.summary,
        robot.supportNote,
        robot.safetyNote,
        robot.vendorRiskNote,
        ...robot.comparison.strengths,
        ...robot.comparison.constraints,
        ...robot.comparison.bestFit,
        ...robot.comparison.notFit,
      ]) {
        if (!text || text.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(text));
      }
    }
  });
});
```

Manufacturer testは`"sources"`、`"headquarters"`、`"description"`、`"notes"`がJSONに含まれないことをassertする。両testで`"sourceUrl"`と`"rights"`も含まれないことをassertし、表示用logo/imageだけがserializeされることを固定する。Manufacturer側にも同じ正規化済み本文値assertionを置き、`description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note`の実値が現れないことを固定する。

短い文字列は他fieldと偶然一致しうるため、値assertionは12文字以上のものだけを対象とする。

このassertionは「今の型にある本文field」を人手で列挙しているため、fieldが増えても追随しない。そのためStep 2ではpayload budgetとimport境界も併せて導入する（下記Step 2b）。

- [ ] **Step 2b: payload budgetとimport境界を導入する**

`scripts/check-catalog-payload.mjs`を`scripts/check-home-payload.mjs`と同形で作る。5 factoryの出力を`JSON.stringify`し、collectionごとに文字数上限をgateする。初期値は本文除外後の実測値に約15%の余裕を足して設定し、実測値と併せてcommit messageへ残す。

`scripts/check-data-import-boundaries.mjs`へ、`lib/viewModels/**`が`lib/search.ts`／`lib/searchIndex.ts`をimportしないruleを追加する。今回の事故の根本原因は汎用search documentの再利用であり、これを機械的に止める。`lib/catalog/search.ts`は`normalizeSearchText`のためにimportしてよい（対象fieldを自前で列挙するfileであり、search documentは使わない）。

`package.json`へ`check:catalog-payload`を追加し、`check`のpipelineへ`check:home-payload`の直後に挿入する。

- [ ] **Step 3: server factoriesを実装する**

`createRobotCatalogItems`は既存helperをserverで呼ぶ。

```ts
export function createRobotCatalogItems(
  robots: readonly Robot[],
  manufacturers: readonly Manufacturer[],
  useCases: readonly UseCase[],
): RobotCatalogItem[] {
  const manufacturerById = new Map(manufacturers.map((item) => [item.id, item]));
  return robots.map((robot) => {
    const manufacturer = manufacturerById.get(robot.manufacturerId);
    const image = getRobotPrimaryImage(robot);
    const card = createRobotCardViewModel(robot, useCases);
    return {
      id: robot.id,
      slug: robot.slug,
      href: `/robots/${robot.slug}`,
      name: robot.nameJa ?? robot.name,
      image: image ? { src: image.src, alt: image.alt } : undefined,
      manufacturer: {
        id: robot.manufacturerId,
        name: manufacturer?.nameJa ?? manufacturer?.name ?? robot.manufacturerId,
        ...createCatalogLogo(manufacturer, 'combined'),
      },
      stage: {
        label: deploymentStageLabels[robot.deploymentStage],
        tone: getDeploymentStageTone(robot.deploymentStage),
      },
      facts: card.facts.map(({ key, label, value, href }) => ({ key, label, value, href })) as RobotCatalogItem['facts'],
      filter: {
        manufacturerId: robot.manufacturerId,
        industryTags: [...robot.industryTags],
        japanAvailability: robot.japanAvailability,
        deploymentStage: robot.deploymentStage,
        searchText: createRobotCatalogSearchText(robot, manufacturer, card.facts),
      },
    };
  });
}
```

`createCatalogLogo(manufacturer, variant)`は`resolveManufacturerLogo`をserverで呼び、`src`、`alt`、`credit`、`aspectRatio`、`resolvedVariant`だけを返す。Manufacturer factoryは`getDomesticDistributorDisplay`、`getManufacturerEstablishedRegionLabel`、`getManufacturerConsultationRoute`、`getRepresentativeRobotLabel`をserverで解決し、`ManufacturerCatalogItem`へ詰める。

`searchText`は`lib/search.ts`の`createRobotSearchDocument()`／`createManufacturerSearchDocument()`を**使わない**。それらの`fields`には本文が含まれ、Global Constraintの「Catalog検索範囲」に反するため。代わりに`lib/catalog/search.ts`へcollectionごとのbuilderを置き、対象fieldを直接列挙する。

```ts
// lib/catalog/search.ts
import { normalizeSearchText } from '@/lib/search';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
} from '@/lib/labels';
import type { Manufacturer, Robot } from '@/data/types';
import type { CatalogFact } from '@/lib/viewModels/shared';

function joinSearchText(parts: ReadonlyArray<string | number | undefined>) {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

export function createRobotCatalogSearchText(
  robot: Robot,
  manufacturer: Manufacturer | undefined,
  facts: readonly CatalogFact[],
) {
  return joinSearchText([
    robot.nameJa,
    robot.name,
    manufacturer?.nameJa,
    manufacturer?.name,
    robot.distributorJapan,
    robotCategoryLabels[robot.category],
    deploymentStageLabels[robot.deploymentStage],
    buyerReadinessLabels[robot.buyerReadiness],
    japanAvailabilityLabels[robot.japanAvailability],
    robot.specs.mobility ? mobilityLabels[robot.specs.mobility] : undefined,
    ...robot.procurementModels.map((model) => procurementLabels[model]),
    ...facts.map((fact) => fact.value),
    ...robot.industryTags,
    ...robot.taskTags,
  ]);
}
```

`createManufacturerCatalogSearchText(manufacturer, robotsForManufacturer)`も同じ形で、社名、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabelだけを連結する。`description`や`*Note`は渡さない。

- [ ] **Step 4: filtersとcardsをVM入力へ変更する**

`filterRobots`、facet関数は`RobotCatalogItem`を受け、`item.filter.*`だけを見る。`RobotCard`は`item` propだけを受け、`getRobotPrimaryImage`やlabel/tone解決を呼ばない。

```tsx
interface RobotCardProps {
  item: RobotCatalogItem;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  mobileVisual?: boolean;
  eagerImage?: boolean;
}
```

`ManufacturerCard`も`item: ManufacturerCatalogItem`だけを受ける。`ManufacturerLogoName`には`resolvedLogo?: CatalogLogo` propを追加する。指定時は`resolveManufacturerLogo`を再実行せず`resolvedLogo.asset`を描画し、既存の`logo`/`logos` propsはdetail page向けに維持する。

- [ ] **Step 5: catalog cardのmotion依存を外す**

`RobotCard`と`ManufacturerCard`から`motion/react`と`useTiltCardEffect`を削除し、rootを通常の`div`へ変える。pointer追従glowを削除し、既存のCSS `hover:border`、shadow、shimmer、accent lineは維持する。

- [ ] **Step 6: server pagesでVMを生成する**

```tsx
const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());
return <RobotsBrowser items={items} initialSearch={initialSearch} />;
```

```tsx
const items = createManufacturerCatalogItems(getManufacturers(), getRobots());
return <ManufacturersBrowser items={items} initialSearch={initialSearch} />;
```

- [ ] **Step 7: testsとE2Eを実行する**

```bash
npm run test -- tests/unit/view-models/robots.test.ts tests/unit/view-models/manufacturers.test.ts
npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

Expected: VM JSONにforbidden fieldなし、一覧表示/favorite/filterがPASS。

- [ ] **Step 8: commit**

```bash
git add lib/viewModels lib/robotFilters.ts lib/manufacturerFilters.ts components/RobotCard.tsx components/ManufacturerCard.tsx components/ManufacturerLogoName.tsx components/RobotsBrowser.tsx components/ManufacturersBrowser.tsx src/app/robots/page.tsx src/app/manufacturers/page.tsx tests/unit/view-models
git commit -m "refactor: send catalog view models to robot and manufacturer clients"
```

---

### Task 3: 制約のgateを導入する

**Goal:** Task 2でVM化した内容を守るgateを揃える。Task 4以降の大きな削減に着手する前に、退行を機械的に検出できる状態にする。

**gateの設計方針:** 検出手段は**record値の流出**を見るものにし、**field名の出現**では判定しない。field名ベースの判定は実測で機能しないことが確認済みである（下記Step 3参照）。

**Files:**
- Create: `scripts/check-catalog-payload.mjs`
- Create: `scripts/check-client-bundle-content.mjs`
- Create: `scripts/check-client-import-graph.mjs`
- Create: `scripts/check-plan-snippets.mjs`
- Modify: `scripts/check-data-import-boundaries.mjs`
- Modify: `lib/catalog/search.ts`
- Modify: `lib/viewModels/robots.ts`
- Modify: `tests/unit/view-models/robots.test.ts`
- Modify: `tests/unit/view-models/manufacturers.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run check:catalog-payload`、`npm run check:bundle-content`、`npm run check:client-imports`、`npm run check:plan-snippets`

- [ ] **Step 1: searchText builderをwhitelistへ揃える**

Task 2の実装は`manufacturerId`をsearchTextへ含めている。Global Constraintsの表は内部idを除外と定めているため、`lib/catalog/search.ts`の`createRobotCatalogSearchText`から`robot.manufacturerId`を外す。facetでの絞り込みは`item.filter.manufacturerId`が担っており、検索文字列に含める必要はない。

`searchExtra`方式は採用しない（Global Constraintsの「見送った案」を参照）。`filter.searchText`は4 collectionすべてで維持する。

- [ ] **Step 2: payload byte budgetを導入する**

`scripts/check-catalog-payload.mjs`を`scripts/check-home-payload.mjs`と同形で作る。factoryの出力を`JSON.stringify`し、`Buffer.byteLength`でcollectionごとにgateする。文字数ではなくバイト数で測る（日本語はUTF-8で1文字3バイトのため、文字数では実転送量を約3倍過小評価する）。

初期上限は本文除外後の実測値に約15%の余裕を足して設定し、実測値をcommit messageへ残す。

- [ ] **Step 3: bundle内容検査をrecord slugカウント方式で実装する**

**field名マーカー方式は採用しない。** 実測で機能しないことを確認済みである。

現ビルドに`fieldEvidence`／`vendorRiskNote`／`usageExampleSourceUrls`を当てたところ、`fieldEvidence`だけで3 chunkにhitし、うち2つ（7,364バイトと13,510バイト）は生datasetではなかった。原因はfield名が`lib/uiText.ts`のUIラベルkeyや`lib/search.ts`のbuilder内の property access として出現するためで、**field名の出現とrecord値の流出を区別できない**。

さらにcoverageの穴がある。3つのmarkerはいずれも`Robot`／`Manufacturer`が宣言するfieldであり、`data/articles.ts`（228,785バイト）や`data/useCases.ts`（177,085バイト）が単独で漏れても検知できない。現在の違反が捕まるのは`localContentSnapshot`が4 collectionを束ねているからで、設計ではなく偶然である。

代わりに**record slugの出現数**で判定する。実測結果:

```
total slugs: 133
  968993  3r7-bj8a3uy6f.js  distinct-slugs=133
  （他のchunkはすべて0）
```

誤検知0、全collection carbon。閾値も明快である。

```js
// scripts/check-client-bundle-content.mjs
const slugs = [...getRobots(), ...getManufacturers(), ...getUseCases(), ...getArticles()]
  .map((record) => `"${record.slug}"`);

// UIファイルがslugを1〜2個ハードコードすることはありうるため、閾値は5とする。
const MAX_DISTINCT_SLUGS_PER_CHUNK = 5;
```

slugはすべてのrecordが`BaseRecord`から持つため、collectionが増えても自動的にcoverageへ入る。

- [ ] **Step 4: サイズ異常gateを足す**

marker非依存のbackstopとして、単一chunkが250,000バイトを超えたら失敗させる。今回の968,993は一発で落ちる。検出手段が将来無効化されても、異常な大きさのchunkは必ず捕まる。

閾値250,000の根拠: 現ビルドの最大の正常chunkは154,015バイト。約1.6倍の余裕を持たせた。

- [ ] **Step 5: 静的importグラフ検査を足す（原因側の検出）**

`scripts/check-client-import-graph.mjs`を作る。`'use client'`を持つmoduleから`data/**`および`lib/data/localContentSnapshot`へ到達しないことを検証する。**buildが不要で、結果ではなく原因を直接見る。**

Step 3・4がbuild成果物（結果）を見るのに対し、これはsource（原因）を見る。両方あることで、違反の検出と原因特定が同時に済む。

- [ ] **Step 6: 既知違反をallowlistで管理する**

Step 3〜5のgateは、この時点では`/reports`の違反により失敗する。**赤いgateをcommitするのではなく、既知違反をallowlistで明示する。**

```js
const ALLOWED = {
  'components/ReportsBrowser.tsx': 'Task 4で解消。lib/articlePlacements.ts経由のlocalContentSnapshot',
};
```

pipelineは常にgreenを保ちつつ、許可した違反がコードに明示的に残り、消し忘れがdiffで見える。**Task 4の完了条件は「allowlistが空になること」**として機械的に確認できる。

- [ ] **Step 7: import境界を追加する**

`scripts/check-data-import-boundaries.mjs`へ、`lib/viewModels/**`が`lib/search.ts`／`lib/searchIndex.ts`をimportしないruleを追加する。

**`lib/catalog/search.ts`への免除は設けない。** Task 5で`normalizeSearchText`を`lib/search.ts`から独立moduleへ切り出すため、免除は不要になる（Task 5 Step 1参照）。免除を残すと、`lib/search.ts`全体をclient graphへ引き込む経路が塞がらない。

- [ ] **Step 8: 計画書のcode blockを型検査する**

`scripts/check-plan-snippets.mjs`を作る。Global Constraintsの「計画書自身の型検査」節の仕様に従い、`docs/plans/*.md`の`ts`／`tsx` blockを抽出して`tsc --noEmit`にかける。

既知の誤り（Task 6 Step 1の`useCase.description`等）は計画側で修正済みだが、**このgateを入れた時点で未発見の不一致が落ちる可能性がある**。落ちた箇所を修正することがこのStepの完了条件に含まれる。

- [ ] **Step 9: 本文値assertionの正規化を直す**

`tests/unit/view-models/*.test.ts`の本文値assertionを、両辺`normalizeSearchText`で正規化し、JSON文字列ではなく`searchText`自体を対象にする形へ修正する（Global Constraintsの「制約のゲート設計」参照）。raw文字列比較は実測7.9%取りこぼす。

- [ ] **Step 10: package.jsonへ配線する**

```json
{
  "check:catalog-payload": "node scripts/check-catalog-payload.mjs",
  "check:bundle-content": "node scripts/check-client-bundle-content.mjs",
  "check:client-imports": "node scripts/check-client-import-graph.mjs",
  "check:plan-snippets": "node scripts/check-plan-snippets.mjs"
}
```

`check`のpipelineへ次の順で挿入する。build不要なものはbuildの前に置く。

```
… typecheck && lint && check:plan-snippets && check:client-imports && test
   && check:catalog-payload && build && check:home-payload && check:bundle-content
   && check:client-budgets && test:e2e
```

- [ ] **Step 11: 全gateを実行する**

```bash
npm run check:plan-snippets
npm run check:client-imports
npm run test -- tests/unit/view-models
npm run typecheck && npm run lint && npm run build
npm run check:catalog-payload
npm run check:bundle-content
```

Expected: すべてgreen（`/reports`の違反はStep 6のallowlistで明示的に許可された状態）。

- [ ] **Step 12: commit**

```bash
git add scripts/check-catalog-payload.mjs scripts/check-client-bundle-content.mjs \
  scripts/check-client-import-graph.mjs scripts/check-plan-snippets.mjs \
  scripts/check-data-import-boundaries.mjs lib/catalog/search.ts lib/viewModels \
  tests/unit/view-models package.json docs/plans
git commit -m "test: gate catalog payload, client imports and bundle contents"
```

---
### Task 4: `/reports`の生data流出を止める

**Goal:** `components/ReportsBrowser.tsx`（`'use client'`）から`lib/data/localContentSnapshot`へ至るimport chainを切り、968,993バイトのclient chunkを除去する。**Phase 5で最大の削減であり、かつGlobal Constraint違反そのもの。**

**現状の経路（実測）:**

```
components/ReportsBrowser.tsx ('use client')
  → lib/articlePlacements.ts:3   import { localContentSnapshot }
    → lib/data/localContentSnapshot   ← robots / manufacturers / useCases / articles 全部
```

`.next/static/chunks/3r7-bj8a3uy6f.js` = 968,993バイト（`fieldEvidence`×60、`vendorRiskNote`×26、`unitree-g1`×32）。`/reports`のroute固有JS 1,233,689バイトの**79%**。propsですらなく、dataset全体がJS bundleとして全userへ配信されている。

**Files:**
- Modify: `lib/articlePlacements.ts`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `tests/unit/`（placement関連testがあれば）

- [ ] **Step 1: allowlistの現状を確認する**

Task 3 Step 6で`components/ReportsBrowser.tsx`はallowlistへ登録済みである。**このtaskの完了条件はallowlistからこのentryを削除してもgateがgreenであること。**

```bash
npm run check:client-imports   # allowlist込みでgreen
npm run build && npm run check:bundle-content
```

allowlistのentryをコメントアウトして失敗することを先に確認し、違反が実在することを固定する。

- [ ] **Step 2: `lib/articlePlacements.ts`をserver引数化する**

`localContentSnapshot`のimportを削除し、signatureを次へ変更する。

```ts
export function getArticleIndexPlacementReports<T extends { id: string; publishedAt: string }>({
  articles,
  placements,
  limits,
}: {
  articles: readonly T[];
  placements: readonly ArticlePlacement[];
  limits: Readonly<Record<ArticlePlacementSlot, number>>;
}) {
  // 現行のhero/feature selectionをTのidentityを保って返す
}
```

- [ ] **Step 3: `src/app/reports/page.tsx`だけがsnapshotを読む**

`localContentSnapshot.articlePlacements`とlimitsをserver pageで解決し、結果をclientへ渡す。`ReportsBrowser`は`reports`／`heroReports`／`featureReports`を受け取り、placement moduleをimportしない。

このtask時点ではまだArticle VM化（Task 6）が済んでいないため、`ReportsBrowser`のprops型は現行のまま（`Article[]`）でよい。**目的はimport chainを切ることであり、VM化はTask 6が担当する。** 生dataがbundleへ入る経路を先に潰すことで、最大の削減を最短で得る。

- [ ] **Step 4: allowlistを空にしてgateがgreenになることを確認する**

`scripts/check-client-import-graph.mjs`と`scripts/check-client-bundle-content.mjs`のallowlistから`components/ReportsBrowser.tsx`のentryを**削除**し、その状態でgreenになることを確認する。**allowlistが空になることがこのtaskの完了条件である。**

```bash
npm run check:client-imports   # allowlist空でgreen
npm run build
npm run check:bundle-content   # Expected: 違反chunk 0件
node -e "const s=require('./.next/diagnostics/route-bundle-stats.json');console.log(s.find(x=>x.route==='/reports').firstLoadUncompressedJsBytes)"
```

route固有JSの削減幅を実測し、commit messageへ記録する。

- [ ] **Step 5: 回帰確認**

```bash
npm run test
npm run test:e2e -- tests/e2e/public-routes.spec.ts
```

hero/feature/pagination/検索の表示が現行と一致することを確認する。

- [ ] **Step 6: commit**

```bash
git add lib/articlePlacements.ts components/ReportsBrowser.tsx src/app/reports/page.tsx
git commit -m "perf: stop shipping the local content snapshot to the reports client"
```

---

### Task 5: catalog routeのmotionと重量importを外す

**Goal:** `/robots`、`/use-cases`、`/reports`のroute固有JSから、motion依存と`lib/search.ts`全体の巻き込みを除去する。

**現状の経路（すべて実測で特定）:**

motion経路はrouteごとに異なり、**単一の経路ではない**。改訂前の本taskは`PageTabBar`だけを対象にしていたが、それでは`/use-cases`は1バイトも減らず、`/reports`も4経路のうち1本しか潰せない。

| route | motion経路 | `PageTabBar`経由か |
|---|---|---|
| `/robots` | `RobotsBrowser` → `PageTabBar` → `ui/AnimatedTooltip` | はい |
| `/use-cases` | `UseCasesBrowser` → `UseCaseCard` → `motion/react`（直接import）、および `lib/useTiltCardEffect` | **いいえ** |
| `/reports` | ① `ReportsBrowser` → `ReportsHeader` → `PageTabBar` → `ui/AnimatedTooltip`<br>② `ReportsBrowser` → `NewsHeroCarousel`<br>③ `NewsHeroCarousel` → `uilayouts/carousel`<br>④ `ReportsBrowser` → `ui/card-hover-effect` | ①のみ |
| `/manufacturers` | なし（178,411バイトが軽い理由の1つ） | — |

`/use-cases`のmotion chunk（`1mbvphip_2888.js`）と`/robots`・`/reports`のそれ（`0p8sjtw7eybcn.js`）は**同サイズだがmd5が一致しない別ファイル**である。motionが2重にbundleされているため、片方だけ消しても残る。

**もう1つの重量import:** `components/RobotsBrowser.tsx:20`が`normalizeSearchText`のためだけに`@/lib/search`をimportしており、これだけで53,958バイトの`/robots`専用chunk（`02r_vm-d2k0jh.js`。`lib/search.ts`＋`lib/tags`＋`lib/labels`、4つの`create*SearchDocument`込み）が生じている。用途は`filters.query`の空文字判定1箇所（L120）のみ。`ManufacturersBrowser`にこのimportは無く、これも178,411が軽い理由である。

**Files:**
- Create: `lib/normalizeSearchText.ts`
- Modify: `lib/search.ts`
- Modify: `lib/catalog/search.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/ui/AnimatedTooltip.tsx`
- Modify: `components/UseCaseCard.tsx`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `components/ui/card-hover-effect.tsx`
- Modify: `components/uilayouts/carousel.tsx`
- Modify: `lib/useTiltCardEffect.ts`（利用者が消えれば削除）

- [ ] **Step 1: `normalizeSearchText`を独立moduleへ切り出す**

`lib/normalizeSearchText.ts`を新設し、`normalizeSearchText`とその依存だけを置く。`lib/search.ts`はそこからre-exportする（既存の利用者を壊さない）。`components/RobotsBrowser.tsx`と`lib/catalog/search.ts`のimportを新moduleへ差し替える。

これによりTask 3 Step 7で保留していた「`lib/catalog/search.ts`のimport境界免除」が不要になる。免除を撤廃し、`lib/viewModels/**`と`lib/catalog/**`の両方から`lib/search.ts`のimportを禁止する。

削減見込み: `/robots` -53,958。

- [ ] **Step 2: 各motion経路をCSSベースへ置換する**

対象は上表の全経路。`AnimatePresence`／`motion`／`useReducedMotion`／`useTiltCardEffect`を、CSS transitionと`motion-reduce:` utilityへ置き換える。Task 2で`RobotCard`／`ManufacturerCard`に適用した方式と同じ。

置換順に実施し、各段階でroute固有JSを計測して効果を記録する。

1. `components/ui/AnimatedTooltip.tsx`（`/robots`と`/reports`に効く）
2. `components/UseCaseCard.tsx`と`lib/useTiltCardEffect.ts`（`/use-cases`に効く）
3. `components/NewsHeroCarousel.tsx`と`components/uilayouts/carousel.tsx`（`/reports`）
4. `components/ui/card-hover-effect.tsx`（`/reports`）

carouselはautoplay・swipe・keyboard操作を持つため、置換にあたり`embla-carousel`の既存機能で代替できるかを先に確認する。embla自体はmotionに依存しない。

表示・keyboard操作・aria属性・`prefers-reduced-motion`時の挙動は現行と同一に保つ。

- [ ] **Step 3: 利用者が消えたmoduleを片付ける**

```bash
rg -n "useTiltCardEffect|AnimatedTooltip" components lib
rg -n "motion/react" components lib
```

`lib/useTiltCardEffect.ts`の利用者が0になれば削除する。`motion/react`が`package.json`のdependenciesから外せる状態になったかも確認する（compare画面のDnD等、catalog外の利用者が残る可能性がある）。

- [ ] **Step 4: 削減を実測する**

```bash
npm run build
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), String(own).padStart(9), own<=180000?'OK':'OVER');
}"
```

想定値: `/robots` 325,787 − 134,910 − 53,958 = 136,919。`/use-cases` 268,207 − 134,910 = 133,297。

- [ ] **Step 5: 回帰確認とcommit**

```bash
npm run test && npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts
```

tab切替、tooltip表示、carousel操作（autoplay・swipe・keyboard）、card hover、reduced-motion時の挙動をscreenshotで確認する。

```bash
git add lib/normalizeSearchText.ts lib/search.ts lib/catalog/search.ts components lib/useTiltCardEffect.ts
git commit -m "perf: drop motion and search-module weight from catalog routes"
```

---
### Task 6: Use case / Reports一覧をview model化する

> **前提:** Task 4で`localContentSnapshot`のimport chainは既に切れており、Task 3でgateが揃っている。
> このtaskはVM化そのものに集中する。placementのserver引数化はTask 4で完了済みのため、
> 本節のStep 4は「Task 4の結果を前提にReportsBrowserのpropsをVMへ差し替える」だけになる。
>
> **MiniSearchは維持する**（Global Constraintsの決定を参照）。`create*SearchIndex`が索引する
> 対象を`lib/search.ts`のsearch documentから`lib/catalog/search.ts`のcatalog searchTextへ
> 差し替えることで、本文流出を止めつつ日本語検索品質（`fuzzy: 0.2`、`Intl.Segmenter('ja')`）を保つ。

**Files:**
- Modify: `lib/catalog/search.ts`（Task 2で作成済み。use-case／article用builderを追加する）
- Modify: `lib/searchIndex.ts`（索引対象をcatalog searchTextへ差し替え）
- Create: `lib/viewModels/useCases.ts`
- Create: `lib/viewModels/articles.ts`
- Create: `tests/unit/view-models/use-cases.test.ts`
- Create: `tests/unit/view-models/articles.test.ts`
- Modify: `lib/useCaseFilters.ts`
- Modify: `lib/articleFilters.ts`
- Modify: `lib/articlePlacements.ts`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/UseCaseCard.tsx`
- Modify: `components/NewsCard.tsx`
- Modify: `components/NewsFeatureCard.tsx`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `src/app/use-cases/page.tsx`
- Modify: `src/app/reports/page.tsx`

**Interfaces:**
- Produces:
  - `createUseCaseCatalogItems(...)`
  - `createArticleCatalogItems(articles)`
  - `matchesCatalogSearch(searchText, query)`

- [ ] **Step 1: small catalog search contractを書く**

`matchesCatalogSearch`をTask 2で作成済みの`lib/catalog/search.ts`へ追加する。

```ts
// lib/catalog/search.ts（追記）
export function matchesCatalogSearch(searchText: string, query: string) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearchText(searchText);
  return terms.every((term) => haystack.includes(term));
}
```

use-case／article用のsearchText builderも同じfileへ追加する。robots／manufacturersと同様、`lib/search.ts`のsearch documentは再利用せず、対象fieldを直接列挙する。

```ts
export function createUseCaseCatalogSearchText(
  useCase: UseCase,
  robotNames: readonly string[],
) {
  return joinSearchText([
    useCase.titleJa ?? useCase.title,
    useCase.subtitle, // UseCaseCardが subtitle ?? summary を描画するため対象
    useCase.summary,
    maturityLabels[useCase.maturityLevel],
    useCase.primaryIndustry,
    ...robotNames,
    ...useCase.industryTags,
    ...useCase.taskTags,
  ]);
}

export function createArticleCatalogSearchText(article: Article) {
  return joinSearchText([
    article.titleJa ?? article.title,
    article.summary, // cardに表示するため対象
    articleTypeLabels[article.type],
    ...article.themeTags,
  ]);
}
```

対象fieldはGlobal Constraintsの「Catalog検索範囲」表に従う。use-caseは`subtitle`／`summary`（`UseCaseCard`が`subtitle ?? summary`を描画）まで、reportは`summary`までを含め、`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`／`keyTakeaways`／`body`／`manufacturerGuideContent`／`sources`は含めない。`UseCase`に`description`fieldは存在しない。

VM testで日本語、英語、メーカー名、複数語queryが現行代表recordへhitすることを固定する。MiniSearchは維持するため、`fuzzy: 0.2`のタイポ許容と`Intl.Segmenter('ja')`の語境界分割は現行どおり働く。testはcatalog searchTextを索引した状態で代表queryがhitすることを確認する。

- [ ] **Step 2: VM typesを定義する**

```ts
export interface UseCaseCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  description: string;
  maturity: CatalogTag & { value: string };
  evidence?: CatalogTag;
  robotNames: string[];
  filter: {
    primaryIndustry: string;
    industryTags: string[];
    taskTags: string[];
    searchText: string;
  };
}
```

```ts
export interface ArticleCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  publishedAt: string;
  label: string;
  typeTone: VisualTone;
  shelf: ArticleShelf;
  themeTags: string[];
  heroImage?: CatalogImage;
  searchText: string;
}
```

- [ ] **Step 3: factoriesとforbidden field testsを実装する**

Use case JSONに`candidateRobots`、`sources`、`capabilityNotes`がないことをassertする。Article JSONに`body`、`manufacturerGuideContent`、`sources`、`relatedRobotIds`がないことをassertする。

Factoryは既存のlabel、tone、media、evidence helperをserverで解決する。`getDisplayableAsset()`の戻り値は`{ src, alt }`へ写像し、rights/source metadataを含めない。filterの`searchText`はStep 1の`createUseCaseCatalogSearchText()`／`createArticleCatalogSearchText()`で生成する（`createUseCaseSearchDocument`／`createArticleSearchDocument`は本文を含むため使わない）。

Task 2と同じく、両testに**正規化を揃えた**本文値assertionを置く（両辺`normalizeSearchText`、対象はJSON文字列ではなくsearch text自体）。

- use-case: `overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`
- article: `whyItMatters`／`keyTakeaways`／`body`／`manufacturerGuideContent`

`whyItMatters`と`keyTakeaways`が`createReportSearchDocument`の実際の本文fieldであり、初版planが挙げていた`body`／`manufacturerGuideContent`はそこに入っていない。両方をassertion対象に含める。

- [ ] **Step 4: placement結果をVMへ差し替える**

`lib/articlePlacements.ts`のserver引数化と`localContentSnapshot` importの削除は**Task 4で完了済み**である。このtaskで再度行わない。

Task 4時点では`ReportsBrowser`は生の`Article[]`（`reports`／`heroReports`／`featureReports`）を受け取っている。ここではその3つのprop名を維持したまま、型を`ArticleCatalogItem[]`へ差し替える。prop名がTask 4で確定しているため、このstepのdiffは型の差し替えだけになる。

`src/app/reports/page.tsx`はTask 4で既に`localContentSnapshot.articlePlacements`とlimitsを解決している。その結果を`createArticleCatalogItems()`へ通してから渡す形に変える。

- [ ] **Step 5: cards/browserをVMへ変更する**

UseCasesBrowserは`UseCaseCatalogItem[]`、ReportsBrowserは`ArticleCatalogItem[]`を受ける。

**MiniSearchは維持する。** `lib/searchIndex.ts`の`createUseCaseSearchIndex`／`createArticleSearchIndex`は残し、索引する文字列だけを差し替える。現在は`lib/search.ts`の`create*SearchDocument()`（本文を含む）を索引しているため、これを`lib/catalog/search.ts`のcatalog searchTextへ変える。index構築のoption（`prefix: true`、`fuzzy: 0.2`、`combineWith: 'AND'`、`Intl.Segmenter('ja')`のtokenizer）は一切変更しない。

これにより本文流出は止まり、タイポ許容と日本語語境界分割は保たれる。削減効果が18,690バイトにすぎないMiniSearch本体の除去は、日本語検索品質を落とす対価に見合わないため行わない（Global Constraintsの「受け入れるトレードオフ」2を参照）。

`lib/search.ts`の`create*SearchDocument()`の残存利用者を`rg`で洗い出す。catalogが使わなくなって利用者が消えるexportは、このtaskで削除するか後続phaseの削除対象として文書化するかを決める（放置すると検索定義が二重に残り、片方だけメンテされる事故につながる）。

併せてreportsの検索placeholder（`lib/uiText.ts`の「タイトル・トピック・キーワードで検索」）が本文検索を想起させないか再検討し、0件時の空状態文言も確認する。検索範囲が本文を含まなくなったことと文言が整合するかを見る。

UseCaseCardとNewsHeroCarouselのmotion除去は**Task 5で完了済み**のため、このtaskでは扱わない。ここではpropsをVMへ差し替えることに集中する。

- [ ] **Step 6: testsとE2Eを実行する**

```bash
npm run test -- tests/unit/view-models/use-cases.test.ts tests/unit/view-models/articles.test.ts
npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

Expected: Reports/use-case search、tabs、pagination、hero placementが維持される。

- [ ] **Step 7: client graphを確認する**

`MiniSearch`と`create*SearchIndex`は**維持する**ため検索対象に含めない（改訂前は0件を要求していたが、MiniSearch廃止の撤回と矛盾していた）。確認するのは生dataと本文の流出、およびmotionの残存である。

```bash
# 生Article/UseCase配列がclient propsへ渡っていないこと
rg -n "(useCases|reports): (UseCase|Article)\\[\\]" components
# 本文を含むsearch documentがclient graphへ入っていないこと
rg -n "from '@/lib/search'" components lib/viewModels lib/catalog
# Task 5で除去したmotionが戻っていないこと
rg -n "motion/react|useTiltCardEffect" components/UseCaseCard.tsx components/NewsHeroCarousel.tsx
# MiniSearchが索引するのがcatalog searchTextであること
rg -n "createUseCaseSearchIndex|createArticleSearchIndex" lib/searchIndex.ts
```

Expected: 1〜3番目は0件。4番目は`lib/catalog/search.ts`のsearchTextを受ける形になっていること。

- [ ] **Step 8: commit**

```bash
git add lib/catalog/search.ts lib/viewModels lib/useCaseFilters.ts lib/articleFilters.ts lib/articlePlacements.ts components/UseCasesBrowser.tsx components/ReportsBrowser.tsx components/UseCaseCard.tsx components/NewsCard.tsx components/NewsFeatureCard.tsx components/NewsHeroCarousel.tsx src/app/use-cases/page.tsx src/app/reports/page.tsx tests/unit/view-models
git commit -m "refactor: send catalog view models to reports and use cases"
```

---

### Task 7: Compareをview modelと責務別componentへ分割する

**Files:**
- Create: `lib/viewModels/compare.ts`
- Create: `lib/useMediaQuery.ts`
- Create: `components/compare/CompareMenu.tsx`
- Create: `components/compare/CompareSheet.tsx`
- Create: `components/compare/CompareViewToggle.tsx`
- Create: `tests/unit/view-models/compare.test.ts`
- Modify: `components/CompareClient.tsx`
- Modify: `components/ComparisonRobotPanel.tsx`
- Modify: `components/FavoriteCard.tsx`
- Modify: `components/compare/CompareParts.tsx`
- Modify: `src/app/compare/page.tsx`

**Interfaces:**
- Produces: `CompareRobotViewModel[]`
- `CompareClient`: URL/favorite state coordinator
- `CompareMenu`: search/selection
- `CompareSheet`: order/DnD/visual-spec rendering

- [ ] **Step 1: Compare VMを定義する**

```ts
// lib/viewModels/compare.ts
import type { ComparisonSpecGroup } from '@/lib/robotDisplay';
import type { CatalogImage, CatalogLogo } from './shared';

export interface CompareRobotViewModel {
  id: string;
  href: string;
  name: string;
  manufacturer: CatalogLogo & { id: string; name: string };
  image?: CatalogImage;
  searchText: string;
  specGroups: ComparisonSpecGroup[];
  comparison: {
    strengths: string[];
    constraints: string[];
    bestFit: string[];
    notFit: string[];
  };
}
```

`createCompareRobotViewModels(robots, manufacturers)`は`getComparisonSpecGroups`、`getRobotPrimaryImage`、manufacturer lookupをserverで実行する。

- [ ] **Step 2: forbidden field testを書く**

```ts
it('does not serialize raw evidence or pricing records', () => {
  const json = JSON.stringify(createCompareRobotViewModels(getRobots(), getManufacturers()));
  expect(json).not.toContain('"sources"');
  expect(json).not.toContain('"fieldEvidence"');
  expect(json).not.toContain('"priceOffers"');
  expect(json).not.toContain('"usageExampleSourceUrls"');
});
```

- [ ] **Step 3: child componentsをVM入力へ変更する**

`ComparisonRobotPanel`は`robot: CompareRobotViewModel`を受け、次を置換する。

- image: `robot.image`
- link: `robot.href`
- specs: `robot.specGroups`
- manufacturer: `robot.manufacturer`
- drawer lists: `robot.comparison`

`FavoriteCard`と`MenuRobotButton`もVMだけを受ける。

- [ ] **Step 4: coordinatorを3責務へ分ける**

`CompareClient`へ残すstate:

- `searchParams`から解決したselected IDs/view
- favorites
- `menuQuery`
- child callbackでURLを更新する関数

`CompareMenu`へ移す:

- manufacturer grouping
- menu search
- flyout/open state
- mobile manufacturer select

`CompareSheet`へ移す:

- ordered IDs
- DnD sensors/overlay
- selected cards
- visual/specs layout

`CompareViewToggle`へ移す:

- visual/specs button
- toast
- `onChange(view)`

各fileを250行未満にする。共有stateは新しいcontextへ隠さず、typed propsで渡す。

- [ ] **Step 5: media query hookを追加する**

```ts
// lib/useMediaQuery.ts
'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}
```

ComparisonRobotPanelのpointer判定とNewsHeroCarouselのreduced motionにこのhookを使う。

- [ ] **Step 6: pageからVMだけを渡す**

```tsx
const items = createCompareRobotViewModels(getRobots(), getManufacturers());
return <CompareClient items={items} initialSearch={toInitialSearch({ compare, view })} />;
```

- [ ] **Step 7: testsとcompare E2Eを実行する**

既存compare操作を次で固定する。

```ts
test('compare selection, view and order survive URL navigation', async ({ page }) => {
  await page.goto('/compare');
  await page.getByRole('button', { name: /Unitree G1/ }).click();
  await expect(page).toHaveURL(/compare=/);
  await page.getByRole('button', { name: /スペック/ }).click();
  await expect(page).toHaveURL(/view=specs/);
  await page.reload();
  await expect(page.getByRole('button', { name: /ビジュアル/ })).toBeVisible();
});
```

Run:

```bash
npm run test -- tests/unit/view-models/compare.test.ts
npm run build
npm run test:e2e -- tests/e2e/compare.spec.ts
```

- [ ] **Step 8: commit**

```bash
git add lib/viewModels/compare.ts lib/useMediaQuery.ts components/CompareClient.tsx components/ComparisonRobotPanel.tsx components/FavoriteCard.tsx components/compare src/app/compare/page.tsx tests/unit/view-models/compare.test.ts tests/e2e/compare.spec.ts
git commit -m "refactor: split compare client around display view models"
```

---

### Task 8: raw propsとclient budgetをhard gate化する

**Files:**
- Create: `scripts/check-client-budgets.mjs`
- Create: `tests/unit/view-models/catalog-serialization.test.ts`
- Modify: `package.json`
- Modify: `docs/reference/refactor-baseline-2026-07-26.md`

**Interfaces:**
- Consumes: `.next/diagnostics/route-bundle-stats.json`
- Produces: `npm run check:client-budgets`

- [ ] **Step 1: aggregate serialization testを書く**

```ts
const forbiddenKeys = [
  '"sources"',
  '"fieldEvidence"',
  '"body"',
  '"manufacturerGuideContent"',
  '"usageExampleSourceUrls"',
];

for (const [name, value] of Object.entries(catalogViewModelFixtures)) {
  it(`${name} excludes raw-only fields`, () => {
    const json = JSON.stringify(value);
    forbiddenKeys.forEach((key) => expect(json).not.toContain(key));
  });
}
```

`catalogViewModelFixtures`は実dataから5 factoryの結果を作る。

key名assertionに加えて、**本文値のaggregate assertion**も置く。全collectionの本文fieldから12文字以上の実値を集め、5 factoryいずれのsearch textにも現れないことを固定する。

- robot: `description`／`summary`／`comparison.*`／`supportNote`／`safetyNote`／`vendorRiskNote`
- manufacturer: `description`／`distributorNote`／`supportNote`／`procurementNote`／`vendorRiskNote`／代理店`note`
- use-case: `overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`
- article: `whyItMatters`／`keyTakeaways`／`body`／`manufacturerGuideContent`

比較は必ず**両辺を`normalizeSearchText`で正規化**し、JSON文字列ではなくsearch text自体を対象にする（raw文字列比較は実測7.9%取りこぼす。Global Constraints「制約のゲート設計」参照）。

このassertionは人手のfield列挙に依存するため単独では不十分であり、Task 3で導入する各gate（`check:catalog-payload`のbyte budget、`check:data-boundaries`のimport禁止rule、`check:bundle-content`のrecord slugカウントとsize異常検査、`check:client-imports`の静的import graph、`check:plan-snippets`の型検査）と合わせて守る。Task 8ではこれらが`npm run check`に揃って組み込まれていることを確認する。

- [ ] **Step 2: client budget scriptを追加する**

```js
// scripts/check-client-budgets.mjs
import fs from 'node:fs';

const stats = JSON.parse(
  fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'),
);
// route固有JS（first-load chunkのうち共有フロアに含まれないもの）の上限。
// 総量ではなくroute固有を測る理由はGlobal Constraintsの「JS削減目標の再定義」を参照。
const ROUTE_SPECIFIC_MAX = 180_000;
const routes = ['/reports', '/robots', '/manufacturers', '/use-cases'];

// 共有フロアは、client componentを持たないstatic routeのchunk集合として求める。
const floor = new Set(
  stats.find((item) => item.route === '/privacy').firstLoadChunkPaths,
);

let failed = false;
for (const route of routes) {
  const entry = stats.find((item) => item.route === route);
  if (!entry) {
    console.error(`[client-budget] missing route: ${route}`);
    failed = true;
    continue;
  }
  const own = entry.firstLoadChunkPaths
    .filter((chunkPath) => !floor.has(chunkPath))
    .reduce((total, chunkPath) => total + fs.statSync(chunkPath).size, 0);
  console.log(
    `[client-budget] ${route}: route-specific=${own}/${ROUTE_SPECIFIC_MAX}` +
      ` (total=${entry.firstLoadUncompressedJsBytes})`,
  );
  if (own > ROUTE_SPECIFIC_MAX) failed = true;
}
if (failed) process.exitCode = 1;
```

上限180,000の根拠はGlobal Constraintsの「JS削減目標の再定義」を参照。総量は参考値としてlogへ出すが、gateはroute固有だけにかける。

Task 4・Task 5完了後の想定値:

| route | Task 2時点 | Task 4後 | Task 5後 | 上限 |
|---|---|---|---|---|
| `/reports` | 1,233,689 | 264,696 | 129,786 | 180,000 |
| `/robots` | 325,787 | 325,787 | 190,877 | 180,000 |
| `/use-cases` | 268,207 | 268,207 | 133,297 | 180,000 |
| `/manufacturers` | 178,411 | 178,411 | 178,411 | 180,000 |

`/robots`はTask 5後も190,877で上限をわずかに超える見込みである。Task 6・Task 7の副次的な削減で収まるかを実測し、収まらない場合は残る差分の内訳を調査してこのstepで対処する。上限そのものを緩めるのは最後の手段とし、緩める場合は`/manufacturers`の実績値を基準にした根拠を書き直す。

- [ ] **Step 3: package scriptsへ追加する**

```json
{
  "check:client-budgets": "node scripts/check-client-budgets.mjs",
  "check": "npm run validate:data && npm run check:data-boundaries && npm run check:world-map-asset && npm run typecheck && npm run lint && npm run test && npm run check:catalog-payload && npm run build && npm run check:home-payload && npm run check:bundle-content && npm run check:client-budgets && npm run test:e2e"
}
```

- [ ] **Step 4: source boundaryを検索する**

```bash
rg -n "interface (RobotsBrowser|ManufacturersBrowser|UseCasesBrowser|ReportsBrowser|CompareClient)Props" components
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\\[\\]" components
```

Expected: 2つ目の検索結果0件。

- [ ] **Step 5: full gateとafter計測を実行する**

```bash
npm run check
node scripts/check-client-budgets.mjs
```

Expected: 4routeがbudget以下、全gate exit 0。

- [ ] **Step 6: baseline文書へafter値を記録する**

routeごとにbefore、after、bytes、percentageを記録する。RSC/HTMLについてもcatalog pageの`.next/server/app/**/index.html`実測値を併記する。

- [ ] **Step 7: commit**

```bash
git add scripts/check-client-budgets.mjs tests/unit/view-models/catalog-serialization.test.ts package.json docs/reference/refactor-baseline-2026-07-26.md
git commit -m "test: enforce catalog client budgets"
```

---

## Global Constraints ⇄ Task 対応表

各制約がどのtaskのどのstepで実装・検証されるかを固定する。planを編集したら必ず併せて更新する。

**この表だけでは再発を防げない。** 対応表が追跡するのは「どのtaskが担当するか」であって「そのtaskのcode例が実型と一致するか」ではない。実際、この表を新設した改訂で`useCase.description`（存在しないfield）を含むcode例が混入した。**一次の防御はTask 3 Step 8の`check:plan-snippets`（計画書のcode blockを`tsc --noEmit`にかける）であり、この表はその補完である。**

| Global Constraint | 実装 | 検証 |
|---|---|---|
| DB query／server action／API route／async repositoryを追加しない | 全task | Task 8 Step 4のsource検索 |
| filter/share URLのparameter名と意味を維持 | Task 1 | Task 1 Step 6 E2E |
| back/forwardでfilter・compare・viewが復元 | Task 1、Task 7 | Task 1 Step 6、Task 7 Step 7 E2E |
| raw配列をcatalog client propsへ渡さない | Task 2（robots/mfr）、Task 6（use-case/report）、Task 7（compare） | Task 8 Step 4の`rg`、Phase completion |
| `sources`／`fieldEvidence`／本文／未使用mediaをVMへ含めない（**値の中身にも及ぶ**） | Task 2、Task 3 Step 1-3、Task 6 | Task 3の4層gate（下記） |
| ↳ VM factory経由の流出 | Task 3 Step 1-2 | Task 3 Step 3-4（field集合pin、payload byte budget）、正規化済み値assertion |
| ↳ import chain経由の流出 | Task 4 | Task 3 Step 5-6（import境界、bundle内容検査） |
| 現行件数ではpagination/filterをclientで完結 | Task 1、Task 6 | 既存E2E |
| filterごとのRSC再取得を廃止 | Task 1 | Task 1 Step 7の`rg` |
| card情報・link・favorite・compare・popoverを維持 | Task 2、Task 5、Task 6、Task 7 | 各taskのE2Eとscreenshot |
| route固有JSを180,000バイト以下にする | Task 4（-968,993）、Task 5（motion 4経路＋`lib/search.ts`切り出し） | Task 8の`check:client-budgets` |
| catalog検索範囲をcard表示＋facet labelに限定 | Task 3 Step 1、Task 6 Step 1 | Task 3 Step 8の`check:plan-snippets`（型検査）、Task 3 Step 9の正規化済み値assertion |
| MiniSearchを維持し索引対象だけ差し替え | Task 6 Step 5 | Task 6 Step 7の`rg`、検索E2E |
| 計画書のcode例が実型と一致する | Task 3 Step 8 | `check:plan-snippets`（`tsc --noEmit`） |

**意図的に制約違反となる期間:** Task 4完了時点で`ReportsBrowser`は生の`Article[]`をpropsで受け続ける（Task 4はimport chainを切ることだけを担当し、VM化はTask 6）。この間、制約「raw配列をcatalog client propsへ渡さない」は`/reports`について未達である。Task 3 Step 6のallowlistで明示し、Task 6完了時にallowlistを空にすることで解消を機械的に確認する。

---

## Phase completion

```bash
npm run check
rg -n "useUrlParamUpdater" components lib
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\\[\\]" components
rg -n "from '@/lib/search'" components lib/viewModels lib/catalog
# Task 5で除去したmotion経路が戻っていないこと（4 route分すべて）
rg -n "motion/react|useTiltCardEffect" \
  components/ui/AnimatedTooltip.tsx components/PageTabBar.tsx \
  components/RobotCard.tsx components/ManufacturerCard.tsx components/UseCaseCard.tsx \
  components/NewsHeroCarousel.tsx components/ui/card-hover-effect.tsx \
  components/uilayouts/carousel.tsx components/ReportsHeader.tsx
```

Expected: すべて0件。

bundle内容とimport graphは`npm run check`の`check:bundle-content`／`check:client-imports`が見る。**両scriptのallowlistが空であること**を確認する（空でなければ、どのtaskで解消予定か記録が残っているはずである）。

`npm run check`のpipelineに次の3つが揃っていることを確認する。**それぞれ別の経路を測っており、1つでも欠けると本phaseの制約を守れない。**

| gate | 導入 | 測る対象 | 検知できない経路 |
|---|---|---|---|
| `check:catalog-payload` | Task 3 | VM factoryの出力（RSC payloadへ載る量） | import chain経由でbundleへ入る生data |
| `check:bundle-content` | Task 3 | client chunkの中身（生dataのmarker） | VM経由で連結された本文 |
| `check:client-budgets` | Task 8 | route固有JSのバイト数 | RSC payloadの肥大 |

さらにGlobal Constraints ⇄ Task 対応表を1行ずつ確認し、各制約に実装taskと検証手段が両方存在することを確かめる。

**route固有JSの最終確認:**

```bash
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), String(own).padStart(9), own<=180000?'OK':'OVER');
}"
```
