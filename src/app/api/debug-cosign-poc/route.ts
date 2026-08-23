import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';

// POC専用（docs/reference/task9-audit-upload-endpoint-design-v1.md「## POC計画」）。
// 確認後は next.config.ts の outputFileTracingIncludes entry・package.json の
// vercel-build script・poc-cosign/・.cosign-bin/・このファイルを全部削除する。

const TEST_ARTIFACT_B64 =
  'cG9jIHRlc3QgYXJ0aWZhY3QgZm9yIGNvc2lnbiB2ZXJpZnktYmxvYiBpbiBWZXJjZWwgRnVuY3Rpb24gLSAyMDI2LTA4LTIzVDAwOjAzOjA0Wgo=';
const TEST_BUNDLE_B64 =
  'eyJiYXNlNjRTaWduYXR1cmUiOiJNRVVDSUN3MTJrcmNGQmFibmtDNG9sTUkxK0pXcGtxWjdtdFFzb1pacnBEMFMxaVdBaUVBc3RVVXNSOU1zcXBhT1gwQmtBMmZsbU1JRkJnSkM0bHdXYWcrYXYraFFvND0iLCJyZWtvckJ1bmRsZSI6eyJTaWduZWRFbnRyeVRpbWVzdGFtcCI6Ik1FUUNJRiszZTVjVi9LYWVJSFQ4eGd1c3k3bUZyd09XSDIwQ0tPTGNwbVhmaUdQTEFpQmx4NDg3NVhlS2h5UWo3cnhJYk1IYnoyZnhUK2NhcmEyS1hKTmdYdWlHV3c9PSIsIlBheWxvYWQiOnsiYm9keSI6ImV5SmhjR2xXWlhKemFXOXVJam9pTUM0d0xqRWlMQ0pyYVc1a0lqb2lhR0Z6YUdWa2NtVnJiM0prSWl3aWMzQmxZeUk2ZXlKa1lYUmhJanA3SW1oaGMyZ2lPbnNpWVd4bmIzSnBkR2h0SWpvaWMyaGhNalUySWl3aWRtRnNkV1VpT2lJeU5tSXpPV0kwWm1Nek5qRmtORGhpWm1VNU9UZzNPRE0zTUdRek4yTmxZemcxT0dZME16Y3lNelkxTm1FMU9UZzVNakExTldVek9ERXlNMlUyTWpSaUluMTlMQ0p6YVdkdVlYUjFjbVVpT25zaVkyOXVkR1Z1ZENJNklrMUZWVU5KUTNjeE1tdHlZMFpDWVdKdWEwTTBiMnhOU1RFclNsZHdhM0ZhTjIxMFVYTnZXbHB5Y0VRd1V6RnBWMEZwUlVGemRGVlZjMUk1VFhOeGNHRlBXREJDYTBFeVpteHRUVWxHUW1kS1F6UnNkMWRoWnl0aGRpdG9VVzgwUFNJc0luQjFZbXhwWTB0bGVTSTZleUpqYjI1MFpXNTBJam9pVEZNd2RFeFRNVU5TVldSS1ZHbENVVlpWU2sxVFZVMW5VekJXV2t4VE1IUk1VekJMVkZWYWNtUXdWak5YVldoTVlqRndTbVZ0YjNkUk1FWlNWMVZzVEdJeGNFcGxiVzkzVWtWR1Vsa3dVbEphTUVaR1lraFdhRTVIY0VsamJVcERZMnRrYUUxWVFuTldWa1p2VERKd2FXTnVhRVJOUmtGNlpVRndWMUY2VVhkWmJGcFNaRVpTUW1SNlNsRmtWbkJyWVVkU1VHTXhXa1JsYTFwaFdUQjRNMXBFV1hwamEyUjFUakpPYWxvell6VmhSa3BRVW14V1VGTXdTa1poTW14UVZqRmpNRTlHVmtKUVZEQkxURk13ZEV4VE1VWlVhMUZuVlVaV1ExUkZiRVJKUlhSR1YxTXdkRXhUTUhSRFp6MDlJbjE5ZlgwPSIsImludGVncmF0ZWRUaW1lIjoxNzg3NDQzMzg2LCJsb2dJbmRleCI6MjU2ODY3NDQ4NiwibG9nSUQiOiJjMGQyM2Q2YWQ0MDY5NzNmOTU1OWYzYmEyZDFjYTAxZjg0MTQ3ZDhmZmM1Yjg0NDVjMjI0Zjk4Yjk1OTE4MDFkIn19fQ==';
const PREVIEW_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElua4jHrbBrGa1plUQh/jbrxC0P3x
VC40bVQtTAw2PuZdhdOsVCzFZcLwd63rGn7ccgw9hROFUOKBEkiOWW48UA==
-----END PUBLIC KEY-----
`;

export async function GET(request: NextRequest) {
  const result: Record<string, unknown> = {};

  // 1. cosign binary が同梱されているか・execFileできるか
  const cosignPath = path.join(process.cwd(), '.cosign-bin', 'cosign');
  result.cosignPath = cosignPath;
  try {
    const versionOut = execFileSync(cosignPath, ['version'], { encoding: 'utf8' });
    result.cosignVersionOk = true;
    result.cosignVersionExcerpt = versionOut.split('\n').find((l) => l.includes('GitVersion')) ?? null;
  } catch (e) {
    result.cosignVersionOk = false;
    result.cosignVersionError = e instanceof Error ? e.message : String(e);
  }

  // 2. 実署名bundleでverify-blobが通るか
  if (result.cosignVersionOk) {
    try {
      const workDir = await mkdtemp(path.join(os.tmpdir(), 'cosign-poc-'));
      const artifactPath = path.join(workDir, 'test-artifact.txt');
      const bundlePath = path.join(workDir, 'test-artifact.cosign.bundle');
      const keyPath = path.join(workDir, 'preview-pubkey.pem');
      await writeFile(artifactPath, Buffer.from(TEST_ARTIFACT_B64, 'base64'));
      await writeFile(bundlePath, Buffer.from(TEST_BUNDLE_B64, 'base64'));
      await writeFile(keyPath, PREVIEW_PUBLIC_KEY_PEM);
      const verifyOut = execFileSync(
        cosignPath,
        ['verify-blob', '--key', keyPath, '--bundle', bundlePath, '--insecure-ignore-tlog=true', artifactPath],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      result.verifyBlobOk = true;
      result.verifyBlobOutput = verifyOut.trim();
    } catch (e) {
      result.verifyBlobOk = false;
      result.verifyBlobError = e instanceof Error ? e.message : String(e);
    }
  }

  // 3. x-vercel-oidc-token header を明示credentialとして Blob head() へ渡せるか（読み取り専用）
  const oidcHeader = request.headers.get('x-vercel-oidc-token');
  result.hasOidcHeader = Boolean(oidcHeader);
  const storeId = process.env.PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID;
  result.hasStoreId = Boolean(storeId);
  if (oidcHeader && storeId) {
    try {
      const { list } = await import('@vercel/blob');
      const listResult = await list({ oidcToken: oidcHeader, storeId, limit: 1 } as never);
      result.blobListOk = true;
      result.blobCount = (listResult as { blobs: unknown[] }).blobs.length;
    } catch (e) {
      result.blobListOk = false;
      result.blobListError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(result);
}
