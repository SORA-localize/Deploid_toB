import fs from 'node:fs';

const stats = JSON.parse(fs.readFileSync('.next/diagnostics/route-bundle-stats.json', 'utf8'));

/**
 * 共有フロア = **フロア算出対象の route に共通して現れる chunk** の集合。
 *
 * Phase 5 は `/privacy` の chunk 集合をフロアと定義していた。今日の実測では交差集合と完全に
 * 一致する（588,660 / 9 chunks、差 0）が、`/privacy` に route 固有の client code が1つでも
 * 入った瞬間、それが全 route から差し引かれて他 route の「固有」を過小評価する。
 * 基準を1 route の内容に依存させない。
 *
 * **フロア算出対象からは `/_not-found` と `/admin/**` を除く（Task 2、Payload統合）。**
 * `src/app` を `(frontend)` と `(payload)` の2つの独立 root layout へ分けた結果、両者は
 * chunkを一切共有しない別系統になった。Next.js が生成する汎用 `/_not-found`（どの route にも
 * 一致しない URL 用の fallback）も、単一 root layout が無くなったことで `(frontend)` の
 * layout chunk（Header/Footer/ThemeProviderなど、約35KB）を含まなくなった。
 *
 * この2つを交差集合の計算対象に含めたままにすると、frontend 14 route が実際には全員で
 * 共有している約35KBのchunkが「全routeには無い」という理由だけでフロアから落ち、frontend
 * 各routeの「route固有」サイズに一律で足されて二重計上される（実バイト数は変わらないのに
 * 帰属だけがズレる）。`/_not-found` と `/admin/**` はそれぞれ個別の budget row で従来通り
 * 検査される。フロアの「定義」から外すだけで、検査対象からは外さない。
 */
const FLOOR_BASIS_EXCLUDE_ROUTES = new Set(['/_not-found']);
const isFloorBasisRoute = (route) =>
  !FLOOR_BASIS_EXCLUDE_ROUTES.has(route) && !route.startsWith('/admin');

function sharedFloorChunks(entries) {
  let intersection = null;
  for (const entry of entries.filter((entry) => isFloorBasisRoute(entry.route))) {
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
 *   588,660  Phase 6 tip
 *   554,140  Phase 7 Task 3（root `<Toaster />` を `/compare` へ局所化、-34,520）
 * ドリフトは 3,000 bytes 未満（0.5%）なので、554,140 + 1.1% = 560,000 とする。
 *
 * framework 更新で当たることはある。それは誤爆ではない。全 route に数十KB乗る変更は
 * 意識して受け入れる判断であるべきで、黙って吸収されてよい変化ではない。当たったら
 * 実測し直して上げる。
 *
 * **フロアを削ったら、この値も下げること。** 改善のたびに余裕だけが増えると、
 * 監査が指摘した「落ちない gate」へ戻る。次に削れるのは Home 側 4 ファイルが使う
 * `motion/react`（積み残し登録簿 #3、#8 の実装方針と関係する）。
 */
const MAX_SHARED_FLOOR_BYTES = 560_000;

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
 *
 * `/compare` は Phase 7 Task 3 で 248,436 -> 282,765 へ増えた。これは劣化ではなく、
 * 全 route が負担していた sonner を toast を使う唯一の route へ移した結果で、フロアが
 * 同時に 34,520 減っている（サイト全体では純減）。実測 * 1.15 で 325,000 とする。
 *
 * `/admin/[[...segments]]` は Task 2（Payload統合）で新規追加。Payload純正の管理画面
 * バンドル（lexical richtext editor 含む）で、frontend側の budget とは無関係の別系統。
 * 実測 1,729,098 * 1.15 = 1,988,463 を 1,990,000 に切り上げ。frontend側のフロア・budgetは
 * この route が増減しても変わらない（上の `isFloorBasisRoute` でフロア計算から除外している）。
 */
const ROUTE_SPECIFIC_BUDGETS = {
  '/': 295_000,
  '/compare': 325_000,
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
  '/admin/[[...segments]]': 1_990_000,
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
