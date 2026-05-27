import { guides } from '@/data/guides';
import { manufacturers } from '@/data/manufacturers';
import { reports } from '@/data/reports';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';

const published = <T extends { publishStatus: string }>(items: T[]) =>
  items.filter((item) => item.publishStatus === 'published');

export function getRobots() {
  return published(robots);
}

export function getRobotBySlug(slug: string) {
  return getRobots().find((robot) => robot.slug === slug);
}

export function getManufacturers() {
  return published(manufacturers);
}

export function getManufacturerBySlug(slug: string) {
  return getManufacturers().find((manufacturer) => manufacturer.slug === slug);
}

export function getGuides() {
  return published(guides).sort((a, b) => a.order - b.order);
}

export function getGuideBySlug(slug: string) {
  return getGuides().find((guide) => guide.slug === slug);
}

export function getUseCases() {
  return published(useCases);
}

export function getUseCaseBySlug(slug: string) {
  return getUseCases().find((useCase) => useCase.slug === slug);
}

export function getReports() {
  return published(reports).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getReportBySlug(slug: string) {
  return getReports().find((report) => report.slug === slug);
}

export function getRobotsByManufacturerSlug(slug: string) {
  return getRobots().filter((robot) => robot.manufacturerSlug === slug);
}

export function getUseCasesForRobot(slug: string) {
  return getUseCases().filter((useCase) => useCase.candidateRobotSlugs.includes(slug));
}

export function getReportsForRobot(slug: string) {
  return getReports().filter((report) => report.relatedRobotSlugs.includes(slug));
}

export function getReportsForUseCase(slug: string) {
  return getReports().filter((report) => report.relatedUseCaseSlugs.includes(slug));
}

export function getReportsForManufacturer(slug: string) {
  return getReports().filter((report) => report.relatedManufacturerSlugs.includes(slug));
}

export function getManufacturerForRobot(manufacturerSlug: string) {
  return getManufacturerBySlug(manufacturerSlug);
}

export function getRelatedRobots(slugs: string[]) {
  const slugSet = new Set(slugs);
  return getRobots().filter((robot) => slugSet.has(robot.slug));
}

export function getRelatedManufacturers(slugs: string[]) {
  const slugSet = new Set(slugs);
  return getManufacturers().filter((manufacturer) => slugSet.has(manufacturer.slug));
}

export function getRelatedUseCases(slugs: string[]) {
  const slugSet = new Set(slugs);
  return getUseCases().filter((useCase) => slugSet.has(useCase.slug));
}

export function getRelatedGuides(slugs: string[]) {
  const slugSet = new Set(slugs);
  return getGuides().filter((guide) => slugSet.has(guide.slug));
}
