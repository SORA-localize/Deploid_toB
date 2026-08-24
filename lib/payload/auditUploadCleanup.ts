import type { Payload } from 'payload';
import { auditBlobStoreIdFor } from '../content/auditBlobStore';
import { createVercelBlobObjectStore, type SnapshotObjectStore, type VercelBlobStoreOptions } from '../../scripts/snapshotObjectStore.mts';

interface AllowedObjectRecord { objectKey: string; uploaded: boolean }
interface LoadedSession {
  id: string | number; requestId: string; environment: 'preview' | 'production';
  allowedObjects: AllowedObjectRecord[]; status: 'pending' | 'completed';
}
export type BlobStoreFactory = (options: VercelBlobStoreOptions) => SnapshotObjectStore;

async function loadSession(payload: Payload, sessionId: string): Promise<LoadedSession | null> {
  const { docs } = await payload.find({ collection: 'audit-upload-sessions', where: { sessionId: { equals: sessionId } }, overrideAccess: true, limit: 1 });
  return (docs[0] as unknown as LoadedSession | undefined) ?? null;
}

export type CleanupSessionResult = { ok: true; removedObjectCount: number } | { ok: false; reason: string; detail: string };

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
    if (!obj.uploaded) continue;
    await store.remove(obj.objectKey);
    removedObjectCount += 1;
  }
  await args.payload.delete({ collection: 'audit-upload-sessions', id: session.id, overrideAccess: true });
  return { ok: true, removedObjectCount };
}
