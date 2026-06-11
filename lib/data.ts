import { deployments } from '@/data/deployments';
import { guides } from '@/data/guides';
import { manufacturers } from '@/data/manufacturers';
import { articles } from '@/data/articles';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';
import { runValidationInDev } from './validate';

// dev時のみ：参照整合（存在しないid参照・双方向のズレ・id/slug重複）をconsoleで通知
runValidationInDev();

// 識別子の使い分け（設計: data-architecture-redesign-v1 §3）:
// - 参照（*Id / *Ids）・お気に入り・比較は不変の id で解決する（get*ById / *For* 系）
// - 公開URLのパス解決のみ可変の slug を使う（get*BySlug 系）

const published = <T extends { publishStatus: string }>(items: T[]) =>
  items.filter((item) => item.publishStatus === 'published');

export function getRobots() {
  return published(robots);
}

export function getRobotBySlug(slug: string) {
  return getRobots().find((robot) => robot.slug === slug);
}

export function getRobotById(id: string) {
  return getRobots().find((robot) => robot.id === id);
}

export function getManufacturers() {
  return published(manufacturers);
}

export function getDeployments() {
  return published(deployments);
}

export function getDeploymentsForManufacturer(manufacturerId: string) {
  return getDeployments().filter((deployment) => deployment.manufacturerId === manufacturerId);
}

export function getManufacturerBySlug(slug: string) {
  return getManufacturers().find((manufacturer) => manufacturer.slug === slug);
}

export function getManufacturerById(id: string) {
  return getManufacturers().find((manufacturer) => manufacturer.id === id);
}

export function getGuides() {
  return published(guides).sort((a, b) => a.order - b.order);
}

export function getGuideBySlug(slug: string) {
  return getGuides().find((guide) => guide.slug === slug);
}

export function getGuideById(id: string) {
  return getGuides().find((guide) => guide.id === id);
}

export function getUseCases() {
  return published(useCases);
}

export function getUseCaseBySlug(slug: string) {
  return getUseCases().find((useCase) => useCase.slug === slug);
}

export function getUseCaseById(id: string) {
  return getUseCases().find((useCase) => useCase.id === id);
}

export function getArticles() {
  return published(articles).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticleBySlug(slug: string) {
  return getArticles().find((article) => article.slug === slug);
}

export function getArticleById(id: string) {
  return getArticles().find((article) => article.id === id);
}

export function getRobotsByManufacturerId(manufacturerId: string) {
  return getRobots().filter((robot) => robot.manufacturerId === manufacturerId);
}

export function getUseCasesForRobot(robotId: string) {
  return getUseCases().filter((useCase) => useCase.candidateRobotIds.includes(robotId));
}

export function getArticlesForRobot(robotId: string) {
  return getArticles().filter((article) => article.relatedRobotIds.includes(robotId));
}

export function getArticlesForUseCase(useCaseId: string) {
  return getArticles().filter((article) => article.relatedUseCaseIds.includes(useCaseId));
}

export function getArticlesForManufacturer(manufacturerId: string) {
  return getArticles().filter((article) => article.relatedManufacturerIds.includes(manufacturerId));
}

export function getManufacturerForRobot(manufacturerId: string) {
  return getManufacturerById(manufacturerId);
}

export function getRelatedRobots(ids: string[]) {
  const idSet = new Set(ids);
  return getRobots().filter((robot) => idSet.has(robot.id));
}

export function getRelatedManufacturers(ids: string[]) {
  const idSet = new Set(ids);
  return getManufacturers().filter((manufacturer) => idSet.has(manufacturer.id));
}

export function getRelatedUseCases(ids: string[]) {
  const idSet = new Set(ids);
  return getUseCases().filter((useCase) => idSet.has(useCase.id));
}

export function getRelatedGuides(ids: string[]) {
  const idSet = new Set(ids);
  return getGuides().filter((guide) => idSet.has(guide.id));
}
