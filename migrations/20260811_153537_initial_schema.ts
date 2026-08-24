import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_admins_role" AS ENUM('content-reader', 'content-draft-writer', 'content-publisher', 'platform-admin');
  CREATE TYPE "public"."enum_manufacturers_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_manufacturers_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_manufacturers_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_manufacturers_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_manufacturers_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_manufacturers_company_type" AS ENUM('manufacturer', 'distributor', 'integrator', 'ai-os', 'research');
  CREATE TYPE "public"."enum_manufacturers_company_status" AS ENUM('active', 'stealth', 'acquired', 'inactive');
  CREATE TYPE "public"."enum_manufacturers_japan_presence" AS ENUM('office', 'distributor', 'partner', 'remote', 'none', 'unknown');
  CREATE TYPE "public"."enum_manufacturers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__manufacturers_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__manufacturers_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__manufacturers_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__manufacturers_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__manufacturers_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__manufacturers_v_version_company_type" AS ENUM('manufacturer', 'distributor', 'integrator', 'ai-os', 'research');
  CREATE TYPE "public"."enum__manufacturers_v_version_company_status" AS ENUM('active', 'stealth', 'acquired', 'inactive');
  CREATE TYPE "public"."enum__manufacturers_v_version_japan_presence" AS ENUM('office', 'distributor', 'partner', 'remote', 'none', 'unknown');
  CREATE TYPE "public"."enum__manufacturers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_distributors_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_distributors_acquisition_methods" AS ENUM('purchase', 'lease', 'raas', 'subscription', 'inquiry');
  CREATE TYPE "public"."enum_distributors_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_distributors_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_distributors_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_distributors_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_distributors_provider_type" AS ENUM('maker-direct', 'reseller', 'other');
  CREATE TYPE "public"."enum_distributors_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__distributors_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__distributors_v_version_acquisition_methods" AS ENUM('purchase', 'lease', 'raas', 'subscription', 'inquiry');
  CREATE TYPE "public"."enum__distributors_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__distributors_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__distributors_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__distributors_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__distributors_v_version_provider_type" AS ENUM('maker-direct', 'reseller', 'other');
  CREATE TYPE "public"."enum__distributors_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_robot_series_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_robot_series_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_robot_series_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_robot_series_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_robot_series_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_robot_series_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__robot_series_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__robot_series_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__robot_series_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__robot_series_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__robot_series_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__robot_series_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_robots_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_robots_procurement_models" AS ENUM('purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry');
  CREATE TYPE "public"."enum_robots_price_offers_channel" AS ENUM('manufacturer-public', 'authorized-distributor-public');
  CREATE TYPE "public"."enum_robots_price_offers_tax_status" AS ENUM('included', 'excluded', 'unknown');
  CREATE TYPE "public"."enum_robots_load_ratings_scope" AS ENUM('single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording');
  CREATE TYPE "public"."enum_robots_load_ratings_rating" AS ENUM('rated', 'maximum', 'unspecified');
  CREATE TYPE "public"."enum_robots_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_robots_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_robots_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_robots_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_robots_category" AS ENUM('humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other');
  CREATE TYPE "public"."enum_robots_deployment_stage" AS ENUM('concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued');
  CREATE TYPE "public"."enum_robots_japan_availability" AS ENUM('official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown');
  CREATE TYPE "public"."enum_robots_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__robots_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__robots_v_version_procurement_models" AS ENUM('purchase', 'lease', 'raas', 'subscription', 'partner-program', 'not-for-sale', 'inquiry');
  CREATE TYPE "public"."enum__robots_v_version_price_offers_channel" AS ENUM('manufacturer-public', 'authorized-distributor-public');
  CREATE TYPE "public"."enum__robots_v_version_price_offers_tax_status" AS ENUM('included', 'excluded', 'unknown');
  CREATE TYPE "public"."enum__robots_v_version_load_ratings_scope" AS ENUM('single-arm', 'dual-arm', 'whole-body', 'carrier', 'manufacturer-wording');
  CREATE TYPE "public"."enum__robots_v_version_load_ratings_rating" AS ENUM('rated', 'maximum', 'unspecified');
  CREATE TYPE "public"."enum__robots_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__robots_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__robots_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__robots_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__robots_v_version_category" AS ENUM('humanoid', 'general-purpose-robot', 'upper-body-humanoid', 'mobile-manipulator', 'other');
  CREATE TYPE "public"."enum__robots_v_version_deployment_stage" AS ENUM('concept', 'prototype', 'pilot', 'limited-production', 'production', 'internal-use', 'discontinued');
  CREATE TYPE "public"."enum__robots_v_version_japan_availability" AS ENUM('official-japan', 'distributor-japan', 'inquiry-required', 'import-only', 'unavailable', 'unknown');
  CREATE TYPE "public"."enum__robots_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_use_cases_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_use_cases_required_capabilities" AS ENUM('mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration');
  CREATE TYPE "public"."enum_use_cases_candidate_robots_fit" AS ENUM('strong', 'possible', 'watch');
  CREATE TYPE "public"."enum_use_cases_candidate_robots_basis" AS ENUM('deployment', 'adjacent-deployment', 'official-use-case', 'product-capability', 'market-signal', 'editorial-watch');
  CREATE TYPE "public"."enum_use_cases_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_use_cases_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_use_cases_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_use_cases_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_use_cases_maturity_level" AS ENUM('early-stage', 'pilot-phase', 'production-ready');
  CREATE TYPE "public"."enum_use_cases_buyer_readiness" AS ENUM('initial-adoption', 'requires-poc', 'limited-today');
  CREATE TYPE "public"."enum_use_cases_environment" AS ENUM('indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous');
  CREATE TYPE "public"."enum_use_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__use_cases_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__use_cases_v_version_required_capabilities" AS ENUM('mobility', 'manipulation', 'perception', 'autonomy', 'communication', 'data-capture', 'integration');
  CREATE TYPE "public"."enum__use_cases_v_version_candidate_robots_fit" AS ENUM('strong', 'possible', 'watch');
  CREATE TYPE "public"."enum__use_cases_v_version_candidate_robots_basis" AS ENUM('deployment', 'adjacent-deployment', 'official-use-case', 'product-capability', 'market-signal', 'editorial-watch');
  CREATE TYPE "public"."enum__use_cases_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__use_cases_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__use_cases_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__use_cases_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__use_cases_v_version_maturity_level" AS ENUM('early-stage', 'pilot-phase', 'production-ready');
  CREATE TYPE "public"."enum__use_cases_v_version_buyer_readiness" AS ENUM('initial-adoption', 'requires-poc', 'limited-today');
  CREATE TYPE "public"."enum__use_cases_v_version_environment" AS ENUM('indoor-controlled', 'indoor-semi-controlled', 'outdoor', 'mixed', 'hazardous');
  CREATE TYPE "public"."enum__use_cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_deployments_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_deployments_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_deployments_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_deployments_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_deployments_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_deployments_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__deployments_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__deployments_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__deployments_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__deployments_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__deployments_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__deployments_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_articles_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_articles_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum_articles_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_articles_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_articles_category" AS ENUM('news', 'interview', 'company-report', 'analysis', 'policy');
  CREATE TYPE "public"."enum_articles_type" AS ENUM('analysis', 'deployment-report', 'interview', 'event-report', 'policy-update', 'case-study', 'news-brief', 'tech-update', 'market-analysis', 'manufacturer-guide', 'robot-guide', 'basics-guide');
  CREATE TYPE "public"."enum_articles_section" AS ENUM('digest', 'deployment', 'business', 'tech', 'policy', 'entertainment');
  CREATE TYPE "public"."enum_articles_content_kind" AS ENUM('editorial', 'sample', 'sponsored');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_sources_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__articles_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__articles_v_version_reliability" AS ENUM('verified', 'official', 'reported', 'estimated');
  CREATE TYPE "public"."enum__articles_v_version_hero_image_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum__articles_v_version_hero_image_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum__articles_v_version_category" AS ENUM('news', 'interview', 'company-report', 'analysis', 'policy');
  CREATE TYPE "public"."enum__articles_v_version_type" AS ENUM('analysis', 'deployment-report', 'interview', 'event-report', 'policy-update', 'case-study', 'news-brief', 'tech-update', 'market-analysis', 'manufacturer-guide', 'robot-guide', 'basics-guide');
  CREATE TYPE "public"."enum__articles_v_version_section" AS ENUM('digest', 'deployment', 'business', 'tech', 'policy', 'entertainment');
  CREATE TYPE "public"."enum__articles_v_version_content_kind" AS ENUM('editorial', 'sample', 'sponsored');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_article_placements_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_article_placements_surface" AS ENUM('reports-index');
  CREATE TYPE "public"."enum_article_placements_slot" AS ENUM('hero', 'feature');
  CREATE TYPE "public"."enum_article_placements_kind" AS ENUM('editorial', 'sample', 'sponsored', 'house');
  CREATE TYPE "public"."enum_article_placements_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__article_placements_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__article_placements_v_version_surface" AS ENUM('reports-index');
  CREATE TYPE "public"."enum__article_placements_v_version_slot" AS ENUM('hero', 'feature');
  CREATE TYPE "public"."enum__article_placements_v_version_kind" AS ENUM('editorial', 'sample', 'sponsored', 'house');
  CREATE TYPE "public"."enum__article_placements_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_rights_status" AS ENUM('own', 'licensed', 'commercial-permitted', 'reference-attributed', 'permission-requested', 'prototype-only', 'blocked');
  CREATE TYPE "public"."enum_media_rights_source_type" AS ENUM('own', 'manufacturer-official', 'partner-official', 'press-release', 'third-party', 'unknown');
  CREATE TYPE "public"."enum_content_route_registry_owner_collection" AS ENUM('robots', 'robot-series');
  CREATE TYPE "public"."enum__environment_marker_environment" AS ENUM('preview', 'production');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_admins_role" DEFAULT 'content-draft-writer' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "manufacturers_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_manufacturers_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "manufacturers_domestic_distributors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"website" varchar,
  	"source_url" varchar,
  	"checked_at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "manufacturers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_manufacturers_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_manufacturers_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_manufacturers_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_manufacturers_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"name" varchar,
  	"name_ja" varchar,
  	"company_type" "enum_manufacturers_company_type",
  	"company_status" "enum_manufacturers_company_status" DEFAULT 'active',
  	"country" varchar,
  	"hq_city" varchar,
  	"headquarters_lat" numeric,
  	"headquarters_lng" numeric,
  	"founded_year" numeric,
  	"website" varchar,
  	"logos" jsonb,
  	"contact_url" varchar,
  	"description" varchar,
  	"japan_presence" "enum_manufacturers_japan_presence",
  	"distributor_note" varchar,
  	"support_note" varchar,
  	"procurement_note" varchar,
  	"vendor_risk_note" varchar,
  	"featured_rank" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_manufacturers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "manufacturers_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_manufacturers_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__manufacturers_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_manufacturers_v_version_domestic_distributors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"website" varchar,
  	"source_url" varchar,
  	"checked_at" timestamp(3) with time zone,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_manufacturers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__manufacturers_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__manufacturers_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__manufacturers_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__manufacturers_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_name" varchar,
  	"version_name_ja" varchar,
  	"version_company_type" "enum__manufacturers_v_version_company_type",
  	"version_company_status" "enum__manufacturers_v_version_company_status" DEFAULT 'active',
  	"version_country" varchar,
  	"version_hq_city" varchar,
  	"version_headquarters_lat" numeric,
  	"version_headquarters_lng" numeric,
  	"version_founded_year" numeric,
  	"version_website" varchar,
  	"version_logos" jsonb,
  	"version_contact_url" varchar,
  	"version_description" varchar,
  	"version_japan_presence" "enum__manufacturers_v_version_japan_presence",
  	"version_distributor_note" varchar,
  	"version_support_note" varchar,
  	"version_procurement_note" varchar,
  	"version_vendor_risk_note" varchar,
  	"version_featured_rank" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__manufacturers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_manufacturers_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "distributors_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_distributors_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "distributors_acquisition_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_distributors_acquisition_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "distributors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_distributors_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_distributors_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_distributors_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_distributors_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"name" varchar,
  	"name_ja" varchar,
  	"website" varchar,
  	"provider_type" "enum_distributors_provider_type",
  	"inquiry_url" varchar,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_distributors_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "distributors_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "distributors_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"manufacturers_id" integer,
  	"robots_id" integer
  );
  
  CREATE TABLE "_distributors_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__distributors_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_distributors_v_version_acquisition_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__distributors_v_version_acquisition_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_distributors_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__distributors_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__distributors_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__distributors_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__distributors_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_name" varchar,
  	"version_name_ja" varchar,
  	"version_website" varchar,
  	"version_provider_type" "enum__distributors_v_version_provider_type",
  	"version_inquiry_url" varchar,
  	"version_note" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__distributors_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_distributors_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_distributors_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"manufacturers_id" integer,
  	"robots_id" integer
  );
  
  CREATE TABLE "robot_series_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_robot_series_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "robot_series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_robot_series_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_robot_series_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_robot_series_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_robot_series_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"name" varchar,
  	"name_ja" varchar,
  	"manufacturer_id_id" integer,
  	"description" varchar,
  	"images" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_robot_series_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "robot_series_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_robot_series_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__robot_series_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_robot_series_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__robot_series_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__robot_series_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__robot_series_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__robot_series_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_name" varchar,
  	"version_name_ja" varchar,
  	"version_manufacturer_id_id" integer,
  	"version_description" varchar,
  	"version_images" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__robot_series_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_robot_series_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "robots_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_robots_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "robots_procurement_models" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_robots_procurement_models",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "robots_price_offers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"channel" "enum_robots_price_offers_channel",
  	"display" varchar,
  	"amount" numeric,
  	"currency" varchar,
  	"tax_status" "enum_robots_price_offers_tax_status",
  	"variant" varchar,
  	"seller_name" varchar,
  	"source_url" varchar
  );
  
  CREATE TABLE "robots_load_ratings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"scope" "enum_robots_load_ratings_scope",
  	"rating" "enum_robots_load_ratings_rating",
  	"kg" numeric,
  	"condition" varchar,
  	"variant" varchar,
  	"source_url" varchar
  );
  
  CREATE TABLE "robots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_robots_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_robots_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_robots_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_robots_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"name" varchar,
  	"name_ja" varchar,
  	"manufacturer_id_id" integer,
  	"series_id_id" integer,
  	"category" "enum_robots_category",
  	"description" varchar,
  	"featured_rank" numeric,
  	"deployment_stage" "enum_robots_deployment_stage",
  	"superseded_by_id_id" integer,
  	"specs" jsonb,
  	"field_evidence" jsonb,
  	"japan_availability" "enum_robots_japan_availability",
  	"distributor_japan" varchar,
  	"support_note" varchar,
  	"images" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_robots_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "robots_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_robots_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__robots_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_robots_v_version_procurement_models" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__robots_v_version_procurement_models",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_robots_v_version_price_offers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"channel" "enum__robots_v_version_price_offers_channel",
  	"display" varchar,
  	"amount" numeric,
  	"currency" varchar,
  	"tax_status" "enum__robots_v_version_price_offers_tax_status",
  	"variant" varchar,
  	"seller_name" varchar,
  	"source_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_robots_v_version_load_ratings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"scope" "enum__robots_v_version_load_ratings_scope",
  	"rating" "enum__robots_v_version_load_ratings_rating",
  	"kg" numeric,
  	"condition" varchar,
  	"variant" varchar,
  	"source_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_robots_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__robots_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__robots_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__robots_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__robots_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_name" varchar,
  	"version_name_ja" varchar,
  	"version_manufacturer_id_id" integer,
  	"version_series_id_id" integer,
  	"version_category" "enum__robots_v_version_category",
  	"version_description" varchar,
  	"version_featured_rank" numeric,
  	"version_deployment_stage" "enum__robots_v_version_deployment_stage",
  	"version_superseded_by_id_id" integer,
  	"version_specs" jsonb,
  	"version_field_evidence" jsonb,
  	"version_japan_availability" "enum__robots_v_version_japan_availability",
  	"version_distributor_japan" varchar,
  	"version_support_note" varchar,
  	"version_images" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__robots_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_robots_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "use_cases_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_use_cases_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "use_cases_required_capabilities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_use_cases_required_capabilities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "use_cases_candidate_robots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"robot_id_id" integer,
  	"series_id_id" integer,
  	"fit" "enum_use_cases_candidate_robots_fit",
  	"basis" "enum_use_cases_candidate_robots_basis",
  	"reason" varchar
  );
  
  CREATE TABLE "use_cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_use_cases_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_use_cases_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_use_cases_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_use_cases_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"title" varchar,
  	"title_ja" varchar,
  	"subtitle" varchar,
  	"maturity_level" "enum_use_cases_maturity_level",
  	"buyer_readiness" "enum_use_cases_buyer_readiness",
  	"environment" "enum_use_cases_environment",
  	"primary_industry" varchar,
  	"at_a_glance_where_fits" varchar,
  	"at_a_glance_where_does_not_fit" varchar,
  	"at_a_glance_must_be_true" varchar,
  	"overview" varchar,
  	"why_it_matters" varchar,
  	"capability_notes_mobility" varchar,
  	"capability_notes_manipulation" varchar,
  	"capability_notes_perception" varchar,
  	"capability_notes_autonomy" varchar,
  	"capability_notes_communication" varchar,
  	"capability_notes_integration" varchar,
  	"environment_requirements" varchar,
  	"why_hard_today" varchar,
  	"japan_deployment_conditions" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_use_cases_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "use_cases_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "use_cases_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"deployments_id" integer
  );
  
  CREATE TABLE "_use_cases_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__use_cases_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_use_cases_v_version_required_capabilities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__use_cases_v_version_required_capabilities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_use_cases_v_version_candidate_robots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"robot_id_id" integer,
  	"series_id_id" integer,
  	"fit" "enum__use_cases_v_version_candidate_robots_fit",
  	"basis" "enum__use_cases_v_version_candidate_robots_basis",
  	"reason" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_use_cases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__use_cases_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__use_cases_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__use_cases_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__use_cases_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_title" varchar,
  	"version_title_ja" varchar,
  	"version_subtitle" varchar,
  	"version_maturity_level" "enum__use_cases_v_version_maturity_level",
  	"version_buyer_readiness" "enum__use_cases_v_version_buyer_readiness",
  	"version_environment" "enum__use_cases_v_version_environment",
  	"version_primary_industry" varchar,
  	"version_at_a_glance_where_fits" varchar,
  	"version_at_a_glance_where_does_not_fit" varchar,
  	"version_at_a_glance_must_be_true" varchar,
  	"version_overview" varchar,
  	"version_why_it_matters" varchar,
  	"version_capability_notes_mobility" varchar,
  	"version_capability_notes_manipulation" varchar,
  	"version_capability_notes_perception" varchar,
  	"version_capability_notes_autonomy" varchar,
  	"version_capability_notes_communication" varchar,
  	"version_capability_notes_integration" varchar,
  	"version_environment_requirements" varchar,
  	"version_why_hard_today" varchar,
  	"version_japan_deployment_conditions" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__use_cases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_use_cases_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_use_cases_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"deployments_id" integer
  );
  
  CREATE TABLE "deployments_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_deployments_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "deployments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_deployments_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_deployments_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_deployments_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_deployments_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"manufacturer_id_id" integer,
  	"robot_id_id" integer,
  	"customer" varchar,
  	"site_name" varchar,
  	"country" varchar,
  	"location_lat" numeric,
  	"location_lng" numeric,
  	"status" "enum_deployments_status",
  	"started_at" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_deployments_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "deployments_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "deployments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"use_cases_id" integer
  );
  
  CREATE TABLE "_deployments_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__deployments_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_deployments_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__deployments_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__deployments_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__deployments_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__deployments_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_manufacturer_id_id" integer,
  	"version_robot_id_id" integer,
  	"version_customer" varchar,
  	"version_site_name" varchar,
  	"version_country" varchar,
  	"version_location_lat" numeric,
  	"version_location_lng" numeric,
  	"version_status" "enum__deployments_v_version_status",
  	"version_started_at" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__deployments_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_deployments_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_deployments_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"use_cases_id" integer
  );
  
  CREATE TABLE "articles_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum_articles_sources_reliability",
  	"note" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_articles_lifecycle_status" DEFAULT 'active',
  	"summary" varchar,
  	"reliability" "enum_articles_reliability",
  	"next_review_by" timestamp(3) with time zone,
  	"hero_image_src" varchar,
  	"hero_image_alt" varchar,
  	"hero_image_credit" varchar,
  	"hero_image_source_url" varchar,
  	"hero_image_rights_status" "enum_articles_hero_image_rights_status",
  	"hero_image_rights_source_type" "enum_articles_hero_image_rights_source_type",
  	"hero_image_rights_checked_at" timestamp(3) with time zone,
  	"hero_image_rights_rights_holder" varchar,
  	"hero_image_rights_license_url" varchar,
  	"hero_image_rights_permission_note" varchar,
  	"hero_image_aspect_ratio" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_noindex" boolean,
  	"title" varchar,
  	"title_ja" varchar,
  	"category" "enum_articles_category",
  	"type" "enum_articles_type",
  	"section" "enum_articles_section",
  	"content_kind" "enum_articles_content_kind",
  	"published_at" timestamp(3) with time zone,
  	"author" varchar,
  	"why_it_matters" varchar,
  	"featured" boolean,
  	"body" varchar,
  	"manufacturer_guide_content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"robots_id" integer,
  	"manufacturers_id" integer,
  	"use_cases_id" integer
  );
  
  CREATE TABLE "_articles_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"publisher" varchar,
  	"published_at" timestamp(3) with time zone,
  	"checked_at" timestamp(3) with time zone,
  	"reliability" "enum__articles_v_version_sources_reliability",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__articles_v_version_lifecycle_status" DEFAULT 'active',
  	"version_summary" varchar,
  	"version_reliability" "enum__articles_v_version_reliability",
  	"version_next_review_by" timestamp(3) with time zone,
  	"version_hero_image_src" varchar,
  	"version_hero_image_alt" varchar,
  	"version_hero_image_credit" varchar,
  	"version_hero_image_source_url" varchar,
  	"version_hero_image_rights_status" "enum__articles_v_version_hero_image_rights_status",
  	"version_hero_image_rights_source_type" "enum__articles_v_version_hero_image_rights_source_type",
  	"version_hero_image_rights_checked_at" timestamp(3) with time zone,
  	"version_hero_image_rights_rights_holder" varchar,
  	"version_hero_image_rights_license_url" varchar,
  	"version_hero_image_rights_permission_note" varchar,
  	"version_hero_image_aspect_ratio" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_noindex" boolean,
  	"version_title" varchar,
  	"version_title_ja" varchar,
  	"version_category" "enum__articles_v_version_category",
  	"version_type" "enum__articles_v_version_type",
  	"version_section" "enum__articles_v_version_section",
  	"version_content_kind" "enum__articles_v_version_content_kind",
  	"version_published_at" timestamp(3) with time zone,
  	"version_author" varchar,
  	"version_why_it_matters" varchar,
  	"version_featured" boolean,
  	"version_body" varchar,
  	"version_manufacturer_guide_content" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"robots_id" integer,
  	"manufacturers_id" integer,
  	"use_cases_id" integer
  );
  
  CREATE TABLE "article_placements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar,
  	"slug" varchar,
  	"lifecycle_status" "enum_article_placements_lifecycle_status" DEFAULT 'active',
  	"surface" "enum_article_placements_surface",
  	"slot" "enum_article_placements_slot",
  	"article_id_id" integer,
  	"order" numeric,
  	"kind" "enum_article_placements_kind",
  	"sponsor_name" varchar,
  	"sponsor_url" varchar,
  	"sponsor_disclosure" varchar,
  	"sponsor_campaign_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_article_placements_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "article_placements_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_article_placements_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_stable_id" varchar,
  	"version_slug" varchar,
  	"version_lifecycle_status" "enum__article_placements_v_version_lifecycle_status" DEFAULT 'active',
  	"version_surface" "enum__article_placements_v_version_surface",
  	"version_slot" "enum__article_placements_v_version_slot",
  	"version_article_id_id" integer,
  	"version_order" numeric,
  	"version_kind" "enum__article_placements_v_version_kind",
  	"version_sponsor_name" varchar,
  	"version_sponsor_url" varchar,
  	"version_sponsor_disclosure" varchar,
  	"version_sponsor_campaign_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__article_placements_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_article_placements_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stable_id" varchar NOT NULL,
  	"alt" varchar NOT NULL,
  	"rights_status" "enum_media_rights_status" NOT NULL,
  	"rights_source_type" "enum_media_rights_source_type" NOT NULL,
  	"rights_checked_at" timestamp(3) with time zone NOT NULL,
  	"rights_rights_holder" varchar,
  	"rights_license_url" varchar,
  	"rights_permission_note" varchar,
  	"credit" varchar,
  	"source_url" varchar,
  	"prefix" varchar DEFAULT '',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "content_route_registry" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"namespace" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"owner_collection" "enum_content_route_registry_owner_collection" NOT NULL,
  	"owner_stable_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_environment_marker" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"environment" "enum__environment_marker_environment" NOT NULL,
  	"singleton" numeric DEFAULT 1 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"manufacturers_id" integer,
  	"distributors_id" integer,
  	"robot_series_id" integer,
  	"robots_id" integer,
  	"use_cases_id" integer,
  	"deployments_id" integer,
  	"articles_id" integer,
  	"article_placements_id" integer,
  	"media_id" integer,
  	"content_route_registry_id" integer,
  	"_environment_marker_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_seo_meta_title" varchar,
  	"default_seo_meta_description" varchar,
  	"announcement_banner_enabled" boolean DEFAULT false,
  	"announcement_banner_message" varchar,
  	"announcement_banner_url" varchar,
  	"_status" "enum_site_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_default_seo_meta_title" varchar,
  	"version_default_seo_meta_description" varchar,
  	"version_announcement_banner_enabled" boolean DEFAULT false,
  	"version_announcement_banner_message" varchar,
  	"version_announcement_banner_url" varchar,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manufacturers_sources" ADD CONSTRAINT "manufacturers_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manufacturers_domestic_distributors" ADD CONSTRAINT "manufacturers_domestic_distributors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manufacturers_texts" ADD CONSTRAINT "manufacturers_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_manufacturers_v_version_sources" ADD CONSTRAINT "_manufacturers_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_manufacturers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_manufacturers_v_version_domestic_distributors" ADD CONSTRAINT "_manufacturers_v_version_domestic_distributors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_manufacturers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_manufacturers_v" ADD CONSTRAINT "_manufacturers_v_parent_id_manufacturers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_manufacturers_v_texts" ADD CONSTRAINT "_manufacturers_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_manufacturers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_sources" ADD CONSTRAINT "distributors_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_acquisition_methods" ADD CONSTRAINT "distributors_acquisition_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_texts" ADD CONSTRAINT "distributors_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_rels" ADD CONSTRAINT "distributors_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_rels" ADD CONSTRAINT "distributors_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "distributors_rels" ADD CONSTRAINT "distributors_rels_robots_fk" FOREIGN KEY ("robots_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v_version_sources" ADD CONSTRAINT "_distributors_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_distributors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v_version_acquisition_methods" ADD CONSTRAINT "_distributors_v_version_acquisition_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_distributors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v" ADD CONSTRAINT "_distributors_v_parent_id_distributors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distributors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_distributors_v_texts" ADD CONSTRAINT "_distributors_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_distributors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v_rels" ADD CONSTRAINT "_distributors_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_distributors_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v_rels" ADD CONSTRAINT "_distributors_v_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_distributors_v_rels" ADD CONSTRAINT "_distributors_v_rels_robots_fk" FOREIGN KEY ("robots_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robot_series_sources" ADD CONSTRAINT "robot_series_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."robot_series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robot_series" ADD CONSTRAINT "robot_series_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "robot_series_texts" ADD CONSTRAINT "robot_series_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."robot_series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robot_series_v_version_sources" ADD CONSTRAINT "_robot_series_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_robot_series_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robot_series_v" ADD CONSTRAINT "_robot_series_v_parent_id_robot_series_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."robot_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robot_series_v" ADD CONSTRAINT "_robot_series_v_version_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robot_series_v_texts" ADD CONSTRAINT "_robot_series_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_robot_series_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robots_sources" ADD CONSTRAINT "robots_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robots_procurement_models" ADD CONSTRAINT "robots_procurement_models_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robots_price_offers" ADD CONSTRAINT "robots_price_offers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robots_load_ratings" ADD CONSTRAINT "robots_load_ratings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "robots" ADD CONSTRAINT "robots_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "robots" ADD CONSTRAINT "robots_series_id_id_robot_series_id_fk" FOREIGN KEY ("series_id_id") REFERENCES "public"."robot_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "robots" ADD CONSTRAINT "robots_superseded_by_id_id_robots_id_fk" FOREIGN KEY ("superseded_by_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "robots_texts" ADD CONSTRAINT "robots_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robots_v_version_sources" ADD CONSTRAINT "_robots_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_robots_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robots_v_version_procurement_models" ADD CONSTRAINT "_robots_v_version_procurement_models_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_robots_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robots_v_version_price_offers" ADD CONSTRAINT "_robots_v_version_price_offers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_robots_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robots_v_version_load_ratings" ADD CONSTRAINT "_robots_v_version_load_ratings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_robots_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_robots_v" ADD CONSTRAINT "_robots_v_parent_id_robots_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robots_v" ADD CONSTRAINT "_robots_v_version_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robots_v" ADD CONSTRAINT "_robots_v_version_series_id_id_robot_series_id_fk" FOREIGN KEY ("version_series_id_id") REFERENCES "public"."robot_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robots_v" ADD CONSTRAINT "_robots_v_version_superseded_by_id_id_robots_id_fk" FOREIGN KEY ("version_superseded_by_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_robots_v_texts" ADD CONSTRAINT "_robots_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_robots_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_sources" ADD CONSTRAINT "use_cases_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_required_capabilities" ADD CONSTRAINT "use_cases_required_capabilities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_candidate_robots" ADD CONSTRAINT "use_cases_candidate_robots_robot_id_id_robots_id_fk" FOREIGN KEY ("robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "use_cases_candidate_robots" ADD CONSTRAINT "use_cases_candidate_robots_series_id_id_robot_series_id_fk" FOREIGN KEY ("series_id_id") REFERENCES "public"."robot_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "use_cases_candidate_robots" ADD CONSTRAINT "use_cases_candidate_robots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_texts" ADD CONSTRAINT "use_cases_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_rels" ADD CONSTRAINT "use_cases_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "use_cases_rels" ADD CONSTRAINT "use_cases_rels_deployments_fk" FOREIGN KEY ("deployments_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v_version_sources" ADD CONSTRAINT "_use_cases_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_use_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v_version_required_capabilities" ADD CONSTRAINT "_use_cases_v_version_required_capabilities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_use_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v_version_candidate_robots" ADD CONSTRAINT "_use_cases_v_version_candidate_robots_robot_id_id_robots_id_fk" FOREIGN KEY ("robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_use_cases_v_version_candidate_robots" ADD CONSTRAINT "_use_cases_v_version_candidate_robots_series_id_id_robot_series_id_fk" FOREIGN KEY ("series_id_id") REFERENCES "public"."robot_series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_use_cases_v_version_candidate_robots" ADD CONSTRAINT "_use_cases_v_version_candidate_robots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_use_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v" ADD CONSTRAINT "_use_cases_v_parent_id_use_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."use_cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_use_cases_v_texts" ADD CONSTRAINT "_use_cases_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_use_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v_rels" ADD CONSTRAINT "_use_cases_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_use_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_use_cases_v_rels" ADD CONSTRAINT "_use_cases_v_rels_deployments_fk" FOREIGN KEY ("deployments_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deployments_sources" ADD CONSTRAINT "deployments_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deployments" ADD CONSTRAINT "deployments_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "deployments" ADD CONSTRAINT "deployments_robot_id_id_robots_id_fk" FOREIGN KEY ("robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "deployments_texts" ADD CONSTRAINT "deployments_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deployments_rels" ADD CONSTRAINT "deployments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deployments_rels" ADD CONSTRAINT "deployments_rels_use_cases_fk" FOREIGN KEY ("use_cases_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deployments_v_version_sources" ADD CONSTRAINT "_deployments_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_deployments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deployments_v" ADD CONSTRAINT "_deployments_v_parent_id_deployments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deployments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deployments_v" ADD CONSTRAINT "_deployments_v_version_manufacturer_id_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deployments_v" ADD CONSTRAINT "_deployments_v_version_robot_id_id_robots_id_fk" FOREIGN KEY ("version_robot_id_id") REFERENCES "public"."robots"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deployments_v_texts" ADD CONSTRAINT "_deployments_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deployments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deployments_v_rels" ADD CONSTRAINT "_deployments_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deployments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deployments_v_rels" ADD CONSTRAINT "_deployments_v_rels_use_cases_fk" FOREIGN KEY ("use_cases_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_sources" ADD CONSTRAINT "articles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_texts" ADD CONSTRAINT "articles_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_robots_fk" FOREIGN KEY ("robots_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_use_cases_fk" FOREIGN KEY ("use_cases_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sources" ADD CONSTRAINT "_articles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_texts" ADD CONSTRAINT "_articles_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_robots_fk" FOREIGN KEY ("robots_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_use_cases_fk" FOREIGN KEY ("use_cases_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "article_placements" ADD CONSTRAINT "article_placements_article_id_id_articles_id_fk" FOREIGN KEY ("article_id_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "article_placements_texts" ADD CONSTRAINT "article_placements_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."article_placements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_article_placements_v" ADD CONSTRAINT "_article_placements_v_parent_id_article_placements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."article_placements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_article_placements_v" ADD CONSTRAINT "_article_placements_v_version_article_id_id_articles_id_fk" FOREIGN KEY ("version_article_id_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_article_placements_v_texts" ADD CONSTRAINT "_article_placements_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_article_placements_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_distributors_fk" FOREIGN KEY ("distributors_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_robot_series_fk" FOREIGN KEY ("robot_series_id") REFERENCES "public"."robot_series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_robots_fk" FOREIGN KEY ("robots_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_use_cases_fk" FOREIGN KEY ("use_cases_id") REFERENCES "public"."use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deployments_fk" FOREIGN KEY ("deployments_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_article_placements_fk" FOREIGN KEY ("article_placements_id") REFERENCES "public"."article_placements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_route_registry_fk" FOREIGN KEY ("content_route_registry_id") REFERENCES "public"."content_route_registry"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_environment_marker_fk" FOREIGN KEY ("_environment_marker_id") REFERENCES "public"."_environment_marker"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE INDEX "manufacturers_sources_order_idx" ON "manufacturers_sources" USING btree ("_order");
  CREATE INDEX "manufacturers_sources_parent_id_idx" ON "manufacturers_sources" USING btree ("_parent_id");
  CREATE INDEX "manufacturers_domestic_distributors_order_idx" ON "manufacturers_domestic_distributors" USING btree ("_order");
  CREATE INDEX "manufacturers_domestic_distributors_parent_id_idx" ON "manufacturers_domestic_distributors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "manufacturers_stable_id_idx" ON "manufacturers" USING btree ("stable_id");
  CREATE UNIQUE INDEX "manufacturers_slug_idx" ON "manufacturers" USING btree ("slug");
  CREATE INDEX "manufacturers_updated_at_idx" ON "manufacturers" USING btree ("updated_at");
  CREATE INDEX "manufacturers_created_at_idx" ON "manufacturers" USING btree ("created_at");
  CREATE INDEX "manufacturers__status_idx" ON "manufacturers" USING btree ("_status");
  CREATE INDEX "manufacturers_texts_order_parent" ON "manufacturers_texts" USING btree ("order","parent_id");
  CREATE INDEX "_manufacturers_v_version_sources_order_idx" ON "_manufacturers_v_version_sources" USING btree ("_order");
  CREATE INDEX "_manufacturers_v_version_sources_parent_id_idx" ON "_manufacturers_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_manufacturers_v_version_domestic_distributors_order_idx" ON "_manufacturers_v_version_domestic_distributors" USING btree ("_order");
  CREATE INDEX "_manufacturers_v_version_domestic_distributors_parent_id_idx" ON "_manufacturers_v_version_domestic_distributors" USING btree ("_parent_id");
  CREATE INDEX "_manufacturers_v_parent_idx" ON "_manufacturers_v" USING btree ("parent_id");
  CREATE INDEX "_manufacturers_v_version_version_stable_id_idx" ON "_manufacturers_v" USING btree ("version_stable_id");
  CREATE INDEX "_manufacturers_v_version_version_slug_idx" ON "_manufacturers_v" USING btree ("version_slug");
  CREATE INDEX "_manufacturers_v_version_version_updated_at_idx" ON "_manufacturers_v" USING btree ("version_updated_at");
  CREATE INDEX "_manufacturers_v_version_version_created_at_idx" ON "_manufacturers_v" USING btree ("version_created_at");
  CREATE INDEX "_manufacturers_v_version_version__status_idx" ON "_manufacturers_v" USING btree ("version__status");
  CREATE INDEX "_manufacturers_v_created_at_idx" ON "_manufacturers_v" USING btree ("created_at");
  CREATE INDEX "_manufacturers_v_updated_at_idx" ON "_manufacturers_v" USING btree ("updated_at");
  CREATE INDEX "_manufacturers_v_latest_idx" ON "_manufacturers_v" USING btree ("latest");
  CREATE INDEX "_manufacturers_v_texts_order_parent" ON "_manufacturers_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "distributors_sources_order_idx" ON "distributors_sources" USING btree ("_order");
  CREATE INDEX "distributors_sources_parent_id_idx" ON "distributors_sources" USING btree ("_parent_id");
  CREATE INDEX "distributors_acquisition_methods_order_idx" ON "distributors_acquisition_methods" USING btree ("order");
  CREATE INDEX "distributors_acquisition_methods_parent_idx" ON "distributors_acquisition_methods" USING btree ("parent_id");
  CREATE UNIQUE INDEX "distributors_stable_id_idx" ON "distributors" USING btree ("stable_id");
  CREATE UNIQUE INDEX "distributors_slug_idx" ON "distributors" USING btree ("slug");
  CREATE INDEX "distributors_updated_at_idx" ON "distributors" USING btree ("updated_at");
  CREATE INDEX "distributors_created_at_idx" ON "distributors" USING btree ("created_at");
  CREATE INDEX "distributors__status_idx" ON "distributors" USING btree ("_status");
  CREATE INDEX "distributors_texts_order_parent" ON "distributors_texts" USING btree ("order","parent_id");
  CREATE INDEX "distributors_rels_order_idx" ON "distributors_rels" USING btree ("order");
  CREATE INDEX "distributors_rels_parent_idx" ON "distributors_rels" USING btree ("parent_id");
  CREATE INDEX "distributors_rels_path_idx" ON "distributors_rels" USING btree ("path");
  CREATE INDEX "distributors_rels_manufacturers_id_idx" ON "distributors_rels" USING btree ("manufacturers_id");
  CREATE INDEX "distributors_rels_robots_id_idx" ON "distributors_rels" USING btree ("robots_id");
  CREATE INDEX "_distributors_v_version_sources_order_idx" ON "_distributors_v_version_sources" USING btree ("_order");
  CREATE INDEX "_distributors_v_version_sources_parent_id_idx" ON "_distributors_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_distributors_v_version_acquisition_methods_order_idx" ON "_distributors_v_version_acquisition_methods" USING btree ("order");
  CREATE INDEX "_distributors_v_version_acquisition_methods_parent_idx" ON "_distributors_v_version_acquisition_methods" USING btree ("parent_id");
  CREATE INDEX "_distributors_v_parent_idx" ON "_distributors_v" USING btree ("parent_id");
  CREATE INDEX "_distributors_v_version_version_stable_id_idx" ON "_distributors_v" USING btree ("version_stable_id");
  CREATE INDEX "_distributors_v_version_version_slug_idx" ON "_distributors_v" USING btree ("version_slug");
  CREATE INDEX "_distributors_v_version_version_updated_at_idx" ON "_distributors_v" USING btree ("version_updated_at");
  CREATE INDEX "_distributors_v_version_version_created_at_idx" ON "_distributors_v" USING btree ("version_created_at");
  CREATE INDEX "_distributors_v_version_version__status_idx" ON "_distributors_v" USING btree ("version__status");
  CREATE INDEX "_distributors_v_created_at_idx" ON "_distributors_v" USING btree ("created_at");
  CREATE INDEX "_distributors_v_updated_at_idx" ON "_distributors_v" USING btree ("updated_at");
  CREATE INDEX "_distributors_v_latest_idx" ON "_distributors_v" USING btree ("latest");
  CREATE INDEX "_distributors_v_texts_order_parent" ON "_distributors_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_distributors_v_rels_order_idx" ON "_distributors_v_rels" USING btree ("order");
  CREATE INDEX "_distributors_v_rels_parent_idx" ON "_distributors_v_rels" USING btree ("parent_id");
  CREATE INDEX "_distributors_v_rels_path_idx" ON "_distributors_v_rels" USING btree ("path");
  CREATE INDEX "_distributors_v_rels_manufacturers_id_idx" ON "_distributors_v_rels" USING btree ("manufacturers_id");
  CREATE INDEX "_distributors_v_rels_robots_id_idx" ON "_distributors_v_rels" USING btree ("robots_id");
  CREATE INDEX "robot_series_sources_order_idx" ON "robot_series_sources" USING btree ("_order");
  CREATE INDEX "robot_series_sources_parent_id_idx" ON "robot_series_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "robot_series_stable_id_idx" ON "robot_series" USING btree ("stable_id");
  CREATE UNIQUE INDEX "robot_series_slug_idx" ON "robot_series" USING btree ("slug");
  CREATE INDEX "robot_series_manufacturer_id_idx" ON "robot_series" USING btree ("manufacturer_id_id");
  CREATE INDEX "robot_series_updated_at_idx" ON "robot_series" USING btree ("updated_at");
  CREATE INDEX "robot_series_created_at_idx" ON "robot_series" USING btree ("created_at");
  CREATE INDEX "robot_series__status_idx" ON "robot_series" USING btree ("_status");
  CREATE INDEX "robot_series_texts_order_parent" ON "robot_series_texts" USING btree ("order","parent_id");
  CREATE INDEX "_robot_series_v_version_sources_order_idx" ON "_robot_series_v_version_sources" USING btree ("_order");
  CREATE INDEX "_robot_series_v_version_sources_parent_id_idx" ON "_robot_series_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_robot_series_v_parent_idx" ON "_robot_series_v" USING btree ("parent_id");
  CREATE INDEX "_robot_series_v_version_version_stable_id_idx" ON "_robot_series_v" USING btree ("version_stable_id");
  CREATE INDEX "_robot_series_v_version_version_slug_idx" ON "_robot_series_v" USING btree ("version_slug");
  CREATE INDEX "_robot_series_v_version_version_manufacturer_id_idx" ON "_robot_series_v" USING btree ("version_manufacturer_id_id");
  CREATE INDEX "_robot_series_v_version_version_updated_at_idx" ON "_robot_series_v" USING btree ("version_updated_at");
  CREATE INDEX "_robot_series_v_version_version_created_at_idx" ON "_robot_series_v" USING btree ("version_created_at");
  CREATE INDEX "_robot_series_v_version_version__status_idx" ON "_robot_series_v" USING btree ("version__status");
  CREATE INDEX "_robot_series_v_created_at_idx" ON "_robot_series_v" USING btree ("created_at");
  CREATE INDEX "_robot_series_v_updated_at_idx" ON "_robot_series_v" USING btree ("updated_at");
  CREATE INDEX "_robot_series_v_latest_idx" ON "_robot_series_v" USING btree ("latest");
  CREATE INDEX "_robot_series_v_texts_order_parent" ON "_robot_series_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "robots_sources_order_idx" ON "robots_sources" USING btree ("_order");
  CREATE INDEX "robots_sources_parent_id_idx" ON "robots_sources" USING btree ("_parent_id");
  CREATE INDEX "robots_procurement_models_order_idx" ON "robots_procurement_models" USING btree ("order");
  CREATE INDEX "robots_procurement_models_parent_idx" ON "robots_procurement_models" USING btree ("parent_id");
  CREATE INDEX "robots_price_offers_order_idx" ON "robots_price_offers" USING btree ("_order");
  CREATE INDEX "robots_price_offers_parent_id_idx" ON "robots_price_offers" USING btree ("_parent_id");
  CREATE INDEX "robots_load_ratings_order_idx" ON "robots_load_ratings" USING btree ("_order");
  CREATE INDEX "robots_load_ratings_parent_id_idx" ON "robots_load_ratings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "robots_stable_id_idx" ON "robots" USING btree ("stable_id");
  CREATE UNIQUE INDEX "robots_slug_idx" ON "robots" USING btree ("slug");
  CREATE INDEX "robots_manufacturer_id_idx" ON "robots" USING btree ("manufacturer_id_id");
  CREATE INDEX "robots_series_id_idx" ON "robots" USING btree ("series_id_id");
  CREATE INDEX "robots_superseded_by_id_idx" ON "robots" USING btree ("superseded_by_id_id");
  CREATE INDEX "robots_updated_at_idx" ON "robots" USING btree ("updated_at");
  CREATE INDEX "robots_created_at_idx" ON "robots" USING btree ("created_at");
  CREATE INDEX "robots__status_idx" ON "robots" USING btree ("_status");
  CREATE INDEX "robots_texts_order_parent" ON "robots_texts" USING btree ("order","parent_id");
  CREATE INDEX "_robots_v_version_sources_order_idx" ON "_robots_v_version_sources" USING btree ("_order");
  CREATE INDEX "_robots_v_version_sources_parent_id_idx" ON "_robots_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_robots_v_version_procurement_models_order_idx" ON "_robots_v_version_procurement_models" USING btree ("order");
  CREATE INDEX "_robots_v_version_procurement_models_parent_idx" ON "_robots_v_version_procurement_models" USING btree ("parent_id");
  CREATE INDEX "_robots_v_version_price_offers_order_idx" ON "_robots_v_version_price_offers" USING btree ("_order");
  CREATE INDEX "_robots_v_version_price_offers_parent_id_idx" ON "_robots_v_version_price_offers" USING btree ("_parent_id");
  CREATE INDEX "_robots_v_version_load_ratings_order_idx" ON "_robots_v_version_load_ratings" USING btree ("_order");
  CREATE INDEX "_robots_v_version_load_ratings_parent_id_idx" ON "_robots_v_version_load_ratings" USING btree ("_parent_id");
  CREATE INDEX "_robots_v_parent_idx" ON "_robots_v" USING btree ("parent_id");
  CREATE INDEX "_robots_v_version_version_stable_id_idx" ON "_robots_v" USING btree ("version_stable_id");
  CREATE INDEX "_robots_v_version_version_slug_idx" ON "_robots_v" USING btree ("version_slug");
  CREATE INDEX "_robots_v_version_version_manufacturer_id_idx" ON "_robots_v" USING btree ("version_manufacturer_id_id");
  CREATE INDEX "_robots_v_version_version_series_id_idx" ON "_robots_v" USING btree ("version_series_id_id");
  CREATE INDEX "_robots_v_version_version_superseded_by_id_idx" ON "_robots_v" USING btree ("version_superseded_by_id_id");
  CREATE INDEX "_robots_v_version_version_updated_at_idx" ON "_robots_v" USING btree ("version_updated_at");
  CREATE INDEX "_robots_v_version_version_created_at_idx" ON "_robots_v" USING btree ("version_created_at");
  CREATE INDEX "_robots_v_version_version__status_idx" ON "_robots_v" USING btree ("version__status");
  CREATE INDEX "_robots_v_created_at_idx" ON "_robots_v" USING btree ("created_at");
  CREATE INDEX "_robots_v_updated_at_idx" ON "_robots_v" USING btree ("updated_at");
  CREATE INDEX "_robots_v_latest_idx" ON "_robots_v" USING btree ("latest");
  CREATE INDEX "_robots_v_texts_order_parent" ON "_robots_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "use_cases_sources_order_idx" ON "use_cases_sources" USING btree ("_order");
  CREATE INDEX "use_cases_sources_parent_id_idx" ON "use_cases_sources" USING btree ("_parent_id");
  CREATE INDEX "use_cases_required_capabilities_order_idx" ON "use_cases_required_capabilities" USING btree ("order");
  CREATE INDEX "use_cases_required_capabilities_parent_idx" ON "use_cases_required_capabilities" USING btree ("parent_id");
  CREATE INDEX "use_cases_candidate_robots_order_idx" ON "use_cases_candidate_robots" USING btree ("_order");
  CREATE INDEX "use_cases_candidate_robots_parent_id_idx" ON "use_cases_candidate_robots" USING btree ("_parent_id");
  CREATE INDEX "use_cases_candidate_robots_robot_id_idx" ON "use_cases_candidate_robots" USING btree ("robot_id_id");
  CREATE INDEX "use_cases_candidate_robots_series_id_idx" ON "use_cases_candidate_robots" USING btree ("series_id_id");
  CREATE UNIQUE INDEX "use_cases_stable_id_idx" ON "use_cases" USING btree ("stable_id");
  CREATE UNIQUE INDEX "use_cases_slug_idx" ON "use_cases" USING btree ("slug");
  CREATE INDEX "use_cases_updated_at_idx" ON "use_cases" USING btree ("updated_at");
  CREATE INDEX "use_cases_created_at_idx" ON "use_cases" USING btree ("created_at");
  CREATE INDEX "use_cases__status_idx" ON "use_cases" USING btree ("_status");
  CREATE INDEX "use_cases_texts_order_parent" ON "use_cases_texts" USING btree ("order","parent_id");
  CREATE INDEX "use_cases_rels_order_idx" ON "use_cases_rels" USING btree ("order");
  CREATE INDEX "use_cases_rels_parent_idx" ON "use_cases_rels" USING btree ("parent_id");
  CREATE INDEX "use_cases_rels_path_idx" ON "use_cases_rels" USING btree ("path");
  CREATE INDEX "use_cases_rels_deployments_id_idx" ON "use_cases_rels" USING btree ("deployments_id");
  CREATE INDEX "_use_cases_v_version_sources_order_idx" ON "_use_cases_v_version_sources" USING btree ("_order");
  CREATE INDEX "_use_cases_v_version_sources_parent_id_idx" ON "_use_cases_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_use_cases_v_version_required_capabilities_order_idx" ON "_use_cases_v_version_required_capabilities" USING btree ("order");
  CREATE INDEX "_use_cases_v_version_required_capabilities_parent_idx" ON "_use_cases_v_version_required_capabilities" USING btree ("parent_id");
  CREATE INDEX "_use_cases_v_version_candidate_robots_order_idx" ON "_use_cases_v_version_candidate_robots" USING btree ("_order");
  CREATE INDEX "_use_cases_v_version_candidate_robots_parent_id_idx" ON "_use_cases_v_version_candidate_robots" USING btree ("_parent_id");
  CREATE INDEX "_use_cases_v_version_candidate_robots_robot_id_idx" ON "_use_cases_v_version_candidate_robots" USING btree ("robot_id_id");
  CREATE INDEX "_use_cases_v_version_candidate_robots_series_id_idx" ON "_use_cases_v_version_candidate_robots" USING btree ("series_id_id");
  CREATE INDEX "_use_cases_v_parent_idx" ON "_use_cases_v" USING btree ("parent_id");
  CREATE INDEX "_use_cases_v_version_version_stable_id_idx" ON "_use_cases_v" USING btree ("version_stable_id");
  CREATE INDEX "_use_cases_v_version_version_slug_idx" ON "_use_cases_v" USING btree ("version_slug");
  CREATE INDEX "_use_cases_v_version_version_updated_at_idx" ON "_use_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_use_cases_v_version_version_created_at_idx" ON "_use_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_use_cases_v_version_version__status_idx" ON "_use_cases_v" USING btree ("version__status");
  CREATE INDEX "_use_cases_v_created_at_idx" ON "_use_cases_v" USING btree ("created_at");
  CREATE INDEX "_use_cases_v_updated_at_idx" ON "_use_cases_v" USING btree ("updated_at");
  CREATE INDEX "_use_cases_v_latest_idx" ON "_use_cases_v" USING btree ("latest");
  CREATE INDEX "_use_cases_v_texts_order_parent" ON "_use_cases_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_use_cases_v_rels_order_idx" ON "_use_cases_v_rels" USING btree ("order");
  CREATE INDEX "_use_cases_v_rels_parent_idx" ON "_use_cases_v_rels" USING btree ("parent_id");
  CREATE INDEX "_use_cases_v_rels_path_idx" ON "_use_cases_v_rels" USING btree ("path");
  CREATE INDEX "_use_cases_v_rels_deployments_id_idx" ON "_use_cases_v_rels" USING btree ("deployments_id");
  CREATE INDEX "deployments_sources_order_idx" ON "deployments_sources" USING btree ("_order");
  CREATE INDEX "deployments_sources_parent_id_idx" ON "deployments_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "deployments_stable_id_idx" ON "deployments" USING btree ("stable_id");
  CREATE UNIQUE INDEX "deployments_slug_idx" ON "deployments" USING btree ("slug");
  CREATE INDEX "deployments_manufacturer_id_idx" ON "deployments" USING btree ("manufacturer_id_id");
  CREATE INDEX "deployments_robot_id_idx" ON "deployments" USING btree ("robot_id_id");
  CREATE INDEX "deployments_updated_at_idx" ON "deployments" USING btree ("updated_at");
  CREATE INDEX "deployments_created_at_idx" ON "deployments" USING btree ("created_at");
  CREATE INDEX "deployments__status_idx" ON "deployments" USING btree ("_status");
  CREATE INDEX "deployments_texts_order_parent" ON "deployments_texts" USING btree ("order","parent_id");
  CREATE INDEX "deployments_rels_order_idx" ON "deployments_rels" USING btree ("order");
  CREATE INDEX "deployments_rels_parent_idx" ON "deployments_rels" USING btree ("parent_id");
  CREATE INDEX "deployments_rels_path_idx" ON "deployments_rels" USING btree ("path");
  CREATE INDEX "deployments_rels_use_cases_id_idx" ON "deployments_rels" USING btree ("use_cases_id");
  CREATE INDEX "_deployments_v_version_sources_order_idx" ON "_deployments_v_version_sources" USING btree ("_order");
  CREATE INDEX "_deployments_v_version_sources_parent_id_idx" ON "_deployments_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_deployments_v_parent_idx" ON "_deployments_v" USING btree ("parent_id");
  CREATE INDEX "_deployments_v_version_version_stable_id_idx" ON "_deployments_v" USING btree ("version_stable_id");
  CREATE INDEX "_deployments_v_version_version_slug_idx" ON "_deployments_v" USING btree ("version_slug");
  CREATE INDEX "_deployments_v_version_version_manufacturer_id_idx" ON "_deployments_v" USING btree ("version_manufacturer_id_id");
  CREATE INDEX "_deployments_v_version_version_robot_id_idx" ON "_deployments_v" USING btree ("version_robot_id_id");
  CREATE INDEX "_deployments_v_version_version_updated_at_idx" ON "_deployments_v" USING btree ("version_updated_at");
  CREATE INDEX "_deployments_v_version_version_created_at_idx" ON "_deployments_v" USING btree ("version_created_at");
  CREATE INDEX "_deployments_v_version_version__status_idx" ON "_deployments_v" USING btree ("version__status");
  CREATE INDEX "_deployments_v_created_at_idx" ON "_deployments_v" USING btree ("created_at");
  CREATE INDEX "_deployments_v_updated_at_idx" ON "_deployments_v" USING btree ("updated_at");
  CREATE INDEX "_deployments_v_latest_idx" ON "_deployments_v" USING btree ("latest");
  CREATE INDEX "_deployments_v_texts_order_parent" ON "_deployments_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_deployments_v_rels_order_idx" ON "_deployments_v_rels" USING btree ("order");
  CREATE INDEX "_deployments_v_rels_parent_idx" ON "_deployments_v_rels" USING btree ("parent_id");
  CREATE INDEX "_deployments_v_rels_path_idx" ON "_deployments_v_rels" USING btree ("path");
  CREATE INDEX "_deployments_v_rels_use_cases_id_idx" ON "_deployments_v_rels" USING btree ("use_cases_id");
  CREATE INDEX "articles_sources_order_idx" ON "articles_sources" USING btree ("_order");
  CREATE INDEX "articles_sources_parent_id_idx" ON "articles_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_stable_id_idx" ON "articles" USING btree ("stable_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_texts_order_parent" ON "articles_texts" USING btree ("order","parent_id");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_robots_id_idx" ON "articles_rels" USING btree ("robots_id");
  CREATE INDEX "articles_rels_manufacturers_id_idx" ON "articles_rels" USING btree ("manufacturers_id");
  CREATE INDEX "articles_rels_use_cases_id_idx" ON "articles_rels" USING btree ("use_cases_id");
  CREATE INDEX "_articles_v_version_sources_order_idx" ON "_articles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sources_parent_id_idx" ON "_articles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_stable_id_idx" ON "_articles_v" USING btree ("version_stable_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_texts_order_parent" ON "_articles_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_robots_id_idx" ON "_articles_v_rels" USING btree ("robots_id");
  CREATE INDEX "_articles_v_rels_manufacturers_id_idx" ON "_articles_v_rels" USING btree ("manufacturers_id");
  CREATE INDEX "_articles_v_rels_use_cases_id_idx" ON "_articles_v_rels" USING btree ("use_cases_id");
  CREATE UNIQUE INDEX "article_placements_stable_id_idx" ON "article_placements" USING btree ("stable_id");
  CREATE UNIQUE INDEX "article_placements_slug_idx" ON "article_placements" USING btree ("slug");
  CREATE INDEX "article_placements_article_id_idx" ON "article_placements" USING btree ("article_id_id");
  CREATE INDEX "article_placements_updated_at_idx" ON "article_placements" USING btree ("updated_at");
  CREATE INDEX "article_placements_created_at_idx" ON "article_placements" USING btree ("created_at");
  CREATE INDEX "article_placements__status_idx" ON "article_placements" USING btree ("_status");
  CREATE INDEX "article_placements_texts_order_parent" ON "article_placements_texts" USING btree ("order","parent_id");
  CREATE INDEX "_article_placements_v_parent_idx" ON "_article_placements_v" USING btree ("parent_id");
  CREATE INDEX "_article_placements_v_version_version_stable_id_idx" ON "_article_placements_v" USING btree ("version_stable_id");
  CREATE INDEX "_article_placements_v_version_version_slug_idx" ON "_article_placements_v" USING btree ("version_slug");
  CREATE INDEX "_article_placements_v_version_version_article_id_idx" ON "_article_placements_v" USING btree ("version_article_id_id");
  CREATE INDEX "_article_placements_v_version_version_updated_at_idx" ON "_article_placements_v" USING btree ("version_updated_at");
  CREATE INDEX "_article_placements_v_version_version_created_at_idx" ON "_article_placements_v" USING btree ("version_created_at");
  CREATE INDEX "_article_placements_v_version_version__status_idx" ON "_article_placements_v" USING btree ("version__status");
  CREATE INDEX "_article_placements_v_created_at_idx" ON "_article_placements_v" USING btree ("created_at");
  CREATE INDEX "_article_placements_v_updated_at_idx" ON "_article_placements_v" USING btree ("updated_at");
  CREATE INDEX "_article_placements_v_latest_idx" ON "_article_placements_v" USING btree ("latest");
  CREATE INDEX "_article_placements_v_texts_order_parent" ON "_article_placements_v_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "media_stable_id_idx" ON "media" USING btree ("stable_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "content_route_registry_namespace_idx" ON "content_route_registry" USING btree ("namespace");
  CREATE INDEX "content_route_registry_owner_stable_id_idx" ON "content_route_registry" USING btree ("owner_stable_id");
  CREATE INDEX "content_route_registry_updated_at_idx" ON "content_route_registry" USING btree ("updated_at");
  CREATE INDEX "content_route_registry_created_at_idx" ON "content_route_registry" USING btree ("created_at");
  CREATE UNIQUE INDEX "namespace_slug_idx" ON "content_route_registry" USING btree ("namespace","slug");
  CREATE UNIQUE INDEX "_environment_marker_singleton_idx" ON "_environment_marker" USING btree ("singleton");
  CREATE INDEX "_environment_marker_updated_at_idx" ON "_environment_marker" USING btree ("updated_at");
  CREATE INDEX "_environment_marker_created_at_idx" ON "_environment_marker" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_manufacturers_id_idx" ON "payload_locked_documents_rels" USING btree ("manufacturers_id");
  CREATE INDEX "payload_locked_documents_rels_distributors_id_idx" ON "payload_locked_documents_rels" USING btree ("distributors_id");
  CREATE INDEX "payload_locked_documents_rels_robot_series_id_idx" ON "payload_locked_documents_rels" USING btree ("robot_series_id");
  CREATE INDEX "payload_locked_documents_rels_robots_id_idx" ON "payload_locked_documents_rels" USING btree ("robots_id");
  CREATE INDEX "payload_locked_documents_rels_use_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("use_cases_id");
  CREATE INDEX "payload_locked_documents_rels_deployments_id_idx" ON "payload_locked_documents_rels" USING btree ("deployments_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_article_placements_id_idx" ON "payload_locked_documents_rels" USING btree ("article_placements_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_content_route_registry_id_idx" ON "payload_locked_documents_rels" USING btree ("content_route_registry_id");
  CREATE INDEX "payload_locked_documents_rels__environment_marker_id_idx" ON "payload_locked_documents_rels" USING btree ("_environment_marker_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "manufacturers_sources" CASCADE;
  DROP TABLE "manufacturers_domestic_distributors" CASCADE;
  DROP TABLE "manufacturers" CASCADE;
  DROP TABLE "manufacturers_texts" CASCADE;
  DROP TABLE "_manufacturers_v_version_sources" CASCADE;
  DROP TABLE "_manufacturers_v_version_domestic_distributors" CASCADE;
  DROP TABLE "_manufacturers_v" CASCADE;
  DROP TABLE "_manufacturers_v_texts" CASCADE;
  DROP TABLE "distributors_sources" CASCADE;
  DROP TABLE "distributors_acquisition_methods" CASCADE;
  DROP TABLE "distributors" CASCADE;
  DROP TABLE "distributors_texts" CASCADE;
  DROP TABLE "distributors_rels" CASCADE;
  DROP TABLE "_distributors_v_version_sources" CASCADE;
  DROP TABLE "_distributors_v_version_acquisition_methods" CASCADE;
  DROP TABLE "_distributors_v" CASCADE;
  DROP TABLE "_distributors_v_texts" CASCADE;
  DROP TABLE "_distributors_v_rels" CASCADE;
  DROP TABLE "robot_series_sources" CASCADE;
  DROP TABLE "robot_series" CASCADE;
  DROP TABLE "robot_series_texts" CASCADE;
  DROP TABLE "_robot_series_v_version_sources" CASCADE;
  DROP TABLE "_robot_series_v" CASCADE;
  DROP TABLE "_robot_series_v_texts" CASCADE;
  DROP TABLE "robots_sources" CASCADE;
  DROP TABLE "robots_procurement_models" CASCADE;
  DROP TABLE "robots_price_offers" CASCADE;
  DROP TABLE "robots_load_ratings" CASCADE;
  DROP TABLE "robots" CASCADE;
  DROP TABLE "robots_texts" CASCADE;
  DROP TABLE "_robots_v_version_sources" CASCADE;
  DROP TABLE "_robots_v_version_procurement_models" CASCADE;
  DROP TABLE "_robots_v_version_price_offers" CASCADE;
  DROP TABLE "_robots_v_version_load_ratings" CASCADE;
  DROP TABLE "_robots_v" CASCADE;
  DROP TABLE "_robots_v_texts" CASCADE;
  DROP TABLE "use_cases_sources" CASCADE;
  DROP TABLE "use_cases_required_capabilities" CASCADE;
  DROP TABLE "use_cases_candidate_robots" CASCADE;
  DROP TABLE "use_cases" CASCADE;
  DROP TABLE "use_cases_texts" CASCADE;
  DROP TABLE "use_cases_rels" CASCADE;
  DROP TABLE "_use_cases_v_version_sources" CASCADE;
  DROP TABLE "_use_cases_v_version_required_capabilities" CASCADE;
  DROP TABLE "_use_cases_v_version_candidate_robots" CASCADE;
  DROP TABLE "_use_cases_v" CASCADE;
  DROP TABLE "_use_cases_v_texts" CASCADE;
  DROP TABLE "_use_cases_v_rels" CASCADE;
  DROP TABLE "deployments_sources" CASCADE;
  DROP TABLE "deployments" CASCADE;
  DROP TABLE "deployments_texts" CASCADE;
  DROP TABLE "deployments_rels" CASCADE;
  DROP TABLE "_deployments_v_version_sources" CASCADE;
  DROP TABLE "_deployments_v" CASCADE;
  DROP TABLE "_deployments_v_texts" CASCADE;
  DROP TABLE "_deployments_v_rels" CASCADE;
  DROP TABLE "articles_sources" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_texts" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_sources" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_texts" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "article_placements" CASCADE;
  DROP TABLE "article_placements_texts" CASCADE;
  DROP TABLE "_article_placements_v" CASCADE;
  DROP TABLE "_article_placements_v_texts" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "content_route_registry" CASCADE;
  DROP TABLE "_environment_marker" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TYPE "public"."enum_admins_role";
  DROP TYPE "public"."enum_manufacturers_sources_reliability";
  DROP TYPE "public"."enum_manufacturers_lifecycle_status";
  DROP TYPE "public"."enum_manufacturers_reliability";
  DROP TYPE "public"."enum_manufacturers_hero_image_rights_status";
  DROP TYPE "public"."enum_manufacturers_hero_image_rights_source_type";
  DROP TYPE "public"."enum_manufacturers_company_type";
  DROP TYPE "public"."enum_manufacturers_company_status";
  DROP TYPE "public"."enum_manufacturers_japan_presence";
  DROP TYPE "public"."enum_manufacturers_status";
  DROP TYPE "public"."enum__manufacturers_v_version_sources_reliability";
  DROP TYPE "public"."enum__manufacturers_v_version_lifecycle_status";
  DROP TYPE "public"."enum__manufacturers_v_version_reliability";
  DROP TYPE "public"."enum__manufacturers_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__manufacturers_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__manufacturers_v_version_company_type";
  DROP TYPE "public"."enum__manufacturers_v_version_company_status";
  DROP TYPE "public"."enum__manufacturers_v_version_japan_presence";
  DROP TYPE "public"."enum__manufacturers_v_version_status";
  DROP TYPE "public"."enum_distributors_sources_reliability";
  DROP TYPE "public"."enum_distributors_acquisition_methods";
  DROP TYPE "public"."enum_distributors_lifecycle_status";
  DROP TYPE "public"."enum_distributors_reliability";
  DROP TYPE "public"."enum_distributors_hero_image_rights_status";
  DROP TYPE "public"."enum_distributors_hero_image_rights_source_type";
  DROP TYPE "public"."enum_distributors_provider_type";
  DROP TYPE "public"."enum_distributors_status";
  DROP TYPE "public"."enum__distributors_v_version_sources_reliability";
  DROP TYPE "public"."enum__distributors_v_version_acquisition_methods";
  DROP TYPE "public"."enum__distributors_v_version_lifecycle_status";
  DROP TYPE "public"."enum__distributors_v_version_reliability";
  DROP TYPE "public"."enum__distributors_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__distributors_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__distributors_v_version_provider_type";
  DROP TYPE "public"."enum__distributors_v_version_status";
  DROP TYPE "public"."enum_robot_series_sources_reliability";
  DROP TYPE "public"."enum_robot_series_lifecycle_status";
  DROP TYPE "public"."enum_robot_series_reliability";
  DROP TYPE "public"."enum_robot_series_hero_image_rights_status";
  DROP TYPE "public"."enum_robot_series_hero_image_rights_source_type";
  DROP TYPE "public"."enum_robot_series_status";
  DROP TYPE "public"."enum__robot_series_v_version_sources_reliability";
  DROP TYPE "public"."enum__robot_series_v_version_lifecycle_status";
  DROP TYPE "public"."enum__robot_series_v_version_reliability";
  DROP TYPE "public"."enum__robot_series_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__robot_series_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__robot_series_v_version_status";
  DROP TYPE "public"."enum_robots_sources_reliability";
  DROP TYPE "public"."enum_robots_procurement_models";
  DROP TYPE "public"."enum_robots_price_offers_channel";
  DROP TYPE "public"."enum_robots_price_offers_tax_status";
  DROP TYPE "public"."enum_robots_load_ratings_scope";
  DROP TYPE "public"."enum_robots_load_ratings_rating";
  DROP TYPE "public"."enum_robots_lifecycle_status";
  DROP TYPE "public"."enum_robots_reliability";
  DROP TYPE "public"."enum_robots_hero_image_rights_status";
  DROP TYPE "public"."enum_robots_hero_image_rights_source_type";
  DROP TYPE "public"."enum_robots_category";
  DROP TYPE "public"."enum_robots_deployment_stage";
  DROP TYPE "public"."enum_robots_japan_availability";
  DROP TYPE "public"."enum_robots_status";
  DROP TYPE "public"."enum__robots_v_version_sources_reliability";
  DROP TYPE "public"."enum__robots_v_version_procurement_models";
  DROP TYPE "public"."enum__robots_v_version_price_offers_channel";
  DROP TYPE "public"."enum__robots_v_version_price_offers_tax_status";
  DROP TYPE "public"."enum__robots_v_version_load_ratings_scope";
  DROP TYPE "public"."enum__robots_v_version_load_ratings_rating";
  DROP TYPE "public"."enum__robots_v_version_lifecycle_status";
  DROP TYPE "public"."enum__robots_v_version_reliability";
  DROP TYPE "public"."enum__robots_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__robots_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__robots_v_version_category";
  DROP TYPE "public"."enum__robots_v_version_deployment_stage";
  DROP TYPE "public"."enum__robots_v_version_japan_availability";
  DROP TYPE "public"."enum__robots_v_version_status";
  DROP TYPE "public"."enum_use_cases_sources_reliability";
  DROP TYPE "public"."enum_use_cases_required_capabilities";
  DROP TYPE "public"."enum_use_cases_candidate_robots_fit";
  DROP TYPE "public"."enum_use_cases_candidate_robots_basis";
  DROP TYPE "public"."enum_use_cases_lifecycle_status";
  DROP TYPE "public"."enum_use_cases_reliability";
  DROP TYPE "public"."enum_use_cases_hero_image_rights_status";
  DROP TYPE "public"."enum_use_cases_hero_image_rights_source_type";
  DROP TYPE "public"."enum_use_cases_maturity_level";
  DROP TYPE "public"."enum_use_cases_buyer_readiness";
  DROP TYPE "public"."enum_use_cases_environment";
  DROP TYPE "public"."enum_use_cases_status";
  DROP TYPE "public"."enum__use_cases_v_version_sources_reliability";
  DROP TYPE "public"."enum__use_cases_v_version_required_capabilities";
  DROP TYPE "public"."enum__use_cases_v_version_candidate_robots_fit";
  DROP TYPE "public"."enum__use_cases_v_version_candidate_robots_basis";
  DROP TYPE "public"."enum__use_cases_v_version_lifecycle_status";
  DROP TYPE "public"."enum__use_cases_v_version_reliability";
  DROP TYPE "public"."enum__use_cases_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__use_cases_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__use_cases_v_version_maturity_level";
  DROP TYPE "public"."enum__use_cases_v_version_buyer_readiness";
  DROP TYPE "public"."enum__use_cases_v_version_environment";
  DROP TYPE "public"."enum__use_cases_v_version_status";
  DROP TYPE "public"."enum_deployments_sources_reliability";
  DROP TYPE "public"."enum_deployments_lifecycle_status";
  DROP TYPE "public"."enum_deployments_reliability";
  DROP TYPE "public"."enum_deployments_hero_image_rights_status";
  DROP TYPE "public"."enum_deployments_hero_image_rights_source_type";
  DROP TYPE "public"."enum_deployments_status";
  DROP TYPE "public"."enum__deployments_v_version_sources_reliability";
  DROP TYPE "public"."enum__deployments_v_version_lifecycle_status";
  DROP TYPE "public"."enum__deployments_v_version_reliability";
  DROP TYPE "public"."enum__deployments_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__deployments_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__deployments_v_version_status";
  DROP TYPE "public"."enum_articles_sources_reliability";
  DROP TYPE "public"."enum_articles_lifecycle_status";
  DROP TYPE "public"."enum_articles_reliability";
  DROP TYPE "public"."enum_articles_hero_image_rights_status";
  DROP TYPE "public"."enum_articles_hero_image_rights_source_type";
  DROP TYPE "public"."enum_articles_category";
  DROP TYPE "public"."enum_articles_type";
  DROP TYPE "public"."enum_articles_section";
  DROP TYPE "public"."enum_articles_content_kind";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_sources_reliability";
  DROP TYPE "public"."enum__articles_v_version_lifecycle_status";
  DROP TYPE "public"."enum__articles_v_version_reliability";
  DROP TYPE "public"."enum__articles_v_version_hero_image_rights_status";
  DROP TYPE "public"."enum__articles_v_version_hero_image_rights_source_type";
  DROP TYPE "public"."enum__articles_v_version_category";
  DROP TYPE "public"."enum__articles_v_version_type";
  DROP TYPE "public"."enum__articles_v_version_section";
  DROP TYPE "public"."enum__articles_v_version_content_kind";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_article_placements_lifecycle_status";
  DROP TYPE "public"."enum_article_placements_surface";
  DROP TYPE "public"."enum_article_placements_slot";
  DROP TYPE "public"."enum_article_placements_kind";
  DROP TYPE "public"."enum_article_placements_status";
  DROP TYPE "public"."enum__article_placements_v_version_lifecycle_status";
  DROP TYPE "public"."enum__article_placements_v_version_surface";
  DROP TYPE "public"."enum__article_placements_v_version_slot";
  DROP TYPE "public"."enum__article_placements_v_version_kind";
  DROP TYPE "public"."enum__article_placements_v_version_status";
  DROP TYPE "public"."enum_media_rights_status";
  DROP TYPE "public"."enum_media_rights_source_type";
  DROP TYPE "public"."enum_content_route_registry_owner_collection";
  DROP TYPE "public"."enum__environment_marker_environment";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_status";`)
}
