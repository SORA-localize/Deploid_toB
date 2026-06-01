import type { Manufacturer, Robot } from '@/data/types';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
  TBD_LABEL,
} from '@/lib/labels';
import { uiText } from '@/lib/uiText';

export interface DisplayRow {
  label: string;
  value: string;
}

export function formatNumber(value: number | undefined, unit = '') {
  return value != null ? `${value}${unit}` : TBD_LABEL;
}

export function formatRuntime(value: number | undefined) {
  return value != null ? `約${value} 分` : TBD_LABEL;
}

export function joinOrFallback(values: readonly string[]) {
  return values.length > 0 ? values.join(' / ') : TBD_LABEL;
}

export function getRobotCardSpecRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;

  return [
    { label: 'ペイロード', value: formatNumber(specs.payloadKg, ' kg') },
    { label: '稼働時間', value: formatRuntime(specs.runtimeMin) },
    { label: '身長', value: formatNumber(specs.heightCm, ' cm') },
    { label: '重量', value: formatNumber(specs.weightKg, ' kg') },
    { label: 'ステータス', value: deploymentStageLabels[robot.deploymentStage] },
    { label: '参考価格', value: robot.priceNote ?? TBD_LABEL },
  ];
}

export function getRobotDetailSpecRows(robot: Robot, manufacturer?: Manufacturer): DisplayRow[] {
  const { specs } = robot;

  return [
    { label: 'メーカー', value: manufacturer?.name ?? robot.manufacturerSlug },
    { label: 'カテゴリ', value: robotCategoryLabels[robot.category] },
    { label: '移動方式', value: specs.mobility ? mobilityLabels[specs.mobility] : TBD_LABEL },
    { label: '身長', value: formatNumber(specs.heightCm, ' cm') },
    { label: '重量', value: formatNumber(specs.weightKg, ' kg') },
    { label: 'ペイロード', value: formatNumber(specs.payloadKg, ' kg') },
    { label: '稼働時間', value: formatRuntime(specs.runtimeMin) },
    { label: '速度', value: formatNumber(specs.speedMps, ' m/s') },
    { label: '自由度', value: formatNumber(specs.dof, ' DoF') },
    { label: '防塵防水', value: specs.ipRating ?? TBD_LABEL },
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

  let japanSupport = japanAvailabilityLabels[robot.japanAvailability];
  if (robot.japanAvailability === 'distributor-japan' && robot.distributorJapan) {
    japanSupport = `代理店あり (${robot.distributorJapan})`;
  } else if (robot.japanAvailability === 'official-japan') {
    japanSupport = '国内正規販売';
  }

  return [
    { label: uiText.compare.price, value: robot.priceNote ?? TBD_LABEL },
    { label: uiText.comparison.japanSupport, value: japanSupport },
    { label: uiText.compare.deploymentStage, value: deploymentStageLabels[robot.deploymentStage] },
    { label: '可搬重量', value: formatNumber(specs.payloadKg, ' kg') },
    { label: '稼働時間', value: formatRuntime(specs.runtimeMin) },
  ];
}

export function getComparisonDetailRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;

  const height = formatNumber(specs.heightCm, 'cm');
  const weight = formatNumber(specs.weightKg, 'kg');
  const dimensions = (specs.heightCm != null || specs.weightKg != null) ? `${height} / ${weight}` : TBD_LABEL;

  return [
    { label: uiText.comparison.dimensions, value: dimensions },
    { label: '自由度', value: formatNumber(specs.dof, ' DoF') },
    { label: '移動方式', value: specs.mobility ? mobilityLabels[specs.mobility] : TBD_LABEL },
    { label: '防塵防水', value: specs.ipRating ?? TBD_LABEL },
  ];
}
