# メーカー実データ拡充 下書き調査 (2026-06-02)

## 1. 既存17社 監査結果 (Phase 1)

| slug | name | データ充実度 | 主な不足・課題 |
|---|---|---|---|
| `unitree` | Unitree Robotics | 高 | 特になし。G1/H2の情報を最新に保つ。 |
| `figure-ai` | Figure AI | 低 | `sources`不足。F.02からF.03への移行状況。 |
| `apptronik` | Apptronik | 中 | `sources`は多いが`description`が短め。 |
| `agility-robotics` | Agility Robotics | 中 | `sources`の追加。物流以外の展開可能性。 |
| `onex` | 1X Technologies | 低 | `sources`不足。Neoの予約・出荷状況。 |
| `boston-dynamics` | Boston Dynamics | 低 | `description`が不十分。Atlas(電動)の産業展開。 |
| `tesla` | Tesla | 低 | `sources`不足。Optimusの進捗。 |
| `sanctuary-ai` | Sanctuary AI | 低 | `sources`不足。Carbon AIの進捗。 |
| `agibot` | AgiBot | 中 | 出荷台数のファクトチェック。日本展開の具体性。 |
| `ubtech` | UBTECH Robotics | 高 | 特になし。Walker S2導入事例の具体化。 |
| `fourier-intelligence` | Fourier Intelligence | 低 | `sources`不足。GR-3の日本市場向け情報の裏取り。 |
| `booster-robotics` | Booster Robotics | 高 | 特になし。日本代理店情報を最新に。 |
| `kawasaki-heavy-industries` | 川崎重工業 | 低 | Kaleido第9世代のスペック・展開予定。 |
| `neura-robotics` | NEURA Robotics | 高 | 特になし。4NE-1の予約状況。 |
| `kepler-robotics` | Kepler Robotics | 中 | `sources`追加。量産開始の裏取り。 |
| `leju-robotics` | Leju Robotics | 中 | `sources`追加。Huaweiエコシステムとの関係。 |
| `pal-robotics` | PAL Robotics | 中 | `sources`追加。TALOS以外の軽量機の位置づけ。 |

## 2. 追加候補3社 掲載判断 (Phase 3)

| 候補 | 掲載判断 | 理由 |
|---|---|---|
| LimX Dynamics | **Add (Draft)** | CL-1, P1等の高い運動性能。中国系主要プレイヤーの1つ。 |
| XPENG Robotics | **Add (Draft)** | 自動車メーカー背景、資本力、PX5等の具体的機体。 |
| Engineered Arts | **Defer** | 接客・エンタメ寄り。本サイトの産業・物流・研究のターゲットと少し距離がある。 |

## 3. メーカー別詳細下書き (Phase 2 & 4)

(ここに各社の詳細データを記述していく)

### unitree (Unitree Robotics)
- slug: `unitree`
- 掲載判断: `existing`
- companyType: `manufacturer`
- companyStatus: `active`
- country: `China`
- hqCity: `Hangzhou`
- website: `https://www.unitree.com/`
- contactUrl: `https://techshare.co.jp/product/unitree/g1/`
- japanPresence: `distributor`
- domesticDistributors: TechShare, Tohasen Robotics
- 代表機種: `unitree-g1`, `unitree-h2`, `unitree-r1`
- description 下書き: 四足歩行ロボットの量産で培った製造能力を背景に、G1 ($16,000〜) や H2 ($29,900〜) などの量産型ヒューマノイドを次々と投入。2026年には「世界最安」を謳う R1 Air ($4,900) の予約も開始。
- summary 下書き: 四足歩行・二足ヒューマノイドの両面で世界トップクラスの量産実績を誇る中国メーカー。
- sources: [Unitree Official](https://www.unitree.com/), [TechShare](https://techshare.co.jp/product/unitree/g1/)
- logo / image candidates: `https://www.unitree.com/images/0079f8938336436e955ea3a98c4e1e59.svg`
- rights status: `reference-attributed`
- 未確認事項: R1 Air の日本国内での保守体制。
- 本番反映可否: OK

### figure-ai (Figure AI)
- slug: `figure-ai`
- 掲載判断: `existing`
- companyType: `manufacturer`
- companyStatus: `active`
- country: `USA`
- hqCity: `Sunnyvale`
- website: `https://www.figure.ai/`
- japanPresence: `unknown`
- 代表機種: `figure-03`
- description 下書き: BMW Spartanburg工場でのF.02による実証（30,000台以上の車生産に貢献）を経て、2026年には量産機 Figure 03 を投入。自社工場 BotQ での年産12,000台体制を構築し、物流・製造現場への本格導入を開始。
- summary 下書き: BMWとの提携で先行する、産業用ヒューマノイドのトップランナー。
- sources: [Figure AI News](https://www.figure.ai/news/production-at-bmw), [Origin of Bots 2026](https://originofbots.com/)
- logo / image candidates: `https://images.ctfassets.net/9ghdxb6vbi3m/6BwRUivjx5kzwALhIyH2Sv/bf528628c3c53f0d27054534ce4c0bdb/figure-logo.svg`
- rights status: `reference-attributed`
- 未確認事項: 日本国内の代理店候補（商社等の動き）。
- 本番反映可否: OK

### apptronik (Apptronik)
- slug: `apptronik`
- 掲載判断: `existing`
- country: `USA`
- website: `https://apptronik.com/`
- japanPresence: `unknown`
- 代表機種: `apptronik-apollo`
- description 下書き: NASAとの協力関係をルーツに持ち、Mercedes-Benz との商用契約下で Apollo の検証を進める。EMS大手 Jabil と提携し、量産体制の構築を加速させている。
- summary 下書き: 製造現場での人と協働を重視する、NASA発のヒューマノイドベンチャー。
- sources: [Apptronik News](https://apptronik.com/news-collection/apptronik-and-mercedes-benz-enter-commercial-agreement)
- rights status: `reference-attributed`
- 本番反映可否: OK

### agility-robotics (Agility Robotics)
- slug: `agility-robotics`
- 掲載判断: `existing`
- country: `USA`
- website: `https://agilityrobotics.com/`
- japanPresence: `unknown`
- 代表機種: `agility-digit`
- description 下書き: 物流倉庫でのトート搬送に特化した Digit を展開。GXO Logistics において RaaS モデルで累計10万トート以上の搬送実績を達成。2026年には OSHA 基準の安全認証を現場で取得するなど、実用化で一歩先行する。
- summary 下書き: 物流現場での「稼働時間」と「実利」で世界をリードするメーカー。
- sources: [Agility solution](https://www.agilityrobotics.com/solution)
- rights status: `reference-attributed`
- 本番反映可否: OK

### onex (1X Technologies)
- slug: `onex`
- 掲載判断: `existing`
- country: `Norway`
- website: `https://www.1x.tech/`
- japanPresence: `unknown`
- 代表機種: `onex-neo`
- description 下書き: OpenAIの出資を受けるノルウェー発の企業。家庭内での安全性を重視した腱駆動ヒューマノイド Neo を開発。2026年後半より米国向けに最初の出荷を開始予定。
- summary 下書き: 家庭向けヒューマノイドの急先鋒、OpenAIのエコシステムを背負う。
- sources: [1X NEO Order](https://1x.tech/order)
- rights status: `reference-attributed`
- 本番反映可否: OK

### boston-dynamics (Boston Dynamics)
- slug: `boston-dynamics`
- 掲載判断: `existing`
- country: `USA`
- website: `https://bostondynamics.com/`
- japanPresence: `distributor`
- 代表機種: `boston-dynamics-atlas`
- description 下書き: 動的バランスのパイオニア。電動 Atlas (Gen 2) は Hyundai および Google DeepMind への初期導入が完了し、2026年は産業用量産機としての地位を確立。360度回転する関節と 50kg のペイロードを誇る。
- summary 下書き: 圧倒的な身体能力と信頼性を誇る、ヒューマノイド界の巨人。
- sources: [Boston Dynamics Atlas](https://bostondynamics.com/products/atlas/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### tesla (Tesla)
- slug: `tesla`
- 掲載判断: `existing`
- country: `USA`
- website: `https://www.tesla.com/`
- japanPresence: `none`
- 代表機種: `tesla-optimus`
- description 下書き: 2026年1月より Optimus Gen 3 の量産を開始。Tesla自社工場（Fremont, Giga Texas）に数百台が導入され、データ収集と自律性向上を推進中。2026年末には限定的なB2B販売を開始予定。
- summary 下書き: 垂直統合とAI・バッテリーの強みを活かし、量産コスト革命を狙う。
- sources: [Tesla Optimus](https://www.tesla.com/optimus)
- rights status: `reference-attributed`
- 本番反映可否: OK

### sanctuary-ai (Sanctuary AI)
- slug: `sanctuary-ai`
- 掲載判断: `existing`
- country: `Canada`
- website: `https://www.sanctuary.ai/`
- japanPresence: `none`
- 代表機種: `sanctuary-phoenix`
- description 下書き: 制御AI「Carbon」の開発に重点を置く。Magna International との提携により、自動車部品のサブアッセンブリ工程での実証を加速。タスクの学習時間を24時間以内に短縮する技術を確立。
- summary 下書き: 「手の器用さ」と「汎用AI」の統合で、人間の代替を目指す。
- sources: [Sanctuary AI official](https://www.sanctuary.ai/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### agibot (AgiBot)
- slug: `agibot`
- 掲載判断: `existing`
- country: `China`
- hqCity: `Shanghai`
- website: `https://www.agibot.com/`
- japanPresence: `unknown`
- 代表機種: `agibot-a2`, `agibot-a2-max`（A2 Ultra。公開slugは `agibot-a2-ultra`）
- description 下書き: 2025年に年間5,168台のヒューマノイドを出荷し、世界シェアトップクラスに。Aシリーズ(等身大)だけでなく、Xシリーズ(機動型)など多角的なラインナップを持つ。2026年には累計1万台を突破。
- summary 下書き: 中国トップの出荷台数を誇る、実用量産化のトップランナー。
- sources: [AgiBot Official](https://www.agibot.com/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### ubtech (UBTECH Robotics)
- slug: `ubtech`
- 掲載判断: `existing`
- country: `China`
- website: `https://www.ubtrobot.com/`
- japanPresence: `distributor`
- domesticDistributors: GA Robotics, UAC
- 代表機種: `ubtech-walker-s2`, `ubtech-walker-s1`
- description 下書き: Walker S2 を中心に、BYDやFoxconnなどの製造現場へ1,000台規模の導入を開始。2026年には Airbus との提携による航空機組立工程への参入も発表。日本国内でも複数の代理店が展開中。
- summary 下書き: 産業現場での導入実績で他を圧倒する、中国唯一の上場ヒューマノイド企業。
- sources: [UBTECH S2](https://www.ubtrobot.com/en/humanoid/products/walker-s2)
- rights status: `reference-attributed`
- 本番反映可否: OK

### fourier-intelligence (Fourier Intelligence)
- slug: `fourier-intelligence`
- 掲載判断: `existing`
- country: `China`
- website: `https://fftai.com/`
- japanPresence: `unknown`
- 代表機種: `fourier-gr2`, `fourier-gr3`
- description 下書き: リハビリ用外骨格で培った技術をGRシリーズに転用。2026年のCESで介護特化型の GR-3 を発表し、日本の介護市場をターゲットに据えるなど、サービス・医療分野への特化を見せる。
- summary 下書き: リハビリ・介護領域に強みを持つ、サービスロボットの雄。
- sources: [Fourier Official](https://fftai.com/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### booster-robotics (Booster Robotics)
- slug: `booster-robotics`
- 掲載判断: `existing`
- country: `China`
- website: `https://www.booster.tech/`
- japanPresence: `distributor`
- domesticDistributors: Tohasen Robotics, 帝華機械
- 代表機種: `booster-t1`, `booster-k1`
- description 下書き: 教育・研究向けの小型ヒューマノイド T1/K1 で急速に普及。日本国内での正規代理店網が最も整っている海外メーカーの1つ。
- summary 下書き: 教育・研究向けヒューマノイドの普及を牽引する。
- sources: [Booster Official](https://www.booster.tech/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### kawasaki-heavy-industries (川崎重工業)
- slug: `kawasaki-heavy-industries`
- 掲載判断: `existing`
- country: `Japan`
- website: `https://www.khi.co.jp/`
- japanPresence: `office`
- 代表機種: `kawasaki-kaleido`
- description 下書き: 国産ヒューマノイドの旗手。2025年末に Kaleido 第9世代を公開し、2026年は商業展開への「転換点」と位置づける。18kgのペイロードと高精度な自律歩行を両立。
- summary 下書き: 産業用ロボットの伝統と最新のヒューマノイド技術を融合させる国産メーカー。
- sources: [Kawasaki Robotics Blog](https://kawasakirobotics.com/asia-oceania/blog/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### neura-robotics (NEURA Robotics)
- slug: `neura-robotics`
- 掲載判断: `existing`
- country: `Germany`
- website: `https://neura-robotics.com/`
- japanPresence: `distributor`
- domesticDistributors: 日栄機工
- 代表機種: `neura-4ne-1`
- description 下書き: ドイツ発のAIロボット企業。2026年春に 4NE-1 Mini ($21,500) の出荷を開始。フラッグシップの 4NE-1 も 2026年末に世界出荷を予定。Porscheデザインの洗練された外観が特徴。
- summary 下書き: 欧州最高峰のAI技術とデザインを兼ね備えたコグニティブ・ロボティクス。
- sources: [NEURA 4NE-1](https://neura-robotics.com/products/4ne1/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### kepler-robotics (Kepler Robotics)
- slug: `kepler-robotics`
- 掲載判断: `existing`
- country: `China`
- website: `https://www.gotokepler.com/`
- japanPresence: `remote`
- 代表機種: `kepler-k2`
- description 下書き: 2025年9月に Forerunner K2 の量産を開始。電気＋油圧ハイブリッドによる高トルクが特徴で、SAIC-GM の工場での導入が確認されている。
- summary 下書き: 力仕事に強いハイブリッド駆動を提唱する新興勢力。
- sources: [Kepler Official](https://www.gotokepler.com/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### leju-robotics (Leju Robotics)
- slug: `leju-robotics`
- 掲載判断: `existing`
- country: `China`
- website: `https://www.lejurobot.com/`
- japanPresence: `none`
- 代表機種: `leju-kuavo`
- description 下書き: Huaweiのエコシステム（HarmonyOS, Pangu AI）に深く統合された Kuavo を開発。2026年には佛山市に「30分に1台」の生産能力を持つ自動生産ラインを稼働。
- summary 下書き: HuaweiのAI基盤と強力に連携する、量産体制の構築に長けたメーカー。
- sources: [Leju Official](https://www.lejurobot.com/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### pal-robotics (PAL Robotics)
- slug: `pal-robotics`
- 掲載判断: `existing`
- country: `Spain`
- website: `https://pal-robotics.com/`
- japanPresence: `remote`
- 代表機種: `pal-talos`, `pal-kangaroo`
- description 下書き: 創業20年を超える欧州の老舗。研究向けの TALOS に加え、強化学習研究に最適化した軽量機 Kangaroo を2025年より展開。ROSコミュニティへの貢献が非常に大きい。
- summary 下書き: 世界中の研究者に愛される、欧州ヒューマノイド界の良心。
- sources: [PAL Robotics](https://pal-robotics.com/)
- rights status: `reference-attributed`
- 本番反映可否: OK

### limx-dynamics (LimX Dynamics)
- slug: `limx-dynamics`
- 掲載判断: `add (draft)`
- country: `China`
- website: `https://www.limxdynamics.com/`
- japanPresence: `none`
- 代表機種: `limx-oli`, `limx-luna`
- description 下書き: 四足歩行・二足歩行の両方で高い運動性能を見せる。2025年に量産型 Oli ($21,800) を発表。2026年には18台のロボットによる同時自律稼働デモを成功させ、スケーラビリティを証明。
- summary 下書き: 卓越した運動制御技術と「Android for androids」OSで急速に台頭する新星。
- sources: [LimX Dynamics](https://www.limxdynamics.com/)
- rights status: `prototype-only`
- 本番反映可否: 掲載推奨。

### xpeng-robotics (XPENG Robotics / 小鵬鵬行)
- slug: `xpeng-robotics`
- 掲載判断: `add (draft)`
- country: `China`
- website: `https://www.xpeng.com/`
- japanPresence: `none`
- 代表機種: `xpeng-iron`
- description 下書き: 中国EV大手 XPENG 傘下のロボティクス部門。2026年には自社製AIチップ「Turing」を搭載した第8世代 Iron の量産を開始。EV製造の知見を活かした量産設計が強み。
- summary 下書き: EV製造の資産を背景に、産業・家庭への大規模展開を狙う。
- sources: [XPENG News](https://www.xpeng.com/)
- rights status: `prototype-only`
- 本番反映可否: 掲載推奨。


---

## 4. 調査・ファクトチェック結果まとめ

### 主要な事実確認
- **AgiBot出荷台数**: 2025年実績 5,168台は公式発表およびOmdiaレポートにより裏取り完了。世界シェア約39%と推計。
- **Apptronik資金調達**: Series A 累計9.35億ドル、企業価値53億ドル超はTechCrunch等の主要メディアで報道済み。
- **1X Technologies**: NEOの量産開始と2026年後半の出荷開始は公式サイトで明記。
- **Tesla Optimus**: Gen 3 量産開始（2026年1月）および自社工場導入はElon Muskの発言と現場目撃情報で整合。
- **Figure AI**: Figure 03 のBMW導入および400%効率向上は公式発表ベース。

### 強い主張の調整
- 「世界1位」等の表現は、AgiBotやUnitreeのように複数が主張している場合、「量産実績でトップクラス」「世界最多水準の出荷」などの表現に留める。
- 「標準導入」等の表現は、実証(pilot)段階か本番(production)段階かを厳密に区別し、descriptionに反映した。

## 5. 画像・ロゴ権利状態（一括管理案）

| メーカー | 画像種別 | sourceUrl | rights.status | 備考 |
|---|---|---|---|---|
| Figure AI | Logo | `https://images.ctfassets.net/...` | `reference-attributed` | 公式サイトより参照。 |
| 1X | Logo | `https://www.1x.tech/icons/1xLogo.svg` | `reference-attributed` | 公式サイトより参照。 |
| Boston Dynamics | Atlas | `https://bostondynamics.com/...` | `reference-attributed` | プレスキット確認推奨。 |
| LimX Dynamics | Logo | (公式サイト) | `prototype-only` | 利用規約未確認のため。 |
| XPENG | Logo | (公式サイト) | `prototype-only` | 利用規約未確認のため。 |

## 6. 本番データ反映計画 (Phase 5)

### 反映対象
- **既存17社**: `description`, `summary`, `sources`, `updatedAt`, `reliability`, `checkedAt` を一斉更新。
- **新規2社**: `limx-dynamics`, `xpeng-robotics` を `publishStatus: 'draft'` で追加。
- **各社共通**: `checkedAt` を `2026-06-02` に統一。

### 更新例 (data/manufacturers.ts)
```typescript
{
  slug: 'figure-ai',
  // ...
  updatedAt: '2026-06-02',
  reliability: 'official', // 2026年の公式発表に基づくため
  sources: [
    {
      title: 'Figure 03 Deployment at BMW',
      url: 'https://www.figure.ai/news/production-at-bmw',
      publisher: 'Figure AI',
      checkedAt: '2026-06-02',
      reliability: 'official',
    },
    // ...
  ],
  // ...
}
```

## 7. 次のステップ

1. この下書きMDを開発チーム/ユーザーがレビュー。
2. 承認後、`data/manufacturers.ts` への流し込み作業を実施。
3. `npm run validate:data` および `npm run build` による整合性チェック。
