// ロボットDB原本（Google Sheets の HTML 書き出し）→ 正規化JSON。
// 設計・母集団の定義: docs/plans/robot-data-import-plan-v1.md §1〜§2
//
// CSV書き出しを使わないのは、セルのハイパーリンクが落ちて出典URLが消えるため（§1）。
// HTML なら `<a href>` として残る。
//
// 除外判定は **機種名セルの取り消し線のみ** で行う。メーカー名セルの取り消し線は使わない
// （§1.2: Sunday Robotics のメーカー名セルは記入ミスで、Memo は対象内）。

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/** 1セル。`strike` は取り消し線、`checked` はチェックボックスの状態 */
export interface Cell {
  text: string;
  url: string | null;
  strike: boolean;
  checked: boolean;
}

/** 発表済みロボットシートの1行 */
export interface RobotImportRow {
  maker: string;
  makerUrl: string | null;
  model: string;
  modelUrl: string | null;
  /** 機種名セルの取り消し線。true は対象外（§1.1） */
  strike: boolean;
  specs: Record<string, string>;
}

/** 列名をそのままキーにした1行。URL列はリンクが無ければ null */
export type SheetRecord = Record<string, string | boolean | null>;

/**
 * 原本の置き場。ブラウザは同名フォルダがあると「ロボDB 2」のように連番を付けるため、
 * パスを固定しない。`--source <dir>` か環境変数 `ROBOT_DB_DIR` で上書きできる。
 */
const DEFAULT_SOURCE_DIR = path.join(os.homedir(), 'Downloads', 'ロボDB 2');

function resolveSourceDir(): string {
  const flag = process.argv.indexOf('--source');
  if (flag !== -1 && process.argv[flag + 1]) return process.argv[flag + 1];
  return process.env.ROBOT_DB_DIR ?? DEFAULT_SOURCE_DIR;
}

const SHEETS = {
  robots: '発表済みロボット.html',
  deployments: '導入事例＿世界地図用.html',
  manufacturers: '代理店とか.html',
};

/** 発表済みロボットシートの列位置（0 は行番号列、4 は非表示の空列）。§1 の実測に基づく */
const ROBOT_COLUMNS = {
  researchStatus: 1,
  maker: 2,
  model: 3,
  mobility: 5,
  dimensions: 6,
  weightKg: 7,
  speedMps: 8,
  dof: 9,
  payloadKg: 10,
  handType: 11,
  tactileSensor: 12,
  runtimeMin: 13,
  batteryCapacityMah: 14,
  chargeTimeMin: 15,
  batterySwapMethod: 16,
  controlMethod: 17,
  sdk: 18,
  computePlatform: 19,
};

/**
 * データ行の開始位置は行数で固定しない。項目名ヘッダのセル文言を目印に探す。
 * 行数固定にすると、原本に行が挿入されたときに黙って1行ずれる。
 */
const ROBOT_HEADER_ANCHOR = '設置・移動方式';

const ZERO_WIDTH = /[​-‍﻿]/g;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * `<style>` から `text-decoration:line-through` を含むクラス名を集める。
 * Google Sheets は取り消し線をインラインstyleではなくクラスで書き出す。
 */
function collectStrikeClasses(html: string): Set<string> {
  const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(html);
  if (!style) return new Set();

  const classes = new Set<string>();
  for (const rule of style[1].matchAll(/\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g)) {
    if (rule[2].includes('line-through')) classes.add(rule[1]);
  }
  return classes;
}

/**
 * HTML表を `Cell[][]` へ落とす。
 * `Cell = { text: string; url: string | null; strike: boolean }`
 */
export function parseSheet(html: string): Cell[][] {
  const strikeClasses = collectStrikeClasses(html);

  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) =>
    [...row[1].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map((cell) => {
      const classAttr = /class="([^"]*)"/.exec(cell[1]);
      const classNames = classAttr ? classAttr[1].split(/\s+/) : [];
      const href = /href="([^"]+)"/.exec(cell[2]);

      return {
        text: decodeEntities(cell[2].replace(/<[^>]+>/g, ''))
          .replace(ZERO_WIDTH, '')
          .trim(),
        url: href ? href[1] : null,
        strike: classNames.some((name) => strikeClasses.has(name)),
        // チェックボックスは <svg><use href="#checked-checkbox-id"> で書き出され、
        // タグを剥がすと text が空になる。真偽をここで拾っておく。
        checked: cell[2].includes('#checked-checkbox-id'),
      };
    }),
  );
}

/**
 * 発表済みロボットシート → 行の配列。
 * メーカー名は各グループの先頭行にしか無いので前方補完する。
 * `strike` は **機種名セルのみ** から取る（§1.2）。
 */
export function parseRobotSheet(html: string): RobotImportRow[] {
  const rows = parseSheet(html);

  const anchorIndex = rows.findIndex((cells) =>
    cells.some((cell) => cell.text === ROBOT_HEADER_ANCHOR),
  );
  const dataRows = anchorIndex === -1 ? rows : rows.slice(anchorIndex + 1);

  const records: RobotImportRow[] = [];
  let currentMaker: Cell | null = null;

  for (const cells of dataRows) {
    const maker = cells[ROBOT_COLUMNS.maker];
    const model = cells[ROBOT_COLUMNS.model];
    if (!maker || !model) continue;

    if (maker.text) currentMaker = maker;
    if (!model.text || !currentMaker) continue;

    const specs: Record<string, string> = {};
    for (const [key, index] of Object.entries(ROBOT_COLUMNS)) {
      if (key === 'maker' || key === 'model' || key === 'researchStatus') continue;
      const cell = cells[index];
      if (cell?.text) specs[key] = cell.text;
    }

    records.push({
      maker: currentMaker.text,
      makerUrl: currentMaker.url,
      model: model.text,
      modelUrl: model.url,
      strike: model.strike,
      specs,
    });
  }

  return records;
}

/** 行番号列と空列を落とし、ヘッダ行を除いた「値のある行」だけを返す汎用版 */
function parseGenericSheet(
  html: string,
  { headerRows, expectedCells }: { headerRows: number; expectedCells: number },
): Cell[][] {
  return parseSheet(html)
    .slice(headerRows)
    .filter((cells) => cells.length === expectedCells);
}

/**
 * 導入事例シートは列名が Deploid のスキーマとほぼ一致している（§1）。
 * ヘッダ行を内容で探し、その列名をそのままキーにする。
 */
export function parseDeploymentSheet(html: string): SheetRecord[] {
  const rows = parseSheet(html);

  const headerIndex = rows.findIndex((cells) => cells.some((cell) => cell.text === 'manufacturerId'));
  if (headerIndex === -1) return [];

  const header = rows[headerIndex].map((cell) => cell.text);
  const idColumn = header.indexOf('id');

  return rows
    .slice(headerIndex + 1)
    .filter((cells) => cells.length === header.length && cells[idColumn]?.text)
    .map((cells) => {
      const record: SheetRecord = {};
      header.forEach((key, index) => {
        if (!key) return;
        const cell = cells[index];
        if (!cell) return;
        record[key] = key === 'importReady' ? cell.checked : cell.text;
      });
      return record;
    });
}

export function parseManufacturerSheet(html: string): SheetRecord[] {
  const COLUMNS = {
    maker: 2,
    provider: 4,
    japanStatus: 5,
    providerType: 6,
    acquisition: 7,
    models: 8,
    contact: 9,
    source: 10,
    checkedAt: 11,
  };

  return parseGenericSheet(html, { headerRows: 4, expectedCells: 12 })
    .filter((cells) => cells[COLUMNS.maker].text)
    .map((cells) => {
      const record: SheetRecord = {};
      for (const [key, index] of Object.entries(COLUMNS)) {
        const cell = cells[index];
        record[key] = cell.text;
        if (key === 'contact' || key === 'source') record[`${key}Url`] = cell.url;
      }
      return record;
    });
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function read(sheet: keyof typeof SHEETS): string {
  const file = path.join(resolveSourceDir(), SHEETS[sheet]);
  if (!fs.existsSync(file)) {
    throw new Error(
      `原本が見つかりません: ${file}\n` +
        '`--source <dir>` か環境変数 ROBOT_DB_DIR で原本の置き場を指定してください。',
    );
  }
  return fs.readFileSync(file, 'utf8');
}

function buildAll() {
  const robots = parseRobotSheet(read('robots'));
  const manufacturers = parseManufacturerSheet(read('manufacturers'));
  const deployments = parseDeploymentSheet(read('deployments'));
  return { robots, manufacturers, deployments };
}

function printStats({ robots, manufacturers, deployments }: ReturnType<typeof buildAll>): void {
  const struck = robots.filter((row) => row.strike).length;
  const makers = new Set(robots.map((row) => row.maker)).size;

  console.log(`発表済みロボット ${robots.length}行 / 機種名セル取り消し線${struck} / メーカー${makers}`);
  console.log(`導入事例 ${deployments.length}行`);
  console.log(`代理店 ${manufacturers.length}行`);
}

function writeJson(outDir: string, data: ReturnType<typeof buildAll>): void {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, records] of Object.entries(data)) {
    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    console.log(`${file}: ${records.length} 件`);
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const data = buildAll();
  const outIndex = process.argv.indexOf('--out');

  if (outIndex !== -1) writeJson(process.argv[outIndex + 1], data);
  else printStats(data);
}
