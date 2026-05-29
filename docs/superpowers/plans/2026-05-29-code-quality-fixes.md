# Code Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 未コミット変更を論理的な単位でコミットし、SSOT違反（ContactInquiryType）とアクセシビリティ不足（aria-current）を修正する。

**Architecture:** 修正範囲を最小に保つ。`lib/labels.ts` に型付きラベルを追加し、`ContactForm.tsx` を既存型に接続するだけ。Header の aria-current は1行の追加。新しいコンポーネントは作らない。

**Tech Stack:** Next.js 15/App Router, TypeScript, Tailwind CSS v4

---

## 現状確認（実行前に把握すること）

- `git status` の確認済み：branch は `origin/main` と同期済み
- 未コミット変更（staged なし）：18ファイル変更 + 3ファイル未追跡
- 変更内容は3つの論理グループに分けてコミットする
- その後に新しいコード修正（SSOT, A11y）を行い、各1コミット

---

## Phase 0: 既存の未コミット変更をコミット

### Task 1: データモデル・バリデーション グループのコミット

**Files:**
- Modify: `data/types.ts`
- Modify: `data/robots.ts`
- Modify: `data/manufacturers.ts`
- Create: `lib/validate.ts`
- Modify: `docs/planning/nextjs_data_types_v1.ts`

- [ ] **Step 1: 差分の確認**

```bash
git diff data/types.ts data/robots.ts data/manufacturers.ts lib/validate.ts
```

内容を確認し、意図しない変更が混入していないかチェックする。

- [ ] **Step 2: ステージ**

```bash
git add data/types.ts data/robots.ts data/manufacturers.ts lib/validate.ts docs/planning/nextjs_data_types_v1.ts
```

- [ ] **Step 3: コミット**

```bash
git commit -m "$(cat <<'EOF'
feat(data): add robots/manufacturers data and referential integrity validator

lib/validate.ts でslug重複・存在しないslug参照・双方向リンク不整合をdev起動時に検出する。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: コンポーネント・メディア権利 グループのコミット

**Files:**
- Modify: `components/Footer.tsx`
- Modify: `components/ManufacturerLogoName.tsx`
- Modify: `components/RobotCard.tsx`
- Modify: `components/RobotImageCarousel.tsx`
- Create: `lib/media.ts`
- Modify: `src/app/contact/page.tsx`
- Modify: `docs/planning/copyright_and_media_rights_policy_v1.md`
- Modify: `docs/planning/humanoid_data_management_guide_v1.md`
- Modify: `docs/planning/humanoid_data_model_policy_v1.md`

- [ ] **Step 1: 差分の確認**

```bash
git diff components/Footer.tsx components/ManufacturerLogoName.tsx components/RobotCard.tsx components/RobotImageCarousel.tsx src/app/contact/page.tsx
```

- [ ] **Step 2: ステージ**

```bash
git add components/Footer.tsx components/ManufacturerLogoName.tsx components/RobotCard.tsx components/RobotImageCarousel.tsx lib/media.ts src/app/contact/page.tsx docs/planning/copyright_and_media_rights_policy_v1.md docs/planning/humanoid_data_management_guide_v1.md docs/planning/humanoid_data_model_policy_v1.md
```

- [ ] **Step 3: コミット**

```bash
git commit -m "$(cat <<'EOF'
feat(media): add media rights gate and update image display components

lib/media.ts で画像・ロゴの表示可否を権利status基準でgateする。
RobotCard/RobotImageCarousel/ManufacturerLogoName を media gate 経由に更新。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: ドキュメント・設定 グループのコミット

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/planning/README.md`
- Modify: `docs/planning/publish_todo_v1.md`
- Modify: `docs/planning/refactor_search_tags_phase9_final_audit_v1.md`
- Create: `docs/planning/design_system_v1.md`
- Create: `docs/planning/ui_architecture_and_development_policy_v1.md`

- [ ] **Step 1: ステージ**

```bash
git add .env.example README.md docs/planning/README.md docs/planning/publish_todo_v1.md docs/planning/refactor_search_tags_phase9_final_audit_v1.md docs/planning/design_system_v1.md docs/planning/ui_architecture_and_development_policy_v1.md
```

- [ ] **Step 2: コミット**

```bash
git commit -m "$(cat <<'EOF'
docs: add design system and UI architecture policy documents

design_system_v1.md と ui_architecture_and_development_policy_v1.md を追加。
neutral/矩形/情報密度のデザイン方針とコンポーネント責務を明文化。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: 未コミット変更がゼロになったか確認**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

---

## Phase 1: SSOT修正 — ContactInquiryType を lib/labels.ts に移動

### 問題

`components/ContactForm.tsx:6` で `inquiryTypes = ['情報提供・修正', ...]` を文字列配列として直書きしている。`data/types.ts` に `ContactInquiryType` Union型が既に定義されているのに、ラベル・順序がコンポーネント内に閉じている。

### Task 4: lib/labels.ts に ContactInquiryType ラベルを追加

**Files:**
- Modify: `lib/labels.ts` (末尾に追加)

- [ ] **Step 1: lib/labels.ts 末尾に追加**

`lib/labels.ts` の `reliabilityLabels` の後（ファイル末尾）に以下を追記する：

```typescript
import type {
  // 既存import に ContactInquiryType を追加
  ContactInquiryType,
  // ... 既存のimport
} from '@/data/types';
```

**注意:** import文はファイル先頭の既存 import ブロックに `ContactInquiryType` を追加する。末尾ではなく先頭のimportを編集。

追加するエクスポート（ファイル末尾に追記）：

```typescript
export const contactInquiryTypeLabels: Record<ContactInquiryType, string> = {
  'data-correction': '情報提供・修正',
  'listing-request': '掲載相談',
  'interview-request': '取材相談',
  'adoption-consultation': '導入相談',
  'other': 'その他',
};

export const contactInquiryTypeOrder: ContactInquiryType[] = [
  'data-correction',
  'listing-request',
  'interview-request',
  'adoption-consultation',
  'other',
];
```

- [ ] **Step 2: ContactForm.tsx を更新**

`components/ContactForm.tsx` の変更点：

削除：
```typescript
const inquiryTypes = ['情報提供・修正', '掲載相談', '取材相談', '導入相談', 'その他'];
```

追加（import に）：
```typescript
import { contactInquiryTypeLabels, contactInquiryTypeOrder } from '@/lib/labels';
```

`select` の `defaultValue` と `map` を変更：

変更前：
```tsx
defaultValue={inquiryTypes[3]}
// ...
{inquiryTypes.map((t) => (
  <option key={t} value={t}>
    {t}
  </option>
))}
```

変更後：
```tsx
defaultValue="adoption-consultation"
// ...
{contactInquiryTypeOrder.map((type) => (
  <option key={type} value={contactInquiryTypeLabels[type]}>
    {contactInquiryTypeLabels[type]}
  </option>
))}
```

**Note:** `value` を日本語ラベルにするのは、Formspree に送られるメール本文の可読性を維持するため。型安全な順序管理だけを `lib/labels.ts` に移す。

- [ ] **Step 3: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add lib/labels.ts components/ContactForm.tsx
git commit -m "$(cat <<'EOF'
refactor(ssot): move ContactInquiryType labels to lib/labels.ts

ContactForm.tsx の直書き文字列配列を ContactInquiryType 型で管理する
contactInquiryTypeOrder / contactInquiryTypeLabels に置き換え。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: アクセシビリティ修正 — aria-current="page"

### 問題

`components/Header.tsx:37-44` の nav Link に `aria-current` が無い。スクリーンリーダーがアクティブページを認識できない。

### Task 5: Header.tsx に aria-current を追加

**Files:**
- Modify: `components/Header.tsx:37-44`

- [ ] **Step 1: Link に aria-current を追加**

変更前：
```tsx
<Link
  key={item.path}
  href={item.path}
  className={`px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'text-neutral-900 font-medium'
      : 'text-neutral-600 hover:text-neutral-900'
  }`}
>
  {item.label}
</Link>
```

変更後：
```tsx
<Link
  key={item.path}
  href={item.path}
  aria-current={isActive ? 'page' : undefined}
  className={`px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'text-neutral-900 font-medium'
      : 'text-neutral-600 hover:text-neutral-900'
  }`}
>
  {item.label}
</Link>
```

- [ ] **Step 2: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add components/Header.tsx
git commit -m "$(cat <<'EOF'
fix(a11y): add aria-current="page" to active nav link in Header

スクリーンリーダーが現在ページを認識できるよう aria-current を追加。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: 完了確認

### Task 6: 最終チェック

- [ ] **Step 1: git log で5コミット確認**

```bash
git log --oneline -8
```

Expected: Task 1〜5 の5コミットが上に積まれている

- [ ] **Step 2: git status がクリーン**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

- [ ] **Step 3: ビルド最終確認**

```bash
npm run build
```

Expected: エラーなし

---

## 今回やらないこと

- DRY: Tailwindクラスの共通コンポーネント化（3箇所以上使われる部品が出てから）
- Browser コンポーネントの共通hook化（情報設計が固まってから）
- `as ReportType` 型キャストのランタイム検証追加（現在は機能上問題なし）
- shadcn/ui等のUIライブラリ導入
