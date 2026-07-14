import type { Manufacturer, Robot, RobotSpecs } from '@/data/types';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  marketAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
  EMPTY_VALUE_LABEL,
} from '@/lib/labels';
import { getSpecEntry, specSchema, type SpecKey } from '@/lib/specSchema';
import { getTagLabel } from '@/lib/tags';
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
  const note = robot.priceNote?.trim();
  const normalizedNote = note?.toLowerCase() ?? '';

  if (robot.procurementModels.includes('not-for-sale')) return '一般販売なし';
  if (!note) return EMPTY_VALUE_LABEL;
  if (/価格は?非公開|価格未公開|未公表|未発表|問い合わせ制|公開価格なし/.test(note)) {
    return '問い合わせ';
  }
  if (/[$＄€￥¥]|usd|eur|円|公開価格|参考価格|約\s*[0-9]/i.test(normalizedNote)) {
    return '公開価格あり';
  }
  if (/問い合わせ|要確認/.test(note)) return '問い合わせ';

  return EMPTY_VALUE_LABEL;
}

function formatComparisonPayloadStatus(value: number | undefined) {
  if (value == null) return EMPTY_VALUE_LABEL;
  if (value < 5) return '小型（5kg未満）';
  if (value < 15) return '標準（5〜15kg）';
  if (value < 30) return '高可搬（15〜30kg）';
  return '重量級（30kg以上）';
}

function formatComparisonRuntimeStatus(value: number | undefined) {
  if (value == null) return EMPTY_VALUE_LABEL;
  if (value < 90) return '短時間（90分未満）';
  if (value < 180) return '標準（90〜180分）';
  if (value < 360) return '長時間（3〜6時間）';
  return '超長時間（6時間以上）';
}

export function joinOrFallback(values: readonly string[]) {
  return values.length > 0 ? values.join(' / ') : EMPTY_VALUE_LABEL;
}

export function getRobotCardSpecRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;
  const size = specs.heightCm != null || specs.weightKg != null
    ? `${formatNumber(specs.heightCm, 'cm')} / ${formatNumber(specs.weightKg, 'kg')}`
    : EMPTY_VALUE_LABEL;
  const primaryIndustry = robot.industryTags?.[0]
    ? getTagLabel(robot.industryTags[0], 'industry')
    : EMPTY_VALUE_LABEL;

  return [
    { label: '国内', value: japanAvailabilityLabels[robot.japanAvailability] },
    { label: '段階', value: deploymentStageLabels[robot.deploymentStage] },
    { label: '用途', value: primaryIndustry },
    { label: 'サイズ', value: size },
    { label: '稼働', value: formatRuntime(specs.runtimeMin) },
    { label: '可搬', value: formatNumber(specs.payloadKg, 'kg') },
  ];
}

export function getRobotDetailSpecRows(robot: Robot, manufacturer?: Manufacturer): DisplayRow[] {
  // メーカー/カテゴリは関連参照、スペック行は specSchema が正本（並び順も schema 準拠）
  return [
    { label: 'メーカー', value: manufacturer?.name ?? robot.manufacturerId },
    { label: 'カテゴリ', value: robotCategoryLabels[robot.category] },
    ...getSpecRows(robot.specs),
  ];
}

export function getRobotDetailDecisionRows(robot: Robot): DisplayRow[] {
  return [
    { label: '導入段階', value: deploymentStageLabels[robot.deploymentStage] },
    // 調達可能性の実態は裏取りできたロボットのみ設定される（未設定は行ごと非表示）
    ...(robot.marketAvailability
      ? [{ label: '調達可能性', value: marketAvailabilityLabels[robot.marketAvailability] }]
      : []),
    { label: '実務ラベル', value: buyerReadinessLabels[robot.buyerReadiness] },
    { label: '日本での入手性', value: japanAvailabilityLabels[robot.japanAvailability] },
    {
      label: '調達形態',
      value: joinOrFallback(robot.procurementModels.map((model) => procurementLabels[model])),
    },
    { label: '参考価格', value: robot.priceNote ?? EMPTY_VALUE_LABEL },
    { label: '安全性', value: robot.safetyNote ?? EMPTY_VALUE_LABEL },
    { label: '継続性リスク', value: robot.vendorRiskNote ?? EMPTY_VALUE_LABEL },
  ];
}

export function getComparisonCoreRows(robot: Robot): ComparisonDisplayRow[] {
  const { specs } = robot;

  return [
    { label: uiText.compare.price, value: formatComparisonPriceStatus(robot), valueKind: 'text' },
    { label: uiText.comparison.japanSupport, value: japanAvailabilityLabels[robot.japanAvailability], valueKind: 'text' },
    { label: uiText.compare.deploymentStage, value: deploymentStageLabels[robot.deploymentStage], valueKind: 'text' },
    { label: '可搬重量', value: formatComparisonPayloadStatus(specs.payloadKg), valueKind: 'text' },
    { label: '稼働時間', value: formatComparisonRuntimeStatus(specs.runtimeMin), valueKind: 'text' },
  ];
}

export function getComparisonDetailRows(robot: Robot): ComparisonDisplayRow[] {
  const { specs } = robot;

  const height = formatNumber(specs.heightCm, 'cm');
  const weight = formatNumber(specs.weightKg, 'kg');
  const dimensions = (specs.heightCm != null || specs.weightKg != null) ? `${height} / ${weight}` : EMPTY_VALUE_LABEL;

  return [
    {
      label: uiText.comparison.dimensions,
      value: dimensions,
      valueKind: dimensions === EMPTY_VALUE_LABEL ? 'empty' : 'number',
    },
    // 項目の選抜は比較UIの編集判断、ラベル・整形は specSchema 準拠
    ...getSpecRows(specs, ['dof', 'mobility', 'ipRating']).map((row, index) => ({
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
