import type { Manufacturer, Robot, UseCase } from '@/data/types';
import { createRobotCatalogSearchText } from '@/lib/catalog/search';
import { deploymentStageLabels } from '@/lib/labels';
import { createRobotCardViewModel } from '@/lib/robotCatalog';
import { getRobotPrimaryImage } from '@/lib/robotMedia';
import { getDeploymentStageTone } from '@/lib/visualSemantics';
import { createCatalogLogo } from './logo';
import type { CatalogFact, CatalogImage, CatalogLogo, CatalogTag } from './shared';

export interface RobotCatalogItem {
  id: string;
  slug: string;
  href: string;
  name: string;
  image?: CatalogImage;
  manufacturer: CatalogLogo & { id: string; name: string };
  stage: CatalogTag;
  facts: [CatalogFact, CatalogFact, CatalogFact, CatalogFact];
  filter: {
    manufacturerId: string;
    industryTags: string[];
    japanAvailability: string;
    deploymentStage: string;
    searchText: string;
  };
}

/**
 * ロボット一覧（/robots）のクライアント境界に渡すview modelを作る。
 * sources/fieldEvidence/comparison/priceOffersなど、編集用・権利metadataの生データは
 * ここで意図的に落とし、表示に必要な値だけを詰める（tests/unit/view-models/robots.test.ts）。
 * 呼び出し側で`robots`を並べ替えておけば、その並び順がそのままitemsに引き継がれる
 * （filterRobots は再ソートしない。lib/robotFilters.ts 参照）。
 */
export function createRobotCatalogItems(
  robots: readonly Robot[],
  manufacturers: readonly Manufacturer[],
  useCases: readonly UseCase[],
): RobotCatalogItem[] {
  const manufacturerById = new Map(manufacturers.map((item) => [item.id, item]));

  return robots.map((robot) => {
    const manufacturer = manufacturerById.get(robot.manufacturerId);
    const image = getRobotPrimaryImage(robot);
    const card = createRobotCardViewModel(robot, useCases);

    return {
      id: robot.id,
      slug: robot.slug,
      href: `/robots/${robot.slug}`,
      name: robot.nameJa ?? robot.name,
      image: image ? { src: image.src, alt: image.alt } : undefined,
      manufacturer: {
        id: robot.manufacturerId,
        name: manufacturer?.nameJa ?? manufacturer?.name ?? robot.manufacturerId,
        ...createCatalogLogo(manufacturer, 'combined'),
      },
      stage: {
        label: deploymentStageLabels[robot.deploymentStage],
        tone: getDeploymentStageTone(robot.deploymentStage),
      },
      facts: card.facts.map(({ key, label, value, href }) => ({ key, label, value, href })) as [
        CatalogFact,
        CatalogFact,
        CatalogFact,
        CatalogFact,
      ],
      filter: {
        manufacturerId: robot.manufacturerId,
        industryTags: [...(robot.industryTags ?? [])],
        japanAvailability: robot.japanAvailability,
        deploymentStage: robot.deploymentStage,
        searchText: createRobotCatalogSearchText(robot, manufacturer, card.facts),
      },
    };
  });
}
