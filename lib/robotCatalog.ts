import type {
  Manufacturer,
  Robot,
  RobotLoadRating,
  RobotPriceOffer,
  Source,
  UseCase,
} from '@/data/types';
import { sortRobots, sortUseCases } from '@/lib/display';
import {
  EMPTY_VALUE_LABEL,
  robotLoadRatingLabels,
  robotLoadScopeLabels,
  specGroupLabels,
} from '@/lib/labels';
import { formatNumber, formatRuntime, formatSpecValue } from '@/lib/robotDisplay';
import { specSchema, type SpecGroup } from '@/lib/specSchema';
import { uiText } from '@/lib/uiText';

export type FactValueKind = 'number' | 'text' | 'empty';

export interface RobotFactRow {
  key: string;
  label: string;
  value: string;
  valueKind: FactValueKind;
  sourceUrls?: string[];
}

export interface RobotCardFact extends RobotFactRow {
  href?: string;
}

export interface RobotCardViewModel {
  robotId: string;
  facts: [RobotCardFact, RobotCardFact, RobotCardFact, RobotCardFact];
}

export interface RobotPriceView {
  kind: 'offer' | 'contact';
  label: string;
  offer?: RobotPriceOffer;
  href?: string;
  sourceUrl?: string;
}

export interface RobotUseCaseView {
  id: string;
  label: string;
  href: string;
  evidenceSourceUrls: string[];
}

export interface RobotSpecGroupView {
  key: SpecGroup;
  label: string;
  rows: RobotFactRow[];
}

export interface RobotUsageExampleView {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
}

const priceChannelPriority: Record<RobotPriceOffer['channel'], number> = {
  'manufacturer-public': 0,
  'authorized-distributor-public': 1,
};

const specGroupOrder: SpecGroup[] = [
  'body-motion',
  'power-runtime',
  'operation-development',
  'environment-safety',
];

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function factValueKind(value: string, numeric: boolean): FactValueKind {
  if (value === EMPTY_VALUE_LABEL) return 'empty';
  return numeric ? 'number' : 'text';
}

export function resolveRobotPrice(robot: Robot): RobotPriceView {
  const offer = [...(robot.priceOffers ?? [])].sort(
    (a, b) => priceChannelPriority[a.channel] - priceChannelPriority[b.channel],
  )[0];

  if (offer) {
    return {
      kind: 'offer',
      label: offer.display,
      offer,
      sourceUrl: offer.sourceUrl,
    };
  }

  return {
    kind: 'contact',
    label: uiText.common.contact,
    href: '/contact',
  };
}

export function resolveOfficialUseCasesForRobot(
  robotId: string,
  useCases: readonly UseCase[],
): RobotUseCaseView[] {
  return sortUseCases(
    useCases.filter((useCase) =>
      useCase.publishStatus === 'published' &&
      useCase.candidateRobots.some(
        (candidate) =>
          candidate.robotId === robotId &&
          candidate.basis === 'official-use-case' &&
          (candidate.evidenceSourceUrls?.length ?? 0) > 0,
      ),
    ),
  ).map((useCase) => {
    const relation = useCase.candidateRobots.find(
      (candidate) =>
        candidate.robotId === robotId &&
        candidate.basis === 'official-use-case' &&
        (candidate.evidenceSourceUrls?.length ?? 0) > 0,
    )!;
    return {
      id: useCase.id,
      label: useCase.titleJa ?? useCase.title,
      href: `/use-cases/${useCase.slug}`,
      evidenceSourceUrls: unique(relation.evidenceSourceUrls ?? []),
    };
  });
}

export function formatRobotSize(robot: Robot) {
  const { heightCm, weightKg } = robot.specs;
  if (heightCm == null && weightKg == null) return EMPTY_VALUE_LABEL;
  return `${formatNumber(heightCm, 'cm')} / ${formatNumber(weightKg, 'kg')}`;
}

export function createRobotCardViewModel(
  robot: Robot,
  useCases: readonly UseCase[],
): RobotCardViewModel {
  const officialUseCases = resolveOfficialUseCasesForRobot(robot.id, useCases);
  const primaryUseCase = officialUseCases[0];
  const useCaseValue = primaryUseCase
    ? `${primaryUseCase.label}${officialUseCases.length > 1 ? ` / ほか${officialUseCases.length - 1}件` : ''}`
    : EMPTY_VALUE_LABEL;
  const price = resolveRobotPrice(robot);
  const runtime = formatRuntime(robot.specs.runtimeMin);
  const size = formatRobotSize(robot);

  return {
    robotId: robot.id,
    facts: [
      {
        key: 'use-case',
        label: uiText.robots.cardFacts.useCase,
        value: useCaseValue,
        valueKind: factValueKind(useCaseValue, false),
      },
      {
        key: 'size',
        label: uiText.robots.cardFacts.size,
        value: size,
        valueKind: factValueKind(size, true),
      },
      {
        key: 'price',
        label: uiText.robots.cardFacts.price,
        value: price.label,
        valueKind: 'text',
        href: price.href,
        sourceUrls: price.sourceUrl ? [price.sourceUrl] : undefined,
      },
      {
        key: 'runtime',
        label: uiText.robots.cardFacts.runtime,
        value: runtime,
        valueKind: factValueKind(runtime, true),
        sourceUrls: robot.fieldEvidence?.runtimeMin,
      },
    ],
  };
}

export function createRobotCardViewModels(
  robots: readonly Robot[],
  useCases: readonly UseCase[],
): Record<string, RobotCardViewModel> {
  return Object.fromEntries(
    robots.map((robot) => [robot.id, createRobotCardViewModel(robot, useCases)]),
  );
}

export function getRobotBasicFacts(robot: Robot): RobotFactRow[] {
  const keys = ['heightCm', 'weightKg', 'runtimeMin', 'mobility'] as const;
  return keys.map((key) => {
    const value = formatSpecValue(robot.specs, key);
    return {
      key,
      label: specSchema.find((entry) => entry.key === key)!.label,
      value,
      valueKind: factValueKind(value, key !== 'mobility'),
      sourceUrls: robot.fieldEvidence?.[key],
    };
  });
}

function formatLoadKg(kg: number) {
  const displayValue = Number.isInteger(kg) ? kg : Math.round(kg * 10) / 10;
  return `${displayValue}kg`;
}

function formatLoadVariant(variant: string) {
  const dofArms = variant.match(/(\d+)\s*DoF\s*arms?/i);
  return dofArms ? `${dofArms[1]}DoF腕` : variant;
}

function formatLoadCondition(condition?: string) {
  if (!condition) return undefined;
  if (/Sustained weight capacity|持続/i.test(condition)) return '持続';
  if (/Instant weight capacity|瞬間/i.test(condition)) return '瞬間';
  if (/特定姿勢/.test(condition)) return '特定姿勢';
  if (/全作業域/.test(condition)) return '全作業域';
  return undefined;
}

function formatLoadScope(load: RobotLoadRating) {
  if (load.scope === 'carrier') return '運搬';
  return load.scope === 'manufacturer-wording'
    ? undefined
    : robotLoadScopeLabels[load.scope];
}

function formatLoadRatingKind(load: RobotLoadRating) {
  return load.rating === 'unspecified'
    ? undefined
    : robotLoadRatingLabels[load.rating];
}

function formatSingleLoadRating(load: RobotLoadRating) {
  return [
    formatLoadCondition(load.condition),
    formatLoadScope(load),
    formatLoadRatingKind(load),
    formatLoadKg(load.kg),
  ].filter(Boolean).join('');
}

function formatPublishedLoadRange(load: RobotLoadRating) {
  const range = load.condition?.match(/約?\s*(\d+(?:\.\d+)?)\s*[～〜]\s*(\d+(?:\.\d+)?)\s*kg/i);
  return range ? `約${range[1]}〜${range[2]}kg` : undefined;
}

function formatLoadGroup(
  loads: readonly RobotLoadRating[],
  separator = ' / ',
) {
  if (loads.length === 1) {
    const publishedRange = formatPublishedLoadRange(loads[0]);
    if (publishedRange) return publishedRange;
  }

  const scopes = new Set(loads.map((load) => load.scope));
  const ratings = new Set(loads.map((load) => load.rating));
  const hasRangeBounds = loads.length === 2
    && scopes.size === 1
    && ratings.size === 1
    && loads.some((load) => /下限/.test(load.condition ?? ''))
    && loads.some((load) => /上限/.test(load.condition ?? ''));

  if (hasRangeBounds) {
    const [minimum, maximum] = [...loads].sort((a, b) => a.kg - b.kg);
    return [
      formatLoadScope(minimum),
      formatLoadRatingKind(minimum),
      `${formatLoadKg(minimum.kg).replace(/kg$/, '')}〜${formatLoadKg(maximum.kg)}`,
    ].filter(Boolean).join('');
  }

  const allSameScope = scopes.size === 1;
  const allHaveDistinctConditions = loads.length > 1
    && loads.every((load) => formatLoadCondition(load.condition));

  if (allSameScope && !allHaveDistinctConditions) {
    const [first] = loads;
    const sortedLoads = [...loads].sort((a, b) => {
      const ratingPriority = { rated: 0, maximum: 1, unspecified: 2 } as const;
      return ratingPriority[a.rating] - ratingPriority[b.rating];
    });
    const values = sortedLoads.map((load) => [
      formatLoadRatingKind(load),
      formatLoadKg(load.kg),
    ].filter(Boolean).join(''));
    const scope = formatLoadScope(first);
    return `${scope ? `${scope}${loads.length > 1 ? '：' : ''}` : ''}${values.join(separator)}`;
  }

  return loads.map(formatSingleLoadRating).join(separator);
}

function formatRobotLoadRatings(loads: readonly RobotLoadRating[]) {
  const groups = new Map<string, RobotLoadRating[]>();
  loads.forEach((load) => {
    const key = load.variant ?? '';
    const group = groups.get(key) ?? [];
    group.push(load);
    groups.set(key, group);
  });

  const showVariants = groups.size > 1;
  return [...groups.entries()].map(([variant, group]) => {
    const value = formatLoadGroup(group, showVariants ? '・' : ' / ');
    return showVariants && variant
      ? `${formatLoadVariant(variant)}：${value}`
      : value;
  }).join(' / ');
}

export function getRobotSpecGroups(robot: Robot): RobotSpecGroupView[] {
  const rowsByGroup = new Map<SpecGroup, RobotFactRow[]>(
    specGroupOrder.map((group) => [group, []]),
  );

  specSchema.forEach((entry) => {
    if (entry.key === 'payloadKg') return;
    const raw = robot.specs[entry.key];
    if (raw == null || raw === '') return;
    const value = formatSpecValue(robot.specs, entry.key);
    rowsByGroup.get(entry.group)!.push({
      key: entry.key,
      label: entry.label,
      value,
      valueKind: factValueKind(value, entry.kind === 'number' || entry.kind === 'runtime'),
      sourceUrls: robot.fieldEvidence?.[entry.key],
    });
  });

  if ((robot.loadRatings?.length ?? 0) > 0) {
    rowsByGroup.get('body-motion')!.push({
      key: 'loadRatings',
      label: '荷重',
      value: formatRobotLoadRatings(robot.loadRatings!),
      valueKind: 'number',
      sourceUrls: unique(robot.loadRatings!.map((load) => load.sourceUrl)),
    });
  }

  return specGroupOrder.map((key) => ({
    key,
    label: specGroupLabels[key],
    rows: rowsByGroup.get(key)!,
  }));
}

export function resolveRobotUsageExamples(
  robot: Robot,
): RobotUsageExampleView[] {
  const sourceByUrl = new Map<string, Source>(
    robot.sources.map((source) => [source.url, source]),
  );

  return (robot.usageExampleSourceUrls ?? []).flatMap((url) => {
    const source = sourceByUrl.get(url);
    return source
      ? [{ title: source.title, url, publisher: source.publisher, publishedAt: source.publishedAt }]
      : [];
  });
}

export function resolveSameManufacturerRobots(
  robot: Robot,
  robots: readonly Robot[],
  manufacturers: readonly Manufacturer[] = [],
) {
  return sortRobots(
    robots.filter(
      (candidate) =>
        candidate.id !== robot.id &&
        candidate.manufacturerId === robot.manufacturerId &&
        candidate.publishStatus === 'published',
    ),
    'featured',
    manufacturers,
  ).slice(0, 8);
}
