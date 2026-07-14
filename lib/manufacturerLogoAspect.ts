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
  const safeMaxWidth = Math.max(1, maxWidthPx);
  const safeMaxHeight = Math.max(1, maxHeightPx);
  // 横長ロゴでは「最小高さ」と「最大幅」を同時に満たせないことがある。
  // レイアウトを壊さないことを優先し、その場合だけ高さを最小値未満まで縮める。
  const constrainedMaxHeight = Math.min(safeMaxHeight, safeMaxWidth / aspect);
  const constrainedMinHeight = Math.min(
    Math.max(1, minHeightPx),
    constrainedMaxHeight,
  );
  const idealHeight = Math.sqrt(Math.max(1, targetAreaPx) / aspect);
  const heightPx = Math.min(
    Math.max(idealHeight, constrainedMinHeight),
    constrainedMaxHeight,
  );
  const widthPx = Math.min(safeMaxWidth, heightPx * aspect);

  return {
    heightPx: Math.max(1, Math.round(heightPx)),
    widthPx: Math.max(1, Math.round(widthPx)),
  };
}
