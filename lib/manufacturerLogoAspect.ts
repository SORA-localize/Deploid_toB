/**
 * ワードマーク型（横長）とシンボル型（正方形寄り）でアスペクト比が最大10倍以上差があるため、
 * 固定の高さ＋固定の最大幅だけでは「広いロゴは文字が潰れる／狭いロゴは余白だらけ」になる。
 * 面積ベースでボックスサイズを逆算する。
 *
 * 注意：この関数はクライアントコンポーネントからも呼ばれるため fs を使わない。
 * アスペクト比は呼び出し側（lib/data.ts の enrichment）が実ファイルから測定済みの値を渡すこと
 * （lib/imageDimensions.ts）。dataに手打ちの数値は書かない。
 */
const DEFAULT_ASPECT_RATIO = 3;

export function getLogoBoxSize(
  aspectRatio: number | undefined,
  targetAreaPx: number,
  { minHeightPx = 14, maxHeightPx = 48, maxWidthPx = 220 } = {},
): { heightPx: number; widthPx: number } {
  const aspect = aspectRatio && aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT_RATIO;

  let heightPx = Math.sqrt(targetAreaPx / aspect);
  heightPx = Math.min(Math.max(heightPx, minHeightPx), maxHeightPx);
  let widthPx = heightPx * aspect;
  if (widthPx > maxWidthPx) {
    widthPx = maxWidthPx;
    heightPx = widthPx / aspect;
    // 幅優先で縮めた結果、可読性を損なう高さまで潰れていたら高さを下限まで戻す
    // （その分だけ幅がmaxWidthPxを超えることを許容する — 極端なワードマーク比率のロゴ向けの安全弁）。
    if (heightPx < minHeightPx) {
      heightPx = minHeightPx;
      widthPx = heightPx * aspect;
    }
  }
  return { heightPx: Math.round(heightPx), widthPx: Math.round(widthPx) };
}
