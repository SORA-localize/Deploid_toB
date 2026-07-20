# Article Sourcing Rules

Use this file when searching for article candidates (news, press releases, deployments) before writing or adding to `data/articles.ts`. This is the "where to look" stage, before `21-data-maintenance-workflow.md` ("how to record it").

## Must Read

- `docs/decisions/article-sourcing-reference-v1.md` — allowed/excluded source categories and search query patterns
- `docs/decisions/news-automation-prompt-contract-v1.md` — Scheduled Tasks output schema and CLI handoff rules for daily article batches; weekly newsletter rules use local published articles
- `docs/plans/editorial-methodology-review-2026-06-24.md` — which subjects to prioritize and which to deprioritize (draft; not yet merged into the style guide)
- `docs/decisions/editorial_style_guide_v1.md` — what counts as a usable source once found (Step 1 of the writing workflow)

## Standing Rules

- Prefer manufacturer official newsrooms, press-release wire services, and the reliable trade media listed in the reference doc.
- Do not source candidates primarily from arXiv, bioRxiv, or other preprint/academic sites. A paper only becomes a candidate when it connects directly to commercial deployment, safety/regulation, product spec, or PoC design, and a reliable secondary report confirms it.
- Do not propose a candidate backed by a single unconfirmed report. Require an official source or a second reliable report.
- Use date-filtered search (recent days/weeks) for hero/news candidates; older or weak-source items go to a research backlog, not directly to `data/articles.ts`.
- For daily automated article generation, use `deploid_daily_article_batch_v1` from `news-automation-prompt-contract-v1.md`; do not paste unstructured Scheduled Tasks output directly into `data/articles.ts`.
- When the user posts a message headed like `日次ニュース` or `今日のニュース` followed by ChatGPT Scheduled Tasks output, treat it as a CLI handoff. The user does not need to paste CLI instructions. Read `news-automation-prompt-contract-v1.md` section 3, perform duplicate checks against existing `data/articles.ts` before editing, and convert only non-duplicate `articles[].article` items mechanically. Do not perform supplemental news research to fill missing body, sources, or images.
- When the user asks for `週次ニュース`, `週刊ニュース`, or `ニュースレター`, do not expect a ChatGPT Scheduled Tasks batch. Read local published `news` articles from the last 7 days and create newsletter copy from those records only. Weekly newsletter output should not create new `Article` records unless the user separately asks for a storage model or article conversion.
- After finding a candidate, hand off to `21-data-maintenance-workflow.md` G2/G6 for source recording — do not skip straight to writing `body` without verifying sources there.

This file is routing and guardrails. Use the reference doc for the actual site list and query examples.
