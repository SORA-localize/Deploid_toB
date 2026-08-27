import type { Payload } from 'payload';
import { auditBlobStoreIdFor } from '../content/auditBlobStore';
import {
  baselineCompletionMarkerKey,
  createVercelBlobObjectStore,
  type SnapshotObjectStore,
  type VercelBlobStoreOptions,
} from '../../scripts/snapshotObjectStore.mts';

interface AllowedObjectRecord { objectKey: string; uploaded: boolean }
interface LoadedSession {
  id: string | number; requestId: string; environment: 'preview' | 'production';
  baselineObjectKey: string;
  allowedObjects: AllowedObjectRecord[]; status: 'pending' | 'completed';
}
export type BlobStoreFactory = (options: VercelBlobStoreOptions) => SnapshotObjectStore;

async function loadSession(payload: Payload, sessionId: string): Promise<LoadedSession | null> {
  const { docs } = await payload.find({ collection: 'audit-upload-sessions', where: { sessionId: { equals: sessionId } }, overrideAccess: true, limit: 1 });
  return (docs[0] as unknown as LoadedSession | undefined) ?? null;
}

export type CleanupSessionResult = { ok: true; removedObjectCount: number } | { ok: false; reason: string; detail: string };

export type ExpiredAuditUploadCleanupResult = {
  scanned: number;
  cleaned: number;
  failed: Array<{ sessionId: string; detail: string }>;
};

export async function cleanupAuditUploadSession(args: {
  payload: Payload; sessionId: string; requestId: string; oidcToken: string;
  env?: Record<string, string | undefined>; storeFactory?: BlobStoreFactory;
}): Promise<CleanupSessionResult> {
  const env = args.env ?? process.env;
  const session = await loadSession(args.payload, args.sessionId);
  if (!session) return { ok: false, reason: 'session-not-found', detail: args.sessionId };
  if (session.requestId !== args.requestId) return { ok: false, reason: 'request-id-mismatch', detail: 'requestId does not match session' };
  if (session.status === 'completed') return { ok: false, reason: 'session-already-completed', detail: 'refusing to clean up a completed baseline' };
  const storeId = auditBlobStoreIdFor(session.environment, env);
  if (!storeId) return { ok: false, reason: 'store-error', detail: 'no audit blob store id configured' };
  const store = (args.storeFactory ?? createVercelBlobObjectStore)({
    storeId, displayName: `deploid-audit-${session.environment}`, expectedEnvironment: session.environment,
    env, oidcTokenOverride: args.oidcToken,
  });
  let removedObjectCount = 0;
  for (const obj of session.allowedObjects) {
    // Remove both recorded and unrecorded objects. A Blob write can succeed
    // immediately before the DB flag update fails, leaving uploaded=false.
    // Object keys are session-derived manifest keys, so deleting the complete
    // allowlist is safe for this pending session and closes that orphan window.
    await store.remove(obj.objectKey);
    if (obj.uploaded) removedObjectCount += 1;
  }
  const markerKey = baselineCompletionMarkerKey(session.baselineObjectKey);
  if (await store.exists(markerKey)) await store.remove(markerKey);
  await args.payload.delete({ collection: 'audit-upload-sessions', id: session.id, overrideAccess: true });
  return { ok: true, removedObjectCount };
}

/** Reclaims expired pending sessions; failed rows remain retryable. */
export async function cleanupExpiredAuditUploadSessions(args: {
  payload: Payload; oidcToken: string; now?: Date;
  env?: Record<string, string | undefined>; storeFactory?: BlobStoreFactory; limit?: number;
}): Promise<ExpiredAuditUploadCleanupResult> {
  const now = args.now ?? new Date();
  const { docs } = await args.payload.find({
    collection: 'audit-upload-sessions',
    where: { status: { equals: 'pending' }, expiresAt: { less_than: now.toISOString() } },
    overrideAccess: true, limit: args.limit ?? 100,
  });
  const result: ExpiredAuditUploadCleanupResult = { scanned: docs.length, cleaned: 0, failed: [] };
  for (const doc of docs) {
    const session = doc as unknown as { sessionId: string; requestId: string };
    try {
      const cleanup = await cleanupAuditUploadSession({
        payload: args.payload, sessionId: session.sessionId, requestId: session.requestId,
        oidcToken: args.oidcToken, env: args.env, storeFactory: args.storeFactory,
      });
      if (cleanup.ok) result.cleaned += 1;
      else result.failed.push({ sessionId: session.sessionId, detail: `${cleanup.reason}: ${cleanup.detail}` });
    } catch (error) {
      result.failed.push({ sessionId: session.sessionId, detail: error instanceof Error ? error.message : String(error) });
    }
  }
  return result;
}
