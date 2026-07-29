---
status: reference
updated: 2026-07-29
---

# Dependency Audit — 2026-07-26

> **Note on dates:** this file is named for the 2026-07-26 baseline referenced in
> `refactor-phase-02-dependency-security-v1/task-1-brief.md`. The audit itself was
> actually re-run on **2026-07-29** (today), because the advisory database moves over
> time and the brief's numbers may already be stale. The counts below are the live
> output of `npm audit --omit=dev` observed on 2026-07-29, not the brief's expected
> numbers. They are close but **not identical** to the brief's 2026-07-26 baseline
> (critical 0, high 7, moderate 5, low 1, total 13) — see the diff note under Baseline.

## Environment
- Branch: `refactor/02-dependency-security` (branched from `main` @ `edfd3ae`)
- Node: v24.5.0
- npm: 11.4.2

## Baseline

`npm audit --omit=dev --json` → `.metadata.vulnerabilities`, captured 2026-07-29:

| Severity | Count |
|---|---:|
| critical | 0 |
| high | 7 |
| moderate | 4 |
| low | 1 |
| **total** | **12** |

**Diff from the brief's 2026-07-26 baseline:** moderate is **4**, not the brief's
expected **5** (total **12**, not **13**). critical/high/low are unchanged (0/7/1).
The moderate-severity advisory set has shifted slightly since the brief was written —
most likely one moderate advisory was resolved or reclassified upstream in the
intervening three days. All other figures match the brief exactly, so the underlying
dependency graph is unchanged; treat this table (not the brief's) as ground truth going
forward.

Full current vulnerability list (`npm audit --omit=dev --json` → `.vulnerabilities`),
one row per flagged package:

| Package | Severity | Installed range | Reached via |
|---|---|---|---|
| next | high | 9.3.4-canary.0 – 16.3.0-preview.7 (installed 16.2.6) | direct dependency |
| postcss | high | ≤8.5.17 (installed 8.4.31, nested copy) | `next` → bundled `postcss@8.4.31` |
| sharp | high | <0.35.0 (installed 0.34.5) | `next` → optional `sharp@^0.34.5` |
| hono | high | ≤4.12.26 (installed 4.12.23) | `shadcn` → `@modelcontextprotocol/sdk` → `hono` |
| brace-expansion | high | ≤5.0.7 (installed 5.0.6) | `shadcn` → `ts-morph` → `@ts-morph/common` → `minimatch` → `brace-expansion` |
| fast-uri | high | 3.0.0 – 3.1.3 (installed 3.1.2) | `shadcn` → `@modelcontextprotocol/sdk` → `ajv-formats`/`ajv` → `fast-uri` |
| @hono/node-server | moderate | <2.0.5 (installed 1.19.14) | `shadcn` → `@modelcontextprotocol/sdk` → `@hono/node-server` |
| @modelcontextprotocol/sdk | moderate | 1.25.0 – 1.29.0 (installed 1.29.0) | `shadcn` → `@modelcontextprotocol/sdk` (depends on vulnerable `@hono/node-server`) |
| gaxios | moderate | 6.4.0 – 6.7.1 (installed 6.7.1) | `budoux` → `google-artifactregistry-auth` → `google-auth-library` → `gcp-metadata`/`gtoken` → `gaxios` (depends on vulnerable `uuid`) |
| uuid | moderate | <11.1.1 (installed 9.0.1) | `budoux` → `google-artifactregistry-auth` → `google-auth-library` → `gcp-metadata`/`gtoken` → `gaxios` → `uuid` |
| js-yaml | high | 4.0.0 – 4.2.0 (installed 4.1.1) | `shadcn` → `cosmiconfig` → `js-yaml`; also `budoux` → `google-artifactregistry-auth` → `js-yaml` |
| body-parser | low | 2.0.0 – 2.2.2 (installed 2.2.2) | `shadcn` → `@modelcontextprotocol/sdk` → `express-rate-limit`/`express` → `body-parser` |

`fixAvailable` reports `true` for every row above, but this is misleading for two of
them: `next@16.2.12` (the current `latest` on npm) still pins `postcss@8.4.31` and
`sharp@^0.34.5` unchanged from `16.2.6`, so bumping `next` alone does **not** clear the
`postcss`/`sharp` advisories — a separate override/resolution (or an upstream `next`
release that bumps those two) is required. This was confirmed by cross-checking
`npm view next@16.2.12 dependencies.postcss` (→ `8.4.31`) and
`npm view next@16.2.12 optionalDependencies.sharp` (→ `^0.34.5`) against the currently
installed versions. All other rows resolve cleanly via the `shadcn`/`budoux` subtrees
once those packages (or their own dependency pins) are updated.

## Direct dependencies

| Package | Installed | Advisory path | Action |
|---|---:|---|---|
| next | 16.2.12 | postcss (bundled), sharp (optional) | **Done in Task 3** (`fix: update next to patched 16.2.12`). Updated `next@^16.2.6` → `^16.2.12`; the `next`-authored CVE is resolved. `postcss@8.4.31` (bundled) and `sharp@^0.34.5` (optional) are unchanged in `16.2.12` — those advisories remain open, as anticipated. See "Task 3 results" section below |
| shadcn | **REMOVED** (was 4.10.0) | ~~MCP/Hono/ts-morph/ajv/express subtree (hono, brace-expansion, fast-uri, @hono/node-server, @modelcontextprotocol/sdk, js-yaml (partial), body-parser)~~ — resolved | **Done in Task 2** (`chore: remove shadcn package runtime dependency`). The `src/app/globals.css:3` `@import "shadcn/tailwind.css";` line was deleted (no local re-implementation of any shadcn custom CSS — `accordion-down/up` keyframes, `no-scrollbar`, etc. all had 0 source usage). `components/ui/select.tsx` had its two shadcn-specific Tailwind variant usages ported to standard Tailwind arbitrary data-variant syntax: `data-open:` → `data-[state=open]:`, `data-closed:` → `data-[state=closed]:`, `data-disabled:` → `data-[disabled]:`. `npm uninstall shadcn` then removed the package and its entire MCP/Hono/ts-morph/ajv/express transitive subtree. See "Task 2 results" section below for the full before/after audit delta |
| budoux | 0.8.4 | budoux → google-artifactregistry-auth → google-auth-library → gcp-metadata/gtoken → gaxios (moderate), gaxios → uuid (moderate), google-artifactregistry-auth → js-yaml (moderate range only) | `budoux` **is** imported at runtime (`lib/typography.ts:1` — `import { loadDefaultJapaneseParser } from 'budoux'`) for Japanese text-wrapping. Unlike `shadcn`, this package cannot simply be deleted; its own `dependencies` list `google-artifactregistry-auth` (a publish/registry-auth helper) as a runtime dependency, which is almost certainly dead weight inside `budoux` itself. No local action available beyond watching for a `budoux` release that drops or updates that dependency, or `npm overrides` on `gaxios`/`uuid` if upgrading in place |

## Step 2 findings — usage search (verbatim confirmation of brief expectations)

```
rg -n "from ['\"]shadcn|require\\(['\"]shadcn|npx shadcn|npm exec shadcn" \
  --glob '!node_modules/**' \
  --glob '!package-lock.json' .
→ 0 matches
```

```
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" \
  src components
→ src/app/globals.css:3   @import "shadcn/tailwind.css";
→ components/ui/select.tsx:72   ...data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
                                 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95...
→ components/ui/select.tsx:115  ...data-disabled:pointer-events-none data-disabled:opacity-50...
```

This matches the brief's expectation exactly: no TypeScript/CLI usage of `shadcn`
anywhere in the app, but one CSS `@import` and two Tailwind data-variant usages in
`components/ui/select.tsx` that depend on the shadcn/Radix preset. These must be
migrated to standard Tailwind arbitrary data-variant syntax (e.g. `data-[state=open]:`)
before the `shadcn` package can be safely removed from `dependencies` — this repo does
not yet have that migration; it is out of scope for this (documentation-only) task and
is left for a follow-up Task in this phase (superseded by Task 2 — see below).

Additionally checked, since `next` and `sharp` are also listed in the brief's `npm
explain` step: `next/image` is actively used across the app (10 files, e.g.
`components/RobotCard.tsx`, `components/NewsCard.tsx`,
`src/app/reports/[slug]/page.tsx`), and `next.config.mjs` sets
`images: { formats: ['image/avif', 'image/webp'] }`. This means `sharp` is genuinely
invoked at build/runtime for image optimization — it is not a dead optional dependency,
so the `sharp` advisory (libvips CVE-2026-33327/33328/35590/35591, image-processing
DoS/memory-safety class) has real runtime reach through the Image Optimization path.
`postcss@8.4.31` (the nested, vulnerable copy under `next`) is used internally by
`next`'s own build tooling and is not directly imported by app code; the top-level
`postcss@8.5.23` (pulled in by `shadcn`, `vite`, `@tailwindcss/postcss`) is already
past the vulnerable range and unaffected.

## Remaining advisories

**Status after Task 4: all remaining advisories resolved. `npm audit --omit=dev`
reports 0 critical / 0 high / 0 moderate / 0 low (0 total).** See "Task 4 results"
below for the full investigation, the four `overrides` entries that closed the gap,
and verification evidence (including a runtime smoke test of the `sharp` native
codec path). The table below is kept as a historical ledger — rows marked
**RESOLVED (Task 2)** were cleared by removing the `shadcn` package entirely (see
"Task 2 results"); rows marked **RESOLVED (Task 4)** were cleared by the
`package.json` `overrides` added in that task (see "Task 4 results").

| Package | Severity | `npm explain` direct path | Runtime reachability | Fixed version | Fix commit |
|---|---|---|---|---|---|
| next | high | ~~root project → `next@^16.2.6`~~ | **RESOLVED (Task 3)** — the `next`-authored CVE for `9.3.4-canary.0 – 16.3.0-preview.7` is cleared by updating to `16.2.12`. `next` still appears in `npm audit` output after Task 3, but now only as a *parent* entry ("Depends on vulnerable versions of postcss/sharp") — it no longer carries its own direct advisory | 16.2.12 | `fix: update next to patched 16.2.12` |
| postcss (nested) | high | ~~root project → `next@16.2.12` → bundled `postcss@8.4.31`~~ | **RESOLVED (Task 4)** — was build/SSR-internal to `next`'s own tooling, not imported by app code directly, but still shipped in the production install | `overrides.postcss: "^8.5.24"` in `package.json`, verified with `npm run check` (full build + e2e) | `fix: update vulnerable transitive dependencies` |
| sharp | high | ~~root project → `next@16.2.12` → optional `sharp@^0.34.5`~~ | **RESOLVED (Task 4)** — genuinely runtime-reachable (`next/image` used in 10+ components, `next.config.mjs` configures `images.formats`); verified fixed version still works at runtime, not just at build time (see "Task 4 results") | `overrides.sharp: "^0.35.3"` in `package.json`, verified with `npm run check` **and** a manual runtime request against `/_next/image` (both JPEG-fallback and AVIF-encode paths) | `fix: update vulnerable transitive dependencies` |
| hono | high | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `hono@^4.11.4`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥4.12.27 (per advisory ranges) | `chore: remove shadcn package runtime dependency` |
| brace-expansion | high | ~~root project → `shadcn@^4.10.0` → `ts-morph` → `@ts-morph/common` → `minimatch@^10.2.2` → `brace-expansion@^5.0.5`~~ | **RESOLVED (Task 2)** — removed with `shadcn` (the package still exists in the tree post-Task-2/4, but only under **dev-only** paths — `eslint`'s and `vercel` CLI's own nested `minimatch`/`ts-morph` copies — confirmed by `npm explain brace-expansion` showing exclusively `dev` markers; it no longer appears in `npm audit --omit=dev` at all) | ≥5.0.8 (per advisory range `<=5.0.7`) | `chore: remove shadcn package runtime dependency` |
| fast-uri | high | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `ajv-formats`/`ajv@^8.x` → `fast-uri@^3.0.1`~~ | **RESOLVED (Task 2)** — removed with `shadcn`. Confirmed fully gone: `npm explain fast-uri` now errors with "No dependencies found matching fast-uri" (not present anywhere in the tree, dev or prod) | ≥3.1.4/≥3.1.5 (per advisory ranges) | `chore: remove shadcn package runtime dependency` |
| @hono/node-server | moderate | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `@hono/node-server@^1.19.9`~~ | **RESOLVED (Task 2)** — removed with `shadcn`. Confirmed fully gone via `npm explain @hono/node-server` ("No dependencies found") | ≥2.0.5 | `chore: remove shadcn package runtime dependency` |
| @modelcontextprotocol/sdk | moderate | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0`~~ | **RESOLVED (Task 2)** — removed with `shadcn`. Confirmed fully gone via `npm explain @modelcontextprotocol/sdk` ("No dependencies found") | ≥1.30.0 (pulls in fixed `@hono/node-server`) | `chore: remove shadcn package runtime dependency` |
| gaxios | moderate | ~~root project → `budoux@^0.8.4` → `google-artifactregistry-auth@^3.5.0` → `google-auth-library` → `gcp-metadata`/`gtoken` → `gaxios@^6.1.1`/`^6.0.0`~~ | **RESOLVED (Task 4)** — was indirect: `budoux` itself is runtime-reachable (`lib/typography.ts`), but the `google-artifactregistry-auth` subtree it pulls in is registry/publish-auth tooling with zero references from any code path this app calls (confirmed: `grep -rl "google-artifactregistry-auth" node_modules/budoux/` matches only `budoux`'s own `package.json`, never its `dist`/`module` runtime output) | Cleared as a side effect of the `uuid` override (gaxios's own advisory was "depends on vulnerable uuid") | `fix: update vulnerable transitive dependencies` |
| uuid | moderate | ~~root project → `budoux` → ... → `gaxios@6.7.1` → `uuid@^9.0.1`~~ | **RESOLVED (Task 4)** — same reasoning as gaxios; dead-weight subtree, not runtime-reachable, but fixed anyway since a compatible override was verified safe | `overrides.uuid: "^11.1.1"` in `package.json`. Verified safe: the only `uuid` usage in the entire tree is `gaxios`'s `uuid.v4()` call (`node_modules/gaxios/build/src/gaxios.js:417`), and `v4` is unchanged across uuid 9→11 | `fix: update vulnerable transitive dependencies` |
| js-yaml | high | ~~root project → `shadcn@^4.10.0` → `cosmiconfig@^9.0.0` → `js-yaml@^4.1.0`~~; ~~root project → `budoux` → `google-artifactregistry-auth` → `js-yaml@^4.1.0`~~ | shadcn path **RESOLVED (Task 2)**; budoux path **RESOLVED (Task 4)** — same dead-weight reasoning as gaxios/uuid above | `overrides.js-yaml: "^4.3.0"` in `package.json` — same major (4.x), pure patch-level fix; `eslint`'s own nested copy was already on `4.3.0`, so this override just deduped the root copy up to match it | `chore: remove shadcn package runtime dependency` (shadcn path); `fix: update vulnerable transitive dependencies` (budoux path) |
| body-parser | low | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `express@^5.2.1`/`express-rate-limit@^8.2.1` → `body-parser@^2.2.1`~~ | **RESOLVED (Task 2)** — removed with `shadcn`. Confirmed fully gone via `npm explain body-parser` ("No dependencies found") | ≥2.3.0 | `chore: remove shadcn package runtime dependency` |

## Task 2 results — shadcn package removal (2026-07-29)

Task 2 of this phase (`refactor-phase-02-dependency-security-v1/task-2-brief.md`)
removed the `shadcn` package's runtime dependency entirely, following Task 1's finding
that it has zero TypeScript/CLI usage in this repo — its only two touchpoints were a
CSS `@import` and two package-specific Tailwind variant strings.

### What changed

- `src/app/globals.css`: removed the line `@import "shadcn/tailwind.css";`. No local
  copies of any shadcn custom CSS (`accordion-down`/`accordion-up` keyframes,
  `no-scrollbar` utility, etc.) were added, since Task 1 confirmed 0 source usage of
  those constructs.
- `components/ui/select.tsx`: replaced the shadcn/Radix-preset-specific Tailwind
  variants with standard Tailwind arbitrary data-variant syntax:
  - `data-open:` → `data-[state=open]:`
  - `data-closed:` → `data-[state=closed]:`
  - `data-disabled:` → `data-[disabled]:`
- `npm uninstall shadcn` — removed `shadcn@4.10.0` and its full transitive subtree
  (MCP SDK, ts-morph, ajv/ajv-formats, express/express-rate-limit, cosmiconfig, hono,
  etc.) from `package.json` and `package-lock.json`.

### shadcn CLI caveat (added during final-review fixup)

The shadcn CLI remains usable via `npx shadcn@latest ...` to scaffold new components
(it is not an installed dependency — `npx` fetches it on demand, and `components.json`
intentionally still points at `ui.shadcn.com/schema.json` for this purpose). However,
since this task removed shadcn's custom Tailwind variant CSS, any newly-scaffolded
component using `data-open:`/`data-closed:`/`data-checked:`/`data-selected:` variants
must be manually ported to standard Tailwind arbitrary-variant syntax (e.g.
`data-[state=open]:`) before those styles will take effect — the CLI has no way to
know those variants are undefined in this project, so the scaffolded code will compile
without error but render with no visual effect until ported.

### Verification performed

- `npm run build` passed (exit 0) both before and after `npm uninstall shadcn`.
- `rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" src components` returned
  0 matches after the edits (previously 3 matches: 1 CSS import + 2 variant usages).
- `npm ls shadcn --depth=0` → `(empty)` (previously `shadcn@4.10.0`).
- `npm run check` (validate:data → typecheck → lint → unit tests → build → e2e) passed
  with exit 0. Lint surfaced only pre-existing warnings unrelated to this change (6
  `no-img-element`/`exhaustive-deps` warnings, 0 errors). One e2e run hit a flaky
  30s timeout on the `/robots` axe-accessibility test under back-to-back-run system
  load; an isolated rerun of `npm run test:e2e` and a subsequent full `npm run check`
  both passed all 20 e2e tests cleanly — not related to the CSS/variant changes.

### Audit delta (`npm audit --omit=dev --json` → `.metadata.vulnerabilities`)

| Severity | Before (Task 1 baseline, 2026-07-29) | After (Task 2, 2026-07-29) | Δ |
|---|---:|---:|---:|
| critical | 0 | 0 | 0 |
| high | 7 | 4 | −3 |
| moderate | 4 | 2 | −2 |
| low | 1 | 0 | −1 |
| **total** | **12** | **6** | **−6** |

Advisories removed (all were exclusively reached via the `shadcn` subtree):
`hono` (high), `brace-expansion` (high), `fast-uri` (high), `@hono/node-server`
(moderate), `@modelcontextprotocol/sdk` (moderate), `body-parser` (low).

Advisories remaining after Task 2 (all unrelated to `shadcn`, per the "Remaining
advisories" table above): `next` (high), `postcss` nested copy (high), `sharp` (high),
`js-yaml` (high, now reached only via the `budoux` path), `gaxios` (moderate), `uuid`
(moderate). These are tracked as open follow-up work for later tasks in this phase.

## Task 3 results — Next.js patch update (2026-07-29)

Task 3 of this phase (`refactor-phase-02-dependency-security-v1/task-3-brief.md`)
updated `next` and `eslint-config-next` to the patched `16.2.12` release, scoped
exactly per the brief (no React/React DOM/TypeScript/Tailwind changes).

### Pre-check (Step 1)

```
npm view next@16.2.12 version        → 16.2.12
npm ls next eslint-config-next       → next@16.2.6 (direct + deduped under
                                        @vercel/analytics); eslint-config-next@16.2.12
                                        (already at target — a prior task/install had
                                        already bumped the devDependency declaration to
                                        `^16.2.12` in package.json, but the installed
                                        `next` itself was still 16.2.6)
```

### What changed

- `package.json`: `"next": "^16.2.6"` → `"next": "^16.2.12"`. `eslint-config-next` was
  already declared as `^16.2.12` in `package.json`, so `npm install --save-dev
  eslint-config-next@16.2.12` made no further change there.
- `package-lock.json`: `next` bumped `16.2.6` → `16.2.12`, plus its platform-specific
  transitive binaries (`@next/env`, `@next/swc-darwin-arm64`, `@next/swc-darwin-x64`,
  `@next/swc-linux-arm64-gnu`, `@next/swc-linux-arm64-musl`, `@next/swc-linux-x64-gnu`,
  `@next/swc-linux-x64-musl`, `@next/swc-win32-arm64-msvc`, `@next/swc-win32-x64-msvc`)
  bumped in lockstep. No other package's version changed in the lockfile — verified by
  extracting every changed package name from `git diff -- package-lock.json`, which
  returned only `next`/`@next/*` entries plus the top-level `resolved`/`integrity`/
  `version` fields belonging to them.
- No `react`, `react-dom`, `typescript`, or `tailwind*` version changed (confirmed by
  inspecting the full `package.json`/`package-lock.json` diff).

### Verification performed (Step 3–4)

- `npm ls next eslint-config-next` after install → `next@16.2.12` (direct + deduped
  under `@vercel/analytics`), `eslint-config-next@16.2.12`.
- `npm view next@16.2.12 dependencies.postcss` → `8.4.31` and `npm view next@16.2.12
  optionalDependencies.sharp` → `^0.34.5` — both unchanged from `16.2.6`, confirming the
  brief's expectation that this update does **not** touch the nested `postcss`/`sharp`
  advisories.
- `npm run check` (validate:data → typecheck → lint → test → build → test:e2e) run
  **twice**, both **exit 0**. `next build` banner confirms `▲ Next.js 16.2.12
  (Turbopack)`. Lint: 0 errors, 6 pre-existing warnings (`no-img-element` /
  `exhaustive-deps`), identical to the Task 2 baseline — unrelated to this change. Unit
  tests: 21/21 passed. E2E: 20/20 passed both runs (no flake this time).

### Audit delta (`npm audit --omit=dev --json` → `.metadata.vulnerabilities`)

| Severity | Before (Task 2 end state) | After (Task 3) | Δ |
|---|---:|---:|---:|
| critical | 0 | 0 | 0 |
| high | 4 | 4 | 0 |
| moderate | 2 | 3 | +1 |
| low | 0 | 0 | 0 |
| **total** | **6** | **7** | **+1** |

This total going *up* by one looks surprising at first glance, so here is the
package-level breakdown (`npm audit --omit=dev --json` → `.vulnerabilities`, each row's
`via` chain):

| Package | Severity | Via | Status |
|---|---|---|---|
| next | high | `postcss`, `sharp` (as parent/depender only) | **Own CVE resolved.** Pre-Task-3, `next` was flagged as a `direct dependency` with its own advisory (`9.3.4-canary.0 – 16.3.0-preview.7`, installed `16.2.6`). Post-Task-3, `next` only appears because it *depends on* the still-vulnerable `postcss`/`sharp` — it no longer carries a direct advisory of its own |
| postcss (nested) | high | `postcss` (self) | Unchanged — still `8.4.31` under `next`, as expected (see "Remaining advisories" above) |
| sharp | high | `sharp` (self) | Unchanged — still `^0.34.5` under `next`, as expected |
| js-yaml | high | `js-yaml` (self, via `budoux`) | Unchanged, unrelated to this task |
| gaxios | moderate | `uuid` | Unchanged, unrelated to this task |
| uuid | moderate | `uuid` (self) | Unchanged, unrelated to this task |
| **@vercel/analytics** | **moderate** | `next` | **New.** `@vercel/analytics` depends on `next` and is deduped onto the same (still-vulnerable-via-postcss/sharp) `next` install, so `npm audit`'s tree walk now also surfaces `@vercel/analytics` as an indirect path to the *same* underlying `postcss`/`sharp` issues. This is not a new vulnerability class — it is the existing `postcss`/`sharp` advisories becoming reachable via one additional dependency edge after the version bump changed `npm audit`'s resolved tree. No action available until `postcss`/`sharp` are fixed (Task 4 scope) |

Net effect: the `next`-specific advisory that motivated this task is confirmed gone
(4 high before and after, but the composition changed — `next`'s own CVE dropped out,
`postcss`/`sharp`/`js-yaml` remain the 4 high entries). The `+1` moderate is the
`@vercel/analytics` entry above, an artifact of the same open `postcss`/`sharp` issues
becoming visible via a second path — not a regression introduced by this task and not
something in scope to fix here. `postcss` and `sharp` remain open, exactly as the
brief anticipated, and are left for Task 4 (likely via an `overrides` entry).

## Task 4 results — remaining transitive advisories closed via `overrides` (2026-07-29)

Task 4 of this phase (`refactor-phase-02-dependency-security-v1/task-4-brief.md`)
addressed the four advisories left open after Task 3 (`next`/`postcss`/`sharp`/
`js-yaml`) plus the two moderate advisories in the `budoux` chain
(`gaxios`/`uuid`). **Result: `npm audit --omit=dev` now reports 0 critical / 0 high /
0 moderate / 0 low (0 total)** — a full resolution, not a partial one.

### Step 1 — current advisory enumeration

`npm audit --omit=dev --json` on branch head (post-Task-3, pre-Task-4) showed 7
advisories (0 critical, 4 high, 3 moderate, 0 low): `next` (high, parent-only —
depends on `postcss`/`sharp`), `postcss` (high), `sharp` (high), `js-yaml` (high, via
`budoux`), `@vercel/analytics` (moderate, parent-only — depends on `next`), `gaxios`
(moderate, via `uuid`), `uuid` (moderate). This matches the "Remaining advisories"
table exactly, confirming no drift since Task 3 landed.

The brief's Step 1 command list (`npm explain brace-expansion fast-uri hono js-yaml
postcss sharp uuid body-parser gaxios`) was adapted per the task instructions, since
several of those packages were already fully resolved by Task 2's `shadcn` removal:

- `npm explain fast-uri`, `npm explain hono`, `npm explain body-parser`, `npm explain
  @modelcontextprotocol/sdk`, `npm explain @hono/node-server` → all four error with
  `"No dependencies found matching <package>"` — **fully gone from the tree**, dev or
  prod (not merely absent from the production audit).
- `npm explain brace-expansion` → still present, but **exclusively under dev-only
  paths** (`eslint`'s own nested `minimatch`, and the `vercel` CLI's bundled
  `ts-morph`/`@ts-morph/common` copies across a dozen `@vercel/*` sub-packages) — it
  does not appear in `npm audit --omit=dev` at all, confirming it carries zero
  production risk post-shadcn-removal.
- `npm explain postcss`, `npm explain sharp`, `npm explain js-yaml`, `npm explain
  gaxios`, `npm explain uuid`, `npm explain @vercel/analytics`, `npm explain next` →
  ran against the actual current advisory set (see dependency paths in the "Remaining
  advisories" table above). Confirms Task 1's finding: the `gaxios`/`uuid` chain is
  `budoux@0.8.4` → `google-artifactregistry-auth@3.5.0` → `google-auth-library@9.15.1`
  → `gcp-metadata@6.1.1`/`gtoken@7.1.0` → `gaxios@6.7.1` → `uuid@9.0.1`, **not** via
  `shadcn` (already removed). Same chain carries `js-yaml@4.1.1` as a sibling dependency
  of `google-artifactregistry-auth`.
- Confirmed `google-artifactregistry-auth` is dead weight inside `budoux`: `npm view
  budoux dependencies` → `{commander, google-artifactregistry-auth, linkedom}`, but
  `grep -rl "google-artifactregistry-auth" node_modules/budoux/` matches only
  `budoux`'s own `package.json` — never its `dist/index.js` or `module/index.js`
  runtime entry points (`budoux`'s own `package.json` reveals
  `google-artifactregistry-auth` is used only in its `prepare`/publish script, i.e. a
  devDependency mistakenly declared as a runtime dependency upstream). This subtree
  is installed but never executed by any code path this app calls.

### Step 2 — `npm audit fix --dry-run --omit=dev`

```
js-yaml   fix available via `npm audit fix`            (safe — no top-level major bump)
uuid      fix available via `npm audit fix`            (safe — no top-level major bump)
postcss   fix available via `npm audit fix --force`    — "Will install next@9.3.3, which is a breaking change"
sharp     fix available via `npm audit fix --force`    — "Will install next@9.3.3, which is a breaking change"
```

Per npm's own algorithm, `js-yaml` and `uuid` are fixable without forcing a
top-level major-version change (both are purely transitive, so npm can bump them past
their parent's declared semver range without touching any direct dependency).
`postcss`/`sharp` are only offered a fix via `--force`, and that fix is a **downgrade
of `next` to `9.3.3`** — an unacceptable multi-major regression, correctly rejected
per the task's hard constraint. **`npm audit fix` and `npm audit fix --force` were
never run for real** — only `--dry-run` was used to inspect candidates, per explicit
instruction from the task dispatcher (stricter than the brief, which only prohibited
the `--force` variant).

### Step 3 — `npm update` (reverted)

`npm update` was attempted as the brief's Step 3 "safe, semver-respecting" option.
**Result: catastrophic regression** — `npm audit` (all deps, not `--omit=dev`) went
from 48 to a claimed "46 vulnerabilities (1 low, 11 moderate, 33 high, **1
critical**)" immediately after the update, with 251 packages added, 183 removed, 161
changed, and a ~5,600-line lockfile rewrite. This was **immediately reverted** via
`git checkout -- package-lock.json` followed by `npm ci` to resync `node_modules`,
restoring the `--omit=dev` audit to the expected 7-advisory, 0-critical baseline. Per
the brief's explicit guidance ("if this command shifts unrelated direct dependency
ranges you don't want, don't commit that — revert and instead target the specific
safe transitive bump"), `npm update`'s output was discarded entirely and not
committed. The devDependency tree (dominated by `vercel@54.10.3`'s huge transitive
graph) is evidently far more volatile than the `--omit=dev` production tree this task
is scoped to; `npm update`'s blanket semver-range-respecting bump across *all*
dependencies (including dev) is not a safe instrument here.

### Step 3 (revised) — targeted `overrides` for the four remaining packages

Since `npm update` was unusable and `npm audit fix --force` was prohibited, each of
the four remaining advisories was resolved with a manually verified, narrowly-scoped
`package.json` `overrides` entry — each checked for API/behavioral compatibility
*before* being added, then verified with a full `npm run check` after:

| Package | Override | Why safe |
|---|---|---|
| `uuid` | `^11.1.1` | Only one instance in the entire tree (`gaxios@6.7.1`'s `uuid@^9.0.1`, not runtime-reachable per Step 1). `npm explain uuid` confirmed a single consumer. Inspected `node_modules/gaxios/build/src/gaxios.js:417` — the only call is `uuid_1.v4()`, and `v4` is unchanged across uuid 9→11 |
| `js-yaml` | `^4.3.0` | Same major version (4.x) as the vulnerable `4.1.1` — the advisory fix landed as a patch release, not a breaking one. `eslint`'s own nested copy was already independently on `4.3.0`, so this override merely deduped the root/`budoux`-path copy up to match it (verified via `npm ls js-yaml` pre/post) |
| `postcss` | `^8.5.24` | Same major (8.x) as `next`'s pinned `8.4.31`. Verified via full `npm run check` (build + 20/20 e2e, including layout/CSS-dependent `mobile-overflow` and `accessibility-smoke` tests) that CSS processing was unaffected |
| `sharp` | `^0.35.3` | Highest-risk override (native addon, genuinely runtime-reachable via `next/image`). Verified with `npm run check` **and** a manual runtime smoke test: started `npm run start`, requested `/_next/image?url=...unitree-g1-hero.jpg&w=750&q=75` twice — once with a default `Accept` header (got back a valid resized JPEG, `Content-Type: image/jpeg`, 10,731 bytes) and once with `Accept: image/avif` (got back a valid `ISO Media, AVIF Image` file, `Content-Type: image/avif`, 5,647 bytes) — confirming `sharp@0.35.3`'s native AVIF encoder loads and runs correctly under `next@16.2.12`'s Image Optimization route, not just that the build compiles |

`npm install` after adding all four overrides produced a **tightly scoped**
`package-lock.json` diff (verified by diffing the full `packages` maps before/after):
only `sharp` + its platform binaries (`@img/sharp-*`, all bumped `0.34.5`/`1.2.4` →
`0.35.3`/`1.3.2` in lockstep, as expected for a single logical package), `postcss`
(`8.5.23` → `8.5.24`, consolidating `next`'s previously-separate nested `8.4.31` copy
into the shared root copy), `js-yaml` (`4.1.1` → `4.3.0`), `uuid` (`9.0.1` →
`11.1.1`), and `semver` (`7.8.1` → `7.8.5`, a transitive dependency of `sharp@0.35.3`
itself, deduped against `eslint-import-resolver-typescript`'s existing `semver`
requirement — a benign patch bump with no advisory implications). **No** `next`,
`react`, `react-dom`, `typescript`, `tailwind*`, or other direct dependency changed
version.

### Step 4 — gates and final audit

```
npm run check           → exit 0 (validate:data → typecheck → lint → test → build → test:e2e)
                           Lint: 0 errors, 6 pre-existing warnings (no-img-element /
                           exhaustive-deps), identical to the Task 2/3 baseline.
                           Unit tests: 21/21. E2E: 20/20 (including axe-core
                           accessibility and mobile-overflow layout checks, which
                           exercise the postcss-processed CSS output).
npm audit --omit=dev    → "found 0 vulnerabilities"
git diff --check        → exit 0 (no whitespace/EOL issues)
```

### Audit delta (`npm audit --omit=dev --json` → `.metadata.vulnerabilities`)

| Severity | Before (Task 3 end state) | After (Task 4) | Δ |
|---|---:|---:|---:|
| critical | 0 | 0 | 0 |
| high | 4 | 0 | −4 |
| moderate | 3 | 0 | −3 |
| low | 0 | 0 | 0 |
| **total** | **7** | **0** | **−7** |

All 7 remaining advisories from the Task 3 end state are cleared: `next` (its
parent-only flag disappears once `postcss`/`sharp` are fixed), `postcss`, `sharp`,
`js-yaml`, `@vercel/analytics` (same — parent-only flag via `next`), `gaxios`, `uuid`.
**Global constraint met and exceeded: critical is 0 (as required), and there is no
remaining `high` severity to document a rationale for — every advisory in this phase
is now fixed rather than accepted-as-risk.**

## Commands

```bash
npm view next@16.2.12 version
npm view next@16.2.12 dependencies.postcss optionalDependencies.sharp
npm audit --omit=dev --json
npm audit --omit=dev
npm audit fix --dry-run --omit=dev
npm explain <package>
npm run check
npm install next@16.2.12
npm install --save-dev eslint-config-next@16.2.12
npm uninstall shadcn
npm ls shadcn --depth=0
npm ls next eslint-config-next
npm update                      # Task 4: attempted, caused a regression, reverted
git checkout -- package-lock.json
npm ci
npm view budoux dependencies
npm view google-auth-library versions --json
npm view google-auth-library@9.15.1 dependencies.gaxios
grep -rl "google-artifactregistry-auth" node_modules/budoux/
npm ls uuid
npm ls js-yaml
npm install                     # Task 4: after adding `overrides` to package.json
npm run start -- --hostname 127.0.0.1   # Task 4: manual sharp runtime smoke test
curl "http://localhost:3000/_next/image?url=%2Fimages%2Frobots%2Funitree-g1-hero.jpg&w=750&q=75"
curl -H "Accept: image/avif,image/webp,*/*" "http://localhost:3000/_next/image?url=%2Fimages%2Frobots%2Funitree-g1-hero.jpg&w=750&q=75"
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" src components
```

Task 1 (audit-only) made no `package.json`/`package-lock.json`/source changes. Task 2
modified `package.json`, `package-lock.json`, `src/app/globals.css`, and
`components/ui/select.tsx` (the first task in this phase to land an actual fix rather
than documentation). Task 3 modified `package.json` and `package-lock.json` (updating
`next` to `16.2.12`; `eslint-config-next` was already at `16.2.12` in `package.json`)
plus this audit document. Task 4 (this update) added an `overrides` block to
`package.json` (`uuid`, `js-yaml`, `postcss`, `sharp`) and the corresponding
`package-lock.json` changes, closing out every remaining advisory in this phase; no
`npm update` output was committed (attempted, reverted per Step 3 above).

## Override removal criteria (added during final-review fixup)

The four `overrides` entries added in Task 4 were re-scoped to their actual parent
dependency (instead of being bare top-level entries) per final-review feedback, so
that they no longer silently blind future Dependabot update PRs by forcing every
future compatible bump back down. See `package.json`'s `overrides` block: `sharp` and
`postcss` are now nested under `"next"`, `uuid` is nested under `"gaxios"`, and
`js-yaml` is nested under `"google-artifactregistry-auth"`. Each override should be
removed once it is no longer needed:

- **`sharp` / `postcss` (nested under `next`):** remove once a future `next` release
  declares a `sharp`/`postcss` dependency range that already includes these patched
  versions (`^0.35.3` / `^8.5.24` or later) — check `npm view next@<version>
  optionalDependencies.sharp` and `npm view next@<version> dependencies.postcss`.
- **`uuid` (nested under `gaxios`):** remove once `gaxios` bumps its own declared
  `uuid` dependency range to include an unaffected version (`^11.1.1` or later) —
  check `npm view gaxios@<version> dependencies.uuid`.
- **`js-yaml` (nested under `google-artifactregistry-auth`):** remove once
  `google-artifactregistry-auth` bumps its own declared `js-yaml` dependency range to
  include an unaffected version (`^4.3.0` or later) — check `npm view
  google-artifactregistry-auth@<version> dependencies.js-yaml`.

Revisit at the next dependency audit.
