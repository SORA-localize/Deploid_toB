import type { Robot, UseCase, UseCaseMaturity } from '@/data/types';
import { createUseCaseCatalogSearchText } from '@/lib/catalog/search';
import { maturityLabels } from '@/lib/labels';
import { getUseCaseCardEvidenceSummary } from '@/lib/useCaseEvidence';
import { getUseCaseMaturityTone } from '@/lib/visualSemantics';
import type { CatalogTag } from './shared';

export interface UseCaseCatalogItem {
  id: string;
  slug: string;
  href: string;
  /** card見出し。`titleJa ?? title` を解決済み。並び替えのキーも兼ねる。 */
  title: string;
  /** cardは `subtitle ?? summary` を描画する。VMでは解決済みの1本にする。 */
  lead: string;
  maturity: CatalogTag;
  /** 成熟度セクションのグルーピングと並び順に使う。labelは maturity.label 側にある。 */
  maturityLevel: UseCaseMaturity;
  evidence?: CatalogTag;
  robotNames: string[];
  filter: {
    primaryIndustry: string;
    industryTags: string[];
    taskTags: string[];
    searchText: string;
  };
}

/**
 * use case一覧のview model。clientへ渡すのはこれだけで、raw `UseCase` は渡さない。
 *
 * `overview` / `whyItMatters` / `whyHardToday` / `environmentRequirements` /
 * `japanDeploymentConditions` / `capabilityNotes` / `atAGlance` / `sources` /
 * `candidateRobots` は含めない。詳細ページ専用の本文と中間データである。
 */
export function createUseCaseCatalogItems(
  useCases: readonly UseCase[],
  robots: readonly Robot[],
  options?: { hasDeployments?: (useCaseId: string) => boolean },
): UseCaseCatalogItem[] {
  const robotNameById = new Map(robots.map((robot) => [robot.id, robot.nameJa ?? robot.name]));

  return useCases.map((useCase) => {
    const robotNames = useCase.candidateRobots
      .slice(0, 2)
      .map((candidate) => robotNameById.get(candidate.robotId))
      .filter((name): name is string => Boolean(name));

    return {
      id: useCase.id,
      slug: useCase.slug,
      href: `/use-cases/${useCase.slug}`,
      title: useCase.titleJa ?? useCase.title,
      lead: useCase.subtitle ?? useCase.summary,
      maturity: {
        label: maturityLabels[useCase.maturityLevel],
        tone: getUseCaseMaturityTone(useCase.maturityLevel),
      },
      maturityLevel: useCase.maturityLevel,
      evidence: getUseCaseCardEvidenceSummary({
        hasDeployments: options?.hasDeployments?.(useCase.id) ?? false,
      }),
      robotNames,
      filter: {
        primaryIndustry: useCase.primaryIndustry,
        industryTags: [...useCase.industryTags],
        taskTags: [...useCase.taskTags],
        searchText: createUseCaseCatalogSearchText(useCase, robotNames),
      },
    };
  });
}
