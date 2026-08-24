// 原本HTML（data/import/*.json）と data/*.ts の突合レポート。
// 計画 §3 の表を機械で再生成する: docs/plans/robot-data-import-plan-v1.md
//
// 目的は「今どれだけズレているか」を毎回手で数えないこと。原本が更新されたら
// まず `npm run parse:robot-db -- --out data/import` を回し、次にこれを回す。
//
// 期待値は計画 §3 / §3.0 / §3.0.1 に書いてある。**数字が合わない場合、計画を直す前に
// 正規化規則の取りこぼしを疑うこと**（表記ゆれが既知: MenteeBot V3 / GALBOT S1 / GR-3(Meow-bot)）。

import fs from 'node:fs';
import path from 'node:path';
import { localContentSnapshot } from '../lib/data/localContentSnapshot.ts';

const IMPORT_DIR = 'data/import';

function readImport(name) {
  const file = path.join(IMPORT_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `${file} がありません。先に \`npm run parse:robot-db -- --out ${IMPORT_DIR}\` を実行してください。`,
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** NFKC → 括弧内除去 → 英数小文字化。表記ゆれを吸収する */
function normalize(value) {
  return value
    .normalize('NFKC')
    .replace(/[（(][^)）]*[)）]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * `model` が `family` の variant かどうかを、語境界つきで判定する。
 *
 * 境界文字は空白・括弧の開き・ハイフンのいずれか（`A2-W` のような正当なハイフン付き
 * variant を持つため、ハイフンを境界から除外できない）。
 */
function hasBoundaryAfter(model, family) {
  if (model === family) return false;
  if (!model.startsWith(family)) return false;
  const boundary = model.slice(family.length, family.length + 1);
  return boundary === '' || boundary === ' ' || boundary === '　' || boundary === '(' || boundary === '（' || boundary === '-';
}

/**
 * `model` の所属ファミリを、候補一覧から**最長一致**で1つに決める。
 *
 * 2つのバグを踏まえた実装（2026-08-09、再監査で発見）。
 *
 * 1. **`normalize()` は括弧の中身を丸ごと消す。** `Apollo 2（Biped）` を normalize すると
 *    ファミリ名 `Apollo 2` の normalize 結果と完全一致し、「ファミリ名そのもの」として
 *    誤って除外される。→ 判定は normalize する前の生の文字列に対して行う。
 * 2. **境界文字にハイフンを含めると、`G1` が `G1-D Standard` にも一致してしまう**
 *    （`H2`/`H2-D`、`KUAVO 5`/`KUAVO 5-W` も同型）。一方ハイフンを境界から外すと、
 *    正当なハイフン付き variant（`A2-W`）まで弾かれる。
 *    → **同じメーカーの全候補ファミリの中で、一致した文字数が最長のものを採用する。**
 *      `G1-D Standard` は `G1`（2文字）と `G1-D`（4文字）の両方に一致しうるが、
 *      長い方の `G1-D` を採用すれば `G1` 側には残らない。`A2-W` は `A2` にしか
 *      一致しないので、そのまま `A2` の variant になる。
 */
function isVariantOf(model, family, allFamiliesSameMaker) {
  if (!hasBoundaryAfter(model, family)) return false;
  const longestMatch = allFamiliesSameMaker
    .filter((candidate) => hasBoundaryAfter(model, candidate))
    .reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), '');
  return longestMatch === family;
}

function section(title) {
  console.log(`\n${'─'.repeat(72)}\n${title}\n${'─'.repeat(72)}`);
}

function checkExpectation(label, actual, expected) {
  const ok = actual === expected;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}（期待 ${expected}）`);
  return ok;
}

const importedRobots = readImport('robots');
const importedManufacturers = readImport('manufacturers');
const { robots, manufacturers, useCases, articles } = localContentSnapshot;

// ── 母集団 ───────────────────────────────────────────────────────────────────

// 対象外はすべて原本側の取り消し線で表現されている（AELOS もシートで対象外になった）。
// コード側に除外リストを持たない — 二重管理になり、原本を直しても反映されなくなる。
const excluded = importedRobots.filter((row) => row.strike);
const live = importedRobots.filter((row) => !row.strike);

section('母集団（計画 §2）');
let allOk = true;
allOk = checkExpectation('原本の行数', importedRobots.length, 197) && allOk;
allOk = checkExpectation('機種名セルの取り消し線', excluded.length, 20) && allOk;
allOk = checkExpectation('対象', live.length, 177) && allOk;
allOk = checkExpectation('対象内メーカー', new Set(live.map((r) => r.maker)).size, 57) && allOk;

// §1.2: 取り消し線はヒューリスティックで、実際に1件誤りがあった。人が目を通す。
section('除外した行（人が確認すること。計画 §1.2）');
for (const row of excluded) {
  console.log(`  ${row.maker.padEnd(22)} ${row.model}`);
}

// ── メーカーの突合 ───────────────────────────────────────────────────────────

const manufacturerByName = new Map(manufacturers.map((m) => [normalize(m.name), m]));
const sheetMakers = new Set(importedManufacturers.map((m) => normalize(m.maker)));
const liveMakers = new Set(live.map((r) => normalize(r.maker)));

section('メーカー（計画 §3.0.1）');
allOk = checkExpectation('代理店シートの行', importedManufacturers.length, 57) && allOk;
allOk = checkExpectation('現行 data/manufacturers.ts', manufacturers.length, 26) && allOk;

// この包含関係が Task 12 の G5 安全性の根拠。崩れたら dangling manufacturerId が出る。
const notInAgencySheet = [...liveMakers].filter((name) => !sheetMakers.has(name));
const identical = notInAgencySheet.length === 0 && sheetMakers.size === liveMakers.size;
console.log(`  ${identical ? '✓' : '✗'} ロボットシート57社と代理店シート57社が同一集合`);
if (notInAgencySheet.length > 0) {
  console.log(`     代理店シートに無い: ${notInAgencySheet.join(', ')}`);
  allOk = false;
}

const existingInSheet = manufacturers.filter((m) => sheetMakers.has(normalize(m.name)));
allOk = checkExpectation('現行26社のうち代理店シートにある', existingInSheet.length, 24) && allOk;
const onlyInDeploid = manufacturers.filter((m) => !sheetMakers.has(normalize(m.name)));
console.log(`     代理店シートに無い現行メーカー: ${onlyInDeploid.map((m) => m.id).join(', ')}`);
allOk = checkExpectation('完了時のメーカー数', manufacturers.length + (sheetMakers.size - existingInSheet.length), 59) && allOk;

// ── ロボットの突合 ───────────────────────────────────────────────────────────

const robotsByManufacturer = new Map();
for (const robot of robots) {
  const list = robotsByManufacturer.get(robot.manufacturerId) ?? [];
  list.push(robot);
  robotsByManufacturer.set(robot.manufacturerId, list);
}

const matchedRows = [];
const additions = [];
const unmatchedMakers = new Set();

for (const row of live) {
  const manufacturer = manufacturerByName.get(normalize(row.maker));
  if (!manufacturer) {
    unmatchedMakers.add(row.maker);
    additions.push({ ...row, reason: '新メーカー' });
    continue;
  }

  const candidates = robotsByManufacturer.get(manufacturer.id) ?? [];
  const hit = candidates.find((robot) => normalize(robot.name) === normalize(row.model));

  if (hit) matchedRows.push({ row, robot: hit });
  else additions.push({ ...row, reason: '新機種' });
}

const matchedIds = new Set(matchedRows.map((m) => m.robot.id));
const orphans = robots.filter((robot) => !matchedIds.has(robot.id));

// ── シリーズ manifest（DEC-S08）────────────────────────────────────────────────
//
// 「A群15件」と「素の名前の親レコード7件」は別の走査で作られており一致しない。
// 件数（Task 7の改名吸収3件を含む188）と参照移行はこの manifest が確定するまで決められない。
// 手で数えずここで出す。
section('シリーズ manifest（DEC-S08。移管元と参照を確定させる）');

// ファミリ名だけでは一意に決まらない。'R1' は Unitree と Galaxea の両方に存在し、
// メーカーを付けないと unitree-r1-standard へ誤マッチする。必ず [maker, family] で持つ。
// 「ファミリ名が機種として存在しない」の網羅は、接頭辞strip（fam()）による自動グルーピングと、
// 現行orphanとの前方一致検出の**両方**を突き合わせて確定した（2026-08-09）。
// 前者は末尾が既知の語（EDU/Basic/Standard等）でない構成名（例: Walker Tienkung TK2301）を
// 別ファミリと誤認するため、単独では信頼できない。Walker Tienkung はこの理由で最初の
// 手動リストから漏れていた実例。
const SERIES_FAMILIES_A = [
  ['Booster Robotics', 'T1'],
  ['Booster Robotics', 'K1'],
  ['Booster Robotics', 'T2'],
  ['EngineAI', 'T800'],
  ['EngineAI', 'PM01'],
  ['Unitree Robotics', 'G1-D'],
  ['Unitree Robotics', 'H2-D'],
  ['UBTECH Robotics', 'Walker Tienkung'],
  ['AgiBot', 'A2'],
  ['NEURA Robotics', '4NE1'],
  ['Leju Robotics', 'KUAVO 4PRO'],
  ['Leju Robotics', 'KUAVO 5'],
  ['LimX Dynamics', 'Oli'],
  ['Noetix Robotics', 'Bumi'],
  ['Galaxea Dynamics', 'R1'],
];

const seriesRows = [];
const seriesRowsB = [];
// 同じメーカーが複数ファミリを持つ場合の最長一致判定に使う（A群・B群を横断）。
// B群: ファミリ名が機種としても存在する。参照は既に正しく表示されるため移管しない。
// 3段カスケードUI（別計画）の下地として series レコードだけ作る。
const SERIES_FAMILIES_B = [
  ['Unitree Robotics', 'G1'],
  ['Unitree Robotics', 'H2'],
  ['Unitree Robotics', 'R1'],
  ['Apptronik', 'Apollo 2'],
  ['AgiBot', 'X2'],
  ['UBTECH Robotics', 'Walker S'],
  ['Fourier Intelligence', 'GR-3C'],
  ['Leju Robotics', 'KUAVO 5-W'],
  ['PAL Robotics', 'TIAGo'],
  ['Deep Robotics', 'DR02'],
  ['MagicLab', 'Z1'],
  ['Noetix Robotics', 'N2'],
  ['Noetix Robotics', 'E1'],
  ['Humanoid', 'HMND 01 ALPHA'],
];

const familiesByMaker = new Map();
for (const [maker, family] of [...SERIES_FAMILIES_A, ...SERIES_FAMILIES_B]) {
  const list = familiesByMaker.get(maker) ?? [];
  list.push(family);
  familiesByMaker.set(maker, list);
}

for (const [maker, family] of SERIES_FAMILIES_A) {
  const candidates = familiesByMaker.get(maker) ?? [family];
  const variants = live.filter((row) => row.maker === maker && isVariantOf(row.model, family, candidates));
  const owner = manufacturers.find((m) => normalize(m.name) === normalize(maker));
  const existing = owner
    ? robots.find(
        (robot) => robot.manufacturerId === owner.id && normalize(robot.name) === normalize(family),
      )
    : undefined;

  seriesRows.push({ family, maker, existing, variants: variants.length, variantRows: variants });
}

const transferable = seriesRows.filter((row) => row.existing);
for (const [maker, family] of SERIES_FAMILIES_B) {
  const candidates = familiesByMaker.get(maker) ?? [family];
  const variants = live.filter((row) => row.maker === maker && isVariantOf(row.model, family, candidates));
  seriesRowsB.push({ family, maker, variants: variants.length, variantRows: variants });
}

for (const row of seriesRows) {
  const from = row.existing ? `移管 ← ${row.existing.id}（${row.existing.publishStatus}）` : '新規作成';
  console.log(`  [A] ${row.maker.padEnd(20)} ${row.family.padEnd(16)} ${String(row.variants).padStart(2)}構成  ${from}`);
}
for (const row of seriesRowsB) {
  console.log(`  [B] ${row.maker.padEnd(20)} ${row.family.padEnd(16)} ${String(row.variants).padStart(2)}構成  新規作成（参照は移さない）`);
}
const transferableCount = transferable.length;
console.log(`\n  A群 ${seriesRows.length} 件（移管 ${transferable.length} / 新規 ${seriesRows.length - transferable.length}） + B群 ${seriesRowsB.length} 件（すべて新規） = シリーズ計 ${seriesRows.length + seriesRowsB.length} 件`);

// 総数29だけでは、あるSeriesの構成を別Seriesへ誤所属させても検知できない。
// maker + familyごとの実測件数と、同じ行の重複所属が無いことも固定する。
const EXPECTED_SERIES_VARIANT_COUNTS = new Map([
  ['Booster Robotics\u0000T1', 3],
  ['Booster Robotics\u0000K1', 3],
  ['Booster Robotics\u0000T2', 3],
  ['EngineAI\u0000T800', 4],
  ['EngineAI\u0000PM01', 2],
  ['Unitree Robotics\u0000G1-D', 2],
  ['Unitree Robotics\u0000H2-D', 2],
  ['UBTECH Robotics\u0000Walker Tienkung', 3],
  ['AgiBot\u0000A2', 3],
  ['NEURA Robotics\u00004NE1', 3],
  ['Leju Robotics\u0000KUAVO 4PRO', 7],
  ['Leju Robotics\u0000KUAVO 5', 5],
  ['LimX Dynamics\u0000Oli', 3],
  ['Noetix Robotics\u0000Bumi', 3],
  ['Galaxea Dynamics\u0000R1', 2],
  ['Unitree Robotics\u0000G1', 2],
  ['Unitree Robotics\u0000H2', 2],
  ['Unitree Robotics\u0000R1', 6],
  ['Apptronik\u0000Apollo 2', 2],
  ['AgiBot\u0000X2', 1],
  ['UBTECH Robotics\u0000Walker S', 1],
  ['Fourier Intelligence\u0000GR-3C', 2],
  ['Leju Robotics\u0000KUAVO 5-W', 2],
  ['PAL Robotics\u0000TIAGo', 2],
  ['Deep Robotics\u0000DR02', 1],
  ['MagicLab\u0000Z1', 1],
  ['Noetix Robotics\u0000N2', 1],
  ['Noetix Robotics\u0000E1', 1],
  ['Humanoid\u0000HMND 01 ALPHA', 2],
]);
const allSeriesRows = [...seriesRows, ...seriesRowsB];
const seriesCountMismatches = allSeriesRows.filter(
  (row) => EXPECTED_SERIES_VARIANT_COUNTS.get(`${row.maker}\u0000${row.family}`) !== row.variants,
);
const membershipsByInputRow = new Map();
for (const series of allSeriesRows) {
  for (const variant of series.variantRows) {
    const key = `${variant.maker}\u0000${variant.model}`;
    const memberships = membershipsByInputRow.get(key) ?? [];
    memberships.push(`${series.maker}/${series.family}`);
    membershipsByInputRow.set(key, memberships);
  }
}
const duplicateSeriesMemberships = [...membershipsByInputRow.values()].filter((memberships) => memberships.length > 1);

// この3件は Task 7 が既存recordの改名で吸収するため、Task 9のcreate件数から引く。
// family境界推定へ混ぜると Kaleido→Kaleido9 の数字境界や 4NE1/4NE1 Mini の最長一致で
// 消えるため、期待する後継名を明示する。
const RENAMED_BY_TASK_7 = new Map([
  ['mentee-menteebotv3', 'MenteeBot V3'],
  ['kawasaki-kaleido', 'Kaleido9'],
  ['neura-4ne-1', '4NE1 Gen 3.5'],
]);
const renamedParents = orphans.flatMap((robot) => {
  const expectedModel = RENAMED_BY_TASK_7.get(robot.id);
  if (!expectedModel) return [];
  const makerName = manufacturers.find((m) => m.id === robot.manufacturerId)?.name ?? '';
  const variant = additions.find(
    (row) => normalize(row.maker) === normalize(makerName) && normalize(row.model) === normalize(expectedModel),
  );
  return variant ? [{ robot, variants: [variant] }] : [];
});
const task9CreateCount = additions.length - renamedParents.length;

// 移管対象を指している他コレクションの参照。ここが0にならないと Robot を消せない。
const transferIds = new Set(transferable.map((row) => row.existing.id));
const inbound = [];
for (const useCase of useCases) {
  for (const candidate of useCase.candidateRobots ?? []) {
    if (transferIds.has(candidate.robotId)) inbound.push(`useCase ${useCase.slug}.candidateRobots -> ${candidate.robotId}`);
  }
}
for (const article of articles) {
  for (const id of article.relatedRobotIds ?? []) {
    if (transferIds.has(id)) inbound.push(`article ${article.slug}.relatedRobotIds -> ${id}`);
  }
}
for (const robot of robots) {
  if (robot.supersededById && transferIds.has(robot.supersededById)) {
    inbound.push(`robot ${robot.id}.supersededById -> ${robot.supersededById}`);
  }
}
// メーカー解説記事の ManufacturerGuideContent.lineup は relatedRobotIds とは別のフィールド。
// article.relatedRobotIds の走査だけでは見えない（agibot-manufacturer-guide で実際に漏れていた）。
for (const article of articles) {
  for (const row of article.manufacturerGuideContent?.lineup ?? []) {
    if (transferIds.has(row.robotId)) inbound.push(`article ${article.slug}.manufacturerGuideContent.lineup -> ${row.robotId}`);
  }
}

const inboundCount = inbound.length;
console.log(`\n  移管対象IDを指す参照: ${inbound.length} 件（すべて移行先を決めるまで Robot を消せない）`);
for (const line of inbound) console.log(`     ${line}`);

console.log(`\n  完了時 robots = ${robots.length} − 移管${transferable.length} + 分割1 + Task 9 create(${additions.length}−改名吸収${renamedParents.length}) = ${robots.length - transferable.length + 1 + task9CreateCount}`);


section('ロボット（計画 §3）');
allOk = checkExpectation('現行 data/robots.ts', robots.length, 63) && allOk;
allOk = checkExpectation('一致した行', matchedRows.length, 43) && allOk;
allOk = checkExpectation('一致した Deploid レコード', matchedIds.size, 42) && allOk;
allOk = checkExpectation('追加', additions.length, 134) && allOk;
allOk = checkExpectation('Deploid 側で一致しない', orphans.length, 21) && allOk;
// baseline追加候補134のうち3件はTask 7の既存record改名で吸収し、Task 9のcreateは131件。
allOk = checkExpectation('A群のうち移管', transferableCount, 7) && allOk;
allOk = checkExpectation('移管IDを指す参照', inboundCount, 20) && allOk;
allOk = checkExpectation('完了時のレコード数', robots.length - transferableCount + 1 + task9CreateCount, 188) && allOk;
allOk = checkExpectation('Seriesごとの構成件数不一致', seriesCountMismatches.length, 0) && allOk;
allOk = checkExpectation('Series構成の重複所属', duplicateSeriesMemberships.length, 0) && allOk;
allOk = checkExpectation('Seriesへ所属する原本行', membershipsByInputRow.size, 74) && allOk;

// 1レコードに複数行が当たる = variant 分割が要る（§3、apptronik-apollo-2 の Biped / Wheeled）
const rowsPerRecord = new Map();
for (const { row, robot } of matchedRows) {
  const list = rowsPerRecord.get(robot.id) ?? [];
  list.push(row.model);
  rowsPerRecord.set(robot.id, list);
}
const needsSplit = [...rowsPerRecord].filter(([, models]) => models.length > 1);
if (needsSplit.length > 0) {
  console.log('\n  1レコードに複数のシート行が対応（DEC-S01 により分割が要る）:');
  for (const [id, models] of needsSplit) console.log(`     ${id} ← ${models.join(' / ')}`);
}

// DEC-S08: シートに variant 行しか無いのに Deploid 側に素の名前の親レコードが残っていると、
// 投入後に親と子が並存する（/robots に「T1」と「T1 Basic」…が並ぶ）。投入前に判断が要る。
section("「素の名前」の親レコード（DEC-S08。variant 投入前に archived にする）");
const needsJudgement = transferable.map((series) => ({
  robot: series.existing,
  variants: series.variantRows,
}));

const parentsWithVariants = [...needsJudgement, ...renamedParents];

for (const { robot, variants } of parentsWithVariants) {
  const tag = RENAMED_BY_TASK_7.has(robot.id) ? '  ← Task 7 で改名（DEC-S08 の対象外）' : '';
  console.log(`  ${robot.id}「${robot.name}」 ${robot.publishStatus}${tag}`);
  for (const variant of variants) {
    console.log(`     + ${variant.model.padEnd(34)} ${variant.specs.mobility ?? '-'}`);
  }
}
console.log('');
allOk = checkExpectation('DEC-S08 の判断が要る親レコード', needsJudgement.length, 7) && allOk;
allOk = checkExpectation('Task 7 で改名する親レコード', renamedParents.length, 3) && allOk;
allOk = checkExpectation('シリーズ計（A+B）', seriesRows.length + seriesRowsB.length, 29) && allOk;

// DEC-S09: mobility は単一値なので、別カテゴリが1行に同居していると1つしか入らない。
section('複合的な移動方式（DEC-S09。hybrid として入れる）');
for (const row of live) {
  const mobility = row.specs.mobility ?? '';
  if (/[／/]/.test(mobility) && !/^車輪[（(]/.test(mobility)) {
    console.log(`  ${row.maker.padEnd(22)} ${row.model.padEnd(20)} ${mobility}`);
  }
}

section(`追加 ${additions.length} 件`);
const byReason = { 新メーカー: [], 新機種: [] };
for (const row of additions) byReason[row.reason].push(row);
console.log(`  新メーカー ${byReason.新メーカー.length} / 既存メーカーの新機種 ${byReason.新機種.length}`);
// 計画 §3.1 は「新機種37 + グレード違い31」に細分するが、その区別は人の判断（同一機の
// 構成違いか、別機種か）なので機械では出さない。合計だけが機械で照合できる。
console.log(`  （§3.1 はこの ${byReason.新機種.length} 件を「新機種37 + グレード違い31」に細分する。区別は人の判断）`);
console.log('\n  既存メーカーの新機種:');
for (const row of byReason.新機種) console.log(`     ${row.maker.padEnd(22)} ${row.model}`);

section(`Deploid 側で一致しない ${orphans.length} 件`);
for (const robot of orphans) {
  console.log(`  ${robot.id.padEnd(26)} ${(robot.name ?? '').padEnd(24)} ${robot.publishStatus}`);
}

section('判定');
console.log(allOk ? '  すべて計画 §3 の期待値と一致' : '  ✗ 期待値と一致しない項目がある');
if (!allOk) {
  console.log('  計画を直す前に、正規化規則の取りこぼしを疑うこと（表記ゆれが既知）。');
  process.exitCode = 1;
}
