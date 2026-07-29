// 参照整合チェックのorchestrator。
// 呼出順は分割前 lib/validate.ts の出力順（先にcollection横断の同一性、次にregistry、
// 以降はcollection単位）に合わせている。規則そのものは各ファイルに verbatim で置いてある。
import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import { validateArticles } from './articles.ts';
import { validateCrossCollection } from './crossCollection.ts';
import { validateDeployments } from './deployments.ts';
import { validateManufacturers } from './manufacturers.ts';
import { validateRegistries } from './registry.ts';
import { validateRobots } from './robots.ts';
import { createValidationCollector, type ValidationResult } from './types.ts';
import { validateUseCases } from './useCases.ts';

export function validateContentSnapshot(snapshot: ContentSnapshot): ValidationResult {
  const collector = createValidationCollector();
  validateCrossCollection(snapshot, collector);
  validateRegistries(collector);
  validateArticles(snapshot, collector);
  validateRobots(snapshot, collector);
  validateManufacturers(snapshot, collector);
  validateUseCases(snapshot, collector);
  validateDeployments(snapshot, collector);
  return { errors: collector.errors, warnings: collector.warnings };
}
