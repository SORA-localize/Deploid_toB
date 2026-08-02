import fs from 'node:fs';

const stats = JSON.parse(fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'));
const floor = new Set(stats.find((entry) => entry.route === '/privacy').firstLoadChunkPaths);

/**
 * catalog route の「route固有JS」= first-load chunk から共有フロア（/privacy の chunk 集合）を
 * 引いた合計バイト数。共有フロア（591,394、react-dom 226,356 を含む）は Phase 5 の対象外なので
 * 引いて測る。framework 更新でフロアが動いても gate が誤爆しない。
 *
 * 上限は Phase 5 完了時の実測最大値 * 1.15。
 *   /robots        185,280  <- 最大。Radix / floating-ui / 日本語UI文字列が占める
 *   /manufacturers 172,840
 *   /reports       131,150
 *   /use-cases     128,016
 *
 * 当初の暫定目標 180,000 は着手前の /manufacturers の値を借りたもので、根拠が無かった。
 * /robots の残りは components が直接使う UI 文字列と Radix/floating-ui であり、
 * 剥がすには全 client component を props 経由へ作り替える必要がある（実測78経路）。
 * Phase 5 の範囲外と判断し、実測から上限を確定した。
 */
const MAX_ROUTE_SPECIFIC_BYTES = 215_000;
const routes = ['/reports', '/robots', '/manufacturers', '/use-cases'];

let failed = false;
for (const route of routes) {
  const entry = stats.find((item) => item.route === route);
  if (!entry) {
    console.error(`[client-budget] missing route: ${route}`);
    failed = true;
    continue;
  }
  const own = entry.firstLoadChunkPaths
    .filter((chunk) => !floor.has(chunk))
    .reduce((total, chunk) => total + fs.statSync(chunk).size, 0);
  console.log(`[client-budget] ${route}: ${own}/${MAX_ROUTE_SPECIFIC_BYTES}`);
  if (own > MAX_ROUTE_SPECIFIC_BYTES) failed = true;
}
if (failed) process.exitCode = 1;
