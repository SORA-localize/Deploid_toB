import { getPayload } from 'payload';
import config from '@/payload.config';
import { cleanupExpiredAuditUploadSessions } from '@/lib/payload/auditUploadCleanup';

/** Vercel Cron entrypoint. Vercel supplies the OIDC token in a request header. */
export async function GET(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !provided || provided !== expected) {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }
  const oidcToken = request.headers.get('x-vercel-oidc-token');
  if (!oidcToken) return Response.json({ ok: false, reason: 'oidc-token-header-missing' }, { status: 503 });

  const payload = await getPayload({ config });
  const result = await cleanupExpiredAuditUploadSessions({ payload, oidcToken });
  return Response.json({ ok: result.failed.length === 0, ...result }, { status: result.failed.length === 0 ? 200 : 207 });
}
