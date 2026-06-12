// スペック項目の正本（設計: data-architecture-redesign-v1 §8）。
// tagRegistry と同じ思想：項目の追加・改名・単位変更はこのファイル1箇所で行い、
// 型（RobotSpecs）・詳細スペック表・validate が自動追従する。
//
// 注意: lib/validate.ts 経由で Node が直接実行するため erasable syntax のみ
// （enum / namespace 禁止。runtime import は相対 .ts パスのみ）。
import type { MobilityType } from '../data/types.ts';

/** 詳細ページのスペック表のセクション分類（設計 §8-2） */
export type SpecGroup =
  | 'physical'
  | 'power'
  | 'mobility'
  | 'manipulation'
  | 'environment'
  | 'compliance'
  | 'integration';

/** 値の表示方法。number は `値+unit`、runtime は `約N分`、mobility は labels 経由、text はそのまま */
export type SpecValueKind = 'number' | 'runtime' | 'mobility' | 'text';

export interface SpecSchemaEntry {
  key: string;
  group: SpecGroup;
  label: string;
  /** 表示単位。値の直後に連結（例 ' cm'）。kind が number 以外では空にする */
  unit: string;
  kind: SpecValueKind;
}

// 並び順 = 詳細ページのスペック表の表示順。
// 項目追加はここに1行（値の裏取りは別途。未設定のロボットは「要確認」表示になる）。
export const specSchema = [
  { key: 'mobility',   group: 'mobility',    label: '移動方式', unit: '',      kind: 'mobility' },
  { key: 'heightCm',   group: 'physical',    label: '身長',     unit: ' cm',   kind: 'number' },
  { key: 'weightKg',   group: 'physical',    label: '重量',     unit: ' kg',   kind: 'number' },
  { key: 'payloadKg',  group: 'manipulation', label: 'ペイロード', unit: ' kg', kind: 'number' },
  { key: 'runtimeMin', group: 'power',       label: '稼働時間', unit: '',      kind: 'runtime' },
  { key: 'speedMps',   group: 'mobility',    label: '速度',     unit: ' m/s',  kind: 'number' },
  { key: 'dof',        group: 'mobility',    label: '自由度',   unit: ' DoF',  kind: 'number' },
  { key: 'ipRating',   group: 'environment', label: '防塵防水', unit: '',      kind: 'text' },
] as const satisfies readonly SpecSchemaEntry[];

export type SpecKey = (typeof specSchema)[number]['key'];

/** kind → 値の型。RobotSpecs（data/types.ts）はここから導出される */
interface SpecValueByKind {
  number: number;
  runtime: number;
  mobility: MobilityType;
  text: string;
}

export type SpecValueOf<K extends SpecKey> =
  SpecValueByKind[Extract<(typeof specSchema)[number], { key: K }>['kind']];

/** スペック値の型。値は各ロボットに個別、項目メタ（ラベル・単位）は本レジストリに共通（設計 §5） */
export type RobotSpecsFromSchema = { [K in SpecKey]?: SpecValueOf<K> };

const specKeySet = new Set<string>(specSchema.map((entry) => entry.key));

export function isSpecKey(key: string): key is SpecKey {
  return specKeySet.has(key);
}

export function getSpecEntry(key: SpecKey) {
  return specSchema.find((entry) => entry.key === key)!;
}

/** レジストリのラベルを単独参照したいUI向け（比較表など項目を選抜するサーフェス用） */
export function getSpecLabel(key: SpecKey): string {
  return getSpecEntry(key).label;
}
