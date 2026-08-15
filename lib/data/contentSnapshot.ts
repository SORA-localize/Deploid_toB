import type { Article, DeploymentSite, Distributor, MediaAsset, RobotSeries } from '@/lib/content/domainTypes';
import type { ArticlePlacement as DomainArticlePlacement, ArticlePlacementSlot } from '@/lib/content/domainTypes';
// Task 6 fix round 1（reviewer Critical指摘への対応）: `Robot` / `Manufacturer` / `UseCase` は
// legacy型のまま残す。理由は`@/data/types`の除去ではなく実在する構造差分:
// - `Robot`: `lib/content/localSource.ts`の`toDomainRobot(robot: LegacyRobot)`が
//   legacy shapeを要求する（4フィールドを明示的に落とすのがこの関数の役目そのもの）。
//   domain `Robot`には`buyerReadiness`が無いため、domain型を渡すとその関数呼び出し自体が
//   コンパイルエラーになる（実際に発生した。`snapshot.robots.map(toDomainRobot)`）。
// - `Manufacturer`: 同じ理由に加えて`lib/validation/manufacturers.ts`が
//   `m.logo`（legacy専用の@deprecated単発ロゴ）を読む。domain型には`logo`が存在しない。
// - `UseCase`: `candidateRobots[].robotId`はlegacyでは必須、domainでは省略可能
//   （DEC-S08のseriesId候補のため）。`toDomainUseCase`はlegacyの必須robotIdを前提にしており、
//   domain型を渡すと同様にコンパイルエラーになる。
//
// `Article`・`DeploymentSite`はlegacyとdomainで構造が完全に一致する
// （`toDomainArticle` / `toDomainDeployment` への型不整合が起きない）ため、domain型を使う。
import type { Manufacturer, Robot, UseCase } from '@/data/types';

/**
 * local（`data/*.ts`）側のsnapshot形。
 *
 * legacy型への依存は次の集合だけに閉じる: `data/*.ts`・`lib/content/localSource.ts`・
 * **このファイル**。理由は上のコメントの通り、`Robot` / `Manufacturer` / `UseCase` に
 * legacy側だけの必須field（`buyerReadiness`）・legacy側だけのfield（`Manufacturer.logo`）・
 * legacy側の方が厳格な必須制約（`UseCaseCandidateRobot.robotId`）があり、
 * `lib/content/localSource.ts`のlegacy→domain変換関数（`toDomainRobot`等）がその厳密なlegacy
 * shapeを引数型として要求するため。ここをdomain型に緩めると変換関数側の型検査が壊れる
 * （実際に発生・検証済み）。
 *
 * このファイルが`rg -n "@/data/types|\.\.?/.*data/types" src components lib tests
 * -g '!lib/content/localSource.ts'`ゲートに引っかかるのは意図した挙動。ゲート側の除外パターンに
 * このファイルも明示的に加える必要がある（`docs/plans/content-platform-migration-plan-v1.md`の
 * Task 9のゲートコマンド・Files一覧を参照・更新すること。Task 6 fix round 1 の
 * `task-6-report.md`に詳細）。
 *
 * `ArticlePlacement`だけは`Omit<DomainArticlePlacement, 'id' | 'publishStatus'>`という
 * 局所的な型で表現する（legacy型そのものは使わない）。legacy `data/articlePlacements.ts`の
 * 実データはまさにこの形（`id`は`lib/content/localSource.ts`の`localArticlePlacementId()`が
 * `surface:slot:articleId`から導出し、`publishStatus`は「存在＝掲載中」で`'published'`固定として、
 * どちらも変換時に初めて付与される）。
 *
 * `robotSeries` / `distributors` / `media` / `siteSettings` はTask 4で追加した
 * （brief Step 3: 既存を置き換えず、フィールドを足す形で拡張する）。この3 collectionは
 * `data/*.ts` に対応する配列がそもそも存在せず（DEC-S08 / 架構v2 §4-1 / Media collectionは
 * すべてTask 3の新設）、legacy型も持たないため、canonical domain型をそのまま使う。
 * localの実体は空配列で、実データはTask 5のimporter以降にPayload側だけが持つ。
 */
export type LocalArticlePlacement = Omit<DomainArticlePlacement, 'id' | 'publishStatus'>;

export interface ContentSnapshot {
  readonly robots: readonly Robot[];
  readonly manufacturers: readonly Manufacturer[];
  readonly articles: readonly Article[];
  readonly useCases: readonly UseCase[];
  readonly deployments: readonly DeploymentSite[];
  readonly articlePlacements: readonly LocalArticlePlacement[];
  readonly articleIndexPlacementLimits: Readonly<Record<ArticlePlacementSlot, number>>;
  readonly robotSeries: readonly RobotSeries[];
  readonly distributors: readonly Distributor[];
  readonly media: readonly MediaAsset[];
  readonly siteSettings: { readonly dataAsOf: string };
}
