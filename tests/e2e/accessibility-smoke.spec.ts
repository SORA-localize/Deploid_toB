import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 閾値は `serious` 以上。
 *
 * 2026-08-06 まで `critical` のみだった。`serious` へ上げられなかったのは
 * `color-contrast` が219件あったため（積み残し登録簿 #4）。内訳を実測したところ
 * 単一トークンの問題ではなく、繰り返し描画されるカード内の不透明度修飾子と
 * `--signal` の色そのものに集約でき、いずれも解消したのでこの閾値へ上げた。
 *
 * ここを `critical` へ戻したくなったら、それは違反を隠す操作。原因を直すこと。
 */
const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

for (const route of ['/', '/robots', '/manufacturers', '/use-cases', '/reports', '/compare']) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    const blocking = result.violations.filter((item) => BLOCKING_IMPACTS.has(item.impact ?? ''));
    // 落ちたとき何が悪いか分かるように、ルール名と件数を出す。
    expect(blocking.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });
}
