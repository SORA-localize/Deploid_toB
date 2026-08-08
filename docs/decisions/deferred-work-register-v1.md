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
| 7 | [`/robots` グリッドが 768px で2列](#7-robots-グリッドが-768px-で2列) | Phase 6 | 低 | 未着手・人間が対象外と決定 |
| 8 | [Home 世界地図の動きの復活](#8-home-世界地図の動きの復活) | Phase 4 | **最後** | 未着手・ユーザー要望 |
| 10 | [`batteryCapacityMah` の未反映](#10-batterycapacitymah-の未反映) | 全体レビュー | 中 | 20/63機反映済み・23機要人力判断 |

`#4`・`#5`・`#6`・`#9`・`#11`は解消済みのため行ごと削除（すべて2026-08-06）。

- `#5`（`/reports`主軸タブの到達性）: [PR #21](https://github.com/SORA-localize/Deploid_toB/pull/21)
- `#6`（Reports H1の動的化）: [PR #20](https://github.com/SORA-localize/Deploid_toB/pull/20)
- `#9`（e2eのhydration race）: [PR #22](https://github.com/SORA-localize/Deploid_toB/pull/22)＋
  `fix/e2e-hydration-race-20260806`。全5ファイル20箇所の`waitUntil: 'domcontentloaded'`を除去。
  「retriesが吸収しているので放置も正当」という当初の結論は、retriesがflakyの増加を隠していた
  実例をもって撤回した
- `#11`（Linuxベースライン陳腐化）: [PR #22](https://github.com/SORA-localize/Deploid_toB/pull/22)で
  `.github/workflows/update-visual-baselines.yml`を追加して恒久対応
- `#4`（color-contrast）: 219件→**0件**。`--muted-foreground`の不透明度修飾子（196件）と
  `--signal`の色（15件）、残る8件の弱い装飾テキストを順に解消し、
  `tests/e2e/accessibility-smoke.spec.ts`の閾値を`critical`から**`serious`へ引き上げた**。
  引き上げ後に違反を意図的に戻してゲートが実際に赤くなることも確認済み

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

出典: [`refactor-phase-04-home-performance-v1.md`](../archive/refactor-phase-04-home-performance-v1.md) の Follow-up 節

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
`docs/archive/robot-data-r02-integration-plan-v1.md` の未完了task `R02-09` の再開として実施した。

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
