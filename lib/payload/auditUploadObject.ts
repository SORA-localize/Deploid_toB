import { createHash } from 'node:crypto';
import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import { auditBlobStoreIdFor } from '../content/auditBlobStore';
import {
  createVercelBlobObjectStore,
  isAllowedAuditBaselineObjectKey,
  type SnapshotObjectStore,
  type VercelBlobStoreOptions,
} from '../../scripts/snapshotObjectStore.mts';

interface AllowedObjectRecord {
  objectKey: string;
  sha256: string | null;
  size: number | null;
  uploaded: boolean;
}

interface LoadedSession {
  id: string | number;
  sessionId: string;
  requestId: string;
  baselineObjectKey: string;
  environment: 'preview' | 'production';
  allowedObjects: AllowedObjectRecord[];
  status: 'pending' | 'completed';
  expiresAt: string;
}

export type BlobStoreFactory = (options: VercelBlobStoreOptions) => SnapshotObjectStore;

async function loadSession(payload: Payload, sessionId: string): Promise<LoadedSession | null> {
  const { docs } = await payload.find({
    collection: 'audit-upload-sessions', where: { sessionId: { equals: sessionId } },
    overrideAccess: true, limit: 1,
  });
  return (docs[0] as unknown as LoadedSession | undefined) ?? null;
}

function isSessionUsable(session: LoadedSession, requestId: string): { ok: true } | { ok: false; reason: string } {
  if (session.status !== 'pending') return { ok: false, reason: 'session-already-completed' };
  if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false, reason: 'session-expired' };
  if (session.requestId !== requestId) return { ok: false, reason: 'request-id-mismatch' };
  return { ok: true };
}

export type RecordObjectResult =
  | { ok: true }
  | { ok: false; reason: 'session-not-found' | 'session-not-usable' | 'object-not-recognized' | 'store-error'; detail: string };

export async function recordAuditUploadObject(args: {
  payload: Payload; sessionId: string; requestId: string; body: Buffer; oidcToken: string;
  env?: Record<string, string | undefined>; storeFactory?: BlobStoreFactory;
}): Promise<RecordObjectResult> {
  const env = args.env ?? process.env;
  const session = await loadSession(args.payload, args.sessionId);
  if (!session) return { ok: false, reason: 'session-not-found', detail: args.sessionId };
  const usable = isSessionUsable(session, args.requestId);
  if (!usable.ok) return { ok: false, reason: 'session-not-usable', detail: usable.reason };

  const bodySha256 = createHash('sha256').update(args.body).digest('hex');
  const bodySize = args.body.byteLength;
  const signatureKey = `${session.baselineObjectKey}.cosign.bundle`;
  const sha256Match = session.allowedObjects.find((obj) =>
    !obj.uploaded && obj.objectKey !== signatureKey && obj.sha256 === bodySha256 &&
    (obj.size === null || obj.size === bodySize));
  const match = sha256Match ?? session.allowedObjects.find((obj) => !obj.uploaded && obj.objectKey === signatureKey);
  if (!match) return { ok: false, reason: 'object-not-recognized', detail: 'no allowed object matches this upload' };
  if (!isAllowedAuditBaselineObjectKey(match.objectKey, session.baselineObjectKey)) {
    return { ok: false, reason: 'object-not-recognized', detail: 'object key outside allowed prefix' };
  }
  const storeId = auditBlobStoreIdFor(session.environment, env);
  if (!storeId) return { ok: false, reason: 'store-error', detail: 'no audit blob store id configured' };
  try {
    const store = (args.storeFactory ?? createVercelBlobObjectStore)({
      storeId, displayName: `deploid-audit-${session.environment}`, expectedEnvironment: session.environment,
      env, oidcTokenOverride: args.oidcToken,
    });
    await store.put(match.objectKey, args.body);
  } catch (e) {
    return { ok: false, reason: 'store-error', detail: e instanceof Error ? e.message : String(e) };
  }
  await args.payload.db.drizzle.execute(sql`
    UPDATE "_audit_upload_sessions_allowed_objects"
    SET "uploaded" = true
    WHERE "_parent_id" = ${session.id} AND "object_key" = ${match.objectKey} AND "uploaded" = false
  `);
  return { ok: true };
}
