/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「失敗・timeout時のcleanup」。
 *
 * CLI異常終了時に呼ぶ明示cleanup。Step 2でアップロード済みのobjectを全部削除する。
 * completed済みsessionは対象外（completion markerを書き終えた正当なbaselineを誤って壊さない）。
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { cleanupAuditUploadSession } from '@/lib/payload/auditUploadSession';
import { auditUploadPreflight, jsonResponse } from '@/lib/payload/auditUploadRouteHelpers';

// Blob storeクライアントを使うため、edge runtimeでは動かない。Next.jsの既定はApp Router route
// handlerでnodejsだが、将来の設定変更で意図せずedgeへ倒れないよう明示する。
export const runtime = 'nodejs';

const FAILURE_STATUS: Record<string, number> = {
  'session-not-found': 404,
  'request-id-mismatch': 403,
  'session-already-completed': 409,
  'store-error': 502,
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await params;
  const payload = await getPayload({ config: payloadConfig });

  const preflight = await auditUploadPreflight(request, payload);
  if (!preflight.ok) return preflight.response;

  const result = await cleanupAuditUploadSession({
    payload,
    sessionId,
    requestId: preflight.context.requestId,
    oidcToken: preflight.context.oidcToken,
  });

  if (!result.ok) {
    return jsonResponse(FAILURE_STATUS[result.reason] ?? 500, { error: result.reason, detail: result.detail });
  }

  return jsonResponse(200, { ok: true, removedObjectCount: result.removedObjectCount });
}
