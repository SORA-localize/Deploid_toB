import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routes = {
  session: 'server/app/api/admin/audit-upload/session/route.js.nft.json',
  complete: 'server/app/api/admin/audit-upload/session/[sessionId]/complete/route.js.nft.json',
  object: 'server/app/api/admin/audit-upload/session/[sessionId]/object/route.js.nft.json',
  cleanup: 'server/app/api/admin/audit-upload/session/[sessionId]/route.js.nft.json',
};

const hasCosign = (relativeTraceFile) => {
  const tracePath = path.join(root, '.next', relativeTraceFile);
  if (!fs.existsSync(tracePath)) throw new Error(`missing route trace: ${relativeTraceFile}`);
  const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
  return trace.files.some((file) => file.replaceAll('\\', '/').endsWith('/.cosign-bin/cosign'));
};

const expected = { session: true, complete: true, object: false, cleanup: false };
for (const [name, trace] of Object.entries(routes)) {
  const actual = hasCosign(trace);
  if (actual !== expected[name]) {
    throw new Error(`audit-upload trace invariant failed for ${name}: expected cosign=${expected[name]}, got ${actual}`);
  }
}
console.log('[audit-upload-traces] OK: cosign is present only in session and complete routes');
