import type { Manufacturer, Robot } from '@/data/types';
import { isPreReleaseDeploymentStage, japanAvailabilityOrder, sortByDisplayOrder, sortRobots } from '@/lib/display';
import { createRobotSearchDocument, matchesSearchDocument } from '@/lib/search';
import { getRobotIndustryTagOptions, getRobotTaskTagOptions, matchesTag, normalizeTagKey } from '@/lib/tags';
import { isOneOf } from '@/lib/typeGuards';

export function getRobotFilterOptions(robots: readonly Robot[]) {
  const availabilityValues = sortByDisplayOrder(
    Array.from(new Set(robots.map((robot) => robot.japanAvailability))),
    japanAvailabilityOrder,
  );

  return {
    industries: getRobotIndustryTagOptions(robots),
    tasks: getRobotTaskTagOptions(robots),
    availabilityValues,
  };
}

export function normalizeRobotFilters({
  industry,
  task,
  manufacturer,
  availability,
  release,
  query,
  manufacturers,
  industryValues,
  taskValues,
  availabilityValues,
}: {
  industry: string | null | undefined;
  task: string | null | undefined;
  manufacturer: string | null | undefined;
  availability: string | null | undefined;
  release: string | null | undefined;
  query: string | null | undefined;
  manufacturers: readonly Manufacturer[];
  industryValues: readonly string[];
  taskValues: readonly string[];
  availabilityValues: readonly Robot['japanAvailability'][];
}) {
  const manufacturerIds = new Set(manufacturers.map((item) => item.id));
  const normalizedIndustry = industry ? normalizeTagKey(industry) : null;
  const normalizedTask = task ? normalizeTagKey(task) : null;

  return {
    industry:
      normalizedIndustry && industryValues.includes(normalizedIndustry) ? normalizedIndustry : null,
    task: normalizedTask && taskValues.includes(normalizedTask) ? normalizedTask : null,
    manufacturer:
      manufacturer && manufacturerIds.has(manufacturer) ? manufacturer : 'all',
    availability: isOneOf(availability, availabilityValues) ? availability : 'all',
    release: release === 'pre' ? 'pre' : 'active',
    query: query ?? '',
  };
}

export function filterRobots({
  robots,
  manufacturers,
  filters,
}: {
  robots: readonly Robot[];
  manufacturers: readonly Manufacturer[];
  filters: ReturnType<typeof normalizeRobotFilters>;
}) {
  const manufacturerById = new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]));
  const searchDocuments = new Map(
    robots.map((robot) => [
      robot.slug,
      createRobotSearchDocument(robot, manufacturerById.get(robot.manufacturerId)),
    ]),
  );

  const filtered = robots.filter((robot) => {
    if (!matchesTag(robot.industryTags ?? [], filters.industry)) return false;
    if (!matchesTag(robot.taskTags ?? [], filters.task)) return false;
    if (filters.manufacturer !== 'all' && robot.manufacturerId !== filters.manufacturer) return false;
    if (filters.availability !== 'all' && robot.japanAvailability !== filters.availability) return false;
    return matchesSearchDocument(filters.query, searchDocuments.get(robot.slug));
  });

  const releaseCandidates = sortRobots([...filtered], 'name', manufacturers);
  const activeRobots = releaseCandidates.filter(
    (robot) => !isPreReleaseDeploymentStage(robot.deploymentStage),
  );
  const preReleaseRobots = releaseCandidates.filter((robot) =>
    isPreReleaseDeploymentStage(robot.deploymentStage),
  );

  return {
    activeRobots,
    preReleaseRobots,
    filtered: filters.release === 'active' ? activeRobots : preReleaseRobots,
  };
}
