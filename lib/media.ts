import type { ImageAsset, RightsStatus } from '@/data/types';

export type MediaUsagePolicy = 'commercial-strict' | 'reference-attributed' | 'prototype';

const commercialStatuses = new Set<RightsStatus>([
  'own',
  'licensed',
  'commercial-permitted',
]);

const referenceStatuses = new Set<RightsStatus>([
  ...commercialStatuses,
  'reference-attributed',
  'permission-requested',
]);

const prototypeStatuses = new Set<RightsStatus>([
  ...referenceStatuses,
  'prototype-only',
]);

export function getMediaUsagePolicy(): MediaUsagePolicy {
  const value = process.env.NEXT_PUBLIC_MEDIA_USAGE_POLICY;

  if (
    value === 'commercial-strict' ||
    value === 'reference-attributed' ||
    value === 'prototype'
  ) {
    return value;
  }

  return 'reference-attributed';
}

export function canDisplayAsset(
  asset: ImageAsset | null | undefined,
  policy: MediaUsagePolicy = getMediaUsagePolicy(),
) {
  if (!asset?.src || !asset.rights) return false;

  const { status } = asset.rights;
  if (status === 'blocked') return false;
  if (policy === 'commercial-strict') return commercialStatuses.has(status);
  if (policy === 'prototype') return prototypeStatuses.has(status);
  return referenceStatuses.has(status);
}

export function getDisplayableAsset(asset: ImageAsset | null | undefined) {
  return canDisplayAsset(asset) ? asset : undefined;
}
