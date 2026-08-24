// build時にVercel Node Functionへ同梱するcosign binaryを取得する。
// `docs/reference/task9-audit-upload-endpoint-design-v1.md`「POC結果」で実Preview
// deploymentにて動作確認済みの構成をそのまま使う。checksumは公式releaseのcosign_checksums.txt
// と照合済みの固定値（バージョンを上げる際はこの値も更新すること）。
import { createHash } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const COSIGN_VERSION = 'v3.1.3';
const EXPECTED_SHA256 = '4629c757b7618056f8ddd7e2625ae9fdd94c0372a65049520bc7d9df9efc7f71';
const URL = `https://github.com/sigstore/cosign/releases/download/${COSIGN_VERSION}/cosign-linux-amd64`;
const OUT_DIR = path.resolve('.cosign-bin');
const OUT_PATH = path.join(OUT_DIR, 'cosign');

const res = await fetch(URL);
if (!res.ok) throw new Error(`cosign-fetch-failed: HTTP ${res.status} from ${URL}`);
const buf = Buffer.from(await res.arrayBuffer());
const actualSha256 = createHash('sha256').update(buf).digest('hex');
if (actualSha256 !== EXPECTED_SHA256) {
  throw new Error(`cosign-checksum-mismatch: expected ${EXPECTED_SHA256}, got ${actualSha256}`);
}
await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_PATH, buf);
await chmod(OUT_PATH, 0o755);
console.log(`cosign ${COSIGN_VERSION} fetched and checksum-verified: ${OUT_PATH}`);
