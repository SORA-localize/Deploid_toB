---
status: plan
updated: 2026-08-15
---

# Content Platform Cutover Safety Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` and `superpowers:test-driven-development` to implement this plan task-by-task.

**Goal:** Close the remaining Task 3–5 authorization, replay, storage, verification-order, count-reporting, and operator-configuration gaps before production cutover.

**Architecture:** Keep the existing restore/export pipeline and add narrow fail-closed gates at its trust boundaries. Persist and compare both baseline generation and run ID, authenticate the manifest before any manifest-directed I/O, restrict local-disk artifacts to local throwaway environments, and enforce the only allowed production callers of publish authorization helpers through a repository boundary check.

**Tech Stack:** TypeScript, Payload CMS Local API, Vitest, PostgreSQL 15, cosign/AWS KMS, Vercel Blob, Node.js validation scripts.

## Global Constraints

- Work only on `feature/content-platform-migration`; do not merge or push.
- Preserve the current Task 3/4 RBAC, draft, approval, import, and restore behavior except for the explicit fail-closed changes below.
- Write and run each regression test before editing its production implementation.
- Managed Production/Preview baselines must use the private Vercel Blob audit store.
- Do not claim real KMS or real Blob E2E verification without credentials.

---

### Task 1: Bind same-generation retries to the same baseline run

**Files:**
- Modify: `scripts/restore-preflight.mts`
- Modify: `tests/content/restore-enforcement.test.ts`

**Interfaces:**
- `RestoreTargetIdentity.lastRestoredBaselineRunId: string | null`
- `EnvironmentMarkerRow.lastRestoredBaselineRunId: string | null`
- `checkProvenanceAgainstTarget()` permits equal generation only when the stored and incoming run IDs match.

- [x] Add tests that a matching generation/run is accepted, a matching generation/different run is rejected, and a legacy marker with generation but no run ID fails closed.
- [x] Run `npx vitest run tests/content/restore-enforcement.test.ts` and confirm the new assertions fail because run IDs are not read or compared.
- [x] Read `lastRestoredBaselineRunId` from the environment marker and compare it in `checkProvenanceAgainstTarget()`.
- [x] Re-run the targeted test and confirm it passes.

### Task 2: Authenticate manifests before I/O and reject managed local-disk baselines

**Files:**
- Modify: `scripts/export-content-snapshot.mts`
- Modify: `scripts/restore-preflight.mts`
- Modify: `tests/content/restore-enforcement.test.ts`
- Modify: `tests/content/import-parity.test.ts`

**Interfaces:**
- Add a pure store-policy check that accepts `local-disk` only for `local-throwaway`.
- `runRestore()` verifies the manifest signature before `storeFromManifest()` or any `store.get()` call.
- `runExport()` refuses `--store local-disk` for Production/Preview provenance.

- [x] Add tests for Production/Preview local-disk refusal and local throwaway acceptance.
- [x] Add an execution-order test whose store accessor must not run when the manifest signature is invalid.
- [x] Run the targeted tests and confirm they fail on the current permissive/order behavior.
- [x] Add the shared policy check and move the first manifest verification ahead of store construction/read.
- [x] Re-run the targeted tests and confirm they pass.

### Task 3: Enforce publish authorization module boundaries

**Files:**
- Create: `scripts/check-publish-authorization-boundaries.mjs`
- Modify: `package.json`
- Modify: `tests/content/publish-gates.test.ts`
- Modify: `lib/payload/publishAuthorization.ts`

**Interfaces:**
- Production imports of the approved issuer are allowed only from `lib/payload/publishApprovedVersion.ts`.
- Production imports of the privileged issuer are allowed only from `scripts/import-content-to-payload.mts`.
- Authorization objects are tracked by identity so copying context payload data is not accepted by the gate.

- [x] Add gate tests proving a structurally copied authorization is rejected while a genuinely issued authorization is accepted.
- [x] Add a boundary-check fixture/test or invoke the checker against controlled violating input; confirm it fails before implementation.
- [x] Introduce identity-backed authorization issuance/read behavior and the static production-import boundary checker.
- [x] Wire the checker into `npm run check` and re-run the targeted tests/check.

### Task 4: Report raw Payload count mismatches independently

**Files:**
- Modify: `scripts/compare-content-sources.mts`
- Modify: `tests/content/import-dry-run.test.ts`

**Interfaces:**
- `payloadCount` compares Payload raw length with artifact raw length.
- `payloadUniqueStableIdCount` remains a separate duplicate check.

- [x] Add the boundary test `artifact raw=4, artifact unique=3, Payload raw=3` and require both `uniqueStableIdCount` and `payloadCount`.
- [x] Run the targeted test and confirm `payloadCount` is missing.
- [x] Change the raw count comparison and diagnostic.
- [x] Re-run the targeted test and confirm it passes.

### Task 5: Make completion marker the final successful export write

**Files:**
- Modify: `scripts/export-content-snapshot.mts`
- Modify: `tests/content/media-baseline-recovery.test.ts`

**Interfaces:**
- `exportSignedBaseline()` signs and validates the manifest before writing the completion marker.
- Any failure before marker creation removes all objects written by that run.
- Tests may inject deterministic signing functions at the cryptographic boundary; production defaults remain real cosign/KMS.

- [x] Add a test that injects a manifest-signing failure and asserts no completion marker or partial objects remain.
- [x] Run it and confirm the current code leaves a completion marker/objects.
- [x] Move signing before the final marker write and extend cleanup across the complete export transaction.
- [x] Re-run the targeted test and confirm it passes.

### Task 6: Align operator configuration and finish verification

**Files:**
- Modify: `.env.example`
- Modify: `docs/reference/database-migration-runbook-v1.md`
- Move on completion: this plan to `docs/archive/content-platform-cutover-safety-remediation-v1.md`
- Modify: `docs/README.md`

**Interfaces:**
- Document `BLOB_STORE_ID`, `SNAPSHOT_SIGNING_KMS_KEY_ARN`, and `SNAPSHOT_SIGNING_PUBLIC_KEY_PATH` using the exact runtime names.

- [x] Update environment documentation and the cutover runbook without changing secrets or resource IDs.
- [x] Run `npm run typecheck`, `npm run lint`, targeted CLI dry-run, full PostgreSQL-backed `npm test`, `npm run build`, boundary/doc/dead-code checks, and `git diff --check`.
- [x] Re-scan all reported call sites and requirements.
- [x] Move this completed plan to `docs/archive/`, remove its active row from `docs/README.md`, and commit the verified changes.

## Verification Evidence

- PostgreSQL-backed full suite: 44 test files passed, 1 skipped; 409 tests passed, 33 credential-dependent tests skipped.
- Production build: Next.js 16.2.12 compiled successfully and generated 158 static pages.
- Static checks: typecheck, publish-authorization boundaries, data boundaries, client imports, docs links, plan snippets, dead code, and `git diff --check` passed.
- CLI dry run: all local-source collections and 61 media candidates were enumerated without database writes.
- Lint: 0 errors and the repository's existing 4 `@next/next/no-img-element` warnings.
- Real AWS KMS signing and real Vercel Private Blob E2E remain credential-dependent and were not claimed as locally verified.

## Out of Scope

- Real AWS KMS signing when credentials are unavailable.
- Real Vercel Private Blob E2E outside an authorized Vercel runtime.
- Unrelated UI, data, dependency, or content changes.
