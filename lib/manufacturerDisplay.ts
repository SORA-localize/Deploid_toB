import type { Manufacturer, Robot } from '@/lib/content/domainTypes';
import { EMPTY_VALUE_LABEL } from '@/lib/labels';

/**
 * `/compare` 専用のfield trim（Task 6 fix round 2, Medium指摘への対応）。
 * `CompareClient`が実際に読むManufacturerのfieldは`id`/`name`/`nameJa`/`logos`だけ
 * （`sortManufacturers`が内部で使う`japanPresence`/`foundedYear`は型を保つため残す）。
 * `sources`・`seo`・`previousSlugs`・`nextReviewBy`は比較UIのどこからも読まれないため、
 * 型は`Manufacturer`のまま値だけ空にしてclientへ送るJSON payloadから落とす
 * （`lib/robotCatalog.ts`の`toCompareRobot`と同じ方針・同じ理由）。
 */
export function toCompareManufacturer(manufacturer: Manufacturer): Manufacturer {
  return {
    ...manufacturer,
    sources: [],
    seo: undefined,
    previousSlugs: undefined,
    nextReviewBy: undefined,
  };
}

export type ManufacturerConsultationRoute =
  | 'domestic-distributor'
  | 'domestic-direct'
  | 'overseas-direct'
  | 'needs-confirmation';

export const manufacturerConsultationRouteOrder: ManufacturerConsultationRoute[] = [
  'domestic-distributor',
  'domestic-direct',
  'overseas-direct',
  'needs-confirmation',
];

export const manufacturerConsultationRouteLabels: Record<ManufacturerConsultationRoute, string> = {
  'domestic-distributor': '国内代理店あり',
  'domestic-direct': '国内法人・直販',
  'overseas-direct': '海外へ直接問い合わせ',
  'needs-confirmation': '確認が必要',
};

export function getManufacturerLocationLabel(manufacturer: Manufacturer) {
  return manufacturer.hqCity ? `${manufacturer.hqCity},${manufacturer.country}` : manufacturer.country;
}

export function getManufacturerEstablishedRegionLabel(manufacturer: Manufacturer) {
  const year = manufacturer.foundedYear ? String(manufacturer.foundedYear) : EMPTY_VALUE_LABEL;
  return `${getManufacturerLocationLabel(manufacturer)},${year}`;
}

export function getRepresentativeRobotLabel(robots: readonly Robot[], limit = 2) {
  if (robots.length === 0) {
    return EMPTY_VALUE_LABEL;
  }

  const names = robots.slice(0, limit).map((robot) => robot.nameJa ?? robot.name);
  const remaining = robots.length - names.length;

  return remaining > 0 ? `${names.join(' / ')} ほか${remaining}件` : names.join(' / ');
}

export function getManufacturerConsultationRoute(manufacturer: Manufacturer): ManufacturerConsultationRoute {
  if ((manufacturer.domesticDistributors ?? []).length > 0) {
    return 'domestic-distributor';
  }

  if (manufacturer.japanPresence === 'office') {
    return 'domestic-direct';
  }

  if (manufacturer.japanPresence === 'remote') {
    return 'overseas-direct';
  }

  return 'needs-confirmation';
}

export function getDomesticDistributorDisplay(manufacturer: Manufacturer) {
  const distributors = manufacturer.domesticDistributors ?? [];

  if (distributors.length > 0) {
    return {
      label: distributors.length > 1 ? `${distributors[0].name} +${distributors.length - 1}` : distributors[0].name,
      distributors,
      hasDistributor: true,
    };
  }

  return {
    label: '問い合わせ',
    distributors: [],
    hasDistributor: false,
  };
}
