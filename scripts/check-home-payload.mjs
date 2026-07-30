import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.join(process.cwd(), '.next/server/app/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const bytes = Buffer.byteLength(html);
const embeddedWorldMaps = (html.match(/data:image\/svg\+xml/g) ?? []).length;
const maxBytes = 500_000;

console.log(`[home-payload] html=${bytes} bytes, embedded-svg=${embeddedWorldMaps}`);

if (bytes >= maxBytes) {
  console.error(`[home-payload] expected HTML below ${maxBytes} bytes`);
  process.exitCode = 1;
}
if (embeddedWorldMaps !== 0) {
  console.error('[home-payload] expected zero embedded SVG data URIs');
  process.exitCode = 1;
}
