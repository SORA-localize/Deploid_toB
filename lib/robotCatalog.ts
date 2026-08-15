import type {
  Manufacturer,
  ManufacturerGuideContent,
  Robot,
  RobotPriceOffer,
  Source,
  UseCase,
} from '@/lib/content/domainTypes';
import { sortRobots, sortUseCases } from '@/lib/display';
import {
  EMPTY_VALUE_LABEL,
  specGroupLabels,
} from '@/lib/labels';
import {
  formatNumber,
  formatRobotLoadRatings,
  formatRuntime,
  formatSpecValue,
  getRobotDimensionsSummary,
} from '@/lib/robotDisplay';
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
  'hand',
  'power-runtime',
  'operation-development',
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
  const dimensions = getRobotDimensionsSummary(robot);
  const dimensionsRow: RobotFactRow = {
    key: 'dimensions',
    label: '寸法',
    value: dimensions.value,
    valueKind: dimensions.hasData ? 'number' : 'empty',
    sourceUrls: dimensions.sourceUrls,
  };

  const keys = ['weightKg', 'runtimeMin', 'mobility'] as const;
  const otherRows = keys.map((key) => {
    const value = formatSpecValue(robot.specs, key);
    return {
      key,
      label: specSchema.find((entry) => entry.key === key)!.label,
      value,
      valueKind: factValueKind(value, key !== 'mobility'),
      sourceUrls: robot.fieldEvidence?.[key],
    };
  });

  return [dimensionsRow, ...otherRows];
}

export function getRobotSpecGroups(robot: Robot): RobotSpecGroupView[] {
  const rowsByGroup = new Map<SpecGroup, RobotFactRow[]>(
    specGroupOrder.map((group) => [group, []]),
  );

  const dimensions = getRobotDimensionsSummary(robot);

  specSchema.forEach((entry) => {
    if (entry.key === 'heightCm' || entry.key === 'widthCm' || entry.key === 'depthCm') return;
    const value = formatSpecValue(robot.specs, entry.key);
    rowsByGroup.get(entry.group)!.push({
      key: entry.key,
      label: entry.label,
      value,
      valueKind: factValueKind(value, entry.kind === 'number' || entry.kind === 'runtime'),
      sourceUrls: robot.fieldEvidence?.[entry.key],
    });
    // 「寸法」は移動方式の直後に表示する（合意済みの並び順: 移動方式→寸法→重量→...）
    if (entry.key === 'mobility') {
      rowsByGroup.get('body-motion')!.push({
        key: 'dimensions',
        label: '寸法',
        value: dimensions.value,
        valueKind: dimensions.hasData ? 'number' : 'empty',
        sourceUrls: dimensions.sourceUrls,
      });
    }
  });

  {
    const hasLoadRatings = (robot.loadRatings?.length ?? 0) > 0;
    rowsByGroup.get('body-motion')!.push({
      key: 'loadRatings',
      label: '可搬重量',
      value: hasLoadRatings ? formatRobotLoadRatings(robot.loadRatings!) : EMPTY_VALUE_LABEL,
      valueKind: hasLoadRatings ? 'number' : 'empty',
      sourceUrls: hasLoadRatings ? unique(robot.loadRatings!.map((load) => load.sourceUrl)) : undefined,
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

export interface ManufacturerGuideLineupDisplayRow {
  name: string;
  href: string;
  /** カード横スクロールとの対応付けキー（Robot.slug が正本）。 */
  robotSlug: string;
  roleLabel: string;
  price: RobotPriceView;
}

/**
 * メーカー解説のラインナップ表を表示用に解決する。機体名・リンク・価格はRobotが正本、位置づけだけ記事編集。
 * `robots` はページ側があらかじめ `repository.listRelatedRobots(lineup.map(r => r.robotId))` 等で
 * 解決済みのものを渡す（このモジュール自身はrepositoryへ到達しない）。
 */
export function resolveManufacturerGuideLineup(
  content: ManufacturerGuideContent,
  robots: readonly Robot[],
): ManufacturerGuideLineupDisplayRow[] {
  const robotById = new Map(robots.map((robot) => [robot.id, robot]));
  return content.lineup.flatMap((row) => {
    const robot = robotById.get(row.robotId);
    if (!robot) return []; // 存在チェックは validate 側で担保。非公開化された場合は行ごと落とす
    return [
      {
        name: robot.nameJa ?? robot.name,
        href: `/robots/${robot.slug}`,
        robotSlug: robot.slug,
        roleLabel: row.roleLabel,
        price: resolveRobotPrice(robot),
      },
    ];
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
