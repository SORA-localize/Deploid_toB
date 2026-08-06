---
status: current
updated: 2026-08-06
---

# 積み残し登録簿 v1

移行前リファクタリング（Phase 1〜7）の実行中に「今はやらない」と判断した項目の**唯一の一覧**。

## この文書の役割

判断を記録するのではなく、**判断を見失わないようにする**ための文書。

Phase 5・6 の実行中、積み残しは3か所に分散していた。実装インデックスの繰り越し表（#1〜#7）、
同じ文書の §9 Backlog（#8）、Phase 7 計画の引き取り表（#9）。表を見ても全体が見えず、
**ユーザー自身の要望である #8 が最も埋もれていた**（2026-08-04 に発見）。

さらに実装インデックスと Phase 7 計画は、Phase 7 の Task 6 で `docs/archive/` へ移る。
移った先は内容凍結の棚なので、積み残しをそこに置いたままにすると更新できなくなる。
この登録簿は `docs/decisions/` に置き、プログラム完了後も生き続ける。

**各所は重複させず、ここへリンクする。**

---

## 一覧

優先度は「いつ着手するか」であり、重要度ではない。

| # | 内容 | 起票 | 優先度 | 状態 |
|---|---|---|---|---|
| 1 | [`/compare` の view model 化](#1-compare-の-view-model-化) | Phase 5 | 中 | 未着手 |
| 2 | [一覧の本文検索の代替](#2-一覧の本文検索の代替) | Phase 5 | 低 | 未着手 |
| 3 | [共有フロア 588,660 の削減](#3-共有フロア-588660-の削減) | Phase 5 | 中 | **Phase 7 Task 3 で一部対応** |
| 4 | [`color-contrast` 218箇所の是正](#4-color-contrast-218箇所の是正) | Phase 6 | 中 | 未着手・独立計画が要る |
| 5 | [`/reports` 主軸タブの到達性](#5-reports-主軸タブの到達性) | Phase 6 | 中 | 未着手 |
| 6 | [Reports H1 の動的化](#6-reports-h1-の動的化) | Phase 6 | 低 | 未着手 |
| 7 | [`/robots` グリッドが 768px で2列](#7-robots-グリッドが-768px-で2列) | Phase 6 | 低 | 未着手・人間が対象外と決定 |
| 8 | [Home 世界地図の動きの復活](#8-home-世界地図の動きの復活) | Phase 4 | **最後** | 未着手・ユーザー要望 |
| 9 | [e2e の hydration race](#9-e2e-の-hydration-race) | 監査 | 低 | Phase 7完了・未対応のまま残存 |
| 10 | [`batteryCapacityMah` の未反映](#10-batterycapacitymah-の未反映) | 全体レビュー | 中 | 20/63機反映済み・23機要人力判断 |

---

## 1. `/compare` の view model 化

`CompareClient` が raw `Robot[]` / `Manufacturer[]` を受け取る状態が残っている。Phase 5 は
catalog 4 route を view model 化したが、`/compare` だけ送った。

**なぜ後回しにしたか**: `/compare` にバイト上限を課していないため削減効果が 0。一方で
Phase 5 最大のリファクタになり、DnD・favorite・URL復元が絡んで壊れ方が静か。

**いつやるか**: CMS移行を始めるなら、その前。DB から取った値を client へ丸ごと渡す形が残る。

出典: Phase 5 計画の Task 9（`docs/archive/refactor-phase-05-client-boundaries-v1.md`）

---

## 2. 一覧の本文検索の代替

Phase 5 Task 6 で、catalog 一覧の検索対象を「card が描画する文字列＋facet label」へ限定した。
本文は検索されない。

**なぜ後回しにしたか**: サイト全体検索ページが無いため、本文検索の退避先が無い。

**いつやるか**: 本文検索が要ると判断したとき。候補は build 時生成の静的 JSON を `public/` へ置く方式。

出典: [`refactor-baseline-2026-07-26.md`](../reference/refactor-baseline-2026-07-26.md) の「Phase 5 after」

---

## 3. 共有フロア 588,660 の削減

全 route が必ず読み込む JS。`layout.tsx` の `<Toaster />` により `sonner`・`lucide`・
`@vercel/analytics` が `/privacy` のような静的ページにも配信される。`motion/react` も
Home 側 4 ファイルが使い続けるため dependencies から外せていない。

**現状**: 588,660 bytes（非圧縮）/ 145,245 bytes（brotli）。Phase 5 起票時 588,395 から実質横ばい。

**Phase 7 Task 3 で一部対応**: root `<Toaster />` を `/compare` へ局所化する。**削った後は
`scripts/check-client-budgets.mjs` の `MAX_SHARED_FLOOR_BYTES`（現在 595,000）も下げること。**
下げないと余裕だけが増え、監査が指摘した「落ちない gate」へ戻る。

**残る分**: `motion/react` は Home 4ファイルが使用中。#8 の実装方針とも関係する。

---

## 4. `color-contrast` 218箇所の是正

axe の閾値を `critical` から `serious` へ上げると全6 route で違反する。

| route | 件数 |
|---|---:|
| `/robots` | 96 |
| `/manufacturers` | 85 |
| `/use-cases` | 17 |
| `/` | 16 |
| `/reports` | 3 |
| `/compare` | 1 |

全件 `color-contrast`。`src/app/globals.css` のテーマトークンと配色設計に関わる。

**なぜ後回しにしたか**: テスト追加タスクの範囲を超える。Phase 6 は「違反 0 の状態で gate を
入れる」原則を守り、閾値を上げなかった。

**いつやるか**: **独立した計画が要る。** axe gate を `serious` へ上げられるのはこれを片付けた後。

**注意**: 静的生成のうちは全数がビルド時に確定して数えられる。CMS/DB へ移行して内容が動的に
なると全数把握ができなくなるため、移行前に片付けるほうが安い。

出典: Phase 6 計画の Task 5b。[`ui_architecture_and_development_policy_v1.md`](ui_architecture_and_development_policy_v1.md) §9 からも参照

---

## 5. `/reports` 主軸タブの到達性

記事の絞り込みタブ（すべて / ニュース / メーカー解説…）が追従ヘッダの中にしかなく、
スクロールするまで DOM に存在しない。ページ先頭から Tab で到達できない。

「追従ヘッダは本文の再掲に留める」という [`design_system_v1.md`](design_system_v1.md) の規定に反する。

**なぜ後回しにしたか**: 本文のどこへ移すかがレイアウト判断を伴う。

**なお**: フォーカスが消える不具合自体は Phase 6 Task 4 で解消済み（`HeaderStickyBarSlot` が
`:focus-visible` を持つ間はバーを消さない）。残るのは「そもそも到達できない」ほう。

---

## 6. Reports H1 の動的化

選択中の shelf に関わらず H1 が常に静的な「記事」。shelf 別ラベルは `ARTICLE_SHELF_TABS` に既にある。

**なぜ後回しにしたか**: Phase 6 の Global Constraint（全 index/detail route に一意な H1 を1つ）を
満たすのに必須ではない。

出典: Phase 6 計画 F6-02

---

## 7. `/robots` グリッドが 768px で2列

`lib/catalogLayoutClasses.ts` の `browserGridClassNames.robots` が `grid-cols-2 ... lg:grid-cols-3` で、
640〜1024px（`sm:`〜`lg:` 未満）に列数を上げる breakpoint が無い。768px viewport では 390px と
同じ2列のままカードだけ幅広になり、ページ高さが 390px / 1280px の約2倍になる
（14,714px 対 7,013px / 7,090px、Phase 6 Task 5a の visual regression で実測）。

**なぜ後回しにしたか**: overflow・重なり・切れ・欠落のいずれにも該当せず、**壊れてはいない**。
間延びを許容するかはデザイン判断。**人間が Phase 6 の対象外と決定**（2026-08-03）。

**いつやるか**: 間延びが許容できないと判断したとき。`md:grid-cols-3` の追加で足りる。

---

## 8. Home 世界地図の動きの復活

Phase 4 で自動スクロール／ドラッグを完全に削除した。

**重要**: 削除は容量削減（4.2MB → 326KB）の必須要件では**なかった**。主因は Task 1 の
SVG static asset 化。Task 3 の「単一canvas化・複製DOM除去」は Global Constraint
「同じ point / arc / link DOM を複製しない」（アクセシビリティ・保守性目的）に基づく別軸の判断。
よって static asset 化・単一 DOM 構造を維持したまま動きを復活させることは技術的に可能。

**ユーザー意向**（2026-07-30 起票、2026-08-04 再確認）: **動きは復活させたい。着手は最後。**
Phase 7 および他の積み残しが片付いてから。

**実装方針**: 旧実装（3コピー DOM + 手動 pan / rAF）への回帰ではなく、単一canvas・単一DOM・
static asset の制約を維持した新設計。別 plan（`refactor-phase-08-home-map-motion-v1.md` 等）として起票する。

**関連**: #3 の `motion/react` 依存はこの実装方針に影響する。

出典: [`refactor-phase-04-home-performance-v1.md`](../plans/refactor-phase-04-home-performance-v1.md) の Follow-up 節

---

## 9. e2e の hydration race

`tests/e2e/` の5 spec（`focus-restoration` / `keyboard-navigation` / `carousel-autoplay` /
`headings` / `home-world-map`）が `page.goto(..., { waitUntil: 'domcontentloaded' })` を明示指定
している。Playwright の既定は `load` で、`domcontentloaded` はそれより**早い** signal。
hydration 前に click が飛ぶため `focus-restoration › moves focus into the drawer on open` が
不定期に落ちる。

実測（2026-08-03）:

- 単体8回: 0/8 失敗
- フルスイート `--retries=0` 4回: 1/4 失敗
- CI（ubuntu-latest）: 観測した2 run とも1回目失敗 → retry で通過（`1 flaky` 表示）
- hydration の死に窓: ボタン可視 65ms → click 有効 119ms。**54ms**

**ユーザー影響は無い**（54ms は人間が踏めない）。`retries: 2` が吸収しており CI は緑。
retries 自体は Playwright / Cypress とも公式機能で、CI での使用は一般的な実務。

**放置も正当な判断**。ただしその場合は「**flaky は1件まで許容、増えたら直す**」を運用ルールと
して明示すること。書かずに放置すると単なる忘却になり、2件目以降に気づけなくなる。

**Phase 7 は対応せずに完了した**（2026-08-04 マージ）。以前は「Phase 7で対応予定」と
書いていたが、Task 1〜6は analytics/security headers/Toaster/dead code/docs links/results の
6件で、この項目には触れていない。約束を果たさずに完了したので、この行を実態に合わせて訂正した
（全体レビューで発見、2026-08-05）。対象5ファイルへの該当箇所数を`grep -c`で数え直したところ
`carousel-autoplay.spec.ts`4箇所・`headings.spec.ts`1箇所・`focus-restoration.spec.ts`7箇所・
`keyboard-navigation.spec.ts`7箇所・`home-world-map.spec.ts`1箇所の計20箇所（ファイル数5は
変わらず）。**着手時期は未定のまま**、次にe2eを触る機会に対応する。

---

## 10. `batteryCapacityMah` の未反映

commit `acfaa7b`（2026-07-22）が `batterySystem`（45機）と `batteryCapacityWh`（16機）を
commit message に記載せず削除し、`batteryCapacityWh`（Wh 単位）を新設 `batteryCapacityMah`
（mAh 単位）へ差し替えた。`batterySystem` は commit `9530937` で復元済みだが、mAh 側は
Unitree G1（9000mAh）1機分しか埋まっていなかった。

**2026-08-06 に方針決定・一部反映済み**。ユーザー提供の将来DB用データ（57メーカー・197機種、
mAh単位で統一）と `docs/decisions/data/research/DATA-R02-*` を突合した結果、Wh は
「多くの機種で mAh/Ah しか公表されておらず、電圧不明でWh換算できない」ことが判明。
Wh 側は復元せず **mAh へ一本化**すると決定（詳細:
[`deferred-work-register-followup-v1.md`](../plans/deferred-work-register-followup-v1.md) DEC-04）。
`docs/plans/robot-data-r02-integration-plan-v1.md` の未完了task `R02-09` の再開として実施した。

**現状**（PR [#20](https://github.com/SORA-localize/Deploid_toB/pull/20)）: 20/63機に
`batteryCapacityMah` を反映済み（Unitree 8機、AgiBot 2機、UBTECH 2機、LimX 2機、Leju 2機、
EngineAI 1機、RobotEra 1機、Galbot 1機。既存sourceのURLで裏付け、`validate:data` /
`build` / `spec-coverage.test.ts`（floor 20 に更新）で確認済み）。

**除外**: `pal-kangaroo`。ソースCSVは15000mAhだが、公式ページを実際に開くと
「976 Ah」という非現実的な値が記載されており、既存のR02調査（PDF文字化けでの
`source-inaccessible`判定）と符合する矛盾が見つかった。誤ったcitationを書くより
保留を選び、値は未反映のまま。

**残task**: 23機（`booster-t1`の`T1`に対しCSVが`T1 Basic`/`T1 Standard`/`T1 Customized`の
3行を持つ、等）はCSV側のvariant名がDeploidの代表レコードとどう対応するか一次資料の
個別確認が必要で自動反映していない。一覧は
[`deferred-work-register-followup-v1.md`](../plans/deferred-work-register-followup-v1.md)
Task B-1 を参照。

出典: [`data-maintenance-checklist-v1.md`](data-maintenance-checklist-v1.md) §I（原記録）、
[`deferred-work-register-followup-v1.md`](../plans/deferred-work-register-followup-v1.md)（発見・反映、2026-08-06）

---

## 更新責務

- 項目を追加したら、この表と本文の両方へ書く。他の文書には**リンクだけ**置く。
- 着手・完了したら状態列を更新し、完了時は取り消し線ではなく行ごと削除して、実装を正本とする。
- 判断が変わったら（優先度、やらない決定）、**誰がいつ決めたか**を残す。3週間後には理由を思い出せない。
