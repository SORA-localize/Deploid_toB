import type { Manufacturer } from '@/lib/content/domainTypes';
import {
  resolveManufacturerLogo,
  type ManufacturerLogoVariant,
} from '@/lib/manufacturerLogo';
import type { CatalogLogo } from './shared';

export function createCatalogLogo(
  manufacturer: Manufacturer | undefined,
  variant: ManufacturerLogoVariant,
): CatalogLogo {
  if (!manufacturer) return {};
  const { asset, resolvedVariant } = resolveManufacturerLogo(manufacturer, variant);
  return {
    asset: asset
      ? {
          src: asset.src,
          alt: asset.alt,
          credit: asset.credit,
          aspectRatio: asset.aspectRatio,
        }
      : undefined,
    resolvedVariant,
  };
}
