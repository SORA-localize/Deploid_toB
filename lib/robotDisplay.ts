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

export function getComparisonSpecRows(robot: Robot): DisplayRow[] {
  const { specs } = robot;

  return [
    { label: '身長', value: formatNumber(specs.heightCm, ' cm') },
    { label: '重量', value: formatNumber(specs.weightKg, ' kg') },
    { label: 'ペイロード', value: formatNumber(specs.payloadKg, ' kg') },
    { label: '稼働時間', value: formatRuntime(specs.runtimeMin) },
    { label: '移動方式', value: specs.mobility ? mobilityLabels[specs.mobility] : TBD_LABEL },
  ];
}

export function getComparisonDecisionRows(robot: Robot): DisplayRow[] {
  return [
    { label: uiText.compare.deploymentStage, value: deploymentStageLabels[robot.deploymentStage] },
    { label: uiText.compare.japanAvailability, value: japanAvailabilityLabels[robot.japanAvailability] },
    {
      label: uiText.compare.procurement,
      value: joinOrFallback(robot.procurementModels.map((model) => procurementLabels[model])),
    },
    { label: uiText.compare.price, value: robot.priceNote ?? TBD_LABEL },
  ];
}
