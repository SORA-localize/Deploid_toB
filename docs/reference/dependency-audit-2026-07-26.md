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
| next | 16.2.6 | next, postcss (bundled), sharp (optional) | Update to 16.2.12 (fixes the `next`-authored CVEs; does **not** by itself fix the nested `postcss`/`sharp` advisories — see note above) |
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
is left for a follow-up Task in this phase.

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

Ledger filled in as later tasks in this phase land fixes. Rows below marked
**RESOLVED (Task 2)** were cleared by removing the `shadcn` package entirely — see
"Task 2 results" below for the full before/after audit delta. All other rows are still
open as of this update.

| Package | Severity | `npm explain` direct path | Runtime reachability | Fixed version | Fix commit |
|---|---|---|---|---|---|
| next | high | root project → `next@^16.2.6` | Yes — the entire app runs on `next` | 16.2.12 (current `latest`) | TBD |
| postcss (nested) | high | root project → `next@16.2.6` → bundled `postcss@8.4.31` | Build/SSR-internal to `next`'s own tooling; not imported by app code directly, but still shipped in the production install | Not resolved by `next@16.2.12` alone (still pins 8.4.31); needs an `overrides`/`resolutions` entry or a later `next` release | TBD |
| sharp | high | root project → `next@16.2.6` → optional `sharp@^0.34.5` | Yes — `next/image` is used in 10+ components and `next.config.mjs` configures `images.formats`, so sharp actively processes images via the Image Optimization route | Not resolved by `next@16.2.12` alone (still pins `^0.34.5`); needs `sharp@>=0.35.0` via `overrides` | TBD |
| hono | high | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `hono@^4.11.4`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥4.12.27 (per advisory ranges) | `chore: remove shadcn package runtime dependency` |
| brace-expansion | high | ~~root project → `shadcn@^4.10.0` → `ts-morph` → `@ts-morph/common` → `minimatch@^10.2.2` → `brace-expansion@^5.0.5`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥5.0.8 (per advisory range `<=5.0.7`) | `chore: remove shadcn package runtime dependency` |
| fast-uri | high | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `ajv-formats`/`ajv@^8.x` → `fast-uri@^3.0.1`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥3.1.4/≥3.1.5 (per advisory ranges) | `chore: remove shadcn package runtime dependency` |
| @hono/node-server | moderate | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `@hono/node-server@^1.19.9`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥2.0.5 | `chore: remove shadcn package runtime dependency` |
| @modelcontextprotocol/sdk | moderate | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥1.30.0 (pulls in fixed `@hono/node-server`) | `chore: remove shadcn package runtime dependency` |
| gaxios | moderate | root project → `budoux@^0.8.4` → `google-artifactregistry-auth@^3.5.0` → `google-auth-library` → `gcp-metadata`/`gtoken` → `gaxios@^6.1.1`/`^6.0.0` | Indirect — `budoux` itself is runtime-reachable (`lib/typography.ts`), but the `google-artifactregistry-auth` subtree it pulls in is registry/publish tooling, not exercised by any code path this app calls | Depends on `uuid` fix upstream in `gaxios`; no direct override identified yet | TBD |
| uuid | moderate | root project → `budoux` → ... → `gaxios@6.7.1` → `uuid@^9.0.1` | Indirect, same as gaxios above | ≥11.1.1 | TBD |
| js-yaml | high | ~~root project → `shadcn@^4.10.0` → `cosmiconfig@^9.0.0` → `js-yaml@^4.1.0`~~; also root project → `budoux` → `google-artifactregistry-auth` → `js-yaml@^4.1.0` | shadcn path **RESOLVED (Task 2)**; budoux path still Indirect (same reasoning as gaxios) — package remains flagged in `npm audit` via the budoux path alone | ≥4.3.0 | shadcn path: `chore: remove shadcn package runtime dependency`; budoux path: TBD |
| body-parser | low | ~~root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `express@^5.2.1`/`express-rate-limit@^8.2.1` → `body-parser@^2.2.1`~~ | **RESOLVED (Task 2)** — removed with `shadcn` | ≥2.3.0 | `chore: remove shadcn package runtime dependency` |

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

## Commands

```bash
npm audit --omit=dev --json
npm audit --omit=dev
npm explain <package>
npm run check
npm uninstall shadcn
npm ls shadcn --depth=0
rg -n "shadcn/tailwind.css|data-(open|closed|disabled):" src components
```

Task 1 (audit-only) made no `package.json`/`package-lock.json`/source changes. Task 2
(this update) modified `package.json`, `package-lock.json`, `src/app/globals.css`, and
`components/ui/select.tsx`, and is the first task in this phase to land an actual fix
rather than documentation.
