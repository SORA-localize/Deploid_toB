import type { Robot, RobotLoadRating, RobotSpecs } from '@/data/types';
import {
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  robotLoadRatingLabels,
  robotLoadScopeLabels,
  EMPTY_VALUE_LABEL,
} from '@/lib/labels';
import { getSpecEntry, specSchema, type SpecKey } from '@/lib/specSchema';
import { uiText } from '@/lib/uiText';

export interface DisplayRow {
  label: string;
  value: string;
}

export type ComparisonValueKind = 'number' | 'text' | 'empty';

export interface ComparisonDisplayRow extends DisplayRow {
  valueKind: ComparisonValueKind;
}

export interface ComparisonSpecGroup {
  heading: string;
  rows: ComparisonDisplayRow[];
}

export function formatNumber(value: number | undefined, unit = '') {
  return value != null ? `${value}${unit}` : EMPTY_VALUE_LABEL;
}

export function formatRuntime(value: number | undefined) {
  return value != null ? `約${value}分` : EMPTY_VALUE_LABEL;
}

/**
 * 「寸法」（身長×幅×奥行き）の正本。詳細ページの本体・可動タブ、サイドバー基本スペック、
 * 比較ページ詳細データが共通で呼ぶ。値の組み立てをここ1箇所にまとめ、個別に heightCm 等を
 * 再計算する箇所を増やさない。
 */
export function getRobotDimensionsSummary(robot: Robot): { value: string; hasData: boolean; sourceUrls?: string[] } {
  const { heightCm, widthCm, depthCm } = robot.specs;
  const parts = [heightCm, widthCm, depthCm].filter((v): v is number => v != null);
  if (parts.length === 0) {
    return { value: EMPTY_VALUE_LABEL, hasData: false };
  }
  return {
    value: `${parts.join('×')} cm`,
    hasData: true,
    sourceUrls: robot.fieldEvidence?.heightCm ?? robot.fieldEvidence?.widthCm ?? robot.fieldEvidence?.depthCm,
  };
}

/** 関連欄での表示名。archived は「提供終了」を付けて状態を明示する（無言脱落させない。設計 §6.5-1） */
export function getRobotRelatedTitle(robot: Robot): string {
  const base = robot.nameJa ?? robot.name;
  return robot.publishStatus === 'archived' ? `${base}（提供終了）` : base;
}

/** specSchema の kind/unit に従ってスペック値を整形する（未設定は「—」） */
export function formatSpecValue(specs: RobotSpecs, key: SpecKey): string {
  const entry = getSpecEntry(key);
  const raw = specs[key];
  if (raw == null || raw === '') return EMPTY_VALUE_LABEL;
  switch (entry.kind) {
    case 'mobility':
      return mobilityLabels[raw as NonNullable<RobotSpecs['mobility']>];
    case 'runtime':
      return formatRuntime(raw as number);
    case 'text':
      return String(raw);
    default:
      return `${raw}${entry.unit}`;
  }
}

/** specSchema 駆動のスペック行。項目の追加・並び・ラベルは specSchema 側で管理する */
export function getSpecRows(specs: RobotSpecs, keys?: readonly SpecKey[]): DisplayRow[] {
  const entries = keys ? keys.map((key) => getSpecEntry(key)) : specSchema;
  return entries.map((entry) => ({
    label: entry.label,
    value: formatSpecValue(specs, entry.key),
  }));
}

function formatComparisonPriceStatus(robot: Robot) {
  if (robot.procurementModels.includes('not-for-sale')) return '一般販売なし';
  return (robot.priceOffers?.length ?? 0) > 0 ? '公開価格あり' : '問い合わせ';
}

function formatLoadKg(kg: number) {
  const displayValue = Number.isInteger(kg) ? kg : Math.round(kg * 10) / 10;
  return `${displayValue}kg`;
}

function formatLoadVariant(variant: string) {
  const dofArms = variant.match(/(\d+)\s*DoF\s*arms?/i);
  return dofArms ? `${dofArms[1]}DoF腕` : variant;
}

function formatLoadCondition(condition?: string) {
  if (!condition) return undefined;
  if (/Sustained weight capacity|持続/i.test(condition)) return '持続';
  if (/Instant weight capacity|瞬間/i.test(condition)) return '瞬間';
  if (/特定姿勢/.test(condition)) return '特定姿勢';
  if (/全作業域/.test(condition)) return '全作業域';
  return undefined;
}

function formatLoadScope(load: RobotLoadRating) {
  if (load.scope === 'carrier') return '運搬';
  return load.scope === 'manufacturer-wording'
    ? undefined
    : robotLoadScopeLabels[load.scope];
}

function formatLoadRatingKind(load: RobotLoadRating) {
  return load.rating === 'unspecified'
    ? undefined
    : robotLoadRatingLabels[load.rating];
}

function formatSingleLoadRating(load: RobotLoadRating) {
  return [
    formatLoadCondition(load.condition),
    formatLoadScope(load),
    formatLoadRatingKind(load),
    formatLoadKg(load.kg),
  ].filter(Boolean).join('');
}

function formatPublishedLoadRange(load: RobotLoadRating) {
  const range = load.condition?.match(/約?\s*(\d+(?:\.\d+)?)\s*[～〜]\s*(\d+(?:\.\d+)?)\s*kg/i);
  return range ? `約${range[1]}〜${range[2]}kg` : undefined;
}

function formatLoadGroup(
  loads: readonly RobotLoadRating[],
  separator = ' / ',
) {
  if (loads.length === 1) {
    const publishedRange = formatPublishedLoadRange(loads[0]);
    if (publishedRange) return publishedRange;
  }

  const scopes = new Set(loads.map((load) => load.scope));
  const ratings = new Set(loads.map((load) => load.rating));
  const hasRangeBounds = loads.length === 2
    && scopes.size === 1
    && ratings.size === 1
    && loads.some((load) => /下限/.test(load.condition ?? ''))
    && loads.some((load) => /上限/.test(load.condition ?? ''));

  if (hasRangeBounds) {
    const [minimum, maximum] = [...loads].sort((a, b) => a.kg - b.kg);
    return [
      formatLoadScope(minimum),
      formatLoadRatingKind(minimum),
      `${formatLoadKg(minimum.kg).replace(/kg$/, '')}〜${formatLoadKg(maximum.kg)}`,
    ].filter(Boolean).join('');
  }

  const allSameScope = scopes.size === 1;
  const allHaveDistinctConditions = loads.length > 1
    && loads.every((load) => formatLoadCondition(load.condition));

  if (allSameScope && !allHaveDistinctConditions) {
    const [first] = loads;
    const sortedLoads = [...loads].sort((a, b) => {
      const ratingPriority = { rated: 0, maximum: 1, unspecified: 2 } as const;
      return ratingPriority[a.rating] - ratingPriority[b.rating];
    });
    const values = sortedLoads.map((load) => [
      formatLoadRatingKind(load),
      formatLoadKg(load.kg),
    ].filter(Boolean).join(''));
    const scope = formatLoadScope(first);
    return `${scope ? `${scope}${loads.length > 1 ? '：' : ''}` : ''}${values.join(separator)}`;
  }

  return loads.map(formatSingleLoadRating).join(separator);
}

/** 可搬重量の生値整形。詳細ページの本体・可動タブと比較ドロワーの基本スペックが共通で呼ぶ */
export function formatRobotLoadRatings(loads: readonly RobotLoadRating[]) {
  const groups = new Map<string, RobotLoadRating[]>();
  loads.forEach((load) => {
    const key = load.variant ?? '';
    const group = groups.get(key) ?? [];
    group.push(load);
    groups.set(key, group);
  });

  const showVariants = groups.size > 1;
  return [...groups.entries()].map(([variant, group]) => {
    const value = formatLoadGroup(group, showVariants ? '・' : ' / ');
    return showVariants && variant
      ? `${formatLoadVariant(variant)}：${value}`
      : value;
  }).join(' / ');
}

export function getComparisonCoreRows(robot: Robot): ComparisonDisplayRow[] {
  const { specs } = robot;
  const hasLoadRatings = (robot.loadRatings?.length ?? 0) > 0;
  const runtime = formatRuntime(specs.runtimeMin);

  return [
    { label: uiText.compare.price, value: formatComparisonPriceStatus(robot), valueKind: 'text' },
    { label: uiText.comparison.japanSupport, value: japanAvailabilityLabels[robot.japanAvailability], valueKind: 'text' },
    { label: uiText.compare.deploymentStage, value: deploymentStageLabels[robot.deploymentStage], valueKind: 'text' },
    {
      label: '可搬重量',
      value: hasLoadRatings ? formatRobotLoadRatings(robot.loadRatings!) : EMPTY_VALUE_LABEL,
      valueKind: hasLoadRatings ? 'number' : 'empty',
    },
    {
      label: '稼働時間',
      value: runtime,
      valueKind: runtime === EMPTY_VALUE_LABEL ? 'empty' : 'number',
    },
  ];
}

export function getComparisonDetailRows(robot: Robot): ComparisonDisplayRow[] {
  const { specs } = robot;

  // 寸法（身長×幅×奥行き）は detail ページ・サイドバーと同じ正本（本ファイルの getRobotDimensionsSummary）を使う
  const dimensions = getRobotDimensionsSummary(robot);
  const weight = formatNumber(specs.weightKg, 'kg');

  return [
    {
      label: uiText.comparison.dimensions,
      value: dimensions.value,
      valueKind: dimensions.hasData ? 'number' : 'empty',
    },
    {
      label: '重量',
      value: weight,
      valueKind: weight === EMPTY_VALUE_LABEL ? 'empty' : 'number',
    },
    // 項目の選抜は比較UIの編集判断、ラベル・整形は specSchema 準拠
    ...getSpecRows(specs, ['dof', 'mobility']).map((row, index) => ({
      ...row,
      valueKind: row.value === EMPTY_VALUE_LABEL
        ? 'empty' as const
        : index === 0
          ? 'number' as const
          : 'text' as const,
    })),
  ];
}

export function getComparisonSpecGroups(robot: Robot): ComparisonSpecGroup[] {
  return [
    { heading: uiText.comparison.coreVariables, rows: getComparisonCoreRows(robot) },
    { heading: uiText.comparison.detailedData, rows: getComparisonDetailRows(robot) },
  ];
}
