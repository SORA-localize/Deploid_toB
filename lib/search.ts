import type { Guide, Manufacturer, Article, Robot, UseCase } from '@/data/types';
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
  articleTypeLabels,
  robotCategoryLabels,
  capabilityLabels,
  maturityLabels,
} from '@/lib/labels';
import { getTagLabel, getTagSearchValues, normalizeTagKey, type TagKind } from '@/lib/tags';

export type SearchCollection = 'robots' | 'manufacturers' | 'reports' | 'guides' | 'useCases';
export type SearchPrimitive = string | number | null | undefined;
export type SearchValueInput = SearchPrimitive | readonly SearchValueInput[];

export interface SearchDocument {
  id: string;
  collection: SearchCollection;
  title: string;
  url: string;
  fields: string[];
  tags: SearchDocumentTag[];
}

export interface SearchDocumentTag {
  value: string;
  label: string;
  kind?: TagKind;
  searchValues: string[];
}

export type SearchDocumentTagInput = string | { value: string; kind?: TagKind };

interface SearchDocumentInput {
  id: string;
  collection: SearchCollection;
  title: string;
  url: string;
  fields: readonly SearchValueInput[];
  tags?: readonly SearchDocumentTagInput[];
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

function getSearchDocumentTagValue(tag: SearchDocumentTagInput) {
  return typeof tag === 'string' ? tag : tag.value;
}

function getSearchDocumentTagKind(tag: SearchDocumentTagInput) {
  return typeof tag === 'string' ? undefined : tag.kind;
}

function getSearchDocumentTagSearchValues(tags: readonly SearchDocumentTagInput[]) {
  return tags.flatMap((tag) =>
    getTagSearchValues([getSearchDocumentTagValue(tag)], getSearchDocumentTagKind(tag)),
  );
}

function createSearchDocumentTags(tags: readonly SearchDocumentTagInput[]) {
  const searchTags = new Map<string, SearchDocumentTag>();

  tags.forEach((tag) => {
    const rawValue = getSearchDocumentTagValue(tag);
    const kind = getSearchDocumentTagKind(tag);
    const value = normalizeTagKey(rawValue);
    const key = `${kind ?? 'any'}:${value}`;
    if (!value || searchTags.has(key)) return;

    const label = getTagLabel(rawValue, kind);
    searchTags.set(key, {
      value,
      label,
      kind,
      searchValues: uniqueSearchValues([value, label]),
    });
  });

  return Array.from(searchTags.values());
}

export function createSearchDocument({
  id,
  collection,
  title,
  url,
  fields,
  tags = [],
}: SearchDocumentInput): SearchDocument {
  const searchTags = createSearchDocumentTags(tags);

  return {
    id,
    collection,
    title,
    url,
    fields: uniqueSearchValues([id, title, fields, getSearchDocumentTagSearchValues(tags)]),
    tags: searchTags,
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
      ...(robot.industryTags ?? []).map((value) => ({ value, kind: 'industry' as const })),
      ...(robot.taskTags ?? []).map((value) => ({ value, kind: 'task' as const })),
    ],
    fields: [
      robot.nameJa,
      robot.name,
      manufacturer?.nameJa,
      manufacturer?.name,
      robot.manufacturerId,
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
      manufacturer.domesticDistributors?.map((distributor) => [
        distributor.name,
        distributor.website,
        distributor.note,
      ]),
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

export function createReportSearchDocument(report: Article) {
  return createSearchDocument({
    id: report.slug,
    collection: 'reports',
    title: report.titleJa ?? report.title,
    url: `/reports/${report.slug}`,
    tags: report.tags.map((value) => ({ value, kind: 'article' as const })),
    fields: [
      report.titleJa,
      report.title,
      report.summary,
      report.whyItMatters,
      report.author,
      report.publishedAt,
      articleTypeLabels[report.type],
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
    tags: guide.topics.map((value) => ({ value, kind: 'guide-topic' as const })),
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
    tags: [
      ...useCase.industryTags.map((value) => ({ value, kind: 'industry' as const })),
      ...useCase.taskTags.map((value) => ({ value, kind: 'task' as const })),
    ],
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
