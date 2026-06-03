# Dark mode / theme refactor plan

Created: 2026-06-03
Branch inspected: `gemini/spotlight-cards`
HEAD inspected: `d13f59c feat: implement spotlight effects, 3D tilt, and focus-dim siblings for RobotCard`

## 1. Purpose

Implement the common three theme modes:

- `light`
- `dark`
- `system` / device setting

This plan is intentionally a refactoring plan first. The current app already has partial CSS-token support, but most visible UI uses hard-coded Tailwind neutral classes. A simple `ThemeProvider` install would make only `body` theme-aware while large parts of the app remain light.

## 2. Current state investigated

### Branch and working tree

- Current branch is `gemini/spotlight-cards`.
- `gemini/spotlight-cards` is ahead of `main` by the spotlight card commit.
- `gemini/refactor-ui-structure` also exists, but it points to an older commit than the current checked-out Gemini branch.
- Existing uncommitted changes are present and must not be reverted:
  - `components/RobotCard.tsx`
  - `next-env.d.ts`

Implementation agents must work with the current working tree. Do not run destructive restore/reset commands.

### Files inspected

- `package.json`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `components/Header.tsx`
- `components/Footer.tsx`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/FilterSelect.tsx`
- `components/FilterChipGroup.tsx`
- `components/TagChip.tsx`
- `components/EmptyState.tsx`
- `components/RobotCard.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/CompareClient.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/HomeContentNavigator.tsx`
- `components/ManufacturerWorldMap.tsx`
- `src/app/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`

### Important findings

- `next-themes` already exists in `package.json`.
- `src/app/globals.css` already defines `:root` and `.dark` CSS variables.
- Tailwind v4 maps these variables through `@theme inline`.
- `body` already applies `bg-background text-foreground`.
- `RootLayout` does not provide a theme provider.
- `RootLayout` wraps the app in `bg-neutral-50`, so it overrides theme-aware body background.
- `.dark` does not override `--input-background`, so input controls can stay white after dark mode is enabled.
- Only `components/ui/focus-cards.tsx` uses a `dark:` class. The app itself does not use `bg-background`, `bg-card`, `text-muted-foreground`, etc. in TSX.
- Fixed color classes are widespread:
  - 41 TSX files contain `neutral`, `white`, `black`, or `dark:` color classes.
  - 387 common fixed neutral/white class occurrences were found.

## 3. Design constraints

Keep the existing Deploid tone:

- neutral
- rectangular
- dense but calm
- source-aware buyer intelligence
- no decorative color explosion
- minimal radius and shadow

Do not introduce a new component framework or large design abstraction. The refactor should use the existing Tailwind v4 CSS variables already present in `globals.css`.

## 4. Non-goals

- Do not redesign page layouts.
- Do not change data fetching, filters, URL state, favorites, or media rights logic.
- Do not add new UI libraries.
- Do not convert all components to shadcn components.
- Do not change Open Graph image colors unless explicitly requested later.
- Do not rewrite `ManufacturerWorldMap` visuals beyond preventing broken colors.
- Do not remove the Gemini spotlight card interaction.

## 5. Theme architecture

Use `next-themes` with class-based theme switching:

- `attribute="class"`
- `defaultTheme="system"`
- `enableSystem`
- `disableTransitionOnChange`

Reason:

- `globals.css` already uses `.dark`.
- Tailwind has `@custom-variant dark (&:is(.dark *));`.
- `next-themes` can manage `light`, `dark`, and `system` through the same provider.

### New file

Add `components/ThemeProvider.tsx`:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Update `src/app/layout.tsx`

Required changes:

- Remove unused `Inter` import.
- Import `ThemeProvider`.
- Add `suppressHydrationWarning` to `<html>`.
- Replace `bg-neutral-50` shell wrapper with `bg-background text-foreground`.
- Wrap the app shell in `ThemeProvider`.

Target structure:

```tsx
<html lang="ja" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ThemeProvider>
  </body>
</html>
```

## 6. Theme mode UI

### New file

Add `components/ThemeModeToggle.tsx`.

Use `useTheme` from `next-themes` and lucide icons:

- `Monitor` for system
- `Sun` for light
- `Moon` for dark

UI pattern:

- segmented control with three icon buttons
- screen-reader labels
- `aria-pressed`
- avoid rendering wrong active state before mount

Implementation requirements:

- Component must be client-only.
- Keep mounted state with `useEffect`.
- Until mounted, render a disabled placeholder with same dimensions to avoid layout shift.
- Use `theme` for selected option, defaulting to `system`.
- Call `setTheme('system' | 'light' | 'dark')`.
- Labels:
  - `システム設定に合わせる`
  - `ライトモード`
  - `ダークモード`

Suggested class pattern:

```tsx
const modes = [
  { value: 'system', label: 'システム設定に合わせる', icon: Monitor },
  { value: 'light', label: 'ライトモード', icon: Sun },
  { value: 'dark', label: 'ダークモード', icon: Moon },
] as const;
```

Use existing style rules:

- compact
- neutral
- border-based
- no rounded marketing pill

Suggested button classes:

- wrapper: `inline-flex h-9 border border-border bg-card text-muted-foreground`
- selected: `bg-primary text-primary-foreground`
- unselected: `hover:bg-muted hover:text-foreground`

### Update `components/Header.tsx`

Required changes:

- Import `ThemeModeToggle`.
- Place it in the desktop nav area after the nav links.
- Place it in the mobile menu above or below the nav links.
- Keep existing mobile menu behavior.
- Do not make the theme toggle close the menu.
- Convert Header colors to semantic tokens while editing this file:
  - `border-neutral-200 bg-neutral-50` -> `border-border bg-background`
  - `text-neutral-900` -> `text-foreground`
  - `text-neutral-600` -> `text-muted-foreground`
  - `hover:text-neutral-900` -> `hover:text-foreground`
  - active underline should use `bg-primary`, not `bg-accent`, because current `--accent` becomes a gray surface in dark mode.

## 7. Token corrections in `globals.css`

### Required changes

Dark mode must override every token used by form controls and surfaces.

Add to `.dark`:

```css
--input-background: oklch(0.205 0 0);
--destructive-foreground: oklch(0.985 0 0);
```

Evaluate current accent behavior:

- Current light `--accent` is `oklch(0.97 0 0)`, effectively a pale neutral.
- Current dark `--accent` is `oklch(0.269 0 0)`, also a neutral surface.
- This means `bg-accent` is not a brand accent line.

Do not change global accent hue in this refactor unless a visual decision is requested. Use `primary` for active indicators and CTA-like selected states.

### Optional but recommended token additions

If repeated page background/surface mapping remains awkward, add explicit app tokens:

```css
--surface: oklch(1 0 0);
--surface-muted: oklch(0.985 0 0);
--surface-subtle: oklch(0.97 0 0);
```

Dark:

```css
--surface: oklch(0.205 0 0);
--surface-muted: oklch(0.18 0 0);
--surface-subtle: oklch(0.269 0 0);
```

Only add these if implementation shows `card`, `muted`, and `background` are not enough. Prefer existing `background`, `card`, `muted`, `popover`, `primary`, `border`, `input`, `muted-foreground` first.

## 8. Semantic class mapping

Use this mapping consistently.

| Current class intent | Replace with |
|---|---|
| `bg-white` card/panel | `bg-card` |
| `bg-white` input | `bg-input-background` |
| `bg-neutral-50` panel/page band | `bg-muted` or `bg-background`, based on context |
| `bg-neutral-100` image placeholder/subtle surface | `bg-muted` |
| `text-neutral-900` primary text | `text-foreground` or `text-card-foreground` |
| `text-neutral-700` body text | `text-foreground/80` when supported, otherwise `text-foreground` |
| `text-neutral-600` secondary text | `text-muted-foreground` |
| `text-neutral-500` metadata | `text-muted-foreground` |
| `text-neutral-400` disabled icon | `text-muted-foreground/70` |
| `border-neutral-200` subtle border | `border-border` |
| `border-neutral-300` strong border | `border-border` |
| `divide-neutral-200/300` | `divide-border` |
| `hover:bg-neutral-50/100` | `hover:bg-muted` |
| `hover:text-neutral-900` | `hover:text-foreground` |
| `hover:border-neutral-400/500` | `hover:border-foreground/40` or `hover:border-ring` |
| `bg-neutral-900 text-white` primary action | `bg-primary text-primary-foreground` |
| `hover:bg-neutral-700` primary action hover | `hover:bg-primary/90` |
| selected chip `border-neutral-900 bg-neutral-900 text-white` | `border-primary bg-primary text-primary-foreground` |
| neutral chip `border-neutral-200 bg-neutral-100 text-neutral-700` | `border-border bg-muted text-foreground` |
| dropdown selected `bg-neutral-900 text-white` | `bg-primary text-primary-foreground` |
| dropdown focused `bg-neutral-100 text-neutral-900` | `bg-muted text-foreground` |

Status tones may remain colored, but each must receive dark-aware classes:

| Tone | Light | Dark |
|---|---|---|
| success | `border-green-200 bg-green-50 text-green-800` | `dark:border-green-900/70 dark:bg-green-950/35 dark:text-green-300` |
| warning | `border-amber-200 bg-amber-50 text-amber-800` | `dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-300` |
| info | `border-blue-200 bg-blue-50 text-blue-800` | `dark:border-blue-900/70 dark:bg-blue-950/35 dark:text-blue-300` |
| favorite | `text-yellow-500 fill-yellow-500` | can remain `text-yellow-500 fill-yellow-500` |

## 9. Implementation phases

### Phase 0: Preflight

Commands:

```bash
git status --short --branch
git branch --show-current
npm run build
```

Rules:

- Confirm branch is `gemini/spotlight-cards` unless the user chooses another Gemini branch.
- Do not revert the existing `components/RobotCard.tsx` or `next-env.d.ts` changes.
- If `npm run build` changes `next-env.d.ts`, keep the generated file if it matches the environment; do not hand-edit it unless necessary.

### Phase 1: Theme infrastructure

Files:

- add `components/ThemeProvider.tsx`
- add `components/ThemeModeToggle.tsx`
- update `src/app/layout.tsx`
- update `src/app/globals.css`
- update `components/Header.tsx`

Acceptance:

- App builds.
- `html` class changes between no dark class / `dark` through theme control.
- Initial theme respects system setting.
- No hydration warning from next-themes.
- Header and app shell switch colors.

Validation:

```bash
npm run build
```

Manual checks:

- Open `/`.
- Switch light/dark/system.
- Reload after each mode.
- Confirm selected mode persists.
- Confirm mobile menu still opens/closes.

### Phase 2: Foundation components

Refactor components used across many pages before touching page files.

Files:

- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/FilterSelect.tsx` only if wrapper classes become necessary
- `components/FilterChipGroup.tsx`
- `components/TagChip.tsx`
- `components/EmptyState.tsx`
- `components/Breadcrumbs.tsx`
- `components/Footer.tsx`
- `components/ManufacturerLogoName.tsx`
- `components/SourceList.tsx`
- `components/RelatedLinkList.tsx`
- `components/Markdown.tsx`

Specific changes:

- `SearchInput` input:
  - `border-border bg-input-background text-foreground placeholder:text-muted-foreground`
  - icon `text-muted-foreground`
  - focus ring stays `focus:ring-ring` or existing `focus:ring-accent` only if visually confirmed.
- `SelectControl` default classes:
  - label `text-muted-foreground`
  - trigger `border-border bg-input-background text-foreground`
  - list `border-border bg-popover text-popover-foreground`
  - selected option `bg-primary text-primary-foreground`
  - focused option `bg-muted text-foreground`
- `TagChip`:
  - add dark-aware status tone classes.
  - neutral tone becomes semantic.
- `EmptyState`:
  - `variant='muted'` -> `bg-muted text-muted-foreground`
  - `variant='white'` -> `bg-card text-muted-foreground`
  - border `border-border`
- `Breadcrumbs`:
  - muted links use `text-muted-foreground hover:text-foreground`
  - current item uses `text-foreground`.
- `Footer`:
  - `bg-background border-border`
  - headings `text-foreground`
  - links/body `text-muted-foreground hover:text-foreground`
  - CTA `bg-primary text-primary-foreground hover:bg-primary/90`.
- `Markdown`:
  - body `text-foreground`
  - headings/strong/link `text-foreground`
  - blockquote/hr/code border/background use `border-border bg-muted`.

Acceptance:

- Forms, dropdowns, tags, breadcrumbs, footer work in both themes.
- No light-only dropdown menu remains.

Validation:

```bash
npm run build
```

Manual pages:

- `/robots`
- `/compare`
- `/contact`

### Phase 3: Card and comparison surfaces

Files:

- `components/RobotCard.tsx`
- `components/FavoriteCard.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `components/ManufacturerRobotsGrid.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/CompareClient.tsx`

Specific changes:

- `RobotCard`
  - Card base: `border-border bg-card text-card-foreground`
  - Hover border: `hover:border-ring`
  - Image placeholder: `bg-muted text-muted-foreground border-border`
  - Text rows: labels `text-muted-foreground`, values `text-card-foreground`
  - CTA row border `border-border`
  - bottom accent line `bg-primary`
  - spotlight radial gradient must not disappear in dark mode. Use CSS variable or conditional neutral alpha:
    - light: `rgba(0,0,0,0.03)`
    - dark-safe alternative: `rgba(255,255,255,0.05)` via CSS variable if needed.
  - Preserve existing Gemini pointer-event change around `ManufacturerLogoName`.
- `ComparisonRobotPanel`
  - Panel, tabs, internal detail overlay all use `bg-card`, `bg-muted`, `border-border`.
  - Selected tabs use `bg-card text-foreground border-primary`.
  - Inactive tabs use `bg-muted text-muted-foreground`.
- `CompareClient`
  - Page background `bg-background`
  - sidebars `bg-muted border-border`
  - sidebar headers `bg-card border-border`
  - empty state uses shared token pattern.

Acceptance:

- Robot cards remain visually readable in light/dark.
- Spotlight and tilt still work.
- Compare panels do not show white blocks in dark mode.
- Favorites remain clickable.

Validation:

```bash
npm run build
```

Manual pages:

- `/robots`
- `/compare`
- home featured robot section

### Phase 4: Browser pages and listing sections

Files:

- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `src/app/page.tsx`
- `components/HomeContentNavigator.tsx`

Specific changes:

- Browser page shell:
  - `min-h-screen bg-white` -> `min-h-screen bg-background`
  - `min-h-screen bg-neutral-100` -> `min-h-screen bg-background`
- Header bands:
  - `border-b border-neutral-300 bg-white` -> `border-b border-border bg-card`
- List cards:
  - `border border-neutral-300 bg-white` -> `border border-border bg-card`
  - `bg-neutral-50` cards -> `bg-muted`
- Text:
  - titles `text-foreground`
  - body/summary `text-muted-foreground` or `text-foreground` depending visual hierarchy
- Links:
  - `hover:text-neutral-900` -> `hover:text-foreground`
  - underline border `border-primary` or `border-foreground`
- `HomeContentNavigator`
  - Text list side should be theme-aware.
  - Image preview panel intentionally uses dark overlay; keep the overlay dark because it is image treatment, not page theme.
  - Manufacturer logo grid inside preview can remain light if logos require white backing, but wrap it as an intentional media surface and document the exception in code comment if changed.

Acceptance:

- Listing pages no longer show white backgrounds in dark mode except intentional media/logo backplates.
- Filters remain above interactive card layers.
- No layout shifts from color class changes.

Validation:

```bash
npm run build
```

Manual pages:

- `/`
- `/robots`
- `/manufacturers`
- `/guides`
- `/reports`
- `/use-cases`

### Phase 5: Detail pages

Files:

- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `components/RobotImageCarousel.tsx`
- `components/ArticleToc.tsx`
- `components/ContactForm.tsx`

Specific changes:

- Page shells use `bg-background`.
- Header bands use `bg-card border-border`.
- Aside panels use `bg-card` or `bg-muted`.
- CTA buttons use `bg-primary text-primary-foreground hover:bg-primary/90`.
- Secondary buttons use `bg-card border-border text-foreground hover:bg-muted`.
- `ContactForm` input/textarea fields use `bg-input-background border-border text-foreground placeholder:text-muted-foreground`.
- `RobotImageCarousel` image placeholders use `bg-muted text-muted-foreground border-border`.

Acceptance:

- Detail pages are fully readable in both themes.
- Sticky asides remain visually separated.
- Contact form remains accessible and readable.

Validation:

```bash
npm run build
```

Manual pages:

- one robot detail page
- one manufacturer detail page
- one guide detail page
- one report detail page
- one use-case detail page
- `/about`
- `/contact`

### Phase 6: Final fixed-color audit

Run:

```bash
rg -n "(bg|text|border|ring|divide|placeholder|hover:bg|hover:text|hover:border|focus:border|focus:ring)-(neutral|white|black|gray|slate|zinc|stone)-|bg-white|text-white|bg-black|text-black" src components -g '*.tsx'
```

Expected remaining categories:

- `text-white` on image overlays or primary buttons only if paired with `bg-primary` or dark overlay.
- `bg-black/50` image overlay only.
- `bg-white/90` logo backplates only, if intentionally kept.
- status colors such as green/amber/blue/yellow.
- Open Graph image styles are excluded unless changing social preview is in scope.

Any remaining raw neutral class must be reviewed and either:

- converted to semantic tokens, or
- documented as intentional media treatment.

## 10. Files to change

Expected new files:

- `components/ThemeProvider.tsx`
- `components/ThemeModeToggle.tsx`

Expected changed files:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `components/Header.tsx`
- `components/Footer.tsx`
- `components/SearchInput.tsx`
- `components/SelectControl.tsx`
- `components/FormSelect.tsx`
- `components/FilterChipGroup.tsx`
- `components/TagChip.tsx`
- `components/EmptyState.tsx`
- `components/Breadcrumbs.tsx`
- `components/ManufacturerLogoName.tsx`
- `components/SourceList.tsx`
- `components/RelatedLinkList.tsx`
- `components/Markdown.tsx`
- `components/RobotCard.tsx`
- `components/FavoriteCard.tsx`
- `components/FeaturedRobotsGrid.tsx`
- `components/ManufacturerRobotsGrid.tsx`
- `components/ComparisonRobotPanel.tsx`
- `components/CompareClient.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/GuidesBrowser.tsx`
- `components/ReportsBrowser.tsx`
- `components/UseCasesBrowser.tsx`
- `components/HomeContentNavigator.tsx`
- `src/app/page.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/reports/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `components/RobotImageCarousel.tsx`
- `components/ArticleToc.tsx`
- `components/ContactForm.tsx`

Files not expected to change:

- `data/*.ts`
- filter/search/data helpers in `lib/*`
- `scripts/validate-data.mjs`
- `src/app/opengraph-image.tsx`, unless the user explicitly wants social preview theme changes
- `public/*`

## 11. Verification commands

Run after each phase:

```bash
npm run build
```

Run final data validation:

```bash
npm run validate:data
```

Run final fixed-color audit:

```bash
rg -n "(bg|text|border|ring|divide|placeholder|hover:bg|hover:text|hover:border|focus:border|focus:ring)-(neutral|white|black|gray|slate|zinc|stone)-|bg-white|text-white|bg-black|text-black" src components -g '*.tsx'
```

If a dev server is needed for manual QA:

```bash
npm run dev
```

## 12. Manual QA checklist

Theme behavior:

- [ ] Default mode is system.
- [ ] Light mode persists after reload.
- [ ] Dark mode persists after reload.
- [ ] System mode responds to OS color scheme.
- [ ] No hydration warning appears.
- [ ] No flash leaves the app permanently in the wrong theme.

Responsive:

- [ ] Header desktop nav displays theme toggle.
- [ ] Mobile menu displays theme toggle.
- [ ] 360px width does not overflow.
- [ ] 768px width keeps filter controls usable.
- [ ] 1280px width preserves dense layout.

Pages:

- [ ] `/`
- [ ] `/robots`
- [ ] `/robots/[slug]`
- [ ] `/manufacturers`
- [ ] `/manufacturers/[slug]`
- [ ] `/compare`
- [ ] `/guides`
- [ ] `/guides/[slug]`
- [ ] `/reports`
- [ ] `/reports/[slug]`
- [ ] `/use-cases`
- [ ] `/use-cases/[slug]`
- [ ] `/about`
- [ ] `/contact`

Interactions:

- [ ] Search input readable in dark mode.
- [ ] Select dropdown readable in dark mode.
- [ ] Filter chips selected/unselected states clear.
- [ ] RobotCard spotlight/tilt still works.
- [ ] Favorite toggle still works.
- [ ] Compare add/remove still works.
- [ ] Contact form fields are readable.
- [ ] Focus ring visible in both themes.

Visual exceptions:

- [ ] Logo backplates are intentional if they remain white.
- [ ] Image overlays remain dark for readability.
- [ ] Status chips maintain contrast in dark mode.

## 13. Risks and mitigations

### Risk: visually flat dark mode

Cause:

- Existing tokens are mostly neutral and `--accent` is not a brand color.

Mitigation:

- Use `background`, `card`, `muted`, `border`, and `primary` consistently.
- Avoid using `accent` for active lines until accent color direction is decided.

### Risk: incomplete conversion because fixed classes are widespread

Cause:

- 41 files have fixed color classes.

Mitigation:

- Refactor in phases.
- Run fixed-color audit after each phase.
- Treat remaining raw color classes as either bugs or documented media exceptions.

### Risk: next-themes hydration mismatch

Cause:

- Theme is resolved on client.

Mitigation:

- Add `suppressHydrationWarning` on `html`.
- Render mounted-safe state in `ThemeModeToggle`.

### Risk: logo/images need light surfaces

Cause:

- Manufacturer logos may be designed for light backgrounds.

Mitigation:

- Keep small `bg-white`/`bg-white/90` media backplates only where logos need it.
- Do not use those classes for page/card surfaces.

### Risk: status colors lose contrast in dark mode

Cause:

- Current green/amber/blue tags are light-only.

Mitigation:

- Add `dark:` tone variants in `TagChip` and status-specific call sites.

### Risk: existing uncommitted RobotCard changes get overwritten

Cause:

- `RobotCard` already has local changes in the working tree.

Mitigation:

- Read `git diff -- components/RobotCard.tsx` before editing.
- Preserve the `ManufacturerLogoName` pointer-event wrapper change.
- Do not use `git restore` on this file.

## 14. Rollback strategy

If a phase fails:

- Revert only files changed in that phase.
- Do not revert unrelated pre-existing changes.
- Keep theme infrastructure if it builds; theme conversion can be resumed component-by-component.

Suggested commit strategy:

1. `feat(theme): add theme provider and mode toggle`
2. `refactor(theme): convert shared UI primitives to semantic tokens`
3. `refactor(theme): convert cards and comparison surfaces`
4. `refactor(theme): convert listing and detail pages`

## 15. Final acceptance criteria

- Build passes.
- Data validation passes.
- Theme toggle supports `system`, `light`, `dark`.
- Selection persists.
- Major pages have no unintended light-only surfaces in dark mode.
- Remaining fixed color classes are limited to intentional media overlays/backplates, primary foreground text, or status colors.
- Existing Gemini spotlight card behavior remains intact.
