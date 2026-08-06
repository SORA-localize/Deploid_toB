---
status: plan
updated: 2026-08-06
---

# 積み残し登録簿フォローアップ実行計画 v1

対象: [`deferred-work-register-v1.md`](../decisions/deferred-work-register-v1.md) の `#4`（color-contrast）・`#5`（/reportsタブ到達性）・`#6`（Reports H1動的化）・`#10`（`batteryCapacityWh`の未復元）。

## 0. 経緯

全体レビュー完了後、次にどの積み残しから着手すべきか実コードを照合して検討し、`#6 → #10 → #5 → #4` の順を提案した。これに対しユーザーから2点の指示があった。

1. バッテリーは今後 **mAh** で情報収集している（Whではない）
2. これらのタスクの実行計画書がまだ無いので、先に作るべき。実プロジェクトの状況は推測でなく実測して調査すること

指定された文書は以下14件（過去の全体レビューで使った14件とほぼ同じだが、記事・データ運用寄りの3件が入れ替わっている）。

- 入口・ルーティング: `ai/rules/00-index.md`
- 計画・実装・レビュー全フェーズの共通手順: `ai/rules/10-workflow.md`
- 実装レビュー（自己監査・チェックリスト）: `docs/decisions/ai_fullstack_development_guardrails_v1.md`
- 解説記事の書き方: `docs/decisions/editorial_style_guide_v1.md`
- メーカー・ロボットデータのファクトチェックプロンプト: `docs/decisions/robot-factcheck-research-prompt-2026-07-01.md`
- データ作業の参照ルーティング: `ai/rules/20-data.md`
- データ編集前のゲート（G1〜G11）: `ai/rules/21-data-maintenance-workflow.md`
- データ追加・更新の実行チェックリスト: `docs/decisions/data-maintenance-checklist-v1.md`
- UI・デザイン作業のルーティング: `ai/rules/30-ui-design.md`
- デザイン原則・トークン: `docs/decisions/design_system_v1.md`
- UI構造・責務分離の方針: `docs/decisions/ui_architecture_and_development_policy_v1.md`
- 画像・引用・権利センシティブ作業のルーティング: `ai/rules/40-content-rights.md`
- 著作権・商標・メディア権利ポリシー: `docs/decisions/copyright_and_media_rights_policy_v1.md`
- 記事候補の探し方: `ai/rules/22-article-sourcing.md`

14件を全て通読した上で、各文書が「次に読め」と指す先も辿った（`AGENTS.md`、`docs/decisions/data/README.md`、`docs/decisions/data-architecture-redesign-v1.md`、`docs/decisions/content-platform-and-database-architecture-v2.md`、`docs/README.md` 等）。この結果、`#10` に直結する重大な既存資産（後述 §2.2）を発見したため、当初の想定より`#10`の扱いが大きく変わっている。

---

## 1. 文書ごとの対象判定

対象外と判定した文書も、判定理由を書く（黙って外さない）。

| 文書 | 対象 | 理由 |
|---|---|---|
| `ai/rules/00-index.md` | ○ | 作業種別ルーティングそのもの。`data/*.ts`はcutoverまで正本、との現在方針を確認（§2.3） |
| `ai/rules/10-workflow.md` | ○ | §1.1「大規模リファクタ計画で先に作る文脈セット」がこの計画のフォーマットの元。Option A/B、task ID、順序制約の書式はここに従う |
| `docs/decisions/ai_fullstack_development_guardrails_v1.md` | ○ | 3層アーキテクチャ・自己監査ループ・git規律。`#5`はフロントエンド層、`#10`はデータ層に対応 |
| `docs/decisions/editorial_style_guide_v1.md` | **対象外** | 記事本文（`data/articles.ts`の`body`）の執筆方針。対象4項目はいずれも記事執筆を含まない |
| `docs/decisions/robot-factcheck-research-prompt-2026-07-01.md` | △ 部分対象 | ロボットデータの継続ファクトチェック手順。チェック項目表（§3）に`batteryCapacity`系は無く、`#10`のmAh方針の直接の根拠にはならなかった（§2.2参照）。マスターリストは58機時点で現行63機と差があり鮮度が古いことも判明したが、これは`#10`の対象外（別途登録簿行き） |
| `ai/rules/20-data.md` | ○ | `#10`が`data/robots.ts`を触るため必読。`docs/decisions/data/README.md`・`data-architecture-redesign-v1.md`を芋づる式に発見 |
| `ai/rules/21-data-maintenance-workflow.md` | ○ | G1〜G11ゲートは`#10`にそのまま適用される。特にG2（出典確認）はR02調査結果の再利用方法に関わる |
| `docs/decisions/data-maintenance-checklist-v1.md` | ○ | §I「タグ/enum/スペック項目を増やすとき」に`batteryCapacityWh`削除の経緯と「ラベル確定が復元の前提」という記述があり、`#10`の起点そのもの |
| `ai/rules/30-ui-design.md` | ○ | `#5`・`#6`・`#4`はすべてUI/アクセシビリティ作業 |
| `docs/decisions/design_system_v1.md` | ○ | §4「追従ヘッダ」に`/reports`の既知の例外として`#5`が明記されている（§3.3参照）。`#6`のH1規定にも抵触なし |
| `docs/decisions/ui_architecture_and_development_policy_v1.md` | ○ | §9アクセシビリティ方針に`#4`/`#5`/`#7`が登録簿参照付きで明記。tab semantics（`role=group` vs `role=tab`）の契約は`#5`の実装で守る必要がある |
| `ai/rules/40-content-rights.md` | **対象外** | 画像・ロゴ・引用の権利。対象4項目はいずれも画像を扱わない（`#10`はテキスト/数値と出典URLのみ） |
| `docs/decisions/copyright_and_media_rights_policy_v1.md` | **対象外** | 同上（画像権利ポリシー全文を読了した上での判定） |
| `ai/rules/22-article-sourcing.md` | **対象外** | 記事候補ソーシング。対象4項目に記事追加は無い |

### 1.1 芋づる式に発見した追加必読文書

`ai/rules/00-index.md`・`20-data.md`・`21-data-maintenance-workflow.md`・`10-workflow.md`§1.1・`data-maintenance-checklist-v1.md`の「関連ドキュメント」が繰り返し指していたため、ユーザー指定の14件に加えて読んだ。

| 文書 | 対象 | 理由 |
|---|---|---|
| `AGENTS.md` | ○ | 読み順の起点。内容は`00-index.md`への誘導のみ |
| `docs/decisions/data/README.md` | ○ | データ作業の入口。**`research/DATA-R02-master-report.md`等の全件調査成果物の一覧がここにある**（§2.2の発見の起点） |
| `docs/decisions/data-architecture-redesign-v1.md` | ○ | `lib/specSchema.ts`設計思想（「追加は1行、値の裏取りは別作業」）を確認。`#10`の実装がこの設計に沿うことを確認した |
| `docs/README.md` | ○ | 「いま動いているもの」に **`robot-data-r02-integration-plan-v1.md`が完了しておらず残taskがある**と明記（§2.2） |
| `docs/decisions/content-platform-and-database-architecture-v2.md` | △ 部分対象 | §10移行原則を確認したが、バッテリー関連の記述は無し。「cutoverまでは`data/*.ts`が正本」という既存方針を追認しただけ |
| `docs/plans/content-platform-migration-plan-v1.md`（970行） | **対象外** | `mAh`/`Wh`/`specSchema`でgrepしヒット無し。未着手のCMS/DB移行そのものの実装計画であり、今回の4項目（cutover前の通常保守）とは別フェーズ。全文読了はしていない — 970行を読む価値がこの計画の結論を変える可能性は低いと判断したため。着手時期が来たら別途読む |
| `docs/plans/robot-data-r02-integration-plan-v1.md` | ○ | **`#10`と同一の作業がR02-09として既に計画済みで未完了**。新規計画を書くのではなく、この計画に接続する（§3.2） |
| `docs/decisions/data/research/DATA-R02-decisions.md` | ○ | R02統合の承認済み判断ログ。battery項目の明示決定は無いが、Option A（新フィールド追加をしない方針）の射程を確認した |
| `docs/decisions/data/research/DATA-R02-master-report.md` / `DATA-R02-unresolved.md` / `DATA-R02-B01〜B10.md` | ○ | `#10`の一次証拠（§2.2） |

---

## 2. 実測結果

### 2.1 `#6` Reports H1 — 実装対象は変わらず

`components/ReportsBrowser.tsx:127` の `PageListHeader` へ渡す `title` は `uiText.reports.title` 固定。同スコープに `activeShelf` があり、`lib/articleShelves.ts` の `ARTICLE_SHELF_TABS` にシェルフ別ラベル（すべて/ニュース/メーカー解説/ロボット解説/基礎知識）が既にある。`design_system_v1.md` §4のH1規定（`text-2xl`固定・画面幅で変えない）は表示サイズの話であり、内容を動的にすることに抵触しない。1ファイル・低リスク。文書調査で新たな制約は見つからなかった。

### 2.2 `#10` `batteryCapacityWh`/`Mah` — 当初想定より大きい、既存計画への合流が必要

**発見1: `acfaa7b`のWh→Mah改名は、5日前に完了していた公式調査の結論を反映したものだった。**

`docs/decisions/data/research/DATA-R02-B01.md`（Unitree、2026-07-17付、全61機の一次資料再調査）に明記:

> IP等級・動作温度・安全規格の3項目、および充電時間・バッテリーWh（**多くの機種でmAh/Ahのみ公表**）は、全10機で一貫して`not-published`

`DATA-R02-master-report.md` §5の項目別found率表でも `batteryCapacityWh` は found 16 / not-published 33 / needs-review 7 / source-inaccessible 4（found率26.2%、61機中）。この「found率が低い」原因の多くは、`needs-review`の注記を見ると「mAh/Ah表記はあるが電圧非公開でWh換算不可」というパターンで、**マンファクチャラーが実際に公表しているのはWhでなくmAh/Ahである**ことを示している。

`acfaa7b`（2026-07-22、5日後）のコミットメッセージ「based on real fill-rate and manufacturer-terminology research」は、このR02調査を指していると読むのが自然。ユーザーの「mAhで収集している」という方針は、**この既存調査結果と整合しており、新しい思いつきではない**。

**発見2: 消えた16機のWh値は、R02統合作業で直前に反映されたばかりのデータだった。**

commitの時系列（`git log`で実測）:

| 日時 | commit | 内容 |
|---|---|---|
| 2026-07-18 | `d5d1552`〜`93a4b36`（11 commit） | R02-08/09バッチ反映。`0a5fbd3`は「ubtech-walker-x: batteryCapacityWh=546（54.6V×10Ah）」「ubtech-walker-c: batteryCapacityWh=48V×15Ah=720Wh」を明記してWh値を追加 |
| 2026-07-20 | `76d1707` | PR #3 merge（R02ロールアウトがmainへ） |
| 2026-07-22 | `acfaa7b` | specSchema再設計。`batteryCapacityWh`を`batteryCapacityMah`へ改名。**commit messageに記載なくWh値16機分・batterySystem45機分を削除** |
| 2026-07-28 | `9530937` | `batterySystem`のみ復元 |
| 2026-07-28 | `660caad` | 上記削除の経緯を記録（`batteryCapacityWh`は未復元のまま） |

**発見3: これは新規タスクではなく、`docs/plans/robot-data-r02-integration-plan-v1.md`の未完了task。**

同計画のtask `R02-09`（"conflict / variant / inaccessibleを個別処理する"）が、まさにこの「`needs-review`だったバッテリー行を個別に確定する」作業に相当する。`docs/README.md`の「いま動いているもの」表も「個別conflict機（pal-kangaroo等）と最終回帰監査（R02-11）が残task」と明記しており、**この計画は完了していない**。よって`#10`は独立した新規計画ではなく、既存計画のR02-09を再開する形にする（§3.2）。

**発見4: 現在のスキーマ制約**

`lib/specSchema.ts`の`power-runtime`グループは現在5項目（`runtimeMin`/`batteryCapacityMah`/`chargeTimeMin`/`batterySwapMethod`/`batterySystem`）。`MAX_SPEC_ROWS_PER_GROUP = 6`（`lib/validation/robots.ts`で強制）に対し空き1枠。`batteryCapacityWh`をMahと別行で復元すると6/6でちょうど埋まり、以後この グループに新規項目を足す余地が無くなる。

**発見5: mAh現在値は63機中1機のみ（Unitree G1、9000mAh）。**

`grep -c "batteryCapacityMah" data/robots.ts` = 1（2026-08-05実測）。`tests/unit/spec-coverage.test.ts`の`MIN_POPULATED.batteryCapacityMah: 1`がこれをfloorとして固定している。

**発見6: R02の生データには、まだdataへ反映されていないmAh/Ah生値が複数機体分ある。**

バッチ→メーカー対応（`docs/decisions/data/research/DATA-R02-source-plan.md`より）:

| batch | メーカー | 対象robotId |
|---|---|---|
| B01 | Unitree | unitree-g1, -g1-edu, -h1, -h1-2, -h2, -h2-edu, -h2-plus, -r1, -r1-standard, -g1-d |
| B02 | AgiBot | agibot-a2, -a2-ultra, -a2-max, -a2-lite, -x1, -x2, -x2-ultra, -g2 |
| B03 | UBTECH | ubtech-walker-s2, -s1, -x, -s, -c, -tienkung |
| B04 | Fourier | fourier-gr2, -gr3, -gr1, -gr3c |
| B05 | EngineAI | engineai-se01, -pm01, -t800, -sa01 |
| B06 | Apptronik + 1X | apptronik-apollo, -apollo-2, onex-neo, onex-eve |
| B07 | Booster + Kepler | booster-t1, -k1, kepler-k2, -k1 |
| B08 | Leju + PAL + LimX | leju-kuavo, -kuavo5, pal-talos, pal-kangaroo, limx-oli, limx-luna |
| B09 | 米欧・その他大手 | agility-digit, figure-03, boston-dynamics-atlas, tesla-optimus, sanctuary-phoenix, kawasaki-kaleido, neura-4ne-1, xpeng-iron |
| B10 | その他 | wandercraft-calvin, mentee-menteebotv3, robotera-l7/q5/m7, galbot-g1, aeolus-aeo |

`grep`で確認した範囲では、少なくとも以下がraw mAh/Ah値を持つ（**正確な機体対応はB0Xファイルを直接読んで再確認すること。ここでは値の存在だけを確認しており、行の並び順からの推測でロボットIDを断定していない**）:

- B05（EngineAI）: "1000 mAh"（needs-review、電圧不明）、"10,000 mAh"（needs-review、記載電圧が充電電圧でnominalでない）、"20Ah/40Ah"（needs-review、同様の理由）
- B08（LimX）: "9,500mAh swappable"、"10,000mAh dual modules"（いずれも`not-published`＝mAhしか公表が無いため）
- B02（AgiBot）: "14.4Ah・充電電圧48V DC"のペアが2件（needs-review）

これらは**Wh換算という条件を外せば`needs-review`/`not-published`の理由（電圧不明でWh計算不可）がそのまま解消し、mAh/Ahの生値として採用候補になる**。つまりmAhをスキーマの主軸にする方が、R02が既に集めた生データの活用率が上がる。

**発見7（2026-08-06追記）: ユーザー提供の将来DB用CSVが、mAh一本化を裏付けた。**

ユーザーから`/Users/hori/Downloads/ロボDB/ロボDB - 発表済みロボット.csv`（リポジトリ外、リファクタリング完了後にこれを元にDBを作る予定とのこと）を提示された。実測した内容:

- ヘッダ行の電源・稼働列は「稼働時間(分)／**バッテリー容量(mAh)**／充電時間(分)／電池交換」の4列で、Wh列は無い（197データ行・57メーカー・201行全体で確認、Wh列・Wh表記は0件）
- **`R02`の生値と複数機体で一致**: AgiBot A2 Ultra 14400（=R02の14.4Ah）、UBTECH Walker X 10000（=R02の54.6V×10Ah＝546Wh相当の同一Ah値）、UBTECH Walker C 15000（=R02の48V×15Ah＝720Wh相当の同一Ah値）、LimX Oli 9500／Luna 10000（=R02のmAh生値そのまま）、EngineAI SE01 1000／PM01 10000／T800 20000・40000、Booster T1 10500（いずれもR02のAh/mAh生値と一致）
- **重要な非対称性**: R02で`found`（Wh直接記載・換算不要）だった機体のうち、このCSVに現れるもの（1X NEO、PAL Talos、Figure 03、Fourier GR-1/GR-2、UBTECH Walker C/X等）は、**Wh値をmAhへ換算した数値ではなく「未公表」のまま**になっている。PAL Kangarooに至ってはR02が`source-inaccessible`（PDF文字化けで976Ahという非現実的な値しか取れず断念）と判定した機体だが、このCSVでは`15000`という別ソースからのクリーンな値が入っており、R02より新しい独自調査であることも分かる
- **ソースURLはほぼ記載なし**（201行中`http`を含む行は1件のみ）。スペック値としての精度はR02と相互検証できたが、`ai/rules/21-data-maintenance-workflow.md` G2/G6が要求する出典URLはこのCSV単体では満たせない
- **規模は現行データベースを大きく超える**: 57メーカー・197機種（現行`data/robots.ts`は63機・約25メーカー）。「リファクタリング後にこれを元にDBを作る」というユーザーの発言と整合し、これは移行後の拡張版カタログであって、現行`data/robots.ts`への即時一括インポート対象ではない

**結論（DEC-04はこの発見により決着）**: マンファクチャラーがmAh/Ahしか公表していない場合、ユーザー自身の裏取りでも「Whへ換算して埋める」のではなく「未公表として空欄にする」方針を一貫して取っている（1X NEO・PAL Talos・Figure 03・Fourier系など、複数機体で確認）。これは筆者が§3.2で提案していたOption B（Wh行を別途復元して併存）と逆の方針であり、**Option A（mAhへ一本化。Wh側は当面追わない）を正とする**。詳細は§3.2 DEC-04（決定済み）に反映。

### 2.3 `#5` `/reports`タブ到達性 — 修正方向が文書側に既に明記されていた

`components/HeaderChrome.tsx`の`HeaderStickyBarSlot`（51〜113行目）は、`stickyBar.visible`が真になる（＝スクロールが閾値を超える）まで`mounted`が`false`のままで`return null`。スクロールするまでDOMに存在しないため、ページ先頭からのTabで到達できない（実コードで確認済み、前回調査から変更なし）。

`design_system_v1.md` §4「追従ヘッダ」に、この状態がそのまま**既知の例外として明文化されている**:

> **既知の例外: `/reports`の主軸タブ（すべて/ニュース/メーカー解説…）は追従ヘッダの中にしかない。** 上の規定に反するが、本文のどこへ移すかはレイアウト判断を伴うためPhase 6では扱わず、繰り越しとした。

同じ節が正しい実装例も示している: **`/robots`は主軸タブを本文に直置きしており、この規定を満たしている。** `RobotsBrowser.tsx`は`ContextualPageHeader`を一切使わない（grep 0件）ため、これが目指す形の参照実装になる。

`ui_architecture_and_development_policy_v1.md` §9は追加の制約を課す: `/reports?kind=news`のようなURL遷移を伴う絞り込みは`role="group"` + `aria-current="page"`を使い、`role=tab`/`aria-selected`/roving tabindexを**付けてはならない**（過去に一度tab semanticsが混入し差し戻された経緯があり、`tests/components/page-tab-bar.test.tsx`が固定している）。

`ContextualPageHeader`/`HeaderStickyBarSlot`は`ReportsHeader`のほか`ManufacturersHeader`/`UseCasesHeader`/`RobotDetailStickyHeader`/`ManufacturerDetailStickyHeader`の計5箇所が共有する。後者4つの内容を確認したところ、`ManufacturersHeader`/`UseCasesHeader`は静的タイトル文言＋条件付きfilter chipsのみで常設の主要ナビゲーションを持たないため、同じ「スクロールするまでDOM無し」構造でも実害は薄い。Reportsだけが「これが唯一のシェルフ切替導線」であるため深刻度が高い。

### 2.4 `#4` color-contrast 218箇所 — 実装ではなく調査が次の一手

疑わしいと考えた`muted-foreground`（`--slate-11` = `#60646c`）on 白背景の組み合わせを、Radix Colorsの実値（`node_modules/@radix-ui/colors/slate.css`）からWCAG相対輝度式で計算すると**5.94:1**で、AA基準（通常文字4.5:1）を通過する。つまり単一トークンの張り替えでは説明がつかない。

`tests/e2e/accessibility-smoke.spec.ts`は`impact === 'critical'`のみをgateしており、`color-contrast`（通常`serious`）は現状検知対象外。`ui_architecture_and_development_policy_v1.md` §9も「テーマトークンの見直しを伴うため独立した計画が要る」「axe gateの閾値を`serious`へ上げられるのはこれを片付けた後」と明記しており、register #4の記述と一致する。

根本原因は未特定（カード内の個別要素の可能性が高いという仮説はあるが未検証）。**次の一手は修正でなく、`serious`閾値でaxeを実行し実際の違反ノード・selectorを取得すること。**

---

## 3. タスク別実行計画

### Task A（`#6`）Reports H1の動的化

**Files**: `components/ReportsBrowser.tsx`

**Problem**: `PageListHeader`のH1が`activeShelf`に関わらず常に`uiText.reports.title`固定。

**Change**: `activeShelf !== 'all'`のとき、対応する`ARTICLE_SHELF_TABS`の`label`をH1に使う。`all`のときは既存の`uiText.reports.title`を維持（回帰確認のためデフォルト文言は変えない）。

**やらないこと**: `uiText.reports.title`自体の文言変更、`PageListHeader`コンポーネント自体の改修。

**Completion**: シェルフ切替でH1が追従し、`all`タブでは従来通りの見出しが出る。

**Validation**: `npm run build`、`/reports?kind=news`等の手動確認、`npm run check:docs`は無関係のため対象外。

---

### Task B（`#10`）バッテリー容量データの復元 — `robot-data-r02-integration-plan-v1.md` R02-09の再開として実施

**この計画に対する位置づけ**: 新規taskとして起票せず、既存計画のR02-09（"conflict / variant / inaccessibleを個別処理する"）を再開する形にする。理由は§2.2発見3。実行時は本計画ではなく`robot-data-r02-integration-plan-v1.md`側にtask実績を追記するのが筋（Single Source of Truth）。ここでは着手までに必要な決定と手順だけを整理する。

**適用するゲート**: `ai/rules/21-data-maintenance-workflow.md` G1〜G11（`data/robots.ts`編集のため）。特にG2（出典を実際に開いて確認）は、R02調査時点（2026-07-17〜18）のURLが今も生きているか再確認することを意味する。R02の日付をそのまま`checkedAt`に流用しない。

#### DEC-04（決定済み・2026-08-06）: mAhへ一本化

`data-maintenance-checklist-v1.md`§Iが指摘する「ラベル確定」そのもの。§2.2発見7（ユーザー提供の将来DB用CSV、57メーカー・197機種）で、マンファクチャラーがmAh/Ahしか公表していない機体について、ユーザー自身が「Whへ換算して埋める」のではなく「未公表として空欄にする」方針を複数機体（1X NEO・PAL Talos・Figure 03・Fourier系等）で一貫して取っていることを確認した。ユーザーからも「（CSVの型に）統一する」と明示の指示があった。

**決定: `batteryCapacityMah`単独運用とする。`batteryCapacityWh`をスキーマへ復元しない。** 既にR02で確定していたWh値9〜10機分（1X NEO 842Wh、FFTAI 936Wh、PAL Talos 1080Wh、Figure 03 2300Wh、Galbot G1 1440Wh、Fourier系500Wh×2、UBTECH Walker C 720Wh/Walker X 546Wh等）は、mAh生値が別途判明しない限り当面「未公表」のまま扱う。スキーマ変更（`lib/specSchema.ts`への行追加）は不要になった。

**将来DB用CSVの扱いについて（この計画の対象外・別途整理が必要）**: 同CSVは57メーカー・197機種と現行`data/robots.ts`（63機・約25メーカー）を大きく上回り、リポジトリ外（`~/Downloads/ロボDB/`）にある個人の調査ファイルで、フィールド単位のsource URLもほぼ持たない（201行中1件のみ）。「リファクタリング後にこれを元にDBを作る」というユーザーの発言から、これは今回のPhase 1〜7リファクタや`content-platform-migration-plan-v1.md`のcutoverそのものとは別の、将来のカタログ拡張作業の元データと理解した。**この計画のTask Bは、現行63機のうち値がR02から個別に裏取りできる範囲に限定し、197機種への拡張やこのCSVからの一括インポートは対象外とする**（`ai/rules/21-data-maintenance-workflow.md` G2「一次情報の裏取り」を満たさないまま転記しない）。CSV自体をどう正本化するか（`docs/decisions/data/research/`配下への取り込み等）はユーザー判断であり、この計画では提案しない。

#### Task B-1 出典の再検証

**Files**: 変更なし（調査のみ）

**Change**: `DATA-R02-B01〜B10.md`のうちbatteryCapacityMah関連行を持つ全ロボットについて、対応するsource URLへ実際にアクセスし、404/403でないこと・値が変わっていないことを確認する（G2/G6）。同時に、B0Xファイルの行とrobotIdの対応をこの段階で確定し、grep結果からの推測をやめる。ユーザー提供CSVの値と一致するかも突合し（§2.2発見7で確認した一致パターンの全数版）、不一致があれば個別に扱う。CSV自体にsource URLが無いため、出典はR02またはこのtaskで新たに確認したURLを正とする。

**Completion**: 対象robotId・値・source URL・確認日の一覧ができる。アクセス不能なURLはR02-09の`hold-source-inaccessible`として別扱いにする。

#### Task B-2 データ反映（R02-08の残バッチと同じ単位で実施）

**Files**: `data/robots.ts`（対象robotIdのみ）、必要なsource追加

**Change**: Task B-1で確定した値を、R02-08と同じ「1メーカーまたは5〜8機体単位・1batch1commit」の粒度で`batteryCapacityMah`へ反映する。`conflict`/`needs-review`（電圧不明以外の理由のもの）/`source-inaccessible`は自動採用せず個別保留。

**Completion**: 対象robotIdと変更フィールドがcommit本文に列挙される。対象外ロボットのdiff 0件。

#### Task B-3 テスト・登録簿の更新

**Files**: `tests/unit/spec-coverage.test.ts`、`docs/decisions/deferred-work-register-v1.md`

**Change**: `MIN_POPULATED.batteryCapacityMah`を実装後の実件数に更新。登録簿`#10`を完了として書き換えるか削除（登録簿自身の運用ルールに従う）。`batteryCapacityWh`を復元しないと決めた経緯（DEC-04）も登録簿の本文に残す。

**Validation（B-1〜B-3共通）**:

```bash
npm run validate:data
npm run build
npm run check:source-links
```

手動: `/robots`一覧、変更対象ロボットの詳細ページ、比較ページでバッテリー行の表示を確認。

**この計画でやらないこと**: R02-09が対象とする非バッテリー項目（`pal-kangaroo`の寸法文字化け等）、R02-11の全件回帰監査。これらは`robot-data-r02-integration-plan-v1.md`側の残taskとして別途進める。

---

### Task C（`#5`）`/reports`主軸タブの到達性

**Files**: `components/ReportsBrowser.tsx`、`components/ReportsHeader.tsx`。共有部品（`ContextualPageHeader`/`HeaderChrome.tsx`）は変更しない方針を優先する（他4箇所への影響を避けるため）。

**Problem**: §2.3の通り。`/robots`が参照実装。

**Change方針**: `/robots`と同様、シェルフタブ本体を`ReportsBrowser`の本文（`ContextualPageHeader`の外）に常設で描画し、追従バー側は「今アクティブなシェルフ」を再掲するだけに留める（`design_system_v1.md`の「追従ヘッダは本文の再掲に留める」という規定そのものに合わせる）。`role="group"` + `aria-current="page"`のセマンティクスを維持し、`PageTabBar`をそのまま再利用する（新規tab実装を作らない）。

**やらないこと**: `ContextualPageHeader`/`HeaderStickyBarSlot`共有ロジックの変更。`ManufacturersHeader`/`UseCasesHeader`など他4箇所の改修（このtaskの対象外。ただし本文直置きへの変更でこれらに副作用が出ないか回帰確認は行う）。

**Completion**: ページ先頭からTabキーのみでシェルフ切替コントロールに到達できる。`tests/components/page-tab-bar.test.tsx`のtab semantics契約を壊さない。追従バーの表示・フォーカス保持動作（Phase 6 Task 4の契約）を壊さない。

**Validation**:

```bash
npm run build
npm run test:unit -- page-tab-bar
```

手動: `/reports`をキーボードのみで操作（Tabでシェルフタブに到達できるか）、スクロールして追従バーが正しく追従するか、`/manufacturers` `/use-cases`に副作用がないか。

---

### Task D（`#4`）color-contrast — 調査task（修正taskではない）

**Files**: 変更なし。

**Problem**: §2.4の通り、根本原因が未特定。

**Change**: `axe`を`serious`閾値で実行し、実際の違反要素（selector・色の組み合わせ・route別内訳）を取得する。既存の`tests/e2e/accessibility-smoke.spec.ts`は`critical`のみを見ているため、別途一時スクリプトまたはPlaywright単発実行で`result.violations`を`serious`以上でフィルタして出力する。

**Completion**: 218箇所（またはその時点の実数）の内訳が「どの要素が」「どの色の組み合わせで」「何:1か」まで分かる状態になる。これができて初めて、単一トークン起因か個別コンポーネント起因かが判断でき、次の実行計画（このplanのTask Dの後継）が書ける。

**このtaskでやらないこと**: 実際の色修正、axe gate閾値の変更。

**Validation**: 出力したselector一覧を`src/app/globals.css`のトークン一覧・該当コンポーネントと突合する。

---

## 4. 対象外一覧（§1の対象外の再掲・理由付き）

- `editorial_style_guide_v1.md` — 対象4項目はいずれも記事本文執筆を含まない
- `ai/rules/40-content-rights.md` / `copyright_and_media_rights_policy_v1.md` — 対象4項目はいずれも画像・ロゴを扱わない（`#10`は数値と出典URLのみ）
- `ai/rules/22-article-sourcing.md` — 記事候補ソーシングであり対象外
- `docs/plans/content-platform-migration-plan-v1.md` — 未着手のCMS/DB移行計画そのもの。`mAh`/`Wh`/`specSchema`でのgrepはゼロヒット。全文（970行）は読んでいない

---

## 5. 順序制約

```text
Task A（#6）      … 依存なし。単独で実施可
Task D（#4）      … 依存なし。調査のみなので他タスクと並行可

Task B-1（出典再検証、DEC-04決定済みによりスキーマ変更taskは不要）
  └─ Task B-2（mAhデータ反映）
      └─ Task B-3（テスト・登録簿更新）

Task C（#5）      … 依存なし。ただしTask Bと同じdata/robots.tsは触らないため独立して進められる
```

DEC-04は2026-08-06のユーザー確認で決着済み（mAhへ一本化）。Task Bはスキーマ変更を経由せずB-1から直接着手できる。Task A・C・Dも互いに依存せず並行して進められる。

---

## 6. この計画の既知の弱点

- Task Bの§2.2発見6で挙げたmAh/Ah生値の機体対応は、grepの行順から推測した部分があり、Task B-1で必ず再確認する前提で書いている。この計画の時点では**robotId確定値として扱っていない**。ユーザー提供CSV（発見7）との突合で複数機体は一致を確認できたが、全数の突合はTask B-1側の作業として残る。
- ユーザー提供CSV（`~/Downloads/ロボDB/`）はリポジトリ外のファイルで、この計画は該当ファイルの1回のReadで判定している。CSV自体が今後更新される可能性、および201行中196行が読み込んだ内容の書き起こしに基づく点（値の転記ミスがあれば計画側の記述も引き継ぐ）は留意が必要。
- `docs/plans/content-platform-migration-plan-v1.md`（970行）は全文を読んでいない。バッテリー関連のgrepヒットが無いことのみを根拠に対象外としており、他の観点（例: 移行後のspecSchema運用）まで完全に無関係とは言い切れない。
- Task Dは調査taskであり、実際の修正規模・リスクはaxe実行結果が出るまで不明。「独立した計画が要る」という登録簿の見立てを追認しただけで、その計画自体はこの文書に含まれていない。
- Task Cの「本文直置き」という方針は`design_system_v1.md`が示す参照実装（`/robots`）に倣ったものだが、`ReportsBrowser`固有のレイアウト（ヒーロー・フィーチャー枠の有無で`showHero`が切り替わる等）との干渉は実装時に初めて分かる可能性がある。
