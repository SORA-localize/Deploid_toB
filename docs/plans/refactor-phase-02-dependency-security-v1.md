---
status: plan
updated: 2026-07-26
---

# Phase 2 Dependency Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** runtime依存の既知脆弱性を、利用実態とlockfile差分を確認しながら最小単位で解消し、以後の更新を自動で可視化する。

**Architecture:** 未使用の直接依存を先に削除し、Next.jsは16系修正版へ限定更新する。その後に残るtransitive advisoryをdependency path単位で追跡し、`npm audit fix --force`や無関係なmajor updateを避ける。

**Tech Stack:** npm、Next.js 16.2.12、GitHub Advisory Database、Dependabot、既存のPhase 1品質ゲート

## Global Constraints

- `npm audit fix --force`を使用しない。
- dependency群を一括major updateしない。
- 1つの直接依存または密接なdependency群ごとにcommitする。
- package削除前にsource import、script、config、CLI利用を検索する。
- 各lockfile変更後に`npm run check`を実行する。
- 2026-07-26監査値はhigh 7、moderate 5、low 1、critical 0。
- Next.jsの既知修正下限は16.2.11、2026-07-26時点のstable 16系は16.2.12。

---

## File Structure

### 新規作成

| Path | Responsibility |
|---|---|
| `docs/reference/dependency-audit-2026-07-26.md` | advisory、dependency path、対応結果 |
| `.github/dependabot.yml` | 週次npm/GitHub Actions update PR |

### 変更

| Path | Responsibility |
|---|---|
| `package.json` / `package-lock.json` | 未使用依存削除、patched versions |

---

### Task 1: 監査結果と到達経路を固定する

**Files:**
- Create: `docs/reference/dependency-audit-2026-07-26.md`

**Interfaces:**
- Consumes: `npm audit --omit=dev --json`、`npm explain <package>`
- Produces: before/after比較と残存risk台帳

- [ ] **Step 1: JSON監査を取得する**

```bash
npm audit --omit=dev --json
npm explain next
npm explain shadcn
npm explain sharp
npm explain postcss
```

Expected: total 13、high 7、moderate 5、low 1、critical 0。

- [ ] **Step 2: 利用実態を検索する**

```bash
rg -n "from ['\"]shadcn|require\\(['\"]shadcn|npx shadcn|npm exec shadcn" \
  --glob '!node_modules/**' \
  --glob '!package-lock.json' .
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" \
  src components
```

Expected: TypeScript/CLI利用は0件。ただし`src/app/globals.css`が`shadcn/tailwind.css`を1件importし、`components/ui/select.tsx`が`data-open`、`data-closed`、`data-disabled` variantを使っている。package削除前に標準のarbitrary data variantへ置換する。

- [ ] **Step 3: 監査文書を作る**

```markdown
# Dependency Audit — 2026-07-26

## Baseline
| Severity | Count |
|---|---:|
| critical | 0 |
| high | 7 |
| moderate | 5 |
| low | 1 |

## Direct dependencies
| Package | Installed | Advisory path | Action |
|---|---:|---|---|
| next | 16.2.6 | next, postcss, sharp | 16.2.12へ更新 |
| shadcn | 4.10.0 | MCP/Hono系 | CSS variant利用を標準Tailwind記法へ置換後に削除 |

## Remaining advisories
各行にpackage、severity、`npm explain`のdirect path、runtime到達性、修正版、対応commitを記録する。

## Commands
- npm audit --omit=dev
- npm explain <package>
- npm run check
```

- [ ] **Step 4: commit**

```bash
git add docs/reference/dependency-audit-2026-07-26.md
git commit -m "docs: record dependency security baseline"
```

---

### Task 2: shadcn CSS variant依存を外してCLI packageを削除する

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/globals.css`
- Modify: `components/ui/select.tsx`
- Modify: `docs/reference/dependency-audit-2026-07-26.md`

**Interfaces:**
- Consumes: Task 1の利用実態検索
- Produces: runtime treeから`shadcn`、MCP/Hono由来脆弱性を除去

- [ ] **Step 1: 削除前の検証を固定する**

```bash
npm ls shadcn --depth=0
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" src components
```

Expected: `shadcn@4.10.0`はinstall済み、CSS import 1件、variant利用は`components/ui/select.tsx`だけ。

- [ ] **Step 2: package固有variantを標準Tailwind記法へ置換する**

`components/ui/select.tsx`で次を置換する。

```text
data-open:     → data-[state=open]:
data-closed:   → data-[state=closed]:
data-disabled: → data-[disabled]:
```

`src/app/globals.css`から次を削除する。

```css
@import "shadcn/tailwind.css";
```

`accordion-down/up` keyframes、`no-scrollbar` utility、その他shadcn custom variantはsource利用0件なのでlocal copyを作らない。

- [ ] **Step 3: package削除前にCSS buildを確認する**

```bash
npm run build
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" src components
```

Expected: build exit 0、検索結果0件。

- [ ] **Step 4: packageを削除する**

```bash
npm uninstall shadcn
```

- [ ] **Step 5: dependency treeと全gateを確認する**

```bash
npm ls shadcn --depth=0
npm audit --omit=dev
npm run check
```

Expected:

- `npm ls shadcn`はempty
- `shadcn`、`@modelcontextprotocol/sdk`、`@hono/node-server`のadvisoryが消える
- `npm run check`がexit 0

- [ ] **Step 6: 監査文書へ結果を追記してcommit**

```bash
git add package.json package-lock.json src/app/globals.css components/ui/select.tsx docs/reference/dependency-audit-2026-07-26.md
git commit -m "chore: remove shadcn package runtime dependency"
```

---

### Task 3: Next.jsを16.2.12へ限定更新する

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/reference/dependency-audit-2026-07-26.md`

**Interfaces:**
- Consumes: Phase 1のproduction E2E
- Produces: patched Next.js、一致する`eslint-config-next`

- [ ] **Step 1: 更新前に対象versionを確認する**

```bash
npm view next@16.2.12 version
npm ls next eslint-config-next
```

Expected: registryは`16.2.12`、appは`next@16.2.6`。

- [ ] **Step 2: Next.jsとlint configだけを更新する**

```bash
npm install next@16.2.12
npm install --save-dev eslint-config-next@16.2.12
```

React、React DOM、TypeScript、Tailwind等をこのcommandへ追加しない。

- [ ] **Step 3: lockfile差分を確認する**

```bash
git diff -- package.json package-lock.json
npm ls next eslint-config-next
```

Expected: Next.jsとその必要transitive、および`eslint-config-next`に限定された説明可能な差分。

- [ ] **Step 4: 全gateと監査を実行する**

```bash
npm run check
npm audit --omit=dev
```

Expected:

- 全品質ゲートexit 0
- Next.js 16.2.6由来のadvisoryが解消
- `next`配下の`postcss`、`sharp`が残る場合はversionとadvisory pathを記録

- [ ] **Step 5: 監査文書へ結果を追記してcommit**

```bash
git add package.json package-lock.json docs/reference/dependency-audit-2026-07-26.md
git commit -m "fix: update next to patched 16.2.12"
```

---

### Task 4: 残存transitive advisoryを個別に処理する

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/reference/dependency-audit-2026-07-26.md`

**Interfaces:**
- Consumes: Task 3後の`npm audit --omit=dev`
- Produces: critical 0、解消可能なhigh 0、残存riskの明文化

- [ ] **Step 1: 残存package pathを列挙する**

```bash
npm audit --omit=dev --json
npm explain brace-expansion
npm explain fast-uri
npm explain hono
npm explain js-yaml
npm explain postcss
npm explain sharp
npm explain uuid
npm explain body-parser
npm explain gaxios
```

存在しないpackageの`npm explain`失敗は「Task 2/3で解消」として記録する。

- [ ] **Step 2: safe updateのdry-runを確認する**

```bash
npm audit fix --dry-run --omit=dev
```

Expected: major downgrade/upgradeや直接依存削除を要求しない変更だけを候補にする。`shadcn@3.8.3`へのdowngradeは採用しない。

- [ ] **Step 3: lockfile内の安全なtransitive更新だけを適用する**

```bash
npm update
```

このcommandで無関係な直接依存のversion rangeが変更された場合はcommitせず、`package-lock.json`差分を元に個別package指定へ切り替える。

- [ ] **Step 4: 全gateと監査を実行する**

```bash
npm run check
npm audit --omit=dev
git diff --check
```

Expected: critical 0。解消可能なhighは0。残るadvisoryは監査文書に次の形式で記録する。

```markdown
| package | advisory | dependency path | runtime reachable | mitigation | tracking |
|---|---|---|---|---|---|
| package-name | GHSA-... | direct > transitive | yes/no + 根拠 | version pinまたは機能未使用 | issue URLまたは次回確認日 |
```

- [ ] **Step 5: commit**

```bash
git add package.json package-lock.json docs/reference/dependency-audit-2026-07-26.md
git commit -m "fix: update vulnerable transitive dependencies"
```

---

### Task 5: Dependabotを追加する

**Files:**
- Create: `.github/dependabot.yml`

**Interfaces:**
- Consumes: npm lockfile、GitHub Actions workflows
- Produces: 週次のreviewable update PR

- [ ] **Step 1: 設定を追加する**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "02:30"
      timezone: Asia/Tokyo
    open-pull-requests-limit: 5
    versioning-strategy: increase-if-necessary
    groups:
      next-runtime:
        patterns:
          - next
          - react
          - react-dom
          - eslint-config-next
      testing:
        dependency-type: development
        patterns:
          - vitest
          - "@playwright/test"
          - "@testing-library/*"
          - eslint
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
```

自動merge設定は追加しない。

- [ ] **Step 2: YAMLと全gateを確認する**

```bash
git diff --check
npm run check
```

Expected: exit 0。

- [ ] **Step 3: commit**

```bash
git add .github/dependabot.yml
git commit -m "ci: add reviewed dependency update automation"
```

---

## Phase completion

```bash
npm ci
npm run check
npm audit --omit=dev
git diff --check
```

`docs/reference/dependency-audit-2026-07-26.md`へ最終件数と残存riskを記録してからreviewする。
