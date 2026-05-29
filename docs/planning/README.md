# Planning Documents

This directory contains the current planning source for the Next.js migration.

Primary files:

- `nextjs_data_types_v1.ts`: source of truth for `data/types.ts`
- `nextjs_pre_migration_decisions_v1.md`: URL, navigation, data, CMS, and UI decisions before migration
- `nextjs_migration_guide_v1.md`: step-by-step Vite/Figma Make UI to Next.js migration guide
- `figma_ui_restoration_plan_v1.md`: phase-based plan to restore Figma Make UI fidelity in the Next.js implementation
- `ai_fullstack_development_guardrails_v1.md`: guardrails for AI-only web/full-stack implementation, self-audit phases, and fail-safes
- `refactor_search_tags_execution_plan_v1.md`: phase plan for UI deduplication, data/helper cleanup, tag behavior, search improvements, and safety checks
- `refactor_search_tags_phase1_audit_v1.md`: Phase 1 audit findings and prioritized implementation targets for the refactor/search/tag plan
- `refactor_search_tags_phase3_5_recovery_plan_v1.md`: follow-up recovery plan before returning from Phase 3 to Phase 4 tag foundations
- `refactor_search_tags_phase9_final_audit_v1.md`: final audit results after the UI/search/tag/env refactor phases
- `ui_architecture_and_development_policy_v1.md`: current UI structure, component responsibilities, and future UI development policy
- `design_system_v1.md`: visual design system, layout rules, component patterns, and UI acceptance checklist
- `humanoid_platform_tech_stack_v1.md`: technology stack decision
- `humanoid_data_model_policy_v1.md`: data model policy and quality rules
- `humanoid_data_management_guide_v1.md`: data operation guide
- `copyright_and_media_rights_policy_v1.md`: copyright, trademark, media rights, and publication gate policy

Legacy Astro files in the repository are references only. New implementation work should follow the Next.js direction documented here.
