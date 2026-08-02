import type { Manufacturer, Robot } from '@/data/types';
import { createManufacturerCatalogSearchText } from '@/lib/catalog/search';
import {
  getDomesticDistributorDisplay,
  getManufacturerConsultationRoute,
  getManufacturerEstablishedRegionLabel,
  getRepresentativeRobotLabel,
  manufacturerConsultationRouteLabels,
} from '@/lib/manufacturerDisplay';
import { createCatalogLogo } from './logo';
import type { CatalogLogo } from './shared';

export interface ManufacturerCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  website: string;
  logo: CatalogLogo;
  filter: {
    country: string;
    consultationRoute: string;
    searchText: string;
  };
  facts: {
    establishedRegion: string;
    representativeRobot: string;
    consultationRoute: string;
    distributors: Array<{ name: string; website?: string }>;
    distributorLabel: string;
    hasDistributor: boolean;
  };
}

function groupRobotsByManufacturerId(robots: readonly Robot[]) {
  const byManufacturer = new Map<string, Robot[]>();
  robots.forEach((robot) => {
    const existing = byManufacturer.get(robot.manufacturerId) ?? [];
    existing.push(robot);
    byManufacturer.set(robot.manufacturerId, existing);
  });
  return byManufacturer;
}

/**
 * メーカー一覧（/manufacturers）のクライアント境界に渡すview modelを作る。
 * sources/headquarters/description/notes等の編集用フィールドはここで落とし、
 * カード表示・フィルタ・検索に必要な解決済みの値だけを詰める
 * （tests/unit/view-models/manufacturers.test.ts）。
 */
export function createManufacturerCatalogItems(
  manufacturers: readonly Manufacturer[],
  robots: readonly Robot[],
): ManufacturerCatalogItem[] {
  const robotsByManufacturer = groupRobotsByManufacturerId(robots);

  return manufacturers.map((manufacturer) => {
    const manufacturerRobots = robotsByManufacturer.get(manufacturer.id) ?? [];
    const consultationRoute = getManufacturerConsultationRoute(manufacturer);
    const domesticDistributor = getDomesticDistributorDisplay(manufacturer);

    return {
      id: manufacturer.id,
      slug: manufacturer.slug,
      href: `/manufacturers/${manufacturer.slug}`,
      name: manufacturer.nameJa ?? manufacturer.name,
      website: manufacturer.website,
      logo: createCatalogLogo(manufacturer, 'combined'),
      filter: {
        country: manufacturer.country,
        consultationRoute,
        searchText: createManufacturerCatalogSearchText(manufacturer, manufacturerRobots),
      },
      facts: {
        establishedRegion: getManufacturerEstablishedRegionLabel(manufacturer),
        representativeRobot: getRepresentativeRobotLabel(manufacturerRobots),
        consultationRoute: manufacturerConsultationRouteLabels[consultationRoute],
        distributors: domesticDistributor.distributors.map((distributor) => ({
          name: distributor.name,
          website: distributor.website,
        })),
        distributorLabel: domesticDistributor.label,
        hasDistributor: domesticDistributor.hasDistributor,
      },
    };
  });
}
