# Phase 6 セッション引き継ぎ

> **この文書は一時ファイル。** 引き継ぎ完了後は削除してよい。
> 恒久的な情報（制約・task・実測値）は計画書側にあり、ここには**重複させない**。
> ここに書くのは「計画書を読んでも分からないこと」だけ。

作成: 2026-08-03 / 対象branch: `refactor/06-ui-accessibility`

---

## 0. 最初に読むもの（この順）

| # | ファイル | 何が書いてあるか |
|---|---|---|
| 1 | 本ファイル | git状態、決定の理由、既知の罠 |
| 2 | `docs/plans/refactor-phase-06-ui-accessibility-v1.md` | Phase 6 の正本。**Task 5a だけ未着手** |
| 3 | `docs/plans/pre-migration-refactor-implementation-index-v1.md` | プログラム全体（Phase 0〜7）の正本 |
| 4 | `docs/plans/pre-migration-refactor-safety-design-v1.md` | branch運用・安全設計のルール |
| 5 | `docs/decisions/design_system_v1.md` §4 / `ui_architecture_and_development_policy_v1.md` §9 | **Phase 6 で書いた UI 契約。実装前に読むこと** |

`AGENTS.md` → `ai/rules/00-index.md` → 各work-type ruleも通常どおり適用される。

---

## 1. 未コミットの変更はない

`npm run check` 全通過（unit 59 / e2e 59 / lint は既存warning 4件のみ、errorは0）。

---

## 2. git の位置関係

```
origin/main = df53b11（PR #6 で Phase 2〜5 ＋ 世界地図まで反映済み。本番デプロイ済み）
│
└ 0f92b2a "feat: center the world map on Japan"   ← main に含まれる。ここが分岐元
   └ refactor/06-ui-accessibility   ← 現在地。12 commit 先行。**未push**
```

- `refactor/integration-20260726` は **main に取り込み済み**。もう先行していない。
- Phase 6 branch は main に含まれるコミットから分岐しているので、main へのマージは素直に通る。
- **`main` への push は本番デプロイを誘発する**（Vercel link 済み。safety design §4.3 ルール9）。
  人間の承認なしに push しないこと。

### 作業場所

```
worktree: /Users/hori/Desktop/Humanoid_curation_website/Deploid_toB/.worktrees/refactor-06-ui-accessibility
branch:   refactor/06-ui-accessibility
```

**main checkout（`Deploid_toB/` 直下）で作業しないこと。** safety design が integration への直接
commit を禁止している。シェルの作業ディレクトリは `cd` で持続するため、取り違えると
同じパスの別バージョンを見て誤った結論を出す（このプログラムで実際に2回起きた）。

**ユーザーに画面確認を頼むときは、dev server を必ずこの worktree で起動してもらうこと。**
親 checkout で起動すると、いま書いた変更が一切入っていない画面を見せることになる（実際に起きた）。

---

## 3. Phase 6 の進捗

| Task | 状態 | commit |
|---|---|---|
| 1 見出しと一覧ヘッダ構造の統一 | ✅ 完了 | `88bccd0` `04d2ef2` `f845272` |
| 2 PageTabBar へ tab semantics | ⛔ **実施しない**（人間が決定） | — |
| 3 carousel の pause と現在位置 | ✅ 完了 | `e59cdf8` ＋ `5f41685`(slide semantics) |
| 4 focus 復元と keyboard journey | ✅ 完了 | `0c8d463` |
| 5a 4幅 visual regression | ⬜ **未着手。ここから** | — |
| 5b color-contrast 218箇所 | ⏭ 後続phaseへ（index に起票済み） | — |
| 6 decision docs への明文化 | ✅ 完了 | `5056cb4` `ceb837a` |

**Task 6 を 5a より先にやった。** 5a が Task 6 へ渡す内容は「確認幅 390/768/1280/1440」の1行だけで
既に確定しており、知識移転を後回しにする理由がなかったため。

---

## 4. 決定済みの事項（再検討しないこと）

| 決定 | 一行要約 |
|---|---|
| **Task 2 は実施しない** | `PageTabBar` に `role=tab` を付けない。URL が変わるナビゲーションであり、ページ内パネルの差し替えではない。`design_system_v1.md:305` が明記しており、PR #5 で一度入って差し戻された経緯もある |
| axe の閾値は **critical のまま** | serious へ上げると全6 route で 218件。全て `color-contrast`。「違反0の状態で gate を入れる」原則に反する |
| `tests/components/news-hero-carousel.test.tsx` は **作らない** | 検証したいのは embla の実挙動（5秒待って進まない等）で、jsdom では測れない。e2e で代替済み |
| `src/app/globals.css` は **触らない** | 本phaseで一度も変更しておらず、focus-visible / reduced-motion に不具合の実測がない。配色は Task 5b |
| `/reports` の主軸タブが追従ヘッダの中だけにある件 | **既知の逸脱として規定に明記のうえ繰り越し**。本文のどこへ移すかはレイアウト判断が要る |

---

## 5. 既知の罠

### ① 計画書の腐り（このプログラム最大の故障モード。**3回**発生）

**症状:** 「散文で決めたことが、コード例・step・表のどれかに反映されない」。

3回目が最悪だった。Task 1 Step 2 のコード例が `SearchInput` へ `label=` を渡す形のまま
残っており、**それはユーザーが画面で見つけた不具合の原因そのもの**で、`04d2ef2` で削除した
ものだった。計画に従って実装するとバグが再発する状態だった。

**原因は突合の判定基準。** 「参照先のファイルが実在するか」で判定していたため、
本文の矛盾が残った。Task 4 を「前提のずれなし」と判定したのがその例で、実際には
同じ文書内の Task 2 の決定と正面から矛盾する test 例（`role="tab"` + 矢印キー）が
本文にあった。**誤った判定が次の作業範囲を汚染する。**

**対策（必ず守ること）:** タスク完了時に

1. 本文のコード例を**現物と1行ずつ照合**する（ファイルの実在確認では不十分）
2. 注記を追記して終わりにしない。**本文を書き換える**
3. 「やらなかった」ものは打ち消し線＋理由を残す。黙って消さない

`npm run check:plan-snippets` は front-matter に `snippetCheck: true` を書いた計画書の
`ts` block だけを `tsc --noEmit` にかける。Phase 6 計画は現状 **opt-in していない**
（コード例が実装の抜粋であって単体でコンパイルできる形ではないため）。人力照合が要る。

### ② e2e の navigation timeout

テストが59件へ増えた時点で、**3回に1回、毎回別のテストで** `page.goto` が30秒 timeout した。

原因はテスト対象の単一 `next start` プロセス。PPR の初回レンダリングは route ごとに実費が
かかり、複数 worker が同じ重い route へ**同時に初回アクセス**すると SSR が詰まる。

`tests/warmRoutes.ts` を `globalSetup` に置き、計測前に各 route を1回ずつ順番に叩いて
初回コストを払い切る形で解決した。38〜42秒 → 20〜22秒で安定。

**Task 5a で visual regression（12枚の撮影）を足すと再び重くなる。** 落ちたらまずここを疑う。
timeout を延ばして隠す前に、warm 対象の route が足りているかを見ること。

### ③ embla の autoplay イベントが listener へ届かない

`autoplay:play` / `autoplay:stop` を購読しても呼ばれず、`stop()` は効いている
（6.5秒進まない）のにボタンの表示だけが古いまま残る事象を実測した。
`useSyncExternalStore` でも `emblaApi.on(...)` でも再現。

**クリックハンドラ内で state を直接更新すること。** イベント購読だけに任せる形へ
「きれいに」書き直すと表示が壊れる。`components/CarouselAutoplayButton.tsx` にコメントで残してある。

### ④ 全gate緑でも見た目の不具合は出る

Task 1 の検索窓ズレは、H1 の**個数**は測っていたが**位置関係**を誰も測っていなかったために
出荷され、ユーザーが画面を見て初めて見つかった。**Task 5a の visual regression が埋めるべき穴はここ。**

### ⑤ decision docs が実装から遅れる

Phase 5 が削除したモジュール（`lib/search.ts`・`useUrlParamUpdater`・`FacetFilterBar`＋
`facetConfig`）への参照が、`status: current` の5ファイルに11箇所残っていた。`5056cb4` で是正済み。

**削除を伴う phase の完了時は、`docs/decisions/` と `ai/rules/` を grep すること。**

---

## 6. 次の一手

**Task 5a（4幅 visual regression）。** 計画書の Task 5a は再調査済みで、着手前の確認事項
（`<main>` の実在、reduced motion で carousel が1枚目に固定される理由、`/reports` の
1ページ件数が画面幅で変わること）も本文に書いてある。

この task の本体は **12枚のスクリーンショットを人間が目視する工程**。
overflow・重なり・切れ・要素の欠落を見てもらってから baseline を commit する。

その後: Phase 6 完了 → main へマージ（**要承認。本番デプロイ**）→ Phase 7。

---

## 7. 環境メモ

- `npm run check` が全gateのpipeline。個別scriptは `package.json` を参照
- e2e は専用 port 3399 で毎回自前のサーバを起動する（`reuseExistingServer: false`）。
  既存サーバを再利用すると親checkoutのサーバに当たり、**いま書いたコードを一度も
  テストしないまま全件緑になる**（2026-08-02に実際に発生したため修正済み）
- `workers: 2` は固定。増やすと①②の timeout が出る
- Node 22系。`data/*.ts` を読む script は `--experimental-strip-types` 付き。
  この形式では tsconfig の `paths`（`@/`）と拡張子なし import が解決できない
- Vercel プロジェクトへ link 済み（safety design §4.3 ルール9）
- lint の warning 4件（`@next/next/no-img-element`）は Phase 6 以前からの既存。errorは0
