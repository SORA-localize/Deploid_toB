---
status: plan
updated: 2026-08-01
snippetCheck: true
---

# Phase 5 Client Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** catalog一覧・比較画面へraw domain recordを渡す構造をやめ、server側で生成した表示用view modelだけをclientへ渡す。併せて、実測で判明したclient bundleへの生data流出と重量依存を除去する。

**Architecture:** server pageがdisplay/filter用view modelを生成し、client browserは小さいserializable objectだけを受け取る。現行件数ではclient filterを維持し、URL同期はHistory API + `useSyncExternalStore`で完結させる。catalog cardのmotion依存を外し、favorite・popover・carousel・DnDだけをclient interactionとして残す。

**Tech Stack:** React 19、Next.js App Router（PPR / Cache Components）、History API、TypeScript、Vitest/Testing Library、Playwright

---

## この計画の書き直しについて（2026-08-01）

初版は**実測せずに書かれていた**。その結果、4巡の外部レビューで次が判明した。

| 初版の前提 | 実測結果 |
|---|---|
| 「first-load JS総量を30%削減」は達成可能 | 総量の64%は全route共通の共有フロア。`/use-cases`はroute固有JSを11,490バイトに収めろという要求になっていた |
| `/reports`が重い理由は不明 | client componentのimport chain経由で**生dataset 968,993バイト**が全userへ配信されていた |
| MiniSearchは80KB | 実chunk 18,690バイト（80KBは`node_modules`のソースサイズ） |
| motionは`PageTabBar`だけ | route別に4経路。`/use-cases`は`PageTabBar`を経由しない |
| `lib/search.ts`は`/robots`だけ | catalog 5 route**すべて**に載っている |
| field名markerで流出を検知できる | 10 chunkにhit、8件は誤検知 |

**この計画は実測値から書き直したものである。** taskは推定インパクト順ではなく**実測インパクト順**に並べ、各taskの完了条件を測定コマンドで表現する。

初版が3巡連続で起こした故障モードは「散文で決めたことがcode例・step・表のどれかに反映されない」だった。対策は`scripts/check-plan-snippets.mjs`（Task 2）で、この計画書の`ts`/`tsx` blockを`tsc --noEmit`にかける。目視確認では防げないことが実証済みである。

### 5巡目の修正（2026-08-02）

書き直し版に対し、**gate scriptを実際に走らせる**観点で監査した。7件を修正した。計画の事実関係（実測baseline、file:line参照、field名、label map名）は再検証して**すべて正確**だった。

| # | 問題 | 修正 |
|---|---|---|
| 1 | Task 2・6のgate scriptが`lib/data.ts`／`lib/viewModels/*.ts`をimportしており、Nodeがmodule解決できず**起動しない**（実測確認） | bundle-content gateは`data/*.ts`を直読み。payload budgetはvitest testへ移した |
| 2 | Task 1がsignatureを変える`getArticleIndexPlacementReports`の**第2の呼び出し元`src/app/page.tsx:99`が計画に無い** | Filesとstepとcommitへ追加。`lib/display.ts`も抜けていたので追加 |
| 3 | `check:plan-snippets`が`docs/plans/*.md`を全走査し、**無関係な8文書・87 blockを巻き込む** | front-matter `snippetCheck: true`のopt-in方式へ |
| 4 | `tsconfig.plan-snippets.json`が`include`を置き換えるため`next-env.d.ts`が外れ、**既存ファイルが誤って落ちる**（実測） | `include`に`next-env.d.ts`、`types: ["node"]`を追加。9 snippetが通ることを実測確認 |
| 5 | Task 4のdot indicatorがgapを定数計算しており、**唯一の呼び出し元が`gap-1.5`で上書きしているためズレる** | offsetをDOM（`offsetLeft`／`offsetTop`）から測る方式へ |
| 6 | `check-client-import-graph.mjs`が拡張子付きspecifier（repo内に55箇所）を**黙って辿らない**。再exportも追わない | 末尾`.ts`を落としてから解決。判定を解決後パスへ。再export・副作用importも辺に含め、未解決specifierは失敗させる |
| 7 | plan-snippets gateの実効カバレッジが不明瞭 | Task 2直後は34 block中9個だけであることと、gateの本体が「各taskでmarkerを外す手順」であることを明記 |

**外部レビューで追加された4件（同日）。** 上の7件は内部監査で潰したもので、次の3件は5巡目の外部レビューが見つけたものである。**「計画の事実関係はすべて正確だった」という内部監査の結論は誤りだった。**

| # | 問題 | 修正 |
|---|---|---|
| 8 | 実測baseline節が「**Task 1・Task 2は実装済み**」と書いており、旧task番号が残っていた。この計画のTask 1・2は未着手であり、**baseline表の直前で自己矛盾していた**（3巡連続で出た内部整合の故障モードそのもの） | 「旧計画のTask 1・2」と明示し、番号が対応しないこと・本計画は全task未着手であることを追記。`### Task 2の実装状況`の見出しも`### f42ecbfの実装状況`へ |
| 9 | route固有chunkの内訳表が**削減対象しか載せておらず、残りを説明していなかった**（`/robots` 99,454、`/manufacturers` 107,532が未帰属）。budgetの可否を判定できない | 「どのtaskも触らないchunk（残存フロア）」節を追加。中身をminified識別子から同定 |
| 10 | budgetで**本当に詰まるのは`/robots`**（motion全除去でも190,877で超過）なのに、計画は最も余裕のある`/reports`を軸に書かれていた | 「budgetが本当に詰まるrouteは`/robots`である」節を追加。保守的見積もりでも160,750で成立することと、その達成が`lib/search.ts`除去に全面依存することを明記 |
| 11 | 「RSC payloadは静的成果物に現れない」というgate設計の前提が**どこにも書かれておらず、理由も`PPRのため`と誤認していた**（実際は`searchParams`のdynamic boundaryのため。同じPPR設定でもHomeとdetail routeには現れる） | Task 2の流出経路表の下に実測付きで根拠を追記。前提が依存する2条件（catalog routeがdynamicであること、`'use cache'`境界がmaterializeしないこと）も明記 |

---

## 実測baseline（2026-08-01、branch `refactor/05-client-boundaries` HEAD `020f2ca`）

**旧計画**のTask 1・2（commit `611b5a7` / `918f058` / `f42ecbf`）まで実装済みの状態での、フレッシュbuild実測値である。

> **番号は対応しない。** ここで言う「旧Task 1・2」はcatalog filterのHistory API化とRobot/Manufacturer一覧のVM化であり、**この計画書のTask 1（`/reports`の生data除去）・Task 2（gate導入）とは別物**である。本計画のTask 1〜10は**すべて未着手**である（`lib/articlePlacements.ts:3`に`localContentSnapshot` importが残存、`scripts/`に新gateが1本も無いことで確認できる）。詳細は`SESSION_HANDOFF.md` §4・§5。

### route固有JS

「route固有JS」= そのrouteのfirst-load chunkのうち、共有フロアに含まれないものの合計バイト数。
共有フロア = `/privacy`のfirst-load chunk 9本（**591,394バイト**、react-dom 226,356を含む）。`/about`、`/for-manufacturers`、`/_not-found`も同値であり、Phase 5では変更しない。

| route | first-load総量 | route固有JS |
|---|---:|---:|
| `/reports` | 1,825,083 | **1,233,689** |
| `/robots` | 917,181 | **325,787** |
| `/use-cases` | 859,601 | **268,207** |
| `/manufacturers` | 769,805 | **178,411** |

### route固有chunkの内訳（削減対象）

| バイト | 中身 | 載っているroute | 担当task |
|---:|---|---|---|
| 968,993 | 生dataset（`fieldEvidence`×60、`vendorRiskNote`×26、record slug 133件全部） | `/reports` | Task 1 |
| 134,910 | `motion/react`（`0p8sjtw7eybcn.js`） | `/robots`、`/reports` | Task 3・4 |
| 134,910 | `motion/react`（`1mbvphip_2888.js`。上とmd5不一致の別copy） | `/use-cases` | Task 3 |
| 53,958 | `lib/search.ts` + `lib/tags` + `lib/labels`（`02r_vm-d2k0jh.js`） | `/robots` | Task 5・6 |
| 39,249 | 同上（`3u6ssx-c-te-r.js`） | `/reports` | Task 5・8 |
| 36,038 | 同上 + `useTiltCardEffect`（`2xct9rviqvmx5.js`） | `/use-cases` | Task 3・5・7 |
| 33,414 | 同上（`2amlnznk5pu5d.js`） | `/manufacturers` | Task 5・6 |
| 18,690 | MiniSearch（`0ugbjz6g929ty.js`） | `/use-cases`、`/reports` | **削除しない**（後述） |
| 37,465 | `lib/uiText.ts`（`2cf5hudnrg616.js`） | catalog 8 route共有 | 対象外 |

`lib/search.ts`のchunkはroute間で30,127〜53,958とばらつく。chunkはmoduleと1:1ではなく、周辺moduleが同居しているためである。**したがって「chunkサイズ＝そのmoduleの削減量」ではない。** `lib/search.ts`本体の削減量は5 routeで共通に現れる下限（`/compare`の30,127）を上回らないと見るのが安全で、各taskでは差分を必ず実測する。

### どのtaskも触らないchunk（残存フロア）

上の表は削減対象しか載せておらず、**route固有JSの残りを説明していなかった**。budgetの可否はこの残りで決まるため明示する。中身はminified chunk内の識別子から同定した。

| バイト | 中身（同定根拠） | 載っているroute |
|---:|---|---|
| 56,917 | Radix/shadcn UI primitives（`data-slot`、`aria-expanded`） | `/robots`、`/manufacturers` |
| 41,104 | floating-ui（`referenceHidden`。popover配置） | `/robots`、`/use-cases`、`/manufacturers` |
| 32,096 | `embla-carousel`（`/reports` hero。**Task 4はmotionだけを外し、emblaは残す**） | `/reports` |
| 9,511 / 2,286 / 1,433 | route entry等の小chunk | 各1 route |

route別の残存フロア（`lib/uiText.ts` 37,465を含む、MiniSearchを除く）:

| route | 残存フロア | 内訳 |
|---|---:|---|
| `/manufacturers` | 144,997 | 56,917 + 41,104 + 9,511 + 37,465 |
| `/robots` | **136,919** | 56,917 + 41,104 + 1,433 + 37,465 |
| `/use-cases` | 97,259 | 41,104 + 37,465 + MiniSearch 18,690 |
| `/reports` | 90,537 | 32,096 + 2,286 + 37,465 + MiniSearch 18,690 |

### budgetが本当に詰まるrouteは`/robots`である

`/reports`は削減幅が最大だが、**budgetに対しては最も余裕がある**。逆に`/robots`は最大のtask（motion除去）を完了してもまだ超過する。

| route | Task 1後 | motion除去後 | 判定 |
|---|---:|---:|---|
| `/reports` | 264,696 | **129,786** | Task 4時点で既に ≤180,000 |
| `/use-cases` | 268,207 | 133,297 | Task 3時点で ≤180,000 |
| `/manufacturers` | 178,411 | 178,411（motion無し） | motionでは動かない。`lib/search.ts`分で下がる |
| `/robots` | 325,787 | **190,877** | **超過。`lib/search.ts`の削減に依存する** |

`/robots`が180,000を切れるかは`lib/search.ts`系chunk（53,958）がどれだけ落ちるかで決まる。上で「削減量は`/compare`の30,127を上回らないと見るのが安全」と書いた保守的な見積もりでも **190,877 − 30,127 = 160,750 ≤ 180,000** で成立し、全量落ちれば残存フロアの136,919まで下がる。**したがってGlobal Constraint 5は保守側の見積もりでも達成可能**だが、**その達成はTask 5〜8で`lib/search.ts`のclient到達を0にすることに全面的に依存している**。Task 3・4だけでは`/robots`は満たせない。

Task 8 Step 6で4 routeを一括判定するのはこの理由による。Task 3・4の完了時点で`/robots`が超過していても、それは想定内であり計画の失敗ではない。

Task 10で上限を「実測最大値 + 15%」へ締め直すとき、**最大値を出すのは`/robots`（見込み136,919〜160,750）**である。

### 生data流出の経路（Task 1）

```
components/ReportsBrowser.tsx ('use client')
  → lib/articlePlacements.ts:3   import { localContentSnapshot }
    → lib/data/localContentSnapshot.ts   ← robots / manufacturers / articles / useCases / deployments 全部
```

`data/articlePlacements.ts`自体は1,684バイトだが、`localContentSnapshot`経由で`data/*.ts`（836,534バイト）全体が引き込まれている。`/reports`のroute固有JSの**79%**。

### motion経路（Task 3・4）

値レベルのimportを辿った実測結果。**単一経路ではない。**

| route | 経路 |
|---|---|
| `/robots` | `RobotsBrowser` → `PageTabBar:4` → `ui/AnimatedTooltip:4`（`AnimatePresence, motion, useReducedMotion`） |
| `/use-cases` | `UseCasesBrowser` → `UseCaseCard:4`（`motion`）、`UseCaseCard:10` → `lib/useTiltCardEffect` |
| `/reports` | ① `ReportsBrowser` → `ReportsHeader` → `PageTabBar` → `ui/AnimatedTooltip`<br>② `ReportsBrowser` → `NewsHeroCarousel:21`（`useReducedMotion`のみ）<br>③ `NewsHeroCarousel` → `uilayouts/carousel:9`（`AnimatePresence, motion`）<br>④ `ReportsBrowser:13` → `ui/card-hover-effect:4`（`AnimatePresence, motion`） |
| `/manufacturers` | なし |

`uilayouts/carousel.tsx`は646行あるが、motionを使うのは`SliderSnapDisplay`（L465-505、**利用者0の死んだexport**）と`SliderDotButton`（L506-557、`layoutId`によるactive dotのスライド）の2箇所だけである。autoplay・swipe・keyboardは`embla-carousel`が担っておりmotionに依存しない。

### `lib/search.ts`のclient側到達経路（Task 5・6・7・8）

`import type`を除いた値importだけを辿った結果。

| 経路 | 使っているexport | 担当task |
|---|---|---|
| `components/RobotsBrowser.tsx:20` | `normalizeSearchText` | Task 5 |
| `components/CompareClient.tsx:41` | `normalizeSearchText` | Task 5 |
| `lib/robotFilters.ts:6` / `lib/manufacturerFilters.ts:5` → `lib/viewModels/shared.ts:3` | `normalizeSearchText` | Task 5 |
| `components/UseCasesBrowser.tsx` → `lib/useCaseFilters.ts:2` | `createUseCaseSearchDocument`, `matchesSearchDocument` | Task 7 |
| `components/{UseCases,Reports}Browser.tsx` → `lib/searchIndex.ts:3` | `createUseCaseSearchDocument`, `createReportSearchDocument` | Task 7・8 |
| `lib/viewModels/robots.ts:5` / `manufacturers.ts:9`（server専用） | `createRobotSearchDocument`, `createManufacturerSearchDocument` | Task 6 |

全taskの完了後、`lib/search.ts`の利用者は0になる。Task 10で削除する。

### `f42ecbf`の実装状況（実測との差分）

`f42ecbf`（**旧**計画のTask 2）は`lib/viewModels/{shared,logo,robots,manufacturers}.ts`を作り、`RobotCard`／`ManufacturerCard`のmotionを外し、page側でVMを生成する所までを実装した。**次は未実装である。**

- `lib/catalog/search.ts` — **存在しない**（`lib/catalog/`は`urlSearch.ts`と`urlState.ts`のみ）
- catalog payload budget（`tests/unit/view-models/catalog-payload.test.ts`）— 存在しない
- `scripts/check-data-import-boundaries.mjs`の`lib/viewModels/**`ルール — 未追加
- catalog searchTextのwhitelist化 — 未実装。`lib/viewModels/robots.ts:73`は現在も`createCatalogSearchText(createRobotSearchDocument(robot, manufacturer))`であり、`description`／`comparison.*`／各Noteの本文が`searchText`へ連結されてclientへ渡っている

したがって**Global Constraint「本文をVMへ含めない」は現在も未達**である。Task 6が担当する。

---

## Global Constraints

数値で書けるものは数値で書く。「禁止事項」だけで書くと違反の大小が区別できず、13KBの違反と969KBの違反へ同じ労力を割くことになる（初版で実際に起きた）。

1. DB query、server action、API route、async repositoryを追加しない。
2. filter/share URLのparameter名と意味を維持する。browser back/forwardでfilter・compare選択・viewが復元される。
3. raw `Robot`／`Manufacturer`／`UseCase`／`Article`配列をcatalog client propsへ渡さない。
4. `sources`、`fieldEvidence`、本文、未使用mediaをcatalog view modelへ含めない。**この制約はkey名だけでなく値の中身にも及ぶ**（連結済みsearch textとして同じ文字列を送るのも違反）。
5. **route固有JS ≤ 180,000バイト**（`/reports`、`/robots`、`/manufacturers`、`/use-cases`）。共有フロア591,394はPhase 5の対象外。
6. **client chunk 1本あたり record slug < 5件**、かつ**単一chunk ≤ 340,000バイト**。
7. **catalog view modelのJSONサイズ**（`Buffer.byteLength`）を collection ごとにgateする。上限はTask 6で実測してから確定する。
8. `router.push`／`router.replace`によるfilterごとのRSC再取得を廃止する。
9. cardの情報、link、favorite、compare、popover機能を維持する。
10. 現行件数ではpagination/filterをclientで完結する。**300件を超えたら本phaseのarchitectureを再検討する**（client filterの前提が崩れる件数）。

### 上限180,000の根拠と限界

`/manufacturers`の現在値178,411を基準にした。ただし**この値には削減対象が33,414バイト（`lib/search.ts`）含まれている**ため、「同じ手法を適用すれば到達可能」という以上の意味はない。Task 5完了後に`/manufacturers`は約145,000へ下がる見込みである。

Task 10で4 routeの実測値を取り直し、**最大値 + 15%**へ締め直す。誰も近づかない上限はgateとして働かない。

**ただし基準にすべきrouteは`/manufacturers`ではなく`/robots`である。** 上の「budgetが本当に詰まるrouteは`/robots`である」を参照。`/manufacturers`の残存フロア144,997に対し`/robots`は136,919で、削減後の最大値を出すのは`/robots`側になる見込み（`lib/search.ts`の落ち方次第で136,919〜160,750）。

### baselineの扱い

Phase 1 baseline（`docs/reference/refactor-baseline-2026-07-26.md`）は相対削減率の判定に使わない。理由は2つ。

- 測定条件が現行buildと同一である保証がない。特に`/reports`は当時1,121,603バイト（route固有 530,706）と記録されているが、`ReportsBrowser → articlePlacements → localContentSnapshot`のimport chainは当時から存在しており、968,993バイトのchunkが入る余地がない。数値が信用できない。
- 一方で共有フロアは590,897 → 591,394（+0.08%）でほぼ一致しており、framework層の測定条件は比較可能である。

したがって**絶対値だけをgateとし、総量は参考値として記録する**。

---

## 実装しないこと

計画外の膨張を止めるため明示する。

- **共有フロア591,394の削減。** react-dom 226,356を含み、Phase 5の責務外。ただしTask 10で後続phase向けに1点だけ記録する（後述）。
- **MiniSearchの廃止。** 削減効果は実測18,690バイトにすぎず、`/reports`の生data 968,993や motion 134,910と2桁違う。日本語検索品質（`fuzzy: 0.2`のタイポ許容、`Intl.Segmenter('ja')`の語境界分割）を落とす対価に見合わない。**索引する文字列だけをcatalog searchTextへ差し替え、index optionは一切変更しない**（Task 7・8）。
- **本文全文検索の代替実装。** Task 6でcatalog検索範囲が狭まるが、代替（build時生成の静的JSONを`public/`へ置きfetchする方式）は後続phaseの独立taskとして起票する。
- **`searchText`の重複排除（`searchExtra`方式）。** 差分の約4,300字はRSC payloadでありroute固有JS 180,000には1バイトも寄与しない。かつMiniSearchが1文書1テキストを要求するため、4 collectionで2方式を併存させることになる。**4 collectionすべてで明示的な`searchText`を維持する。**
- **`/compare`のroute固有JS上限。** Global Constraint 5の対象は4 catalog routeのみ。`/compare`はview model化（Task 9）の対象だが、バイト上限は課さない。
- **detail route（`/robots/[slug]`等）のリファクタ。** `ManufacturerLogoName`の既存`logo`/`logos` propsはdetail page向けに維持する。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `lib/catalog/search.ts` | collectionごとのcatalog searchText生成（対象fieldをここで明示列挙する）と部分一致判定 |
| `lib/normalizeSearchText.ts` | `normalizeSearchText`だけを持つ最小module（client graphへ`lib/search.ts`全体を持ち込まないため） |
| `lib/useMediaQuery.ts` | motion package不要のmedia query hook |
| `lib/viewModels/useCases.ts` | use-case list VM |
| `lib/viewModels/articles.ts` | report list/hero VM |
| `lib/viewModels/compare.ts` | compare VM |
| `components/compare/CompareMenu.tsx` | selection menu |
| `components/compare/CompareSheet.tsx` | comparison cards/table |
| `components/compare/CompareViewToggle.tsx` | view state |
| `scripts/check-client-bundle-content.mjs` | client chunkのrecord slug数とchunkサイズをgate |
| `scripts/check-client-import-graph.mjs` | `'use client'` moduleから`data/**`へ到達しないことをgate |
| `scripts/check-plan-snippets.mjs` | 計画書の`ts`/`tsx` blockを`tsc --noEmit`にかける |
| `scripts/check-client-budgets.mjs` | route固有JSのバイト数をgate |
| `tests/unit/view-models/catalog-payload.test.ts` | catalog VMのJSONバイト数をgate（**scriptではなくvitest**。理由はTask 6 Step 6） |
| `tests/unit/view-models/use-cases.test.ts` | serialization/filter contract |
| `tests/unit/view-models/articles.test.ts` | serialization/filter contract |
| `tests/unit/view-models/compare.test.ts` | serialization contract |

### 変更

| Path | Responsibility |
|---|---|
| `lib/articlePlacements.ts` | `localContentSnapshot` importを外しserver引数化 |
| `lib/search.ts` | `normalizeSearchText`を新moduleへ移しre-export。Task 10で削除 |
| `lib/searchIndex.ts` | catalog searchTextを索引する（MiniSearch本体は維持） |
| `lib/viewModels/shared.ts` | `lib/search.ts`依存を外す |
| `lib/viewModels/robots.ts` / `manufacturers.ts` | whitelist searchTextへ差し替え |
| `lib/useCaseFilters.ts` / `lib/articleFilters.ts` | VM入力へ変更 |
| `components/ui/AnimatedTooltip.tsx` | motion → CSS transition |
| `components/UseCaseCard.tsx` | UseCase VM props、motion/tilt削除 |
| `components/ui/card-hover-effect.tsx` | motion → CSS transition |
| `components/uilayouts/carousel.tsx` | `SliderDotButton`をCSS化、死んだ`SliderSnapDisplay`を削除 |
| `components/NewsHeroCarousel.tsx` | Article VM props、`useReducedMotion` → `useMediaQuery` |
| `components/{UseCases,Reports}Browser.tsx` | VM props |
| `components/{NewsCard,NewsFeatureCard}.tsx` | Article VM props |
| `components/CompareClient.tsx` | coordinatorへ縮小 |
| `components/ComparisonRobotPanel.tsx` / `FavoriteCard.tsx` | Compare VM props |
| `src/app/{reports,use-cases,compare}/page.tsx` | server VM生成 |
| `scripts/check-data-import-boundaries.mjs` | `lib/search.ts`のimport境界ruleを追加 |
| `package.json` | 新gateを`check` pipelineへ配線 |
| `docs/reference/refactor-baseline-2026-07-26.md` | Phase 5 after値を追記 |
| `docs/README.md` | 「いま動いているもの」表（phase完了時に更新） |

### 削除

| Path | 理由 |
|---|---|
| `lib/search.ts` | Task 10。全taskの完了後に利用者0になる |

> **`lib/useTiltCardEffect.ts`は削除しない。** Task 3で`UseCaseCard`からの利用は消えるが、`components/FeaturedRobotCard.tsx:10`（Home）が使い続ける。HomeはPhase 4完了済みで本phaseの対象外である。

---

## 順序制約

- Task 1 → Task 2: gateは違反が0になってから入れる。赤いgateやallowlistを持ち込まない。allowlistはentry追加のハードルが担保できず、chunk名がbuildごとに変わるためgate対象と対応も取れない。
- Task 5 → Task 6: `lib/catalog/search.ts`は`normalizeSearchText`を新moduleから取る。Task 5が先。
- Task 3・4 → Task 7・8: `UseCaseCard`／`NewsHeroCarousel`はmotion除去（Task 3・4）とVM化（Task 7・8）で2回触る。挙動変更と構造変更を同じcommitに混ぜないため分ける。
- Task 3 → Task 4: どちらも`components/NewsHeroCarousel.tsx`周辺に触れる。Task 3を完了させてからTask 4に入る。
- Task 6・7・8・9 → Task 10: `lib/search.ts`の削除は全利用者が消えてから。

---

### Task 1: `/reports`の生data流出を止める

**Goal:** `components/ReportsBrowser.tsx`（`'use client'`）から`lib/data/localContentSnapshot`へ至るimport chainを切り、968,993バイトのclient chunkを除去する。**Phase 5で最大の削減であり、かつGlobal Constraint 3・4の違反そのもの。**

**問題:** `lib/articlePlacements.ts:3`が`localContentSnapshot`をmodule scopeでimportしているため、この関数をimportするだけで`data/*.ts`全体（836,534バイト）がclient bundleへ入る。

**Files:**
- Modify: `lib/articlePlacements.ts`
- Modify: `lib/display.ts`（`byArticlePublishedDesc`の引数型を広げる。Step 2）
- Modify: `components/ReportsBrowser.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/page.tsx`（**Home。`getArticleIndexPlacementReports`の第2の呼び出し元**）

> **Homeも触る。** `src/app/page.tsx:99`が`getArticleIndexPlacementReports(getArticles())`を呼んでいる。signatureを変える以上、Phase 4完了済みでも合わせないとtypecheckが落ちる。**変更はcall siteの引数だけ**で、Homeの描画・placement解決結果は変わらない。

**Interfaces:**
- Produces: `getArticleIndexPlacementReports({ articles, placements, limits }): { heroReports: T[]; featureReports: T[] }`
- Removes: `lib/articlePlacements.ts`からの`localContentSnapshot` import

- [ ] **Step 1: 現状を実測して記録する**

```bash
npm run build
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
const e=s.find(x=>x.route==='/reports');
for(const p of e.firstLoadChunkPaths.filter(p=>!floor.has(p))) console.log(fs.statSync(p).size, p);
"
```

Expected: 968,993バイトのchunkが1本出る。この出力をcommit messageへ残す。

- [ ] **Step 2: `lib/articlePlacements.ts`をserver引数化する**

`localContentSnapshot`のimportを削除し、`articlePlacements`と`articleIndexPlacementLimits`を引数で受ける。`Article`固有の型ではなく`{ id: string; publishedAt: string }`で受けることで、Task 8のVM化後もsignatureを変えずに済む。

```ts
// lib/articlePlacements.ts
import type { ArticlePlacement, ArticlePlacementSlot } from '@/data/types';
import { byArticlePublishedDesc } from '@/lib/display';

const reportsIndexSurface = 'reports-index';

interface PlacementInput<T> {
  articles: readonly T[];
  placements: readonly ArticlePlacement[];
  limits: Readonly<Record<ArticlePlacementSlot, number>>;
}

export function getArticleIndexPlacementReports<T extends { id: string; publishedAt: string }>({
  articles,
  placements,
  limits,
}: PlacementInput<T>): { heroReports: T[]; featureReports: T[] } {
  const sortedArticles = [...articles].sort(byArticlePublishedDesc);
  const articlesById = new Map(articles.map((article) => [article.id, article]));
  const usedIds = new Set<string>();

  const resolveSlot = (slot: ArticlePlacementSlot): T[] => {
    const limit = limits[slot];
    const slotArticles: T[] = [];

    placements
      .filter((placement) => placement.surface === reportsIndexSurface && placement.slot === slot)
      .sort((a, b) => a.order - b.order)
      .forEach((placement) => {
        if (slotArticles.length >= limit || usedIds.has(placement.articleId)) return;
        const article = articlesById.get(placement.articleId);
        if (!article) return;
        slotArticles.push(article);
        usedIds.add(article.id);
      });

    for (const article of sortedArticles) {
      if (slotArticles.length >= limit) break;
      if (usedIds.has(article.id)) continue;
      slotArticles.push(article);
      usedIds.add(article.id);
    }

    return slotArticles;
  };

  return { heroReports: resolveSlot('hero'), featureReports: resolveSlot('feature') };
}
```

`byArticlePublishedDesc`（`lib/display.ts:237`）は現在`(a: Article, b: Article)`を要求しており、上のgenericでは型が合わない。**引数型を`{ publishedAt: string }`へ広げる。**

```ts
// lib/display.ts:237
export const byArticlePublishedDesc = (
  a: { publishedAt: string },
  b: { publishedAt: string },
) => b.publishedAt.localeCompare(a.publishedAt);
```

`Article`は`publishedAt: ISODate`（`= string`）を持つため、既存の利用側は変わらない。

- [ ] **Step 3: page側でplacementを解決する（`/reports`とHomeの2箇所）**

```tsx
// src/app/reports/page.tsx（ReportsContentのみ抜粋）
// @plan-check-skip: 既存importと関数外の文脈を省いた抜粋のため単体compileできない
async function ReportsContent({ searchParams }: { searchParams: RouteSearchParams }) {
  const reports = getArticles();
  const params = await pickSearchParams(searchParams, ['kind', 'q', ARTICLE_PAGE_PARAM]);
  const { heroReports, featureReports } = getArticleIndexPlacementReports({
    articles: reports,
    placements: localContentSnapshot.articlePlacements,
    limits: localContentSnapshot.articleIndexPlacementLimits,
  });

  return (
    <ReportsBrowser
      reports={reports}
      heroReports={heroReports}
      featureReports={featureReports}
      initialSearch={toInitialSearch(params)}
    />
  );
}
```

追加するimport:

```ts
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';
import { localContentSnapshot } from '@/lib/data/localContentSnapshot';
```

**同じ差し替えを`src/app/page.tsx:99`（Home）にも行う。** Homeはserver componentなのでbundleへの影響はないが、signature変更に追随しないとtypecheckが落ちる。

```tsx
// src/app/page.tsx（呼び出し1行の差し替えのみ）
// @plan-check-skip: 既存importと関数外の文脈を省いた抜粋
const { heroReports, featureReports } = getArticleIndexPlacementReports({
  articles: getArticles(),
  placements: localContentSnapshot.articlePlacements,
  limits: localContentSnapshot.articleIndexPlacementLimits,
});
```

Homeにも`localContentSnapshot`のimportを追加する。**Home側の出力（hero/featureに選ばれる記事とその順序）は変わらない**ことをStep 6で確認する。

- [ ] **Step 4: `ReportsBrowser`をprops受けに変える**

`components/ReportsBrowser.tsx`から次を削除する。

```ts
// @plan-check-skip: 削除対象の既存コード片
import { getArticleIndexPlacementReports } from '@/lib/articlePlacements';

const { heroReports, featureReports } = useMemo(
  () => getArticleIndexPlacementReports(sorted),
  [sorted],
);
```

props型へ追加する。`Article[]`のままでよい（VM化はTask 8が担当。ここではimport chainを切ることだけを行う）。

```ts
// @plan-check-skip: Article は既存importに依存する抜粋
interface ReportsBrowserProps {
  reports: Article[];
  heroReports: Article[];
  featureReports: Article[];
  initialSearch: string;
}
```

`sorted`（`useMemo`で`reports`をsortしたもの）はgrid/tab集計に使うため残す。

- [ ] **Step 5: gateを実測する**

```bash
npm run build
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
const e=s.find(x=>x.route==='/reports');
const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
console.log('/reports route-specific =', own);
"
rg -l 'fieldEvidence|vendorRiskNote' .next/static/chunks/
```

**完了条件:** `/reports`のroute固有JSが 1,233,689 → 約 264,696 になり、`rg`が0件を返す。

- [ ] **Step 6: 回帰確認**

```bash
npm run test
npm run test:e2e -- tests/e2e/public-routes.spec.ts
```

手動: `/reports`のhero carousel、feature card、shelf tab、pagination、検索が現行と同じ並びで表示されること。特に**hero/featureに出る記事のidと順序が変わっていないこと**を変更前後で比較し、記録する（Task 8の完了確認で再度使う）。

**Home（`/`）も同じ観点で確認する。** 同じ関数の呼び出し元であり、引数化で挙動が変わっていないことを保証する必要がある。hero/featureに出る記事のidと順序を変更前後で比較する。

- [ ] **Step 7: commit**

```bash
git add lib/articlePlacements.ts lib/display.ts components/ReportsBrowser.tsx \
  src/app/reports/page.tsx src/app/page.tsx
git commit -m "perf: stop shipping the local content snapshot to the reports client"
```

---

### Task 2: bundle流出gateと計画書の型検査を導入する

**Goal:** Task 1で違反が0になった状態でgateを入れる。以降の全taskがこれに守られる。

**問題:** Phase 5最大の違反（Task 1の968,993バイト）は、view model factoryを一切経由していなかった。VM側の検証だけではbundle側が無防備になる。流出には独立した2経路がある。

| 経路 | 例 | 載る場所 | gate |
|---|---|---|---|
| A. VM factory経由 | 本文を連結した`searchText`をpropsで渡す | RSC flight payload | Task 6（`tests/unit/view-models/catalog-payload.test.ts`＋値assertion） |
| B. import chain経由 | client componentが`localContentSnapshot`をimportする | JS chunk | **本task** |

**経路AをVM factoryの出力で測る（＝build成果物から測らない）根拠。** catalog 4 routeは`searchParams`を`await`するdynamic boundaryを持つため、RSC payloadはprerendered shellにも`*.segment.rsc`にも現れない。実測:

```
$ grep -c "unitree-g1" .next/server/app/robots.html
0
$ grep -rl "unitree-g1" .next/server/app --include="*.html"
.next/server/app/index.html
.next/server/app/manufacturers/unitree.html
.next/server/app/robots/unitree-g1-edu.html   ← Home と detail には現れる
```

**「PPRだから現れない」のではない。** 同じPPR（`cacheComponents: true`）設定下でもHomeとdetail routeの静的出力にはrecord dataが入っている。dynamic boundaryの有無が効いている。

したがってRSC payloadを静的成果物から測るgateは書けず、**VM factoryの戻り値を直接測るしかない**（Task 6のvitest budget）。

**この前提は2つの条件に依存する。崩れたらgate構成を見直す。**

1. catalog routeがdynamicであり続けること。将来`searchParams`をやめて全静的化すると、RSC payloadが静的出力へ現れるようになる（そのときは静的成果物側のgateを足せる）。
2. `src/app/robots/page.tsx:53`と`src/app/use-cases/page.tsx:75`の`'use cache'`境界の出力がmaterializeしないこと。現ビルドでは`.next/cache/`が生成されておらず該当しないが、**永続cache handlerを持つデプロイ環境ではこの境界にVM payloadが載りうる**。Task 6のbudgetはVM本体を測るので上限自体は有効だが、「client到達量＝VMサイズ」という等式は成り立たなくなる。

**field名markerを使わない理由（実測）:** `fieldEvidence`／`vendorRiskNote`／`usageExampleSourceUrls`を現ビルドへ当てると10 chunkにhitし、少なくとも8件は誤検知だった（`lib/uiText.ts`のUIラベルkey、`lib/search.ts`のbuilder内のproperty access）。field名の出現とrecord値の流出を区別できない。さらに3つとも`Robot`／`Manufacturer`のfieldであり、`data/articles.ts`（228,785）や`data/useCases.ts`（177,085）が単独で漏れても検知できない。

**record slugカウントは実測で誤検知0だった。**

```
total slugs: 133
  968993  3r7-bj8a3uy6f.js  distinct-slugs=133
  （他のchunkはすべて0）
```

slugは全recordが`BaseRecord`から持つため、collectionが増えても自動的にcoverageへ入る。

この133は`lib/data.ts`のgetter（published のみ）で数えた値である。Step 1のscriptは`data/*.ts`を直接読むため**178件**（下書き＋`deployments`を含む）を照合する。母数が増えるだけで判定方向は変わらない。

**照合はdouble quote前提**（`"${record.slug}"`）である。現ビルドのSWC minifierはこの形で出力しており実測で機能したが、minifierがsingle quoteを吐くようになると**静かに素通りする**。gateが常に0件を返し続ける状態は「違反が無い」と「検知できていない」の区別が付かないため、Task 10 Step 1のbuildで**意図的に1 chunkへslugを混ぜて落ちることを1度だけ確認する**（確認後は戻す）。

**Files:**
- Create: `scripts/check-client-bundle-content.mjs`
- Create: `scripts/check-client-import-graph.mjs`
- Create: `scripts/check-plan-snippets.mjs`
- Create: `scripts/plan-snippet-skip-baseline.json`
- Create: `tsconfig.plan-snippets.json`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run check:bundle-content`、`npm run check:client-imports`、`npm run check:plan-snippets`

- [ ] **Step 1: bundle内容gateを書く**

`.mjs`から`.ts`を読むには`--experimental-strip-types`が要る（`scripts/validate-data.mjs`と同じ）。

**ただし`lib/data.ts`は使えない。** Nodeはtsconfigの`paths`（`@/`）も拡張子なし相対importも解決しないため、`lib/data.ts`を読むと`ERR_MODULE_NOT_FOUND`で落ちる（実測済み。`Cannot find module '.../lib/validate' imported from .../lib/data.ts`）。`scripts/validate-data.mjs`が動くのは、`lib/validate.ts`とその依存が**すべて明示的な`.ts`付き相対import**で書かれているからであって、`--experimental-strip-types`があれば何でも読めるからではない。

`data/*.ts`は依存が浅く、plain nodeで読めることを実測で確認済み。**slugの正本としてこちらを直接読む。**

```js
// scripts/check-client-bundle-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import { articles } from '../data/articles.ts';
import { deployments } from '../data/deployments.ts';
import { manufacturers } from '../data/manufacturers.ts';
import { robots } from '../data/robots.ts';
import { useCases } from '../data/useCases.ts';

const MAX_DISTINCT_SLUGS_PER_CHUNK = 5;
const MAX_CHUNK_BYTES = 340_000;
const chunkDir = '.next/static/chunks';

// data/*.ts を直接読むため下書き（publishStatus !== 'published'）も含む。
// lib/data.ts の getter は published のみを返すので、こちらの方が coverage が広い。
const slugs = [
  ...robots,
  ...manufacturers,
  ...useCases,
  ...articles,
  ...deployments,
].map((record) => `"${record.slug}"`);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.name.endsWith('.js') ? [absolute] : [];
  });
}

const failures = [];
for (const file of walk(chunkDir)) {
  const bytes = fs.statSync(file).size;
  const source = fs.readFileSync(file, 'utf8');
  const hits = slugs.filter((slug) => source.includes(slug)).length;

  if (hits >= MAX_DISTINCT_SLUGS_PER_CHUNK) {
    failures.push(`${file}: ${hits} distinct record slugs (limit ${MAX_DISTINCT_SLUGS_PER_CHUNK - 1})`);
  }
  if (bytes > MAX_CHUNK_BYTES) {
    failures.push(`${file}: ${bytes} bytes (limit ${MAX_CHUNK_BYTES})`);
  }
}

if (failures.length > 0) {
  console.error(`[bundle-content] violations:\n${failures.map((line) => `  - ${line}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('[bundle-content] OK');
}
```

閾値の根拠を記す。

- **slug 5件:** UIファイルがslugを1〜2個ハードコードすることはありうる。実測では違反chunk以外は全て0件で、余裕は十分ある。5件未満の流出（例: client componentが3機種のrecordを直書き）は検出できないが、それはStep 2のimport graph gateが担当する。
- **340,000バイト:** 現ビルドの最大の正常chunkは共有フロアの`142mv7fk8lxom.js`（**226,356バイト**、react-dom）。その1.5倍。react-domがframework更新で太っても誤爆しない幅を取る。

- [ ] **Step 2: import graph gateを書く（原因側の検出）**

Step 1がbuild成果物（結果）を見るのに対し、これはsource（原因）を見る。buildが不要で、違反箇所がファイル名で分かる。5件未満の流出も捕まる。

```js
// scripts/check-client-import-graph.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = ['components', 'lib', 'src'];
const extensions = new Set(['.ts', '.tsx']);
const ignoredExtensions = new Set(['.css', '.json', '.svg', '.png', '.jpg', '.webp']);

/**
 * 判定はspecifier文字列ではなく**解決後のrepo相対パス**で行う。
 * `@/data/robots` も `../../data/robots.ts` も同じ `data/robots.ts` になるため、
 * 書き方の違いで素通りしない。
 */
const forbidden = new Set([
  'data/articles.ts',
  'data/articlePlacements.ts',
  'data/deployments.ts',
  'data/manufacturers.ts',
  'data/robots.ts',
  'data/useCases.ts',
  'lib/data/localContentSnapshot.ts',
]);

const fromPatterns = [
  // import x, { y } from '...'
  /^\s*import\s+(?!type\b)([\s\S]*?)from\s+['"]([^'"]+)['"]/gm,
  // export { y } from '...' / export * from '...' — 再exportもgraphの辺である
  /^\s*export\s+(?!type\b)(\*|\{[\s\S]*?\})\s*from\s+['"]([^'"]+)['"]/gm,
];
// import './side-effect'
const sideEffectPattern = /^\s*import\s+['"]([^'"]+)['"]/gm;

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolute);
    return extensions.has(path.extname(entry.name)) ? [absolute] : [];
  });
}

/**
 * specifierの末尾`.ts`/`.tsx`を落としてから解決する。
 * この repo は `lib/validation/**`・`lib/data/**` で拡張子付き相対importを使っており
 * （55箇所）、落とさないと `x.ts.ts` を探して null になり**辺が黙って消える**。
 */
function resolveSpecifier(specifier, fromFile) {
  const withoutExtension = specifier.replace(/\.(ts|tsx)$/, '');
  const base = withoutExtension.startsWith('@/')
    ? withoutExtension.slice(2)
    : path.normalize(path.join(path.dirname(path.relative(root, fromFile)), withoutExtension));
  for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (fs.existsSync(path.join(root, base + suffix))) return base + suffix;
  }
  return null;
}

/** `import type` と、named specifier がすべて `type X` のものを除いた値参照。再exportと副作用importも辺として拾う。 */
function valueSpecifiersOf(file) {
  const source = fs.readFileSync(file, 'utf8');
  const specifiers = [];

  for (const pattern of fromPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const [, clause, specifier] = match;
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue;
      const braced = clause.match(/\{([\s\S]*?)\}/);
      const outsideBraces = clause.replace(/\{[\s\S]*?\}/, '').trim().replace(/,$/, '');
      const namedValues = braced
        ? braced[1].split(',').map((part) => part.trim()).filter((part) => part && !part.startsWith('type '))
        : [];
      if (outsideBraces || namedValues.length > 0 || !braced) specifiers.push(specifier);
    }
  }

  sideEffectPattern.lastIndex = 0;
  let match;
  while ((match = sideEffectPattern.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier.startsWith('@/') || specifier.startsWith('.')) specifiers.push(specifier);
  }

  return specifiers;
}

const allFiles = roots.flatMap((directory) => filesUnder(path.join(root, directory)));
const clientEntries = allFiles.filter((file) =>
  /^\s*['"]use client['"]/m.test(fs.readFileSync(file, 'utf8')),
);

const failures = [];
const unresolved = new Set();

for (const entry of clientEntries) {
  const seen = new Set();
  const stack = [[entry, [path.relative(root, entry)]]];
  while (stack.length > 0) {
    const [file, chain] = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of valueSpecifiersOf(file)) {
      const resolved = resolveSpecifier(specifier, file);
      if (!resolved) {
        if (!ignoredExtensions.has(path.extname(specifier))) {
          unresolved.add(`${path.relative(root, file)} -> ${specifier}`);
        }
        continue;
      }
      if (forbidden.has(resolved)) {
        failures.push(`${chain.join(' -> ')} -> ${resolved}`);
        continue;
      }
      stack.push([path.join(root, resolved), [...chain, resolved]]);
    }
  }
}

if (failures.length > 0) {
  console.error(
    `[client-imports] 'use client' modules must not reach raw data:\n${failures.map((line) => `  - ${line}`).join('\n')}`,
  );
  process.exitCode = 1;
}

// 解決できないlocal specifierは「違反が無い」ではなく「見えていない」。
// 黙って素通りさせるとgateの意味が消えるため失敗させる。
if (unresolved.size > 0) {
  console.error(
    `[client-imports] unresolved local specifiers (graphの穴):\n${[...unresolved].map((line) => `  - ${line}`).join('\n')}`,
  );
  process.exitCode = 1;
}

if (failures.length === 0 && unresolved.size === 0) {
  console.log(`[client-imports] OK (${clientEntries.length} client entry modules)`);
}
```

**このgateが捕まえないもの（承知のうえで残す）:**

- **動的`import()`。** 静的解析していない。catalog routeでは使っていないが、将来使われたら穴になる。
- **`node_modules`経由の再export。** bare specifierは辿らない。
- 逆に、**解決できないlocal specifierは失敗させる**。「違反0件」と「経路が見えていない」を区別できない状態を許すと、gateは通るのに流出する。初回実行で出た分は解決するか`ignoredExtensions`へ明示的に足す。

- [ ] **Step 3: 計画書の型検査を書く**

初版が3巡連続で起こした故障モードは「散文で決めたことがcode例と食い違う」だった。3巡目には`useCase.description`（存在しないfield）、`useCaseMaturityLabels`（存在しない識別子）、`useCase.maturity`（実際は`maturityLevel`）が同じStepに同居していた。**対応表の目視確認ではこの種の誤りは検出できない。**

**対象はfront-matterで`snippetCheck: true`を宣言した計画書だけにする。** `docs/plans/*.md`を全部走査してはならない。実測で、この計画書以外に**8文書・87個のts blockが存在する**（`content-platform-migration-plan-v1.md` 14、`refactor-phase-03` 17、`refactor-phase-06` 15、`refactor-phase-04` 10、`refactor-phase-01` 9、`refactor-phase-07` 8、`robot-image-sourcing-plan-v1.md` 8、`robot-data-factcheck-impl-plan` 6）。いずれもcompileを意図して書かれていないため必ず落ち、Task 2が「完了済みphaseを含む無関係な8文書のsnippet修正」に膨らむ。front-matterの`status:`は全文書`plan`で識別に使えないため、明示的なopt-in fieldを使う。

```js
// scripts/check-plan-snippets.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '.plan-snippets';
const planDir = 'docs/plans';
const baselinePath = 'scripts/plan-snippet-skip-baseline.json';
const fence = /```(ts|tsx)\n([\s\S]*?)```/g;
// front-matter の `snippetCheck: true` を宣言した計画書だけを対象にする。
const optIn = /^---\n[\s\S]*?^snippetCheck:\s*true\s*$[\s\S]*?^---$/m;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let extracted = 0;
let skipped = 0;
const checkedFiles = [];

for (const name of fs.readdirSync(planDir).filter((file) => file.endsWith('.md'))) {
  const markdown = fs.readFileSync(path.join(planDir, name), 'utf8');
  if (!optIn.test(markdown)) continue;
  checkedFiles.push(name);
  fence.lastIndex = 0;
  let match;
  let index = 0;
  while ((match = fence.exec(markdown)) !== null) {
    const [, language, body] = match;
    index += 1;
    if (body.includes('@plan-check-skip')) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(path.join(outDir, `${name.replace(/\.md$/, '')}-${index}.${language}`), body);
    extracted += 1;
  }
}

console.log(
  `[plan-snippets] files=${checkedFiles.join(',') || '(none)'} extracted=${extracted} skipped=${skipped}`,
);

// opt-in文書が1本も無い状態でexit 0を返すと、gateは「常に通る」だけの飾りになる。
if (checkedFiles.length === 0) {
  console.error('[plan-snippets] no plan declares `snippetCheck: true`');
  process.exitCode = 1;
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
if (skipped > baseline.skipped) {
  console.error(`[plan-snippets] skip count increased: ${baseline.skipped} -> ${skipped}`);
  process.exitCode = 1;
}

try {
  execFileSync('npx', ['tsc', '--noEmit', '--project', 'tsconfig.plan-snippets.json'], {
    stdio: 'inherit',
  });
} catch {
  process.exitCode = 1;
}
```

**検査は既定でON、除外は明示的に行う。** opt-in（`@plan-check`を付けたblockだけ検査）にすると、新しく書いたblockが既定で素通りする。今回の故障モードはまさに「新しく書いたcode例が実型と違う」なので、既定をOFFにしてはならない。

compileできない断片には`// @plan-check-skip: <理由>`を1行入れる。skip総数は`scripts/plan-snippet-skip-baseline.json`（`{"skipped": N}`）と比較し、**増えたら失敗させる**。ログ行は読まれないが、失敗するdiffは読まれる。

**skipには2種類あり、扱いが違う。**

| 種類 | 例 | 扱い |
|---|---|---|
| 恒久的（断片） | 既存importや関数外の文脈を省いた抜粋 | そのまま残る |
| 一時的（前方参照） | まだ作っていないmoduleをimportするsnippet | **そのmoduleを作るtaskでskip markerを外し、baselineを減らす** |

一時的skipは現時点で8箇所ある。

| snippet | 前方参照している物 | markerを外すtask |
|---|---|---|
| Task 6 `lib/catalog/search.ts` | `@/lib/normalizeSearchText` | Task 6 |
| Task 6 `tests/unit/view-models/robots.test.ts` | `@/lib/normalizeSearchText` | Task 6 |
| Task 7 `createUseCaseCatalogSearchText` | `@/lib/catalog/search`の`joinSearchText` | Task 7 |
| Task 7 `tests/unit/view-models/use-cases.test.ts` | `@/lib/viewModels/useCases` | Task 7 |
| Task 8 `createArticleCatalogSearchText` | `@/lib/catalog/search`の`joinSearchText` | Task 8 |
| Task 8 `tests/unit/view-models/articles.test.ts` | `@/lib/viewModels/articles` | Task 8 |
| Task 8 `tests/unit/view-models/catalog-payload.test.ts` | `@/lib/viewModels/{useCases,articles}` | Task 8 |
| Task 9 `tests/unit/view-models/compare.test.ts` | `@/lib/viewModels/compare` | Task 9 |

**該当taskの完了条件に「skip markerを外してbaselineを減らす」を含める。** baselineが減る方向は失敗にしないため、この運用は成立する。

この8箇所を優先して一時的skipにしたのは、**3巡連続で誤りが出たのがsearchText builderとVM test（存在しないfield名・label map名の参照）だから**である。恒久的skipにしてしまうと、再発を防ぐという型検査の目的を果たさない。

**Task 2時点の実効カバレッジは低い。この数字を承知したうえで導入する。**

この計画書のts/tsx blockは全34個、うちskip markerが付いているのは25個（恒久17・一時8）。**Task 2直後に型検査されるのは9個だけ**（`lib/articlePlacements.ts`、`lib/display.ts:237`、Task 1のimport追加、`lib/useMediaQuery.ts`、`lib/normalizeSearchText.ts`、`lib/viewModels/{useCases,articles,compare}.ts`の型定義3本、`compare.spec.ts`）。**再発した誤りの現場であるsearchText builderとVM testは、上の表のtaskでmarkerを外すまで検査されない。**

この34/25/9は`scripts/check-plan-snippets.mjs`と同じ抽出ロジックで数えた実測値である。編集で増減するため、baselineを作るStep 5の出力を正とする。

したがってこのgateの価値は「Task 2で一斉に誤りを洗い出す」ことではなく、**「Task 6・7・8・9の着手時にmarkerを外す手順が強制され、その時点で誤りが機械的に落ちる」**ことにある。各taskの完了条件に組み込まれていることがgateの本体であり、script単体ではない。

`tsconfig.plan-snippets.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "types": ["node"]
  },
  "include": ["next-env.d.ts", ".plan-snippets/**/*"]
}
```

**`include`を`.plan-snippets/**/*`だけにしてはならない。** `extends`は`include`を継承せず置き換えるため、`next-env.d.ts`とambient型が外れる。実測すると、snippetがimportした先の**既存ファイル**が落ちる（`lib/media.ts(23,17): Cannot find name 'process'`）。snippetの誤りではないので、指示どおり「落ちた箇所を計画書側で修正する」と誤った修正へ誘導される。`next-env.d.ts`と`types: ["node"]`を明示すれば消える。

**この設定で9個のsnippetが実際に通ることを確認済み**（2026-08-01時点）。唯一落ちるのは`lib/articlePlacements.ts`のsnippetで、原因は`byArticlePublishedDesc`がまだ`(a: Article, b: Article)`だから。**Task 1 Step 2の引数型を広げる変更を入れると解消し、その状態で`npm run typecheck`（プロジェクト全体）も通る**ことまで確認した。順序制約「Task 1 → Task 2」が実在することの裏付けである。

- [ ] **Step 4: baselineと`.gitignore`と`package.json`を更新する**

`scripts/plan-snippet-skip-baseline.json`をStep 5の実行結果で作る（初期値は実測したskip数）。`.gitignore`へ`.plan-snippets/`を追加する。

```json
{
  "check:bundle-content": "node --experimental-strip-types scripts/check-client-bundle-content.mjs",
  "check:client-imports": "node scripts/check-client-import-graph.mjs",
  "check:plan-snippets": "node scripts/check-plan-snippets.mjs"
}
```

`check` pipelineへ挿入する。build不要なものはbuildの前に置く。

```
validate:data && check:data-boundaries && check:client-imports && check:world-map-asset
  && typecheck && lint && check:plan-snippets && test
  && build && check:home-payload && check:bundle-content && test:e2e
```

- [ ] **Step 5: 全gateを実行する**

```bash
npm run check:client-imports
npm run check:plan-snippets
npm run build && npm run check:bundle-content
```

**完了条件:** 3つともexit 0。**allowlistを持たせない。** Task 1で違反が0になっているため不要である。

`check:plan-snippets`がこの時点で未発見の不一致を落とす可能性がある。**落ちた箇所を計画書側で修正することがこのStepの完了条件に含まれる。**

- [ ] **Step 6: commit**

```bash
git add scripts/check-client-bundle-content.mjs scripts/check-client-import-graph.mjs \
  scripts/check-plan-snippets.mjs scripts/plan-snippet-skip-baseline.json \
  tsconfig.plan-snippets.json package.json .gitignore docs/plans
git commit -m "test: gate client bundle contents, client import graph and plan snippets"
```

---

### Task 3: card系componentのmotion依存を外す

**Goal:** `ui/AnimatedTooltip`、`UseCaseCard`、`ui/card-hover-effect`のmotion依存をCSSへ置換する。

**問題:** `f42ecbf`は`RobotCard`／`ManufacturerCard`からmotionを外したが、`/robots`のJSは-0.6%しか動かなかった。原因は`RobotsBrowser → PageTabBar → ui/AnimatedTooltip`という別経路が残っていたためである。**手法の失敗ではない。**

置換方式は`RobotCard`／`ManufacturerCard`で実証済みのもの（CSS transition + Tailwind `motion-reduce:` utility）を使う。

**Files:**
- Modify: `components/ui/AnimatedTooltip.tsx`
- Modify: `components/UseCaseCard.tsx`
- Modify: `components/ui/card-hover-effect.tsx`

**Interfaces:**
- 変更しない: `AnimatedTooltipProps`（`content`／`placement`／`delay`／`children`／`className`）、`CardHoverEffect`のprops、`UseCaseCard`のprops

- [ ] **Step 1: `AnimatedTooltip`をCSSへ置換する**

現行は`AnimatePresence` + `motion.span`でmount/unmount時のfade/scale/slideを表現している。CSSで同じことをするには**常時mountして可視stateをclassで切り替える**。これでenterもexitもtransitionが効く。

`display: none`（`hidden`属性やTailwindの`hidden`）を使うとtransitionが効かないため使わない。非表示時は`opacity-0` + `pointer-events-none`で隠し、支援技術からは`aria-describedby`が可視時だけ張られることで制御する。

`motion/react`のimportを削除する。`useReducedMotion`は使わず`motion-reduce:`に任せる。

```tsx
// components/ui/AnimatedTooltip.tsx
// @plan-check-skip: 既存の hooks / 定数 / import を省いた描画部の抜粋
const enterFrom: Record<AnimatedTooltipPlacement, string> = {
  top: 'translate-y-1',
  bottom: '-translate-y-1',
  left: 'translate-x-1',
  right: '-translate-x-1',
};

return (
  <span
    className="relative inline-flex"
    onBlur={hide}
    onFocus={show}
    onKeyDown={handleKeyDown}
    onMouseEnter={isHoverDevice ? show : undefined}
    onMouseLeave={isHoverDevice ? hide : undefined}
  >
    <span aria-describedby={isVisible ? tooltipId : undefined}>{children}</span>

    <span
      aria-hidden={!isVisible}
      className={cn(
        'pointer-events-none absolute z-50 w-max max-w-xs rounded-md bg-foreground px-3 py-1.5 text-background text-sm shadow-md',
        'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
        isVisible ? 'scale-100 opacity-100' : cn('scale-95 opacity-0', enterFrom[placement]),
        placementStyles[placement],
        className,
      )}
      id={tooltipId}
      role="tooltip"
    >
      {content}
      <span
        aria-hidden="true"
        className={cn('absolute block h-0 w-0', arrowBorderSize[placement], arrowStyles[placement])}
      />
    </span>
  </span>
);
```

既存の`useHoverDevice`（`useSyncExternalStore`）、`show`／`hide`／`handleKeyDown`、`delay`のtimer処理はそのまま残す。`placementStyles`／`arrowStyles`／`arrowBorderSize`も変更しない。`SPRING`と`getInitialTransform`は不要になるので削除する。

- [ ] **Step 2: `UseCaseCard`のmotionとtiltを外す**

`RobotCard`と同じ形にする。`motion.div` → 通常の`div`、`useTiltCardEffect`由来の`rotateX`／`rotateY`／`glowOpacity`とpointer追従glow（`motion.div`のradial-gradient層）を削除。shimmerとaccent lineはCSSのみで動いているためそのまま残す。

削除する行:

```tsx
// @plan-check-skip: 削除対象の既存コード片
import { motion } from 'motion/react';
import { useTiltCardEffect } from '@/lib/useTiltCardEffect';

// root要素の onMouseMove / onMouseEnter / onMouseLeave と
// style={{ rotateX, rotateY, transformPerspective: 1000 }} と transition={{...}}
```

root要素は次にする。

```tsx
// @plan-check-skip: 子要素を省いた root 要素のみの抜粋
<div className="card-data group relative isolate flex h-full min-h-[148px] flex-col overflow-hidden">
```

`lib/useTiltCardEffect.ts`は`components/FeaturedRobotCard.tsx:10`が使い続けるため**削除しない**。

- [ ] **Step 3: `card-hover-effect`をCSSへ置換する**

52行の小さいcomponent。`AnimatePresence` + `motion.span`によるhover highlightを、常時mountした`span`のopacity transitionへ置換する。Step 1と同じく`display: none`は使わない。`ReportsBrowser.tsx:171`の利用箇所とprops（`className`）は変更しない。

- [ ] **Step 4: 削減を実測する**

```bash
npm run build
rg -n "motion/react" components/ui/AnimatedTooltip.tsx components/UseCaseCard.tsx components/ui/card-hover-effect.tsx
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), String(own).padStart(9));
}"
```

**完了条件:** `rg`が0件。`/robots`と`/use-cases`からmotion chunkが消える。`/reports`は`NewsHeroCarousel` → `uilayouts/carousel`経由が残るためTask 4まで消えない見込みで、実測値を記録する。

削減量は実測値をそのまま記録する。**chunkはmoduleと1:1ではないため、134,910がそのまま減るとは限らない。**

- [ ] **Step 5: 回帰確認とcommit**

```bash
npm run test && npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/accessibility-smoke.spec.ts
```

手動確認（390 / 1440幅のscreenshotを添付）:
- `/robots`と`/reports`のtab barでtooltipがhover・focus両方で出る。Escapeで閉じる。`aria-describedby`が可視時だけ張られる
- hoverの無いdevice（`(hover: hover)`不成立）でfocus時のみ出る
- `/use-cases`のcardでshimmerとaccent lineが残り、tilt/glowだけが消えている
- `prefers-reduced-motion: reduce`でtransitionが無効になる

```bash
git add components/ui/AnimatedTooltip.tsx components/UseCaseCard.tsx components/ui/card-hover-effect.tsx
git commit -m "perf: replace card and tooltip motion with CSS transitions"
```

---

### Task 4: carousel系のmotion依存を外す

**Goal:** `/reports`に残る最後のmotion経路を外す。

**問題:** `NewsHeroCarousel:21`は`useReducedMotion`だけのために`motion/react`をimportしている。`uilayouts/carousel.tsx:9`は`AnimatePresence, motion`をimportしているが、実際に使うのは2箇所だけである。

- `SliderSnapDisplay`（L465-505）— **利用者0の死んだexport**（`rg`で確認済み）
- `SliderDotButton`（L506-557）— `layoutId`によるactive dotのスライド。`NewsHeroCarousel.tsx:155`が使用

autoplay・swipe・keyboard操作は`embla-carousel`（と`embla-carousel-autoplay`）が担っておりmotionに依存しない。**carousel本体のロジックには触らない。**

**Files:**
- Create: `lib/useMediaQuery.ts`
- Modify: `components/NewsHeroCarousel.tsx`
- Modify: `components/uilayouts/carousel.tsx`

**Interfaces:**
- Produces: `useMediaQuery(query: string): boolean`
- 変更しない: `SliderDotButton`のprops（`className`／`activeClass`）、`Carousel`／`Slider`／`SliderContainer`／`SliderPrevButton`／`SliderNextButton`／`useCarousel`

- [ ] **Step 1: `useMediaQuery`を追加する**

SSR時は`false`を返し、hydration mismatchを避けるため`useSyncExternalStore`で書く（`AnimatedTooltip`の`useHoverDevice`と同じ方式）。

```ts
// lib/useMediaQuery.ts
'use client';

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 2: `NewsHeroCarousel`の`useReducedMotion`を置換する**

`import { useReducedMotion } from 'motion/react';`を削除し、次へ置換する。

```ts
// @plan-check-skip: component 本体を省いた差し替え箇所の抜粋
import { useMediaQuery } from '@/lib/useMediaQuery';

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
```

`prefersReducedMotion`の既存利用箇所（autoplay停止判定）はそのまま。`motion/react`の`useReducedMotion`はSSRで`null`を返しうるが`useMediaQuery`は`false`を返す。**autoplayを止める条件に使っているため、どちらもfalsyで判定は変わらない。**

- [ ] **Step 3: 死んだ`SliderSnapDisplay`を削除する**

```bash
rg -n "SliderSnapDisplay" components src tests
```

Expected: `components/uilayouts/carousel.tsx`の定義だけ。それ以外が0件なら`export const SliderSnapDisplay = ...`のblock（L465-505）と、そこでしか使われていないlocal stateを削除する。

- [ ] **Step 4: `SliderDotButton`をCSSへ置換する**

`layoutId`は「activeなdotが位置を保ったままスライドする」共有layout animationを作っている。CSSでは**indicatorを1つだけdot列の中に絶対配置し、`translate`でactive dotの位置へ動かす**。

**offsetは定数計算ではなくDOMから測る。** dot列のgapとサイズを定数（`1.5rem + 0.5rem`など）で埋め込む実装は、**呼び出し元がgapを上書きした瞬間に壊れる**。実際に唯一の利用箇所である`components/NewsHeroCarousel.tsx:155`は

```tsx
// @plan-check-skip: 既存の呼び出し1行
<SliderDotButton className="gap-1.5" activeClass="bg-white" />
```

と書いており、`cn()`（tailwind-merge）によって`gap-1.5`（0.375rem）が既定の`gap-2`（0.5rem）に勝つ。定数で計算するとdot 1つあたり0.125remずつ、N個目で(N-1)×0.125remずれる。現行の`layoutId`実装はindicatorをactive buttonの内側に描くためこの影響を受けない。**置換で新しく持ち込む不具合であり、CSS化そのものの制約ではない。**

active buttonの`offsetLeft`／`offsetTop`を読めば、gap・dotサイズ・responsive classの変更すべてに追従する。

```tsx
// components/uilayouts/carousel.tsx
// @plan-check-skip: forwardRef の外側と useCarousel の分割代入を省いた抜粋
const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
const containerRef = useRef<HTMLDivElement>(null);
const [indicatorOffset, setIndicatorOffset] = useState(0);

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const measure = () => {
    const active = dotRefs.current[selectedIndex];
    if (!active) return;
    setIndicatorOffset(orientation === 'vertical' ? active.offsetTop : active.offsetLeft);
  };

  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(container);
  return () => observer.disconnect();
}, [selectedIndex, orientation, scrollSnaps.length]);
```

描画部:

```tsx
// components/uilayouts/carousel.tsx
// @plan-check-skip: forwardRef の外側と useCarousel の分割代入を省いた描画部の抜粋
<div ref={containerRef} className={cn('relative flex gap-2', className)} {...props}>
  {scrollSnaps.map((_, index) => (
    <button
      key={`${carouselId}-dot-${index}`}
      ref={(node) => {
        dotRefs.current[index] = node;
      }}
      type="button"
      onClick={() => onDotButtonClick(index)}
      aria-label={`スライド ${index + 1} へ`}
      aria-current={index === selectedIndex ? 'true' : undefined}
      className={cn(
        'relative inline-flex p-0 m-0',
        orientation === 'vertical' ? 'h-6 w-1' : 'w-6 h-1',
      )}
    >
      <div
        className={cn(
          'bg-neutral-500/40 rounded-full',
          orientation === 'vertical' ? 'h-6 w-1' : 'w-6 h-1',
        )}
      />
    </button>
  ))}
  <div
    aria-hidden="true"
    className={cn(
      'pointer-events-none absolute left-0 top-0 rounded-full bg-black dark:bg-white',
      'transition-transform duration-400 ease-in-out motion-reduce:transition-none',
      orientation === 'vertical' ? 'h-6 w-1' : 'w-6 h-1',
      activeClass,
    )}
    style={{
      transform:
        orientation === 'vertical'
          ? `translateY(${indicatorOffset}px)`
          : `translateX(${indicatorOffset}px)`,
    }}
  />
</div>
```

`forwardRef`の`ref`は`containerRef`とマージする必要がある（既存の`ref`引数を捨てない）。初回renderの`indicatorOffset`は0で、これは`selectedIndex === 0`のときのactive dot位置と一致するため、mount時のちらつきは出ない。

`duration-400`はTailwind v4（`^4.1.12`）の動的ユーティリティとして有効である（v3では存在しないclassだった）。

`AnimatePresence`／`motion`のimportを削除する。`useEffect`／`useRef`／`useState`は既に同fileでimport済み。

- [ ] **Step 5: 削減を実測する**

```bash
npm run build
rg -n "motion/react" components lib
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), String(own).padStart(9));
}"
```

**完了条件:** catalog 4 routeにmotion chunkが載っていない。`rg -n "motion/react"`の残存は`components/HomeContentNavigator.tsx`、`components/FeaturedRobotCard.tsx`、`components/ui/encrypted-text.tsx`（いずれもHome／Phase 5対象外）だけになる。

`motion/react`を`package.json`のdependenciesから外せるかも確認する。**Home側の利用者が残るためこの時点では外せない見込み**であり、結果を記録して後続phaseへ送る。

- [ ] **Step 6: 回帰確認とcommit**

```bash
npm run test && npm run build
npm run test:e2e -- tests/e2e/public-routes.spec.ts
```

手動確認（390 / 1440幅のscreenshot）:
- `/reports`のhero carouselが自動再生し、prev/nextボタンとswipeで動く
- dot indicatorがactive slideへスライドし、`aria-current`が正しいdotに付く
- **最後のdotでindicatorがdotの真上に重なる**（`className="gap-1.5"`の上書きに追従できているかの確認。定数計算だとここで最大にずれる）
- keyboard（Tab → Enter/Space）でdotを選択できる
- `prefers-reduced-motion: reduce`でautoplayが止まり、indicatorのtransitionも無効になる
- **`/robots/[slug]`の`RobotImageCarousel`（同じmoduleの利用者）が壊れていない**

```bash
git add lib/useMediaQuery.ts components/NewsHeroCarousel.tsx components/uilayouts/carousel.tsx
git commit -m "perf: replace carousel motion with CSS and drop the dead snap display"
```

---

### Task 5: `normalizeSearchText`を独立moduleへ切り出す

**Goal:** `lib/search.ts`全体をclient graphへ引き込む経路のうち、`normalizeSearchText`だけを使っている3経路を断つ。

**問題:** `lib/search.ts`は4つの`create*SearchDocument()`と`lib/tags`／`lib/labels`を抱えている。`normalizeSearchText`（実質1行の正規化関数）を使うためだけにこれをimportすると、catalog 5 routeすべてに30,127〜53,958バイトのchunkが乗る。

```
components/RobotsBrowser.tsx:20                                → normalizeSearchText
components/CompareClient.tsx:41                                → normalizeSearchText
lib/robotFilters.ts:6 / lib/manufacturerFilters.ts:5
  → lib/viewModels/shared.ts:3                                 → normalizeSearchText
```

**3経路すべてを断たないと1バイトも減らない。** `lib/viewModels/shared.ts`経由は`/robots`・`/manufacturers`・`/use-cases`・`/reports`のすべてに効く。

残る2経路（`lib/useCaseFilters.ts:2`、`lib/searchIndex.ts:3`）は`create*SearchDocument`を使っているためTask 7・8が担当する。

**Files:**
- Create: `lib/normalizeSearchText.ts`
- Modify: `lib/search.ts`
- Modify: `lib/viewModels/shared.ts`
- Modify: `components/RobotsBrowser.tsx`
- Modify: `components/CompareClient.tsx`

**Interfaces:**
- Produces: `normalizeSearchText(value: SearchPrimitive): string`（`lib/normalizeSearchText.ts`）
- `lib/search.ts`は同名をre-exportし続ける（既存利用者を壊さない）

- [ ] **Step 1: 新moduleを作る**

`lib/search.ts`の現行実装をそのまま移す。他moduleへの依存を持たせない。

```ts
// lib/normalizeSearchText.ts
export type SearchPrimitive = string | number | null | undefined;

export function normalizeSearchText(value: SearchPrimitive): string {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
```

- [ ] **Step 2: `lib/search.ts`をre-exportへ変える**

`lib/search.ts`内の`normalizeSearchText`と`SearchPrimitive`の定義を削除し、新moduleからimportして再exportする。**この時点では`lib/search.ts`のexport面は変わらない。**

```ts
// lib/search.ts
// @plan-check-skip: 既存の残りのexportを省いた冒頭の抜粋
import { normalizeSearchText, type SearchPrimitive } from '@/lib/normalizeSearchText';

export { normalizeSearchText };
export type { SearchPrimitive };
```

- [ ] **Step 3: 3経路のimportを差し替える**

`lib/viewModels/shared.ts:3`、`components/RobotsBrowser.tsx:20`、`components/CompareClient.tsx:41`の3行を次へ差し替える。

```ts
// @plan-check-skip: 3ファイル共通の1行差し替え
import { normalizeSearchText } from '@/lib/normalizeSearchText';
```

`lib/viewModels/shared.ts:2`の`import type { SearchDocument } from '@/lib/search';`は型importなのでbundleへ影響しない。Task 6で`createCatalogSearchText`ごと消えるためここでは触らない。

- [ ] **Step 4: 削減を実測する**

```bash
npm run build
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports','/compare']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), String(own).padStart(9));
}"
```

**完了条件:** `/robots`・`/manufacturers`・`/compare`のroute固有JSが減る。減らない場合は`lib/search.ts`へ到達する経路が他に残っているので、`scripts/check-client-import-graph.mjs`の`forbidden`へ一時的に`'lib/search.ts'`を足して実行し、経路を特定してから進む（`forbidden`は解決後のrepo相対パスのSetである）。

**`/use-cases`と`/reports`はこの時点では減らない見込み**（`lib/useCaseFilters.ts`と`lib/searchIndex.ts`が残るため）。実測値を記録し、Task 7・8で再測する。

- [ ] **Step 5: 回帰確認とcommit**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
npm run test:e2e -- tests/e2e/catalog-url-state.spec.ts
```

手動: `/robots`の検索窓と`/compare`のmenu検索が現行と同じ結果を返す。

```bash
git add lib/normalizeSearchText.ts lib/search.ts lib/viewModels/shared.ts \
  components/RobotsBrowser.tsx components/CompareClient.tsx
git commit -m "refactor: isolate normalizeSearchText from the search document module"
```

---

### Task 6: catalog searchTextをwhitelist化する

**Goal:** catalog view modelの`searchText`から本文を除去する。**Global Constraint 4の未達分。**

**問題:** `lib/viewModels/robots.ts:73`は現在も`createCatalogSearchText(createRobotSearchDocument(robot, manufacturer))`である。`createRobotSearchDocument`の`fields`には`robot.summary`、`robot.description`、`robot.comparison.strengths/constraints/bestFit/notFit`、`supportNote`、`safetyNote`、`vendorRiskNote`が含まれる。連結すると、JSONのkeyとしては現れないが**本文の中身そのものがclientへ渡るJSONに残る**。

実測:

| route | VM全体 | うちsearchText | 本文除外時の削減 |
|---|---:|---:|---:|
| `/robots`（57件） | 67,185字 | 28,357字（42.2%） | VM全体の **-27.7%** |
| `/manufacturers`（25件） | 24,171字 | 11,401字（47.2%） | VM全体の **-38.8%** |

**原則:** catalog view modelの`searchText`は、**そのcardが実際に描画する文字列**と**その一覧のfacet選択肢のlabel**だけを対象とする。詳細ページにしか無い本文は一覧の検索対象にしない。id、slug、内部enum値は表示でもfacet labelでもないため含めない（enumはlabel経由で引ける）。

**対象field（`data/types.ts`とcard componentの描画内容で検証済み）:**

| collection | 含める | 含めない |
|---|---|---|
| robots | `nameJa`/`name`、メーカー名、`distributorJapan`、category／stage／readiness／availability／mobility／procurementの各label、card 4 factsの値、`industryTags`、`taskTags` | `summary`、`description`、`comparison.*`、`supportNote`、`safetyNote`、`vendorRiskNote`、`manufacturerId`（内部id） |
| manufacturers | `nameJa`/`name`、`country`、`hqCity`、`foundedYear`、国内代理店名、取扱ロボット名、companyType／companyStatus／japanPresenceのlabel | `description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、代理店`note`、`website`、`contactUrl` |

use-cases／reportsはTask 7・8で同じ形にする。

**受け入れるトレードオフ:** 一覧の検索範囲が狭くなる。現在は紹介文中の語（例「バッテリー」）でも部分一致でhitするが、今後はhitしない。**このサイトには全体検索ページが存在しない**（`src/app`に`search` routeなし）ため、退避先は無い。復活方式は「実装しないこと」に記載。

**Files:**
- Create: `lib/catalog/search.ts`
- Create: `tests/unit/view-models/catalog-payload.test.ts`
- Modify: `lib/viewModels/shared.ts`
- Modify: `lib/viewModels/robots.ts`
- Modify: `lib/viewModels/manufacturers.ts`
- Modify: `lib/robotFilters.ts` / `lib/manufacturerFilters.ts`
- Modify: `scripts/check-data-import-boundaries.mjs`
- Modify: `tests/unit/view-models/robots.test.ts`
- Modify: `tests/unit/view-models/manufacturers.test.ts`

> `package.json`は変更しない。payload budgetをvitest testにしたため、`check` pipelineへ足す行が無い（Step 6）。

**Interfaces:**
- Produces:
  - `createRobotCatalogSearchText(robot, manufacturer, facts): string`
  - `createManufacturerCatalogSearchText(manufacturer, robotsForManufacturer): string`
  - `matchesCatalogSearch(searchText: string, query: string): boolean`
- Removes: `lib/viewModels/shared.ts`の`createCatalogSearchText`と`matchesCatalogSearchText`

- [ ] **Step 1: 失敗するtestを書く**

key名の不在だけでは、連結済みsearch textとして本文が載っている場合を検出できない。**JSON文字列ではなく`searchText`自体を、両辺同じ関数で正規化して比較する。**

raw文字列比較（`expect(JSON.stringify(vm)).not.toContain(rawText)`）は**実測で7.9%取りこぼす**。現行の違反実装に対し12文字以上の本文値343件を検査したところ、343件すべてが実際にsearchTextへ含まれているのに、raw比較で検出できたのは316件だった。原因は`uniqueSearchValues`が各値へ`.normalize('NFKC').trim()`をかけるため全角括弧・全角数字を含む本文が原文と一致しないこと（例「移動速度3.3m/s（潜在能力5m/s超）」）、builderが連結後に`toLowerCase()`を含む正規化をかけること、`JSON.stringify`のescape（`"`／`\n`／`\\`）である。

```ts
// tests/unit/view-models/robots.test.ts
// @plan-check-skip: Task 5 で作る @/lib/normalizeSearchText を参照する。Task 6 でこのmarkerを外しbaselineを減らす
import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

describe('robot catalog search text', () => {
  const items = createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases());

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const robot of getRobots()) {
      const bodyValues = [
        robot.description,
        robot.summary,
        robot.supportNote,
        robot.safetyNote,
        robot.vendorRiskNote,
        ...robot.comparison.strengths,
        ...robot.comparison.constraints,
        ...robot.comparison.bestFit,
        ...robot.comparison.notFit,
      ];

      for (const value of bodyValues) {
        // 12文字未満は他fieldと偶然一致しうるため対象外。
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
```

`tests/unit/view-models/manufacturers.test.ts`にも同形のitを置く。対象は`description`、`distributorNote`、`supportNote`、`procurementNote`、`vendorRiskNote`、`domesticDistributors?.[].note`。

既存の`"sources"`／`"fieldEvidence"`／`"comparison"`／`"priceOffers"`のkey名assertionはそのまま残す。

- [ ] **Step 2: testが失敗することを確認する**

```bash
npm run test -- tests/unit/view-models/robots.test.ts tests/unit/view-models/manufacturers.test.ts
```

Expected: 本文値assertionでFAIL。現行実装が本文を含んでいるため。

- [ ] **Step 3: `lib/catalog/search.ts`を作る**

`lib/search.ts`の`create*SearchDocument()`は**使わない**。対象fieldを直接列挙する。

`industryTags`／`taskTags`／`distributorJapan`／`hqCity`／`foundedYear`／`domesticDistributors`／`nameJa`はoptionalなので`??`と`filter(Boolean)`で処理する（`data/types.ts`で確認済み）。

```ts
// lib/catalog/search.ts
// @plan-check-skip: Task 5 で作る @/lib/normalizeSearchText を参照する。Task 6 でこのmarkerを外しbaselineを減らす
import type { Manufacturer, Robot } from '@/data/types';
import {
  buyerReadinessLabels,
  companyStatusLabels,
  companyTypeLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  japanPresenceLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
} from '@/lib/labels';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import type { CatalogFact } from '@/lib/viewModels/shared';

export type SearchPart = string | number | undefined;

export function joinSearchText(parts: readonly SearchPart[]): string {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

/** 一覧の検索対象は「cardが描画する文字列」と「facet選択肢のlabel」だけ。本文とidは含めない。 */
export function createRobotCatalogSearchText(
  robot: Robot,
  manufacturer: Manufacturer | undefined,
  facts: readonly CatalogFact[],
): string {
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
    ...(robot.industryTags ?? []),
    ...(robot.taskTags ?? []),
  ]);
}

export function createManufacturerCatalogSearchText(
  manufacturer: Manufacturer,
  robotsForManufacturer: readonly Robot[],
): string {
  return joinSearchText([
    manufacturer.nameJa,
    manufacturer.name,
    manufacturer.country,
    manufacturer.hqCity,
    manufacturer.foundedYear,
    companyTypeLabels[manufacturer.companyType],
    companyStatusLabels[manufacturer.companyStatus],
    japanPresenceLabels[manufacturer.japanPresence],
    ...(manufacturer.domesticDistributors ?? []).map((distributor) => distributor.name),
    ...robotsForManufacturer.flatMap((robot) => [robot.nameJa, robot.name]),
  ]);
}

/** 空白区切りの全語がsearchTextに含まれるか。関連度rankingは持たない。 */
export function matchesCatalogSearch(searchText: string, query: string): boolean {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeSearchText(searchText);
  return terms.every((term) => haystack.includes(term));
}
```

- [ ] **Step 4: view modelとfilterを差し替える**

`lib/viewModels/robots.ts`:

```ts
// @plan-check-skip: factory 本体を省いた差し替え箇所の抜粋
import { createRobotCatalogSearchText } from '@/lib/catalog/search';

searchText: createRobotCatalogSearchText(robot, manufacturer, card.facts),
```

`import { createRobotSearchDocument } from '@/lib/search';`と`createCatalogSearchText`のimportを削除する。

`lib/viewModels/manufacturers.ts`も同様に`createManufacturerCatalogSearchText(manufacturer, manufacturerRobots)`へ差し替え、`createManufacturerSearchDocument`のimportを削除する。

`lib/viewModels/shared.ts`から`createCatalogSearchText`と`matchesCatalogSearchText`、および`import type { SearchDocument } from '@/lib/search';`を削除する。

`lib/robotFilters.ts:6`と`lib/manufacturerFilters.ts:5`の`matchesCatalogSearchText(query, item.filter.searchText)`を`matchesCatalogSearch(item.filter.searchText, query)`へ差し替える。**引数順が逆になる点に注意。**

- [ ] **Step 5: testが通ることを確認し、VMサイズを実測する**

```bash
npm run test -- tests/unit/view-models
```

Expected: testがPASS。この時点でStep 6のbudget testを`maxBytes`未設定のまま書き、`console.log`が出す実測バイト数を上限設定に使う。

> **plain nodeでVM factoryを実行することはできない。** `lib/data.ts`も`lib/viewModels/*.ts`も`@/`エイリアスと拡張子なし相対importを使っており、Nodeはどちらも解決しない（実測: `Cannot find package '@/lib' imported from .../lib/viewModels/robots.ts`）。`--experimental-strip-types`は型を剥がすだけで、module解決は変えない。**計測もgateもvitest上で行う。**

- [ ] **Step 6: payload byte budgetを導入する**

**scriptではなくvitest testとして書く。** 理由は上記のmodule解決である。`vitest.config.ts`は`vite-tsconfig-paths`を読み込んでおり`@/`が解決される。既存のVM contract testと同じ場所に置くことで、`npm run check`のpipelineへ新しい行を足す必要もなくなる（`test`に含まれる）。

**文字数ではなく`Buffer.byteLength`で測る**（日本語はUTF-8で1文字3バイトのため、文字数では実転送量を約3倍過小評価する）。

```ts
// tests/unit/view-models/catalog-payload.test.ts
// @plan-check-skip: Task 6 時点では use-cases / articles の VM がまだ無い。Task 8 でこのmarkerを外しbaselineを減らす
import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots, getUseCases } from '@/lib/data';
import { createManufacturerCatalogItems } from '@/lib/viewModels/manufacturers';
import { createRobotCatalogItems } from '@/lib/viewModels/robots';

// maxBytes は Task 6 Step 5 の実測値 * 1.15。Task 7・8 で use-case / article を追加する。
const budgets = [
  {
    name: 'robots',
    maxBytes: 0,
    bytes: () =>
      Buffer.byteLength(
        JSON.stringify(createRobotCatalogItems(getRobots(), getManufacturers(), getUseCases())),
      ),
  },
  {
    name: 'manufacturers',
    maxBytes: 0,
    bytes: () =>
      Buffer.byteLength(
        JSON.stringify(createManufacturerCatalogItems(getManufacturers(), getRobots())),
      ),
  },
];

describe('catalog payload budgets', () => {
  for (const budget of budgets) {
    it(`${budget.name} stays within its byte budget`, () => {
      const actual = budget.bytes();
      // 実測値をログへ残す。上限を締め直すときはこの出力を使う。
      console.log(`[catalog-payload] ${budget.name}: ${actual}/${budget.maxBytes}`);
      expect(actual).toBeLessThanOrEqual(budget.maxBytes);
    });
  }
});
```

`maxBytes: 0`はplaceholderではなく、**Step 5で実測した値を入れてからcommitする**。実測値と上限をcommit messageへ残す。

`package.json`への配線は不要。`npm run check`の`test`が拾う。

- [ ] **Step 7: import境界ruleを追加する**

今回の事故の根本原因は「汎用search documentの再利用」である。機械的に止める。`scripts/check-data-import-boundaries.mjs`へ、`lib/viewModels/**`と`lib/catalog/**`が`lib/search.ts`／`lib/searchIndex.ts`を値importしないruleを足す。

**免除は設けない。** `lib/catalog/search.ts`は`normalizeSearchText`を`lib/normalizeSearchText.ts`から取るため免除は不要である（Task 5）。

`components/**`と`lib/**`全体への拡大は、`lib/useCaseFilters.ts`と`lib/searchIndex.ts`が残っている間はできない。**Task 8 Step 5で拡大する。**

- [ ] **Step 8: 回帰確認とcommit**

```bash
npm run typecheck && npm run lint && npm run test
npm run check:data-boundaries
npm run build && npm run test:e2e -- tests/e2e/catalog-url-state.spec.ts
```

手動: `/robots`で「Unitree」「G1」「物流」「二足」「限定販売中」が現行同様にhitすること。**逆に、紹介文にしか無い語（例「バッテリー」）がhitしなくなることを確認し、意図した変更として記録する。**

`lib/uiText.ts`のplaceholder（robots「ロボット名・メーカー・用途キーワードで検索」、manufacturers「メーカー名・地域・取扱ロボットで検索」）は本決定後の挙動と整合するため変更しない。0件時の空状態文言を確認する。

```bash
git add lib/catalog/search.ts lib/viewModels lib/robotFilters.ts lib/manufacturerFilters.ts \
  scripts/check-data-import-boundaries.mjs tests/unit/view-models
git commit -m "refactor: build catalog search text from displayed fields only"
```

---

### Task 7: Use case一覧をview model化する

**Goal:** `/use-cases`へraw `UseCase[]`を渡すのをやめ、view modelだけを渡す。

**MiniSearchは維持する。** 削減効果は実測18,690バイトにすぎず、`/reports`の生data 968,993やmotion 134,910と2桁違う。日本語検索品質（`fuzzy: 0.2`のタイポ許容、`Intl.Segmenter('ja')`の語境界分割）を落とす対価に見合わない。**`createUseCaseSearchIndex`が索引する文字列だけをcatalog searchTextへ差し替える。index構築のoption（`prefix`／`fuzzy`／`combineWith`／tokenizer）は一切変更しない。**

**Files:**
- Create: `lib/viewModels/useCases.ts`
- Create: `tests/unit/view-models/use-cases.test.ts`
- Modify: `lib/catalog/search.ts`
- Modify: `lib/searchIndex.ts`
- Modify: `lib/useCaseFilters.ts`
- Modify: `components/UseCasesBrowser.tsx`
- Modify: `components/UseCaseCard.tsx`
- Modify: `src/app/use-cases/page.tsx`
- Modify: `tests/unit/view-models/catalog-payload.test.ts`

**Interfaces:**
- Produces:
  - `createUseCaseCatalogItems(useCases, robots): UseCaseCatalogItem[]`
  - `createUseCaseCatalogSearchText(useCase, robotNames): string`

- [ ] **Step 1: VM型とsearchText builderを定義する**

`UseCase`に`description` fieldは**存在しない**。実fieldは`title`／`titleJa?`／`subtitle?`／`summary`（`BaseRecord`由来）／`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`／`maturityLevel`／`primaryIndustry`／`industryTags`／`taskTags`／`candidateRobots`／`atAGlance`／`requiredCapabilities`／`buyerReadiness`／`environment`。

`UseCaseCard.tsx:68`が描画するのは`subtitle ?? summary`である。したがって**両方をsearchTextに含める**。maturityのlabel mapは`maturityLabels`（`lib/labels.ts:223`）、fieldは`maturityLevel`である。

```ts
// lib/viewModels/useCases.ts
import type { CatalogTag } from '@/lib/viewModels/shared';

export interface UseCaseCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  /** cardは subtitle ?? summary を描画する。VMでは解決済みの1本にする。 */
  lead: string;
  maturity: CatalogTag;
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
// lib/catalog/search.ts（追記）
// @plan-check-skip: Task 6 で作る @/lib/catalog/search の joinSearchText を参照する。Task 7 でこのmarkerを外しbaselineを減らす
import type { UseCase } from '@/data/types';
import { joinSearchText } from '@/lib/catalog/search';
import { maturityLabels } from '@/lib/labels';

export function createUseCaseCatalogSearchText(
  useCase: UseCase,
  robotNames: readonly string[],
): string {
  return joinSearchText([
    useCase.titleJa,
    useCase.title,
    useCase.subtitle,
    useCase.summary,
    maturityLabels[useCase.maturityLevel],
    useCase.primaryIndustry,
    ...robotNames,
    ...useCase.industryTags,
    ...useCase.taskTags,
  ]);
}
```

`overview`／`whyItMatters`／`whyHardToday`／`environmentRequirements`／`japanDeploymentConditions`／`capabilityNotes`／`sources`は含めない。

- [ ] **Step 2: 失敗するtestを書く**

```ts
// tests/unit/view-models/use-cases.test.ts
// @plan-check-skip: Task 7 で作る @/lib/viewModels/useCases を参照する。Task 7 でこのmarkerを外しbaselineを減らす
import { describe, expect, it } from 'vitest';
import { getRobots, getUseCases } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createUseCaseCatalogItems } from '@/lib/viewModels/useCases';

describe('use case catalog view models', () => {
  const items = createUseCaseCatalogItems(getUseCases(), getRobots());

  it('excludes editorial fields', () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"candidateRobots"');
    expect(json).not.toContain('"capabilityNotes"');
  });

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.filter.searchText).join(' '));

    for (const useCase of getUseCases()) {
      const bodyValues: string[] = [
        useCase.overview,
        useCase.whyItMatters,
        useCase.whyHardToday,
        useCase.environmentRequirements,
        useCase.japanDeploymentConditions,
        ...Object.values(useCase.capabilityNotes),
      ];

      for (const value of bodyValues) {
        if (typeof value !== 'string' || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
```

- [ ] **Step 3: factoryを実装する**

`UseCasesBrowser`／`UseCaseCard`が現在client側で解決しているもの（maturity label/tone、evidence summary、robot names、`subtitle ?? summary`）をそのままserver側へ移し、`UseCaseCatalogItem`へ詰める。既存のlabel・tone・evidence helperを再利用する。

- [ ] **Step 4: filterとMiniSearchをVM入力へ変える**

`lib/useCaseFilters.ts`から`import { createUseCaseSearchDocument, matchesSearchDocument } from '@/lib/search';`を削除する。filterは`UseCaseCatalogItem`を受け、`item.filter.*`だけを見る。テキスト絞り込みは現行どおりMiniSearchの結果slug集合（`matchedSlugs`）で行う。

`lib/searchIndex.ts`の`createUseCaseSearchIndex`のsignatureを`readonly UseCaseCatalogItem[]`へ変え、索引textを差し替える。

```ts
// lib/searchIndex.ts
// @plan-check-skip: index 生成関数の内側だけの抜粋
index.addAll(
  useCases.map((useCase) => ({
    id: useCase.slug,
    // 索引対象は catalog searchText（本文を含まない）。MiniSearch の option は変更しない。
    text: useCase.filter.searchText,
  })),
);
```

`SEARCH_OPTIONS`（`prefix: true`、`fuzzy: 0.2`、`combineWith: 'AND'`）と`tokenizeJa`は**変更しない**。

- [ ] **Step 5: componentとpageをVMへ変える**

`UseCasesBrowser`は`items: UseCaseCatalogItem[]`を受ける。`UseCaseCard`は`item: UseCaseCatalogItem`だけを受け、label/tone解決を呼ばない。`src/app/use-cases/page.tsx`で`createUseCaseCatalogItems(getUseCases(), getRobots())`を生成して渡す。`src/app/use-cases/page.tsx:10`の`createUseCaseSearchIndex` importは削除する。

- [ ] **Step 6: payload budgetへuse-caseを足す**

`tests/unit/view-models/catalog-payload.test.ts`の`budgets`へ`useCases`を追加し、上限は実測値 + 15%とする。

- [ ] **Step 7: 実測と回帰確認**

```bash
npm run test -- tests/unit/view-models/use-cases.test.ts
npm run test -- tests/unit/view-models/catalog-payload.test.ts
npm run typecheck && npm run lint && npm run build && npm run check:bundle-content
rg -n "from '@/lib/search'" lib components
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
const e=s.find(x=>x.route==='/use-cases');
console.log('/use-cases route-specific =', e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0));
"
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

**完了条件:** `/use-cases`のroute固有JSが`lib/search.ts`分だけ減る。`rg`の残りが`lib/searchIndex.ts`（Task 8で解消）だけになる。

手動: `/use-cases`の検索で日本語・英語・ロボット名・複数語queryが現行同様にhitし、**タイポ許容（`fuzzy: 0.2`）が維持されている**こと（例「ロボツト」で「ロボット」がhitする）。tab、pagination、空状態を確認する。

- [ ] **Step 8: commit**

```bash
git add lib/viewModels/useCases.ts lib/catalog/search.ts lib/searchIndex.ts lib/useCaseFilters.ts \
  components/UseCasesBrowser.tsx components/UseCaseCard.tsx src/app/use-cases/page.tsx \
  tests/unit/view-models/catalog-payload.test.ts tests/unit/view-models/use-cases.test.ts
git commit -m "refactor: send catalog view models to the use case client"
```

---

### Task 8: Reports一覧をview model化する

**Goal:** `/reports`へraw `Article[]`を渡すのをやめ、view modelだけを渡す。Task 1で意図的に残した`Article[]` propsを解消する。

**MiniSearchは維持する**（Task 7と同じ方針）。

**Files:**
- Create: `lib/viewModels/articles.ts`
- Create: `tests/unit/view-models/articles.test.ts`
- Modify: `lib/catalog/search.ts`
- Modify: `lib/searchIndex.ts`
- Modify: `lib/articleFilters.ts`
- Modify: `components/ReportsBrowser.tsx`
- Modify: `components/NewsCard.tsx` / `NewsFeatureCard.tsx` / `NewsHeroCarousel.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `lib/uiText.ts`
- Modify: `tests/unit/view-models/catalog-payload.test.ts`
- Modify: `scripts/check-data-import-boundaries.mjs`

**Interfaces:**
- Produces:
  - `createArticleCatalogItems(articles): ArticleCatalogItem[]`
  - `createArticleCatalogSearchText(article): string`

- [ ] **Step 1: VM型とsearchText builderを定義する**

`Article = StandardArticle | ManufacturerGuideArticle`。両方が`ArticleCommon extends BaseRecord`を継承する。本文は`whyItMatters`／`keyTakeaways`（`ArticleCommon`）、`body`（`StandardArticle`のみ）、`manufacturerGuideContent`（`ManufacturerGuideArticle`のみ）である。**`createReportSearchDocument`が実際に索引していた本文は`whyItMatters`と`keyTakeaways`であり、`body`／`manufacturerGuideContent`は元から入っていない。**

`summary`を全件に持たせる理由は「cardに表示するから」では**ない**。`NewsCard`は`summary`を描画せず、描画するのは`NewsFeatureCard.tsx:54`と`NewsHeroCarousel.tsx:131`、つまりhero/featureに選ばれた数件だけである。それでも全件に持たせるのは、**placementがserver側で決まりVMの形をplacement依存にしたくないため、かつ記事数が少なく全件保持のコストが許容範囲だから**。この理由付けを誤ると、次に同じ判断をする人が誤って一般化する。

```ts
// lib/viewModels/articles.ts
import type { ArticleShelf } from '@/lib/articleShelves';
import type { CatalogImage, CatalogTag } from '@/lib/viewModels/shared';

export interface ArticleCatalogItem {
  id: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  publishedAt: string;
  type: CatalogTag;
  shelf: ArticleShelf;
  themeTags: string[];
  heroImage?: CatalogImage;
  searchText: string;
}
```

```ts
// lib/catalog/search.ts（追記）
// @plan-check-skip: Task 6 で作る @/lib/catalog/search の joinSearchText を参照する。Task 8 でこのmarkerを外しbaselineを減らす
import type { Article } from '@/data/types';
import { joinSearchText } from '@/lib/catalog/search';
import { articleTypeLabels } from '@/lib/labels';

export function createArticleCatalogSearchText(article: Article): string {
  return joinSearchText([
    article.titleJa,
    article.title,
    article.summary,
    articleTypeLabels[article.type],
    ...(article.themeTags ?? []),
  ]);
}
```

`whyItMatters`／`keyTakeaways`／`body`／`manufacturerGuideContent`／`sources`／`relatedRobotIds`は含めない。

- [ ] **Step 2: 失敗するtestを書く**

```ts
// tests/unit/view-models/articles.test.ts
// @plan-check-skip: Task 8 で作る @/lib/viewModels/articles を参照する。Task 8 でこのmarkerを外しbaselineを減らす
import { describe, expect, it } from 'vitest';
import { getArticles } from '@/lib/data';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { createArticleCatalogItems } from '@/lib/viewModels/articles';

describe('article catalog view models', () => {
  const items = createArticleCatalogItems(getArticles());

  it('excludes editorial fields', () => {
    const json = JSON.stringify(items);
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"body"');
    expect(json).not.toContain('"manufacturerGuideContent"');
    expect(json).not.toContain('"relatedRobotIds"');
  });

  it('excludes body text values, not just their keys', () => {
    const haystack = normalizeSearchText(items.map((item) => item.searchText).join(' '));

    for (const article of getArticles()) {
      const bodyValues = [article.whyItMatters, ...(article.keyTakeaways ?? [])];
      for (const value of bodyValues) {
        if (!value || value.length < 12) continue;
        expect(haystack).not.toContain(normalizeSearchText(value));
      }
    }
  });
});
```

- [ ] **Step 3: factoryを実装し、hero/feature/gridをVMへ変える**

`getDisplayableAsset()`の戻り値は`{ src, alt }`へ写像し、rights/source metadataを含めない。

`src/app/reports/page.tsx`はTask 1で作ったplacement解決の**後**にVM化する。`getArticleIndexPlacementReports`は`{ id, publishedAt }`を要求するgenericなので、VMをそのまま渡せる。

```tsx
// src/app/reports/page.tsx
// @plan-check-skip: 既存importと関数外の文脈を省いた抜粋
const items = createArticleCatalogItems(getArticles());
const { heroReports, featureReports } = getArticleIndexPlacementReports({
  articles: items,
  placements: localContentSnapshot.articlePlacements,
  limits: localContentSnapshot.articleIndexPlacementLimits,
});

return (
  <ReportsBrowser
    reports={items}
    heroReports={heroReports}
    featureReports={featureReports}
    initialSearch={toInitialSearch(params)}
  />
);
```

`ReportsBrowser`のprops型を`ArticleCatalogItem[]`へ変える。`NewsCard`／`NewsFeatureCard`／`NewsHeroCarousel`も`ArticleCatalogItem`を受ける。

- [ ] **Step 4: MiniSearchの索引対象を差し替える**

Task 7と同形。`createArticleSearchIndex`のsignatureを`readonly ArticleCatalogItem[]`へ変え、`text: article.searchText`とする。option（`prefix`／`fuzzy`／`combineWith`／`tokenizeJa`）は変更しない。

`lib/searchIndex.ts`から`import { createReportSearchDocument, createUseCaseSearchDocument } from '@/lib/search';`を削除する。**この時点で`lib/search.ts`のclient側到達経路が0になる。**

- [ ] **Step 5: import境界ruleを全面適用する**

`scripts/check-data-import-boundaries.mjs`のruleを、`components/**`と`lib/**`（`lib/search.ts`自身を除く）から`lib/search.ts`を値importしないところまで広げる。

```bash
rg -n "from '@/lib/search'|from './search'" components lib src tests
```

Expected: 0件。

- [ ] **Step 6: payload budgetへreportsを足し、実測する**

```bash
npm run test -- tests/unit/view-models
npm run check:data-boundaries
npm run typecheck && npm run lint && npm run build && npm run check:bundle-content
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

**完了条件:** 4 routeすべてがroute固有JS ≤ 180,000。超えるrouteがある場合は、そのrouteのroute固有chunkを1本ずつsize順に出して原因moduleを特定し、**上限を緩める前に原因を記録する**。

- [ ] **Step 7: 回帰確認**

```bash
npm run test:e2e -- tests/e2e/public-routes.spec.ts tests/e2e/catalog-url-state.spec.ts
```

手動: `/reports`のhero carousel、feature card、shelf tab、pagination、検索。**hero/featureに出る記事のidと順序がTask 1 Step 6で記録した値と一致すること。** タイポ許容が維持されていること。

`lib/uiText.ts`のreports placeholder「タイトル・トピック・キーワードで検索」は本文検索を想起させるため、この時点で文言を再検討する。0件時の空状態文言も併せて確認する。

- [ ] **Step 8: commit**

```bash
git add lib/viewModels/articles.ts lib/catalog/search.ts lib/searchIndex.ts lib/articleFilters.ts \
  components/ReportsBrowser.tsx components/NewsCard.tsx components/NewsFeatureCard.tsx \
  components/NewsHeroCarousel.tsx src/app/reports/page.tsx lib/uiText.ts \
  scripts/check-data-import-boundaries.mjs \
  tests/unit/view-models/articles.test.ts tests/unit/view-models/catalog-payload.test.ts
git commit -m "refactor: send catalog view models to the reports client"
```

---

### Task 9: Compareをview modelと責務別componentへ分割する

**Goal:** `/compare`へraw `Robot[]`を渡すのをやめる。`CompareClient`を責務別に分割する。

**Files:**
- Create: `lib/viewModels/compare.ts`
- Create: `components/compare/CompareMenu.tsx`
- Create: `components/compare/CompareSheet.tsx`
- Create: `components/compare/CompareViewToggle.tsx`
- Create: `tests/unit/view-models/compare.test.ts`
- Create: `tests/e2e/compare.spec.ts`（既存が無い場合）
- Modify: `components/CompareClient.tsx`
- Modify: `components/ComparisonRobotPanel.tsx`
- Modify: `components/FavoriteCard.tsx`
- Modify: `components/compare/CompareParts.tsx`
- Modify: `src/app/compare/page.tsx`

**Interfaces:**
- Produces: `createCompareRobotViewModels(robots, manufacturers): CompareRobotViewModel[]`

- [ ] **Step 1: Compare VMを定義する**

比較表は`comparison.strengths`等を**実際に描画する**ため、compare VMではこれを含める。Global Constraint 4は「一覧の`searchText`へ本文を連結しない」であり、描画する値をVMへ載せることは対象外である。

```ts
// lib/viewModels/compare.ts
import type { ComparisonSpecGroup } from '@/lib/robotDisplay';
import type { CatalogImage, CatalogLogo } from '@/lib/viewModels/shared';

export interface CompareRobotViewModel {
  id: string;
  href: string;
  name: string;
  manufacturer: CatalogLogo & { id: string; name: string };
  image?: CatalogImage;
  /** menu検索用。lib/catalog/search.ts の createRobotCatalogSearchText と同じ範囲。 */
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

- [ ] **Step 2: 禁止field testを書く**

```ts
// tests/unit/view-models/compare.test.ts
// @plan-check-skip: Task 9 で作る @/lib/viewModels/compare を参照する。Task 9 でこのmarkerを外しbaselineを減らす
import { describe, expect, it } from 'vitest';
import { getManufacturers, getRobots } from '@/lib/data';
import { createCompareRobotViewModels } from '@/lib/viewModels/compare';

describe('compare view models', () => {
  it('does not serialize raw evidence or pricing records', () => {
    const json = JSON.stringify(createCompareRobotViewModels(getRobots(), getManufacturers()));
    expect(json).not.toContain('"sources"');
    expect(json).not.toContain('"fieldEvidence"');
    expect(json).not.toContain('"priceOffers"');
    expect(json).not.toContain('"usageExampleSourceUrls"');
  });
});
```

- [ ] **Step 3: child componentをVM入力へ変える**

`ComparisonRobotPanel`は`robot: CompareRobotViewModel`を受け、image → `robot.image`、link → `robot.href`、specs → `robot.specGroups`、manufacturer → `robot.manufacturer`、drawer lists → `robot.comparison`へ置換する。`FavoriteCard`と`MenuRobotButton`もVMだけを受ける。

`ComparisonRobotPanel`のpointer判定はTask 4で作った`useMediaQuery`を使う。

- [ ] **Step 4: coordinatorを4責務へ分ける**

`CompareClient`に残すstate: `searchParams`から解決したselected IDs/view、favorites、`menuQuery`、child callbackでURLを更新する関数。

- `CompareMenu`へ: manufacturer grouping、menu search、flyout/open state、mobile manufacturer select
- `CompareSheet`へ: ordered IDs、DnD sensors/overlay、selected cards、visual/specs layout
- `CompareViewToggle`へ: visual/specs button、toast、`onChange(view)`

各fileを250行未満にする。共有stateは新しいcontextへ隠さず、typed propsで渡す。**DnD sensorの設定値は変えない**（責務移動のみ）。

- [ ] **Step 5: pageからVMだけを渡す**

```tsx
// src/app/compare/page.tsx
// @plan-check-skip: 既存importと関数外の文脈を省いた抜粋
const items = createCompareRobotViewModels(getRobots(), getManufacturers());
return <CompareClient items={items} initialSearch={toInitialSearch({ compare, view })} />;
```

- [ ] **Step 6: E2Eを書いて検証する**

```ts
// tests/e2e/compare.spec.ts
import { expect, test } from '@playwright/test';

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

```bash
npm run test -- tests/unit/view-models/compare.test.ts
npm run typecheck && npm run lint && npm run build && npm run check:bundle-content
npm run test:e2e -- tests/e2e/compare.spec.ts
```

手動: 機種選択、DnDによる並べ替え、visual/specs切替、favorite、mobile幅でのmenu操作。

- [ ] **Step 7: commit**

```bash
git add lib/viewModels/compare.ts components/CompareClient.tsx components/ComparisonRobotPanel.tsx \
  components/FavoriteCard.tsx components/compare src/app/compare/page.tsx \
  tests/unit/view-models/compare.test.ts tests/e2e/compare.spec.ts
git commit -m "refactor: split compare client around display view models"
```

---

### Task 10: route固有JSをhard gate化し、後片付けする

**Goal:** 実測値から上限を確定してgateにし、利用者が消えたmoduleを削除する。

**Files:**
- Create: `scripts/check-client-budgets.mjs`
- Modify: `package.json`
- Modify: `docs/reference/refactor-baseline-2026-07-26.md`
- Modify: `docs/README.md`
- Modify: `docs/plans/pre-migration-refactor-implementation-index-v1.md`
- Delete: `lib/search.ts`

- [ ] **Step 1: route固有JSを実測する**

```bash
npm run build
node -e "
const s=require('./.next/diagnostics/route-bundle-stats.json');
const fs=require('fs');
const floor=new Set(s.find(x=>x.route==='/privacy').firstLoadChunkPaths);
for(const r of ['/robots','/manufacturers','/use-cases','/reports','/compare']){
  const e=s.find(x=>x.route===r);
  const own=e.firstLoadChunkPaths.filter(p=>!floor.has(p)).reduce((a,p)=>a+fs.statSync(p).size,0);
  console.log(r.padEnd(16), 'total=', e.firstLoadUncompressedJsBytes, 'own=', own);
}"
```

- [ ] **Step 2: budget scriptを書く**

上限は**Step 1で測った4 routeの最大値 + 15%**とする。180,000は初期目標であり、実測がそれを下回るなら締め直す。誰も近づかない上限はgateとして働かない。

```js
// scripts/check-client-budgets.mjs
import fs from 'node:fs';

const stats = JSON.parse(fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'));
const floor = new Set(stats.find((entry) => entry.route === '/privacy').firstLoadChunkPaths);

// Task 10 Step 1 の実測最大値 * 1.15。共有フロアはPhase 5の対象外なので除外して測る。
const MAX_ROUTE_SPECIFIC_BYTES = 0;
const routes = ['/reports', '/robots', '/manufacturers', '/use-cases'];

let failed = false;
for (const route of routes) {
  const entry = stats.find((item) => item.route === route);
  if (!entry) {
    console.error(`[client-budget] missing route: ${route}`);
    failed = true;
    continue;
  }
  const own = entry.firstLoadChunkPaths
    .filter((chunk) => !floor.has(chunk))
    .reduce((total, chunk) => total + fs.statSync(chunk).size, 0);
  console.log(`[client-budget] ${route}: ${own}/${MAX_ROUTE_SPECIFIC_BYTES}`);
  if (own > MAX_ROUTE_SPECIFIC_BYTES) failed = true;
}
if (failed) process.exitCode = 1;
```

**共有フロアを引いて測る**ことで、framework更新でフロアが動いてもgateが誤爆しない。`MAX_ROUTE_SPECIFIC_BYTES`はStep 1の実測値を入れてからcommitする。

`package.json`の`check` pipelineへ`check:bundle-content`の直後に挿入する。

- [ ] **Step 3: `lib/search.ts`を削除する**

```bash
rg -n "from '@/lib/search'|from './search'" components lib src tests scripts
```

Expected: 0件。0件なら`lib/search.ts`を削除する。1件でも残る場合は削除せず、残存利用者と理由を`docs/reference/refactor-baseline-2026-07-26.md`へ記録して後続phaseへ送る。

`lib/searchIndex.ts`は**残す**（MiniSearch維持）。

- [ ] **Step 4: raw props境界を再確認する**

```bash
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\[\]" components
rg -n "useUrlParamUpdater|router\.(push|replace)" components lib
```

Expected: どちらも0件。

- [ ] **Step 5: baseline文書へafter値を記録する**

`docs/reference/refactor-baseline-2026-07-26.md`へ「Phase 5 after」節を追加し、route別にbefore／after／削減バイト／削減率を記録する。**総量とroute固有JSの両方**を載せ、共有フロアの値も併記する。

併せて後続phase向けに1点記録する。共有フロアの`37mz4g7000ovi.js`（70,848バイト）は`sonner`（toast）・`lucide`・`motion`・`@vercel/analytics`を含み、`src/app/layout.tsx`の`<Toaster />`により`/privacy`のような静的ページにも配信されている。**Phase 5の対象外だが、フロアのうち手を付けられる部分として記録する。**

`motion/react`がdependenciesから外せなかった場合は、残存利用者（Home側）も併記する。

- [ ] **Step 6: doc governanceに従って片付ける**

`ai/rules/80-doc-governance.md`のCompletion Ruleに従い、phase完了時に:

1. この計画書を`docs/archive/`へ移動する（**移動と内容変更は別commit。移動が先**）
2. `docs/README.md`の「いま動いているもの」表から行を削除する
3. `docs/plans/pre-migration-refactor-implementation-index-v1.md`のPhase 5行を更新する
4. 移動後に`rg --no-ignore -l 'refactor-phase-05-client-boundaries-v1'`で参照を洗い、live referenceを直す（`docs/archive/`内の参照は直さない）

- [ ] **Step 7: commit**

```bash
git add scripts/check-client-budgets.mjs package.json docs/reference/refactor-baseline-2026-07-26.md
git commit -m "test: enforce catalog route-specific JS budgets"

git rm lib/search.ts
git commit -m "chore: remove the unused search document module"
```

---

## Phase completion

`docs/plans/pre-migration-refactor-implementation-index-v1.md` §4のPhase完了gateに従う。

```bash
git status -sb
git diff --check
npm run check
git diff --stat refactor/integration-20260726...HEAD
git log --oneline refactor/integration-20260726..HEAD
```

Phase 5固有の追加確認:

```bash
# raw配列がclient propsへ渡っていない
rg -n "(robots|manufacturers|useCases|reports): (Robot|Manufacturer|UseCase|Article)\[\]" components
# 本文を含むsearch documentがclient graphに無い
rg -n "from '@/lib/search'|from './search'" components lib src tests
# 旧URL updaterとRSC再取得が無い
rg -n "useUrlParamUpdater|router\.(push|replace)" components lib
# DB query / server action / API route / async repository を追加していない
rg -n "'use server'|\"use server\"" components lib src
fd -t f 'route\.(ts|tsx)$' src/app
# catalog routeにmotionが戻っていない
rg -n "motion/react|useTiltCardEffect" \
  components/ui/AnimatedTooltip.tsx components/PageTabBar.tsx components/ReportsHeader.tsx \
  components/RobotCard.tsx components/ManufacturerCard.tsx components/UseCaseCard.tsx \
  components/NewsHeroCarousel.tsx components/ui/card-hover-effect.tsx components/uilayouts/carousel.tsx
```

Expected: すべて0件。

`npm run check`のpipelineに次の5つが揃っていることを確認する。**それぞれ別の経路を測っており、1つでも欠けると本phaseの制約を守れない。**

| gate | 導入 | 測る対象 | これ単独では検知できないもの |
|---|---|---|---|
| `check:client-imports` | Task 2 | source（`'use client'`から`data/**`への到達） | build時のchunk構成 |
| `check:bundle-content` | Task 2 | client chunkのrecord slug数とサイズ | VM経由で連結された本文 |
| `check:plan-snippets` | Task 2 | 計画書のcode例と実型の一致 | 実装そのもの |
| `catalog-payload.test.ts`（vitest） | Task 6 | VM factory出力のバイト数（RSC payload） | import chain経由の流出 |
| `check:client-budgets` | Task 10 | route固有JSのバイト数 | RSC payloadの肥大 |

**route固有JSの最終確認:**

```bash
npm run check:client-budgets
```

---

## リスクと軽減策

| リスク | 影響 | 軽減策 |
|---|---|---|
| chunkはmoduleと1:1ではないため、削減見込みが外れる | task完了条件を満たせない | 各taskで**削減後を必ず実測**し、見込みではなく実測値を記録する。外れたら次taskへ進む前に原因chunkを特定する |
| Task 3・4のCSS置換でtooltip/carousel/hoverの挙動が変わる | UX劣化 | 390/1440幅のscreenshotと`accessibility-smoke.spec.ts`。`prefers-reduced-motion`とkeyboard操作を個別に確認 |
| Task 6で検索範囲が狭まる | 本文中の語で検索できなくなる。**退避先が無い**（全体検索ページが存在しない） | 意図した仕様変更として記録。placeholderと0件時文言を確認。復活方式は後続phaseへ起票 |
| Task 8でhero/feature placementの並びが変わる | 記事の露出が変わる | Task 1 Step 6でhero/feature記事idと順序を記録し、Task 8 Step 7で一致を確認 |
| Task 4の`useReducedMotion` → `useMediaQuery`でSSR時の値が`null`→`false`に変わる | autoplayの初期挙動 | どちらもfalsyで判定が変わらないことをcode上で確認。hydration後の挙動をscreenshotで確認 |
| `lib/search.ts`削除後にdetail pageやscriptが壊れる | build失敗 | Task 10 Step 3の`rg`が0件のときだけ削除する。1件でも残れば削除しない |
| Task 9のcompare分割でDnDが壊れる | 比較操作の破綻 | E2Eと手動確認。分割は責務移動のみでDnD sensorの設定値は変えない |
| `check:plan-snippets`のskipが増えてgateが形骸化する | 計画書の誤りが再び素通りする | skip総数をbaselineと比較し、増加を失敗にする。検査は既定でON |
| gate scriptが`lib/*.ts`をimportできず動かない | Task 2・6が着手時に止まる | Nodeは`@/`も拡張子なし相対importも解決しない（実測確認済み）。**bundle-content gateは`data/*.ts`を直接読み、payload budgetはvitest testにする**。plain nodeから読めるのは依存が浅いmoduleだけ |
| CSS化したdot indicatorが呼び出し元のgap上書きでずれる | hero carouselの見た目が崩れる | offsetを定数計算せずDOMから測る（Task 4 Step 4）。最後のdotで重なることを手動確認する |

---

## 手動確認チェックリスト

各routeについて、390 / 768 / 1280 / 1440幅で確認する。

**`/robots`**
- [ ] card表示、favorite、compare追加、popoverが現行と同じ
- [ ] tab tooltipがhover・focus両方で出てEscapeで閉じる
- [ ] 検索: 機種名・メーカー名・用途タグ・stage labelがhitする
- [ ] 検索: 紹介文中の語がhitしなくなっている（意図した変更）
- [ ] filter変更でURLが更新され、back/forwardで復元される

**`/manufacturers`**
- [ ] card表示、logo、代理店表示が現行と同じ
- [ ] 検索: 社名・国・都市・取扱ロボット名がhitする

**`/use-cases`**
- [ ] cardのtitle・lead（`subtitle ?? summary`）・maturity・robot namesが現行と同じ
- [ ] tilt/glowが消え、shimmerとaccent lineが残っている
- [ ] 検索: タイポ許容（`fuzzy: 0.2`）が維持されている

**`/reports`**
- [ ] hero carouselが自動再生し、prev/next・swipe・dotで操作できる
- [ ] hero/featureに出る記事のidと順序がTask 1 Step 6の記録と同じ
- [ ] shelf tab、pagination、空状態
- [ ] 検索: タイポ許容が維持されている

**`/compare`**
- [ ] 機種選択、DnD並べ替え、visual/specs切替、favorite
- [ ] mobile幅でmenuが操作できる
- [ ] reload・back/forwardで選択とviewが復元される

**`/robots/[slug]`（副作用確認）**
- [ ] `RobotImageCarousel`が壊れていない（Task 4で同じmoduleに触れるため）

**共通**
- [ ] `prefers-reduced-motion: reduce`で全routeのtransitionとautoplayが止まる
- [ ] console errorとhydration errorが出ない
- [ ] 横スクロールが発生しない（`mobile-overflow.spec.ts`と併せて）
