import fs from 'node:fs';

const stats = JSON.parse(fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'));

/**
 * 共有フロア = **全 route に共通して現れる chunk** の集合。
 *
 * Phase 5 は `/privacy` の chunk 集合をフロアと定義していた。今日の実測では交差集合と完全に
 * 一致する（588,660 / 9 chunks、差 0）が、`/privacy` に route 固有の client code が1つでも
 * 入った瞬間、それが全 route から差し引かれて他 route の「固有」を過小評価する。
 * 基準を1 route の内容に依存させない。
 */
function sharedFloorChunks(entries) {
  let intersection = null;
  for (const entry of entries) {
    const chunks = new Set(entry.firstLoadChunkPaths);
    intersection =
      intersection === null
        ? chunks
        : new Set([...intersection].filter((chunk) => chunks.has(chunk)));
  }
  return intersection ?? new Set();
}

const bytesOf = (chunks) =>
  [...chunks].reduce((total, chunk) => total + fs.statSync(chunk).size, 0);

/**
 * フロア自体の上限。**これが無かったことが Phase 1〜6 監査（2026-08-03）の指摘。**
 *
 * 従来はフロアを引き算するだけで、フロア自身には上限が無かった。`layout.tsx` に重い依存を
 * 足すと全 route が太るのに、差引後の数字は 1 byte も動かないため gate は緑のままだった。
 * Phase 7 は逆にフロアを削る作業（root `<Toaster />` の撤去）なので、削れたことを数字で
 * 示し、後で戻ったら落ちる基準がここに要る。
 *
 * 上限は実測 + 観測済みドリフトの2倍。フロアはphaseを跨いでもほとんど動かない。
 *   591,394  Phase 5 完了時
 *   588,395  繰り越し#3 起票時
 *   588,660  Phase 6 tip（現在）
 * 3,000 bytes 未満（0.5%）に収まっているので、588,660 + 1.1% = 595,000 とする。
 *
 * framework 更新で当たることはある。それは誤爆ではない。全 route に数十KB乗る変更は
 * 意識して受け入れる判断であるべきで、黙って吸収されてよい変化ではない。当たったら
 * 実測し直して上げる。
 *
 * **Phase 7 でフロアを削ったら、この値も下げること。** 改善のたびに余裕だけが増えると、
 * 監査が指摘した「落ちない gate」へ戻る。
 */
const MAX_SHARED_FLOOR_BYTES = 595_000;

/**
 * route固有JS（first-load chunk − 共有フロア）の上限。
 *
 * catalog 4 route の 215,000 は Phase 5 完了時の実測最大値 * 1.15（`/robots` 185,280）。
 * ただしこの 215,000 は「catalog 4 route の中での最大」であって、サイト全体の最大ではない。
 * 監査時点の実測では `/`(256,845)・`/compare`(248,436)・`/robots/[slug]`(233,297)・
 * `/reports/[slug]`(202,932) の4つが `/robots` より重く、いずれも gate の対象外だった。
 * 実際 Phase 6 は Home 側の client component を増やしている。対象を全 route へ広げる。
 *
 * 新規に載せた route の上限は監査時点の実測 * 1.15。client JS を持たない静的 route は
 * 実測 0 だが、再チャンクの揺れを許容して 20,000 を置く。
 */
const ROUTE_SPECIFIC_BUDGETS = {
  '/': 295_000,
  '/compare': 285_000,
  '/robots/[slug]': 268_000,
  '/reports/[slug]': 233_000,
  '/robots': 215_000,
  '/manufacturers': 215_000,
  '/reports': 215_000,
  '/use-cases': 215_000,
  '/contact': 85_000,
  '/manufacturers/[slug]': 80_000,
  '/use-cases/[slug]': 60_000,
  '/_not-found': 20_000,
  '/about': 20_000,
  '/for-manufacturers': 20_000,
  '/privacy': 20_000,
};

let failed = false;

const floor = sharedFloorChunks(stats);
const floorBytes = bytesOf(floor);
console.log(
  `[client-budget] shared floor: ${floorBytes}/${MAX_SHARED_FLOOR_BYTES} (${floor.size} chunks)`,
);
if (floorBytes > MAX_SHARED_FLOOR_BYTES) {
  console.error(
    `[client-budget] shared floor exceeds budget by ${floorBytes - MAX_SHARED_FLOOR_BYTES} bytes`,
  );
  failed = true;
}

for (const entry of stats) {
  const budget = ROUTE_SPECIFIC_BUDGETS[entry.route];

  /**
   * 予算表に無い route は緑にしない。
   * 「誰かが列挙を思い出した route だけ守られる」状態が、上の対象外4 route を生んだ。
   */
  if (budget === undefined) {
    console.error(
      `[client-budget] no budget declared for route: ${entry.route}. ` +
        'Add it to ROUTE_SPECIFIC_BUDGETS with the measured value * 1.15.',
    );
    failed = true;
    continue;
  }

  const own = bytesOf(entry.firstLoadChunkPaths.filter((chunk) => !floor.has(chunk)));
  console.log(`[client-budget] ${entry.route}: ${own}/${budget}`);
  if (own > budget) {
    console.error(
      `[client-budget] ${entry.route} exceeds budget by ${own - budget} bytes`,
    );
    failed = true;
  }
}

for (const route of Object.keys(ROUTE_SPECIFIC_BUDGETS)) {
  if (!stats.some((entry) => entry.route === route)) {
    console.error(`[client-budget] missing route: ${route}`);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
