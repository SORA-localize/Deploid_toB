# Project Wide Refactor Implementation Plan v1

Status: active/unimplemented plan
Created: 2026-06-26
Branch: `refactor/project-wide-refactor`

この文書は、Deploid 全体リファクタリングを AI が迷わず実装できる粒度まで分解した実行計画です。
実装判断の正本ではありません。実装時は常に現行コード、型、`docs/planning/README.md` の正本群を優先します。

## 0. 目的

1. 明確なバグを先に直す。
2. データ正本・検証・出典方針の揺れをなくす。
3. UI/レイアウト/状態管理の重複を、挙動を変えずに小さく統合する。
4. 未使用コンポーネント・未使用依存・古い命名やコメントを整理する。
5. 各変更を build 可能な最小単位で進め、途中で止まっても main に戻せる状態を保つ。

## 1. 実装前に必ず読むもの

実装開始前に、以下をこの順で読む。

1. `AGENTS.md`
2. `ai/rules/00-index.md`
3. `ai/rules/10-workflow.md`
4. `docs/planning/README.md`
5. `docs/planning/data-architecture-redesign-v1.md`
6. `docs/planning/data-maintenance-checklist-v1.md`
7. `docs/planning/design_system_v1.md`
8. `docs/planning/ui_architecture_and_development_policy_v1.md`
9. `docs/planning/copyright_and_media_rights_policy_v1.md`

## 2. 共通ルール

- 1 task につき、原則 1 commit にできる大きさにする。
- task 内で別の問題を見つけても、その場で混ぜて直さない。新しい task として追記する。
- `data/*.ts` の事実値更新は、出典・checkedAt・rights を確認してから行う。
- ユーザー作業と思われる未コミット差分は戻さない。
- 各 task の最後に `npm run validate:data` と `npm run build` を実行する。ただし文書だけの変更では build は任意。
- 見た目を触る task は、desktop と mobile の両方で表示確認する。
- `docs/` は ignore 対象になり得るため、検索時は明示パスまたは `--no-ignore` を使う。

## 3. 現在の前提

2026-06-26 調査時点:

- 現ブランチ: `refactor/project-wide-refactor`
- 未コミット差分: `package.json` / `package-lock.json` に Playwright 追加。調査では未編集。
- `npm run validate:data`: OK
- `npm run build`: OK
- build warning: `src/app/opengraph-image.tsx` の edge runtime により該当ページの静的生成が無効化される。
- データ件数:
  - robots: 57 total / 56 published / 1 archived
  - manufacturers: 23 published
  - articles: 29 published
  - guides: 2 published
  - useCases: 8 published
  - deployments: 11 published
- sources 空:
  - guides: `decision-variables`, `poc-planning`
  - useCases: `warehouse-picking`, `factory-inspection`, `research-development`, `demo-exhibition`

## 4. 実装フェーズ

実装順は固定する。上から順に進める。

1. Phase A: 安全確認とベースライン
2. Phase B: P1 挙動バグ修正
3. Phase C: 出典・検証方針の統一
4. Phase D: アクセシビリティと基本UIの修正
5. Phase E: 公開導線・SEO・計測まわりの整理
6. Phase F: 未使用コンポーネント・依存整理
7. Phase G: 命名・文言・古いコメント整理
8. Phase H: フィルタ・検索・URL state 整理
9. Phase I: レイアウト共通化
10. Phase J: 最終検証

## 5. Phase A: 安全確認とベースライン

### A-001: ブランチと未コミット差分を確認する

Files: なし

手順:
1. `git status --short --branch` を実行する。
2. ブランチが `refactor/project-wide-refactor` であることを確認する。
3. 未コミット差分が `package.json` / `package-lock.json` の Playwright 追加だけか確認する。
4. それ以外の差分がある場合は、実装前にユーザー由来として扱い、戻さない。

完了条件:
- 現ブランチと差分内容を作業メモまたは最終報告に書ける。

### A-002: ベースライン検証を実行する

Files: なし

手順:
1. `npm run validate:data` を実行する。
2. `npm run build` を実行する。
3. warning が `opengraph-image` の edge runtime だけか確認する。

完了条件:
- validate と build が通る。
- 失敗した場合は、この計画の実装に入らず、失敗内容を先に別 task 化する。

## 6. Phase B: P1 挙動バグ修正

### B-001: ManufacturerCard の全面リンク z-index バグを修正する

Files:
- `components/ManufacturerCard.tsx`

問題:
- 全面詳細リンクが `absolute inset-0 z-20`。
- 中身の外部HPリンク・代理店リンク/Popover は `z-10` 配下。
- コメントでは `pointer-events-auto` で温存とあるが、z-index 上は全面リンクが上にいるため、内部リンク操作を妨げる可能性が高い。

変更:
1. 全面詳細リンクの class を `absolute inset-0 z-0` に変更する。
2. 中身ラッパーは `relative z-10 p-4 sm:p-6 pointer-events-none` のまま維持する。
3. 内部の外部HPリンク、代理店リンク、Popover trigger/content は `pointer-events-auto` を維持する。
4. コメントを実装に合わせて更新する。

技術前提:
- この修正は「中身ラッパー z-10 が全面リンク z-0 より上にあり、ラッパー自体は `pointer-events-none` なので空白クリックだけ下の全面リンクへ貫通し、内部リンクだけ `pointer-events-auto` で捕捉する」挙動に依存する。
- `ManufacturerCard.tsx` の glow / shimmer / 下線装飾は z-30 / z-40 だが `pointer-events-none` なので、全面リンクを z-0 に下げてもクリックを妨げない前提で実装する。

完了条件:
- カードの空白部分クリックで `/manufacturers/{slug}` へ遷移する。
- メーカー名/ロゴの外部HPリンクをクリックすると `manufacturer.website` が開く。
- 国内代理店が複数のカードで Popover trigger が開く。
- Popover 内リンクをクリックできる。
- keyboard tab で全面リンクと内部リンクに到達できる。
- glow / shimmer / 下線装飾が hover 表示され、クリック対象を妨げない。

検証:
- `npm run build`
- 手動確認: `/manufacturers`

### B-002: ManufacturerCard 修正後に不要な pointer-events 指定がないか確認する

Files:
- `components/ManufacturerCard.tsx`

手順:
1. `pointer-events-none` と `pointer-events-auto` の組み合わせを読み直す。
2. 内部リンクがクリック不能なら、内部リンクの親要素にも `pointer-events-auto` を追加する。
3. Popover content が全面リンクの下に潜る場合は、content の `z-[var(--z-dropdown)]` が有効か確認する。

完了条件:
- B-001 の完了条件が全て満たされる。
- 余計な z-index の増加をしていない。

## 7. Phase C: 出典・検証方針の統一

### C-001: Guide/UseCase の sources 方針を決める

Files:
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `lib/validate.ts`
- `data/guides.ts`
- `data/useCases.ts`

現状:
- `data-architecture-redesign-v1.md` は「出典必須」。
- `data-maintenance-checklist-v1.md` は Guide/UseCase sources を「手動推奨（validate 未強制）」。
- 実データは Guide 2件、UseCase 4件で sources 空。

決定肢:
- Option A: Guide/UseCase も published なら sources 必須にする。
- Option B: Guide/UseCase は編集方針・概念整理コンテンツとして、sources 未強制を明文化する。

推奨:
- Option A。B2B判断支援サイトとして、用途・ガイドも出典のある公開情報に寄せる。

完了条件:
- Option A/B のどちらを採用するか、実装前にユーザーまたはオーナーが明示する。
- 決定結果をこの文書または後続の変更PR説明に残す。
- 採用 Option に対応する実装 task ID を明記する。Option A は C-002A/C-003A/C-004A、Option B は C-002B。

### C-002A: Option A 採用時、Guide sources を追加する

Files:
- `data/guides.ts`

対象:
- `decision-variables`
- `poc-planning`

変更:
1. 各 guide の `sources: []` を、最低1件以上の `Source[]` に置き換える。
2. source は公式資料、規格、信頼できる一次/準一次情報に限定する。
3. `checkedAt` は確認日を ISO 日付で入れる。
4. `reliability` は `official` / `verified` / `reported` のいずれかを根拠に応じて選ぶ。
5. 不明な出典を仮で入れない。

完了条件:
- Guide 2件の `sources.length > 0`。
- `npm run validate:data` が通る。

### C-003A: Option A 採用時、UseCase sources を追加する

Files:
- `data/useCases.ts`

対象:
- `warehouse-picking`
- `factory-inspection`
- `research-development`
- `demo-exhibition`

変更:
1. 各 useCase の `sources: []` を、最低1件以上の `Source[]` に置き換える。
2. useCase の主張に紐づく sources を入れる。
3. 強い導入実績がある useCase は、対応する `data/deployments.ts` と矛盾しない sources を選ぶ。
4. `checkedAt` は確認日を ISO 日付で入れる。

完了条件:
- UseCase 8件すべての `sources.length > 0`。
- `npm run validate:data` が通る。

### C-004A: Option A 採用時、validate で Guide/UseCase sources を強制する

Files:
- `lib/validate.ts`
- `docs/planning/data-maintenance-checklist-v1.md`

実施前提:
- C-002A と C-003A が完了し、published Guide/UseCase の `sources` が空でない状態になってから実施する。
- この順序を守らないと、validate 強制を入れた時点で `npm run validate:data` が失敗する。

変更:
1. `lib/validate.ts` の guide loop 内で `checkRequiredSources('guide', g.slug, g.sources, { requireNonEmpty: g.publishStatus === 'published' })` を呼ぶ。
2. useCase loop 内で `checkRequiredSources('useCase', u.slug, u.sources, { requireNonEmpty: u.publishStatus === 'published' })` を呼ぶ。
3. `data-maintenance-checklist-v1.md` の Guide/UseCase sources 記述を「自動: published は必須」に更新する。

完了条件:
- sources を空にした published Guide/UseCase で validate が失敗する。
- 現データでは `npm run validate:data` が通る。

### C-002B: Option B 採用時、未強制方針を正本側へ明文化する

Files:
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/data-maintenance-checklist-v1.md`

変更:
1. `data-architecture-redesign-v1.md` の「出典必須」原則に例外を追加する。
2. 例外は Guide/UseCase の概念整理本文に限定し、機体性能・導入事例・価格・規格・法務判断などの事実値は sources 必須と書く。
3. `data-maintenance-checklist-v1.md` と表現を一致させる。

完了条件:
- 2つの文書で矛盾がない。
- `lib/validate.ts` は変更しない。

## 8. Phase D: アクセシビリティと基本UIの修正

### D-001: searchable SelectControl の label/htmlFor 不一致を修正する

Files:
- `components/SelectControl.tsx`
- `components/ui/searchable-dropdown.tsx`

問題:
- `SelectControl` は `<label htmlFor={`${id}-trigger`}>`。
- `SearchableDropdown` は trigger id を `${id}-${reactId}-trigger` にしている。
- searchable のとき label click が trigger に紐づかない。

変更:
1. `SearchableDropdownProps` に `triggerId?: string` を追加する。
2. `SearchableDropdown` 内の button id は `triggerId ?? `${baseId}-trigger`` にする。
3. `SelectControl` から `triggerId={`${id}-trigger`}` を渡す。
4. `aria-label` は既存のまま維持する。

完了条件:
- searchable select の label click で trigger に focus または open できる。
- この task の目的は label click の紐付け修正であり、読み上げ名の改善ではない。`aria-label` が accessible name として優先される状態は維持する。
- non-searchable select の挙動が変わらない。
- TypeScript が通る。

検証:
- `/robots`
- `/manufacturers`
- `/use-cases`
- `/compare` mobile 幅
- `npm run build`

### D-002: グローバル scrollbar 非表示をやめる

Files:
- `src/app/globals.css`

問題:
- `* { scrollbar-width: none; -ms-overflow-style: none; }`
- `*::-webkit-scrollbar { display: none; }`
- すべてのスクロール可能領域でスクロールバーが消え、横スクロールUIの発見性が落ちる。

変更:
1. `@layer base` 内の全体 scrollbar 非表示指定を削除する。
2. 必要な場合のみ `@layer utilities` に `.scrollbar-none` を追加する。
3. `.scrollbar-none` を追加した場合も、既存箇所へ一括適用しない。必要が確認できた箇所だけ別 task で適用する。

完了条件:
- ページ全体のスクロールバーがブラウザ標準で表示される。
- 横スクロールが必要なUIで、スクロール可能性が視覚的に分かる。
- レイアウト崩れがない。

検証:
- `/robots`
- `/reports`
- `/compare`
- mobile 幅
- `npm run build`

### D-003: useTiltCardEffect を reduced motion に対応させる

Files:
- `lib/useTiltCardEffect.ts`
- 利用元: `components/RobotCard.tsx`, `components/ManufacturerCard.tsx`, `components/FeaturedRobotCard.tsx`, `components/UseCaseCard.tsx`

変更:
1. `motion/react` から `useReducedMotion` を import する。
2. `const shouldReduceMotion = useReducedMotion();` を hook 内で使う。
3. `shouldReduceMotion` が true の場合、mouse move で `normX/normY` を更新しない。
4. `handleMouseEnter` でも glow を強制表示しない。
5. 返却する `rotateX` / `rotateY` の型を変えない。

完了条件:
- reduced motion 有効環境でカードの tilt/glow が動かない。
- 通常環境では既存の hover 演出が残る。
- 利用元コンポーネントの props や JSX は変更しない。

## 9. Phase E: 公開導線・SEO・計測まわりの整理

### E-001: `/guides` の ComingSoonGate 方針を決める

Files:
- `src/app/guides/page.tsx`
- `components/ComingSoonGate.tsx`
- `components/ComingSoonOverlay.tsx`

現状:
- `guides` は published データと detail page がある。
- ただし一覧 `/guides` は `ComingSoonGate` で隠している。

決定肢:
- Option A: `/guides` を正式公開し、ComingSoonGate を外す。
- Option B: `/guides` をプレビュー扱いにし、noindex/導線/文言をそれに合わせる。

推奨:
- Option A。published detail pages があるため、一覧だけ隠す状態は認識齟齬を生む。

完了条件:
- Option A/B のどちらを採用するか明示されている。
- 採用 Option に対応する実装 task ID を明記する。Option A は E-002A、Option B は E-002B。

### E-002A: Option A 採用時、Guides の ComingSoonGate を削除する

Files:
- `src/app/guides/page.tsx`

変更:
1. `ComingSoonGate` import を削除する。
2. `GuidesBrowser` を直接 return する。
3. `storageKey="coming-soon:guides"` に依存する処理をなくす。

完了条件:
- `/guides` にアクセスすると一覧が即表示される。
- localStorage の状態に依存しない。
- `npm run build` が通る。

### E-002B: Option B 採用時、Guides の preview 状態を明示する

Files:
- `src/app/guides/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/sitemap.ts`
- `lib/metadata.ts` または該当 metadata 生成箇所

変更:
1. `/guides` と `/guides/[slug]` を noindex にする。
2. sitemap から guides を除外するか、noindex と矛盾しない方針を明記する。
3. ComingSoonGate の文言を `uiText` に寄せる。

完了条件:
- preview として検索流入させない状態になる。
- sitemap / robots / metadata に矛盾がない。

### E-003: opengraph-image の build warning を解消する

Files:
- `src/app/opengraph-image.tsx`

変更:
1. `export const runtime = 'edge';` を削除して build する。
2. build が通り、warning が消えるか確認する。
3. warning が消えない、または Next.js の仕様上必要なら、削除を戻し、コメントに理由を書く。

完了条件:
- build warning が消える、または意図的に残す理由がファイル内コメントかPR説明に残る。
- OGP画像の表示崩れがない。
- `npm run build` が通る。

### E-004: opengraph-image の letterSpacing を design rule に合わせる

Files:
- `src/app/opengraph-image.tsx`

変更:
1. `letterSpacing: -4` を `letterSpacing: 0` に変更する。
2. E-003 と同じ commit に混ぜない。

完了条件:
- OGP画像の表示崩れがない。
- `npm run build` が通る。

### E-005: 外部リンク rel を統一する

Files:
- `components/RobotStickyAside.tsx`
- `components/SourceList.tsx`
- `components/RobotImageCarousel.tsx`

変更:
1. `rel="noreferrer"` を `rel="noopener noreferrer"` に統一する。
2. 既に `noopener noreferrer` の箇所は変更しない。

完了条件:
- `rg -n 'rel="noreferrer"' src components lib data` で該当がない。
- 外部リンクの挙動が変わらない。

## 10. Phase F: 未使用コンポーネント・依存整理

順序制約:
- `package.json` / `package-lock.json` を触る F-004/F-005 は、必ず F-003 で Playwright の扱いを決めてから実施する。
- F-003 で Playwright を残す判断にした場合、F-004/F-005 の lockfile 更新では既存の Playwright 追加差分を保持する。
- F-003 で Playwright を戻す判断にした場合も、この計画だけで勝手に戻さず、ユーザー承認後の別 task とする。

### F-001: ComingSoonOverlay / ComingSoonGate の参照有無を再確認して削除する

Files:
- `components/ComingSoonOverlay.tsx`
- `components/ComingSoonGate.tsx`

手順:
1. `rg -n "ComingSoonOverlay|ComingSoonGate" src components lib data` を実行する。
2. `ComingSoonOverlay` の参照がファイル自身だけなら削除する。
3. E-002A を採用して `/guides` から `ComingSoonGate` を外した場合、`ComingSoonGate` の参照がファイル自身だけなら削除する。
4. E-002B を採用して preview gate を残す場合、`ComingSoonGate` は削除しない。

完了条件:
- 未使用の ComingSoon 系コンポーネントが削除されている。
- 使用されている ComingSoon 系コンポーネントは削除していない。
- `npm run build` が通る。

### F-002: ui/marquee と global marquee keyframes を削除する

Files:
- `components/ui/marquee.tsx`
- `src/app/globals.css`

注記:
- D-002 も `src/app/globals.css` を触るが、対象は scrollbar 指定であり、この task の対象は marquee token/keyframes。別ブロックとして扱い、同じ差分に混ぜない。

手順:
1. `rg -n "Marquee|components/ui/marquee|animate-marquee|marquee" src components lib` を実行する。
2. 参照がない場合、`components/ui/marquee.tsx` を削除する。
3. `globals.css` の `--animate-marquee`, `--animate-marquee-vertical`, `@keyframes marquee`, `@keyframes marquee-vertical` を削除する。

完了条件:
- marquee 関連の未使用コードが残らない。
- `npm run build` が通る。

### F-003: Playwright の扱いを決める

Files:
- `package.json`
- `package-lock.json`

現状:
- Playwright は未コミット差分として追加済み。
- ただし test script や config はない。

決定肢:
- Option A: Playwright を正式採用し、最低限の smoke test と script を追加する。
- Option B: 今回のリファクタ範囲では採用せず、既存差分をユーザー判断に委ねる。

この task では勝手に削除しない。

完了条件:
- Playwright を残す/使う/戻す方針が明示されている。
- 採用 Option に対応する実装 task ID を明記する。Option A は別途 Playwright 導入 task を作る。Option B は package 差分を保持したまま F-004/F-005 へ進む。

### F-004: carousel の framer-motion import を motion/react に寄せる

Files:
- `components/uilayouts/carousel.tsx`
- `package.json`
- `package-lock.json`

変更:
1. `components/uilayouts/carousel.tsx` の `import { AnimatePresence, motion } from "framer-motion";` を `motion/react` に変更する。
2. `rg -n "framer-motion" src components lib package.json` を実行する。
3. import がなくなったら `framer-motion` dependency を削除する。
4. `npm install` で lockfile を更新する。
5. F-003 で Playwright を残す判断の場合、lockfile 更新後も Playwright 追加差分が消えていないことを確認する。

完了条件:
- `framer-motion` のコード参照がない。
- `package.json` に `framer-motion` がない。
- carousel が動く。
- `npm run build` が通る。

### F-005: 未使用依存を削除する

Files:
- `package.json`
- `package-lock.json`

対象候補:
- `@microsoft/clarity`
- `@radix-ui/react-icons`
- `embla-carousel-class-names`

手順:
1. 各 package 名で `rg -n` する。
2. コード参照がないことを確認する。
3. `npm uninstall` で対象を削除する。
4. `npm run build` を実行する。
5. F-003 で Playwright を残す判断の場合、lockfile 更新後も Playwright 追加差分が消えていないことを確認する。

完了条件:
- 未使用依存が `package.json` から消えている。
- Clarity は `components/AnalyticsScripts.tsx` の Script 直書きで引き続き動く。
- `npm run build` が通る。

## 11. Phase G: 命名・文言・古いコメント整理

### G-001: CompareClient の setOrderedSlugs を setOrderedIds に改名する

Files:
- `components/CompareClient.tsx`

変更:
1. `const [orderedIds, setOrderedSlugs]` を `setOrderedIds` に改名する。
2. 同ファイル内の呼び出しを全て更新する。
3. 挙動は変えない。

完了条件:
- `rg -n "setOrderedSlugs" components/CompareClient.tsx` で該当なし。
- compare の追加、削除、並び替え、URL同期が動く。

### G-002: CompareClient の直書きUI文言を uiText に寄せる

Files:
- `components/CompareClient.tsx`
- `lib/uiText.ts`

対象例:
- `メーカーを選択`
- `左のメニューからロボットを選んで比較します...`
- `メーカーを選んでロボットを追加してください。`
- `メーカー`
- `このメーカーのロボットデータはありません。`

変更:
1. `lib/uiText.ts` の `compare` 配下に不足キーを追加する。
2. `CompareClient.tsx` の該当文字列を `uiText.compare.*` に置き換える。
3. 文章は変更しない。

完了条件:
- 対象文字列が `CompareClient.tsx` に残っていない。
- 表示文言が変更前と同じ。
- `npm run build` が通る。

### G-003: stale コメントを削除または現状に合わせる

Files:
- `data/types.ts`
- `README.md`
- `src/app/layout.tsx`
- `src/app/page.tsx`

対象:
- `data/types.ts` 冒頭の "Copy this file..." コメント。
- `README.md` の "Figma Make UI を逐語移植"。
- `src/app/layout.tsx` の "Figma Layout.tsx を逐語移植"。
- `src/app/page.tsx` の歴史的説明が長すぎる場合。

変更:
1. 現行の正本・実装状態に合わせた短い説明へ更新する。
2. 過去経緯は必要最小限にする。
3. 仕様判断を変えない。

完了条件:
- 新規参加者が読んで現状を誤解しない。
- `npm run build` が通る。

### G-004: ComparisonRobotPanel の未使用 prop を整理する

Files:
- `components/ComparisonRobotPanel.tsx`
- 呼び出し元: `components/CompareClient.tsx` など

現状:
- `manufacturerLogo?: ImageAsset; // 現在未使用`

変更:
1. 呼び出し元が `manufacturerLogo` を渡しているか確認する。
2. 渡していないなら prop と import 型を削除する。
3. 渡しているなら呼び出し元からも削除する。

完了条件:
- 未使用 prop が残らない。
- compare 表示が変わらない。

## 12. Phase H: フィルタ・検索・URL state 整理

順序制約:
- guides 関連の変更は E-001/E-002A または E-002B で公開/preview 方針を確定してから行う。
- guides 周辺を触る順番は E → H → I とする。具体的には guides 公開方針、guide filter、guides detail layout の順に進める。

### H-001: guide topic filter の無効値処理を他一覧と揃える

Files:
- `lib/guideFilters.ts`
- `src/app/guides/page.tsx`
- `components/GuidesBrowser.tsx`

問題:
- `stage` は許可値チェックあり。
- `topic` は normalize だけで、存在しない topic でも残る。
- 他一覧は不正値を null/all に戻す。

変更:
1. `getGuideFilterOptions(guides)` を `lib/guideFilters.ts` に追加する。
2. `topics` は `guides.flatMap((g) => g.topics)` の unique 値から作る。
3. `normalizeGuideFilters` に `topicValues` を渡せるようにする。
4. `topic` は normalize 後、`topicValues.includes(topic)` のときだけ採用する。
5. `src/app/guides/page.tsx` で filter options を作って normalize に渡す。
6. `GuidesBrowser` 側の表示 options と同じ値集合を使う。

完了条件:
- `/guides?topic=not-real` は all 相当に戻る。
- 既存の有効 topic filter は動く。
- `npm run build` が通る。

### H-002: 一覧ページの cache 方針を決める

Files:
- `src/app/robots/page.tsx`
- `src/app/manufacturers/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/use-cases/page.tsx`

現状:
- `robots/page.tsx` だけ `CachedRobotsList` と `use cache` / `cacheLife` / `cacheTag` を持つ。
- 他の一覧は同じ形ではない。

決定肢:
- Option A: robots だけ cache する理由をコメントで明記し、現状維持。
- Option B: 一覧ページ共通の cache 方針に揃える。
- Option C: robots の custom cache を外し、他一覧と同じ単純な形に戻す。

推奨:
- まず Option A。性能問題が出ていない段階で全一覧へ cache を拡大しない。

完了条件:
- 採用方針がコードコメントまたはPR説明に残る。
- Option B/C を採用する場合は、対応する実装 task ID をこの計画へ追記するか、別計画/issue ID をPR説明に残す。

### H-003: search 実装の差異を文書化する

Files:
- `lib/search.ts`
- `lib/searchIndex.ts`
- 必要なら `docs/planning/ui_architecture_and_development_policy_v1.md`

現状:
- robots/manufacturers/useCases は includes ベース。
- articles は MiniSearch + 日本語 tokenization。

変更:
1. 差異が意図的か確認する。
2. 意図的なら `lib/searchIndex.ts` または docs に理由を書く。
3. 統一する場合は別計画に分ける。この記事検索の挙動変更はこの task で行わない。

完了条件:
- 後続AIが「なぜ articles だけ MiniSearch か」を理解できる。

## 13. Phase I: レイアウト共通化

このフェーズは、P1/P2 の明確な修正を終えてから行う。見た目差分が出やすいため、1 task で複数ページを同時に変えない。
guides detail を触る I-006B は、E-001/E-002 と H-001 が完了してから実施する。

### I-001: robots/use-cases 用 2カラム詳細レイアウトの共通コンポーネントを作る

Files:
- 新規: `components/DetailTwoColumnLayout.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`

新規 component の仕様:
- props:
  - `main: React.ReactNode`
  - `aside: React.ReactNode`
  - `className?: string`
- 出力:
  - `<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">`
  - main は `<div className="min-w-0">`
  - aside はそのまま右カラム

手順:
1. component だけ追加する。
2. まだ既存ページは置き換えない。
3. build する。

完了条件:
- 新規 component が build で通る。
- 既存ページの表示は未変更。

### I-002: robots/[slug] を DetailTwoColumnLayout に置き換える

Files:
- `src/app/robots/[slug]/page.tsx`
- `components/DetailTwoColumnLayout.tsx`

変更:
1. 既存の `grid grid-cols-1 lg:grid-cols-[1fr_280px]...` を component に置き換える。
2. main/aside の中身は変えない。
3. className や spacing は変えない。

完了条件:
- robots detail の desktop/mobile 見た目が変わらない。
- `npm run build` が通る。

### I-003: use-cases/[slug] を DetailTwoColumnLayout に置き換える

Files:
- `src/app/use-cases/[slug]/page.tsx`
- `components/DetailTwoColumnLayout.tsx`

変更:
1. robots と同じ component を使う。
2. main/aside の中身は変えない。

完了条件:
- useCase detail の desktop/mobile 見た目が変わらない。
- `npm run build` が通る。

### I-004: reports/guides 用 article detail grid の共通化方針を決める

Files:
- `src/app/reports/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`

現状:
- どちらも `site-container-content` + `grid grid-cols-12 gap-6`。
- TOC / main / sidebar の概念は近い。
- ただし reports は `ActiveSectionProvider`, `ArticleRelatedSidebar`, row/col 指定が guides より複雑。

決定肢:
- Option A: 共通 component は作らず、コメント整理と uiText 整理に留める。
- Option B: grid shell だけ共通化する。
- Option C: TOC/main/sidebar まで共通化する。

推奨:
- Option B。shell だけを共通化し、scrollspy/related sidebar の差異は残す。

完了条件:
- Option A/B/C のどれにするか決まっている。
- 採用 Option に対応する実装 task ID を明記する。Option A は実装なし、Option B は I-005B/I-006B/I-007B、Option C は別途 task を追加する。

### I-005B: Option B 採用時、ArticleDetailGrid を作る

Files:
- 新規: `components/ArticleDetailGrid.tsx`

新規 component の仕様:
- props:
  - `toc: React.ReactNode`
  - `main: React.ReactNode`
  - `meta?: React.ReactNode`
  - `sidebar: React.ReactNode`
  - `variant: 'report' | 'guide'`
- `variant='guide'` は現行 guides の column を再現する。
- `variant='report'` は現行 reports の column/row を再現する。
- component 内で文言は持たない。

完了条件:
- component 追加だけで build が通る。

### I-006B: guides/[slug] を ArticleDetailGrid に置き換える

Files:
- `src/app/guides/[slug]/page.tsx`
- `components/ArticleDetailGrid.tsx`

変更:
1. guides の `grid grid-cols-12 gap-6` shell を component に置き換える。
2. TOC/content/sidebar の中身は変えない。

完了条件:
- guides detail の desktop/mobile 見た目が変わらない。
- `npm run build` が通る。

### I-007B: reports/[slug] を ArticleDetailGrid に置き換える

Files:
- `src/app/reports/[slug]/page.tsx`
- `components/ArticleDetailGrid.tsx`

変更:
1. reports の `grid grid-cols-12 gap-6` shell を component に置き換える。
2. `ActiveSectionProvider` の範囲を変えない。
3. `ArticleRelatedSidebar` の trigger logic を変えない。

完了条件:
- reports detail の desktop/mobile 見た目が変わらない。
- scrollspy が動く。
- `npm run build` が通る。

## 14. Phase J: 最終検証

### J-001: validate/build を通す

Files: なし

手順:
1. `npm run validate:data`
2. `npm run build`

完了条件:
- どちらも成功する。
- build warning が残る場合、その warning の理由が既知である。

### J-002: 主要導線を手動確認する

対象:
- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/manufacturers/unitree`
- `/reports`
- 任意の `/reports/[slug]`
- `/guides`
- `/guides/decision-variables`
- `/use-cases`
- `/use-cases/warehouse-picking`
- `/compare`
- `/contact`
- `/privacy`

確認項目:
- ページが表示される。
- main navigation が動く。
- filter が URL と同期する。
- detail の previousSlugs redirect を壊していない。
- 外部リンクがクリックできる。
- mobile 幅で横はみ出しや重なりがない。

完了条件:
- 重大な表示崩れがない。
- 追加修正が必要な場合は新しい task として切り出す。

### J-003: 未使用候補を再検索する

Commands:
- `rg -n "ComingSoonOverlay|ComingSoonGate|Marquee|framer-motion|setOrderedSlugs|rel=\"noreferrer\"" src components lib data package.json --no-ignore`
- `rg -n "Figma|逐語|Copy this file|現在未使用" README.md src components lib data docs --no-ignore --glob '!docs/planning/archive/**'`

完了条件:
- 意図しない該当が残っていない。
- 残すものは理由がコメントまたはPR説明にある。

## 15. 実装しないこと

この計画では以下を実装しない。

- データ件数を増やすための新規 robot/manufacturer/article の追加。
- CMS 移行。
- デザイン全面刷新。
- 検索アルゴリズムの全面変更。
- Playwright 本格導入。採用する場合は F-003 で方針決定後に別計画にする。
- 画像権利ステータスの大量変更。必要なら `copyright_and_media_rights_policy_v1.md` に従って別 task 化する。

## 16. 推奨実装順まとめ

全体の推奨実装順は以下にする。各 Phase 内の task を飛ばす場合は、飛ばす理由と残す task ID を作業メモまたはPR説明に残す。

1. A-001, A-002
2. B-001, B-002
3. D-001
4. D-002
5. D-003
6. E-001, E-002A または E-002B
7. E-003
8. E-004
9. E-005
10. C-001
11. C-002A/C-003A/C-004A または C-002B
12. F-001, F-002
13. F-003
14. F-004, F-005
15. G-001, G-002, G-003, G-004
16. H-001, H-002, H-003
17. I-001 以降
18. J-001, J-002, J-003

## 17. 完了の定義

この計画全体の完了条件:

- P1 の ManufacturerCard bug が解消している。
- Guide/UseCase sources 方針が docs と validate のどちらかで一貫している。
- global scrollbar 非表示がなく、必要箇所だけ局所指定になっている。
- searchable select の label 紐付けが正しい。
- `/guides` の公開/preview 方針が実装と metadata に反映されている。
- 未使用コンポーネントと未使用依存が整理されている。
- 古い命名・古いコメントが現状に合っている。
- 主要 detail layout の重複が、見た目を変えずに必要範囲で共通化されている。
- `npm run validate:data` と `npm run build` が成功する。
