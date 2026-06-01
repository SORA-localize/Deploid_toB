import type { Manufacturer, Robot } from '@/data/types';
import { TBD_LABEL } from '@/lib/labels';

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
  const year = manufacturer.foundedYear ? String(manufacturer.foundedYear) : TBD_LABEL;
  return `${getManufacturerLocationLabel(manufacturer)},${year}`;
}

export function getRepresentativeRobotLabel(robots: readonly Robot[], limit = 2) {
  if (robots.length === 0) {
    return TBD_LABEL;
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
