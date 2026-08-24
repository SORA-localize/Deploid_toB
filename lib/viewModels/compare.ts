import type {
  ComparisonProfile,
  DeploymentStage,
  Id,
  ImageAsset,
  ImageRole,
  JapanAvailability,
  JapanPresence,
  Manufacturer,
  ManufacturerLogos,
  ProcurementModel,
  Robot,
  RobotFieldEvidence,
  RobotLoadRating,
  RobotSpecs,
  Slug,
} from '@/lib/content/domainTypes';

/**
 * `/compare` 専用のview model（Task 6 fix round 3: `CompareRobot`/`CompareManufacturer`を
 * 値だけ空にする方式（round 2）から、返り値の型自体を縮小する本物のview model化への作り替え）。
 *
 * round 2の `toCompareRobot()`（値を空にするが型は`Robot`のまま）は、コンパイラによる保護が
 * 効かなかった（`sources`等の未使用fieldを新たに参照しても型検査で検出できない）。
 * ここでは`CompareClient`以下の全コンポーネント（`ComparisonRobotPanel.tsx` /
 * `components/compare/CompareParts.tsx` / `FavoriteCard.tsx` / `SortableCompareCard.tsx`）と、
 * `lib/robotDisplay.ts`の比較専用関数（`getComparisonSpecGroups`とその内部関数）を実際に
 * 読んで確定したfieldだけを持つ、他の`lib/viewModels/*.ts`と同じ意味でのview modelにする。
 *
 * `featuredRank` / `updatedAt` は比較UI自体（現状は`sortRobots(..., 'name', ...)`だけを呼ぶ）は
 * 使わないが、`sortRobots`（`lib/display.ts`。`/robots`等とも共有するgeneric化されたsort
 * utility）のgeneric制約を満たすために持つ。TypeScriptは実行時にどのsort分岐が選ばれるかで
 * 制約を絞れないため、関数シグネチャ全体が要求するfield集合を満たす必要がある。
 */
export interface CompareRobotViewModel {
  id: Id;
  slug: Slug;
  name: string;
  nameJa?: string;
  manufacturerId: Id;
  comparison: ComparisonProfile;
  specs: RobotSpecs;
  loadRatings?: RobotLoadRating[];
  japanAvailability: JapanAvailability;
  deploymentStage: DeploymentStage;
  procurementModels: ProcurementModel[];
  /** `robot.priceOffers`は`.length`（価格公開の有無）だけが比較UIで読まれるため真偽値へ変換する。 */
  hasPriceOffers: boolean;
  /**
   * `lib/robotDisplay.ts`の`getRobotDimensionsSummary`（`/robots/[slug]`詳細ページとも共有）が
   * 内部で読む。比較UI自体は現状その結果の`sourceUrls`を表示に使っていない
   * （`getComparisonDetailRows`の既存実装のまま。ここでのVM化ではその挙動を変えない）。
   */
  fieldEvidence?: RobotFieldEvidence;
  images?: Partial<Record<ImageRole, ImageAsset>>;
  featuredRank?: number;
  updatedAt: string;
}

export interface CompareManufacturerViewModel {
  id: Id;
  name: string;
  nameJa?: string;
  logos?: ManufacturerLogos;
  /** `sortManufacturers`のgeneric制約を満たすために持つ（比較UI自体は`'name'`sortしか使わない）。 */
  japanPresence: JapanPresence;
  foundedYear?: number;
}

export function createCompareRobotViewModel(robot: Robot): CompareRobotViewModel {
  return {
    id: robot.id,
    slug: robot.slug,
    name: robot.name,
    nameJa: robot.nameJa,
    manufacturerId: robot.manufacturerId,
    comparison: robot.comparison,
    specs: robot.specs,
    loadRatings: robot.loadRatings,
    japanAvailability: robot.japanAvailability,
    deploymentStage: robot.deploymentStage,
    procurementModels: robot.procurementModels,
    hasPriceOffers: (robot.priceOffers?.length ?? 0) > 0,
    fieldEvidence: robot.fieldEvidence,
    images: robot.images,
    featuredRank: robot.featuredRank,
    updatedAt: robot.updatedAt,
  };
}

export function createCompareManufacturerViewModel(manufacturer: Manufacturer): CompareManufacturerViewModel {
  return {
    id: manufacturer.id,
    name: manufacturer.name,
    nameJa: manufacturer.nameJa,
    logos: manufacturer.logos,
    japanPresence: manufacturer.japanPresence,
    foundedYear: manufacturer.foundedYear,
  };
}
