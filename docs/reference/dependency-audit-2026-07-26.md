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
| shadcn | 4.10.0 | MCP/Hono/ts-morph/ajv/express subtree (hono, brace-expansion, fast-uri, @hono/node-server, @modelcontextprotocol/sdk, js-yaml (partial), body-parser) | No runtime import found anywhere in the app (`rg` for `from ['"]shadcn`, `require(['"]shadcn`, `npx shadcn`, `npm exec shadcn` → 0 hits outside `node_modules`/lockfile). It is used only as a dev-time CLI (`npx shadcn add ...`) that copies component source into `components/ui/*`. `src/app/globals.css:3` imports `shadcn/tailwind.css`, and `components/ui/select.tsx` uses shadcn/Radix-flavored `data-open:`, `data-closed:`, and `data-disabled:` Tailwind variants. Replace both with standard Tailwind arbitrary data-variant syntax (e.g. `data-[state=open]:`) before removing the `shadcn` package from `dependencies` |
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

Ledger to be filled in as later tasks in this phase land fixes. One row per advisory
still open after this documentation task (none have been fixed yet — this task is
audit-only, no `package.json`/`package-lock.json` changes were made).

| Package | Severity | `npm explain` direct path | Runtime reachability | Fixed version | Fix commit |
|---|---|---|---|---|---|
| next | high | root project → `next@^16.2.6` | Yes — the entire app runs on `next` | 16.2.12 (current `latest`) | TBD |
| postcss (nested) | high | root project → `next@16.2.6` → bundled `postcss@8.4.31` | Build/SSR-internal to `next`'s own tooling; not imported by app code directly, but still shipped in the production install | Not resolved by `next@16.2.12` alone (still pins 8.4.31); needs an `overrides`/`resolutions` entry or a later `next` release | TBD |
| sharp | high | root project → `next@16.2.6` → optional `sharp@^0.34.5` | Yes — `next/image` is used in 10+ components and `next.config.mjs` configures `images.formats`, so sharp actively processes images via the Image Optimization route | Not resolved by `next@16.2.12` alone (still pins `^0.34.5`); needs `sharp@>=0.35.0` via `overrides` | TBD |
| hono | high | root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `hono@^4.11.4` (also via peer from `@hono/node-server`) | No — `shadcn` has no runtime import in this app; this is a dev-CLI-only transitive dependency | ≥4.12.27 (per advisory ranges) | TBD |
| brace-expansion | high | root project → `shadcn@^4.10.0` → `ts-morph` → `@ts-morph/common` → `minimatch@^10.2.2` → `brace-expansion@^5.0.5` | No — same shadcn CLI-only subtree | ≥5.0.8 (per advisory range `<=5.0.7`) | TBD |
| fast-uri | high | root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `ajv-formats`/`ajv@^8.x` → `fast-uri@^3.0.1` | No — same shadcn CLI-only subtree | ≥3.1.4/≥3.1.5 (per advisory ranges) | TBD |
| @hono/node-server | moderate | root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` → `@hono/node-server@^1.19.9` | No — same shadcn CLI-only subtree | ≥2.0.5 | TBD |
| @modelcontextprotocol/sdk | moderate | root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk@^1.26.0` | No — same shadcn CLI-only subtree | ≥1.30.0 (pulls in fixed `@hono/node-server`) | TBD |
| gaxios | moderate | root project → `budoux@^0.8.4` → `google-artifactregistry-auth@^3.5.0` → `google-auth-library` → `gcp-metadata`/`gtoken` → `gaxios@^6.1.1`/`^6.0.0` | Indirect — `budoux` itself is runtime-reachable (`lib/typography.ts`), but the `google-artifactregistry-auth` subtree it pulls in is registry/publish tooling, not exercised by any code path this app calls | Depends on `uuid` fix upstream in `gaxios`; no direct override identified yet | TBD |
| uuid | moderate | root project → `budoux` → ... → `gaxios@6.7.1` → `uuid@^9.0.1` | Indirect, same as gaxios above | ≥11.1.1 | TBD |
| js-yaml | high | root project → `shadcn@^4.10.0` → `cosmiconfig@^9.0.0` → `js-yaml@^4.1.0`; also root project → `budoux` → `google-artifactregistry-auth` → `js-yaml@^4.1.0` | No (shadcn path) / Indirect (budoux path, same reasoning as gaxios) | ≥4.3.0 | TBD |
| body-parser | low | root project → `shadcn@^4.10.0` → `@modelcontextprotocol/sdk` → `express@^5.2.1`/`express-rate-limit@^8.2.1` → `body-parser@^2.2.1` | No — same shadcn CLI-only subtree | ≥2.3.0 | TBD |

## Commands

```bash
npm audit --omit=dev --json
npm audit --omit=dev
npm explain <package>
npm run check
```

No fixes were applied as part of this task (`npm audit fix` / `npm audit fix --force`
were **not** run against the working tree; a `--dry-run` was used only to inspect what
each would change, and its output informed the "Fixed version" column above). No
`package.json`, `package-lock.json`, or source files were modified.
