import type { Guide, Article, Robot, UseCase } from '@/data/types';
import {
  getAnyRegisteredTag,
  getRegisteredTag,
  getTagDisplayIndex,
  normalizeTagKey,
  type TagKind,
} from '@/lib/tagRegistry';

export { normalizeTagKey, type TagKind };

export interface TagOption {
  value: string;
  label: string;
  kind: TagKind;
  count: number;
}

export function getTagLabel(value: string, kind?: TagKind) {
  if (kind) return getRegisteredTag(kind, value)?.label ?? value.trim();
  return getAnyRegisteredTag(value)?.label ?? value.trim();
}

export function matchesTag(values: readonly string[], selected: string | null | undefined) {
  if (!selected) return true;
  const selectedKey = normalizeTagKey(selected);
  return values.some((value) => normalizeTagKey(value) === selectedKey);
}

export function getTagSearchValues(values: readonly string[], kind?: TagKind) {
  const searchValues = new Set<string>();
  values.forEach((value) => {
    const label = getTagLabel(value, kind);
    const key = normalizeTagKey(value);
    if (label) searchValues.add(label);
    if (key) searchValues.add(key);
  });
  return Array.from(searchValues);
}

function toTagOptions(values: readonly string[], kind: TagKind): TagOption[] {
  const options = new Map<string, TagOption>();

  values.forEach((value) => {
    const key = normalizeTagKey(value);
    if (!key) return;
    const existing = options.get(key);

    if (existing) {
      existing.count += 1;
      return;
    }

    options.set(key, {
      value: key,
      label: getTagLabel(value, kind),
      kind,
      count: 1,
    });
  });

  return Array.from(options.values()).sort((a, b) => {
    const orderDiff = getTagDisplayIndex(kind, a.value) - getTagDisplayIndex(kind, b.value);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label, 'ja');
  });
}

export function getArticleTagOptions(reports: readonly Article[]) {
  return toTagOptions(
    reports.flatMap((report) => report.tags),
    'article',
  );
}

export function getGuideTopicOptions(guides: readonly Guide[]) {
  return toTagOptions(
    guides.flatMap((guide) => guide.topics),
    'guide-topic',
  );
}

export function getUseCaseIndustryTagOptions(useCases: readonly UseCase[]) {
  return toTagOptions(
    useCases.flatMap((useCase) => useCase.industryTags),
    'industry',
  );
}

export function getUseCaseTaskTagOptions(useCases: readonly UseCase[]) {
  return toTagOptions(
    useCases.flatMap((useCase) => useCase.taskTags),
    'task',
  );
}

export function getRobotIndustryTagOptions(robots: readonly Robot[]) {
  return toTagOptions(
    robots.flatMap((robot) => robot.industryTags ?? []),
    'industry',
  );
}

export function getRobotTaskTagOptions(robots: readonly Robot[]) {
  return toTagOptions(
    robots.flatMap((robot) => robot.taskTags ?? []),
    'task',
  );
}

export function getAllTagOptions({
  reports,
  guides,
  useCases,
}: {
  reports?: readonly Article[];
  guides?: readonly Guide[];
  useCases?: readonly UseCase[];
}) {
  return [
    ...(reports ? getArticleTagOptions(reports) : []),
    ...(guides ? getGuideTopicOptions(guides) : []),
    ...(useCases ? getUseCaseIndustryTagOptions(useCases) : []),
    ...(useCases ? getUseCaseTaskTagOptions(useCases) : []),
  ];
}
