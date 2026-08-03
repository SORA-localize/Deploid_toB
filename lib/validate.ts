// 参照整合チェックの互換facade。dev起動時に lib/data.ts から1度だけ呼ばれ、
// 「存在しないidを参照している」「双方向リンクが片側だけ」「id/slug重複」を
// console に出す。`npm run validate:data`（scripts/validate-data.mjs）からも実行される。
// 規則の本体は lib/validation/*.ts にあり、ここは data入口の固定と出力整形だけを持つ。
import { localContentSnapshot } from './data/localContentSnapshot.ts';
import type { ValidationResult } from './validation/types.ts';
import { validateContentSnapshot } from './validation/validateContentSnapshot.ts';

/**
 * 検証は2段階（設計 §10-1）:
 * - errors: データとして壊れている。build を失敗させる（scripts/validate-data.mjs が exit 1）
 * - warnings: 運用上の注意（未ローカル画像・鮮度切れ）。ログのみで build は通す
 */
export type { ValidationResult };

export function validateData(): ValidationResult {
  return validateContentSnapshot(localContentSnapshot);
}

let didRun = false;
export function runValidationInDev(): void {
  if (didRun) return;
  didRun = true;
  if (process.env.NODE_ENV === 'production') return;
  const { errors, warnings } = validateData();
  const total =
    localContentSnapshot.robots.length +
    localContentSnapshot.manufacturers.length +
    localContentSnapshot.useCases.length +
    localContentSnapshot.articles.length;
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`[data] referential integrity: OK (${total} records)`);
    return;
  }
  if (warnings.length > 0) {
    console.warn(`[data] warnings (${warnings.length}):\n` + warnings.map((i) => '  - ' + i).join('\n'));
  }
  if (errors.length > 0) {
    console.error(`[data] errors (${errors.length}) — build はゲートで失敗します:\n` + errors.map((i) => '  - ' + i).join('\n'));
  }
}
