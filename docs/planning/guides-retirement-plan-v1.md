# Guides Retirement Plan v1

Status: active/unimplemented plan
Created: 2026-06-28
Branch: 未作成（実装時に `refactor/retire-guides` を切る。現在の作業ブランチは `main`）

この文書は、`/guides`（導入ガイド）コンテンツタイプをサイトとコードから全面撤去し、同時に将来の復活を容易にするための実行計画です。
実装判断の正本ではありません。実装時は現行コード、`data/types.ts`、`lib/validate.ts`、`docs/planning/data-architecture-redesign-v1.md`、`docs/planning/data-maintenance-checklist-v1.md`、`docs/planning/humanoid_media_IA_v1.md` を優先します。

## 0. 計画策定時に読んだ明文化ファイル

- `AGENTS.md`
- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/20-data.md`
- `ai/rules/80-doc-governance.md`
- `docs/planning/README.md`
- `docs/planning/humanoid_media_IA_v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `data/types.ts` / `lib/validate.ts` / `lib/data.ts` / `lib/search.ts` / `lib/siteNavigation.ts`

## 1. 背景と判断

`humanoid_media_IA_v1.md` では、ガイドは「知る／判断する／動く」の理解ハブであり、旗艦「意思決定変数の地図」を「サイトの存在意義そのもの」と位置づけていた。
しかし実体は published 2件（`decision-variables` / `poc-planning`）・出典ゼロ・`/guides` は ComingSoonGate で非公開、という空に近い状態である。

撤去の根拠は「空だから」だけではない。当初ガイドが担う想定だった「判断する」層の体系性は、その後の実装で構造化データ側に移った。

- 判断変数の提示はホームと compare が担う。
- 用途適合と根拠は `/use-cases` の `candidateRobots[].fit / basis / evidence*` が担う（evidence model 実装済み）。
- 機体スペック変数はロボット詳細が担う。

したがって「意思決定支援という仕事」は残すが、「ガイドという独立コンテンツタイプでそれを行う必然性」は失われている。
本計画はガイドを独立タイプとして撤去し、判断層は構造化データ側で育てる方針に寄せる。

将来、出典付きの編集記事供給ラインが整い、ガイドを旗艦として本格運用する判断が出た場合に備え、復活を容易にする資産を残す（§3 / §6 / GR-J）。

## 2. 対象範囲

対象:

- `/guides` ルート、ガイド専用コンポーネント・lib・データ
- ガイドを参照する他ページ・nav・sitemap・search・tag・docs
- `UseCase` / `Article` からガイドへの相互参照
- 上記に依存する validator の双方向整合チェック

対象外:

- `/use-cases` の evidence model（実装済み。触らない）
- reports / robots / manufacturers 本体の機能変更
- 「意思決定変数の地図」を reports に新規記事として作り直す作業（別判断。本計画では撤去のみ）
- CMS 移行

## 3. 設計方針（クリーンな撤去 ＋ 容易な復活）

休眠コードを残すと「使われていない型・関数・タグ」が将来の読者を混乱させる。一方で完全削除だけだと復活コストが上がる。
両立のため tombstone（墓標）方式を採る。

1. **コードからは完全撤去する。** 型・データ・lib・validator・UI・nav・sitemap・search・tag のガイド痕跡をすべて消す。`@deprecated` で残す形は取らない。
2. **復活資産を1か所へ集約する。** `docs/planning/archive/guides-retirement-v1.md`（GR-J）に、撤去理由・撤去前 commit SHA・`Guide`/`GuideStage` 型スナップショット・`guide-topic` タグ値・2件のガイド本文・復活手順チェックリストをまとめる。
3. **撤去を原子的 commit 列にする。** 各 task を 1 commit にし、依存順に並べる。復活の最短経路を「対象 commit 群の `git revert`」にできるようにする。撤去前 SHA を archive に明記する。
4. **コンテンツを失わない。** 2件のガイドの body / metadata は archive にそのまま保存する。git 履歴にも残るが、archive 側にも置いて発見性を確保する。

## 4. 現在の接続マップ（撤去対象の棚卸し）

実装着手前の調査時点（2026-06-28）で確認した、ガイドに接続している全箇所。

### 4.1 ガイド専用（ファイルごと削除）

- `src/app/guides/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `components/GuidesBrowser.tsx`
- `lib/guideFilters.ts`
- `data/guides.ts`
- `components/ComingSoonGate.tsx`（現状 `/guides` 専用。撤去後は孤児になるため削除）

### 4.2 型（`data/types.ts`）

- `GuideStage`（`'learn' | 'evaluate' | 'act'`）
- `Guide` interface
- `RootData` 相当の `guides` フィールド
- `UseCase.relatedGuideIds`
- `Article.relatedGuideIds?`

### 4.3 共有 lib（ガイド部分を剥がす）

- `lib/data.ts` — `getGuides` / `getGuideById` / `getGuideBySlug` / `getRelatedGuides` / `resolveGuideDetailBySlug` と `guides` import
- `lib/validate.ts` — guide ループ、Guide⇄UseCase 双方向整合、`article.relatedGuideIds` 検証、総件数、`guides` import
- `lib/search.ts` — `createGuideSearchDocument`、`'guides'` collection、`SearchCollection` 型、`report.relatedGuideIds` の検索ソース寄与
- `lib/tagRegistry.ts` — `'guide-topic'` kind と 7 値（判断軸 / KPI / PoC / 調達 / 安全 / TCO / 運用）
- `lib/tags.ts` — `getGuideTopicOptions`
- `lib/jsonLd.ts` — `guideJsonLd`
- `lib/labels.ts` — `guideStageLabels`
- `lib/display.ts` — `guideStageOrder`
- `lib/visualSemantics.ts` — `guide-topic` tone、`guideStageTones`、`getGuideStageTone`
- `lib/uiText.ts` — ガイド文言ブロック、`filters.guideStage/guideTopics`、`reports.relatedGuides/sidebarToolGuides`、`useCases.seeGuideForDetail`、`emptyStates.guides` 等
- `lib/siteNavigation.ts` — `{ label: 'ガイド', path: '/guides' }`（ヘッダータブ本体）

### 4.4 他ページからの相互リンク（編集）

- `components/HomeContentNavigator.tsx` — `'guides'` ContentKey、guideAssets、`/guides`
- `src/app/page.tsx` — `guidePreviewAssets`（既に空配列）と navigator への受け渡し
- `components/ManufacturerMapStage.tsx` — `/guides` CTA
- `src/app/reports/[slug]/page.tsx` — `getRelatedGuides`、関連ガイド sidebar、ツールリンク、`report.relatedGuideIds`
- `src/app/use-cases/[slug]/page.tsx` — `getRelatedGuides`、`primaryGuide`、`seeGuideForDetail`
- `src/app/sitemap.ts` — guide entries、`/guides` 静的ルート、`getGuides`

### 4.5 データ（編集）

- `data/articles.ts` — `relatedGuideIds`（約29箇所）
- `data/useCases.ts` — 各 UseCase の `relatedGuideIds`

### 4.6 コメントのみ言及（任意整理）

- `components/CandidateRobotList.tsx` / `components/ConsultationCta.tsx` / `components/SidebarSection.tsx` / `components/SourceList.tsx`

### 4.7 docs / 先行計画

- `docs/planning/data-architecture-redesign-v1.md` — Guide entity、UseCase⇄Guide 双方向
- `docs/planning/data-maintenance-checklist-v1.md` — guide sources 方針、§M
- `docs/planning/humanoid_media_IA_v1.md` — ガイドを中核とする記述
- `docs/data/README.md` — guide 系（L）の作業記述
- `docs/planning/project-wide-refactor-implementation-plan-v1.md` — guide 関連 task（C-001/C-002A/C-002B、E-001/E-002A/E-002B、H-001、I-004/I-005B/I-006B）
- `docs/planning/usecase-publication-quality-gate-plan-v1.md` — guide 相互参照の取り扱い記述

## 5. 実装タスク

依存の浅い「消費側」から先に消し、最後に「定義側」を消す。各 task 後に `npm run build`、データに触れた task では `npm run validate:data` を通す。
「atomic」と記した task は TypeScript が壊れないよう 1 commit 内で同時に完結させる。

### GR-001: ブランチとベースライン

Files: なし

手順:
1. `main` から `refactor/retire-guides` を切る。
2. `git status --short --branch` で未コミット差分（`docs/planning/README.md` 等）がユーザー由来か確認し、戻さない。
3. `npm run validate:data` と `npm run build` を通す。
4. 撤去前の commit SHA を記録する（GR-J の復活手順で使う）。

完了条件:
- ブランチが `refactor/retire-guides`。
- baseline の validate / build が通り、撤去前 SHA を控えている。

### GR-002: ガイド本文と型を archive へ退避する

Files:
- 新規: `docs/planning/archive/guides-retirement-v1.md`

変更:
1. `data/guides.ts` の 2 件（`decision-variables` / `poc-planning`）の body / metadata を archive 文書に転記する。
2. `Guide` / `GuideStage` 型と `relatedGuideIds` フィールド形状を archive に貼る。
3. `tagRegistry` の `guide-topic` 値一覧を archive に貼る。
4. 撤去前 SHA を archive に書く。

完了条件:
- archive 文書だけ見れば、ガイドの型・タグ・2件の内容が復元できる。
- この task は削除を伴わない（文書のみ）。

### GR-003: 他ページからガイド導線を外す

Files:
- `src/app/reports/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `components/HomeContentNavigator.tsx`
- `src/app/page.tsx`
- `components/ManufacturerMapStage.tsx`

変更:
1. 関連ガイド sidebar、ガイドツールリンク、`seeGuideForDetail` リンク、ホームのガイドカード、地図 CTA を削除する。
2. `getRelatedGuides` / `primaryGuide` の呼び出しを消す。`report.relatedGuideIds` / `useCase.relatedGuideIds` の読み取りもこの段階で外す（フィールド自体は GR-006 で消す）。
3. ガイドカードが消えてもグリッド・sidebar のレイアウトが崩れないことを確認する。

完了条件:
- どのページからもガイドへのリンク・カードが描画されない。
- desktop / mobile でレイアウト崩れがない。
- `npm run build` が通る。

### GR-004: nav と sitemap からガイドを外す

Files:
- `lib/siteNavigation.ts`
- `src/app/sitemap.ts`

変更:
1. `siteNavigation` から `{ label: 'ガイド', path: '/guides' }` を削除する。
2. `sitemap.ts` の guide entries、`/guides` 静的ルート、`getGuides` を削除する。

完了条件:
- ヘッダーにガイドタブが出ない。
- sitemap に `/guides` 系 URL が含まれない。
- `npm run build` が通る。

### GR-005: ガイドのルートと専用 lib を削除する

Files:
- `src/app/guides/page.tsx`（削除）
- `src/app/guides/[slug]/page.tsx`（削除）
- `components/GuidesBrowser.tsx`（削除）
- `lib/guideFilters.ts`（削除）
- `lib/jsonLd.ts` / `lib/labels.ts` / `lib/display.ts` / `lib/visualSemantics.ts`（guide 表示系を削除）

変更:
1. `/guides` ルート 2 ファイル、`GuidesBrowser`、`guideFilters` を削除する。
2. これらだけが使っていた `guideJsonLd` / `guideStageLabels` / `guideStageOrder` / `guideStageTones` / `getGuideStageTone` を削除する。
3. `/guides` への直アクセスが 404 になることを確認する。

完了条件:
- `/guides` と `/guides/[slug]` が存在しない。
- guide 表示系 lab が残っていない。
- `npm run build` が通る。

### GR-006: relatedGuideIds 参照を全撤去する（atomic）

Files:
- `data/articles.ts`
- `data/useCases.ts`
- `data/types.ts`（`UseCase.relatedGuideIds` / `Article.relatedGuideIds`）
- `lib/validate.ts`（Guide⇄UseCase 双方向、`article.relatedGuideIds` 検証）
- `lib/search.ts`（`report.relatedGuideIds` の検索ソース寄与）

変更:
1. `data/articles.ts` / `data/useCases.ts` から `relatedGuideIds` を全削除する。
2. `data/types.ts` の両フィールドを削除する。
3. `lib/validate.ts` のうち `relatedGuideIds` に連動する箇所だけを削除する。実装前に通読し、以下を 1 commit で一括撤去する:
   - `useCase.relatedGuideIds` 検証（`checkUniqueValues` / `check` / `checkDisplayableReference`）
   - `article.relatedGuideIds` 検証
   - Guide⇄UseCase 双方向整合（`u.relatedGuideIds` を読むため GR-006 に含める）
   - 上記が唯一の消費先である `guideIds` / `publishedGuideIds` の派生 set（消すと unused になり `noUnusedLocals` で build が壊れるため、同 commit で必ず削除）
   - 注意: guide ループ本体・`guides` import・`dup('guides')`・総件数は `relatedGuideIds` に依存しないので GR-006 では消さない（GR-007 で消す）。
4. `lib/search.ts` の `report.relatedGuideIds` 参照を削除する。
5. これらは 1 commit でまとめる（フィールド削除と読み取り削除を分けると TS が壊れる）。

完了条件:
- `rg -n "relatedGuideIds" src components lib data` が空。
- `guideIds` / `publishedGuideIds` が unused のまま残っていない。
- `npm run validate:data` と `npm run build` が通る。

### GR-007: ガイド定義本体を削除する（atomic）

Files:
- `data/guides.ts`（削除）
- `data/types.ts`（`Guide` / `GuideStage` / `guides` フィールド）
- `lib/data.ts`（guide アクセサ 5 関数 + import）
- `lib/validate.ts`（`guides` import、`dup('guides')`、guide ループ、総件数。relatedGuideIds 連動分は GR-006 で撤去済み）
- `lib/search.ts`（`createGuideSearchDocument`、`'guides'` collection、`SearchCollection` 型）
- `lib/tags.ts`（`getGuideTopicOptions`）
- `lib/tagRegistry.ts`（`guide-topic` kind と 7 値）
- `lib/visualSemantics.ts`（`guide-topic` tone）

変更:
1. 上記の guide 定義・アクセサ・検証・検索・タグをすべて削除する。
2. `SearchCollection` から `'guides'` を外す。
3. 1 commit でまとめる。

完了条件:
- GR-006 / GR-007 で触れた対象ファイルに guide 痕跡が残っていない。
  （`lib/uiText.ts` のガイド文言は GR-008 で消すため、この時点で `lib/` 全体 rg を完了条件にしない。全体 rg は GR-012 で行う。）
- `npm run validate:data` と `npm run build` が通る。

### GR-008: uiText と孤児コンポーネントを掃除する

Files:
- `lib/uiText.ts`
- `components/ComingSoonGate.tsx`（削除）
- `components/CandidateRobotList.tsx` / `components/ConsultationCta.tsx` / `components/SidebarSection.tsx` / `components/SourceList.tsx`（コメントのみ）

変更:
1. `uiText` のガイド文言ブロックとフィルタ／相互リンク文言を削除する。
2. 参照が消えた `ComingSoonGate` を削除する（`rg -n "ComingSoonGate"` で自己参照のみを確認してから）。
3. §4.6 のコメント言及ファイル（`ConsultationCta` / `SidebarSection` / `SourceList` / `CandidateRobotList`）を `rg -n "guide" <file>` で再確認する。コメントのみなら現状に合わせて短く直し、実体参照が見つかった場合は別途対応する（調査時点では `SourceList.tsx` のメタ見出しコメント等、いずれもコメントのみと確認済み）。

完了条件:
- `rg -n "ComingSoonGate"` が空。
- 未使用 uiText キーが残らない。
- §4.6 ファイルに guide 実体参照が残っていない。
- `npm run build` が通る。

### GR-009: docs を撤去後の状態へ更新する

Files:
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/humanoid_media_IA_v1.md`
- `docs/data/README.md`
- 必要なら `ai/rules/20-data.md` / `ai/rules/00-index.md`

変更:
1. Guide entity、UseCase⇄Guide 双方向、guide sources 方針（§M 含む）を撤去済みとして直す。
2. IA 文書には「ガイドは独立タイプとして撤去。判断層は構造化データ側で担う。復活は `docs/planning/archive/guides-retirement-v1.md` 参照」と注記する。
3. `docs/data/README.md` から guide（L）作業区分を外す。

完了条件:
- docs に「published guide が必要 / 双方向整合が必要」と読める残骸がない。
- 撤去判断と復活参照先が IA 文書から辿れる。

### GR-010: 先行計画を整合させる

Files:
- `docs/planning/project-wide-refactor-implementation-plan-v1.md`
- `docs/planning/usecase-publication-quality-gate-plan-v1.md`
- `docs/planning/README.md`

変更:
1. 実装前に対象計画を `rg -n "guide|Guide|/guides|relatedGuideIds"` で検索し、撤去対象 task が現存することを確認する（調査時点では project-wide の C-001/C-002A/C-002B・E-001/E-002A/E-002B・H-001・I-004/I-005B/I-006B、quality-gate の guide 相互参照記述を確認済みだが、実装時にずれていないか再確認する）。
2. project-wide 計画の guide 関連 task を「本計画により撤去済み・実行しない」と明記する。
3. quality-gate 計画の guide 相互参照記述を、guide 撤去前提に直す。
4. `README.md` (c) 未実装計画に本計画を登録する。

完了条件:
- 先行計画の guide task をそのまま実行する事故が起きない。
- README に本計画が登録されている。

### GR-011: 復活手順を確定する

Files:
- `docs/planning/archive/guides-retirement-v1.md`

変更:
1. GR-003〜GR-008 の commit SHA を一覧化する。
2. 復活手順を 2 経路で書く。
   - 速経路: 対象 commit 群を `git revert`（または撤去前 SHA からの cherry-pick）。
   - 手動経路: 型 → data → lib → validator → UI → nav → sitemap の順に再追加するチェックリスト。
3. 復活時の注意（evidence model 導入後なので UseCase 側の型・validator が当時と異なる点）を書く。

完了条件:
- archive 文書だけで、コードを知らない後続 AI / 人が復活に着手できる。

### GR-012: 最終検証

Files: なし

実行:
1. `npm run validate:data`
2. `npm run build`
3. 手動: `/`、`/robots`、`/manufacturers`、`/reports` と任意 `/reports/[slug]`、`/use-cases` と任意 `/use-cases/[slug]`、`/compare`
4. `/guides` 直アクセスが 404。
5. ヘッダー nav にガイドが無い。
6. サイト内検索でガイドが出ない。
7. `rg -n "guide|Guide|guides|guide-topic|relatedGuideIds|ComingSoonGate" src components lib data --no-ignore`（無関係語以外ゼロ）。

完了条件:
- validate / build が通る。
- ガイドが UI・nav・sitemap・search・データから消えている。
- 残存 guide 痕跡が無関係語のみ。

## 6. 順序制約

- 消費側 → 定義側の順を守る。GR-003/004/005（消費・ルート）→ GR-006（フィールド）→ GR-007（型本体）。逆順は TypeScript が壊れる。
- GR-006 と GR-007 はそれぞれ atomic。フィールド削除と読み取り削除、型削除とアクセサ削除を別 commit に割らない。
- GR-002（archive 退避）は GR-007（`data/guides.ts` 削除）より前に必ず行う。退避前に消すと本文を git 履歴からしか拾えなくなる。
- GR-008 の `ComingSoonGate` 削除は GR-005（`/guides` ルート削除）より後。ルートが残ると参照が残る。
- docs（GR-009/010）はコード撤去（GR-003〜008）が終わってから。コードと docs の食い違いを途中に作らない。

## 7. 実装しないこと

- 「意思決定変数の地図」を reports に作り直す作業（別計画・別判断）。
- `/use-cases` evidence model の変更。
- reports / robots / manufacturers の機能改修。
- ガイド型を `@deprecated` で休眠保持する形での残置（§3 方針に反する）。
- 撤去前 SHA や 2 件本文を残さない完全消去（復活困難になるため禁止）。

## 8. 復活を容易にするための保証（§3 参照）

§3 の方針を満たす具体物のみ再掲する。

- 撤去前 commit SHA: GR-001 で記録 → GR-011 で archive に固定。
- 原子的 commit 列（GR-003〜008）で `git revert` 可能。
- `Guide` / `GuideStage` 型・`guide-topic` 値・2 件本文の archive 保存: GR-002。
- 復活時は evidence model 導入後の `UseCase` 型・validator に合わせる注意: GR-011。

## 9. 完了の定義

- ガイドが UI・nav・sitemap・search・データ・型・validator から完全に消えている。
- 休眠コード（未使用の guide 型・関数・タグ・uiText）が残っていない。
- `npm run validate:data` と `npm run build` が通る。
- docs と先行計画にガイド前提の残骸がない。
- `docs/planning/archive/guides-retirement-v1.md` だけで復活に着手できる。
- 撤去後、本計画は `docs/planning/archive/` へ移動する（80-doc-governance の完了ルール）。
