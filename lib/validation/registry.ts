// ラベル(Record で union 全値を要求＝完全集合) と表示順(order) の双方向 diff。
// order 配列の追加漏れ・余剰を実データ非依存で検出するため、snapshot を受け取らない。
import {
  articleCategoryOrder,
  articleSectionOrder,
  manufacturerGuideDeploymentCategoryOrder,
  useCaseMaturityOrder,
} from '../display.ts';
import {
  articleCategoryLabels,
  articleSectionLabels,
  manufacturerGuideDeploymentCategoryLabels,
  maturityLabels,
} from '../labels.ts';
import type { ValidationCollector } from './types.ts';

function checkLabelOrderSync(
  collector: ValidationCollector,
  name: string,
  labels: Record<string, string>,
  order: readonly string[],
): void {
  const labelKeys = Object.keys(labels);
  const orderSet = new Set<string>(order);
  const labelSet = new Set<string>(labelKeys);
  labelKeys.forEach((key) => {
    if (!orderSet.has(key)) {
      collector.error(`[${name}-order] 表示順に "${key}" がありません（ラベルは定義済み）`);
    }
  });
  order.forEach((value) => {
    if (!labelSet.has(value)) {
      collector.error(`[${name}-order] ラベルに "${value}" がありません（表示順に存在）`);
    }
  });
}

export function validateRegistries(collector: ValidationCollector): void {
  checkLabelOrderSync(collector, 'section', articleSectionLabels, articleSectionOrder);
  checkLabelOrderSync(collector, 'category', articleCategoryLabels, articleCategoryOrder);
  checkLabelOrderSync(
    collector,
    'manufacturerGuideDeploymentCategory',
    manufacturerGuideDeploymentCategoryLabels,
    manufacturerGuideDeploymentCategoryOrder,
  );
  checkLabelOrderSync(collector, 'useCaseMaturity', maturityLabels, useCaseMaturityOrder);
}
