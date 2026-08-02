import type { ManufacturerLogoVariant } from '@/lib/manufacturerLogo';
import type { VisualTone } from '@/lib/visualSemantics';

export interface CatalogImage {
  src: string;
  alt: string;
}

export interface CatalogLogoAsset {
  src: string;
  alt: string;
  credit?: string;
  aspectRatio?: number;
}

export interface CatalogLogo {
  asset?: CatalogLogoAsset;
  resolvedVariant?: ManufacturerLogoVariant;
}

export interface CatalogTag {
  label: string;
  tone: VisualTone;
}

export interface CatalogFact {
  key: string;
  label: string;
  value: string;
  href?: string;
}
