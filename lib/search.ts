import type { Guide, Manufacturer, Report, Robot, UseCase } from '@/data/types';
import {
  buyerReadinessLabels,
  companyStatusLabels,
  companyTypeLabels,
  deploymentStageLabels,
  guideStageLabels,
  japanAvailabilityLabels,
  japanPresenceLabels,
  mobilityLabels,
  operatingEnvironmentLabels,
  procurementLabels,
  reportTypeLabels,
  robotCategoryLabels,
  capabilityLabels,
  maturityLabels,
} from '@/lib/labels';
import { getTagSearchValues } from '@/lib/tags';

export type SearchCollection = 'robots' | 'manufacturers' | 'reports' | 'guides' | 'useCases';
export type SearchPrimitive = string | number | null | undefined;
export type SearchValueInput = SearchPrimitive | readonly SearchValueInput[];

export interface SearchDocument {
  id: string;
  collection: SearchCollection;
  title: string;
  url: string;
  fields: string[];
  tags: string[];
}

interface SearchDocumentInput {
  id: string;
  collection: SearchCollection;
  title: string;
  url: string;
  fields: readonly SearchValueInput[];
  tags?: readonly string[];
}

export function normalizeSearchText(value: SearchPrimitive) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isSearchValueArray(value: SearchValueInput): value is readonly SearchValueInput[] {
  return Array.isArray(value);
}

function flattenSearchValues(values: readonly SearchValueInput[]): SearchPrimitive[] {
  const flattened: SearchPrimitive[] = [];

  values.forEach((value) => {
    if (isSearchValueArray(value)) {
      flattened.push(...flattenSearchValues(value));
      return;
    }

    flattened.push(value);
  });

  return flattened;
}

function uniqueSearchValues(values: readonly SearchValueInput[]) {
  const unique = new Map<string, string>();

  flattenSearchValues(values).forEach((value) => {
    const displayValue = String(value ?? '').normalize('NFKC').trim();
    const normalizedValue = normalizeSearchText(displayValue);
    if (!normalizedValue || unique.has(normalizedValue)) return;
    unique.set(normalizedValue, displayValue);
  });

  return Array.from(unique.values());
}

export function createSearchDocument({
  id,
  collection,
  title,
  url,
  fields,
  tags = [],
}: SearchDocumentInput): SearchDocument {
  return {
    id,
    collection,
    title,
    url,
    fields: uniqueSearchValues([id, title, url, fields, getTagSearchValues(tags)]),
    tags: uniqueSearchValues([tags]),
  };
}

export function matchesQuery(query: string, values: readonly SearchValueInput[]) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return uniqueSearchValues(values).some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

export function matchesSearchDocument(query: string, document: SearchDocument | null | undefined) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  if (!document) return false;

  return document.fields.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

export function createRobotSearchDocument(robot: Robot, manufacturer?: Manufacturer) {
  return createSearchDocument({
    id: robot.slug,
    collection: 'robots',
    title: robot.nameJa ?? robot.name,
    url: `/robots/${robot.slug}`,
    tags: [
      robot.category,
      robot.deploymentStage,
      robot.buyerReadiness,
      robot.japanAvailability,
      ...robot.procurementModels,
    ],
    fields: [
      robot.nameJa,
      robot.name,
      manufacturer?.nameJa,
      manufacturer?.name,
      robot.manufacturerSlug,
      robot.summary,
      robot.description,
      robot.priceNote,
      robot.distributorJapan,
      robot.supportNote,
      robot.safetyNote,
      robot.vendorRiskNote,
      robotCategoryLabels[robot.category],
      deploymentStageLabels[robot.deploymentStage],
      buyerReadinessLabels[robot.buyerReadiness],
      japanAvailabilityLabels[robot.japanAvailability],
      robot.specs.mobility ? mobilityLabels[robot.specs.mobility] : undefined,
      robot.procurementModels.map((model) => procurementLabels[model]),
      robot.comparison.strengths,
      robot.comparison.constraints,
      robot.comparison.bestFit,
      robot.comparison.notFit,
    ],
  });
}

export function createManufacturerSearchDocument(
  manufacturer: Manufacturer,
  robotsForManufacturer: readonly Robot[] = [],
) {
  return createSearchDocument({
    id: manufacturer.slug,
    collection: 'manufacturers',
    title: manufacturer.nameJa ?? manufacturer.name,
    url: `/manufacturers/${manufacturer.slug}`,
    tags: [
      manufacturer.country,
      manufacturer.companyType,
      manufacturer.companyStatus,
      manufacturer.japanPresence,
    ],
    fields: [
      manufacturer.nameJa,
      manufacturer.name,
      manufacturer.country,
      manufacturer.hqCity,
      manufacturer.foundedYear,
      manufacturer.website,
      manufacturer.contactUrl,
      manufacturer.summary,
      manufacturer.description,
      manufacturer.distributorNote,
      manufacturer.supportNote,
      manufacturer.procurementNote,
      manufacturer.vendorRiskNote,
      companyTypeLabels[manufacturer.companyType],
      companyStatusLabels[manufacturer.companyStatus],
      japanPresenceLabels[manufacturer.japanPresence],
      robotsForManufacturer.map((robot) => [robot.nameJa, robot.name]),
    ],
  });
}

export function createReportSearchDocument(report: Report) {
  return createSearchDocument({
    id: report.slug,
    collection: 'reports',
    title: report.titleJa ?? report.title,
    url: `/reports/${report.slug}`,
    tags: report.tags,
    fields: [
      report.titleJa,
      report.title,
      report.summary,
      report.whyItMatters,
      report.author,
      report.publishedAt,
      reportTypeLabels[report.type],
      report.keyTakeaways,
    ],
  });
}

export function createGuideSearchDocument(guide: Guide) {
  return createSearchDocument({
    id: guide.slug,
    collection: 'guides',
    title: guide.titleJa ?? guide.title,
    url: `/guides/${guide.slug}`,
    tags: guide.topics,
    fields: [
      guide.titleJa,
      guide.title,
      guide.summary,
      guide.description,
      guide.targetReaders,
      guide.checklistItems,
      guide.updatedAt,
      guideStageLabels[guide.stage],
    ],
  });
}

export function createUseCaseSearchDocument(useCase: UseCase) {
  return createSearchDocument({
    id: useCase.slug,
    collection: 'useCases',
    title: useCase.titleJa ?? useCase.title,
    url: `/use-cases/${useCase.slug}`,
    tags: [...useCase.industryTags, ...useCase.taskTags],
    fields: [
      useCase.titleJa,
      useCase.title,
      useCase.subtitle,
      useCase.summary,
      useCase.overview,
      useCase.whyItMatters,
      useCase.environmentRequirements,
      useCase.whyHardToday,
      useCase.japanDeploymentConditions,
      maturityLabels[useCase.maturityLevel],
      buyerReadinessLabels[useCase.buyerReadiness],
      operatingEnvironmentLabels[useCase.environment],
      useCase.requiredCapabilities.map((capability) => capabilityLabels[capability]),
      Object.values(useCase.capabilityNotes),
    ],
  });
}
