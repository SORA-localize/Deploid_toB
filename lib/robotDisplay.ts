import type { Manufacturer, Robot, RobotSpecs } from '@/data/types';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
  TBD_LABEL,
} from '@/lib/labels';
import { getSpecEntry, specSchema, type SpecKey } from '@/lib/specSchema';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';

export interface DisplayRow {
  label: string;
  value: string;
}

export function formatNumber(value: number | undefined, unit = '') {
  return value != null ? `${value}${unit}` : TBD_LABEL;
}

export function formatRuntime(value: number | undefined) {
  return value != null ? `約${value}分` : TBD_LABEL;
}

/** specSchema の kind/unit に従ってスペック値を整形する（未設定は「要確認」） */
export function formatSpecValue(specs: RobotSpecs, key: SpecKey): string {
  const entry = getSpecEntry(key);
  const raw = specs[key];
  if (raw == null || raw === '') return TBD_LABEL;
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
  if (!note) return TBD_LABEL;
  if (/価格は?非公開|価格未公開|未公表|未発表|問い合わせ制|公開価格なし/.test(note)) {
    return '問い合わせ';
  }
  if (/[$＄€￥¥]|usd|eur|円|公開価格|参考価格|約\s*[0-9]/i.test(normalizedNote)) {
    return '公開価格あり';
  }
  if (/問い合わせ|要確認/.test(note)) return '問い合わせ';

  return TBD_LABEL;
}

function formatComparisonPayloadStatus(value: number | undefined) {
  if (value == null) return TBD_LABEL;
  if (value < 5) return '小型（5kg未満）';
  if (value < 15) return '標準（5〜15kg）';
  if (value < 30) return '高可搬（15〜30kg）';
  return '重量級（30kg以上）';
}

function formatComparisonRuntimeStatus(value: number | undefined) {
  if (value == null) return TBD_LABEL;
  if (value < 90) return '短時間（90分未満）';
  if (value < 180) return '標準（90〜180分）';
  if (value < 360) return '長時間（3〜6時間）';
  return '超長時間（6時間以上）';
}

export function joinOrFallback(values: readonly string[]) {
  return values.length > 0 ? values.join(' / ') : TBD_LABEL;
}

export function getRobotCardSpecRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;
  const size = specs.heightCm != null || specs.weightKg != null
    ? `${formatNumber(specs.heightCm, 'cm')} / ${formatNumber(specs.weightKg, 'kg')}`
    : TBD_LABEL;
  const primaryIndustry = robot.industryTags?.[0]
    ? getTagLabel(robot.industryTags[0], 'industry')
    : TBD_LABEL;

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
    { label: '実務ラベル', value: buyerReadinessLabels[robot.buyerReadiness] },
    { label: '日本での入手性', value: japanAvailabilityLabels[robot.japanAvailability] },
    {
      label: '調達形態',
      value: joinOrFallback(robot.procurementModels.map((model) => procurementLabels[model])),
    },
    { label: '参考価格', value: robot.priceNote ?? TBD_LABEL },
    { label: '安全性', value: robot.safetyNote ?? TBD_LABEL },
    { label: '継続性リスク', value: robot.vendorRiskNote ?? TBD_LABEL },
  ];
}

export function getComparisonCoreRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;

  return [
    { label: uiText.compare.price, value: formatComparisonPriceStatus(robot) },
    { label: uiText.comparison.japanSupport, value: japanAvailabilityLabels[robot.japanAvailability] },
    { label: uiText.compare.deploymentStage, value: deploymentStageLabels[robot.deploymentStage] },
    { label: '可搬重量', value: formatComparisonPayloadStatus(specs.payloadKg) },
    { label: '稼働時間', value: formatComparisonRuntimeStatus(specs.runtimeMin) },
  ];
}

export function getComparisonDetailRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;

  const height = formatNumber(specs.heightCm, 'cm');
  const weight = formatNumber(specs.weightKg, 'kg');
  const dimensions = (specs.heightCm != null || specs.weightKg != null) ? `${height} / ${weight}` : TBD_LABEL;

  return [
    { label: uiText.comparison.dimensions, value: dimensions },
    // 項目の選抜は比較UIの編集判断、ラベル・整形は specSchema 準拠
    ...getSpecRows(specs, ['dof', 'mobility', 'ipRating']),
  ];
}
