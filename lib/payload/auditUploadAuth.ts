import { timingSafeEqual } from 'node:crypto';
import type { Payload } from 'payload';
import { isPlatformAdminUser, type AdminRole } from './access';

/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「認証設計」。MCP API key単体には
 * 依存しない——「編集権限」と「audit storeへの書き込み権限」は別の権限であるべき、という指摘に
 * 沿って、2つの独立した要素を両方要求する。
 *
 * 1. **platform-admin相当の実session**（`payload.auth()`、`lib/content/previewTokens.ts`の
 *    `authenticateDraftWriter()`と同じ確立済みpattern。役割だけ`platform-admin`固定にする）。
 * 2. **Task 9 baseline upload専用のscope**: 別の共有secret（`AUDIT_UPLOAD_SHARED_SECRET`）を
 *    独立したheaderで要求する。platform-adminの通常sessionだけでは足りない
 *    （session cookie漏洩等からこの高リスク操作を切り離す）。timing-safe比較で照合する。
 */

export interface AuthenticatedAuditUploadOperator {
  id: string | number;
  role: AdminRole;
}

export type AuditUploadAuthFailureReason =
  | 'no-session'
  | 'not-platform-admin'
  | 'missing-scope-header'
  | 'missing-scope-secret-config'
  | 'invalid-scope-secret';

export type AuditUploadAuthResult =
  | { ok: true; operator: AuthenticatedAuditUploadOperator }
  | { ok: false; reason: AuditUploadAuthFailureReason };

const SCOPE_HEADER = 'x-audit-upload-scope';

/** timing-safe比較。長さが違う場合も早期returnせず、固定長バッファ同士を比較する。 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // 長さの違いだけでタイミングが漏れないよう、固定長のdummy比較を必ず行う。
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * `request`・`payload`からこの2要素を検証する。**tokenを一切ログ出力しない**
 * （`docs/.../task9-audit-upload-endpoint-design-v1.md`「oidcTokenOverride」と同じ制約を
 * 認証secretにも適用する）。
 */
export async function authenticateAuditUploadOperator(
  request: Request,
  payload: Payload,
  env: Record<string, string | undefined> = process.env,
): Promise<AuditUploadAuthResult> {
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return { ok: false, reason: 'no-session' };
  const role = (user as { role?: AdminRole }).role;
  if (!isPlatformAdminUser({ id: (user as { id: string | number }).id, role })) {
    return { ok: false, reason: 'not-platform-admin' };
  }

  const providedScope = request.headers.get(SCOPE_HEADER);
  if (!providedScope) return { ok: false, reason: 'missing-scope-header' };

  const configuredSecret = env.AUDIT_UPLOAD_SHARED_SECRET?.trim();
  if (!configuredSecret) return { ok: false, reason: 'missing-scope-secret-config' };

  if (!timingSafeStringEqual(providedScope, configuredSecret)) {
    return { ok: false, reason: 'invalid-scope-secret' };
  }

  return { ok: true, operator: { id: (user as { id: string | number }).id, role: role! } };
}
