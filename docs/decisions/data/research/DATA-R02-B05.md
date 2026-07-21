# DATA-R02 B05 — EngineAI (SE01 / PM01 / T800 / SA01)

Checked: 2026-07-17. All facts re-verified today from primary sources (EngineAI official site, and for usage examples, partner/government official pages). DATA-R01 (docs/data/DATA-R01-B05-engineai.json/.md) and DATA-R02-source-plan.json were used only to discover candidate URLs; every value below was independently re-opened and re-checked.

Manufacturer: EngineAI (众擎机器人 / Shenzhen Zhongqing Robot), https://www.engineai.com.cn/

---

## engineai-se01 (SE01)

- **recordScope**: specific-variant (single current product, no sub-editions found)
- **lifecycleStatus**: current — confirmed as flagship product on EngineAI's homepage and dedicated product page (product-se01.html) as of 2026-07-17.
- **publicationRecommendation**: keep-published
- **Reasoning**: Official top page and product page both continue to present SE01 as a live, current full-size humanoid. No price/purchase link found anywhere on the official site (not on product-purchase.html), and no confirmed customer deployment exists — but that is a gap in commercial disclosure, not evidence of discontinuation, so `keep-published` with `inquiry-fallback` pricing is correct rather than `manual-review`.

### Spec status

| Key | Status | Value |
|---|---|---|
| mobility | found | biped, human-like gait |
| heightCm | found | 170 cm |
| weightKg | found | ~55 kg |
| speedMps | found | 2 m/s (normal walking speed) |
| dof | found | 32 |
| payloadKg | not-published | |
| runtimeMin | found | 120 min (2h endurance) |
| batteryCapacityWh | needs-review | "1000 mAh" shown with no pack voltage; not converted |
| chargeTimeMin | not-published | only "80% Charge" level shown, no duration |
| batterySystem | found | quick-release high-capacity battery |
| controlMethod | not-published | |
| sdk | not-published | |
| computePlatform | not-published | |
| ipRating | not-published | |
| operatingTemperature | not-published | |
| safetyStandard | not-published | |

### Conflicts / unresolved
- "1000 mAh" battery figure's consistency with "large-capacity" marketing claim can't be verified (no voltage given).
- No current public price found. A 2025-01 founder interview mentioned a planned "¥150,000–200,000" price range — third-party/interview-sourced, not adopted.
- A web search initially surfaced a "500-unit automotive intent order," but this turned out to be a mis-attributed report about UBTECH's Walker S, not EngineAI SE01 — excluded from usage examples.

### Evidence log
- SE01 official product page — EngineAI — https://www.engineai.com.cn/product-se01.html — 2026-07-17
- EngineAI official homepage — EngineAI — https://www.engineai.com.cn/ — 2026-07-17
- SE01/PM01 official FAQ (2025-01-10) — EngineAI — https://www.engineai.com.cn/about-news-media/23.html — 2026-07-17
- EngineAI official purchase page — EngineAI — https://www.engineai.com.cn/product-purchase.html — 2026-07-17

---

## engineai-pm01 (PM01)

- **recordScope**: product-family (commercial edition vs. education edition differ in weight, DoF, compute, SDK access)
- **lifecycleStatus**: current
- **publicationRecommendation**: keep-published
- **Reasoning**: Actively sold today at ¥188,000 on the official purchase page, AND — this is the key upgrade over DATA-R01 — PM01 has **confirmed real-world commercial deployment**, found via a customer/partner's own official channels rather than deployment-identity guesswork: (1) Nanjing Jianye District government's own official site confirms "intelligent traffic management robots" now operating in Shenzhen/Nanjing/Changsha/Jingzhou for regular traffic-assist duty, and Duolun Technology's own official corporate site names PM01 specifically as the robot behind this rollout, tied to a 3-year, 2,000+ unit, >¥100M contract; (2) Shenzhen's municipal Development and Reform Commission's own official page confirms a PM01-staffed JD.com/EngineAI flagship retail store in Shenzhen (opened 2025-11) with PM01 as a shopping-guide robot.

### Spec status

| Key | Status | Value |
|---|---|---|
| mobility | found (family-common) | biped |
| heightCm | found (family-common) | 140 cm (1400mm), both editions |
| weightKg | conflict | commercial ~42kg / education ~43kg / FAQ ~40kg |
| speedMps | needs-review | ">2 m/s hardware-supported" (floor, not exact) |
| dof | conflict | commercial 23 / education 24 |
| payloadKg | not-published | |
| runtimeMin | found (family-common) | 120 min (~2h), both editions |
| batteryCapacityWh | needs-review | 10,000 mAh + 54.6V *charging* voltage (not pack nominal voltage) — no Wh conversion |
| chargeTimeMin | found (family-common) | 120 min (~2h to full), both editions |
| batterySystem | found (family-common) | 10,000mAh quick-release smart battery |
| controlMethod | found (family-common) | handheld remote controller (baseline, both editions) |
| sdk | conflict | commercial: not supported / education: supported (ROS framework, GitHub repo) |
| computePlatform | conflict | commercial: 4-core CPU only / education: +Jetson Orin NX 16G |
| ipRating | not-published | |
| operatingTemperature | not-published | |
| safetyStandard | not-published | |

### Price
- ¥188,000, manufacturer-public, CNY, tax status unknown, edition not specified on the current purchase page — https://www.engineai.com.cn/product-purchase.html
- (Historical/expired: a 2025-01 official FAQ recorded a ¥88,000 commercial-edition promo valid only through 2025-03-31 — not used as current price.)

### Conflicts / unresolved
- Current ¥188,000 listing does not state which edition or tax status applies.
- The Nanjing government page itself uses only the generic term "智慧交管机器人" (intelligent traffic-management robot), not "PM01" by name — the PM01 attribution rests on Duolun Technology's own official site plus broad press corroboration, not the government page alone.
- No EngineAI-published news article was found announcing the Nanjing/traffic-patrol rollout on EngineAI's own site.

### Official use cases
- research-development (variant-specific: education edition) — "面向科研教育场景的开放型人形机器人／算法验证和二次开发" — about-news-media/23.html
- research-prototype-dev (variant-specific: education edition) — open dev platform / GitHub training-deployment code — product-pm01.html

### Usage examples (real deployments — up to 3 primary)
1. **Jiangsu Qing'an Robot Co. / Nanjing traffic-assist rollout** — commercial-deployment — PM01 — Nanjing Jianye District government official page (njjy.gov.cn) + Duolun Technology official site (duoluntech.com)
2. **Shenzhen JD.com × EngineAI flagship retail store (深业上城)** — commercial-deployment — PM01 as shopping-guide robot — Shenzhen Development & Reform Commission official page (fgw.sz.gov.cn)

### Evidence log
- PM01 official product page — EngineAI — https://www.engineai.com.cn/product-pm01.html — 2026-07-17
- EngineAI official purchase page — EngineAI — https://www.engineai.com.cn/product-purchase.html — 2026-07-17
- SE01/PM01 official FAQ (2025-01-10) — EngineAI — https://www.engineai.com.cn/about-news-media/23.html — 2026-07-17
- 机器人交警，真的来了！ (2026-04-27) — 南京市建邺区人民政府 — https://www.njjy.gov.cn/jyyw/202604/t20260427_5830395.html — 2026-07-17
- Duolun Technology's Strategic Partner EngineAI Unveils T800 at CES 2026 (also confirms PM01 traffic-management deployment) — Duolun Technology — https://www.duoluntech.com/en/index.php/news/detail/285.html — 2026-07-17
- 众擎携手京东深业尝鲜... — 深圳市发展和改革委员会 — https://fgw.sz.gov.cn/ztzl/qtztzl/szscjmyjjfzzhfwpt/mqfc/myqyfzdt/content/post_12504986.html — 2026-07-17

---

## engineai-t800 (T800)

- **recordScope**: product-family (Basic / Development(Eco/Open-Source) / Pro / Max differ sharply in DoF, compute, price)
- **lifecycleStatus**: current
- **publicationRecommendation**: keep-published
- **Reasoning**: Product page lists all 4 editions with distinct prices; official news confirms sales launch (2025-12-08, from ¥180,000), a CES 2026 debut (confirmed via Duolun's own official site, 2026-01-08), and first-batch mass-production line-off (2026-05-22). No confirmed *customer-site* deployment yet, but that does not change current-product status.

### Spec status

| Key | Status | Value |
|---|---|---|
| mobility | found (family-common) | biped, "full-size high-dynamic universal robot" |
| heightCm | found (family-common) | 173 cm, all editions |
| weightKg | needs-review | 75–85 kg range, no per-edition breakdown given |
| speedMps | needs-review | "≥3 m/s" (floor, not exact) |
| dof | conflict | overview: 29 (excl. hand) / Basic&Dev: 25 / Pro: 43 / Max: 46 |
| payloadKg | not-published (whole-body); see loadRatings for hand-level figure | |
| runtimeMin | needs-review | "up to 4h" highlight vs. "4–5h" parameter table |
| batteryCapacityWh | needs-review | ternary: 71.4V/20Ah; solid-state (opt.): 74.8V/40Ah — voltage is full-charge voltage, not nominal; no Wh conversion |
| chargeTimeMin | conflict | ternary 2.5h / solid-state 3h |
| batterySystem | found (family-common) | quick-release smart battery; std. ternary lithium, optional solid-state |
| controlMethod | found (family-common) | handheld remote controller + AI path planning/obstacle avoidance |
| sdk | conflict | Basic: not supported / Development,Pro,Max: supported |
| computePlatform | conflict | Basic: Intel (+optional RK3588) / Dev,Pro,Max: AGX Orin 64G (optional Thor upgrade) |
| ipRating | not-published | |
| operatingTemperature | not-published | |
| safetyStandard | not-published | (only a generic legal-use warning, not a certification) |

### Load ratings
- single-arm, maximum, 5 kg — "单手7个自由度，负载能力达5kg" — Pro/Max editions only — product-t800.html

### Price (all 4 editions, manufacturer-public, CNY, tax status unknown)
- Basic: ¥180,000 / Development: ¥240,000 / Pro: ¥280,000 / Max: ¥360,000 — https://www.engineai.com.cn/product-t800.html

### Official use cases
- warehouse-picking — "物流仓储" — product-t800.html
- retail-room-service — "酒店服务" — product-t800.html
- customer-reception — "门店导购" — product-t800.html
- factory-assembly-support — "工厂协作" — product-t800.html
- facility-security-patrol — T800 named specifically as the flagship robot for the newly formed Jiangsu Qing'an public-security/traffic-management joint venture — about-news-media/53.html (caveat: JV-formation announcement, not yet a confirmed field deployment)

### Usage examples
- Jiangsu Qing'an Robot Co. joint venture (public-security/traffic robotics ecosystem) — classified **pilot** (JV formed 2026-03-18, announced 2026-04-10; T800 named as target robot, but no confirmed public-road operation found for T800 specifically — the robots actually confirmed operating on public roads are named PM01, a separate usage example under that robotId).
- EngineAI's own May 2026 "first T800 batch off the production line" article was reviewed and correctly **excluded** — it describes the manufacturer's own factory ramp-up, not a customer deployment.

### Conflicts / unresolved
- DoF, weight range, runtime, charge time, compute and SDK all vary by edition (see table).
- No primary source (government/customer) confirms T800 is yet operating at any customer site; only PM01 is confirmed on public roads.

### Evidence log
- T800 official product page — EngineAI — https://www.engineai.com.cn/product-t800.html — 2026-07-17
- T800 launch article (2025-12-08) — EngineAI — https://www.engineai.com.cn/about-news-media/41.html — 2026-07-17
- 众擎机器人×多伦科技｜'擎安机器人'落子南京建邺 (2026-04-10) — EngineAI — https://www.engineai.com.cn/about-news-media/53.html — 2026-07-17
- 首批T800正式下线 (2026-05-22) — EngineAI — https://www.engineai.com.cn/about-news-media/59.html — 2026-07-17
- Duolun Technology's Strategic Partner EngineAI Unveils T800 at CES 2026 — Duolun Technology — https://www.duoluntech.com/en/index.php/news/detail/285.html — 2026-07-17
- EngineAI official purchase page — EngineAI — https://www.engineai.com.cn/product-purchase.html — 2026-07-17

---

## engineai-sa01 (SA01)

- **recordScope**: specific-variant (current official pages present SA01 as one product; the 2024 "SA01 EDU" name appears to have been early-launch branding for the same line)
- **lifecycleStatus**: current
- **publicationRecommendation**: keep-published
- **Reasoning**: Live product page and purchase page (¥42,000) confirm SA01 is on sale today; 2024 delivery-scale reporting from EngineAI's own article supports an established, ongoing research/education market.

### Spec status

| Key | Status | Value |
|---|---|---|
| mobility | found | biped, "highly extensible platform," straight-knee gait |
| heightCm | needs-review | official "1350×250×350mm" (L×W×H) dimension order gives an implausible 350mm height, inconsistent with 400mm+400mm thigh/shank figures — not adopted |
| weightKg | found | ~40 kg |
| speedMps | found | ~1 m/s |
| dof | found | 12 total (6 per leg) |
| payloadKg | not-published (see loadRatings) | |
| runtimeMin | found | 120 min (~2h) |
| batteryCapacityWh | found | 0.819 kWh (819 Wh) — directly stated, no conversion needed |
| chargeTimeMin | not-published | |
| batterySystem | found | 54.6V lithium quick-release battery, 15Ah |
| controlMethod | found | user-defined/open-source software control; IMU-based balance |
| sdk | needs-review | "full-chain technology sharing," no named SDK package |
| computePlatform | not-published | |
| ipRating | not-published | |
| operatingTemperature | found | -20°C to 55°C |
| safetyStandard | not-published | |

### Load ratings
- manufacturer-wording, unspecified, 10 kg (representative lower bound of stated "~10–15kg" range; scope/rated-vs-maximum undefined) — product-sa01.html

### Price
- ¥42,000, manufacturer-public, CNY, tax status unknown, edition unspecified on current page — https://www.engineai.com.cn/product-purchase.html
- (Historical: 2024-07-29 launch price of "SA01 EDU" was ¥38,500 — not used as current price.)

### Official use cases
- research-development — "使个人开发者和科研人员都能以亲民的价格获得专业级双足机器人" — about-news-media/34.html
- research-prototype-dev — open-source design / user-defined customization — product-sa01.html

### Usage examples
- Individual developers/researchers (aggregate sales, no named institutions) — classified **research** — EngineAI's own 2024-12-04 article reports "orders in the hundreds within under two months" and "scaled delivery" to individual developers/researchers, plus a commitment to continued parts supply for existing research customers.

### Conflicts / unresolved
- Height dimension figure is internally inconsistent on the official page; not adopted.
- Current ¥42,000 price's edition/tax/warranty/Japan-sale conditions unconfirmed.
- 10–15kg load scope and rated-vs-maximum semantics undefined by the manufacturer.

### Evidence log
- SA01 official product page — EngineAI — https://www.engineai.com.cn/product-sa01.html — 2026-07-17
- EngineAI official purchase page — EngineAI — https://www.engineai.com.cn/product-purchase.html — 2026-07-17
- SA01 EDU research/delivery article (2024-12-04) — EngineAI — https://www.engineai.com.cn/about-news-media/34.html — 2026-07-17

---

## Batch-level notes

- All four robots' `lifecycleStatus` = **current** and `publicationRecommendation` = **keep-published**. This does not change the repo's existing recommendation (all four are already `publishStatus: published`), but it does **substantively expand the evidence base** versus DATA-R01: PM01 now has two confirmed real-world commercial deployments (Nanjing traffic-assist, Shenzhen JD.com retail store) sourced from government/partner official channels rather than being left as an unresolved gap.
- No lifecycleStatus or publicationRecommendation was changed to a *more restrictive* value than DATA-R01/current repo state for any of the 4 robots — the change is in the opposite direction (more evidence confirmed as usable), consistent with the batch's stated fix for DATA-R01's over-caution.
- All 4 robots remain priced with edition/tax ambiguity on their current official purchase-page listings (PM01 ¥188,000; SA01 ¥42,000) — recorded as `found` priceOffers with the ambiguity noted in `conflicts`, rather than suppressed, since the price is directly stated on the live official page today.
