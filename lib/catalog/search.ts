import type { Article, Manufacturer, Robot, UseCase } from '@/lib/content/domainTypes';
import {
  articleTypeLabels,
  companyStatusLabels,
  companyTypeLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  japanPresenceLabels,
  maturityLabels,
  mobilityLabels,
  procurementLabels,
  robotCategoryLabels,
} from '@/lib/labels';
import { normalizeSearchText } from '@/lib/normalizeSearchText';
import { getTagSearchValues } from '@/lib/tags';
import type { CatalogFact } from '@/lib/viewModels/shared';

/**
 * catalog一覧の検索テキストを、対象fieldを明示列挙して組み立てる。
 *
 * **`lib/search.ts` の `create*SearchDocument()` は使わない。** あれは詳細ページ向けの
 * 汎用search documentで本文を含むため、再利用するとclientへ渡るJSONに本文が載る
 * （keyとしては現れないが連結された文字列として残る）。
 *
 * 原則: 対象は「そのcardが実際に描画する文字列」と「その一覧のfacet選択肢のlabel」だけ。
 * 詳細ページにしか無い本文は一覧の検索対象にしない。id・slug・内部enum値は表示でも
 * facet labelでもないため含めない（enumはlabel経由で引ける）。
 *
 * **この module は server 専用。** label map 群を抱えるため client から import しない。
 */
export type SearchPart = string | number | undefined;

export function joinSearchText(parts: readonly SearchPart[]): string {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}

export function createRobotCatalogSearchText(
  robot: Robot,
  manufacturer: Manufacturer | undefined,
  facts: readonly CatalogFact[],
): string {
  return joinSearchText([
    robot.nameJa,
    robot.name,
    manufacturer?.nameJa,
    manufacturer?.name,
    robot.distributorJapan,
    robotCategoryLabels[robot.category],
    deploymentStageLabels[robot.deploymentStage],
    japanAvailabilityLabels[robot.japanAvailability],
    robot.specs.mobility ? mobilityLabels[robot.specs.mobility] : undefined,
    ...robot.procurementModels.map((model) => procurementLabels[model]),
    ...facts.map((fact) => fact.value),
    // タグは登録済みの日本語ラベルへ展開する。生の値（'logistics' 等）だけでは
    // facet UI に出ている「物流」で引けない。getTagSearchValues はラベルと値の両方を返す。
    ...getTagSearchValues(robot.industryTags ?? [], 'industry'),
    ...getTagSearchValues(robot.taskTags ?? [], 'task'),
  ]);
}

export function createManufacturerCatalogSearchText(
  manufacturer: Manufacturer,
  robotsForManufacturer: readonly Robot[],
): string {
  return joinSearchText([
    manufacturer.nameJa,
    manufacturer.name,
    manufacturer.country,
    manufacturer.hqCity,
    manufacturer.foundedYear,
    companyTypeLabels[manufacturer.companyType],
    companyStatusLabels[manufacturer.companyStatus],
    japanPresenceLabels[manufacturer.japanPresence],
    ...(manufacturer.domesticDistributors ?? []).map((distributor) => distributor.name),
    ...robotsForManufacturer.flatMap((robot) => [robot.nameJa, robot.name]),
  ]);
}

export function createUseCaseCatalogSearchText(
  useCase: UseCase,
  robotNames: readonly string[],
): string {
  return joinSearchText([
    useCase.titleJa,
    useCase.title,
    // card は subtitle ?? summary を描画するので両方を対象にする。
    useCase.subtitle,
    useCase.summary,
    maturityLabels[useCase.maturityLevel],
    ...robotNames,
    ...getTagSearchValues([useCase.primaryIndustry], 'industry'),
    ...getTagSearchValues(useCase.industryTags, 'industry'),
    ...getTagSearchValues(useCase.taskTags, 'task'),
  ]);
}

export function createArticleCatalogSearchText(article: Article): string {
  return joinSearchText([
    article.titleJa,
    article.title,
    article.summary,
    articleTypeLabels[article.type],
    ...getTagSearchValues(article.themeTags ?? [], 'theme'),
    ...getTagSearchValues(article.industryTags ?? [], 'industry'),
    ...getTagSearchValues(article.regionTags ?? [], 'region'),
  ]);
}
