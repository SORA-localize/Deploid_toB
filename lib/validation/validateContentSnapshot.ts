// 参照整合チェックのorchestrator。
// 呼出順は分割前 lib/validate.ts の出力順に一字一句合わせている:
//   robot鮮度 → manufacturer鮮度（monolithでは検証全体の先頭にhoistされていた2ループ）
//   → collection横断の同一性(crossCollection) → registry(label⇔order)
//   → manufacturer-guide本文 → robots本体 → manufacturers本体 → useCases本体
//   → articles本体 → deployments本体 → articlePlacements
// 規則そのものは各ファイルに verbatim で置いてある。
import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import { validateArticlePlacements, validateArticles, validateManufacturerGuideContent } from './articles.ts';
import { validateCrossCollection } from './crossCollection.ts';
import { validateDeployments } from './deployments.ts';
import { validateManufacturerFreshness, validateManufacturers } from './manufacturers.ts';
import { validateRegistries } from './registry.ts';
import { validateRobotFreshness, validateRobots } from './robots.ts';
import { createValidationCollector, type ValidationResult } from './types.ts';
import { validateUseCases } from './useCases.ts';

export function validateContentSnapshot(snapshot: ContentSnapshot): ValidationResult {
  const collector = createValidationCollector();
  // 検証実行全体で1度だけ計算し、鮮度チェックの全呼び出しで使い回す（決定性のため）。
  const now = Date.now();

  validateRobotFreshness(snapshot, collector, now);
  validateManufacturerFreshness(snapshot, collector, now);
  validateCrossCollection(snapshot, collector);
  validateRegistries(collector);
  validateManufacturerGuideContent(snapshot, collector);
  validateRobots(snapshot, collector);
  validateManufacturers(snapshot, collector);
  validateUseCases(snapshot, collector);
  validateArticles(snapshot, collector);
  validateDeployments(snapshot, collector);
  validateArticlePlacements(snapshot, collector);
  return { errors: collector.errors, warnings: collector.warnings };
}
