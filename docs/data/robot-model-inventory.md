# ロボットモデル・インベントリ

> **目的**: 17社が持つ全モデルを網羅的に列挙し、DBへの掲載可否を判断するための中間文書。  
> **スコープ**: 二足歩行・腕2本のヒューマノイドのみ（車輪式・脚のみは別途判断）  
> **更新**: 2026-05-30  
> **凡例 — DB列**: ✅ 掲載済 | ➕ 追加候補 | ⏸ 保留 | ❌ スコープ外

---

## 1. Unitree Robotics（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| H1 | 2023 | production | 180cm | 47kg | 初のフルサイズ。脚のみ→後に腕追加 | ✅ `unitree-h1` |
| H1-2 | 2023 | production | 180cm | ~47kg | H1 に7-DOF腕を追加した派生 | ⏸ H1と同slugで対応 |
| G1 | 2024 | production | 127cm | 35kg | コンパクト・低価格（$21,600〜）23〜43DOF | ✅ `unitree-g1` |
| H2 | 2025 | production | ~180cm | ~55kg | 31DOF・$30K・産業向け | ✅ `unitree-h2` |
| **R1 / R1 Air** | 2026 | production | 121cm | 25kg | **最安$4,900。軽量・アクロバット対応** | ➕ `unitree-r1` |

---

## 2. Figure AI（米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Figure 01 | 2023 | discontinued | 168cm | 60kg | 最初のプロト。外部ケーブル。概念実証 | ⏸ discontinued として追加検討 |
| Figure 02 | 2024 | limited-prod | ~168cm | ~70kg | 35DOF・16DOF手・VLAモデル搭載 | ✅ `figure-02` |
| **Figure 03** | 2025 | production | ~168cm | ~70kg | **量産設計・手カメラ・3g触覚** | ✅ `figure-03` |

---

## 3. Apptronik（米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Astra | 2020 | discontinued | — | — | 上半身のみ研究機。二足ではない | ❌ スコープ外 |
| **Apollo** | 2023 | production | 173cm | 72.6kg | **ホットスワップ電池・25kgペイロード・NASA系譜** | ✅ `apptronik-apollo`（要確認） |
| Apollo 2nd gen | 2025–26 | pilot | 173cm | ~70kg | ハードウェア更新版。正式リネームなし | ⏸ Apolloと同slug |

---

## 4. Agility Robotics（米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Cassie | 2017 | discontinued | ~94cm | ~31kg | 脚のみ。腕なし | ❌ スコープ外 |
| Digit v1 | 2017 | discontinued | 175cm | 65kg | 胴体追加。単足静止バランス不可 | ❌ 旧すぎ |
| Digit v2 | 2019 | discontinued | 175cm | 65kg | 初の腕搭載・初商用販売2020 | ⏸ 歴史的追加検討 |
| Digit v3 | 2021 | discontinued | 175cm | 65kg | 規制・バグ修正が主 | ❌ 省略可 |
| **Digit v4** | 2023 | production | 175cm | 65kg | **人間中心設計・トート最適化・Amazon/GXO実績** | ✅ `agility-digit`（要確認） |

---

## 5. 1X Technologies / ONX（ノルウェー/米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| EVE | 2022 | production | 188cm | 87kg | 車輪式。産業・警備用途 | ❌ 車輪式 |
| NEO Beta | 2024 | prototype | 163cm | 30kg | 初の脚式NEO。内部・アーリーアダプター向け | ❌ 旧プロト |
| NEO Gamma | 2025 | pilot | 163cm | 30kg | デザイン更新版プレプロダクション | ❌ 省略可 |
| **NEO（商用）** | 2025 | production | 163cm | 30kg | **$20K/$499/mo・ホーム向け・2026出荷** | ✅ `1x-neo`（要確認） |

---

## 6. Boston Dynamics（米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Atlas v1 (DARPA) | 2013 | discontinued | 183cm | 150kg | 油圧テザー付きプロト | ❌ 旧すぎ |
| Atlas HD (v2) | 2016 | discontinued | 175cm | 82kg | 無線油圧・バック転・2024年4月引退 | ⏸ 歴史的に有名。追加検討 |
| **Atlas Electric** | 2024 | production | 150cm | 89kg | **56DOF・電気式・50kgリフト・Hyundai展開** | ✅ `boston-dynamics-atlas` |

---

## 7. Tesla（米国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Optimus Gen 1 "Bumblebee" | 2022 | discontinued | 173cm | 73kg | 初歩行プロト。AI Day 2発表 | ⏸ 歴史的追加検討 |
| **Optimus Gen 2** | 2023 | production | 180cm | 55kg | **11DOF触覚手・30%高速・FSD派生AI** | ✅ `tesla-optimus` |

---

## 8. Sanctuary AI（カナダ）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Phoenix（全世代1〜8） | 2020〜 | pilot | 170cm | 70kg | 単一プロダクト名で継続進化。Gen8が現行 | ✅ `sanctuary-phoenix` |

---

## 9. Agibot / 智元机器人（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| RAISE A1 | 2023 | discontinued | 175cm | 53kg | 初号機。49DOF・80kgペイロード | ⏸ A1として追加検討 |
| **A2** | 2024 | production | 175cm | 55kg | **40+DOF・19DOF手・106km歩行ギネス** | ✅ `agibot-a2` |
| **A2-Max** | 2024 | production | 175cm | 85kg | **67DOF・40kgペイロード・重作業向け** | ➕ `agibot-a2-max` |
| A2-W | 2024 | production | 175cm | ~55kg | A2の車輪バリアント | ❌ 車輪式 |
| Lingxi X1 | 2024 | pilot | 130cm | 34kg | コンパクト・OSS公開 | ⏸ 追加検討 |
| **Lingxi X2** | 2025 | production | 130cm | 33.8kg | **28DOF・自転車乗車可・量産中** | ➕ `agibot-x2` |
| G2 | 2025 | production | ~180cm | 185kg | 車輪産業型 | ❌ 車輪式 |

---

## 10. UBTECH Robotics（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Walker 1.0 | 2018 | discontinued | 145cm | 77kg | CES 2018初公開。36DOF | ❌ 旧すぎ |
| Walker 2.0 | 2019 | discontinued | 145cm | 77kg | 腕・手追加。CES 2019 | ❌ 旧すぎ |
| Walker X | 2021 | limited-prod | 145cm | ~65kg | 研究向け。41サーボ・7DOF腕 | ⏸ 研究機として追加検討 |
| Walker C | 2023 | production | 163cm | 43kg | サービス・受付向け。20DOF | ⏸ サービス用途で追加検討 |
| Walker S | 2023 | production | 163cm | 43kg | 産業パイロット（Zeekr/NIO/BYD工場） | ❌ S1に置換 |
| **Walker S1** | 2024 | production | 163cm | 43kg | **41DOF・マルチタスク産業** | ➕ `ubtech-walker-s1` |
| **Walker S2** | 2025 | production | 162〜176cm | ~55kg | **52DOF・自律3分電池交換・量産中** | ✅ `ubtech-walker-s2` |

---

## 11. Fourier Intelligence（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| GR-1 | 2023 | discontinued | 165cm | 55kg | 初号機。40DOF・50kgキャリー。終了済み | ➕ `fourier-gr1`（discontinued） |
| GR-2 | 2024 | limited-prod | 175cm | ~70kg | 53DOF・12DOF手・380N·m | ✅ `fourier-gr2` |
| **GR-3** | 2025 | production | 165cm | 71kg | **55DOF・Care-Bot・$27.5K・CES 2026** | ✅ `fourier-gr3` |

---

## 12. Booster Robotics（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| **T1** | 2024 | production | 118cm | 30kg | **$33,949・RoboCup 2025優勝・国内代理店あり** | ✅ `booster-t1` |
| **K1** | 2025 | production | 95cm | 19.5kg | **$12,500・22DOF・教育/競技向け** | ➕ `booster-k1` |

---

## 13. 川崎重工業（日本）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Kaleido 1〜6 | 2017〜2021 | discontinued | ~180cm | ~80kg | 社内R&D反復。iREX 2017初公開 | ❌ 旧すぎ |
| Kaleido 7 / RHP7 | 2022 | prototype | 180cm | 80kg | iREX 2022・バッテリー自律歩行 | ❌ 省略可 |
| Kaleido 8 | 2023 | prototype | 180cm | ~80kg | 直接駆動モーター採用 | ❌ 省略可 |
| **Kaleido 9** | 2025 | prototype | 190cm | 99kg | **最大世代・LiDAR・iREX 2025** | ✅ `kawasaki-kaleido` |
| RHP Friends | 2021〜 | prototype | ~160cm | — | ホーム・ケア向けソフト外観 | ⏸ 追加検討 |

---

## 14. NEURA Robotics（ドイツ）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| 4NE-1（初期世代） | 2022〜23 | prototype | 180cm | 80kg | 欧州初のコグニティブ機。Porscheデザイン前 | ⏸ 同slugで対応 |
| **4NE-1 Gen 3.5** | 2025 | production | 180cm | 80kg | **€98K・デュアル電池・100kgリフト** | ✅ `neura-4ne-1` |
| **4NE-1 Mini** | 2026 | announced | ~150cm | — | **€19,999・Spring 2026・研究/教育向け** | ➕ `neura-4ne1-mini` |
| MiPA | 2025 | announced | — | — | 家庭用・€9,999 | ❌ 家庭向け（スコープ外検討） |

---

## 15. Kepler Robotics（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Forerunner K1 | 2023 | discontinued | 178cm | 85kg | 初号機。40DOF・25kgペイロード | ⏸ 追加検討 |
| **Forerunner K2** | 2024 | production | 178cm | 85kg | **52DOF・量産2025年9月・SAIC-GM導入** | ✅ `kepler-k2` |
| K2 "Hornet" | 2025 | production | 178cm | 85kg | K2のハンド構成違いバリアント | ⏸ K2と同slug検討 |

---

## 16. Leju Robotics（中国）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| Kuavo 1.0 / Kuafu | 2023 | discontinued | ~175cm | ~45kg | 初号機。HarmonyOSベース | ❌ 省略可 |
| **Kuavo 3.0** | 2024 | production | ~175cm | 45kg | **26DOF・360N·m・4.6km/h** | ✅ `leju-kuavo` |
| **Kuavo-MY** | 2024〜25 | production | ~175cm | 45kg | **サービス向けバリアント** | ➕ `leju-kuavo-my` |
| **Kuavo 5** | 2025 | production | ~175cm | ~45kg | **脚/車輪切替可・中国国体2025聖火** | ➕ `leju-kuavo-5` |

---

## 17. PAL Robotics（スペイン）

| モデル | 年 | ステータス | 身長 | 体重 | 特徴 | DB |
|---|---|---|---|---|---|---|
| REEM-A | 2005 | discontinued | ~150cm | — | 欧州初の二足。チェス・顔認識 | ❌ 旧すぎ |
| REEM-B | 2008 | discontinued | ~160cm | ~80kg | 当時最強の二足 | ❌ 旧すぎ |
| REEM-C | 2013 | limited-prod | 170cm | — | 22DOF・階段昇降。研究機 | ⏸ 追加検討 |
| **TALOS** | 2017 | production | 175cm | 95kg | **32DOF全関節トルクセンサ・研究最高峰** | ✅ `pal-talos` |
| **Kangaroo** | 2023〜24 | production | 160cm | 35〜40kg | **軽量28DOF・RL対応・商用販売中** | ➕ `pal-kangaroo` |

---

## 掲載優先度まとめ

### A: 現行販売中・実績あり（すぐ追加）

| slug候補 | メーカー | モデル | 理由 |
|---|---|---|---|
| `unitree-r1` | Unitree | R1 Air | $4,900・最安量産機・2026出荷 |
| `agility-digit` | Agility | Digit v4 | Amazon/GXO実績・DB確認要 |
| `apptronik-apollo` | Apptronik | Apollo | NASA系譜・量産中・DB確認要 |
| `1x-neo` | 1X | NEO | $20K・ホーム向け・DB確認要 |
| `agibot-a2-max` | Agibot | A2-Max | 67DOF・40kg重作業 |
| `ubtech-walker-s1` | UBTECH | Walker S1 | S2の前世代・現役販売 |
| `booster-k1` | Booster | K1 | $12,500・教育向け |
| `pal-kangaroo` | PAL | Kangaroo | 軽量・商用販売中 |

### B: 追加価値あり・判断が必要

| slug候補 | モデル | 判断ポイント |
|---|---|---|
| `fourier-gr1` | Fourier GR-1 | discontinued だが歴史的に重要 |
| `agibot-x2` | Lingxi X2 | コンパクト・量産中だが130cm |
| `neura-4ne1-mini` | 4NE-1 Mini | 2026出荷予定・未発売 |
| `leju-kuavo-5` | Kuavo 5 | Kuavo-3と同サイズ感 |
| `kepler-k1` | Forerunner K1 | discontinued |

### C: 保留（スコープ外・旧すぎ・情報不足）

- 車輪式: EVE, A2-W, G2
- 旧プロト: Atlas v1, Optimus Gen 1, Digit v1〜v3
- 家庭/研究のみ: MiPA, RHP Friends, REEM系
- ほぼ同機: H1-2, Apollo 2nd gen, Kaleido 7/8

---

## 実際のDB全slug（2026-05-30確認）

```
unitree-g1 / figure-02 / unitree-h1 / apptronik-apollo / agility-digit /
onex-neo / figure-03 / unitree-h2 / boston-dynamics-atlas / tesla-optimus /
sanctuary-phoenix / agibot-a2 / ubtech-walker-s2 / fourier-gr2 / fourier-gr3 /
booster-t1 / kawasaki-kaleido / neura-4ne-1 / kepler-k2 / leju-kuavo / pal-talos
```
合計 **21機種**。

→ Apptronik Apollo（`apptronik-apollo`）、Agility Digit（`agility-digit`）、
　1X NEO（`onex-neo`）は**確認済みで掲載済み**。
→ 優先度Aの「DB確認要」3件は全てスキップ可。

## 次に追加すべきもの（優先度A・未掲載のみ）

| slug候補 | モデル | 根拠 |
|---|---|---|
| `unitree-r1` | Unitree R1 Air | $4,900・最安量産機・2026出荷中 |
| `agibot-a2-max` | Agibot A2-Max | 67DOF・40kg重作業・現行販売 |
| `ubtech-walker-s1` | UBTECH Walker S1 | S2の前世代・現役販売中 |
| `booster-k1` | Booster K1 | $12,500・教育/競技向け・国内代理店確認要 |
| `pal-kangaroo` | PAL Kangaroo | 軽量28DOF・商用販売中 |
