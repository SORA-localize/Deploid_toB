import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.join(process.cwd(), '.next/server/app/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const bytes = Buffer.byteLength(html);
const embeddedWorldMaps = (html.match(/data:image\/svg\+xml/g) ?? []).length;
/**
 * Phase 4 は Home の HTML を 4.2MB → 326KB（監査時点の実測 203,094）まで削った。
 *
 * 上限は 500,000 だったが、これは実測の 2.5 倍で、2.4 倍の回帰まで素通りする。
 * 落ちない gate は「守っていること」を保証しない（Phase 1〜6 監査、2026-08-03）。
 * 実測 * 1.15 に締め直す。world-map を data URI で埋め戻すような回帰は
 * embedded-svg の判定と合わせて、ここで確実に赤くなる。
 */
const maxBytes = 235_000;

console.log(`[home-payload] html=${bytes} bytes, embedded-svg=${embeddedWorldMaps}`);

if (bytes >= maxBytes) {
  console.error(`[home-payload] expected HTML below ${maxBytes} bytes`);
  process.exitCode = 1;
}
if (embeddedWorldMaps !== 0) {
  console.error('[home-payload] expected zero embedded SVG data URIs');
  process.exitCode = 1;
}
