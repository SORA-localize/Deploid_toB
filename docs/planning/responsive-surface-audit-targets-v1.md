# Responsive Surface Audit Targets v1

Created: 2026-07-03
Status: active / unimplemented plan
Scope: Deploid project-wide responsive behavior audit target inventory

## 0. Purpose

この文書は、レスポンシブ改善の実装前に、調査対象を MECE に棚卸しするための Phase 0 ドキュメントである。

今回の前提:

- 現在すでに入っているレスポンシブ調整は、いったん「正しい」とはみなさない。
- ただし実装判断では、現在のコード・型・共通部品を最優先の事実として扱う。
- YouTube など大規模ブラウザ版サービスのように、画面幅ごとに情報密度・ナビゲーション・操作面を切り替える考え方を参考にする。
- 具体的な UI 変更はこの文書では行わず、まず対象の漏れをなくす。

この版での MECE の定義:

1. `src/app` の user-facing route は include / exclude を検算できる形で列挙する。
2. Page archetype は排他的にする。1 route は 1 archetype だけに属する。
3. Global shell、state、accessibility、content stress、device condition は page archetype ではなく横断軸として扱う。
4. Component inventory は owner group を一意にする。1 listed component file は 1 owner group だけに属し、他の利用箇所は `Referenced by` に書く。
5. Current visual surfaces、unused/planned helpers、behavior/data helper sources を混ぜない。
6. Risk は task に逆引きできるようにし、未割当を残さない。

## 1. Inputs Read

Project rules:

- `AGENTS.md`
- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/30-ui-design.md`
- `ai/rules/80-doc-governance.md`

Current source-of-truth docs:

- `docs/planning/README.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/planning/humanoid_media_build_notes_v1.md`

Current code roots inspected:

- `src/app/**/page.tsx`
- `src/app/layout.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/app/globals.css`
- `components/*.tsx`
- `components/compare/*.tsx`
- `components/ui/*.tsx` where relevant
- `components/uilayouts/*.tsx`
- `data/*.ts`
- `lib/data.ts`
- `lib/siteNavigation.ts`
- `lib/siteLayout.ts`
- `lib/useHeaderStickyBarVisibility.ts`
- `lib/useActiveSection.ts`
- `lib/activeSectionContext.tsx`
- `lib/scroll.ts`
- `lib/visualSemantics.ts`
- `lib/display.ts`
- `lib/robotDisplay.ts`
- `lib/manufacturerDisplay.ts`
- `lib/manufacturerGuideTemplate.ts`
- `lib/useCaseEvidence.ts`
- `lib/useTiltCardEffect.ts`
- `lib/typography.ts`
- `lib/markdownHeadings.ts`
- `lib/useUrlParamUpdater.ts`
- `lib/useFavorites.ts`
- `lib/searchParams.ts`
- `lib/search.ts`
- `lib/searchIndex.ts`
- `lib/tags.ts`
- `lib/tagRegistry.ts`
- `lib/facetConfig.ts`
- `lib/robotFilters.ts`
- `lib/manufacturerFilters.ts`
- `lib/useCaseFilters.ts`
- `lib/articleFilters.ts`
- `lib/articleShelves.ts`
- `lib/articlePagination.ts`
- `lib/articlePlacements.ts`
- `lib/useArticlesPerPage.ts`
- `lib/media.ts`
- `lib/env.ts`
- `lib/compareParams.ts`
- `lib/compare/dnd.ts`
- `lib/specSchema.ts`
- `lib/uiText.ts`
- `lib/labels.ts`
- `.env.example`

Support/non-viewport files inspected or explicitly treated as non-owner context:

- `lib/indexing.ts`
- `lib/jsonLd.ts`
- `lib/metadata.ts`
- `lib/site.ts`
- `lib/typeGuards.ts`
- `lib/utils.ts`
- `lib/validate.ts`

Important note:

- `docs/planning/responsive-design-implementation-plan.md` is listed as background, not as a standing implementation rule. It should not be executed as-is. This audit starts from current code and current source-of-truth docs.

## 2. External Reference Stance

The user mentioned YouTube browser UI as a quality reference. The live YouTube page exposed through the available text fetch did not provide a usable DOM snapshot, so this Phase 0 document does not claim a pixel-level YouTube comparison.

Reference principles to carry forward:

- Adaptive shell: global navigation changes by available width, not just by one mobile breakpoint.
- Density switching: cards and grids change information density by context and width.
- Progressive disclosure: sidebars, metadata, filters, and secondary actions move behind drawers, sheets, or inline sections on small screens.
- Touch-first controls: critical operations cannot be hover-only on touch devices.
- Content-constrained breakpoints: breakpoints should be based on readable card/control widths, not only default Tailwind breakpoints.
- Scroll discipline: horizontal scroll is reserved for fixed-format controls such as tab bars, carousels, and comparison surfaces.

## 3. App File Coverage

This table makes the route-tree coverage auditable. `src/app/.DS_Store` is a local filesystem artifact and is not a route or implementation target.

| File | Status | Reason |
| --- | --- | --- |
| `src/app/layout.tsx` | Included | Global shell and page min-height |
| `src/app/globals.css` | Included | Theme tokens, container widths, sticky offset variables |
| `src/app/page.tsx` | Included | `/` home route |
| `src/app/robots/page.tsx` | Included | `/robots` browser route |
| `src/app/robots/[slug]/page.tsx` | Included | robot detail route |
| `src/app/robots/loading.tsx` | Included | `/robots` loading state |
| `src/app/robots/[slug]/loading.tsx` | Included | robot detail loading state |
| `src/app/manufacturers/page.tsx` | Included | `/manufacturers` browser route |
| `src/app/manufacturers/[slug]/page.tsx` | Included | manufacturer detail route |
| `src/app/manufacturers/loading.tsx` | Included | `/manufacturers` loading state |
| `src/app/manufacturers/[slug]/loading.tsx` | Included | manufacturer detail loading state |
| `src/app/compare/page.tsx` | Included | `/compare` interactive route |
| `src/app/compare/loading.tsx` | Included | `/compare` loading state |
| `src/app/use-cases/page.tsx` | Included | `/use-cases` browser route |
| `src/app/use-cases/[slug]/page.tsx` | Included | use-case detail route |
| `src/app/use-cases/loading.tsx` | Included | `/use-cases` loading state |
| `src/app/use-cases/[slug]/loading.tsx` | Included | use-case detail loading state |
| `src/app/reports/page.tsx` | Included | `/reports` browser route |
| `src/app/reports/[slug]/page.tsx` | Included | article detail route |
| `src/app/reports/loading.tsx` | Included | `/reports` loading state |
| `src/app/reports/[slug]/loading.tsx` | Included | article detail loading state |
| `src/app/about/page.tsx` | Included | static content route |
| `src/app/contact/page.tsx` | Included | form route |
| `src/app/for-manufacturers/page.tsx` | Included | static content route |
| `src/app/privacy/page.tsx` | Included | static content route |
| `src/app/not-found.tsx` | Included | fallback state route |
| `src/app/error.tsx` | Included | error state route |
| `src/app/opengraph-image.tsx` | Excluded from viewport audit | generated social image; audit separately for OGP rendering, not responsive viewport behavior |
| `src/app/icon.png` | Excluded from viewport audit | static icon asset |
| `src/app/robots.ts` | Excluded from viewport audit | metadata route, no visual viewport |
| `src/app/sitemap.ts` | Excluded from viewport audit | metadata route, no visual viewport |

Coverage checksum:

- Included visual files: 26 files (`layout`, 14 page routes, 9 loading routes, `not-found`, `error`) plus `globals.css`.
- Excluded app files: 4 route/asset files with non-viewport reasons plus 1 local artifact (`src/app/.DS_Store`).
- Current public page routes represented below: 14.

## 4. Exclusive Page Archetypes

Each user-facing route belongs to exactly one archetype.

| Archetype | Routes | Page Files | Primary Responsive Responsibility |
| --- | --- | --- | --- |
| A-01 Home discovery | `/` | `src/app/page.tsx` | first viewport, map hero, horizontal shelves, carousel/media balance |
| A-02 Collection browser | `/robots`, `/manufacturers`, `/use-cases`, `/reports` | collection `page.tsx` files | search/filter/tabs/results/cards scanning workflow |
| A-03 Decision detail | `/robots/[slug]`, `/manufacturers/[slug]`, `/use-cases/[slug]` | detail `page.tsx` files except reports | title/summary, decision blocks, sidebars, related records |
| A-04 Article detail | `/reports/[slug]` | `src/app/reports/[slug]/page.tsx` | hero, article line length, TOC, related/sidebar content |
| A-05 Compare tool | `/compare` | `src/app/compare/page.tsx` | selected robot sheet, DnD/tap fallback, detail drawer |
| A-06 Static content | `/about`, `/for-manufacturers`, `/privacy` | static `page.tsx` files | single-column reading, definition lists, legal text |
| A-07 Contact form | `/contact` | `src/app/contact/page.tsx` | form controls, disabled/submitting/success/error states, privacy link wrapping |
| A-08 Fallback | `not-found`, runtime error | `src/app/not-found.tsx`, `src/app/error.tsx` | recovery actions, empty/error readability |

Non-archetype cross-cutting axes are defined in section 5.

## 5. Cross-Cutting Surfaces

These surfaces are intentionally not exclusive. They are audit axes applied across the exclusive archetypes.

| Surface ID | Surface | Applies To | Audit Concern |
| --- | --- | --- | --- |
| X-01 | Global shell | all archetypes | header, footer, mobile drawer, theme toggle, analytics shell, body scroll lock |
| X-02 | Contextual sticky navigation | A-02, A-03, A-04 | sticky tabs, active chips, section nav, scroll-to-top, anchor offsets |
| X-03 | Search/filter/form controls | A-02, A-05, A-07 | trigger width, dropdown width, keyboard/touch operation, label wrapping |
| X-04 | Card/grid density | A-01, A-02, A-03, A-04, A-05 | columns, row height, image placeholders, touch targets |
| X-05 | Media and carousels | A-01, A-02, A-03, A-04, A-05 | image aspect ratios, hover-only controls, swipe/dot fallback, captions |
| X-06 | Overlays/drawers/popovers/tooltips | all interactive routes | viewport width, focus management, z-index, touch alternatives |
| X-07 | Detail sidebars / TOC | A-03, A-04 | desktop sticky behavior, mobile replacement, short viewport behavior |
| X-08 | Text/link overflow | all archetypes | long Japanese titles, long English names, URLs, source titles, tags |
| X-09 | Loading/empty/error/no-media states | all archetypes | state-specific layout, no-image cards, zero results, fallback routes |
| X-10 | Accessibility preferences | all archetypes | reduced motion, dark mode, keyboard focus, coarse pointer |

## 6. Test Axes

The viewport matrix is split into independent axes. Required captures combine these axes instead of mixing them in one bucket table.

### 6.1 Width Axis

| Width ID | Width | Intent |
| --- | ---: | --- |
| W-01 | 320px | smallest high-risk mobile; fixed drawers and 2-column grids |
| W-02 | 360px | common small Android/mobile baseline |
| W-03 | 390px | common modern phone width |
| W-04 | 430px | large phone |
| W-05 | 768px | tablet portrait |
| W-06 | 1024px | first `lg` breakpoint risk |
| W-07 | 1280px | desktop baseline |
| W-08 | 1536px | wide desktop / dense grid |

Minimum width checks: W-01, W-02, W-03, W-05, W-06, W-07, W-08.

Optional targeted width check: W-04. Promote W-04 into the required matrix when changing large-phone card rails, drawers, form controls, or any breakpoint between 390px and 768px.

### 6.2 Height Axis

| Height ID | Height | Intent |
| --- | ---: | --- |
| H-01 | 568px | short mobile viewport |
| H-02 | 700px | short laptop/tablet browser |
| H-03 | 900px | normal desktop viewport |

Minimum height checks: H-01 with W-02, H-02 with W-06/W-07, H-03 with W-07/W-08.

### 6.3 Input / Preference Axis

| Axis ID | Condition | Required Checks |
| --- | --- | --- |
| P-01 | coarse pointer / touch | no hover-only critical controls; tap alternatives for popovers and carousels |
| P-02 | fine pointer | hover states, DnD, tooltip placement, sticky sidebars |
| P-03 | dark mode | token contrast, media overlays, borders, form controls |
| P-04 | reduced motion | map, tilt cards, carousel autoplay/progress, theme transition |
| P-05 | keyboard only | drawer, tabs, filters, dialogs, cards, pagination |

Minimum non-width checks: P-01, P-03, P-04, P-05.

## 7. Unique Component Owners

Rule: a listed file appears in exactly one owner group. If another surface uses it, that surface is named under `Referenced by`.

| Owner | Owned Files | Referenced By |
| --- | --- | --- |
| O-01 Global shell | `src/app/layout.tsx`, `src/app/globals.css`, `components/Header.tsx`, `components/HeaderChrome.tsx`, `components/Footer.tsx`, `components/ThemeProvider.tsx`, `components/ThemeModeToggle.tsx`, `components/AnalyticsScripts.tsx`, `components/GoogleAnalyticsPageView.tsx`, `lib/siteNavigation.ts`, `lib/siteLayout.ts` | X-01, all archetypes |
| O-02 Page position and sticky navigation | `components/Breadcrumbs.tsx`, `components/ContextualPageHeader.tsx`, `components/StickyPageHeader.tsx`, `components/PageTabBar.tsx`, `components/ActiveFilterChips.tsx`, `components/ScrollToTopButton.tsx`, `components/ScrollToTopIconButton.tsx`, `components/RobotDetailStickyHeader.tsx`, `components/ManufacturerDetailStickyHeader.tsx`, `components/ManufacturerDetailSectionNav.tsx`, `lib/useHeaderStickyBarVisibility.ts`, `lib/useActiveSection.ts`, `lib/activeSectionContext.tsx`, `lib/scroll.ts` | X-02, A-02, A-03, A-04, A-05, A-06, A-07 |
| O-03 Collection browsers and headers | `components/RobotsBrowser.tsx`, `components/ManufacturersBrowser.tsx`, `components/UseCasesBrowser.tsx`, `components/ReportsBrowser.tsx`, `components/RobotsHeader.tsx`, `components/ManufacturersHeader.tsx`, `components/UseCasesHeader.tsx`, `components/ReportsHeader.tsx`, `lib/useArticlesPerPage.ts`, `lib/articlePagination.ts` | A-02, X-03, X-06 |
| O-04 Search, filters, and select controls | `components/PageListHeader.tsx`, `components/SearchInput.tsx`, `components/SelectControl.tsx`, `components/ui/search-field.tsx`, `components/ui/searchable-dropdown.tsx`, `components/ui/select.tsx` | X-03, X-06, A-02, A-05 |
| O-05 Cards and compact list items | `components/RobotCard.tsx`, `components/ManufacturerCard.tsx`, `components/UseCaseCard.tsx`, `components/NewsCard.tsx`, `components/FeaturedRobotCard.tsx`, `components/NewsFeatureCard.tsx`, `components/FavoriteCard.tsx`, `components/TagChip.tsx`, `components/ManufacturerLogoName.tsx`, `components/ui/card-hover-effect.tsx`, `lib/useTiltCardEffect.ts` | X-04, X-06, A-01, A-02, A-03, A-04, A-05 |
| O-06 Home discovery media | `components/ManufacturerWorldMap.tsx`, `components/ManufacturerMapStage.tsx`, `components/ManufacturerMapCopy.tsx`, `components/HomeContentNavigator.tsx`, `components/FeaturedRobotsGrid.tsx`, `components/FeaturedUseCasesGrid.tsx`, `components/ui/encrypted-text.tsx` | A-01, X-05 |
| O-07 Carousel and media primitives | `components/RobotImageCarousel.tsx`, `components/NewsHeroCarousel.tsx`, `components/uilayouts/carousel.tsx` | A-01, A-02, A-03, X-05 |
| O-08 Detail content and sidebars | `components/DefinitionList.tsx`, `components/SourceList.tsx`, `components/RelatedLinkList.tsx`, `components/Markdown.tsx`, `components/ManufacturerGuideArticleBody.tsx`, `components/ManufacturerFactSheet.tsx`, `components/ManufacturerDetailHero.tsx`, `components/ManufacturerDetailSection.tsx`, `components/ManufacturerRobotsGrid.tsx`, `components/RobotStickyAside.tsx`, `components/SidebarSection.tsx`, `components/CandidateRobotList.tsx`, `components/ConsultationCta.tsx`, `components/ArticleToc.tsx`, `components/ArticleRelatedSidebar.tsx`, `components/JudgmentTable.tsx`, `components/YouTubeEmbed.tsx` | A-03, A-04, A-06, X-05, X-07, X-08 |
| O-09 Compare tool | `components/CompareClient.tsx`, `components/ComparisonRobotPanel.tsx`, `components/SortableCompareCard.tsx`, `components/compare/CompareParts.tsx`, `lib/compare/dnd.ts`, `lib/compareParams.ts` | A-05, X-06 |
| O-10 Forms and base inputs | `components/ContactForm.tsx`, `components/FormSelect.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx` | A-07, X-03 |
| O-11 Fallback and state components | `components/EmptyState.tsx`, `components/PageSuspenseFallback.tsx`, `components/CardGridSkeleton.tsx`, `components/ListPageSkeletonShell.tsx`, `components/ManufacturerCardGridSkeleton.tsx`, `components/UseCaseCardGridSkeleton.tsx`, `components/NewsCardGridSkeleton.tsx`, `components/RobotDetailSkeleton.tsx`, `components/ManufacturerDetailSkeleton.tsx`, `components/UseCaseDetailSkeleton.tsx`, `components/ArticleDetailSkeleton.tsx`, `components/CompareSkeleton.tsx`, `src/app/robots/loading.tsx`, `src/app/robots/[slug]/loading.tsx`, `src/app/manufacturers/loading.tsx`, `src/app/manufacturers/[slug]/loading.tsx`, `src/app/use-cases/loading.tsx`, `src/app/use-cases/[slug]/loading.tsx`, `src/app/reports/loading.tsx`, `src/app/reports/[slug]/loading.tsx`, `src/app/compare/loading.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx` | A-02, A-03, A-04, A-05, A-08, X-09 |
| O-12 Overlay and tooltip primitives | `components/ui/AnimatedTooltip.tsx` | X-06, O-02 tab descriptions |
| O-13 Typography and text segmentation | `components/BudouXText.tsx`, `lib/typography.ts`, `lib/markdownHeadings.ts` | X-08, A-02, A-03, A-04 |
| O-14 Unused/planned UI helpers | `components/FacetFilterBar.tsx`, `components/FilterChipGroup.tsx` | not a current route surface; validate before reuse |

Owner table audit note:

- O-06 intentionally owns home-only media components. `NewsHeroCarousel` is not listed there because it is owned by O-07 and referenced by A-01/A-02.
- A-07 form inputs/selects are owned by O-10, not O-04; O-04 covers search/filter/select controls on browser and compare surfaces.
- Inline Radix overlays are tracked through the owner that renders them: `searchable-dropdown` under O-04, manufacturer card popovers under O-05, use-case HoverCards under O-03, and comparison dialogs under O-09.
- O-14 is intentionally separated from current route surfaces. It should not drive screenshot requirements until an actual route imports it.
- Nonvisual helpers such as `components/JsonLd.tsx` are excluded from responsive owner grouping unless a future audit finds visual layout impact.

## 8. Component Owner Validation Rule

The owner table above is a plan artifact, not generated code. Any later component addition must update section 7 or explicitly mark the file out of responsive scope.

Validation rule:

- A listed file must appear in exactly one owner group.
- Reuse across routes must be represented in `Referenced by`, not by duplicating the file under multiple owners.
- If a future audit finds a duplicate, fix section 7 before creating implementation tasks.

## 9. Behavior / Data Helper Sources

These rows are behavior/data source-of-truth references, not additional component ownership. Some files also appear in owner groups where they directly shape a surface; the B-ID is used only for audit traceability.

| Helper ID | Source Files | Applies To | Responsive Audit Role |
| --- | --- | --- | --- |
| B-01 URL mutation | `lib/useUrlParamUpdater.ts` | A-02, A-05, O-02, O-03, O-04, O-09 | query state changes for filters, tabs, search, and compare selection |
| B-02 Favorite state | `lib/useFavorites.ts` | A-02, A-03, A-05, O-05, O-09 | localStorage-backed favorite empty/non-empty fixtures; key is `deploid_favorites` |
| B-03 Server search params | `lib/searchParams.ts` | A-02 route loaders | valid query-key set for screenshot URLs and empty-state URLs |
| B-04 Search documents and indexes | `lib/search.ts`, `lib/searchIndex.ts` | A-02 query states | keyword matching, zero-result fixture truth, Japanese tokenization |
| B-05 Tag registry and options | `lib/tags.ts`, `lib/tagRegistry.ts` | A-02 filters, article/use-case tags | valid tag keys, labels, counts, active-chip URL validity |
| B-06 Display order and release bucketing | `lib/display.ts` | robot cards, robot browser, report placements | robot sort order, active/pre-release bucketing, article ordering |
| B-07 Robot filters | `lib/robotFilters.ts` | `/robots`, robot card grids | valid active-chip stress URLs, zero-result truth, release section counts |
| B-08 Manufacturer filters | `lib/manufacturerFilters.ts` | `/manufacturers` | valid region/route filters, zero-result truth, card popover coverage |
| B-09 Use-case filters and facet config | `lib/useCaseFilters.ts`, `lib/facetConfig.ts` | `/use-cases` | valid industry/task filters, current `USE_CASE_FACETS`, hover-card/touch fallback coverage |
| B-10 Article filters | `lib/articleFilters.ts` | `/reports` | search/kind result truth, shelf tab fixtures, pagination edge conditions |
| B-11 Article shelves and pagination | `lib/articleShelves.ts`, `lib/articlePagination.ts`, `lib/useArticlesPerPage.ts` | `/reports` | shelf normalization, disabled tab behavior, responsive page count and clamp behavior |
| B-12 Article placements | `lib/articlePlacements.ts`, `data/articlePlacements.ts` | `/reports`, home/report cards | hero/feature report slot validity and fallback ordering |
| B-13 Media displayability | `lib/media.ts`, `.env.example` | A-01, A-02, A-03, A-04, A-05 | image/no-image fixture truth, policy-dependent placeholders, media environment default |
| B-14 Environment/config gates | `lib/env.ts`, `.env.example` | A-07, analytics/media setup | contact enabled/disabled state and reproducible environment assumptions |
| B-15 UI text and labels | `lib/uiText.ts`, `lib/labels.ts` | all archetypes | label length, accessible names, chip text, comparison row labels |
| B-16 Compare URL params | `lib/compareParams.ts` | `/compare` | selected-robot URL validity, max-count handling, invalid slug behavior |
| B-17 Data records and detail resolution | `data/articles.ts`, `data/robots.ts`, `data/manufacturers.ts`, `data/useCases.ts`, `data/deployments.ts`, `data/types.ts`, `lib/data.ts` | all fixture routes | route slug validity, redirect/not-found truth, article/robot/manufacturer/use-case content shape |
| B-18 Derived display and detail templates | `lib/robotDisplay.ts`, `lib/manufacturerDisplay.ts`, `lib/manufacturerGuideTemplate.ts`, `lib/specSchema.ts` | A-02, A-03, A-04, A-05 | card/detail/comparison labels, spec labels/order, manufacturer guide sections, TOC anchors, lineup rows |
| B-19 Use-case evidence derivation | `lib/useCaseEvidence.ts` | A-02, A-03 use-case surfaces | evidence labels, deployment summaries, candidate confidence text |
| B-20 Visual tone semantics | `lib/visualSemantics.ts` | A-02, A-03, A-04, A-07, X-08, X-10 | tone-to-class mapping for cards, chips, judgment labels, contact status, and article metadata; dark-mode contrast and semantic color checks |

Unused-helper note:

- `components/FacetFilterBar.tsx` and `components/FilterChipGroup.tsx` are unused/planned UI helpers. `lib/facetConfig.ts` is not unused: `USE_CASE_FACETS` is current `/use-cases` behavior through `lib/useCaseFilters.ts`; `ARTICLE_FACETS` is currently definition-only.
- `lib/articleDisplay.ts` is currently definition-only from the inspected code path and is not a current behavior helper in B-18.

## 10. Content Fixtures

Use real slugs so screenshot capture can be repeated.

| Fixture ID | Route / URL | Stress Covered |
| --- | --- | --- |
| G-01 | `/robots/mentee-menteebotv3` | robot detail with one displayable image |
| G-02 | `/robots/agility-digit` | robot detail/card with missing or blocked image |
| G-03 | `/manufacturers/unitree` | multiple domestic distributors, common manufacturer detail |
| G-04 | `/manufacturers/fourier-intelligence` | long English company name |
| G-05 | `/use-cases/factory-assembly-support` | deployments plus multiple candidate robots |
| G-06 | `/use-cases/research-development` | multiple candidates and longer sidebar list |
| G-07 | `/reports/bmw-figure-deployment` | article detail with hero image |
| G-08 | `/reports/unitree-manufacturer-guide` | manufacturer-guide template, many source records, hero image, YouTube embed |
| G-09 | `/reports/deepmind-gemini-robotics-ces2026` | very long Japanese article title and no hero image |
| G-10 | `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` | compare with 3 selected robots |
| G-11 | `/robots?q=__responsive_zero__` | robot zero-result state |
| G-12 | `/manufacturers?q=__responsive_zero__` | manufacturer zero-result state |
| G-13 | `/use-cases?q=__responsive_zero__` | use-case zero-result state |
| G-14 | `/reports?q=__responsive_zero__` | report zero-result state |
| G-15 | `/reports?page=2` | pagination baseline edge |
| G-16 | `/reports?page=3` | responsive per-page hydration edge |
| G-17 | `/reports?page=10` | pagination clamp edge |
| G-18 | `/robots/unitree-r1` | previous-slug redirect to `/robots/unitree-r1-air` |
| G-19 | `/use-cases/warehouse-picking` | previous-slug redirect to `/use-cases/warehouse-tote-material-handling` |
| G-20 | `/reports/jal-haneda-unitree-pilot-2026` | previous-slug redirect to `/reports/jal-haneda-humanoid-pilot-2026` |
| G-21 | `/compare?compare=unitree-g1,__invalid__,unitree-g1,agility-digit` | compare invalid slug plus duplicate normalization |
| G-22 | `/compare?compare=unitree-g1,unitree-g1-edu,unitree-h1,unitree-h1-2,apptronik-apollo,agility-digit,onex-neo,figure-03,unitree-h2,unitree-h2-edu,unitree-h2-plus,boston-dynamics-atlas,tesla-optimus,sanctuary-phoenix,agibot-a2,ubtech-walker-s2,fourier-gr2,fourier-gr3,booster-t1,kawasaki-kaleido,neura-4ne-1,kepler-k2` | compare max-count normalization from 22 published valid IDs to 20 |
| G-23 | `/manufacturers?country=China&route=domestic-distributor` | manufacturer valid multi-filter active chips |
| G-24 | `/use-cases?industry=manufacturing&task=material-handling` | use-case valid multi-filter active chips |

Additional stress conditions:

- Add many active chips manually through valid query params where possible: `/robots?industry=logistics&task=material-handling&manufacturer=unitree&availability=distributor-japan`.
- Use G-23 and G-24 for non-robot active-chip stress so `/manufacturers` and `/use-cases` are not covered only by the robot fixture.
- Check the same page after scrolling far enough for `ContextualPageHeader` to appear.
- Check no-image cards in `/robots` and manufacturer robot grids, not only detail pages.

Current media fixture constraint:

- Under `NEXT_PUBLIC_MEDIA_USAGE_POLICY=reference-attributed`, current robot data has no robot with two or more displayable image slots. `/robots/mentee-menteebotv3` has one displayable image; `/robots/agility-digit` is valid as a no-image fixture.
- Therefore `RobotImageCarousel` can be audited for one real image plus empty slots, no-image fallback, controls, focus, and placeholders. A real multi-displayable-image carousel check requires a new valid data fixture or a test-only mock before it can be marked covered.

## 11. Screenshot Matrix

The next audit pass must capture route x viewport x state. This matrix is the minimum set; additional captures can be added after failures are found.

| Matrix ID | Archetype / State | URLs / Fixtures | Widths | Extra Axes / States | Helper IDs |
| --- | --- | --- | --- | --- | --- |
| M-01 | Home | `/` | W-01, W-02, W-05, W-06, W-07, W-08 | P-01, P-03, P-04; map drag, home rails, SS-09 | B-12, B-13, B-15, B-17 |
| M-02R | Robots browser | `/robots`, active-chip stress URL | W-01, W-02, W-03, W-05, W-06, W-07, W-08 | P-01, P-03; release tabs active/pre, four filters, searchable manufacturer dropdown, active chips, no-image cards, SS-13, SS-16 | B-01, B-03, B-04, B-05, B-06, B-07, B-13, B-15, B-17, B-18, B-20 |
| M-02M | Manufacturers browser | `/manufacturers`, G-23 | W-01, W-02, W-05, W-06, W-07, W-08 | P-01, P-03; country dropdown, route dropdown, active chips, distributor popover from card, SS-13, SS-15, SS-16 | B-01, B-03, B-04, B-08, B-13, B-15, B-17, B-18 |
| M-02U | Use-cases browser | `/use-cases`, G-24 | W-01, W-02, W-05, W-06, W-07, W-08 | P-01, P-03; industry tabs, HoverCard task chooser, active task filter, touch fallback check, SS-14, SS-16 | B-01, B-03, B-04, B-05, B-09, B-15, B-17, B-19, B-20 |
| M-02A | Reports browser | `/reports`, `/reports?kind=manufacturer-guides`, `/reports?q=unitree` | W-01, W-02, W-05, W-06, W-07, W-08 | P-03, P-04; shelf tabs, search field, hero hidden under active search, pagination, `NewsHeroCarousel` reduced-motion check, SS-16 | B-01, B-03, B-04, B-10, B-11, B-12, B-13, B-15, B-17, B-18, B-20 |
| M-03 | Collection empty states | G-11, G-12, G-13, G-14 | W-01, W-05, W-07 | verify `EmptyState`, result count, sticky header | B-03, B-04, B-07, B-08, B-09, B-10, B-15, B-17 |
| M-04 | Collection pagination | G-15, G-16, G-17 | W-01, W-05, W-07, W-08 | pagination controls, responsive per-page hydration, clamp, and scroll-to-grid | B-01, B-03, B-10, B-11, B-17 |
| M-05 | Robot detail | G-01, G-02 | W-01, W-02, W-05, W-06, W-07, W-08 | P-01, P-03, P-04; one-image carousel plus empty slots, no-image fallback, sticky section nav, H-01, SS-09; real multi-image carousel is not covered by current data | B-13, B-15, B-17, B-18, B-20 |
| M-06 | Manufacturer detail | G-03, G-04 | W-01, W-05, W-06, W-07, W-08 | contact aside, fact sheet URLs, related grids, SS-09 | B-13, B-15, B-17, B-18, B-20 |
| M-07 | Use-case detail | G-05, G-06 | W-01, W-05, W-06, W-07, W-08 | candidate list, deployments grid, sidebar collapse | B-02, B-13, B-15, B-17, B-19, B-20 |
| M-08 | Article detail | G-07, G-08, G-09 | W-01, W-02, W-05, W-06, W-07, W-08 | P-03, P-04; hero/no-hero, TOC, related sidebar, sources, G-08 YouTube facade unplayed and activated iframe, SS-09, SS-12 | B-11, B-13, B-15, B-17, B-18, B-20 |
| M-09 | Compare base and mobile selector | `/compare`, G-10, G-21, G-22 | W-01, W-02, W-05, W-06, W-07 | 0/1/2/3 selected, invalid/dedupe/max normalization, mobile manufacturer selector, mobile robot list, P-01, H-01, SS-08, SS-13 | B-01, B-02, B-15, B-16, B-17, B-18 |
| M-10 | Compare desktop interaction | G-10 | W-06, W-07, W-08 | manufacturer accordion open/closed, favorites empty/non-empty, drag overlay, sheet drop target, favorite drop target, P-02, SS-03, SS-04 | B-01, B-02, B-15, B-16, B-17, B-18 |
| M-11 | Compare detail dialog | G-10 | W-01, W-02, W-06, W-07 | P-05, H-01, `ComparisonRobotPanel` Radix Dialog open, close focus return, long detail rows, SS-08 | B-13, B-15, B-16, B-17, B-18 |
| M-12 | Static content | `/about`, `/for-manufacturers`, `/privacy` | W-01, W-05, W-07 | long definition values, ordered lists, privacy links | B-15 |
| M-13 | Contact form states | `/contact` | W-01, W-02, W-05, W-07 | form disabled without env, submitting, success, `ValidationError`, privacy link wrapping, H-01, SS-01, SS-02, SS-08 | B-14, B-15, B-20 |
| M-14 | Fallback/loading/error | `/robots/__responsive_missing__`, `/__responsive_not_found__`, Suspense/loading test trigger | W-01, W-05, W-07 | list/detail/compare route skeletons, recovery links, concrete not-found URLs, SS-05, SS-10, SS-11 | B-15, B-17 |
| M-15 | Global shell states | any route | W-01, W-02, W-06, W-07 | mobile drawer open/closed focusability, focus trap expectation, body scroll lock, theme toggle, H-01, P-05, SS-06, SS-08 | B-15 |
| M-16 | Carousel and tab keyboard states | `/`, `/reports`, G-01 | W-01, W-05, W-07 | P-01, P-03, P-04, P-05, `SliderDotButton`, prev/next buttons, PageTabBar arrow/tab order, visible focus, SS-07, SS-09; robot real multi-image swipe is manual/not-covered until fixture exists | B-11, B-13, B-15 |
| M-17 | Short laptop/tablet height | G-01, G-07, G-10 | W-06, W-07 | H-02 and H-03; sticky sidebars, article TOC, compare drawer/dialog height, SS-08 | B-13, B-15, B-16 |
| M-18 | Previous-slug redirects | G-18, G-19, G-20 | W-01, W-07 | redirect target layout sanity, no fallback flash expectation | B-17 |

### 11.1 State Setup Requirements

URL-only screenshots are insufficient for several states. Use these setup IDs when executing the matrix.

| Setup ID | State | Reproduction Requirement | Covered Matrix Rows |
| --- | --- | --- | --- |
| SS-01 | Contact disabled | Open `/contact` with `NEXT_PUBLIC_FORMSPREE_FORM_ID` unset or empty; `lib/env.ts` is the runtime gate. | M-13 |
| SS-02 | Contact submitting/success/error | Submit valid fields against a test Formspree endpoint or network mock. If no stable trigger exists, mark success/error as manual/not-covered instead of pretending URL-only coverage. | M-13 |
| SS-03 | Favorites non-empty | Before loading the target page, set `localStorage.setItem('deploid_favorites', JSON.stringify(['unitree-g1', 'agility-digit']))`. | M-10 |
| SS-04 | Compare drag/drop states | On fine pointer, drag a selected `SortableCompareCard` over the comparison sheet target and favorites target; capture overlay and drop-target states. | M-10 |
| SS-05 | Runtime error boundary | No stable static trigger is defined. Add a test-only trigger before marking runtime error coverage complete, or keep this row manual/not-covered. | M-14 |
| SS-06 | Header drawer focus | At W-01/W-02, verify closed drawer is absent from tab order, then open the drawer and verify focus containment, close behavior, body scroll lock, and theme toggle reachability. | M-15 |
| SS-07 | Carousel and tab keyboard | Tab to carousel dots/prev/next and `PageTabBar`; verify accessible names, visible focus, Enter/Space, and arrow/tab behavior. | M-16 |
| SS-08 | Short height | Capture W-02 with H-01 for compare mobile, compare detail dialog, contact form, and global drawer; capture W-06/W-07 with H-02 and H-03 for sticky sidebars, TOC, compare dialog, and drawer height limits. | M-09, M-11, M-13, M-15, M-17 |
| SS-09 | Media policy | Run captures with `NEXT_PUBLIC_MEDIA_USAGE_POLICY=reference-attributed`, matching `.env.example`; otherwise hero/no-image fixture truth can change under `commercial-strict`. | M-01, M-05, M-06, M-08, M-16 |
| SS-10 | Not-found routes | Open `/robots/__responsive_missing__` for dynamic `notFound()` and `/__responsive_not_found__` for the global app fallback. | M-14 |
| SS-11 | Suspense/loading fallback | Capture route `loading.tsx` states: generic/list skeletons, robot/manufacturer/use-case/article detail skeletons, compare skeleton, and any remaining `PageSuspenseFallback`; use network throttle, a test-only delayed route loader, or mark as manual/not-covered. | M-14 |
| SS-12 | YouTube embed activation | On G-08, capture `YouTubeEmbed` before click as the facade button, then activate it and capture the `youtube-nocookie.com` iframe state, focus behavior, aspect ratio, and caption wrapping. | M-08 |
| SS-13 | SearchableDropdown states | Open `SearchableDropdown`, type a filtering query, force an empty result query, and verify ArrowUp/ArrowDown/Home/End/Enter/Escape/Tab, popover width, collision padding, scroll-to-active, and focus return. | M-02R, M-02M, M-09 |
| SS-14 | Use-case HoverCard states | On `/use-cases`, open industry task HoverCards by hover and keyboard, verify touch/coarse-pointer fallback, collision, focus visibility, active task selection, and Escape/blur close behavior. | M-02U |
| SS-15 | ManufacturerCard popover states | On `/manufacturers`, open distributor popovers from cards with domestic distributors, verify collision padding, focus path, touch behavior, external links, and close behavior. | M-02M |
| SS-16 | Browser pending skeleton | Trigger filter/search/tab changes that set `isPending`; capture `CardGridSkeleton` with each browser route's real grid class, `role=status`, column count, and swap back to results. | M-02R, M-02M, M-02U, M-02A |

## 12. First-Pass Risk Register

This is not the final issue list. It is the set of candidates that should be validated visually before implementation.

| Risk ID | Risk | Owner / Surface | Why It Matters | Task |
| --- | --- | --- | --- | --- |
| K-01 | Mobile drawer, footer, breadcrumbs, and theme toggle lack one shared shell audit | O-01, O-02, X-01 | shell issues repeat on all pages and can mask page-level fixes | T-01 |
| K-02 | Contextual sticky bar assumes fixed height | O-02, X-02 | wrapped tabs/chips can break anchor offsets and sticky sidebars | T-02 |
| K-03 | Filter rows use early 2-column layouts | O-03, O-04, X-03 | Japanese labels and triggers can become unreadable at 320-390px | T-03 |
| K-04 | Catalog grids start at 2 columns for data-heavy cards | O-05, X-04 | touch targets and scanability can fail on small mobile | T-04 |
| K-05 | Hover-only controls and hover-triggered task drill-down | O-06, O-07, O-12, X-05, X-06 | touch users may miss carousel controls, tooltips, and use-case task menus | T-05 |
| K-06 | Compare selected sheet uses 3 columns at base width | O-09, A-05 | selected robots can become too small to identify or inspect | T-06 |
| K-07 | Desktop sidebars/TOC are hidden or moved without a unified mobile rule | O-08, X-07 | decision-critical content and navigation may disappear on mobile | T-07 |
| K-08 | Long source titles, URLs, product names, and tags need overflow hardening | O-05, O-08, X-08 | long public data can create horizontal overflow | T-08 |
| K-09 | `HomeContentNavigator` mobile links are visible while treated as `aria-hidden`/non-focusable, and rails/media need touch audit | O-06, O-07, A-01 | visible mobile content can become inaccessible or hard to swipe | T-09 |
| K-10 | Empty/loading/error/no-media states need concrete triggers, not route labels | O-11, X-09 | state regressions can survive page-only audits unless not-found URLs, Suspense fallback triggers, and runtime error triggers are explicit | T-10 |
| K-11 | Pagination and report grid density are tied to viewport hook behavior | O-03, A-02, B-11 | per-page counts, page clamp, and grid columns must stay aligned across widths and hydration | T-03 |
| K-12 | Dark mode and reduced motion need explicit capture | X-10, O-01, O-05, O-06, O-07 | motion-heavy components and media overlays can fail preferences | T-01, T-05 |
| K-13 | ContactForm states are mixed into browser-control work | O-10, A-07 | disabled, submitting, success, validation errors, and privacy link wrapping are form-specific | T-11 |
| K-14 | Text segmentation components can hide wrapping/accessibility regressions | O-13, X-08 | `BudouXText` uses visual text plus `sr-only`; title wrapping and accessible text need explicit checks | T-08 |
| K-15 | Header drawer close/theme controls and carousel controls need concrete focus/name checks | O-01, O-07, O-12, X-06, X-10 | generic keyboard checks can miss closed-drawer focusability, open-drawer focus trap, `SliderDotButton` accessible names, and carousel prev/next names | T-01, T-05 |
| K-16 | `PageTabBar` keyboard semantics can be missed if it is treated only as sticky positioning | O-02, X-02, P-05 | tab bars need visible focus, tab/arrow behavior, active state, and wrapped/overflow states across browser pages | T-03 |
| K-17 | `RobotImageCarousel` real multi-image behavior has no current data fixture | O-07, B-13, X-05 | current data validates one-image and no-image states, but not multiple displayable robot images, swipe progression, and repeated real-image credits | T-05 |
| K-18 | `YouTubeEmbed` facade and activated iframe are current article detail media states | O-08, X-05, X-08 | G-08 includes a real video; aspect ratio, caption wrapping, focus, and iframe activation can fail independently of article text layout | T-08 |
| K-19 | Inline Radix overlays are spread across browser controls, cards, use-case tabs, and compare dialogs | O-03, O-04, O-05, O-09, X-06 | Popover/HoverCard/Dialog behavior can fail width, collision, focus, and keyboard paths outside `AnimatedTooltip` | T-03, T-05, T-06 |
| K-20 | Previous-slug redirects and compare URL normalization have fixtures but need assertion/setup rules | B-16, B-17 | redirects, invalid compare IDs, duplicate IDs, and max-count truncation can change the rendered route state before responsive checks start | T-06, T-10 |
| K-21 | Browser pending skeleton is a current loading state outside Suspense fallback | O-11, A-02, X-09 | `CardGridSkeleton` must preserve each browser grid's column count and accessible loading status during filter transitions | T-10 |

Unassigned risk count: 0.

## 13. Task Boundaries

These are audit/fix task buckets after screenshots validate the risks. They are intentionally small enough to become separate commits.

| Task ID | Theme | Owners / Surfaces | Completion Condition |
| --- | --- | --- | --- |
| T-01 | Global shell, footer, breadcrumbs, theme, preferences | O-01, O-02, X-01, X-10 | drawer, footer, breadcrumb, theme toggle, dark/reduced-motion states verified |
| T-02 | Contextual sticky bars and anchor offsets | O-02, X-02 | sticky bars do not wrap unpredictably; anchors land below visible bars |
| T-03 | Browser controls, filters, tabs, pagination | O-02, O-03, O-04, X-02, X-03, X-06 | route-specific robots/manufacturers/use-cases/reports controls, `PageTabBar` keyboard semantics, `SearchableDropdown` SS-13, and G-15/G-16/G-17 pagination states work at W-01 through W-08 |
| T-04 | Catalog card/grid density | O-05, X-04 | each card type has justified columns and touch target sizes |
| T-05 | Touch-safe overlays, carousels, tooltips, card motion | O-05, O-06, O-07, O-09, O-12, X-05, X-06 | hover-only critical controls and inline Radix overlays have tap/keyboard equivalents, motion-heavy cards honor preferences, and unavailable carousel states are covered by a valid fixture/test mock or explicitly marked not covered |
| T-06 | Compare responsive model | O-09, A-05 | mobile compare supports add/remove/inspect/clear without DnD; invalid/dedupe/max compare URL states are verified; desktop panes fit at W-06+ |
| T-07 | Detail sidebars, TOC, and mobile replacement | O-08, X-07 | all sidebar/TOC content has a mobile placement or documented redundancy |
| T-08 | Long text, source, URL, and media placeholder hardening | O-05, O-08, X-05, X-08, X-09 | no horizontal overflow for listed fixtures and stress cases; `YouTubeEmbed` facade and activated iframe fit all M-08 widths |
| T-09 | Home hero, rails, and mobile accessibility | O-06, O-07, A-01 | mobile home content is accessible, swipeable, and not only decorative |
| T-10 | Fallback, empty, loading, error, no-media states | O-11, X-09, B-17 | screenshot matrix includes concrete not-found URLs, previous-slug redirects, browser pending skeletons, a reproducible Suspense fallback trigger or manual/not-covered mark, and runtime error coverage status |
| T-11 | Contact form responsive states | O-10, A-07, X-03 | disabled/submitting/success/validation/privacy-link states fit W-01 through W-07 |
| T-12 | Current versus unused helper classification | O-14 | unused/planned helpers stay separated from current surfaces or are moved into a current owner before reuse |

Owner-to-task coverage:

| Owner | Tasks |
| --- | --- |
| O-01 | T-01 |
| O-02 | T-01, T-02, T-03 |
| O-03 | T-03 |
| O-04 | T-03 |
| O-05 | T-04, T-05, T-08 |
| O-06 | T-05, T-09 |
| O-07 | T-05, T-09 |
| O-08 | T-07, T-08 |
| O-09 | T-05, T-06 |
| O-10 | T-11 |
| O-11 | T-10 |
| O-12 | T-05 |
| O-13 | T-08 |
| O-14 | T-12 |

Unassigned owner count: 0.

## 14. Out Of Scope For This Phase

- No component rewrite yet.
- No data model changes.
- No route IA change.
- No new UI framework.
- No archived plan execution.
- No broad visual redesign beyond responsive behavior and interaction fit.
- No OGP/icon/sitemap/robots metadata audit, except for explicitly excluded app file coverage.

## 15. Completion Criteria For Phase 0

Phase 0 is complete when:

- App file coverage has include/exclude reasons.
- Every user-facing route is assigned to exactly one page archetype.
- Cross-cutting surfaces are separate from page archetypes.
- Every file listed in a component owner group has exactly one owner group.
- Current route surfaces, unused/planned helpers, and behavior/data helper sources are explicitly separated.
- Width, height, pointer, theme, and motion axes are separate.
- Screenshot matrix includes primary routes, fallback/state surfaces, interaction states, short-height checks, content stress fixtures, and Helper ID traceability.
- Non-URL-reproducible states have setup instructions or are marked manual/not-covered.
- Environment-dependent fixtures state their required env values.
- Risk-to-task and owner-to-task mappings have zero unassigned rows.
