// データ検証のビルドゲート（設計: data-architecture-redesign-v1 §10-1）。
// `npm run build` の前段で実行され、error があれば exit 1 で build を止める。
// warning（未ローカル画像・鮮度切れ）はログのみで通す。
import { validateData } from '../lib/validate.ts';

const { errors, warnings } = validateData();

if (warnings.length > 0) {
  console.warn(`[data] warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`  - ${warning}`));
}

if (errors.length === 0) {
  console.log('[data] validation: OK');
} else {
  console.error(`[data] errors (${errors.length}):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
}
