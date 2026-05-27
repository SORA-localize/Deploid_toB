/**
 * Legacy filename retained to avoid broken references in older notes.
 *
 * Current schema source of truth:
 * - `nextjs_data_types_v1.ts`
 * - copy it to `data/types.ts` in the new Next.js project
 *
 * This file intentionally has no Astro `defineCollection` dependency.
 */

export type {
  BaseRecord,
  BuyerReadiness,
  Capability,
  CompanyStatus,
  CompanyType,
  ComparisonProfile,
  ContactInquiryType,
  DeploymentStage,
  Guide,
  GuideStage,
  ImageAsset,
  ISODate,
  JapanAvailability,
  JapanPresence,
  Manufacturer,
  MobilityType,
  OperatingEnvironment,
  ProcurementModel,
  PublishStatus,
  Reliability,
  Report,
  ReportType,
  Robot,
  RobotCategory,
  RobotSpecs,
  SeoFields,
  SiteData,
  Slug,
  Source,
  UseCase,
  UseCaseAtAGlance,
  UseCaseCapabilityNotes,
  UseCaseMaturity,
} from './nextjs_data_types_v1';
