import { expect, test } from '@playwright/test';

// Phase 4 の単一canvas化で2件の表示回帰が入り、どちらも既存のテストで捕まらなかった。
// check:home-payload はバイト数と data URI しか見ておらず、比率と重ね順を見ていない。
//   1. object-fill で地図が画面幅ごとに歪む（実測 -33.7%〜+24.3%）
//   2. 拠点ドットの z-index が可読性スクリムを突き抜け、見出しと同じ彩度で残る
// このテストは両方を4幅で固定する。

const WIDTHS = [390, 768, 1280, 1440] as const;

for (const width of WIDTHS) {
  test(`home world map keeps its aspect ratio and layering @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('[data-world-map-stage]').waitFor();

    // 1) 地図が引き伸ばされていないこと。
    const image = page.locator('[data-world-map-canvas] img');
    // naturalWidth は読み込み完了まで 0 のまま。待たずに測ると NaN になる。
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const natural = await image.evaluate((el) => {
      const img = el as HTMLImageElement;
      return img.naturalWidth / img.naturalHeight;
    });
    expect(await image.boundingBox()).not.toBeNull();
    // 歪みの有無は object-fit で決まる。cover なら比率は保たれ、余りは切られる。
    // アセットの比率そのもの（現在 210:100）は projection の設定で変わりうるので固定しない。
    expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
    expect(natural).toBeGreaterThan(1.5); // 横長の世界地図であることの sanity check

    // 2) 拠点ドットが可読性スクリムより下に描かれること。
    //    elementFromPoint は使えない。スクリムが pointer-events-none なので素通りし、
    //    ヒットテストの結果は描画順を表さない。代わりに描画順を決めている構造を直接見る。
    //    条件は2つ: 地図ラッパが stacking context を閉じていること（ドットの z-index が
    //    stage の文脈へ漏れない）と、スクリムが DOM 上そのラッパより後にあること。
    const layering = await page.evaluate(() => {
      const stage = document.querySelector('[data-world-map-stage]');
      const canvas = document.querySelector('[data-world-map-canvas]');
      if (!stage || !canvas) return null;
      const wrapper = canvas.parentElement;
      if (!wrapper) return null;
      const children = Array.from(stage.children);
      const scrims = children.filter((el) => el.className.includes('bg-gradient'));
      return {
        isolation: getComputedStyle(wrapper).isolation,
        wrapperIndex: children.indexOf(wrapper),
        scrimIndexes: scrims.map((el) => children.indexOf(el)),
        scrimZ: scrims.map((el) => getComputedStyle(el).zIndex),
      };
    });
    expect(layering).not.toBeNull();
    expect(layering!.isolation).toBe('isolate');
    expect(layering!.scrimIndexes.length).toBeGreaterThan(0);
    for (const index of layering!.scrimIndexes) {
      expect(index).toBeGreaterThan(layering!.wrapperIndex);
    }
    // スクリムが z-index を持つと、ラッパを閉じても位置関係が変わりうる。auto のままを固定する。
    for (const z of layering!.scrimZ) expect(z).toBe('auto');

    // 3) 要素の欠落と横スクロール。
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-world-map-canvas] img')).toHaveCount(1);
    await expect(page.locator('[data-world-map-point]')).toHaveCount(14);
    const doc = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(doc.scrollWidth).toBe(doc.clientWidth);

    // 4) 拠点はキーボードで到達でき、支援技術から隠れていない。
    const first = page.locator('[data-world-map-point]').first();
    expect(await first.evaluate((el) => el.tagName)).toBe('A');
    await expect(first).not.toHaveAttribute('aria-hidden', 'true');
  });
}
