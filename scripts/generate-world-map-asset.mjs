import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import DottedMap from 'dotted-map';

const outputPath = path.join(process.cwd(), 'public/generated/world-map.svg');
const map = new DottedMap({ height: 100, grid: 'diagonal' });
const svg = `${map.getSVG({
  radius: 0.22,
  color: '#ffffff45',
  shape: 'circle',
  backgroundColor: 'transparent',
})}\n`;

if (process.argv.includes('--check')) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== svg) {
    console.error('[world-map] generated asset is missing or stale');
    process.exitCode = 1;
  } else {
    console.log('[world-map] generated asset: OK');
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg);
  console.log(`[world-map] wrote ${path.relative(process.cwd(), outputPath)}`);
}
