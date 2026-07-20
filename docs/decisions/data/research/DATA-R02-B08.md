# DATA-R02 Batch B08 — Leju Robotics / PAL Robotics / LimX Dynamics

Re-verification pass, checked 2026-07-17. Covers: `leju-kuavo`, `leju-kuavo5`, `pal-talos`, `pal-kangaroo`, `limx-oli`, `limx-luna`.

All values below were re-opened from primary sources this session (WebFetch/WebSearch), not copied from DATA-R01 conclusions. DATA-R01/DATA-R02-source-plan were used only to discover candidate URLs.

---

## 1. leju-kuavo — KUAVO 4Pro Standard

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** specific-variant (Standard, one of Standard/Advanced/MaxA/MaxB/Showroom configurations)
- **Reasoning:** Still listed as a current product on Leju's EN and ZH sites in 2026, with a dedicated official manual for the Standard configuration. KUAVO 5/5-W is a newer, parallel line, not an explicit replacement — no discontinuation statement for 4Pro anywhere official.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 166 |
| weightKg | found | 55 |
| speedMps | found | 0.4 (walking; 5km/h running also stated) |
| dof | found | 22 (excl. end-effector) |
| payloadKg | not-published | — |
| runtimeMin | found | 60 |
| batteryCapacityWh | not-published | only V×Ah given, no Wh stated |
| chargeTimeMin | found | 90 (≤1.5h) |
| batterySystem | found | 60V 6Ah swappable, ≥500 cycles |
| controlMethod | found | H12 remote + ROS topic/service API |
| sdk | found | kuavo_sdk (ROS1, Python3) |
| computePlatform | found | i9-13900H + Orin NX |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### Key notes
- No usage examples confirmed to primary-source standard this session (third-party mention of a "100th unit to BAIC Off-Road" delivery was not independently opened — recorded as unresolved, not adopted).
- officialUseCases: research-development (SDK/manual framing).
- priceFallback: inquiry-fallback (Leju's own Tmall store is login-gated, source-inaccessible for price).

### Evidence log
- KUAVO 4Pro Standard official manual — Leju Robotics — https://kuavo.lejurobot.com/manual/.../KUAVO_4PRO... — checked 2026-07-17
- KUAVO SDK documentation — Leju Robotics — https://kuavo.lejurobot.com/manual/.../SDK.../ — checked 2026-07-17
- Leju official site (EN/ZH) — https://www.lejurobot.com/en, /zh — checked 2026-07-17
- Leju official Tmall store (login-gated) — http://lejuznsb.world.tmall.com/... — checked 2026-07-17

---

## 2. leju-kuavo5 — KUAVO 5 Advanced

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** specific-variant (Advanced bipedal form; 5-W wheeled variant excluded)
- **Reasoning:** KUAVO 5/5-W is Leju's newest marketed generation ("更懂工业" — newly upgraded for industry), documented with its own manual. Presented alongside 4Pro, not stated to replace it.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 173 |
| weightKg | found | 63.5 |
| speedMps | found | 0.4 (walking; 5km/h running) |
| dof | found | 29 (head2+arm7×2+leg6×2+waist1) |
| payloadKg | not-published | — |
| runtimeMin | found | 60 |
| batteryCapacityWh | not-published | — |
| chargeTimeMin | found | 90 |
| batterySystem | found | 60V 6Ah swappable |
| controlMethod | found | H12 remote + ROS API (shared w/ 4Pro) |
| sdk | found | kuavo_sdk (shared w/ 4Pro) |
| computePlatform | found | GENE-MTH6 (Core Ultra 7) + Orin-NX |
| ipRating | not-published | — |
| operatingTemperature | needs-review | only camera(-10~50°C)/LiDAR(-20~55°C) component ranges, not whole-robot |
| safetyStandard | not-published | — |

### Key notes
- officialUseCases: research-development ("研究/教育" explicitly listed on the KUAVO 5 product page).
- useCaseGaps logged: industrial manufacturing, outdoor inspection, commercial guidance, home service — all explicitly stated on the official KUAVO 5 page but with no confident existing UseCase id match.
- priceFallback: inquiry-fallback.

### Evidence log
- KUAVO 5 Advanced official manual — Leju Robotics — https://kuavo.lejurobot.com/manual/.../KUAVO_5.../ — checked 2026-07-17
- KUAVO 5/5-W official product page — https://www.lejurobot.com/zh/products/kuavo-5 — checked 2026-07-17
- Leju official site (ZH) — https://www.lejurobot.com/zh — checked 2026-07-17

---

## 3. pal-talos — TALOS

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** specific-variant (single product; head/gripper customizable)
- **Reasoning:** Confirmed on PAL's current official product index (pal-robotics.com/robots/) with active product page + datasheet + quote CTA. PAL's own KANGAROO blog frames KANGAROO as building on "previous humanoid platforms like REEM-C and TALOS," but no explicit TALOS discontinuation/successor statement exists — kept current, successorRobot: null.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 175 |
| weightKg | found | 95 |
| speedMps | not-published | — |
| dof | found | 32 |
| payloadKg | not-published | (see loadRatings: single-arm 6kg) |
| runtimeMin | found | 90 (1.5h walking / 3h standby) |
| batteryCapacityWh | found | 1080 Wh Li-Ion |
| chargeTimeMin | not-published | — |
| batterySystem | found | Li-Ion, 1080Wh, max discharge +100A |
| controlMethod | found | full torque control, EtherCAT, ros_control 2-5kHz |
| sdk | found | ROS/OROCOS/ros_control/MoveIt!/Gazebo |
| computePlatform | found | Intel i7×2, Ubuntu LTS + RT Preempt |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### Key notes
- Two usage examples confirmed directly from PAL's own current blog: (1) LAAS-CNRS/TOWARD/Dynamograde generalized-locomotion research (classification: research); (2) MEMMO EU consortium (CNRS, Idiap, Edinburgh, Max Planck, Oxford, Airbus, Wandercraft, Costain, PAL) — a specific LAAS-CNRS TALOS unit ("Pyrène") tested at an Airbus facility (classification: research). Both are presented on PAL's current site as TALOS's own capability demonstrations.
- officialUseCases: research-development ("Advanced humanoid designed for research applications").
- priceFallback: inquiry-fallback.

### Evidence log
- Our Robots (index) — PAL Robotics — https://pal-robotics.com/robots/ — checked 2026-07-17
- TALOS product page — PAL Robotics — https://pal-robotics.com/robot/talos/ — checked 2026-07-17
- TALOS official datasheet — PAL Robotics — https://pal-robotics.com/datasheet/talos/ — checked 2026-07-17
- TALOS torque-control locomotion research blog — PAL Robotics — checked 2026-07-17
- MEMMO project blog — PAL Robotics — checked 2026-07-17

---

## 4. pal-kangaroo — KANGAROO

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** product-family (4/5/7-DoF arm configurations are distinguishable rows on the official datasheet — this is not an unresolvable ambiguity, correcting DATA-R01's over-caution)
- **Reasoning:** Confirmed current on PAL's official index and product/datasheet pages. A "Kangaroo PRO" dual-arm variant surfaced in third-party press (Automatica 2025) but was not found as a distinct row on the official pages opened this session — not registered separately; flagged for follow-up.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | **conflict** | 158cm (product page "1,58 m") vs. 160cm (datasheet PDF) |
| weightKg | needs-review | only a 50-65kg family range given, no per-config number |
| speedMps | found | 2 m/s |
| dof | needs-review | 14-40 DoF depending on arm/hand choice, no single scalar |
| payloadKg | not-published | (see loadRatings, 6 rows by arm config) |
| runtimeMin | found | 180 (3h) |
| batteryCapacityWh | source-inaccessible | datasheet PDF text-extraction garbled ("976 Ah", implausible) |
| chargeTimeMin | not-published | — |
| batterySystem | not-published | — |
| controlMethod | found | ros2_control, multiple actuator modes (VR-teleop claim in old repo NOT reconfirmed) |
| sdk | found | ROS2 LTS/PAL OS/ros2_control/URDF+MJCF/MuJoCo |
| computePlatform | found | dual i7 PCs, optional Jetson GPU |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | found | IEC 61508 SIL2, EN ISO 13849-1 PL d |

loadRatings (all reconfirmed unchanged vs. repo, via datasheet): 4-DoF arms 7kg/30kg, 5-DoF arms 5kg/28kg, 7-DoF arms 3kg/25kg (single/dual-arm).

### Key notes
- **Conflict:** heightCm 158 vs 160cm across two official PAL documents (product page vs. datasheet).
- **Needs-review:** weightKg and dof are genuinely configuration-dependent ranges on official material, not omissions — correctly split as needs-review rather than forced into a single false-precision number or blanket rejection.
- officialUseCases: research-development ("must for your research on dynamic locomotion, RL, embodied AI").
- Usage example: PAL's own ICRA 2022 whole-body inverse-dynamics jumping demo (internal R&D, classification: research).
- humanReviewRequired: confirm whether "Kangaroo PRO" needs its own catalog record.
- priceFallback: inquiry-fallback.

### Evidence log
- Our Robots (index) — PAL Robotics — https://pal-robotics.com/robots/ — checked 2026-07-17
- KANGAROO product page — PAL Robotics — https://pal-robotics.com/robot/kangaroo/ — checked 2026-07-17
- KANGAROO official datasheet — PAL Robotics — https://pal-robotics.com/datasheet/kangaroo/ — checked 2026-07-17
- Kangaroo research platform updates blog — PAL Robotics — checked 2026-07-17

---

## 5. limx-oli — Oli EDU

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** specific-variant (EDU column of Lite/EDU/Super/Pro spec table)
- **Reasoning:** Oli is LimX's current general-purpose humanoid line. **Important correction:** the current official spec-comparison table places EDU at 31 DoF / ~2h battery life, while the existing repo record's dof=33 / runtimeMin=90 actually match the table's **Super** column, not EDU. Confirmed via two independent fetches of the same live spec page. This needs a data correction, not further research.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 165cm |
| weightKg | found | ≤55kg (upper-bound figure) |
| speedMps | found | 5km/h → 1.3889 m/s |
| dof | **conflict** | current table: EDU=31 (repo's 33 matches Super, not EDU) |
| payloadKg | not-published | (see loadRatings: single-arm max 3kg) |
| runtimeMin | **conflict** | current table: EDU≈2h/120min (repo's 90min matches Super/Pro's ~1.5h) |
| batteryCapacityWh | not-published | only mAh given |
| chargeTimeMin | not-published | only charger V/A given |
| batterySystem | found | 9,500mAh swappable, 58.8V/10A charger |
| controlMethod | found | bilingual voice interaction, remote, motion APIs |
| sdk | found | modular SDK, full Python, Isaac Sim/MuJoCo/Gazebo |
| computePlatform | **conflict** | current table shows EDU Perception = "–" (no standard Orin NX); repo attributes Orin NX 157TOPS to EDU, which matches Super/Pro instead |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### Key notes
- officialUseCases: research-development + demo-exhibition (both explicitly listed on the official product page: "Scientific Research & Development", "Exhibition & Event Guidance").
- useCaseGaps: Entertainment & Performance, Equipment Inspection, Industrial Operations, Property Management (all explicitly stated, no confident existing UseCase match).
- **humanReviewRequired:** resolve the EDU-vs-Super column mismatch on dof/runtimeMin/computePlatform before next publish — this is the single most important finding in this batch.
- priceFallback: inquiry-fallback.

### Evidence log
- LimX Dynamics official site — https://www.limxdynamics.com/ — checked 2026-07-17
- LimX Oli product page — https://www.limxdynamics.com/en/products/oli — checked 2026-07-17
- LimX Oli official specifications (fetched twice for verification) — https://www.limxdynamics.com/en/products/oli/spec — checked 2026-07-17
- LimX order/consultation page — https://limxdynamics.com/en/order — checked 2026-07-17

---

## 6. limx-luna — Luna

- **lifecycleStatus:** current
- **publicationRecommendation:** keep-published
- **recordScope:** specific-variant (spec table shows two nearly-identical configuration columns, not distinctly named)
- **Reasoning:** Formally (re)announced May 26, 2026 as "All-New Full-Size Humanoid Robot Luna" with active product/spec pages.

### Spec status
| Spec | Status | Value |
|---|---|---|
| mobility | found | biped |
| heightCm | found | 160cm |
| weightKg | found | 56kg (with battery) |
| speedMps | found | 5km/h → 1.3889 m/s |
| dof | found | 27 (legs6×2+arms5×2+waist3+neck2) |
| payloadKg | not-published | (see loadRatings: single-arm max 3kg) |
| runtimeMin | found | 240 (≈4h) |
| batteryCapacityWh | not-published | only mAh given |
| chargeTimeMin | found | 60 (≈1h) |
| batterySystem | found | 10,000mAh dual modules, 110-220V input |
| controlMethod | found | remote/tablet/LimX Studio (video-to-motion, kinesthetic teaching, AI task editor) |
| sdk | not-published | no developer SDK/API stated (LimX Studio is a content tool, not a dev SDK) |
| computePlatform | found | dual RK3588 (motion 16GB/256GB; perception 8GB/32GB) |
| ipRating | not-published | — |
| operatingTemperature | not-published | — |
| safetyStandard | not-published | — |

### Key notes
- officialUseCases: demo-exhibition (theme parks/live stages + swarm/choreography) and customer-reception (shopping malls/museums + multimodal dialogue) — both explicitly stated on the current official product page.
- No usage examples found (BK000062 news item confirmed to be a general launch announcement, not a customer/venue deployment case).
- priceFallback: inquiry-fallback.

### Evidence log
- LimX Dynamics official site — https://www.limxdynamics.com/ — checked 2026-07-17
- LimX Luna product page — https://www.limxdynamics.com/en/products/luna — checked 2026-07-17
- LimX Luna official specifications — https://www.limxdynamics.com/en/products/luna/spec — checked 2026-07-17
- Luna launch announcement (BK000062) — https://www.limxdynamics.com/en/news/BK000062 — checked 2026-07-17, confirmed general announcement not a deployment case

---

## Cross-cutting findings

1. **Most important correction (limx-oli):** the registered "Oli EDU" spec values for dof/runtimeMin/computePlatform actually match the official spec table's "Super" column, not "EDU". Needs a data-correction pass.
2. **pal-kangaroo:** confirmed the 4/5/7-DoF arm configurations are legitimately distinguishable variants (not an unresolvable conflict) — loadRatings kept as-is. heightCm has a genuine minor conflict between product page (158cm) and datasheet (160cm).
3. Both Leju robots and both PAL robots remain **current**, not superseded — no manufacturer discontinuation statements were found for KUAVO 4Pro or TALOS despite newer siblings (KUAVO 5, KANGAROO) existing.
4. No manufacturer-public price was found for any of the 6 robots; all six get `priceFallback: inquiry-fallback`. Leju's Tmall flagship store could not be checked for price (login-gated).
5. "Kangaroo PRO" (dual-arm) surfaced only in third-party press about Automatica 2025; not confirmed as a distinct SKU on PAL's currently-open official pages — flagged for human review, not adopted as fact.
