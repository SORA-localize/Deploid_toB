import { createHash } from 'node:crypto';
import type { MediaInventoryEntry, SnapshotStorageProvider } from '../../scripts/snapshotObjectStore.mts';

export function canonicalJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, v]) => [k, normalize(v)]),
      );
    }
    return input;
  };
  return JSON.stringify(normalize(value), null, 2);
}

export function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export interface CutoverBaselineManifest {
  provenance: {
    sourceKind: 'local' | 'payload';
    environment: 'production' | 'preview' | 'local-throwaway';
    databaseResourceId: string;
    auditBlobStoreId: string;
    schemaVersion: string;
    baselineRunId: string;
    baselineGeneration: number;
  };
  storage: {
    provider: SnapshotStorageProvider;
    bucket: string;
    storeId: string | null;
    objectKey: string;
    versionId: string | null;
  };
  mediaInventory: MediaInventoryEntry[];
  sha256: string;
  signature: { algorithm: 'cosign'; keyId: string; detachedSignatureObjectKey: string };
  recordCounts: Record<string, number>;
  exportedAt: string;
  exportedBy: string;
}

export interface SignedBaselineEnvelope {
  manifest: CutoverBaselineManifest;
  manifestSignature: { algorithm: 'cosign'; keyId: string; bundleBase64: string };
}

export function assertValidManifest(value: unknown): asserts value is CutoverBaselineManifest {
  const problems: string[] = [];
  const manifest = value as Partial<CutoverBaselineManifest> | null;
  if (!manifest || typeof manifest !== 'object') throw new Error('manifest-invalid: not an object');
  const storage = manifest.storage;
  if (!storage || typeof storage !== 'object') problems.push('storage');
  else {
    if (!['vercel-blob', 's3', 'local-disk'].includes(storage.provider as string)) problems.push('storage.provider');
    if (typeof storage.bucket !== 'string' || !storage.bucket) problems.push('storage.bucket');
    if (typeof storage.objectKey !== 'string' || !storage.objectKey) problems.push('storage.objectKey');
    if (!(storage.versionId === null || typeof storage.versionId === 'string')) problems.push('storage.versionId');
    if (storage.provider === 'vercel-blob' && (typeof storage.storeId !== 'string' || !storage.storeId)) problems.push('storage.storeId');
    else if (!(storage.storeId === null || typeof storage.storeId === 'string')) problems.push('storage.storeId');
  }
  if (typeof manifest.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(manifest.sha256)) problems.push('sha256');
  if (!Array.isArray(manifest.mediaInventory)) problems.push('mediaInventory');
  else manifest.mediaInventory.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') return problems.push(`mediaInventory[${i}]`);
    for (const key of ['stableId', 'filename', 'objectKey', 'mimeType'] as const) if (typeof entry[key] !== 'string' || !entry[key]) problems.push(`mediaInventory[${i}].${key}`);
    if (typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256)) problems.push(`mediaInventory[${i}].sha256`);
    if (!Number.isInteger(entry.size) || entry.size < 0) problems.push(`mediaInventory[${i}].size`);
  });
  const signature = manifest.signature;
  if (!signature || typeof signature !== 'object') problems.push('signature');
  else {
    if (signature.algorithm !== 'cosign') problems.push('signature.algorithm');
    if (typeof signature.keyId !== 'string' || !signature.keyId) problems.push('signature.keyId');
    if (typeof signature.detachedSignatureObjectKey !== 'string' || !signature.detachedSignatureObjectKey) problems.push('signature.detachedSignatureObjectKey');
  }
  if (!manifest.recordCounts || typeof manifest.recordCounts !== 'object') problems.push('recordCounts');
  else for (const key of ['manufacturers','robots','robotSeries','distributors','useCases','deployments','articles','articlePlacements','media','siteSettings']) if (!Number.isInteger(manifest.recordCounts[key])) problems.push(`recordCounts.${key}`);
  if (typeof manifest.exportedAt !== 'string' || Number.isNaN(Date.parse(manifest.exportedAt))) problems.push('exportedAt');
  if (typeof manifest.exportedBy !== 'string' || !manifest.exportedBy) problems.push('exportedBy');
  const provenance = manifest.provenance;
  if (!provenance || typeof provenance !== 'object') problems.push('provenance');
  else {
    if (!['local','payload'].includes(provenance.sourceKind as string)) problems.push('provenance.sourceKind');
    if (!['production','preview','local-throwaway'].includes(provenance.environment as string)) problems.push('provenance.environment');
    for (const key of ['databaseResourceId','auditBlobStoreId','schemaVersion','baselineRunId'] as const) if (typeof provenance[key] !== 'string' || !provenance[key]) problems.push(`provenance.${key}`);
    if (!Number.isInteger(provenance.baselineGeneration)) problems.push('provenance.baselineGeneration');
  }
  if (problems.length) throw new Error(`manifest-invalid: ${problems.join(', ')}`);
}

export function assertValidEnvelope(value: unknown): asserts value is SignedBaselineEnvelope {
  const envelope = value as Partial<SignedBaselineEnvelope> | null;
  if (!envelope || typeof envelope !== 'object' || !('manifest' in envelope) || !('manifestSignature' in envelope)) throw new Error('envelope-invalid: expected signed baseline envelope');
  assertValidManifest(envelope.manifest);
  const signature = envelope.manifestSignature;
  if (!signature || typeof signature !== 'object' || signature.algorithm !== 'cosign' || typeof signature.keyId !== 'string' || !signature.keyId || typeof signature.bundleBase64 !== 'string' || !signature.bundleBase64) throw new Error('envelope-invalid: manifestSignature');
}
