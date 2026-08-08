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
// 「A群14件」と「素の名前の親レコード7件」は別の走査で作られており一致しない。
// 件数（191 か 192 か）と参照移行はこの manifest が確定するまで決められない。
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
for (const [maker, family] of SERIES_FAMILIES_A) {
  const variants = live.filter(
    (row) =>
      row.maker === maker &&
      normalize(row.model).startsWith(normalize(family)) &&
      normalize(row.model) !== normalize(family),
  );
  const owner = manufacturers.find((m) => normalize(m.name) === normalize(maker));
  const existing = owner
    ? robots.find(
        (robot) => robot.manufacturerId === owner.id && normalize(robot.name) === normalize(family),
      )
    : undefined;

  seriesRows.push({ family, maker, existing, variants: variants.length });
}

const transferable = seriesRows.filter((row) => row.existing);
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

for (const [maker, family] of SERIES_FAMILIES_B) {
  const variants = live.filter(
    (row) =>
      row.maker === maker &&
      normalize(row.model).startsWith(normalize(family)) &&
      normalize(row.model) !== normalize(family),
  );
  seriesRowsB.push({ family, maker, variants: variants.length });
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

console.log(`\n  完了時 robots = ${robots.length} − 移管${transferable.length} + 分割1 + 追加${additions.length} = ${robots.length - transferable.length + 1 + additions.length}`);


section('ロボット（計画 §3）');
allOk = checkExpectation('現行 data/robots.ts', robots.length, 63) && allOk;
allOk = checkExpectation('一致した行', matchedRows.length, 43) && allOk;
allOk = checkExpectation('一致した Deploid レコード', matchedIds.size, 42) && allOk;
allOk = checkExpectation('追加', additions.length, 134) && allOk;
allOk = checkExpectation('Deploid 側で一致しない', orphans.length, 21) && allOk;
// 移管分を引く。63 + 134 + 1 = 198 は誤り（Series へ移る6件を数え落とす）。
allOk = checkExpectation('A群のうち移管', transferableCount, 7) && allOk;
allOk = checkExpectation('移管IDを指す参照', inboundCount, 20) && allOk;
allOk = checkExpectation('完了時のレコード数', robots.length - transferableCount + 1 + additions.length, 191) && allOk;

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
const parentsWithVariants = orphans
  .map((robot) => ({
    robot,
    variants: additions.filter(
      (row) =>
        normalize(row.maker) ===
          normalize(manufacturers.find((m) => m.id === robot.manufacturerId)?.name ?? '') &&
        normalize(row.model).startsWith(normalize(robot.name ?? '')) &&
        normalize(row.model) !== normalize(robot.name ?? ''),
    ),
  }))
  .filter((entry) => entry.variants.length > 0);

// この3件は Task 9 が「改名」で解決する（計画 §3.2 の「名前ずれ＝更新」「世代更新」）。
// 素の名前が1つの後継名を指しているだけなので、DEC-S08 の3分岐にはかけない。
const RENAMED_BY_TASK_9 = new Set(['mentee-menteebotv3', 'kawasaki-kaleido', 'neura-4ne-1']);

const needsJudgement = parentsWithVariants.filter(({ robot }) => !RENAMED_BY_TASK_9.has(robot.id));

for (const { robot, variants } of parentsWithVariants) {
  const tag = RENAMED_BY_TASK_9.has(robot.id) ? '  ← Task 9 で改名（DEC-S08 の対象外）' : '';
  console.log(`  ${robot.id}「${robot.name}」 ${robot.publishStatus}${tag}`);
  for (const variant of variants) {
    console.log(`     + ${variant.model.padEnd(34)} ${variant.specs.mobility ?? '-'}`);
  }
}
console.log('');
allOk = checkExpectation('DEC-S08 の判断が要る親レコード', needsJudgement.length, 7) && allOk;
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
