/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「Step 1」。
 *
 * body: `SignedBaselineEnvelope`（`manifest` + `manifestSignature`）全体。署名検証に成功した
 * 場合にしか session を作らない。この時点ではBlobへ何も書かない。
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { createAuditUploadSession } from '@/lib/payload/auditUploadSession';
import { auditUploadPreflight, jsonResponse } from '@/lib/payload/auditUploadRouteHelpers';

// cosign（`ensureCosignOnPath` / `execFileSync`）とBuffer/fsを使うため、edge runtimeでは動かない。
// Next.jsの既定はApp Router route handlerでnodejsだが、将来の設定変更で意図せずedgeへ倒れないよう
// 明示する。
export const runtime = 'nodejs';

const FAILURE_STATUS: Record<string, number> = {
  'malformed-envelope': 400,
  'signature-invalid': 422,
  'store-selection-refused': 422,
  'internal-error': 500,
};

/**
 * このrouteが受け取るのは署名済みmanifestのJSON本文（バイナリ本体はStep 2で別送）。実データでの
 * manifestは content record への参照とmediaInventory（1 entryあたりsha256/size/path程度）が
 * 主体で、現実規模（`docs/reference/content-platform-resources-v1.md`）ではMB未満に収まる。
 * 10MBは将来の増加分を十分に見込みつつ、認証情報漏洩時のDoS耐性としてメモリ確保量を現実的な
 * 範囲に抑える上限（object routeのMAX_OBJECT_BODY_BYTESと同じ考え方）。
 */
const MAX_SESSION_BODY_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config: payloadConfig });

  const preflight = await auditUploadPreflight(request, payload);
  if (!preflight.ok) return preflight.response;

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SESSION_BODY_BYTES) {
      return jsonResponse(413, { error: 'body-too-large', detail: `Content-Length exceeds ${MAX_SESSION_BODY_BYTES} bytes` });
    }
  }

  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SESSION_BODY_BYTES) {
    return jsonResponse(413, { error: 'body-too-large', detail: `body exceeds ${MAX_SESSION_BODY_BYTES} bytes` });
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(Buffer.from(arrayBuffer).toString('utf8'));
  } catch {
    return jsonResponse(400, { error: 'invalid-json-body' });
  }

  const result = await createAuditUploadSession({
    payload,
    rawBody,
    requestId: preflight.context.requestId,
    oidcToken: preflight.context.oidcToken,
  });

  if (!result.ok) {
    return jsonResponse(FAILURE_STATUS[result.reason] ?? 500, { error: result.reason, detail: result.detail });
  }

  return jsonResponse(201, { sessionId: result.sessionId, expiresAt: result.expiresAt, environment: result.environment });
}
