import { deployments } from '@/data/deployments';
import { manufacturers } from '@/data/manufacturers';
import { articles } from '@/data/articles';
import { robots } from '@/data/robots';
import { useCases } from '@/data/useCases';
import { runValidationInDev } from './validate';
import { byArticlePublishedDesc } from '@/lib/display';

// dev時のみ：参照整合（存在しないid参照・双方向のズレ・id/slug重複）をconsoleで通知
runValidationInDev();

// 識別子の使い分け（設計: data-architecture-redesign-v1 §3）:
// - 参照（*Id / *Ids）・お気に入り・比較は不変の id で解決する（get*ById / *For* 系）
// - 公開URLのパス解決のみ可変の slug を使う（get*BySlug 系）

const published = <T extends { publishStatus: string }>(items: T[]) =>
  items.filter((item) => item.publishStatus === 'published');

// archived は「提供終了」として詳細・関連欄に残す（無言で消さない。設計 §6.5-1）。
// draft はどのサーフェスにも出さない。一覧・比較・sitemap は published のみ。
const visibleInDetail = <T extends { publishStatus: string }>(items: T[]) =>
  items.filter(
    (item) => item.publishStatus === 'published' || item.publishStatus === 'archived',
  );

export interface SlugResolution<T> {
  record?: T;
  /** previousSlugs にヒットした場合の正規slug。呼び出し側（詳細ページ）が301する（設計 §3-3） */
  redirectTo?: string;
}

const resolveBySlug = <T extends { slug: string; previousSlugs?: string[] }>(
  records: T[],
  slug: string,
): SlugResolution<T> => {
  const record = records.find((item) => item.slug === slug);
  if (record) return { record };
  const moved = records.find((item) => item.previousSlugs?.includes(slug));
  return moved ? { redirectTo: moved.slug } : {};
};

export function getRobots() {
  return published(robots);
}

/** 詳細ページの対象（published + archived）。一覧・比較には使わない */
export function getRobotsForDetail() {
  return visibleInDetail(robots);
}

export function resolveRobotDetailBySlug(slug: string) {
  return resolveBySlug(getRobotsForDetail(), slug);
}

export function resolveManufacturerDetailBySlug(slug: string) {
  return resolveBySlug(getManufacturers(), slug);
}

export function resolveUseCaseDetailBySlug(slug: string) {
  return resolveBySlug(getUseCases(), slug);
}

export function resolveArticleDetailBySlug(slug: string) {
  return resolveBySlug(getArticles(), slug);
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

export function getDeploymentById(id: string) {
  return getDeployments().find((deployment) => deployment.id === id);
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
  return published(articles).sort(byArticlePublishedDesc);
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
  return getUseCases().filter((useCase) => useCase.candidateRobots.some((c) => c.robotId === robotId));
}

export function getDeploymentsForUseCase(useCaseId: string) {
  return getDeployments().filter((deployment) => deployment.relatedUseCaseIds?.includes(useCaseId));
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

function resolveRecordsByIds<T extends { id: string }>(ids: readonly string[], records: readonly T[]) {
  const recordById = new Map(records.map((record) => [record.id, record]));
  // ids の並び順を保持する（呼び出し側が編集判断で並べている関連優先度）。
  return ids
    .map((id) => recordById.get(id))
    .filter((record): record is NonNullable<typeof record> => record !== undefined);
}

export function getRelatedRobots(ids: string[]) {
  // archived も返す（関連欄から無言脱落させない。表示側が「提供終了」を付ける。設計 §6.5-1）
  return resolveRecordsByIds(ids, getRobotsForDetail());
}

export function getRelatedManufacturers(ids: string[]) {
  return resolveRecordsByIds(ids, getManufacturers());
}

export function getRelatedUseCases(ids: string[]) {
  return resolveRecordsByIds(ids, getUseCases());
}
