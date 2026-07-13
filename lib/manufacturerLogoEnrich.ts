import type { ImageAsset, Manufacturer } from '@/data/types';
import { measureImageDimensions } from '@/lib/imageDimensions';

/**
 * サーバー側専用（fsを使うため）。getManufacturers() の結果を返す前に、
 * logo / logos.* の各アセットへ実測アスペクト比を付与する。
 * data/manufacturers.ts に寸法を手打ちしない方針のための唯一の注入経路
 * （docs/planning/manufacturer-logo-usage-spec-v1.md 参照）。
 */
function withAspect(asset: ImageAsset | undefined): ImageAsset | undefined {
  if (!asset) return asset;
  if (typeof asset.aspectRatio === 'number') return asset; // 既に付与済みなら再計測しない
  const dimensions = measureImageDimensions(asset.src);
  if (!dimensions || dimensions.height <= 0) return asset;
  return { ...asset, aspectRatio: dimensions.width / dimensions.height };
}

export function withMeasuredLogoAspect(manufacturer: Manufacturer): Manufacturer {
  if (!manufacturer.logo && !manufacturer.logos) return manufacturer;
  return {
    ...manufacturer,
    logo: withAspect(manufacturer.logo),
    logos: manufacturer.logos
      ? {
          symbol: withAspect(manufacturer.logos.symbol),
          wordmark: withAspect(manufacturer.logos.wordmark),
          combined: withAspect(manufacturer.logos.combined),
        }
      : undefined,
  };
}
