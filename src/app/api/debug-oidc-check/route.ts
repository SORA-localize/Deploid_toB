import { NextResponse } from 'next/server';

export async function GET() {
  const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN);
  const storeId = process.env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID;
  let listResult: unknown = null;
  let listError: string | null = null;
  if (hasOidc && storeId) {
    try {
      const { list } = await import('@vercel/blob');
      const result = await list({
        oidcToken: process.env.VERCEL_OIDC_TOKEN,
        storeId,
        limit: 1,
      } as never);
      listResult = { blobCount: (result as { blobs: unknown[] }).blobs.length };
    } catch (e) {
      listError = e instanceof Error ? e.message : String(e);
    }
  }
  return NextResponse.json({
    hasOidcToken: hasOidc,
    hasStoreId: Boolean(storeId),
    listResult,
    listError,
  });
}
