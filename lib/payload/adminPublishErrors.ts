import type { PublishValidationError } from './access';
import type { AdminPublishErrorCode } from './adminPublishMessages';

/**
 * Admin公開の失敗を、HTTP statusと**安定したerror code**へ写像する
 * （`docs/plans/admin-publish-ui-plan-v1.md` Task 4 Step 6）。
 *
 * routeから切り出してあるのは、テストが同じ実装を参照するため。写像規則をテスト側へ
 * 書き写すと、routeを変えてもテストが緑のままになり「検証したつもり」になる。
 *
 * **表示文言はここに持たない。** clientがPayloadのi18nで翻訳する（計画 Global Constraints）。
 * APIが日本語を返すと英語ロケールのadminで日本語が混ざる。
 */
export interface AdminPublishErrorBody {
  ok: false;
  /**
   * `AdminPublishErrorCode` に縛る。翻訳表は `Record<AdminPublishMessageKey, string>` なので、
   * ここへ新しいcodeを足すと**翻訳を書くまで `npm run typecheck` が通らない**。
   * 未訳のcodeは編集者にキー文字列がそのまま出るため、型で塞いでいる。
   */
  error: AdminPublishErrorCode;
  fields?: string[];
  detail?: string;
}

/**
 * throwされた値をHTTP statusと安定したerror codeへ写像する。
 *
 * **`ValidationError` を落とさないこと。** draft保存はPayloadのfield検証を飛ばすので、
 * 「必須項目が足りない下書きを公開しようとした」が最も多い失敗になる。ここを500にすると
 * 「Something went wrong.」へ逆戻りし、この計画の主目的を最頻ケースで達成できない。
 */
function isPublishValidationError(error: unknown): error is PublishValidationError {
  const candidate = error as { name?: unknown; fields?: unknown } | null | undefined;
  return (
    candidate?.name === 'PublishValidationError' &&
    Array.isArray(candidate.fields) &&
    candidate.fields.every((field) => typeof field === 'string')
  );
}

export function mapPublishError(error: unknown): [number, AdminPublishErrorBody] {
  // 公開要件の不足（このrepo独自）。`fields` を構造として持つのでmessageをparseしない。
  //
  // **`instanceof` は使えない。** Next.jsは `access.ts` をサーバー側の複数chunkへ重複して
  // 束ねるため、hookがthrowした `PublishValidationError` のconstructorと、ここが参照する
  // constructorが別objectになる。2026-09-03、`tests/e2e/payload-admin-publish.spec.ts` が
  // 実ビルドのサーバーでこれを検出した —— 422で不足field名を返すはずの最頻ケースが
  // 500の汎用エラーへ落ち、**この写像を作った目的そのものが最も多い場面で失われていた**。
  // 同じ根本原因のもう1件は `lib/payload/publishAuthorization.ts` のWeakSet（そちらのコメント参照）。
  //
  // `name` と `fields` の形で判定する。`PublishValidationError` はconstructorで
  // `this.name` を固定しており、chunkが分かれても値は変わらない。
  if (isPublishValidationError(error)) {
    return [422, { ok: false, error: 'publish-validation-failed', fields: error.fields }];
  }

  // Payload自身のfield検証。`data.errors[].path` が不足fieldを指す。
  const named = error as { name?: string; data?: { errors?: Array<{ path?: string; field?: string }> } };
  if (named?.name === 'ValidationError') {
    const fields = (named.data?.errors ?? [])
      .map((e) => e.path ?? e.field)
      .filter((f): f is string => typeof f === 'string');
    return [422, { ok: false, error: 'validation-failed', fields }];
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('publish-candidate-replaced')) return [409, { ok: false, error: 'publish-candidate-replaced' }];
  if (message.includes('publish-stale-approval')) return [409, { ok: false, error: 'publish-stale-approval' }];
  if (message.includes('publish-hash-mismatch')) return [409, { ok: false, error: 'publish-hash-mismatch' }];
  if (message.includes('publish-role-required')) return [403, { ok: false, error: 'publish-role-required' }];
  if (message.includes('archive-role-required')) return [403, { ok: false, error: 'archive-role-required' }];
  if (message.includes('publish-not-found')) return [404, { ok: false, error: 'publish-not-found' }];
  if (message.includes('publish-lock-unavailable') || message.includes('publish-transaction-unavailable')) {
    return [503, { ok: false, error: 'publish-temporarily-unavailable' }];
  }

  // `publish-approval-required` がここへ来たら**配線バグ**。正しくserviceを経由していれば
  // 承認contextが付くので到達しない。詳細はログだけに出す。
  console.error('[admin-publish] unexpected failure', error);
  return [500, { ok: false, error: 'publish-internal-error' }];
}
