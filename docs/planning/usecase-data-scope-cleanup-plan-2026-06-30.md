# UseCase Data Scope Cleanup Plan 2026-06-30

Status: draft plan
Created: 2026-06-30

## 1. Purpose

`/use-cases` の公開データに、出典不明・404 URL・スコープ外ロボット・未登録ロボットを根拠にした候補が混入している。

この計画では、次の4点を最小差分で整理する。

1. スコープ外ロボットを公開DBと用途候補から外す。
2. 404または根拠不十分な `official-use-case` を公開用途から外す。
3. `Eno` / `PUDU D7` / `R-noid` / `Walker Tienkung` の扱いを明確化する。
4. `/use-cases` の公開品質を「候補単位で根拠URLへ辿れる」状態へ戻す。

## 2. Rules And Sources Checked

Project rules:

- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/20-data.md`
- `ai/rules/21-data-maintenance-workflow.md`
- `ai/rules/80-doc-governance.md`
- `docs/data/README.md`
- `docs/planning/README.md`
- `docs/planning/data-maintenance-checklist-v1.md`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/copyright_and_media_rights_policy_v1.md`

Current code/data checked:

- `data/types.ts`
- `data/robots.ts`
- `data/manufacturers.ts`
- `data/useCases.ts`
- `data/articles.ts`
- `data/articlePlacements.ts`
- `lib/data.ts`
- `lib/validate.ts`
- `lib/labels.ts`
- `lib/tagRegistry.ts`
- `lib/specSchema.ts`
- `lib/site.ts`
- `lib/articlePlacements.ts`

UseCase field note:

- Current code and `data/types.ts` are authoritative. UseCase uses `primaryIndustry`, not `primaryDomain`.
- Some docs still mention `primaryDomain` / `secondaryDomains`; treat that as a docs/code consistency issue outside this cleanup plan. Do not add `primaryDomain` fields in this pass.

External sources checked:

- Genesis AI / PR Newswire: `https://www.prnewswire.com/news-releases/introducing-eno-genesis-ais-first-general-purpose-robot-is-challenging-traditional-humanoid-design-302801103.html`
- Pudu Robotics / PR Newswire: `https://www.prnewswire.com/news-releases/pudu-embodied-unveils-the-next-generation-pudu-d7-opening-a-new-chapter-for-industrial-semi-humanoid-robotics-302786976.html`
- UBTECH Walker Tienkung/TienKung official page: `https://www.ubtrobot.com/en/ai-education/products/walker-tienkung`
- JAL press release: `https://press.jal.co.jp/en/release/202604/009502.html`
- ZIZAI site: `https://zizai.co.jp/`
- Kawasaki NEXTAGE current URL check: `https://www.kawasakirobotics.com/jp/products/assembly-applications/nextage/` redirects then returns 404 on `https://kawasakirobotics.com/jp/products/assembly-applications/nextage/`

## 3. Current Data Findings

### 3.1 Existing DB State

Existing robots relevant to this cleanup:

- `kawasaki-nextage` exists and is `published`.
- `zizai-zeroshiki` exists and is `published`.
- `robotera-l7`, `robotera-m7`, `robotera-q5` exist and are `published`.
- UBTECH Walker family exists as `ubtech-walker-s`, `ubtech-walker-s1`, `ubtech-walker-s2`, `ubtech-walker-c`, `ubtech-walker-x`.
- No `Genesis AI` manufacturer or `Eno` robot record exists.
- No `Pudu Robotics` manufacturer or `PUDU D7` robot record exists.
- No `Robot.com` manufacturer or `R-noid` robot record exists.
- No `Walker Tienkung` / `Walker TienKung` robot record exists.

Existing articles relevant to this cleanup:

- `genesis-ai-eno-non-humanoid-2026` exists, but has no related robot/manufacturer IDs.
- `pudu-d7-industrial-semi-humanoid-2026` exists, but has no related robot/manufacturer IDs.
- `robot-com-rnoid-workplace-humanoid-2026` exists, but has no related robot/manufacturer IDs.
- `jal-haneda-unitree-pilot-2026` currently relates only to `unitree-g1` and `unitree`.

### 3.2 Problematic UseCase Candidate References

`zizai-zeroshiki` is currently used in published use cases:

- `construction-site-patrol`
- `infrastructure-ultrasonic-inspection`
- `infrastructure-overhead-wire-maintenance`

`kawasaki-nextage` is currently used in published use cases:

- `factory-powder-weighing`
- `factory-visual-inspection`
- `factory-machine-tending`
- `agriculture-seedling-transplant`
- `agriculture-food-sorting`
- `research-drug-discovery`

`kawasaki-nextage` is also used in draft:

- `construction-material-transport`

## 4. Editorial Decisions

### D1. Eno

Decision: keep as a news/topic article only for now. Do not add to robot DB or use case candidates in this pass.

Reason:

- Official PR says Eno is Genesis AI's first general-purpose robot and explicitly frames it as not mimicking fully human appearance.
- It has a wheeled base and foldable/minimal form factor.
- Official PR says production and targeted customer deployments are planned by the end of 2026. That is not current deployment evidence.
- Adding Eno to the robot DB would broaden scope toward non-humanoid general-purpose robots. `ai/rules/00-index.md` says scope/product direction changes require user confirmation.

Allowed later:

- If the user explicitly approves an adjacent "general-purpose robot / mobile manipulator" scope, add `genesis-ai` and `genesis-eno` as draft first.
- Do not use Eno as `deployment` or `official-use-case` evidence for published use cases until deployment/customer evidence is independently confirmed.

### D2. PUDU D7

Decision: PUDU D7 is allowed as an adjacent semi-humanoid / wheeled industrial robot candidate.

Implementation stance:

- Add `pudu-robotics` manufacturer and `pudu-d7` robot as draft first.
- Publish only if the data publish gate is satisfied with official source, image rights metadata, current `Robot` fields, and uncertainty notes.
- Do not immediately attach PUDU D7 to many use cases. Add use case candidates only where the official PR explicitly names the task area, for example warehouse/material handling/shelf picking/intralogistics, and only as `official-use-case`.
- Do not connect a published article to draft PUDU records. `lib/validate.ts` requires published articles to reference `published/archived` robots and `published` manufacturers.

Reason:

- Official PR describes PUDU D7 as an industrial semi-humanoid robot for manufacturing and industrial environments.
- It names warehouse/material handling, shelf picking, inventory replenishment, intralogistics, dual-arm manipulation, 14 kg payload, and autonomous battery swapping.
- It fits existing type vocabulary through `RobotCategory` better than R-noid/Eno. `MobilityType` exists as a label type, but `Robot` currently has no `mobilityType` field; do not add that field in this plan.

### D3. R-noid

Decision: do not add R-noid to robot/manufacturer DB and do not use it in use case candidates.

Reason:

- User explicitly rejected it.
- Current local article has no related robot/manufacturer IDs, so no reference cleanup is required unless the article text itself is considered too promotional or off-scope.

Follow-up:

- Review `robot-com-rnoid-workplace-humanoid-2026`. If it reads like a product listing rather than market context, set article to draft or rewrite as broader market context.

### D4. Walker Tienkung / TienKung

Decision: treat as a separate research gate before adding data.

Reason:

- UBTECH official page exists and currently appears to show `Walker Tienkung` casing; confirm canonical casing before writing data.
- The official page describes the model as a full-size humanoid robot for Academic Research, Education & Secondary Development.
- It appears to replace or supersede prior `Walker E` naming in some distributor/search contexts, but the repo has no `Walker E` record.
- Existing UBTECH Walker records (`Walker S`, `S1`, `S2`, `C`, `X`) must not be mutated until identity/supersession is clear.

Required before implementation:

- Confirm official model name casing: `Walker TienKung` vs `Walker Tienkung`.
- Confirm whether it is a separate model, an education/research configuration, or a renamed `Walker E`.
- Confirm if it should be added as `ubtech-walker-tienkung` or handled as a slug/name update to an existing record. Current evidence points to a new record, not an update.
- Re-check JAL/GMO sources before connecting this model to airport ground handling. The JAL press release confirms humanoid robot trials but may not itself name `Walker Tienkung`.
- Re-check the existing `jal-haneda-unitree-pilot-2026` relation to `unitree-g1` / `unitree`. JAL's official release may not itself name Unitree or G1, so those relations need a supporting source or should be removed/drafted.

### D5. 零式人機 / ZEROSHIKI

Decision: remove from public scope.

Implementation stance:

- Set `zizai-zeroshiki` to `draft` or otherwise hide from public surfaces.
- Set `zizai` manufacturer to `draft` if it has no remaining in-scope published robots.
- Remove `zizai-zeroshiki` from all published `useCases[].candidateRobots`.
- Remove `https://zizai.co.jp/` as a public use case source where it only supports ZEROSHIKI.
- If a use case loses all public candidates/sources, set that use case to `draft` rather than leaving a thin page.

Reason:

- User explicitly marked it out of scope.
- It is not a standalone in-scope humanoid product for the current Deploid scope.
- Current URL does not provide sufficient product/use-case evidence for the claims currently in `data/useCases.ts`.

### D6. NEXTAGE

Decision: treat current NEXTAGE evidence and identity as invalid until primary sources confirm the actual entity.

Implementation stance:

- Audit whether the existing `kawasaki-nextage` record is actually Kawasaki/川崎 or a misregistered Kawada Robotics/川田ロボティクス NEXTAGE entity.
- Do not treat the current problem as only a 404 URL. Manufacturer, id, source, rights holder, article body mentions, and use-case evidence may all be wrong together.
- Remove `kawasaki-nextage` from published use case candidates in this cleanup, even if the entity record itself can be repaired. Re-publishing NEXTAGE as use-case evidence should be a later source-backed task after identity is settled.
- Remove or replace the current `NEXTAGE product page` source URL because it resolves to 404 after redirect.
- Set `kawasaki-nextage` to `draft` if no valid current source supports the robot record as currently modeled.
- Keep `kawasaki-heavy-industries` because it also owns in-scope `kawasaki-kaleido`.

Reason:

- Existing source URL is not currently usable.
- Existing article text mentions `川田ロボティクスNEXTAGE`, while the robot record says Kawasaki/川崎. This suggests possible entity misidentification.
- Several claims are too broad: powder weighing, visual inspection, agricultural sorting, and lab automation are not safe to publish as humanoid use cases based on the current source.

### D7. Public URL / SEO Behavior

Decision: unsupported public records removed by this cleanup should intentionally disappear from public getters and routes.

Implementation stance:

- Drafted use cases and robots will 404 through existing `getUseCases()` / `getRobots()` behavior.
- Do not add redirects or noindex pages in this cleanup unless a replacement canonical page exists.
- Verify drafted records drop out of sitemap output.

Reason:

- Keeping unsupported pages live with noindex would preserve weak content and stale evidence.
- Redirects would be misleading unless there is a clearly equivalent published replacement.

## 5. Implementation Tasks

### UCD-001. Scope Cleanup Inventory And Link Checker

Files:

- `scripts/check-source-links.mjs`

Work:

- Run the existing baseline first:
  - `npm run check:source-links`
- Extend `scripts/check-source-links.mjs` instead of relying on one-off inline curl commands:
  - keep published `useCases[].sources`, published use-case `candidateRobots[].evidenceSourceUrls`, and published `deployments[].sources`.
  - add article source checks only for articles touched by this plan and still published after cleanup: `pudu-d7-industrial-semi-humanoid-2026`, `robot-com-rnoid-workplace-humanoid-2026`, `genesis-ai-eno-non-humanoid-2026`, `jal-haneda-unitree-pilot-2026`, and `dobot-atom-max-rtj-japan-2026`.
  - drafted articles are optional for source-link checking; do not block this cleanup on source failures for articles removed from public surfaces.
  - do not expand to all published articles in this plan. If a full article source audit is needed, create a separate task/plan because it may surface unrelated failures.
  - add `sources[].url` for records touched by this plan even if they become draft: `kawasaki-nextage`, `zizai-zeroshiki`, `pudu-d7`, `pudu-robotics`, and any Walker Tienkung record if created.
  - add `heroImage.sourceUrl`, `images.*.sourceUrl`, and image rights/source attribution URLs where present for touched robots/manufacturers/articles. NEXTAGE/ZIZAI image source URLs must be audited for both liveness and correct attribution.
  - print owner/id/field/status/effective URL so failures map back to records.
  - keep the existing GET-based `curl -L --max-time 15` behavior; do not switch to HEAD-only checks.
  - preserve owner visibility for duplicate URLs. Either do not dedupe by URL, or aggregate duplicate owners and print every owner when a shared URL fails.
  - treat non-2xx/3xx statuses, including 403/405/5xx, as failures unless the dependent public record is drafted, the URL is replaced, or a documented site-specific exception is explicitly accepted outside this plan.
- Re-run the exact inventory before editing:
  - `rg -n "zizai-zeroshiki|kawasaki-nextage|NEXTAGE|ZIZAI|PUDU|R-noid|Eno|Walker Tien" data src --no-ignore`
  - script to list every `useCases[].candidateRobots[].robotId`
  - script to list missing robot/manufacturer relations in articles
  - `npm run check:source-links` after the script extension for existing touched records only.
- Timing:
  - Initial UCD-001 run covers records that already exist before edits.
  - Re-run `npm run check:source-links` after UCD-004/UCD-005 so newly added PUDU/Walker draft records and their image/source URLs are included.
  - Run it again in final verification after all draft/published decisions are complete.

Completion:

- The exact set of affected records is known before edits.
- Dead, redirecting, blocked, and live URLs are separated before deciding whether a public source can remain.
- Source-link validation is reusable through `npm run check:source-links`; no completion criterion depends on ad hoc inline curl.
- Duplicate URL owner visibility is verified with the shared NEXTAGE URL: failures must show every affected owner/useCase, not just one deduped URL row.

### UCD-002. Remove ZEROSHIKI From Public Surfaces

Files:

- `data/useCases.ts`
- `data/robots.ts`
- `data/manufacturers.ts`
- `lib/site.ts`
- possibly `data/articles.ts` if any article references ZIZAI after re-inventory

Work:

- Remove `zizai-zeroshiki` candidates from:
  - `construction-site-patrol`
  - `infrastructure-ultrasonic-inspection`
  - `infrastructure-overhead-wire-maintenance`
- Remove `https://zizai.co.jp/` sources from those use cases unless another non-ZEROSHIKI claim remains supported by it.
- If the use case has no valid candidates/sources afterward, set `publishStatus: 'draft'`.
- Hide `zizai-zeroshiki` from public robot surfaces by setting `publishStatus: 'draft'`.
- Hide `zizai` manufacturer if it has no remaining in-scope published robot.
- Use `draft`, not `archived`, because this is a scope/evidence problem rather than a confirmed discontinued product. Re-publication is allowed later only if ZIZAI has an in-scope robot with valid first-party/public evidence.
- If public robot/manufacturer counts change, update or confirm `lib/site.ts` `siteMeta.dataAsOf` so `/for-manufacturers` count copy does not imply stale data.

Completion:

- `rg -n "zizai-zeroshiki|ZIZAI|零式" data/useCases.ts data/articles.ts` has no public-usecase dependency.
- No published use case references `zizai-zeroshiki`.
- Final publishStatus is decided for all three currently affected published use cases:
  - `construction-site-patrol`: draft unless a valid in-scope published candidate and source are added.
  - `infrastructure-ultrasonic-inspection`: draft unless a valid in-scope published candidate and source are added.
  - `infrastructure-overhead-wire-maintenance`: draft unless a valid in-scope published candidate and source are added.
- `/for-manufacturers` count/date copy is still accurate after draft changes.

### UCD-003. Audit NEXTAGE Identity And Quarantine Evidence

Files:

- `data/useCases.ts`
- `data/robots.ts`
- `data/manufacturers.ts`
- `data/articles.ts`
- `lib/site.ts`

Work:

- First perform a NEXTAGE identity audit using primary/current sources:
  - confirm whether the entity is Kawasaki/川崎, Kawada Robotics/川田ロボティクス, or another company/product lineage.
  - if Kawada/Kawada Industries/Kawada Robotics is the correct entity, decide whether `data/manufacturers.ts` needs a new manufacturer record or an existing one can be used.
  - check the correct official source URL, rights holder, manufacturer relation, and public naming.
  - inspect `dobot-atom-max-rtj-japan-2026` article body/takeaways. Exhibition-context mentions may remain, but manufacturer names and product identity must be source-confirmed.
- Decide the record path before editing use-case evidence:
  - Option A: if `kawasaki-nextage` is the same real-world entity but has wrong metadata, keep the immutable `id` and correct slug/name/manufacturer/source/rights according to the existing id/slug rules only if this does not create a misleading id.
  - Option B: if the existing record is a wrong entity under a misleading id, set it to `draft` or `archived` and add a separate correct record only after a normal new-record gate.
  - Option C: if identity cannot be confidently resolved, set `kawasaki-nextage` to `draft` and remove it from published use-case candidates.
- Remove `kawasaki-nextage` candidates and source URLs from published use cases in this cleanup. A live official source may repair the robot record, but it does not keep NEXTAGE as a public use-case candidate in this pass.
- Candidate public use cases to draft or rewrite:
  - `factory-powder-weighing`: likely set to draft; title/content likely unsuitable for humanoid use case.
  - `factory-visual-inspection`: likely set to draft or rewrite around stronger in-scope robot evidence only.
  - `factory-machine-tending`: keep only if another valid in-scope source supports it; otherwise draft.
  - `agriculture-seedling-transplant`: likely draft.
  - `agriculture-food-sorting`: likely draft.
  - `research-drug-discovery`: likely draft until Eno/PUDU/other source is approved and added.
- Keep `kawasaki-heavy-industries` because of `kawasaki-kaleido`.
- Set `kawasaki-nextage` to `draft` if no valid current source exists.
- If the public robot/manufacturer count changes through draft/archive/new manufacturer decisions, update or confirm `lib/site.ts` `siteMeta.dataAsOf`.

Completion:

- NEXTAGE manufacturer/entity identity is explicitly decided before use-case evidence cleanup.
- No published use case references `kawasaki-nextage` as a candidate after this cleanup.
- No published use case uses the 404 NEXTAGE URL.
- No `official-use-case` basis points to a dead source.
- Any remaining article mention of NEXTAGE has verified manufacturer/product wording, or the mention is removed/drafted.
- Image source URLs and image rights attribution for any remaining NEXTAGE record are live and attributed to the correct entity.

### UCD-004. Add PUDU D7 As Draft Adjacent Robot

Files:

- `data/manufacturers.ts`
- `data/robots.ts`
- `data/articles.ts` only if PUDU records are published in the same task
- `lib/site.ts` if public counts change

Work:

- Add `pudu-robotics` manufacturer as `draft` unless publish gate is confidently met.
- Add `pudu-d7` robot as `draft`.
- Use official PR source:
  - `https://www.prnewswire.com/news-releases/pudu-embodied-unveils-the-next-generation-pudu-d7-opening-a-new-chapter-for-industrial-semi-humanoid-robotics-302786976.html`
- Verify a PUDU-owned company/product page before publishing `pudu-robotics` as a manufacturer. PRNewswire is acceptable supporting evidence for the D7 announcement, but the manufacturer record should also have a PUDU-owned source.
- Before writing PUDU specs such as payload, confirm the keys exist in `lib/specSchema.ts`; omit any unregistered spec rather than adding ad hoc keys.
- Suggested modeling:
  - `category`: prefer `mobile-manipulator` for this controlled adjacent case.
  - `buyerReadiness`: `requires-poc` unless customer deployment evidence is found.
  - `japanAvailability`: `unknown` or `inquiry-required`.
- Do not add `mobilityType`; it is not a current `Robot` field.
- Branch condition:
  - Option A: if both `pudu-robotics` and `pudu-d7` satisfy the publish gates and are set to `published`, connect existing published article `pudu-d7-industrial-semi-humanoid-2026` through `relatedManufacturerIds` / `relatedRobotIds`.
  - Option B: if either PUDU record remains `draft`, leave the existing published article relations unchanged and defer related IDs until PUDU publication.
  - Option C: if the article itself is set to `draft`, article relations may point to draft records, but this is not recommended unless the article is being removed from public surfaces.
- If PUDU records are published or related to the article, update the existing article body and `keyTakeaways` at the same time so it no longer says Pudu Robotics is unregistered in the Deploid database.
- Decide article-to-use-case relation separately from candidate robots:
  - Candidate robots: do not add PUDU D7 to `candidateRobots` in this task unless PUDU records are published and the official source directly supports the use case.
  - Related article: `relatedUseCaseIds: ['warehouse-picking']` may remain only if the article is framed as adjacent market context and the use-case page can tolerate a non-candidate related article.
  - If PUDU records stay draft and the article is considered too product-specific for a public use-case page, remove `relatedUseCaseIds` until publication/scope is decided.
- Decide reports hero placement separately:
  - If PUDU records are published or the article is intentionally kept as adjacent market context, the existing hero placement may remain.
  - If PUDU records remain draft and the article should not be strongly promoted, move/remove the `pudu-d7-industrial-semi-humanoid-2026` hero placement or replace it with a stronger published article.
- If PUDU records are published, update or confirm `lib/site.ts` `siteMeta.dataAsOf` for the changed public robot/manufacturer counts.

Do not:

- Add PUDU D7 to many use cases in this task.
- Claim production deployment unless a deployment/customer source is verified.
- Add or rely on a `mobilityType` field.
- Attach draft PUDU records to a published article.
- Use `general-purpose-robot` unless there is a deliberate scope decision beyond this PUDU-only exception.

Completion:

- PUDU records validate.
- Either PUDU records are published and the published PUDU article has correct `relatedRobotIds` / `relatedManufacturerIds`, or PUDU records remain draft and the published article has no draft-record relations.
- If PUDU records are published/related, the PUDU article body and `keyTakeaways` no longer say Pudu Robotics is unregistered in the Deploid database.
- PUDU article `relatedUseCaseIds` is explicitly kept as adjacent context or removed until PUDU publication; it is not left ambiguous.
- PUDU hero placement is explicitly kept with rationale or changed.
- `/for-manufacturers` count/date copy is still accurate if PUDU is published.

### UCD-005. Decide Walker Tienkung

Files:

- `data/robots.ts`
- `data/articles.ts`
- possibly `data/useCases.ts`
- possibly `data/manufacturers.ts`
- `lib/site.ts` if public counts change

Work:

- Research and document:
  - official name/casing
  - model relationship to `Walker E`
  - whether this is a separate research/education platform or a renamed product
  - whether JAL/GMO article can reference this model
- If separate model:
  - add `ubtech-walker-tienkung` as draft first.
  - connect it to JAL article only if source explicitly supports it and the record is published or archived.
- If it is a rename of an existing record:
  - do not change `id`.
  - update `name`, `slug`, and `previousSlugs` according to slug rules.
- Branch condition for article relations:
  - Option A: if `ubtech-walker-tienkung` satisfies the publish gate and is set to `published`, connect a published article only when its sources explicitly support the relationship.
  - Option B: if the Walker record remains `draft`, leave published article `relatedRobotIds` unchanged and defer the relation.
  - Option C: if the JAL article itself is set to `draft`, draft-only relations may be used during research, but this removes it from public surfaces and any `articlePlacements`.
- Audit `jal-haneda-unitree-pilot-2026` existing `unitree-g1` / `unitree` relations at the same time. Keep them only if JAL/GMO/secondary sources in that article support the specific model/manufacturer; otherwise remove the relation or draft/rewrite the article.
- If a Walker record or manufacturer is published, update or confirm `lib/site.ts` `siteMeta.dataAsOf`.

Completion:

- No `Walker E` / `Walker Tienkung` claim is inferred from search snippets alone.
- Published article relations never point to a draft Walker record.
- The JAL article's Unitree/G1 relation is either source-backed or removed/drafted.
- `/for-manufacturers` count/date copy is still accurate if Walker/manufacturer records are published.

### UCD-006. Eno Article And Scope Note

Files:

- `data/articles.ts`
- possibly `docs/planning/humanoid_mvp_scope_decision_v1.md` or a new scope note only after user approval

Work:

- Keep `genesis-ai-eno-non-humanoid-2026` as an article if it is framed as adjacent market context.
- Do not create `genesis-ai` or `genesis-eno` records in this pass.
- Ensure article text does not imply current deployment or in-scope humanoid DB inclusion.
- Add or preserve language that targeted customer deployments are planned by end of 2026, not currently proven.
- Decide whether existing `relatedUseCaseIds` (`warehouse-picking`, `research-development`) should remain:
  - keep only if the article is intentionally useful adjacent market context for those use-case pages and clearly states Eno is not a current DB candidate.
  - remove if use-case pages should show only in-scope robot/database context.

Completion:

- Eno remains informational context only.
- No use case candidate uses Eno.
- Eno article `relatedUseCaseIds` are explicitly kept with adjacent-context rationale or removed.

### UCD-007. R-noid Cleanup

Files:

- `data/articles.ts`
- `data/articlePlacements.ts`

Work:

- Do not add Robot.com or R-noid records.
- Review `robot-com-rnoid-workplace-humanoid-2026`:
  - Option A: remove it from `data/articlePlacements.ts` or replace it with another published article, then set it to `draft` if the topic is off-scope.
  - Option B: keep only as market-context article if it clearly warns that it is not a database candidate.
- Remove `relatedUseCaseIds` from the R-noid article unless the user explicitly wants rejected/off-scope products to appear as related reading on use-case pages.
- If replacing the reports hero placement, choose a replacement from published articles using these criteria:
  - same or newer editorial freshness than the removed slot where possible.
  - relevant to robots/business adoption, not a rejected/off-scope product listing.
  - has valid sources and no draft-only related entities.
- If no replacement meets those criteria, deleting the placement is acceptable; do not keep R-noid just to fill the hero count.
- Because `lib/articlePlacements.ts` backfills empty slots by latest published article, verify the final resolved hero/feature article IDs after placement edits.

Recommended:

- Option A unless the article provides clear value beyond the product mention. Article placements have no `publishStatus`, and `lib/validate.ts` requires every placement to point to a published article.

Completion:

- R-noid is absent from robot/manufacturer/use-case relations.
- R-noid article has no `relatedUseCaseIds` unless an explicit exception is documented.
- If the R-noid article is drafted, no `articlePlacements` entry references it.
- Final resolved reports hero/feature slots are known and do not unexpectedly promote rejected/off-scope content.

### UCD-008. UseCase Title And Publication Cleanup

Files:

- `data/useCases.ts`

Work:

- Apply title changes only to use cases that remain published.
- Draft or remove weak pages before polishing labels.
- Fix the known source-link failure for `logistics-devanning` before or while deciding whether it remains published:
  - update `sources[].url` and candidate `evidenceSourceUrls` from `https://bostondynamics.com/atlas/` to the current live Boston Dynamics Atlas product URL if it still supports logistics/devanning claims.
  - if the live page no longer supports the specific devanning/warehouse automation claim, remove that source/candidate or set `logistics-devanning` to `draft`.
- Initial likely outcomes:
  - `construction-site-patrol`: draft unless a valid in-scope candidate/source replaces ZEROSHIKI.
  - `infrastructure-ultrasonic-inspection`: draft unless a valid in-scope candidate/source replaces ZEROSHIKI.
  - `factory-powder-weighing`: draft.
  - `factory-visual-inspection`: draft or rewrite only with valid in-scope source.
  - `factory-machine-tending`: rename to `工作機械へのワーク着脱` only if kept.
  - `logistics-devanning`: update Boston Dynamics URL/source evidence and rename to `コンテナ・トラックからの荷降ろし` if kept.
  - `logistics-cage-loading`: rename to `カゴ車・ロールボックス積み込み` if kept.
  - `infrastructure-overhead-wire-maintenance`: draft unless a valid in-scope humanoid source is found.
  - `agriculture-seedling-transplant`: draft.
  - `agriculture-food-sorting`: draft.
  - `research-drug-discovery`: draft until in-scope candidate exists.

Completion:

- Published use case titles are readable.
- Published use cases have at least one valid public candidate basis or deployment evidence.
- `npm run check:source-links` has no unresolved failure for `logistics-devanning`.

### UCD-009. Research Prompt Cleanup And Plan Lifecycle

Files:

- `docs/planning/usecase-factcheck-research-prompt-2026-06-30.md`
- `docs/planning/README.md`
- `docs/planning/usecase-data-scope-cleanup-plan-2026-06-30.md` after implementation is complete

Work:

- Add a warning at the top of the Deep Research prompt that it is a raw extraction containing known-bad references.
- Or move it to archive after this cleanup plan is implemented.
- After all implementation tasks are complete, archive this one-off plan or reclassify it in `docs/planning/README.md` according to `ai/rules/80-doc-governance.md`.

Completion:

- Future agents do not treat the raw extraction as validated evidence.
- This cleanup plan itself is no longer left as an active implementation plan after completion.

## 6. Ordering

1. UCD-001
2. UCD-002
3. UCD-003
4. UCD-008
5. UCD-004
6. UCD-005
7. UCD-006
8. UCD-007
9. UCD-009

Reason:

- Remove bad public evidence before adding adjacent robots.
- Keep Walker Tienkung behind a research gate.
- Do article relation updates after new IDs exist.
- Do not polish labels for pages that should be drafted.

## 7. Files Expected To Change

Likely:

- `data/useCases.ts`
- `data/robots.ts`
- `data/manufacturers.ts`
- `data/articles.ts`
- `data/articlePlacements.ts`
- `lib/site.ts`
- `scripts/check-source-links.mjs`
- `docs/planning/usecase-data-scope-cleanup-plan-2026-06-30.md`
- `docs/planning/usecase-factcheck-research-prompt-2026-06-30.md`
- `docs/planning/README.md`

Maybe:

- `public/images/robots/README.md` if image placeholders or rights notes are added.

Do not change in this plan:

- `data/types.ts`
- `lib/labels.ts`
- `lib/tagRegistry.ts`
- `/use-cases` UI components
- `/reports` UI components

## 8. Verification

After data edits:

```bash
npm run validate:data
npm run check:source-links
npm run build
```

Structured integrity checks:

```bash
node --input-type=module -e "import { useCases } from './data/useCases.ts'; let failed = false; for (const u of useCases.filter(u=>u.publishStatus==='published')) { if (!u.sources.length) { console.log('NO_SOURCES', u.id); failed = true; } if (!u.candidateRobots.length) { console.log('NO_CANDIDATES', u.id); failed = true; } } process.exit(failed ? 1 : 0);"
node --input-type=module -e "import { useCases } from './data/useCases.ts'; const bad = ['zizai-zeroshiki','kawasaki-nextage']; let failed = false; for (const u of useCases.filter((u)=>u.publishStatus==='published')) for (const c of u.candidateRobots) if (bad.includes(c.robotId)) { console.log('BAD_PUBLIC_CANDIDATE', u.id, c.robotId); failed = true; } process.exit(failed ? 1 : 0);"
node --input-type=module -e "import { articlePlacements } from './data/articlePlacements.ts'; let failed = false; for (const p of articlePlacements) if (p.articleId === 'robot-com-rnoid-workplace-humanoid-2026') { console.log('RNOID_PLACEMENT', p.surface, p.slot, p.order); failed = true; } process.exit(failed ? 1 : 0);"
node --input-type=module -e "import { articles } from './data/articles.ts'; const blocked = new Set(['robot-com-rnoid-workplace-humanoid-2026']); let failed = false; for (const a of articles) if (blocked.has(a.id) && a.relatedUseCaseIds.length) { console.log('BLOCKED_ARTICLE_USECASE_RELATION', a.id, a.relatedUseCaseIds.join(',')); failed = true; } process.exit(failed ? 1 : 0);"
```

The blocking structured checks above must exit 0 with no diagnostic output.

Review-only relation checks:

```bash
node --input-type=module -e "import { articles } from './data/articles.ts'; for (const id of ['genesis-ai-eno-non-humanoid-2026','pudu-d7-industrial-semi-humanoid-2026']) { const article = articles.find((a)=>a.id===id); if (article?.publishStatus === 'published') console.log('REVIEW_RELATED_USE_CASES', id, article.relatedUseCaseIds.join(',') || '(none)'); }"
node --input-type=module -e "import { articles } from './data/articles.ts'; import { articleIndexPlacementLimits, articlePlacements } from './data/articlePlacements.ts'; const sorted = articles.filter((a)=>a.publishStatus==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)); const byId = new Map(sorted.map((a)=>[a.id,a])); const used = new Set(); const pick = (slot) => { const out = []; for (const p of articlePlacements.filter((p)=>p.surface==='reports-index' && p.slot===slot).sort((a,b)=>a.order-b.order)) { const a = byId.get(p.articleId); if (a && !used.has(a.id) && out.length < articleIndexPlacementLimits[slot]) { out.push(a); used.add(a.id); } } for (const a of sorted) if (!used.has(a.id) && out.length < articleIndexPlacementLimits[slot]) { out.push(a); used.add(a.id); } return out; }; console.log('RESOLVED_HERO', pick('hero').map((a)=>a.id).join(',')); console.log('RESOLVED_FEATURE', pick('feature').map((a)=>a.id).join(','));"
node --input-type=module -e "import { robots } from './data/robots.ts'; import { manufacturers } from './data/manufacturers.ts'; import { siteMeta } from './lib/site.ts'; console.log('PUBLIC_COUNTS', 'robots='+robots.filter((r)=>r.publishStatus==='published').length, 'manufacturers='+manufacturers.filter((m)=>m.publishStatus==='published').length, 'dataAsOf='+siteMeta.dataAsOf);"
```

If the review-only check prints `relatedUseCaseIds`, the implementation notes must state why those articles remain valid adjacent context for the use-case pages. If no rationale is recorded, remove the relations.
The resolved hero/feature IDs and public counts/date must be reviewed against editorial intent and `/for-manufacturers` copy.

Optional broad text search for follow-up review only:

```bash
rg -n "zizai-zeroshiki|ZIZAI|零式|kawasaki-nextage|NEXTAGE product page|robot-com|R-noid" data src --no-ignore
```

Completion target:

- Extended `npm run check:source-links` covers published use-case/deployment sources, published use-case evidence URLs, plan-touched article sources, and touched robot/manufacturer source URLs.
- Published `useCases[].sources`, published `deployments[].sources`, published use-case `candidateRobots[].evidenceSourceUrls`, plan-touched `articles[].sources`, touched robot/manufacturer `sources[].url`, and touched image `sourceUrl` values do not return 404 after redirects.
- Any non-2xx/3xx result is either replaced, removed, or explicitly handled by drafting the dependent public record.
- Shared URL failures list every affected owner; verify this with the previous shared NEXTAGE URL during script review or with a fixture/sample run.
- `npm run build` is mandatory because this plan changes public data and generated routes/surfaces.
- Drafted use cases/robots are absent from `sitemap.xml` after build.
- `/for-manufacturers` count/date copy reflects the final public robot/manufacturer counts and `siteMeta.dataAsOf`.

Manual checks:

- `/robots` does not show ZEROSHIKI or draft-only records.
- `/manufacturers` does not show ZIZAI if it has no in-scope robots.
- `/for-manufacturers` shows correct robot/manufacturer counts and data date.
- `/use-cases` does not show drafted weak pages.
- Drafted `/use-cases/[slug]` and `/robots/[slug]` detail URLs intentionally return 404 unless a replacement canonical route was explicitly created.
- `/sitemap.xml` does not include drafted use case or robot URLs.
- `/reports` hero/feature resolved article IDs match the intended editorial lineup after R-noid/PUDU placement decisions.
- Remaining published use case detail pages show candidate evidence links that resolve to live sources.
- `/reports/pudu-d7-industrial-semi-humanoid-2026` shows related robot/manufacturer only after PUDU records exist.

## 9. Risks

- Drafting multiple use cases may reduce `/use-cases` coverage, but that is preferable to publishing unsupported pages.
- Adding PUDU D7 may broaden scope toward wheeled semi-humanoids. This is accepted by user instruction for PUDU only; it should not automatically allow every adjacent robot.
- Walker Tienkung may overlap with old `Walker E` naming. Do not create duplicate records until official identity is clear.
- Existing article body text may still mention excluded robots even after relation cleanup. Article body review is required.

## 10. Definition Of Done

- No published use case depends on ZEROSHIKI, dead NEXTAGE URLs, R-noid, or unregistered robot claims.
- NEXTAGE identity is resolved or the existing record is removed from public surfaces; no published data treats a Kawada/川田 entity as Kawasaki/川崎 or vice versa.
- PUDU D7 is modeled as a controlled adjacent candidate, not mass-attached to use cases.
- Published article relations never point to draft PUDU records, and PUDU article `relatedUseCaseIds` is explicitly kept as adjacent context or removed.
- If PUDU records are published/related, PUDU article text no longer says the manufacturer is unregistered.
- Drafted R-noid articles are removed from article placements, and R-noid `relatedUseCaseIds` are removed unless an explicit exception is documented.
- Eno remains article context only unless a later explicit scope decision approves it.
- Eno article `relatedUseCaseIds` are explicitly kept as adjacent context or removed.
- Walker Tienkung has a researched, source-backed add/update decision.
- `npm run check:source-links` has no unresolved failures for published use-case/deployment sources/evidence, plan-touched article sources, or touched robot/manufacturer sources.
- Touched image source URLs and rights attribution URLs are live and correctly attributed.
- `/for-manufacturers` public counts and `siteMeta.dataAsOf` are accurate.
- Reports hero/feature resolved slots are reviewed after placement edits/backfill.
- Drafted public pages are intentionally 404 and removed from sitemap; no unsupported page remains live only to avoid 404.
- `npm run validate:data` passes.
- `npm run build` passes.
