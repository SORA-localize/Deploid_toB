/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「Step 3」。
 *
 * session内部の記録を鵜呑みにせず、Blobへ実際に問い合わせて全objectの実在・sha256・sizeを
 * 再確認し、signature bundleがsnapshotに対して実際に有効な署名であることも確認してから
 * completion markerを最後の1回だけ書く。
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { completeAuditUploadSession } from '@/lib/payload/auditUploadSession';
import { auditUploadPreflight, jsonResponse } from '@/lib/payload/auditUploadRouteHelpers';

// cosign（`ensureCosignOnPath` / `execFileSync`）とBuffer/fsを使うためedge runtimeでは動かないが、
// `next.config.ts`の`cacheComponents: true`とroute segment configの明示的な`runtime`指定は
// 非互換（`next build`が"Route segment config "runtime" is not compatible with
// nextConfig.cacheComponents"でエラーになることを確認済み）。Next.jsの既定（App Router route
// handlerはnodejs）に委ねる。

const FAILURE_STATUS: Record<string, number> = {
  'session-not-found': 404,
  'session-not-usable': 409,
  'objects-missing': 409,
  'reverify-failed': 422,
  'store-error': 502,
};

interface CompleteRequestBody {
  baselineRunId?: unknown;
}

const MAX_COMPLETE_BODY_BYTES = 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await params;
  const payload = await getPayload({ config: payloadConfig });

  const preflight = await auditUploadPreflight(request, payload);
  if (!preflight.ok) return preflight.response;

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_COMPLETE_BODY_BYTES) {
      return jsonResponse(413, { error: 'body-too-large', detail: `Content-Length exceeds ${MAX_COMPLETE_BODY_BYTES} bytes` });
    }
  }

  let body: CompleteRequestBody;
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_COMPLETE_BODY_BYTES) {
      return jsonResponse(413, { error: 'body-too-large', detail: `body exceeds ${MAX_COMPLETE_BODY_BYTES} bytes` });
    }
    body = JSON.parse(Buffer.from(bytes).toString('utf8')) as CompleteRequestBody;
  } catch {
    return jsonResponse(400, { error: 'invalid-json-body' });
  }
  if (typeof body.baselineRunId !== 'string' || body.baselineRunId.length === 0) {
    return jsonResponse(400, { error: 'missing-baseline-run-id' });
  }

  const result = await completeAuditUploadSession({
    payload,
    sessionId,
    requestId: preflight.context.requestId,
    baselineRunId: body.baselineRunId,
    oidcToken: preflight.context.oidcToken,
  });

  if (!result.ok) {
    return jsonResponse(FAILURE_STATUS[result.reason] ?? 500, { error: result.reason, detail: result.detail });
  }

  return jsonResponse(200, { ok: true });
}
