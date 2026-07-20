# Content And Rights Rules

Use this file for images, logos, generated media, citations, article text, source lists, and other copyright-sensitive work.

## Must Read

- `docs/decisions/copyright_and_media_rights_policy_v1.md`
- `docs/decisions/editorial_style_guide_v1.md` for article text
- `docs/decisions/data/README.md` for asset placement
- `public/images/robots/README.md` when adding robot photos

## Standing Rules

- Only source images/logos from official manufacturer channels (official site, press release, news, product page). Never from third-party sites, resellers, press coverage, or social reposts.
- Do not hotlink external images when a local asset should be used.
- Every `ImageAsset` needs rights metadata according to `data/types.ts`.
- If usage terms are unclear but the source is official and no explicit prohibition applies, use `rights.status: 'reference-attributed'` — this is the standard production state as of `copyright_and_media_rights_policy_v1.md` §0/§7, not an MVP-only exception. If an explicit prohibition applies (`copyright_and_media_rights_policy_v1.md` §3), use `blocked` and do not publish.
- Logos additionally follow §5 of the policy doc: never imply official/certified/partner status, never present a logo list as sponsors/partners/deployments.
- Do not copy external article prose. Summarize and analyze in Deploid's own words.
- Keep quotes short, attributed, and necessary.
- Generated images must not create product, logo, or real-machine confusion.

This file is an operational guide, not legal advice. Use the policy doc as the detailed source of truth.
