---
status: plan
updated: 2026-07-08
---

# Responsive Capture Protocol v1

Created: 2026-07-08
Status: active manual protocol for `responsive-phase-1-static-audit-v1.md` R-06

This protocol is the repeatable capture path for Phase 0 matrix rows M-01 through M-18. It exists because the project currently has no Playwright or browser screenshot dependency. Captured images are working artifacts and should not be committed.

## 1. Preconditions

- Branch: run on the responsive implementation branch being reviewed.
- Build sanity: `npm run build` must pass before capture.
- Media policy: run with `NEXT_PUBLIC_MEDIA_USAGE_POLICY=reference-attributed`.
- Local server: `npm run dev -- -H 127.0.0.1`, then capture from `http://127.0.0.1:3000`.
- Output root: `/private/tmp/deploid-responsive-captures/<YYYYMMDD>-<short-sha>/`.
- Filename format: `<matrix-id>__<state-or-route>__<axis-ids>.png`.
- Capture log: write `/private/tmp/deploid-responsive-captures/<YYYYMMDD>-<short-sha>/capture-log.md` with commit SHA, server command, browser, and any not-covered rows.

Do not mix screenshots from different commits in one output folder.

## 2. Axis Presets

Width presets:

| Axis | Viewport |
| --- | --- |
| W-01 | 320 x 700 |
| W-02 | 360 x 740 |
| W-03 | 390 x 844 |
| W-05 | 768 x 1024 |
| W-06 | 1024 x 700 |
| W-07 | 1280 x 900 |
| W-08 | 1536 x 900 |

Height presets:

| Axis | Viewport |
| --- | --- |
| H-01 | 360 x 568 |
| H-02-W06 | 1024 x 700 |
| H-02-W07 | 1280 x 700 |
| H-03-W07 | 1280 x 900 |
| H-03-W08 | 1536 x 900 |

Preference/input presets:

| Axis | Setup |
| --- | --- |
| P-01 | Enable touch/coarse pointer emulation in browser devtools. Confirm hover-only controls have tap alternatives. |
| P-03 | Force dark color scheme or set `localStorage.setItem('theme', 'dark')`, then reload. |
| P-04 | Force `prefers-reduced-motion: reduce` in browser devtools. |
| P-05 | Keyboard only: use Tab, Shift+Tab, Enter, Space, Arrow keys, Home, End, and Escape without mouse interaction. |

W-04 and P-02 are optional targeted checks. Add them only when the implementation changes large-phone-specific breakpoints, hover-only fine-pointer behavior, or drag/drop states.

## 3. Global Capture Steps

1. Record the commit SHA and server command in `capture-log.md`.
2. For each matrix row, open the listed URL from `http://127.0.0.1:3000`.
3. Apply the required viewport preset and any required preference/input preset.
4. Scroll only when the row explicitly names a sticky, sidebar, drawer, dialog, or lower-page state.
5. Capture the whole visible viewport, not a full-page stitched screenshot.
6. Name the file with all applied axis IDs, for example `M-02R__robots-active-chips__W-01-P01.png`.
7. If a setup cannot be reproduced, do not fake coverage. Write `manual/not-covered` and the reason in `capture-log.md`.

## 4. Mac And iPhone Check Methods

Use at least one desktop browser emulator and one real iOS/WebKit path before final acceptance.

Recommended sequence:

1. Chrome DevTools device toolbar for fast layout sweeps.
   - Open `http://127.0.0.1:3000`.
   - Toggle device toolbar.
   - Use fixed dimensions from section 2, especially 320, 360, 390, 768, 1024, 1280, and 1536 widths.
   - Enable touch emulation for P-01 and reduced motion/dark mode from Rendering tools when needed.
2. Safari Responsive Design Mode for WebKit-specific behavior.
   - Safari > Settings > Advanced > enable "Show features for web developers".
   - Develop > Enter Responsive Design Mode.
   - Check iPhone presets plus custom widths for W-01/W-02/W-03.
3. Real iPhone over the local network for final mobile confidence.
   - Start dev server with a LAN host, for example `npm run dev -- -H 0.0.0.0`.
   - Find the Mac LAN IP with `ipconfig getifaddr en0`.
   - On the iPhone, open `http://<mac-lan-ip>:3000`.
   - Keep Mac and iPhone on the same Wi-Fi. Disable VPN/private relay if the site cannot connect.
4. iPhone Simulator if Xcode is installed and a physical device is unavailable.
   - Open Simulator, then open Safari inside the simulated device.
   - Use the same LAN-hosted URL or `http://127.0.0.1:3000` if the simulator resolves it in the local environment.

Browser resizing alone is not enough for final sign-off because it does not reliably reproduce coarse pointer, touch scrolling, iOS Safari viewport units, address-bar behavior, or WebKit focus quirks.

## 5. GUI Acceptance Checklist

Use this quick checklist before taking the full matrix screenshots.

Global shell:

- Header drawer at 320/360px opens without horizontal overflow.
- Closed drawer controls are not reachable by Tab.
- Open drawer traps Tab/Shift+Tab, closes with Escape, restores focus to the menu button, and locks body scroll.
- Theme toggle is reachable inside the drawer.
- Desktop nav dropdown opens by keyboard focus at 1024/1280px and has no stale menu semantics.

Collection browsers:

- `/robots`, `/manufacturers`, `/use-cases`, and `/reports` are one column at 320/360px where intended.
- Loaded, pending skeleton, and loading states use matching card density.
- Filter chips, dropdown triggers, search fields, and result counts wrap without clipping.
- `/use-cases?industry=manufacturing&task=material-handling` exposes task selection without hover.
- `/reports?page=3` and `/reports?page=10` do not break pagination after hydration.

Cards and media:

- Robot cards, manufacturer cards, use-case cards, and news cards have no horizontal overflow at 320/360px.
- No-image robot cards and no-image detail pages remain readable.
- Carousel prev/next/dot controls have visible focus and accessible names.
- Reduced motion stops carousel autoplay/progress and decorative hover scale/shimmer/tilt.

Detail pages:

- `/robots/mentee-menteebotv3`, `/robots/agility-digit`, `/manufacturers/unitree`, `/use-cases/research-development`, and article fixtures G-07/G-08/G-09 have no page-level horizontal scroll at 320/360px.
- Source lists and long titles wrap; manufacturer guide lineup table scrolls only inside its table container.
- YouTube facade and activated iframe keep aspect ratio and visible focus.
- Article hero does not consume the whole short mobile viewport.
- Robot prev/next links stack and wrap on mobile.

Compare:

- `/compare` empty, one selected, three selected, invalid/dedupe, and max-count states remain inspectable at 320/360px.
- Selected robots use the mobile horizontal rail at base width and the desktop grid at larger widths.
- Add/remove/inspect works without DnD.
- Detail dialog fits H-01 short height, scrolls internally, closes, and returns focus.
- Reduced motion disables insertion-preview layout animation.

Home:

- Mobile "主要コンテンツ" links are reachable by keyboard and screen-reader path.
- Manufacturer map points are keyboard-focusable on the primary map copy.
- Map drag/tap still works on touch.
- Featured rails scroll horizontally without trapping the page.
- Encrypted heading and decorative card motion stop under reduced motion.

## 6. Matrix Capture Plan

| Matrix | URL / State | Width Captures | Height Captures | Preference / Input Captures | Required Setup |
| --- | --- | --- | --- | --- | --- |
| M-01 | `/` | W-01, W-02, W-05, W-06, W-07, W-08 | none | P-01, P-03, P-04 | map drag, home rails, SS-09 |
| M-02R | `/robots`; `/robots?industry=logistics&task=material-handling&manufacturer=unitree&availability=distributor-japan` | W-01, W-02, W-03, W-05, W-06, W-07, W-08 | none | P-01, P-03 | release tabs, four filters, SearchableDropdown, active chips, no-image cards, SS-13, SS-16 |
| M-02M | `/manufacturers`; `/manufacturers?country=China&route=domestic-distributor` | W-01, W-02, W-05, W-06, W-07, W-08 | none | P-01, P-03 | country/route dropdowns, active chips, distributor popover, SS-13, SS-15, SS-16 |
| M-02U | `/use-cases`; `/use-cases?industry=manufacturing&task=material-handling` | W-01, W-02, W-05, W-06, W-07, W-08 | none | P-01, P-03 | industry buttons, HoverCard, touch task picker, active task, SS-14, SS-16 |
| M-02A | `/reports`; `/reports?kind=manufacturer-guides`; `/reports?q=unitree` | W-01, W-02, W-05, W-06, W-07, W-08 | none | P-03, P-04 | shelf buttons, search field, hero hidden under active search, pagination, SS-16 |
| M-03 | `/robots?q=__responsive_zero__`; `/manufacturers?q=__responsive_zero__`; `/use-cases?q=__responsive_zero__`; `/reports?q=__responsive_zero__` | W-01, W-05, W-07 | none | none | EmptyState, result count, sticky header |
| M-04 | `/reports?page=2`; `/reports?page=3`; `/reports?page=10` | W-01, W-05, W-07, W-08 | none | none | pagination controls, responsive per-page hydration, clamp |
| M-05 | `/robots/mentee-menteebotv3`; `/robots/agility-digit` | W-01, W-02, W-05, W-06, W-07, W-08 | H-01 | P-01, P-03, P-04 | one-image carousel, no-image fallback, sticky section nav, SS-09 |
| M-06 | `/manufacturers/unitree`; `/manufacturers/fourier-intelligence` | W-01, W-05, W-06, W-07, W-08 | none | none | contact aside, fact sheet URLs, related robot grids, SS-09 |
| M-07 | `/use-cases/factory-assembly-support`; `/use-cases/research-development` | W-01, W-05, W-06, W-07, W-08 | none | none | candidate list, deployments grid, sidebar collapse |
| M-08 | `/reports/bmw-figure-deployment`; `/reports/unitree-manufacturer-guide`; `/reports/deepmind-gemini-robotics-ces2026` | W-01, W-02, W-05, W-06, W-07, W-08 | none | P-03, P-04 | hero/no-hero, TOC, related sidebar, sources, YouTube facade and iframe, SS-09, SS-12 |
| M-09 | `/compare`; `/compare?compare=unitree-g1,agility-digit,apptronik-apollo`; `/compare?compare=unitree-g1,__invalid__,unitree-g1,agility-digit`; G-22 max-count URL | W-01, W-02, W-05, W-06, W-07 | H-01 | P-01 | 0/1/2/3 selected, invalid/dedupe/max normalization, mobile manufacturer selector, SS-08, SS-13 |
| M-10 | `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` | W-06, W-07, W-08 | none | optional P-02 | desktop accordion, favorites empty/non-empty, drag overlay, sheet/favorite drop targets, SS-03, SS-04 |
| M-11 | `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` with detail dialog open | W-01, W-02, W-06, W-07 | H-01 | P-05 | ComparisonRobotPanel Dialog open, close focus return, long detail rows, SS-08 |
| M-12 | `/about`; `/for-manufacturers`; `/privacy` | W-01, W-05, W-07 | none | none | long definition values, ordered lists, privacy links |
| M-13 | `/contact` | W-01, W-02, W-05, W-07 | H-01 | none | disabled, submitting, success, ValidationError, privacy link wrapping, SS-01, SS-02, SS-08 |
| M-14 | `/robots/__responsive_missing__`; `/__responsive_not_found__`; route loading states | W-01, W-05, W-07 | none | none | skeletons, recovery links, concrete not-found URLs, SS-05, SS-10, SS-11 |
| M-15 | any route with mobile drawer open and closed | W-01, W-02, W-06, W-07 | H-01 | P-05 | drawer closed tab order, focus trap, body scroll lock, theme toggle, SS-06, SS-08 |
| M-16 | `/`; `/reports`; `/robots/mentee-menteebotv3` | W-01, W-05, W-07 | none | P-01, P-03, P-04, P-05 | carousel dots/prev/next, PageTabBar keyboard path, visible focus, SS-07, SS-09 |
| M-17 | `/robots/mentee-menteebotv3`; `/reports/bmw-figure-deployment`; `/compare?compare=unitree-g1,agility-digit,apptronik-apollo` | W-06, W-07 | H-02, H-03 | none | sticky sidebars, article TOC, compare dialog height, SS-08 |
| M-18 | `/robots/unitree-r1`; `/use-cases/warehouse-picking`; `/reports/jal-haneda-unitree-pilot-2026` | W-01, W-07 | none | none | redirect target layout sanity and no fallback flash |

## 7. State Setup Notes

- SS-02 requires either a stable Formspree test endpoint or a network mock. If neither exists, mark success/error as `manual/not-covered`.
- SS-05 has no stable runtime error trigger. Keep it `manual/not-covered` until a test-only trigger exists.
- SS-11 loading states require network throttle, a test-only delayed route loader, or manual/not-covered notation.
- SS-12 requires two captures for `/reports/unitree-manufacturer-guide`: YouTube facade before activation and iframe after activation.
- SS-16 requires interacting with filters/search/tabs until `CardGridSkeleton` is visible.

## 8. Priority Queue

Run these first before R-03 and R-04 implementation review:

| Queue | Captures |
| --- | --- |
| Q-01 | M-02R at W-01, W-02, W-05 for `/robots` and the active-chip stress URL |
| Q-02 | M-02M at W-01, W-02, W-05 for G-23 plus distributor popover |
| Q-03 | M-02U at W-01, W-02, W-05 for G-24 plus touch task picker |
| Q-04 | M-09/M-11 at W-01, W-02, H-01 for G-10 plus detail dialog |
| Q-05 | M-08 at W-01, W-02, W-07, P-04 for G-08 |
| Q-06 | M-01/M-16 at W-01, W-02, P-01, P-05 for `/` |
| Q-07 | M-15 at W-01, W-02, H-01, P-05 with mobile drawer open |
| Q-08 | M-15 at W-06, W-07, P-05 with desktop nav dropdown open by keyboard focus |

## 9. Completion Rule

R-06 is complete when this protocol is committed and the Phase 1 tracker links it as the active capture method. Actual screenshot image files remain outside git unless a later review explicitly asks to preserve a small failing-state sample.
