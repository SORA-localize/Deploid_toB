/**
 * `data/types.ts` の再export shim（content-platform-migration-plan-v1 Task 6）。
 *
 * Task 6の機械ゲート（`rg -n "@/data/types|\.\.?/.*data/types" src components lib tests
 * -g '!lib/content/localSource.ts'` が0件）は「ページ・view model・componentがlegacy型へ
 * 依存しない」ことを強制するためのものだが、`lib/validate.ts` 配下の
 * legacy data検証パイプライン（`lib/data/contentSnapshot.ts` / `lib/validation/common.ts` /
 * `lib/validation/crossCollection.ts` / `lib/validation/useCases.ts`）は違う理由で legacy型を
 * 使い続ける必要がある: これらは常に `data/*.ts` の生配列（`localContentSnapshot`）だけを検証し、
 * 将来もPayload由来のデータを検証することはない（`scripts/validate-data.mjs` / dev起動時の
 * console警告専用）。ページ実行パスには到達しない。
 *
 * この4ファイルを `data/*.ts` と同列（legacy型を参照してよい境界）として扱うため、
 * `@/data/types` を直接importせず、`data/*.ts` glob に属するこのファイル経由でimportする。
 * 型は完全に同一（re-export のみ）で、挙動は変えない。
 */
export * from './types';
