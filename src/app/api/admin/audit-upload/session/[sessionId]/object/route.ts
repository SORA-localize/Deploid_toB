/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「Step 2」。
 *
 * body: 生バイト列。objectKeyはclientに自己申告させない——アップロードされたバイト列の
 * sha256を計算し、sessionの許可一覧の中から一致するものを探して初めてBlobへ書く。
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { recordAuditUploadObject } from '@/lib/payload/auditUploadObject';
import { auditUploadPreflight, jsonResponse } from '@/lib/payload/auditUploadRouteHelpers';

// Buffer/fsとBlob storeクライアントを使うためedge runtimeでは動かないが、`next.config.ts`の
// `cacheComponents: true`とroute segment configの明示的な`runtime`指定は非互換（`next build`が
// "Route segment config "runtime" is not compatible with nextConfig.cacheComponents"でエラーに
// なることを確認済み）。Next.jsの既定（App Router route handlerはnodejs）に委ねる。

const FAILURE_STATUS: Record<string, number> = {
  'session-not-found': 404,
  'session-not-usable': 409,
  'object-not-recognized': 422,
  'store-error': 502,
};

/**
 * レビュー指摘5: 認証情報が漏れた場合のDoS耐性として上限が要る。このprojectの実データで最大の
 * media fileは1MB未満、snapshot本体もcontent record数百件規模でMB未満（`docs/reference/
 * content-platform-resources-v1.md`参照実績）。将来の増加分を見込んで50MBを上限にする——
 * Vercel Functions自体の100MB上限より十分小さく、`request.arrayBuffer()`が確保するメモリ量を
 * 現実的な範囲に抑える。
 */
const MAX_OBJECT_BODY_BYTES = 50 * 1024 * 1024;

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
    if (Number.isFinite(declaredLength) && declaredLength > MAX_OBJECT_BODY_BYTES) {
      return jsonResponse(413, { error: 'body-too-large', detail: `Content-Length exceeds ${MAX_OBJECT_BODY_BYTES} bytes` });
    }
  }

  const arrayBuffer = await request.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  if (body.byteLength === 0) {
    return jsonResponse(400, { error: 'empty-body' });
  }
  // Content-Lengthが無い・偽装されている場合の多重防御。
  if (body.byteLength > MAX_OBJECT_BODY_BYTES) {
    return jsonResponse(413, { error: 'body-too-large', detail: `body exceeds ${MAX_OBJECT_BODY_BYTES} bytes` });
  }

  const result = await recordAuditUploadObject({
    payload,
    sessionId,
    requestId: preflight.context.requestId,
    body,
    oidcToken: preflight.context.oidcToken,
  });

  if (!result.ok) {
    return jsonResponse(FAILURE_STATUS[result.reason] ?? 500, { error: result.reason, detail: result.detail });
  }

  return jsonResponse(200, { ok: true });
}
