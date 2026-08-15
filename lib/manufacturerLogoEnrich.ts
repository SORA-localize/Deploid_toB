import type { ImageAsset, Manufacturer } from '@/lib/content/domainTypes';
import { measureImageDimensions } from '@/lib/imageDimensions';

/**
 * サーバー側専用（fsを使うため）。メーカー一覧の結果を返す前に、logos.* の各アセットへ
 * 実測アスペクト比を付与する。data/manufacturers.ts に寸法を手打ちしない方針のための
 * 唯一の注入経路（docs/decisions/manufacturer-logo-usage-spec-v1.md 参照）。
 *
 * canonical `Manufacturer`（`lib/content/domainTypes.ts`）は @deprecated legacy `logo`
 * 単体フィールドを持たない（Task 3で除去済み）。measureする対象は `logos.*` のみ。
 */
function withAspect(asset: ImageAsset | undefined): ImageAsset | undefined {
  if (!asset) return asset;
  if (typeof asset.aspectRatio === 'number') return asset; // 既に付与済みなら再計測しない
  const dimensions = measureImageDimensions(asset.src);
  if (!dimensions || dimensions.height <= 0) return asset;
  return { ...asset, aspectRatio: dimensions.width / dimensions.height };
}

export function withMeasuredLogoAspect(manufacturer: Manufacturer): Manufacturer {
  if (!manufacturer.logos) return manufacturer;
  return {
    ...manufacturer,
    logos: {
      symbol: withAspect(manufacturer.logos.symbol),
      wordmark: withAspect(manufacturer.logos.wordmark),
      combined: withAspect(manufacturer.logos.combined),
    },
  };
}
