export type ManagedEnvironment = 'preview' | 'production';

/** Resolve the audit store without importing the cosign-dependent preflight module. */
export function auditBlobStoreIdFor(
  environment: ManagedEnvironment | 'local' | null,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (environment === 'production') return env.PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID ?? null;
  if (environment === 'preview') return env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID ?? null;
  return env.LOCAL_AUDIT_BLOB_TOKEN_STORE_ID ?? 'local-throwaway-no-audit-store';
}
