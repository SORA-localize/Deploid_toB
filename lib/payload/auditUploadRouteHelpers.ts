import type { Payload } from 'payload';
import { authenticateAuditUploadOperator } from './auditUploadAuth';

/**
 * `src/app/api/admin/audit-upload/**`の全routeで共通の前段チェック。
 * 認証（platform-admin session + scope secret）・`x-vercel-oidc-token`・
 * `x-audit-upload-request-id`のいずれかが欠けていれば、業務ロジックへ進まずここで拒否する。
 */
export interface AuditUploadRequestContext {
  requestId: string;
  oidcToken: string;
}

export type AuditUploadPreflightResult =
  | { ok: true; context: AuditUploadRequestContext }
  | { ok: false; response: Response };

export function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}

export async function auditUploadPreflight(request: Request, payload: Payload): Promise<AuditUploadPreflightResult> {
  const auth = await authenticateAuditUploadOperator(request, payload);
  if (!auth.ok) {
    return { ok: false, response: jsonResponse(401, { error: 'unauthenticated', reason: auth.reason }) };
  }

  const oidcToken = request.headers.get('x-vercel-oidc-token');
  if (!oidcToken) {
    // これはVercel自身がFunction runtimeへ付与するheaderで、client側は偽装できない
    // （Vercel Function以外からの実行、あるいはOIDC Federation未設定を示す）。
    return { ok: false, response: jsonResponse(500, { error: 'oidc-token-unavailable' }) };
  }

  const requestId = request.headers.get('x-audit-upload-request-id');
  if (!requestId) {
    return { ok: false, response: jsonResponse(400, { error: 'missing-request-id-header' }) };
  }

  return { ok: true, context: { requestId, oidcToken } };
}
