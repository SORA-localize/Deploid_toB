import type { Article } from './types';

export const articles: Article[] = [
  {
    id: 'surgie-unitree-g1-preclinical-surgery',
    slug: 'surgie-unitree-g1-preclinical-surgery',
    title: 'Unitree G1-based "Surgie" completes teleoperated preclinical surgery — what it means for general-purpose humanoids in hospitals',
    titleJa: 'Unitree G1を改造した「Surgie」が生体手術を完了、汎用ヒューマノイドは手術室へ入れるか',
    type: 'tech-update',
    category: 'news',
    section: 'tech',
    summary: 'カリフォルニア大学サンディエゴ校の研究チームは、Unitree G1を基盤とする遠隔操作型ヒューマノイド「Surgie」を用い、ブタを対象とした腹腔鏡下胆嚢摘出術を2件実施した。人への臨床使用や自律手術ではないが、専用の大型手術ロボットではなく人間用の手術室設備へ汎用機を適応させる設計が、生体試験の一連の工程まで進んだ点が導入判断上の差分である。',
    publishStatus: 'published',
    updatedAt: '2026-07-12',
    reliability: 'official',
    publishedAt: '2026-07-12',
    author: 'Deploid Research',
    industryTags: ['healthcare', 'research'],
    regionTags: ['us'],
    themeTags: ['safety'],
    heroImage: {
      src: '/images/article-generic/teleoperation-vr/vr-headset-hands-outstretched.jpg',
      alt: 'Person wearing a VR headset with hands raised, mimicking remote-control gestures',
      credit: 'Vitaly Gariev / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/man-wearing-vr-headset-with-hands-outstretched-sESr6zSRxk8',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Vitaly Gariev',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-07-12',
        permissionNote: 'Unsplash Licenseの汎用イメージ。Surgie実機ではなく、遠隔操作というテーマを示す代替画像として使用。UC San Diego公式画像は転載条件が未確認のため使用していない。',
      },
    },
    whyItMatters: '今回動いた変数は運動性能そのものではなく、既存施設への設置性、遠隔操作による責任分界、専用設備とのコスト構造、複数作業への転用可能性である。医療に限らず、人間用設備を大規模改修せずにロボットを導入する構想を評価する材料になる。',
    keyTakeaways: [
      '試験はブタを対象とする前臨床研究であり、人への手術や商用医療サービスではない。',
      'ロボットは自律手術を行ったのではなく、訓練を受けた外科医が遠隔操作した。',
      '1件は人間の外科医とヒューマノイド、もう1件は2台のヒューマノイドによる構成で実施された。',
      'Unitree G1には医療器具を扱うための専用エンドエフェクター、姿勢追跡、力制御などが追加されている。',
      '導入判断では機体価格だけでなく、器具の滅菌、通信遅延、再較正、故障時の退避、医療機器認証を含むシステム全体を評価する必要がある。',
    ],
    body: `## Unitree G1を基盤に2件の胆嚢摘出術を実施

カリフォルニア大学サンディエゴ校の工学・外科研究チームは、遠隔操作型ヒューマノイドを使い、ブタを対象とする腹腔鏡下胆嚢摘出術を2件実施した。研究成果は2026年7月8日付でNatureに掲載された。

使用された「Surgie」は、Unitree Roboticsの小型二足ヒューマノイドG1を基盤とする研究システムである。市販状態のG1がそのまま手術を行ったわけではない。研究チームは、医療器具を把持するための構成、両腕の遠隔操作系、姿勢追跡、インピーダンス制御などを組み込み、外科医の動作をロボットへ反映させた。

2件のうち1件は、人間の外科医と1台のヒューマノイドが協働する形で行われた。もう1件では2台のヒューマノイドを使用し、それぞれを外科医が遠隔操作した。工程には、胆嚢の牽引、肝胆嚢三角の剥離、胆嚢管などの構造確認、肝床からの胆嚢切離が含まれる。

これは人間の患者を対象とした臨床試験ではなく、生体動物を対象とする前臨床の実現可能性研究である。また、ロボットが状況を判断して手術を完遂した自律手術でもない。「ヒューマノイドが単独で外科医を代替した」と解釈すべき結果ではない。

## 専用手術ロボットとは異なる導入仮説

現在普及している手術支援ロボットは、特定の手術工程や操作方法に合わせて設計された専用システムである。これに対しSurgieの研究は、人間が使う器具や空間へヒューマノイドを適応させる構成を採る。

研究チームが提示する利点は、機体の小ささ、設置面積、基盤機の価格、用途転換の余地である。UC San Diegoは、従来型の大型手術ロボットと比べて、システムをより小さな空間へ配置できる可能性を挙げている。

ただし、市販G1の価格と、実際に手術へ使用できるシステムの導入費用は分けて考える必要がある。専用器具、制御装置、映像系、通信設備、ソフトウェア、検証、滅菌対応、保守、教育を加えた総費用は公表されていない。安価な市販ヒューマノイドを基盤にしたことだけでは、医療機関の総保有コストが低くなるとは判断できない。

## 実験で残った運用上の制約

論文と公式発表は、試験中に再較正が必要だったことや、操作時間に影響する遅延があったことを示している。手術では、単に器具を動かせるだけでなく、力の再現性、映像と操作の同期、長時間の安定稼働、緊急停止後の安全な復帰が必要になる。

二足歩行機構も、手術中の中心的な価値が確立したわけではない。今回の作業は基本的に手術台付近で行われており、歩行能力が手術成績や作業時間をどこまで改善したかは示されていない。移動が不要な工程では、固定台や車輪型の双腕ロボットの方が、安定性、電力、保守、安全設計で有利となる可能性がある。

一方、同一の機体が器具の準備、患者周辺の補助、物品搬送、遠隔診察など複数の役割を担えるなら、人型構成の価値は手術工程だけでなく病院全体の稼働率で評価できる。この仮説を検証するには、作業間の切り替え時間、洗浄と滅菌の範囲、スタッフ教育、利用可能時間を含む運用データが必要である。

## 医療機関が調達前に分けるべき責任範囲

遠隔操作型ロボットでは、機体メーカー、システム統合事業者、医療機関、通信事業者、操作する医師の責任範囲を契約上明確にする必要がある。通信が途切れた場合に誰が現場で介入するのか、ロボットが器具を保持した状態で停止した場合にどう退避させるのか、操作ログを誰が保管するのかといった条件が導入可否を左右する。

日本で医療用途として使用する場合、医療機器としての承認・認証の要否、適用範囲、臨床評価、サイバーセキュリティ、遠隔医療に関する運用設計を確認しなければならない。今回の研究結果は、日本国内でG1やSurgieを手術へ使用できることを意味しない。

医療以外の現場にも共通する確認項目は多い。市販機を基盤としたヒューマノイドを導入する企業は、本体仕様だけでなく、用途別改造の供給者、改造後の保証、ソフトウェア更新の影響、通信障害時の挙動、作業者が介入する手順まで一体で評価すべきである。

## 次の判断材料となるデータ

次に必要なのは、成功映像の追加ではなく、再現性と運用負荷を示す数字である。複数症例での完遂率、手術時間、再較正回数、通信遅延、機体停止、器具交換時間、外科医の学習時間、既存手術ロボットとの比較が求められる。

Surgieは商用製品ではなく、今回の発表も医療機関への導入契約ではない。それでも、人間向けに設計された高度な作業環境へ、汎用ヒューマノイドを後付けで適応させる方法が生体試験まで進んだ。導入企業にとっての論点は、ヒューマノイドが人間の形を再現できるかではなく、専用機より低い設備変更費と十分な稼働率を両立できるかである。`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: [],
    sources: [
      { title: 'In vivo feasibility study of humanoid robots in surgery', url: 'https://www.nature.com/articles/s41586-026-10796-x', publisher: 'Nature', publishedAt: '2026-07-08', checkedAt: '2026-07-12', reliability: 'official' },
      { title: 'Surgeons Use Teleoperated Humanoid Robots to Perform Live Surgery, a World First', url: 'https://today.ucsd.edu/story/surgeons-use-teleoperated-humanoid-robots-to-perform-live-surgery-a-world-first', publisher: 'University of California San Diego', publishedAt: '2026-07-08', checkedAt: '2026-07-12', reliability: 'official' },
      { title: 'Humanoids in Hospitals: A Technical Study of Humanoid Robots in Healthcare', url: 'https://surgie-humanoid.github.io/', publisher: 'UC San Diego Advanced Robotics and Controls Laboratory', checkedAt: '2026-07-12', reliability: 'official' },
      { title: 'Beyond da Vinci: Why versatile humanoid robots are the next frontier in surgery', url: 'https://www.therobotreport.com/beyond-da-vinci-why-versatile-humanoid-robots-are-next-frontier-surgery/', publisher: 'The Robot Report', publishedAt: '2026-07-09', checkedAt: '2026-07-12', reliability: 'reported' },
    ],
  },
  {
    id: 'mitsubishi-highlanders-humanoid-mou-kyoto-2026',
    slug: 'mitsubishi-highlanders-humanoid-mou-kyoto-2026',
    title: 'Mitsubishi Motors and Highlanders Plan Humanoid Development and Production at Kyoto Plant',
    titleJa: '三菱自動車とHighlanders、京都工場でヒューマノイド量産を検討　2027年早期の生産開始へ',
    type: 'market-analysis',
    category: 'news',
    section: 'business',
    summary: '三菱自動車とHighlandersが、三菱自動車の工場で使うヒューマノイドの共同開発と、京都工場での量産化に向けた基本合意を締結した。販売開始ではないが、国内自動車工場を生産拠点候補とし、2027年早期の生産開始を検討することで、国内調達、品質保証、保守体制の選択肢が具体化した。',
    publishStatus: 'published',
    updatedAt: '2026-07-10',
    reliability: 'official',
    publishedAt: '2026-07-10',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    regionTags: ['japan'],
    themeTags: ['mass-production', 'commercialization', 'physical-ai'],
    heroImage: {
      src: '/images/article-generic/industrial-automation/factory-orange-machines.jpg',
      alt: 'Industrial robotic arms on a factory production line',
      credit: 'Simon Kadula / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-factory-filled-with-lots-of-orange-machines-8gr6bObQLOI',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Simon Kadula',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-07-10',
        permissionNote: 'Unsplash Licenseの汎用工場イメージ。Highlanders N実機ではなく、量産・工場運用のテーマを示す代替画像として使用。',
      },
    },
    whyItMatters: '国内自動車メーカーの量産設計・品質保証・工場運営をヒューマノイド供給へ転用する計画が、工場名と開始目標を伴って示された。調達側にとっては、輸入機以外の国内供給・保守候補が現実的な比較対象になり始めた。',
    keyTakeaways: [
      '三菱自動車の製造施設で使うヒューマノイドを共同開発し、実運用データを製品へ戻す計画である。',
      '京都製作所京都工場の遊休建屋を使い、2027年早期の生産開始を検討している。',
      '2027年後半の月産1,000台は製造能力の目標であり、受注済み台数や確定生産計画ではない。',
      '導入台数、価格、可搬重量、稼働率、安全認証、保守条件は未公表である。',
    ],
    body: `三菱自動車工業と東京大学発スタートアップのHighlandersは、三菱自動車の工場で使うヒューマノイドロボットの共同開発と、京都製作所京都工場での量産化を検討する基本合意書を締結した。発表時点で確定しているのは「共同開発と量産化の協議を始めること」であり、導入台数、販売価格、量産契約、外販開始時期まで決まったわけではない。ただし、自動車メーカーの既存工場をヒューマノイドの生産拠点候補とし、2027年早期の生産開始を検討する点は、国内の調達可能性を判断するうえで具体的な差分である。\n\n## 自社工場で使いながら、製品と生産工程を同時に詰める\n\n両社は、三菱自動車の製造施設で使う機体を共同開発し、実際の利用から運用データとノウハウを蓄積する。導入候補として示されたのは、京都製作所のエンジン組み立てラインである。人手作業が残り、自動機への置き換えが難しい小さな作業範囲が想定されている。\n\nこの進め方では、ロボットメーカーが完成品を持ち込み、ユーザー企業が評価するだけではない。利用現場を持つ自動車メーカーが、作業要件、耐久性、安全設計、保守性、生産技術を早い段階から製品側へ戻せる。ヒューマノイドの導入で問題になりやすい「デモでは動くが、ラインの停止条件や品質保証に耐えない」という溝を、開発と量産準備を並行して埋める構図である。\n\n一方、対象工程の作業内容、サイクルタイム、可搬重量、稼働率、人との協働範囲は公表されていない。現時点では、量産工場への商用配備ではなく、自社工場を開発・評価環境として使う段階と見るべきである。\n\n## 京都工場の遊休建屋を量産候補に、2027年早期の開始を検討\n\n量産面では、三菱自動車が量産設計、品質保証、耐久・安全設計、メカトロニクス制御、工場運営の知見を提供する。京都工場の遊休建屋を活用し、2027年の早い時期に生産を始められるか検討する。\n\n発表会では、2027年後半に月産1,000台の製造能力を目指す方針も示された。年換算では最大1万2,000台に相当するが、これは受注済み台数や確定生産計画ではなく、設備能力の目標である。調達側は「月産1,000台」という数字だけで供給安定性を評価せず、部品表の確定時期、主要部品の内製・外製区分、歩留まり、検査工程、修理部品の保有方針まで確認する必要がある。\n\nHighlandersは三菱自動車から少額出資を受けており、追加出資も検討されている。資本関係と共同開発、製造拠点の検討が同時に進むため、単発の実証提携より関係は深い。ただし、追加出資額や契約上の独占性、他社向け生産の可否は未公表である。\n\n## 新機体「N」は公開されたが、調達仕様はまだ不足している\n\nHighlandersは第4世代ヒューマノイド「N」も公開した。5指ハンド、複数のビジョンシステム、マイクアレイ、GPUを搭載し、全身関節をAIで制御する。人間に近い身長・体重とし、ボタンやペダルなど人間用の設備を扱う設計を掲げる。\n\nしかし、導入判断に必要な定量仕様は十分に出ていない。連続稼働時間、可搬重量、関節自由度、移動速度、防塵防滴、停止距離、安全認証、故障間隔、保守契約、価格、納期は確認できない。筆書きや歩行のデモは能力の一部を示すが、エンジン組み立て工程で要求される再現性やタクト適合を証明するものではない。\n\n## 国内メーカーを選ぶ理由が「国産」だけで済まなくなる\n\n国内の導入企業にとって、この提携が動かした変数は、国内生産による納期、保守、品質保証の選択肢である。海外機を輸入してSIerが統合する方式に対し、自動車工場の量産管理を組み込んだ国内供給体制が成立すれば、部品調達、現地対応、改修サイクルで差が出る可能性がある。\n\n比較時には、機体価格より先に、対象工程での成功率、有人復旧の頻度、停止時のライン影響、交換部品の到着時間、ソフトウェア更新時の再検証範囲を聞くべきである。今回の発表は販売開始ではないが、国内ヒューマノイドを「研究機」ではなく、製造業の品質保証体系に載せようとする計画が、工場名と開始目標を伴って示された点に意味がある。\n\nまた、需要側の検証計画も重要になる。初期導入企業は、単一工程の成功率だけでなく、シフトをまたぐ連続運転、作業変更時の再学習時間、床面や照明の変化、周囲作業者の動線に対する性能低下を記録すべきである。量産能力が整っても、現場ごとの立ち上げに多数のエンジニアを要するなら、年間導入可能台数は機体生産数より小さくなる。三菱自動車とHighlandersが、導入設計を標準化したパッケージまで作れるかが、2027年以降の供給実態を左右する。\n\n販売地域、保証期間、遠隔監視の扱い、顧客データの帰属も未公表であり、国内製造という事実だけで運用リスクが解消されるわけではない。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      { title: '三菱自動車工業株式会社、株式会社Highlanders 人とロボットが共に働く新しい産業基盤の実現に向け基本合意書を締結', url: 'https://www.mitsubishi-motors.com/jp/newsroom/newsrelease/2026/20260709_1.html', publisher: '三菱自動車工業株式会社 / 株式会社Highlanders', publishedAt: '2026-07-09', checkedAt: '2026-07-10', reliability: 'official' },
      { title: '三菱自動車、国産ヒューマノイド量産へ 東大発スタートアップと合意 27年後半に月産1000台目指す', url: 'https://www.itmedia.co.jp/news/articles/2607/09/news123.html', publisher: 'ITmedia NEWS', publishedAt: '2026-07-09', checkedAt: '2026-07-10', reliability: 'reported' },
      { title: 'Highlanders、国産ヒューマノイドロボット量産化に向け始動', url: 'https://prtimes.jp/main/html/rd/p/000000005.000156831.html', publisher: '株式会社Highlanders', publishedAt: '2026-05-28', checkedAt: '2026-07-10', reliability: 'official' },
    ],
  },
  {
    id: 'bmw-figure-deployment',
    slug: 'bmw-figure-deployment',
    title: 'Figure 02 completed 11-month BMW pilot — what Japanese buyers should read into it',
    titleJa: 'Figure 02 が BMW Spartanburg で11ヶ月実証を完了、日本企業の読み筋',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: 'Figure 02 は BMW Spartanburg で約11ヶ月の実証を完遂し、Figure AI は後継 Figure 03 へ移行した。日本企業がここから読み取るべき論点を整理する。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    themeTags: ['poc'],
    heroImage: {
      src: '/images/articles/bmw-figure-deployment/hero.jpg',
      alt: 'Figure 02 robot at BMW Group plant Spartanburg',
      credit: 'BMW Group',
      sourceUrl:
        'https://www.press.bmwgroup.com/usa/photo/detail/P90563506/Humanoid-robot-Figure-02-at-BMW-Group-plant-Spartanburg-08-2024',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        rightsHolder: 'BMW Group',
        checkedAt: '2026-06-20',
        permissionNote:
          'BMW Group PressClubの公式photo detailページ（報道向け画像配布用ページ）より取得。利用条件の明記は確認できなかったため reference-attributed として掲載。',
      },
    },
    whyItMatters:
      '製造現場で完遂された実証としては最も明確な公開事例の1つ。作業選定（板金パーツの装着）、評価KPI（精度・サイクル時間）、稼働形態（10時間シフト×週5）、世代交代のスピード、いずれも日本企業がヒューマノイドのPoCを設計する際の比較基準になる。',
    keyTakeaways: [
      'Figure公式発表ベース：11ヶ月稼働で30,000台超のBMW X3生産に貢献、90,000点超の部品をロード',
      'サイクル84秒・配置精度99%以上は、実績値ではなくFigureが定義したKPI要求／目標値として扱う',
      '実証完遂を機にFigure 02は退役、後継Figure 03へ移行 — 世代交代のスピードはベンダー継続性リスクとして必ず織り込む',
      'PoCの作業範囲を狭く・固定化（同じ部品の同じ動作）したことが定量結果に直結している',
      '実証完了 ≠ 一般販売可能。Figure はまだ外部企業への販売条件を公表していない',
    ],
    body: `## 実証の前提条件

BMW Spartanburg は Figure 02 に対して、板金パーツ（BMWが「VIN プレート」と呼ぶ車体識別番号プレートを含む複数の金属パーツ）を所定の治具に装着する単一タスクを割り当てた。Figure AI 公式発表によると稼働形態は10時間シフト・週5日で、作業範囲を意図的に狭く・固定化している。この「スコープの絞り込み」が後述の定量結果に直結している。

## 発表された数値の読み方

Figure AI は「30,000台超の BMW X3 生産に貢献」「90,000点超の部品をロード」「サイクル84秒・配置精度99%以上」を公式発表している。これらの数値を読む際には以下の点に注意が必要だ。

- **サイクル時間・精度は KPI 要求値または目標値であり、実測平均値ではない**と Deploid は判断している（Figure AI の発表には「達成した平均値」という表現はない）
- 「30,000台超の生産に貢献」は、ロボットが稼働した期間中に Spartanburg で生産された台数であり、ロボット単体の生産効率を示すものではない
- 実証期間は約11ヶ月で、その間の稼働率・ダウンタイム・人間の補助介入率は非公開

## Figure 03 への世代交代が意味すること

実証完遂を機に Figure 02 は退役し、後継の Figure 03 への移行が発表された。これは技術進化の速さを示す一方、**ベンダー継続性リスク**として必ず評価に織り込む必要がある。

日本企業が PoC を設計する際は「PoC 実施中に後継モデルに切り替わった場合の対応コスト（再トレーニング・再検証・契約変更）」を事前にベンダーと合意しておくことが望ましい。

## 日本市場への適用上の注意

Figure はまだ外部企業への販売条件・価格・調達経路を公表していない（要確認）。国内代理店も未発表。現時点では **「どのような条件で調達できるか」を把握するための問い合わせ段階** にとどまる。`,
    featured: true,
    relatedRobotIds: ['figure-02', 'figure-03'],
    relatedManufacturerIds: ['figure-ai'],
    relatedUseCaseIds: ['factory-assembly-support'],
    sources: [
      {
        title: 'F.02 Contributed to the Production of 30,000 Cars at BMW',
        url: 'https://www.figure.ai/news/production-at-bmw',
        publisher: 'Figure AI',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
      {
        title: 'Humanoid Robots for BMW Group Plant Spartanburg',
        url: 'https://www.bmwgroup.com/en/news/general/2024/humanoid-robots.html',
        publisher: 'BMW Group',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'gxo-digit-100k-totes',
    slug: 'gxo-digit-100k-totes',
    title: 'Agility Digit passes 100,000 totes at GXO under RaaS contract',
    titleJa: 'Agility Digit、GXOの倉庫で10万トート搬送達成（商用 RaaS の先行事例）',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: 'Agility Robotics の Digit が、GXO ジョージア州 Flowery Branch 拠点での RaaS 契約による商用稼働で累計10万トート搬送を達成した。買い切りではなく「サービスとして導入する」モデルの先行例。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    industryTags: ['logistics'],
    themeTags: ['business-model'],
    heroImage: {
      src: '/images/article-generic/logistics-warehouse/forklift-warehouse-pallets.jpg',
      alt: 'Forklift moving pallets inside a logistics warehouse',
      credit: 'Bernd Dittrich / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-forklift-driving-through-a-warehouse-filled-with-pallets-F2C_mSrb6iM',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Bernd Dittrich',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote:
          'Agility Robotics公式画像はTerms of Use上ブロック済み（"personal, non-commercial use only"等の制限）。代わりにUnsplash Licenseの汎用倉庫イメージを使用。Digit実機ではない。',
      },
    },
    whyItMatters:
      'ヒューマノイドの商用導入で「機体を買う」のではなく「ロボットをサービスとして導入する」契約形態（RaaS）が量的成果を出した稀有な例。買い切りに対する代替形態として、調達形態の議論に直接インパクトを持つ。',
    keyTakeaways: [
      '累計10万トート以上の搬送をGXO拠点で達成（Agility公式発表）',
      '契約形態は RaaS と公表。ただし価格・課金単位・SLAなど詳細条件は未公表',
      'タスクは物流倉庫の構造化された環境（トート搬送・AMR連携）で、現状のヒューマノイドが最も成立しやすい領域',
      '日本では同等の RaaS 契約・国内サービス窓口は未確認',
    ],
    body: `## RaaS とはどういう契約形態か

従来の産業用ロボット調達は「機体購入＋保守契約」が基本だった。RaaS（Robot as a Service）はこれを根本から変える。企業は機体を所有せず、稼働量・時間・成果に応じた利用料を支払う。初期投資が抑えられる一方、SLAの中身（稼働保証・故障対応・更新タイミング）が契約の核になる。

## GXO拠点での実証内容

GXO ジョージア州 Flowery Branch 拠点に導入された Agility Digit は、AMR（自律搬送ロボット）と連携して空トートバッグの回収・仕分けを担当した。Agilityは累計10万トート搬送を達成したと公式に発表している。ただし稼働率・ダウンタイム・人間の介入頻度といった詳細なオペレーション指標は非公表のため、この数値を単独で評価することには注意が必要だ。

## 「構造化された環境」が成果の前提

物流倉庫はヒューマノイドが最も成立しやすい環境のひとつだ。動線が設計済みで、扱う物体の形状がある程度一定で、人間との作業区域を分離しやすい。今回の10万トートという実績も、こうした「環境の設計」が先行したことで成立している。非構造環境（工場の曖昧な作業区域や、形状不定な物体のハンドリング）への適用は別の難易度になる。

## 日本企業が読み取るべき論点

RaaS モデルで最も重要なのは「何を SLA として合意するか」だ。稼働保証（uptime）、故障時の対応時間、世代更新のタイミングと追加費用、日本語対応窓口の有無——これらが契約の価値を決める。現時点でAgilityは国内に正式な販売・保守拠点を持っていないため、本格導入を検討する場合は代理店交渉と合わせて進める必要がある。`,
    relatedRobotIds: ['agility-digit'],
    relatedManufacturerIds: ['agility-robotics'],
    relatedUseCaseIds: ['warehouse-picking'],
    sources: [
      {
        title: 'Digit Moves Over 100,000 Totes in Commercial Deployment',
        url: 'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
        publisher: 'Agility Robotics',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
  // ── 2026年 最新ニュース ──────────────────────────────────────────
  {
    id: 'jal-haneda-unitree-pilot-2026',
    slug: 'jal-haneda-humanoid-pilot-2026',
    previousSlugs: ['jal-haneda-unitree-pilot-2026'],
    title: "JAL launches Japan's first humanoid robot trial at Haneda — UBTECH Walker Tienkung handles ground ops",
    titleJa: 'JAL、羽田空港で国内初のヒューマノイド実証開始——UBTECH Walker Tienkung が地上業務に投入',
    type: 'deployment-report',
    category: 'news',
    section: 'deployment',
    summary: '日本航空（JAL）が2026年5月、羽田空港で国内航空会社として初めてヒューマノイドロボットの実証実験を開始した。GMO AI & Robotics が提供する UBTECH Walker Tienkung（旧称 Walker E）をベースに、手荷物・貨物の積み降ろし等のグランドハンドリング業務への適用を検証する。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'official',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    industryTags: ['logistics'],
    regionTags: ['japan'],
    themeTags: [],
    whyItMatters:
      '日本の大手レガシーキャリアが安全規制の厳しい空港現場でヒューマノイドを実運用に踏み切ったことは、国内の他業種への波及効果が大きい。機体は UBTECH Walker Tienkung（旧称 Walker E）で、GMO AI & Robotics が現場業務向けの制御・運用ソフトを担う「メーカー機体＋インテグレーターソフト」構成は国内導入モデルとして参照価値が高い。',
    keyTakeaways: [
      '2026年5月開始・2028年まで2年間の実証。3年以内の商用化が目標（JAL公式発表）',
      '使用機体は UBTECH Walker Tienkung（旧称 Walker E）。GMO AI & Robotics が空港業務向け制御ソフトを開発・担当',
      '当面のタスクはコンテナ搬送・レバー開閉等の補助作業。将来的に手荷物積み降ろし・客室清掃・地上支援機材操作を想定',
      '稼働時間2〜3時間／充電サイクル——バッテリー交換体制の設計が運用コストの核になる',
      '人口高齢化による航空グランドハンドリング人材不足が実証の直接動機',
    ],
    body: `## なぜ JAL が今、ヒューマノイドなのか

2026年5月、日本航空（JAL）は JAL グランドサービス株式会社と GMO AI & Robotics 株式会社と組み、羽田空港での国内初となるヒューマノイドロボット実証実験を開始した。背景にあるのは航空グランドハンドリング業界が直面する深刻な人材不足だ。

インバウンド需要の回復により空港の取扱量は増加する一方、日本の生産年齢人口の減少は加速している。荷物の積み降ろしや牽引といった肉体的負荷の高い業務は特に採用難が続いており、ヒューマノイドは「補助ではなく代替」としての位置付けで検討が始まっている。

## 使用機体：UBTECH Walker Tienkung と GMO の独自ソフト

今回の実証に使用されているのは UBTECH の Walker Tienkung（旧称 Walker E）だ。身長 172cm のフルサイズヒューマノイドで、GMO AI & Robotics が日本代理店の GA Robotics（GMO グループ）経由で調達・展開している。GMO AI&ロボティクス商事は2026年2月よりロボット人材派遣型サービスに Walker E（現 Tienkung）を追加しており、空港業務はその実導入ケースの一つだ。

「UBTECH の機体＋GMO 内製ソフト」という構成は、メーカー機体を調達しながら現場特化ソフトをインテグレーターが担う、国内事業者が参照しやすい現実的な分業モデルを示している。

## 現在の実証タスクと将来計画

実証フェーズ1では、コンテナの搬送とロック・アンロック用レバーの開閉操作を担当する。いずれも人間の監督者が安全機能を保持しながら、ロボットが補助する形態だ。将来的には手荷物・貨物の積み降ろし、客室清掃、地上支援機材（GSE）の操作まで段階的に拡大する計画が示されている。

## 運用上の課題：バッテリー稼働時間

現時点で最も明確な制約は稼働時間だ。2〜3時間の運用後に充電（またはバッテリー交換）が必要なため、空港の連続稼働シフト（6〜8時間）に対応するには複数台のローテーション体制か、バッテリー交換ステーションの設置が不可欠になる。この制約はグランドハンドリング特有の「稼働密度の高いシフト」との相性で見極める必要がある。

## 日本のtoB事業者が読み取るべき論点

- **機体選択**: Walker Tienkung（旧 Walker E）は GA Robotics 経由で国内調達・評価貸出し可能。調達条件と保守責任は GA Robotics に直接確認できる
- **ソフト内製**: GMO が制御ソフトを独自開発している点は、システムインテグレーターの役割が今後の日本市場で重要になることを示唆する
- **2年間の実証期間**: 定量KPI・商用化条件は実証完了後に公表される見通し。短期での意思決定には使えないが、「どこで検証しているか」を把握する参照点として追う価値がある`,
    relatedRobotIds: ['ubtech-walker-tienkung'],
    relatedManufacturerIds: ['ubtech'],
    relatedUseCaseIds: ['warehouse-picking'],
    sources: [
      {
        title: "Japan's First Demonstration Experiment for Utilizing Humanoid Robots at Airports Begins",
        url: 'https://press.jal.co.jp/en/release/202604/009502.html',
        publisher: 'JAL Group',
        publishedAt: '2026-04-29',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: "Japan Airlines begins humanoid robot trials at Tokyo's Haneda airport as labor shortages bite",
        url: 'https://www.cnbc.com/2026/05/01/japan-airlines-humanoid-robots-haneda-labor-shortage.html',
        publisher: 'CNBC',
        publishedAt: '2026-05-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Japan Airlines to test humanoid robots for airport ground handling work',
        url: 'https://www.japantimes.co.jp/business/2026/04/28/companies/jal-humanoid-robot-use-airport/',
        publisher: 'The Japan Times',
        publishedAt: '2026-04-28',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'figure-botq-production-milestone-2026',
    slug: 'figure-botq-production-milestone-2026',
    title: "Figure's BotQ factory scales Figure 03 output from 1/day to 1/hour in four months",
    titleJa: 'Figure の BotQ 工場、Figure 03 を4ヶ月で1台/日→1台/時に増産——年産12,000台体制へ',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: 'Figure AI が自社工場 BotQ（カリフォルニア州）で Figure 03 の量産ペースを4ヶ月未満で1日1台から1時間1台（24倍）に引き上げた。500台超を出荷済みで、年産12,000台・将来50,000台を目標とする。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-13',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    themeTags: ['mass-production', 'commercialization'],
    whyItMatters:
      '「1時間に1台」というペースは、産業機械の量産水準に近づく変化点として重要だ。Honda・Toyota の自動車ラインとの比較は時期尚早だが、ヒューマノイドが「試作品」ではなく「量産品」として流通し始めたという事実は、調達コスト・納期・保守部品の供給体制を評価する上での前提が変わることを意味する。',
    keyTakeaways: [
      '4ヶ月未満で1日1台→1時間1台（24倍）。500台超出荷済み、9,000個超のアクチュエーター生産',
      '年産目標：現在12,000台、将来50,000台/年、4年後100,000台',
      '初回通過合格率80%超、バッテリー生産合格率99.3%（Figure公式）',
      'Figure 03 スペック：身長1.68m・60kg・44 DoF・ペイロード20kg・バッテリー約16時間・$20,000以下（目標、未確定）',
      '現在は商用パイロット限定。一般販売は2026年末以降の見通し',
    ],
    body: `## 「量産」の水準が変わった

2026年、Figure AI の自社工場 BotQ（カリフォルニア州）が Figure 03 の生産ペースを1日1台から1時間1台へ引き上げた。この4ヶ月未満での24倍増は、ヒューマノイドが「高精度な試作品」から「量産品」に移行し始めたことを示す最も具体的な指標だ。

BotQ は150台以上のネットワーク化されたワークステーションで構成され、Figure が独自開発した製造実行システム（MES）が品質データをフルトレーサビリティで管理する。初回通過合格率80%超、バッテリー生産合格率99.3%という数値は、量産体制としての再現性が一定水準に達していることを示す。

## Figure 03 のスペックと商用パイロットの状況

Figure 03 は身長1.68m・重量60kg・44自由度・ペイロード20kgで、6つのオンボードカメラと指先に3グラム単位を検知できる触覚センサーを搭載する。制御AIは Helix（Figure 独自）で、音声指示→タスク実行のフローをオンデバイスで処理する。

価格は $20,000 以下を目標としているが、確定していない。現在は BMW を含む複数の商用パイロットパートナーへの限定提供にとどまり、一般販売は2026年末以降の見通しだ。

## 量産加速が日本の調達担当者に意味すること

量産ペースの加速は「調達しやすさ」に直結する可能性がある。一方で注意すべき点もある。

- **500台超の出荷実績**は総量として小さい。自動車1車種の月産台数（数万台）と比較すると、ヒューマノイドの量産は依然として桁が2〜3違う
- **商用パイロット限定の現状**では、日本企業が今すぐ調達できる状況ではない。ウェイティングリストへの登録と条件交渉が先行ステップになる
- **世代交代リスク**: BMW実証（別記事）では Figure 02 が退役して Figure 03 へ移行した。量産加速は「後継モデルへの切り替えも速くなる」ことを意味し、PoC中の機種変更リスクとして評価に組み込む必要がある

## サプライチェーンの観点

Figure がアクチュエーター（9,000個超生産済み）を含む主要コンポーネントの内製化を進めている点は、サプライチェーンの安定性とコスト競争力の両面で重要だ。一方、国内での保守部品調達・修理対応の体制は未公表のため、日本での本格展開には代理店体制の整備が前提になる。`,
    relatedRobotIds: ['figure-03'],
    relatedManufacturerIds: ['figure-ai'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'BotQ: A High-Volume Manufacturing Facility for Humanoid Robots',
        url: 'https://www.figure.ai/news/botq',
        publisher: 'Figure AI',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Ramping Figure 03 Production',
        url: 'https://www.figure.ai/news/ramping-figure-03-production',
        publisher: 'Figure AI',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Figure ramps humanoid robot production from one per day to one per hour',
        url: 'https://roboticsandautomationnews.com/2026/05/27/figure-ramps-humanoid-robot-manufacturing-at-unprecedented-speed/101954/',
        publisher: 'Robotics and Automation News',
        publishedAt: '2026-05-27',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  // ── 2026年6月 最新ニュース ─────────────────────────────────────────
  {
    id: 'unitree-ipo-star-market-june2026',
    slug: 'unitree-ipo-star-market-june2026',
    title: 'Unitree Robotics clears China STAR Market listing review — first "embodied AI" IPO on A-shares',
    titleJa: 'Unitree Robotics が中国STARマーケット上場審査を通過──A株初の「体現AI」IPO承認',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: '2026年6月1日、上海証券取引所の上場審査委員会がUnitree Roboticsの新規上場申請を承認した。調達目標42億元（約6.2億ドル）、上場後評価額420億元（約62億ドル）を見込む。申請受理から73日間という異例の高速審査で、A株市場での「体現AI」企業の上場承認は初のケース。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-02',
    author: 'Deploid Research',
    themeTags: ['funding', 'ipo', 'market-analysis'],
    heroImage: {
      src: '/images/articles/unitree-ipo-star-market-june2026/hero.jpg',
      alt: 'Unitree G1 humanoid robot',
      credit: 'Sayanesy / Wikimedia Commons (CC0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unitree_G1.jpg',
      rights: {
        status: 'commercial-permitted',
        sourceType: 'third-party',
        rightsHolder: 'Sayanesy',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'Unitreeが公開企業になると、財務情報・調達コスト・部品サプライヤー・生産能力が有価証券報告書で開示されるようになる。日本企業がUnitree機を検討する際の「ベンダー財務健全性評価」に使える情報源が初めて公式に整う。また、A株での「体現AI」銘柄の誕生は中国政府・機関投資家の資金をこのセクターに引き込み、競合他社の量産加速にも間接的に働く。',
    keyTakeaways: [
      '2026年6月1日、上海証券取引所の上場審査委員会がUnitreeのIPO申請を承認（A株「体現AI」企業として初）',
      '申請受理（2026年3月20日）から承認まで73日間──STAR市場での異例のスピード審査',
      '調達目標：42億元（約6.2億ドル）、上場後評価額：420億元（約62億ドル）',
      '2025年売上高：16.99億元（約2.5億ドル）、コア事業粗利益率：60.13%（IPO目論見書）',
      '2025年にヒューマノイドロボット5,500台超を出荷。2026年は1万〜2万台出荷を目標',
    ],
    body: `## 何が起きたか

2026年6月1日、上海証券取引所（SSE）の上場審査委員会がUnitree Roboticsの新規上場申請を承認した。中国のA株市場（STAR Market）で「体現AI（Embodied AI）」企業が上場承認を受けるのはこれが初めてだ。

IPO申請の受理は2026年3月20日で、承認まで73日間という短期間で審査を通過している。STAR Marketは「硬科技（ハードテック）」銘柄の上場を促進する制度設計があるが、Caixin Globalによると73日間は異例のスピードとされる。

## 財務内容と規模感

IPO目論見書によると、2025年の売上高は16.99億元（約2.5億ドル）で、コア事業粗利益率は60.13%。調達目標は42億元（約6.2億ドル）で、上場後の想定評価額は420億元（約62億ドル）だ。

出荷実績については、2025年にヒューマノイドロボットを5,500台超出荷済み。2026年の出荷目標は1万〜2万台とされている。

## 上場で何が変わるか

Unitreeが公開企業になると、四半期ごとの財務開示が義務付けられる。日本企業にとっては以下の情報が初めて外部から確認できるようになる。

- コスト構造と粗利トレンド（価格交渉の参考）
- 主要部品サプライヤーの開示（サプライチェーンリスク評価）
- 研究開発投資の規模と方向性（技術ロードマップの読み解き）

一方で、公開企業になることで株主への業績プレッシャーが生じる。研究開発投資が短期利益優先に引っ張られるリスクや、量産ペースが投資家期待によって急加速・急減速するリスクも評価変数に加わる。

## 中国ヒューマノイド市場全体への影響

UnitreeのA株上場は、中国の機関投資家・政策ファンドをヒューマノイドセクターに引き込む呼び水になる可能性がある。競合他社（AGIBOT、Fourier Intelligence、他）の資金調達・量産加速にも間接的な追い風になると見られる。日本企業は「中国発ヒューマノイドの供給量が今後急増する」ことを前提にした調達・価格交渉シナリオを持つ必要がある。

## 注意事項

上場審査委員会の承認はIPO完了ではない。正式上場・株式公開は別プロセスを経る。本記事執筆時点（2026年6月13日）では正式な上場日程は未公表（要確認）。`,
    relatedRobotIds: ['unitree-g1', 'unitree-h2', 'unitree-r1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Unitree Robotics IPO Hearing Scheduled for June 1, Targeting China\'s First Listed Humanoid Robot Company',
        url: 'https://pandaily.com/unitree-robotics-ipo-hearing-june-2026',
        publisher: 'Pandaily',
        publishedAt: '2026-05-30',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Unitree gets STAR Market green light in China\'s \'hard-tech\' IPO wave',
        url: 'https://news.cgtn.com/news/2026-06-01/Unitree-gets-STAR-Market-green-light-in-China-s-hard-tech-IPO-wave-1NCT9TksSVq/share_amp.html',
        publisher: 'CGTN',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Unitree Fast-Tracks Shanghai IPO With Target Valuation of $6.2 Billion',
        url: 'https://www.caixinglobal.com/2026-05-26/unitree-fast-tracks-shanghai-ipo-with-target-valuation-of-62-billion-102447449.html',
        publisher: 'Caixin Global',
        publishedAt: '2026-05-26',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Inside Unitree\'s Prospectus: Revenue Climbs and Profits Dip as Star Market IPO Hearing Approaches',
        url: 'https://www.humanoidsdaily.com/news/inside-unitree-s-prospectus-revenue-climbs-and-profits-dip-as-star-market-ipo-hearing-approaches',
        publisher: 'Humanoids Daily',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'nvidia-gr00t-unitree-h2plus-june2026',
    slug: 'nvidia-gr00t-unitree-h2plus-june2026',
    title: 'NVIDIA and Unitree unveil Isaac GR00T Reference Humanoid at GTC Taipei — first open full-stack platform',
    titleJa: 'NVIDIAとUnitreeがIsaac GR00Tリファレンス機を発表──世界初のオープン全スタックヒューマノイドプラットフォーム',
    type: 'tech-update',
    category: 'news',
    section: 'tech',
    summary: '2026年6月1日、NVIDIAはGTC Taipeiでオープンなヒューマノイドロボット研究プラットフォーム「NVIDIA Isaac GR00T Reference Humanoid Robot」を発表した。Unitree H2 Plus の機体に Sharpa の五指触覚ハンド、NVIDIA Jetson Thor のオンボードコンピュートを統合し、Ai2・ETH Zurich・Stanford 等の研究機関が採用を表明した。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'official',
    publishedAt: '2026-06-02',
    author: 'Deploid Research',
    industryTags: ['research'],
    themeTags: ['physical-ai'],
    heroImage: {
      src: '/images/articles/nvidia-gr00t-unitree-h2plus-june2026/hero.jpg',
      alt: 'NVIDIA Isaac GR00T Reference Humanoid Robot with Unitree H2 Plus',
      credit: 'NVIDIA Corporation',
      sourceUrl: 'https://nvidianews.nvidia.com/news/nvidia-open-humanoid-robot-reference-design',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        rightsHolder: 'NVIDIA Corporation',
        checkedAt: '2026-06-20',
        permissionNote:
          'NVIDIA公式newsroom記事に掲載の画像より取得。利用条件の明記は確認できなかったため reference-attributed として掲載。',
      },
    },
    whyItMatters:
      'NVIDIAがヒューマノイドの「ハードウェア＋ソフトウェア＋AIモデル」をオープンリファレンスとして統合したことは、研究→実用化のサイクルを大幅に短縮する可能性がある。Unitree H2 Plusが採用プラットフォームに選ばれた事実は、中国製機体が西側学術機関の標準研究機として認知されつつあることを示す。',
    keyTakeaways: [
      'プラットフォーム構成：Unitree H2 Plus（機体）＋Sharpa Wave五指触覚ハンド＋NVIDIA Jetson Thor（オンボードAI）＋Isaac GR00Tソフトウェアスタック',
      'H2 Plusスペック：身長1.8m・重量68kg・31 DoF（脚6×2、腕7×2、腰3、頭2）',
      '採用研究機関：Ai2、ETH Zurich、Stanford Robotics Center、UC San Diego ARCL',
      '機体の出荷は2026年末からUnitreeを通じて提供。開発ワークフローはGitHub・Hugging Faceで近日公開予定（要確認）',
      '価格・日本での調達経路は未公表（要確認）',
    ],
    body: `## GTC Taipeiで発表されたこと

2026年6月1日、NVIDIAはGTC Taipei（台湾グランドコンピューテックショー）でオープンなヒューマノイドロボット研究プラットフォーム「NVIDIA Isaac GR00T Reference Humanoid Robot」を発表した。NVIDIAとしては初めて、特定のハードウェア構成を指定した「リファレンスデザイン」を公開した形になる。

## プラットフォームの構成

リファレンス機は4つのコンポーネントで構成される。

**Unitree H2 Plus（機体）**：身長1.8m・重量68kg・31自由度（脚6×2、腕7×2、腰3、頭2）。従来のH2をベースに微調整されたモデル。

**Sharpa Wave 五指触覚ハンド**：指ごとに圧力・変形を検知できる触覚センサーを搭載した五本指ハンド。従来の「つかむ」動作に加えて「触れる」フィードバックを制御に使える設計。触覚センサーがないハンドは、力加減が必要な精密部品の組み立てや、繊維・食品など軟質物のハンドリングでスリップ・破損が避けにくい。Sharpa Waveはこの制約に対応する形で統合された。

**NVIDIA Jetson Thor**：オンボードで推論を実行するAIコンピュートモジュール。クラウドへの常時接続なしに制御・推論を処理する。

**Isaac GR00T ソフトウェアスタック**：データ収集・合成→モデル学習→評価→展開までの研究ワークフローをオープンに提供。GitHub・Hugging Face経由で近日公開予定（要確認）。

## なぜリファレンスデザインが重要か

研究機関が独自にヒューマノイドを選定・調達・統合するコストは大きかった。機体選定→ソフト開発→センサー統合→評価環境の構築が個別に発生していたためだ。リファレンスデザインが標準化されることで、研究者は「どの機体でどのソフトを使うか」ではなく「どのスキルをどう学習させるか」に集中できる。

採用を表明した機関はAi2、ETH Zurich、Stanford Robotics Center、UC San Diego Advanced Robotics and Controls Laboratoryで、いずれも物理AIの最前線にいる研究拠点だ。これらの機関が同一ハードで研究を進めることで、学習データ・事前学習モデル・評価手法の共有が現実的になる。

## Unitree H2 Plusが選ばれた意味

NVIDIAのリファレンス機にUnitreeの機体が選ばれたことは、複数の含意を持つ。第一に、Unitreeの量産能力（2026年1〜2万台出荷目標）が研究機の大量展開を可能にする。第二に、$13.5K〜という価格帯が大学・研究機関の予算に収まりやすい。

一方で、日本市場への展開については現時点（2026年6月）では未公表（要確認）。機体の正式出荷は2026年末からとされている。

## 日本企業への示唆

このプラットフォームが普及すると、「大学・研究機関で鍛えられたスキルが量産機に転用される」パイプラインが生まれる可能性がある。研究段階の成果が実用機に展開されるまでの時間が縮まることは、日本の製造・物流企業がPoC設計を行う際のリードタイム見積もりを修正する根拠になる。`,
    relatedRobotIds: ['unitree-h2'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['research-development'],
    sources: [
      {
        title: 'NVIDIA Announces NVIDIA Isaac GR00T Reference Humanoid Robot for Academic Research',
        url: 'https://nvidianews.nvidia.com/news/nvidia-open-humanoid-robot-reference-design',
        publisher: 'NVIDIA Newsroom',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Unitree Announces H2 Plus, an NVIDIA Isaac GR00T Reference Humanoid Robot for Academic Research',
        url: 'https://www.prnewswire.com/news-releases/unitree-announces-h2-plus-an-nvidia-isaac-gr00t-reference-humanoid-robot-for-academic-research-302786748.html',
        publisher: 'PR Newswire / Unitree Robotics',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'NVIDIA, Unitree and Sharpa unite to design humanoid robot that can perform \'real work\'',
        url: 'https://www.scmp.com/tech/big-tech/article/3355402/nvidia-unitree-and-sharpa-unite-design-humanoid-robot-can-perform-real-work',
        publisher: 'South China Morning Post',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'unitree-g1-agt-season21-june2026',
    slug: 'unitree-g1-agt-season21-june2026',
    title: "Unitree G1 robots perform synchronized backflips on America's Got Talent — what virality means for enterprise",
    titleJa: 'Unitree G1がAmerica\'s Got Talent Season 21に出演──シンクロバック転が世界的バイラルへ。企業導入への含意は',
    type: 'news-brief',
    category: 'news',
    section: 'business',
    summary: '2026年6月2日（現地時間）放送のAmerica\'s Got Talent Season 21プレミアで、ダンサーの呉玉飛（ Wu Yufei）が8台のUnitree G1ロボットとシンクロパフォーマンスを披露した。バック転を含むルーティンに全審査員がYesを投票し、公式YouTubeは1日100万再生を超えた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-03',
    author: 'Deploid Research',
    themeTags: ['market-analysis', 'pr-demo'],
    heroImage: {
      src: '/images/articles/unitree-g1-agt-season21-june2026/hero.jpg',
      alt: 'Unitree G1 humanoid robot',
      credit: 'Sayanesy / Wikimedia Commons (CC0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unitree_G1.jpg',
      rights: {
        status: 'commercial-permitted',
        sourceType: 'third-party',
        rightsHolder: 'Sayanesy',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「ロボットは難しそう」という認知バリアがバイラル動画によって一気に崩れる効果がある。社内の「ヒューマノイド導入を検討してみよう」という議論が始まるトリガーになりやすい。一方で、パフォーマンス用途と産業用途では設計思想・要件が大きく異なるため、「テレビで見たから使える」という短絡思考を社内で整理しておく必要がある。',
    keyTakeaways: [
      '出演機体はUnitree G1（身長127cm・35kg・研究開発向け廉価機）。パフォーマンスのプログラムはUnitreeエンジニアの呉玉飛が独自開発',
      'Lady Gagaの「Abracadabra」に合わせた8台シンクロ演技。後半のシンクロバック転でスタンディングオベーション',
      '全審査員（Simon Cowell含む）がYesを投票。YouTubeで1日100万再生超え',
      'Global Timesの確認によると出演機体はG1モデルと明言',
    ],
    body: `## AGT Season 21で何が起きたか

2026年6月2日放送のAmerica's Got Talent（NBC）Season 21プレミアで、Unitree Roboticsのエンジニアでダンサーでもある呉玉飛（Wu Yufei、26歳、通称FlyingBug）が8台のUnitree G1ロボットとシンクロパフォーマンスを披露した。Lady Gagaの「Abracadabra」に合わせた演技は、ルーティン後半のシンクロバック転でオーディエンスのスタンディングオベーションを引き起こした。

Simon Cowellを含む全審査員がYesを投票し、公式YouTubeの1日再生数は100万回を超えた。Global Timesが同社に確認したところ、出演機体はUnitree G1であることが公式に認められた。

## G1はどういう機体か

Unitree G1は身長127cm・重量35kg・最高時速7.2km・23〜43自由度の研究開発・教育向けヒューマノイド。開発者向け価格は$13,500から（2026年時点）。製造業や物流業の産業現場に向けて設計されたわけではなく、研究・デモ・教育用途が主な適用領域だ。

今回のパフォーマンスは、呉玉飛がロボットの動作を一から独自プログラミングしたものだ。「製品として届いたG1がそのままダンスした」のではなく、高度な実装者が相当な時間をかけて完成させた演技である点を明確にしておく。

## バイラルが企業導入に与える影響

「テレビでロボットが踊っていた」という事実は、社内の「ヒューマノイドを検討してみようか」という会話が生まれるトリガーになる。これは必ずしも悪いことではない。経営層の関心が高まることで、実証実験の予算確保が容易になる側面がある。

一方で、「AGTで動いたから工場でも使える」という短絡的な評価は誤解を生む。パフォーマンス用途と産業用途では、耐久性・防塵防水・安全設計・保守体制・稼働時間という要件が根本的に異なる。社内でヒューマノイドの議論が始まったとき、「どの用途で・どの環境で・どのKPIで評価するか」を最初に確定させる必要がある。

## 国際的な認知変化としての意義

AGTは米国の主要ゴールデンタイム番組であり、視聴者規模は数百万単位だ。「中国製のロボットがアメリカの国民的番組で拍手を受けた」という事実は、米中関係のテンションを背景に特別な意味を持つ。eWeekはこの出演を「米国の消費者意識に中国製ロボットが踏み込んだ象徴的瞬間」と評している。`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Unitree, a Crew of Dancing Robots, Wow in AGT Premiere',
        url: 'https://www.nbc.com/nbc-insider/unitree-agt-dancing-robots-audition',
        publisher: 'NBC',
        publishedAt: '2026-06-02',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Unitree dancing robots that wowed America\'s Got Talent are G1 humanoid models, firm tells GT',
        url: 'https://www.globaltimes.cn/page/202606/1362852.shtml',
        publisher: 'Global Times',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China\'s Unitree Robots Dance Into the US Spotlight on America\'s Got Talent',
        url: 'https://www.eweek.com/news/unitree-robots-americas-got-talent-us-scrutiny-apac-china/',
        publisher: 'eWeek',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-humanoid-duopoly-agibot-june2026',
    slug: 'china-humanoid-duopoly-agibot-june2026',
    title: 'AGIBOT at 10,000 units + Unitree IPO cleared: China\'s humanoid duopoly takes shape',
    titleJa: 'AGIBOT 1万台達成・Unitree IPO承認──中国ヒューマノイド二強の構図が固まる',
    type: 'market-analysis',
    category: 'analysis',
    section: 'business',
    summary: '2026年3月末にAGIBOTが累計1万台生産を達成し、6月1日にUnitreeのSTARマーケットIPOが承認された。生産量・資本調達の両面でこの2社が中国市場の上位を占める構図が鮮明になっている。日本のtoB事業者がこの「二強」をどう評価すべきかを整理する。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-03',
    author: 'Deploid Research',
    regionTags: ['china'],
    themeTags: ['mass-production', 'market-analysis'],
    heroImage: {
      src: '/images/articles/china-humanoid-duopoly-agibot-june2026/hero.jpg',
      alt: 'AGIBOT X2 humanoid robot at MWC 2026',
      credit: 'JJxFile / Wikimedia Commons (CC BY 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:AGIBOT-X2-_by_JxFile_MWC26.jpg',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'JJxFile',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '中国ヒューマノイド市場のシェアとリソースがUnitree・AGIBOT２社に集中する構図は、部品サプライチェーン・学習データ・開発者エコシステムの集積を加速させる。日本企業が将来的に中国製ヒューマノイドを検討する際、この2社の動向が価格帯・保守体制・技術水準のベンチマークになる。',
    keyTakeaways: [
      'AGIBOT：2026年3月30日に累計1万台生産達成（2023年創業）。5000台→1万台の倍増は3ヶ月で達成',
      'Unitree：2026年6月1日にSTARマーケット上場審査を通過。2025年出荷5500台超、2026年目標1〜2万台',
      'AGIBOT Expedition A3 が主力モデルとして商業展開をリード',
      'TechTimesはこの2社を「中国ヒューマノイドデュオポリー」と表現。欧米系と異なり製品が市場に流通している点を強調',
      '日本を含むアジア太平洋・中東への展開をAGIBOTは明言しているが、国内代理店・保守体制は要確認',
    ],
    body: `## AGIBOT の1万台とは何か

2026年3月30日、上海発のAGIBOT（創業2023年）が累計1万台のヒューマノイドロボット生産を達成したと発表した。同社公式発表によると、最初の1000台に2年近くかかったのに対し、5000台→1万台の倍増は3ヶ月で達成している。主力プラットフォームはExpedition A3で、製造・物流・公共サービスなど複数セクターへの展開が進む。

この数値を評価する際には、「生産台数 ≠ 稼働台数 ≠ 商業導入台数」という点に注意が必要だ。同社の発表は生産（製造）台数を示しており、各台の稼働状況・収益貢献度・維持管理状況は非公開だ。

## Unitree との比較

TechTimesが「中国ヒューマノイドデュオポリー」と表現するように、この2社は規模と資本力で中国市場の上位を占める。

| | AGIBOT | Unitree |
|---|---|---|
| 創業 | 2023年 | 2016年 |
| 累計生産台数（2026年3月時点） | 1万台 | 5,500台（2025年） |
| 上場ステータス | 未公開（2026年6月時点） | STARマーケット審査通過（2026年6月） |
| 主力機 | Expedition A3 | G1（$13.5K〜）、H2、R1 |

## 競争優位の違い

AGIBOTの強みは「生産実績の蓄積スピード」にある。創業2年あまりで1万台という数字は、製造プロセスの標準化が急速に進んでいることを示す。欧州・北米・アジア太平洋・中東への展開を明言しており、グローバル展開の意欲が明確だ。

Unitreeの強みは「価格と量産能力の組み合わせ」にある。G1の$13.5K〜という価格帯は競合機と比較して一桁安い製品を市場に投入し続けている。さらにSTARマーケット上場による公開資本調達で研究開発・生産設備への大規模投資が可能になる。

## 日本企業が読み取るべきこと

中国二強の存在は、日本向け価格・サポート体制の評価軸に直接影響する。Unitreeは国内代理店（TechShare等）が確認されているが、AGIBOTの日本代理店・保守体制は2026年6月時点で未確認（要確認）。大量生産能力があることと「日本の現場で使えるか」は別の命題であるため、技術水準だけでなく国内サポート体制の充実度が調達判断の核になる。`,
    relatedRobotIds: ['agibot-a2', 'unitree-g1'],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Unitree IPO Cleared, AGIBOT Hits 10,000 Units: China Humanoid Robot Duopoly Takes Shape',
        url: 'https://www.techtimes.com/articles/317632/20260602/unitree-ipo-cleared-agibot-hits-10000-units-china-humanoid-robot-duopoly-takes-shape.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-02',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'AGIBOT Reaches 10,000 Units as Real-World Demand for Robots Accelerates',
        url: 'https://www.prnewswire.com/news-releases/agibot-reaches-10-000-units-as-real-world-demand-for-robots-accelerates-302728295.html',
        publisher: 'PR Newswire / AGIBOT',
        publishedAt: '2026-03-30',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'yy-group-unitree-facility-june2026',
    slug: 'yy-group-unitree-facility-june2026',
    title: 'YY Group deploys Unitree G1 Edu in Asia facility management — robots clean buildings and harvest AI training data',
    titleJa: 'YY GroupがアジアのビルメンにUnitree G1 Eduを商用展開──清掃しながらAI訓練データも収集する二重モデル',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: '2026年6月9日、マレーシア上場企業YY Group Holding（NASDAQ: YYGH）がアジア全域の施設管理事業にUnitree G1 Edu Ultimate B-U4を商用展開すると発表した。清掃・保守タスクの実行と並行して、現場データをAI訓練用に収集する二重目的の運用モデルが特徴的だ。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-10',
    author: 'Deploid Research',
    industryTags: ['logistics'],
    regionTags: ['japan'],
    themeTags: ['commercialization'],
    heroImage: {
      src: '',
      alt: 'Unitree G1 Edu humanoid robot in facility management context',
      credit: 'YY Group / Unitree Robotics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      'ビルメンテナンスは日本でも深刻な人材不足が続く労働集約産業だ。YY Groupの導入モデル（機体はUnitree調達・ソフトは内製・既存ワークフォースプラットフォームと統合）は、日本の施設管理会社がヒューマノイドを導入する際の参照パターンとして直接使える。「清掃しながらデータ収集」という二重モデルは、ROI計算の構造を変える可能性がある。',
    keyTakeaways: [
      '使用機体：Unitree G1 Edu Ultimate B-U4（3D触覚ハンド・NVIDIA Jetson Orin搭載）',
      '展開拠点：ショッピングモール・ホテル・商業不動産（アジア全域）',
      '清掃・保守作業と並行して現場AIトレーニングデータを収集する二重目的の運用',
      '既存システム（YY Circleワークフォースプラットフォーム・24IFM）と統合した軟件スタック',
      'YY Groupは施設管理大手。データ収集も事業化できれば「ロボットの稼働コストをデータ収益で一部相殺」するモデルが成立する可能性',
    ],
    body: `## YY Groupとは

YY Group Holding Limited（NASDAQ: YYGH）はマレーシアを本拠とし、アジア全域でビルメンテナンス・施設管理サービスを展開する上場企業だ。ショッピングモール・ホテル・商業不動産が主な顧客となる。

2026年6月9日のGlobe Newswireプレスリリースで、同社はUnitree G1 Edu Ultimate B-U4ヒューマノイドの商用展開を発表した。

## 機体仕様と統合構成

展開機体のUnitree G1 Edu Ultimate B-U4は、標準G1に3D触覚センサーを内蔵した五指ハンドとNVIDIA Jetson Orinオンボードコンピュートを追加したモデルだ。清掃・巡回・物品補充などの作業に使われる予定で、既存のYY CircleワークフォースプラットフォームおよびIFMシステム（24IFM）と統合して運用される。

## 「清掃しながらデータ収集」のビジネスモデル

TechTimesの6月12日記事によると、YY Groupの戦略は単純な清掃業務の自動化にとどまらない。清掃員が専用データ収集ギアを装着して現場作業を行い、その動作データを取得してAIモデルの訓練に使用する仕組みも並行して構築している。

このモデルが確立されれば、ロボットが清掃しながら収集したデータを施設管理AI向けに販売・ライセンスするという副収益源が生まれる可能性がある。初期の稼働コストをデータ価値で一部相殺するこの構造は、ロボット導入のROI計算に新しい軸を加える。

## 日本のビルメン・施設管理業への示唆

日本のビルメンテナンス業界は、人口減少・高齢化による慢性的な人材不足に直面している。YY Groupのモデルが成立した場合、類似の展開を検討する上で参照すべき論点は次の通りだ。

- **機体選択の根拠**：Unitree G1 Eduは産業用とは異なる「開発者・教育向け」機。産業現場での耐久性・防塵防水・保守体制は本格商用展開前に確認が必要
- **ソフトウェア内製コスト**：既存プラットフォームとの統合開発には相応のエンジニアリング投資が必要。SIerの活用コストが意思決定の核になる
- **データ戦略の可能性**：施設管理データそのものが資産になるかどうかは日本の規制環境・顧客との契約条件によって変わる`,
    relatedRobotIds: ['unitree-g1'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'YY Group (NASDAQ YYGH) Launches Commercial Humanoid Robotics Initiative to Drive AI-Driven Margin Expansion and Address Global Facility Management Labor Shortages',
        url: 'https://www.globenewswire.com/news-release/2026/06/09/3309337/0/en/YY-Group-NASDAQ-YYGH-Launches-Commercial-Humanoid-Robotics-Initiative-to-Drive-AI-Driven-Margin-Expansion-and-Address-Global-Facility-Management-Labor-Shortages.html',
        publisher: 'Globe Newswire / YY Group',
        publishedAt: '2026-06-09',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'YY Group Deploys Humanoid Robots to Clean Buildings, and to Harvest Training Data',
        url: 'https://www.techtimes.com/articles/318297/20260612/yy-group-deploys-humanoid-robots-clean-buildings-harvest-training-data.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-12',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-miit-sasac-10000-directive-june2026',
    slug: 'china-miit-sasac-10000-directive-june2026',
    title: 'China\'s MIIT and SASAC issue joint directive: 10,000 humanoids deployed commercially by end-2026',
    titleJa: '中国MIITとSASACが合同指令──2026年末までにヒューマノイド1万台を商用展開。地方政府・国有企業に実施計画提出を義務化',
    type: 'policy-update',
    category: 'policy',
    section: 'policy',
    summary: '2026年6月10日、Caixin Globalが中国工業情報化部（MIIT）と国有資産監督管理委員会（SASAC）が合同で発令した指令を報じた。2026年末までに1万台超のヒューマノイドロボットを商用展開し、100以上の高付加価値活用シナリオを創出することを目標に定め、地方政府・国有企業に6月末までの実施計画提出を義務付けた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-11',
    author: 'Deploid Research',
    regionTags: ['china'],
    themeTags: ['market-analysis'],
    heroImage: {
      src: '',
      alt: 'China humanoid robot policy directive',
      credit: '',
      rights: {
        status: 'reference-attributed',
        sourceType: 'unknown',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '国家レベルの指令が「商用展開1万台」という数値目標を設定したことは、中国製ヒューマノイドの量産加速を政策面から強制力をもって後押しする。日本企業にとっては「中国製ロボットの供給量が2026年末に向けて急増する」という現実的なシナリオを前提として調達戦略を再設計する必要が生じる。RaaS（Robot as a Service）モデルの制度的支援が盛り込まれた点は、調達形態の多様化という観点でも注目すべき。',
    keyTakeaways: [
      'MIIT（工業情報化部）とSASAC（国有資産監督管理委員会）の合同指令。国有企業が対象に含まれる点が従来指針と異なる',
      '目標：2026年末までに1万台超の商用展開、100以上の高付加価値活用シナリオ創出',
      '対象業種：製造、物流・倉庫、小売、医療・介護、安全・設備検査、保守・点検、緊急対応・災害救助',
      '地方政府は6月末までに実施計画提出、11月末までに進捗報告が義務',
      'RaaS（Robot as a Service）モデルの採用を普及障壁低減策として積極的に奨励',
    ],
    body: `## 指令の内容

2026年6月10日、Caixin Globalは中国工業情報化部（MIIT）と国有資産監督管理委員会（SASAC）が連名で発令した指令を報じた。この指令は「体現AI（Embodied AI）の実産業への加速導入」を目標に掲げ、ヒューマノイドロボットの商用展開について具体的な数値目標と期限を設定している。

**数値目標**
- 2026年末までに1万台超のヒューマノイドを商用展開
- 100以上の高付加価値な活用シナリオを創出

**スケジュール**
- 地方政府・国有企業：6月末までに実施計画を提出
- 2026年11月末：進捗報告の提出

## SASACが名を連ねた意味

通常、産業政策の指令はMIITが単独で発令することが多い。今回の指令にSASAC（国有資産監督管理委員会）が加わったことは、国有企業が積極的な展開主体として位置付けられていることを示す。中国の国有企業は製造・物流・エネルギー・インフラ等の主要産業を担っており、SASACの参加は「政策目標の実施を推進する主体」が明確になったことを意味する。

## 対象とされる業種

指令が明示した適用業種は製造、倉庫・物流、小売、医療・介護、職場安全・設備検査、保守・点検、緊急対応・災害救助に及ぶ。eWeekの報道によると、北京発のRoboteraがChina PostとSF Holdingの10以上の物流センターにヒューマノイドを展開済みであることが、この指令の具体的な先行事例として言及されている。

## RaaS支援の意味

指令に含まれるRaaS（Robot as a Service）支援策は、「初期調達コストの高さ」という普及障壁を低減するための制度設計だ。企業が機体を購入するのではなく、稼働量・時間・成果に応じた利用料を払うモデルを制度的に後押しすることで、中小企業・地方国有企業が導入に踏み切りやすくする意図がある。

## 日本企業への示唆

政策主導の量産加速は、日本向け中国製ヒューマノイドの「供給量・価格・技術水準」を今後1〜2年で大きく変える可能性がある。重要な評価軸は2つだ。

第一に「量産された機体が産業現場で実際に機能するかどうか」。政策目標としての「1万台」は導入台数の上限ではなく下限目標に近い。実稼働・KPI達成率のデータが出揃う2026年末〜2027年初に、真の実用水準が見えてくる。

第二に「日本の規制・安全基準との適合」。中国の指令で設定された活用シナリオが日本の安全規制（労安法・機械安全規格）に合致するとは限らない。日本での展開には追加の安全適合プロセスが必要になる可能性が高い。`,
    relatedRobotIds: [],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'China Targets 10,000 Humanoid Robots in Commercial Use by End-2026',
        url: 'https://www.caixinglobal.com/2026-06-10/china-targets-10000-humanoid-robots-in-commercial-use-by-end-2026-102452656.html',
        publisher: 'Caixin Global',
        publishedAt: '2026-06-10',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China\'s 2026 Plan: Move 10,000 Humanoid Robots From Demos to Real Jobs',
        url: 'https://www.eweek.com/news/humanoid-robots-work-mode-2026-apac-china/',
        publisher: 'eWeek',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'China fast tracks humanoid robots and embodied AI into industry under nationwide programme',
        url: 'https://www.scmp.com/economy/china-economy/article/3356629/china-fast-tracks-humanoid-robots-and-embodied-ai-industry-under-nationwide-programme',
        publisher: 'South China Morning Post',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'china-humanoid-demand-gap-june2026',
    slug: 'china-humanoid-demand-gap-june2026',
    title: 'China built the humanoid factories — but buyers aren\'t showing up fast enough',
    titleJa: '工場は建った、買い手が足りない──中国ヒューマノイド「供給過剰・需要不足」の構造問題',
    type: 'market-analysis',
    category: 'analysis',
    section: 'business',
    summary: '中国のヒューマノイドロボット工場が急速に生産能力を拡大する一方、顧客側の実需が生産能力の増加ペースに追いついていない。現在の標準価格帯は約3万ドル（約430万円）で、北京の工場は年産50万台体制（2030年目標）に向けた計画を打ち出しているが、現実の受注環境との乖離が課題として浮上している。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-11',
    author: 'Deploid Research',
    regionTags: ['china'],
    themeTags: ['pricing', 'mass-production', 'market-analysis'],
    heroImage: {
      src: '',
      alt: 'Humanoid robot production line in China',
      credit: '',
      rights: {
        status: 'reference-attributed',
        sourceType: 'unknown',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「供給過剰・需要不足」の状況は価格下落圧力を生み、日本企業にとっては中国製ヒューマノイドの調達コストが今後数年で下がる可能性を示す。一方で、需要が追いつかない中での過剰生産は、ベンダーの財務リスク・品質管理リスクを高める。安さだけで選んだ場合にサポート継続が担保されない事態のリスクを評価変数に加える必要がある。',
    keyTakeaways: [
      '現在の標準ヒューマノイド価格：約3万ドル（約430万円）。北京の工場が年産50万台（2030年）を目指せばモルガン・スタンレーは1台あたり半額以下になると予測',
      '北京・Lingyi iTech工場：4月開業後300台生産済み、2026年に1万台目標。2030年までに年産50万台計画',
      '現実の課題：生産能力の拡大ペースに顧客の購入意欲が追いついていない（CNBC、6月8日報道）',
      '価格が下がっても「ロボットで何ができるか」「どう安全に使うか」が整理されなければ受注は増えない',
      'モルガン・スタンレーの予測：平均価格が2050年に約2万1,000ドルへ低下（長期推計）',
    ],
    body: `## 何が起きているか

2026年6月、CNBC・TechTimes・eWeekが相次いで報じた：中国のヒューマノイドロボット工場は生産能力を急拡大しているが、実需（購入意欲のある顧客）がそのペースについていけていない。

北京に4月開業したLingyi iTech（電子製品受託製造大手）の工場は、すでに300台のロボットを複数顧客向けに生産済みで、2026年に1万台、2030年までに年産50万台の計画を打ち出している。しかし、CNBCの6月8日ニュースレターは「中国は工場を建てた。今度は買い手が必要だ」と率直に問題を指摘した。

## 現在の価格帯と見通し

現在、稼働可能なヒューマノイドロボットの標準価格帯は約3万ドル（約430万円）だ。Lingyi iTechがCNBCに語ったところによると、年産50万台体制が整えば今日の約3万ドルという価格を半分以下に下げられる可能性があるという。モルガン・スタンレーは長期的に平均価格が約2万1,000ドル（2050年時点）まで低下すると予測しているが、これは長期推計であり確定値ではない。

## なぜ買い手が足りないのか

需要不足には構造的な理由がある。

**第一に、「何ができるか」が不明確だ**。自動車工場の特定ラインや航空グランドハンドリング等、スコープを絞った実証では成果が出始めているが、「どんな作業にも対応できる汎用機」としての実績はまだない。購買担当者が「これを買えば何が解決するか」を説明できない段階では、稟議が通りにくい。

**第二に、サポート体制が整っていない**。機体を納入しても、現場での調整・メンテナンス・ソフトウェアアップデートを担う体制が整っていないと実運用に移れない。特に中国国外での展開ではこの障壁が大きい。

**第三に、安全評価のコストが高い**。製造・物流現場で人間と共働させるには、安全リスクアセスメント・国内規格適合の確認に相当な時間とコストがかかる。

## 日本企業の立ち位置

この「供給過剰・需要不足」状況は日本のtoB事業者に2つの意味を持つ。

一つは**価格交渉のタイミング**。競争が激化している今は、複数ベンダーから見積もりを取り比較できる市場環境にある。「出てから考える」ではなく、評価フェーズに入ることで情報アドバンテージが得られる。

もう一つは**ベンダーリスクの評価**。需要が追いつかない中での過剰生産は、財務健全性の悪化→撤退・買収というリスクシナリオにつながる。「5年後もサポートを受けられるか」というベンダー継続性の評価を今から始めておくことが重要だ。`,
    relatedRobotIds: ['agibot-a2', 'unitree-g1'],
    relatedManufacturerIds: ['agibot', 'unitree'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'CNBC\'s The China Connection newsletter: Humanoid robots are great, but they need buyers too',
        url: 'https://www.cnbc.com/2026/06/08/cnbcs-the-china-connection-newsletter-who-will-buy-the-humanoids.html',
        publisher: 'CNBC',
        publishedAt: '2026-06-08',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Humanoid Robot Prices Near $30,000：Beijing Factory\'s 500,000-a-Year Plan May Halve Cost, Buyers Lag',
        url: 'https://www.techtimes.com/articles/318157/20260610/humanoid-robot-prices-near-30000beijing-factorys-500000-year-plan-may-halve-cost-buyers-lag.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-10',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'boston-dynamics-atlas-hyundai-rmac-june2026',
    slug: 'boston-dynamics-atlas-hyundai-rmac-june2026',
    title: 'Electric Atlas enters Hyundai RMAC for training — 2026 production fully committed to Hyundai and DeepMind',
    titleJa: '電動AtlasがHyundai RMAC（検証センター）に初投入──2026年生産分はHyundai・Google DeepMindで完売',
    type: 'deployment-report',
    category: 'news',
    section: 'deployment',
    summary: 'Boston Dynamicsの電動Atlas（2024年4月発表）が2026年、Hyundai Motor GroupのRobotics Metaplant Application Center（RMAC）に初投入された。2026年の全生産分はHyundaiとGoogle DeepMindで完売状態にある。Hyundaiは2026年のマルチ米国投資計画の中でAtlasを中心的な要素として位置付け、将来的に25,000台規模の工場展開を目指す。',
    publishStatus: 'published',
    updatedAt: '2026-06-25',
    reliability: 'reported',
    publishedAt: '2026-06-07',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    themeTags: ['mass-production', 'commercialization', 'labor'],
    heroImage: {
      src: '/images/article-generic/automotive-factory/hyundai-ioniq5-assembly-line.jpg',
      alt: 'Robot arms working on a Hyundai IONIQ 5 on an assembly line',
      credit: 'Hyundai Motor Group / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-white-car-is-on-a-assembly-line-mPreSMYIr1E',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Hyundai Motor Group',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote:
          'Boston Dynamics公式のAtlas画像はTerms of Use上ブロック済み（下記参照）。代わりにHyundai Motor Group自身がUnsplash Licenseで公開した自社工場の組立ライン画像を使用。Atlasの実機ではない。',
      },
    },
    whyItMatters:
      '「2026年生産分が完売」は、Atlasが研究デモ機から本格的な産業機への転換を果たした事実上の証明だ。HyundaiとDeepMindというパートナー構成（製造ライン＋AI基盤モデル）は、「ハードウェア量産×AIモデル統合」という競合優位を同時に確立しようとする戦略を示す。一方で韓国金属労組が労使協定なしの導入に反対しており、台数規模が大きいほど導入スケジュールは技術検証より労使交渉に左右されやすくなる。日本の自動車・製造業にとっては競合動向としてだけでなく、内製導入時の労務対応の参考事例として追う必要がある。',
    keyTakeaways: [
      '2026年の全生産分はHyundaiとGoogle DeepMindで完売。追加顧客への提供は2027年以降の予定',
      'Hyundai RMAC（ジョージア州）にてトレーニング・検証フェーズが進行中。工場ラインへの本格展開は2028年',
      'Hyundaiは2026年5月19日、投資家向け説明会でAtlasを2万5,000台超導入する中長期計画を公表。2028年に米ジョージア州Metaplant America、Kiaジョージア工場は2029年から稼働開始予定',
      '2028年までにAtlasの年産能力3万台、アクチュエーターの年産35万台規模の米国内生産拠点も計画',
      'Google DeepMindとの連携でGemini RoboticsモデルをAtlasの認知制御に統合（CES 2026発表）',
      '韓国金属労組の現代自動車支部は2026年1月22日、労使協定なしの導入を認めないと声明を出している',
    ],
    body: `## 「完売」の意味

2026年、Boston Dynamicsの電動Atlasは初の商用生産ロットを出荷した。しかし、その全台数が2顧客──親会社のHyundai Motor Groupと、AIパートナーのGoogle DeepMind──で占有されており、外部企業が今すぐ調達できる状態にはない。

Boston Dynamicsによれば、追加の顧客への提供は2027年以降になる見込みだ。現時点（2026年6月）でウェイティングリストへの登録を受け付けているかどうかは未確認（要確認）。

## Hyundai RMAC での動き

HyundaiはジョージアのMetaplant近くにRobotics Metaplant Application Center（RMAC）を設置し、Atlasの現場トレーニング・検証を行っている。RMACはロボットが実際の工場環境に近い条件で作業を学習するためのテストベッドとして機能する。工場ラインへの本格展開は2028年の見通しで、Hyundaiはグローバルの製造拠点に最大25,000台規模でAtlasを配備する計画を持つ。

## DeepMindとのGemini Robotics統合

2026年1月のCES発表でBoston Dynamicsはカルフォルニア州に本拠を置くGoogle DeepMindとのパートナーシップを発表し、DeepMindのGemini Robotics基盤モデルをAtlasの認知制御に統合することを明言した。言語理解→タスク計画→物理操作の三層を一貫した基盤モデルで処理する設計は、他社の「ルールベース制御＋固定タスク」のアプローチとは根本的に異なる。

## 「3万台/年」工場の意味

Hyundaiは2028年稼働を目標に、年産3万台体制のAtlas製造工場を建設中と報じられている。自動車製造ライン（月産数万台）と比較すると依然として桁が違うが、図はヒューマノイドが「試作品」から「製造業の製品ライン」に移行しつつあることを示す。

## 日本製造業への示唆

Hyundaiが先陣を切ってAtlasを工場に投入することは、競合する日本の自動車メーカー（トヨタ・Honda・日産等）がヒューマノイドのベンチマークとしてAtlasを評価せざるを得ない環境をつくる。「Hyundaiがどういう作業でどの程度の成果を出したか」という2028年以降のデータは、国内製造業のヒューマノイド評価の基準になる可能性が高い。現時点での日本企業のアクション項目は「情報収集とベンダーリスト整理」だ。

## 投資家向けに開示された2.5万台計画とアクチュエーター生産拠点（2026年6月25日追記）

Hyundai Motor Groupは2026年5月19日、米ボストンでの投資家向け説明会で、Atlasを自社・Kia工場に2万5,000台超導入する中長期計画を明らかにした。Korea TimesとKorea Heraldの報道によると、稼働開始は2028年に米ジョージア州のMetaplant Americaから、Kiaジョージア工場は2029年からを予定する。同時に、ロボットの「筋肉」となるアクチュエーターについても年産35万台規模の米国内生産拠点を新設する計画を公表した。これは外部メーカーの機体を一定期間借りて検証するBMW・Mercedes-Benz型のパイロットとは異なり、Hyundai自身が部品供給網まで垂直統合しようとする動きだ。日本の部品メーカー・商社にとっては、完成機の調達機会だけでなく、減速機・センサーなど自社の強み分野がこの垂直統合にどこまで取り込まれるかを継続的に確認する価値がある。

## 韓国労組が導入の前提条件を突きつけている

一方で、現代自動車支部の韓国金属労組（KMWU）は2026年1月22日、労使協定なしにAtlasを工場へ導入することを認めないとの声明を出している。Tech Timesの報道によると、労組は人員削減や労働条件への影響を懸念し、導入規模・配置・雇用への影響について事前協議を要求している。2万5,000台という規模は、既存の生産工程の一部を置き換える前提でなければ説明しにくい数字であり、労使交渉の行方が実際の導入スケジュールを左右する可能性がある。日本企業が同等規模の内製導入を検討する場合も、技術検証と並行して労働組合・従業員への説明プロセスをいつ・どの粒度で行うかの準備が論点になる。`,
    relatedRobotIds: ['boston-dynamics-atlas'],
    relatedManufacturerIds: ['boston-dynamics'],
    relatedUseCaseIds: ['research-development', 'factory-assembly-support'],
    sources: [
      {
        title: 'Boston Dynamics\' electric Atlas robot just sold out its entire 2026 production run',
        url: 'https://www.msn.com/en-us/money/other/boston-dynamics-electric-atlas-robot-just-sold-out-its-entire-2026-production-run-every-unit-already-claimed-by-hyundai-and-google-s-deepmind-lab/ar-AA23TkRC',
        publisher: 'MSN / Business Insider',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Atlas humanoid robots enter Hyundai factories for industrial use',
        url: 'https://newatlas.com/ai-humanoids/boston-dynamics-production-atlas-hyundai/',
        publisher: 'New Atlas',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Hyundai Motor Group Announces AI Robotics Strategy to Lead Human-Centered Robotics Era at CES 2026',
        url: 'https://www.hyundai.com/worldwide/en/newsroom/detail/hyundai-motor-group-announces-ai-robotics-strategy-to-lead-human-centered-robotics-era-at-ces-2026-0000001100',
        publisher: 'Hyundai Motor Group',
        publishedAt: '2026-01-05',
        checkedAt: '2026-06-13',
        reliability: 'official',
      },
      {
        title: 'Hyundai Motor Group unveils plan to deploy 25,000 Atlas humanoid robots',
        url: 'https://www.koreatimes.co.kr/business/companies/20260519/hyundai-motor-group-unveils-plan-to-deploy-25000-atlas-humanoid-robots',
        publisher: 'Korea Times',
        publishedAt: '2026-05-19',
        checkedAt: '2026-06-25',
        reliability: 'reported',
      },
      {
        title: 'Hyundai Motor Group to deploy 25,000 Atlas robots across factories',
        url: 'https://www.koreaherald.com/article/10741955',
        publisher: 'The Korea Herald',
        publishedAt: '2026-05-19',
        checkedAt: '2026-06-25',
        reliability: 'reported',
      },
      {
        title: 'Hyundai Commits 25,000 Atlas Robots to Own Factories: Union Blocks Deployment Without Labor Deal',
        url: 'https://www.techtimes.com/articles/317005/20260522/hyundai-commits-25000-atlas-robots-own-factories-union-blocks-deployment-without-labor-deal.htm',
        publisher: 'Tech Times',
        publishedAt: '2026-05-22',
        checkedAt: '2026-06-25',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'robotera-china-post-logistics-june2026',
    slug: 'robotera-china-post-logistics-june2026',
    title: 'RobotEra\'s Xingdong M7 sorts 1,200 parcels/hour at China Post — a human processed 192 more in the same test',
    titleJa: 'RobotEraの Xingdong M7 が中国郵政で1,200個/時を達成──同条件の人間は1,392個。「効率85%」の現実と意味',
    type: 'deployment-report',
    category: 'analysis',
    section: 'deployment',
    summary: '北京のRobotEraが開発したXingdong M7（固定式上半身ヒューマノイド）が、China PostとSF Holdingの合計10か所超の物流センターに展開され、仕分け作業において時間当たり1,200個の処理能力を達成した。同条件での人間の処理量は1,392個。Robotics and Automation NewsおよびInteresting Engineeringが6月に報じた。',
    publishStatus: 'published',
    updatedAt: '2026-06-13',
    reliability: 'reported',
    publishedAt: '2026-06-12',
    author: 'Deploid Research',
    industryTags: ['logistics'],
    regionTags: ['china'],
    themeTags: ['commercialization'],
    heroImage: {
      src: '',
      alt: 'RobotEra Xingdong M7 robot sorting parcels at China Post logistics center',
      credit: 'RobotEra',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        checkedAt: '2026-06-13',
      },
    },
    whyItMatters:
      '「人間比85%の効率」という実測値は、ヒューマノイドの現実的な生産性を判断する珍しいベンチマークだ。「人間以下の効率でも使う理由はあるか」という問いへの答えが、夜間連続稼働・人材不足の補完・安全管理コスト削減などに具体的に分解できるようになる。物流・郵便業界で仕事を始めた「準ヒューマノイド」が日本での同種評価のベースラインを提供する。',
    keyTakeaways: [
      'Xingdong M7は固定式上半身ロボット（7 DoFアーム×2＋12 DoFハンド）。移動脚は持たない「スタンド固定型」',
      '仕分けテスト結果：ロボット1,200個/時 vs 人間1,392個/時（効率86.2%）',
      '10か所超のChina Post・SF Holding物流センターに展開済み。RobotEraは2026年Q2から1,000台単位の出荷を開始',
      'RobotEraは2026年5月に2億ドルの資金調達を完了（別途報道）',
      '「1,200個/時」の条件詳細（稼働時間・エラー率・人間の監視介入率など）は未公表',
    ],
    body: `## Xingdong M7 とは何か

RobotEra（本拠：北京）が開発したXingdong M7は、コンベアベルト沿いに設置される固定スタンド式の上半身ロボットだ。7自由度のアームを2本と12自由度のハンドを持ち、多様な形状の荷物を識別・把持・仕分けできる。「ヒューマノイド」の定義に固定式が含まれるかは議論があるが、形状・機能設計は人間の上半身に近い。

移動機能（脚・車輪）を持たないことで、バランス制御の複雑さを排除し仕分け精度と速度に特化している。これは「物流倉庫の一定の作業区域内」という構造化環境では合理的な設計判断だ。

## テスト結果の読み方

Interesting Engineeringの報道によると、同一テスト条件でXingdong M7は1,200個/時を処理し、人間作業者は1,392個/時を処理した。差は192個（約13.8%）で、ロボットの効率は人間比86.2%だ。

この数字をそのまま「まだ人間に劣る」と読むのは不正確だ。評価する際には次の変数を加える必要がある。

- **連続稼働**：ロボットは休憩なしで24時間稼働できる。1日3シフト体制でシフトあたり8時間の場合、実効処理量は日間比較で変わる
- **深夜稼働コスト**：深夜・早朝シフトの人材確保コスト・割増賃金が不要になる
- **人材不足下の絶対値**：人が集まらない状況では「1,200個/時できるロボット」と「0個/時（人がいない）」の比較になる

一方で、エラー率・破損率・人間の監視介入頻度・稼働率（メンテナンス停止時間）といった指標は公表されていない（要確認）。1,200個/時という数値の「品質」を独立に評価する情報は現時点では不足している。

## 10か所超への展開規模

RobotEraはChina PostとSF Holdingの合計10か所超の物流センターへの展開を達成しており、Robotera社は2026年Q2から1,000台単位の出荷を開始していると報じられた。また2026年5月には2億ドルの資金調達も完了している（別記事）。

## 日本の物流業への示唆

日本の物流・郵便業界は、人口減少による人材不足に加えて、2024年問題（ドライバーの時間外労働規制）以降の深刻な労働力制約を抱える。「人間比85〜90%の効率で24時間稼働できる機体」が有効かどうかは、「人件費 vs 機体コスト＋保守コスト」の計算だけでなく「そもそも人が集まらない状況でのスループット保証」という観点から評価する必要がある。

Xingdong M7はRobotEraの機体で、国内代理店・保守体制は2026年6月時点で未確認（要確認）。中国国外での展開実績は限定的とみられる。`,
    relatedRobotIds: [],
    relatedManufacturerIds: ['robotera'],
    relatedUseCaseIds: ['warehouse-picking'],
    sources: [
      {
        title: 'China Post deploys humanoid robots to sort 1,200 parcels per hour',
        url: 'https://interestingengineering.com/ai-robotics/china-deploys-humanoid-robots-in-postal-hub',
        publisher: 'Interesting Engineering',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Humanoid Robots Are Now Sorting Packages at China\'s Postal Hubs. A Human Still Beat One by 192 Parcels',
        url: 'https://www.revolutioninai.com/2026/06/china-post-humanoid-robots-package-sorting-2026.html',
        publisher: 'Revolution In AI',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
      {
        title: 'Robotera Expands Global Humanoid Robot Deployment After Securing $200M Investment',
        url: 'https://news.fundsforngos.org/2026/05/15/robotera-expands-global-humanoid-robot-deployment-after-securing-200m-investment/',
        publisher: 'Funds for NGOs / Press Release',
        publishedAt: '2026-05-15',
        checkedAt: '2026-06-13',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'onex-neo-preorder',
    slug: 'onex-neo-preorder',
    title: '1X opens NEO pre-orders at $20K / $499 per month subscription',
    titleJa: '1X、家庭向けヒューマノイド NEO の予約を開始（買い切り $20K または月額 $499）',
    type: 'news-brief',
    category: 'news',
    section: 'business',
    summary: 'OpenAI出資の 1X Technologies が二足ヒューマノイド NEO の米国向け予約販売を2025年10月に開始。買い切り 20,000 USD と月額 499 USD のサブスクリプションが提示された。配送は2026年。',
    publishStatus: 'published',
    updatedAt: '2026-06-02',
    reliability: 'reported',
    publishedAt: '2026-05-28',
    author: 'Deploid Research',
    themeTags: ['business-model', 'consumer'],
    heroImage: {
      src: '',
      alt: '1X NEO ヒューマノイドロボット',
      credit: '1X Technologies',
      sourceUrl: 'https://www.1x.tech/',
      rights: {
        status: 'blocked',
        sourceType: 'manufacturer-official',
        rightsHolder: '1X Technologies',
        checkedAt: '2026-06-19',
        permissionNote:
          '2026-06-08に「公式プレスキット」として commercial-permitted 登録されていたが、2026-06-19に1X Press Gallery (1x.tech/press) の実際の利用条件を確認したところ "for media use only" "not for commercial purposes" と明記されており誤分類だったため非表示化。',
      },
    },
    whyItMatters:
      '消費者価格帯のヒューマノイドが「サブスクリプション」で提供される初期事例の1つ。toB の導入判断でも「買う」「リース」「RaaS」「サブスク」の選択肢が広がる動きとして参照価値がある。',
    keyTakeaways: [
      '価格：買い切り 20,000 USD または月額 499 USD（米国向け）',
      '予約金200 USD、配送は2026年から米国早期顧客へ',
      '家庭利用前提の安全設計。産業現場での運用は別途リスクアセスメントが必要',
    ],
    body: `## サブスクリプション型ヒューマノイドとは何か

1X Technologies（旧 1X）が発表した NEO は、20,000ドルの買い切りと月額499ドルのサブスクリプションという2つの調達モデルを提示した。配送は2026年から米国の早期顧客から順次開始される予定だ。

OpenAI が出資していることで知られる同社は、家庭向けを主ターゲットとしている。NEO のデザインは人間の生活空間に合わせており、身長・可搬重量・安全設計が産業機とは異なる前提で作られている。

## B2B 文脈での読み方

家庭向け機が「なぜ B2B 調達担当者に関係するか」という問いへの答えは、調達モデルの変化にある。月額499ドルという価格設定は、産業向けの RaaS 契約が今後どう設計されるかの参照点になる。また、消費者向けで培われた「壊れにくさ・使いやすさ・アップデート提供モデル」が産業機に転用されるケースは、自動車・スマートフォン産業でも起きてきた。

## 現時点での留意点

NEO の安全設計は家庭利用前提だ。産業現場での利用には安全評価・責任分界の整理が別途必要になる。また米国向け予約のため、日本での調達・保守サポートは現時点で未確認。価格モデルの参照としては有益だが、実導入候補としての評価は別フェーズで行うことを推奨する。`,
    relatedRobotIds: ['onex-neo'],
    relatedManufacturerIds: ['onex'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'NEO Home Robot | Order Today',
        url: 'https://www.1x.tech/discover/neo-home-robot',
        publisher: '1X Technologies',
        checkedAt: '2026-05-28',
        reliability: 'official',
      },
    ],
  },
  // ── 2026年 追加記事（第2弾）──────────────────────────────────────────
  {
    id: 'tesla-optimus-gen3-fremont-2026',
    slug: 'tesla-optimus-gen3-fremont-2026',
    title: 'Tesla ends Model S/X production at Fremont to build Optimus Gen 3 — 1,000+ robots already on factory floor',
    titleJa: 'テスラ、フリーモント工場のModel S/X生産ラインをOptimus Gen 3製造に転換──工場内にすでに1,000台超稼働',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: '2026年、TeslaはフリーモントのModel SおよびModel Xの生産ラインを段階的にOptimus Gen 3の製造拠点へ転換している。2026年1月時点でOptimus Gen 3は1,000台超がフリーモント工場内で稼働中。Gen 3完全量産は2026年夏を目標とし、最終的に年産100万台体制を目指す。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    themeTags: ['mass-production', 'commercialization'],
    heroImage: {
      src: '/images/article-generic/industrial-automation/factory-orange-machines.jpg',
      alt: 'Industrial robotic arms on a factory production line',
      credit: 'Simon Kadula / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-factory-filled-with-lots-of-orange-machines-8gr6bObQLOI',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Simon Kadula',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote:
          'Tesla公式のOptimus画像は許諾未確認のため使用しない。Unsplash Licenseの汎用工場イメージで代替。Optimus実機ではない。',
      },
    },
    whyItMatters:
      'Teslaが自動車量産ノウハウと巨大な垂直統合サプライチェーンをロボット製造に転用しようとしている事実は、ヒューマノイド業界の競争地図を塗り替える可能性がある。「年産100万台」という目標値の実現可能性はともかく、Teslaが本気でOptimus量産に踏み込んだことで他社の製造コスト・調達コストへのプレッシャーが高まる。COGS $20K目標が実現すれば、日本企業がヒューマノイドを評価する際の価格下限の参照点を大きく動かす。',
    keyTakeaways: [
      '2026年1月時点でOptimus Gen 3が1,000台超、フリーモント工場内で自社製造ラインに従事',
      'Model S / Model X の生産は2026年Q2に終了。転換された同ラインがGen 3製造に充当される',
      'Gen 3の完全量産体制（フルボディ）は2026年夏を目標。Musk氏は2026年3月のAbundance Summitで「Gen 3はすでに歩いている」と発言',
      'COGS目標：$20,000/台以下（量産スケール時）。外部商用顧客への販売は2026年末以降、B2B価格はそれより高い見通し',
      '年産100万台体制を最終目標とするが、現在の生産ラインはその数十分の一規模。量産ロードマップは定期的な更新が必要',
    ],
    body: `## 何が変わったか

2026年、Teslaはフリーモント工場における自動車生産の一部を意図的に縮小し、人型ロボットの製造へシフトする決断を実行に移した。Model SとModel Xの生産は2026年第2四半期に終了し、解放された生産ラインがOptimus Gen 3の製造拠点に転用される。

この決断の重みは数字が示す。Teslaの公式X投稿によると、フリーモントには現在パイロット生産ラインが稼働しており、Elon Muskは2026年1月時点で「Gen 3が1,000台超、工場内でテスト稼働中」と確認している。これは純粋に「工場のインフラを使って社内テストを兼ねる」形態だが、生産量と稼働規模は他社の実証と一線を画す。

## Gen 3 の進化点

Optimus Gen 3は、先行するGen 1・Gen 2と比較して製造コストと制御精度の両面で大きく前進している。TechTimesの6月9日報道によると、Tesla社内ではCOGS（製造原価）$20,000/台以下を目標として設定しており、量産スケール時にはこの水準が射程に入ると見られる。

制御面では、カメラと力センサーを用いたオンデバイス推論がより洗練されており、工場内の反復的な組立・マテハン作業を単独で実行する段階に近づいている。ただし、現時点で稼働する1,000台超は「実産業用途の最終仕様」ではなく、Teslaが自社工場をテストベッドとして使うモデルの産物だ。稼働率・ダウンタイム・人間の補助介入率は非公表（要確認）。

## フリーモント転換の意味

Model SとModel Xは2012年・2015年以来Teslaの旗艦製品として君臨してきた。その製造ラインをロボットに転換するのは象徴的な変化だ。自動車ラインの特徴——高精度な組立工程、大型の搬送設備、膨大な生産管理データ——がそのままロボット製造に転用できるわけではないが、Teslaは「工場全体の最適化」「品質管理データの蓄積」「部品サプライチェーンの交渉力」を車と共用できる点で構造的な優位を持つ。

また、Teslaは自社工場をOptimus Gen 3のテストベッドとして使い続けることで、「工場で実際に使える機体」を開発する最短経路を取っている。この自社工場×自社ロボットの垂直統合モデルは、外部の顧客企業にとっては「Teslaが出荷を始めたときの機体は工場稼働実績がある」ことを意味し、信頼性評価の参照点になる。

## 外部商用顧客への販売は2026年末以降

現在のOptimus量産は自社工場向けが中心で、外部企業への販売は2026年末以降が見通しとされる。最初の外部商用顧客への提供は「エンタープライズ／B2B向けで$20〜30K目標価格より大幅に高い価格帯になる」と示唆されており（TechTimes）、初期顧客向けの価格は$100K超になる可能性がある。

## 日本企業が確認すべきこと

現時点でOptimus調達を検討しても調達経路はない。ただし、以下の変数を継続ウォッチすることが重要だ。

- **COGS $20Kのタイムライン**：実現すれば競合機の価格下落を強制する。Unitree G1の$13.5K〜に続く価格破壊の可能性がある
- **外部販売条件**：2026年末に最初の顧客発表があれば、業種・用途・契約形態が明らかになる
- **自動車以外の用途展開**：Teslaの初期ターゲットは自動車工場。日本の製造業・物流業が調達対象になるタイムラインは別途評価が必要
- **日本代理店**：現時点で国内代理店・保守体制は未公表（要確認）`,
    relatedRobotIds: ['tesla-optimus'],
    relatedManufacturerIds: ['tesla'],
    relatedUseCaseIds: ['factory-assembly-support'],
    sources: [
      {
        title: 'Tesla Is Turning Its Model S Line Into an Optimus Robot Factory: Gen 3 Targets a 2026 Production Start',
        url: 'https://www.techtimes.com/articles/318071/20260609/tesla-turning-its-model-s-line-optimus-robot-factorygen-3-targets-2026-production-start.htm',
        publisher: 'TechTimes',
        publishedAt: '2026-06-09',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Tesla on X: Optimus pilot production line is currently running in our Fremont Factory',
        url: 'https://x.com/Tesla/status/1986558797947580555',
        publisher: 'Tesla (X / Twitter)',
        checkedAt: '2026-06-15',
        reliability: 'official',
      },
      {
        title: 'Tesla Optimus 3 Production Timeline: Summer 2026 Launch, 10M Unit Goal & Annual Iteration Plan',
        url: 'https://www.tesery.com/blogs/news/elon-musk-reveals-aggressive-production-timeline-for-tesla-optimus-3',
        publisher: 'Tesery',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Tesla Optimus at Fremont: Gen 3 Humanoid Deployment & Mass Production Update 2026',
        url: 'https://ifactoryapp.com/industries/automotive-manufacturing/tesla-optimus-fremont-gen-3-humanoid-2026',
        publisher: 'iFactory',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'meti-japan-physical-ai-strategy-2026',
    slug: 'meti-japan-physical-ai-strategy-2026',
    title: 'METI targets 30% of global physical AI market by 2040, backs it with ¥387B in FY2026',
    titleJa: '経産省が「フィジカルAI国家戦略」を策定──2040年に世界シェア30%目標、FY2026に3,870億円投資',
    type: 'policy-update',
    category: 'policy',
    section: 'policy',
    summary: '経済産業省（METI）は2026年3月、産業用ロボット・ヒューマノイドを含む「フィジカルAI」を国家戦略として重点化し、2040年までに世界市場シェア30%の獲得を目標に掲げた。FY2026予算にはAI・半導体関連として¥1.23兆（約80億ドル）が計上され、このうちフィジカルAI向けに専用で¥387億を配分する。日本の生産年齢人口は2023〜2060年に31%減少する見通しで、2040年に1,100万人の労働力不足が迫っている。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    regionTags: ['japan'],
    themeTags: ['market-analysis'],
    heroImage: {
      src: '/images/article-generic/japan-policy/japan-flag-building.jpg',
      alt: 'Japanese flag flying atop an office building',
      credit: 'Agustina Perretta / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/flag-of-japan-on-top-of-building-HBDbNr16z_s',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Agustina Perretta',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Unsplash Licenseの汎用イメージ。日本の政策テーマを示す代替画像として使用。',
      },
    },
    whyItMatters:
      '経産省が「フィジカルAI」を独立した政策分野として予算化したことは、日本のtoB企業がヒューマノイド導入を検討する際の環境を大きく変える。補助金・実証支援・安全規格整備がこの政策の下で加速すれば、導入コストと規制リスクの両面で条件が改善する可能性がある。一方で、「目標設定」と「実行」が乖離してきた日本の産業政策の歴史を踏まえると、進捗指標と具体的な施策の中身を継続追跡する必要がある。',
    keyTakeaways: [
      'FY2026 AI・半導体予算：¥1.23兆（前年比約4倍）。うちフィジカルAI向け専用枠：¥387億',
      '5カ年計画：フィジカルAI産業育成に¥1兆（約67億ドル）を投入する方針（2026年公表）',
      'METIの2040年目標：グローバルフィジカルAI市場シェア30%の獲得',
      '背景：2040年に1,100万人の労働力不足が予測。日本の生産年齢人口は2023〜2060年に31%減少見込み',
      '日本の産業用ロボット市場シェアは2022年時点で世界の約70%。この優位をフィジカルAIに転換する構図だが、米中スタートアップへの技術的遅れが課題',
    ],
    body: `## 「フィジカルAI」を国家戦略に格上げした意味

2026年3月、経済産業省（METI）は産業用ロボット・ヒューマノイドを含む「フィジカルAI」（ソフトウェアが物理機械を制御するAIシステム）を国家戦略として重点化した。FY2026予算にはAI・半導体関連で¥1.23兆（前年比約4倍）が計上され、このうちフィジカルAI向けに¥387億が専用配分される。

さらに政府は5カ年計画として、フィジカルAI産業の国内育成に¥1兆（約67億ドル）を投じる方針を公表した。METIが示した2040年の野心的な目標は「世界のフィジカルAI市場で30%のシェア獲得」だ。

## なぜ今か：人口動態と労働力不足

この政策の背景には日本が直面する構造問題がある。METIの推計によると、2040年までに1,100万人の労働力不足が生じる見込みだ。日本の生産年齢人口は2023年から2060年の間に31%減少すると予測されており、製造・物流・介護・清掃などの現場で深刻な採用難が続く。

TechCrunchが2026年4月5日に報じた記事のタイトルは示唆的だ——「日本では、ロボットはあなたの仕事を奪いに来るのではなく、誰もやりたがらない仕事を埋めに来ている」。食品工場の深夜シフト、空港のグランドハンドリング、物流倉庫の早朝仕分け——こうした「人が集まらない業務」こそがヒューマノイドの最初の市場になっている。

## 産業用ロボットの実績とフィジカルAIの課題

日本は2022年時点で世界の産業用ロボット市場の約70%を占める。ファナック・安川電機・川崎重工・デンソーといった企業が産業ロボットの実質的な標準を作ってきた。

しかしフィジカルAI（自律判断・汎用操作・言語インターフェース統合を含む）では、スタートアップエコシステムが弱く、米国・中国の新興企業に先行を許している。METIの政策はこの差を「投資と規格整備」で埋めようとする試みだが、スタートアップのエコシステム育成には時間がかかる。KraneSharesの分析では、日本は「最も切迫した需要側の一つ」でありながら「供給側（humanoid maker）では先行勢力に追いついていない」と評価されている。

## 政策が日本のtoB企業に意味すること

今回の政策は、「ヒューマノイドを導入する側」の企業にも実質的な影響を与える。

**実証補助金の拡大**：フィジカルAI向けの予算化は、中小企業も申請しやすい補助金スキームの整備につながる可能性がある。航空・物流・介護の実証事業に国費が入れば、先行企業の実証コストが一部カバーされる。

**安全規格の整備加速**：現在の日本の法規制は「人間と協働するヒューマノイド」を明示的に想定していない部分が多い。国策化によって整備のスピードが上がれば、企業側の導入判断がしやすくなる。労働安全衛生法・機械安全規格の更新タイムラインが政策指標の一つになる。

**2040年目標の読み方**：ただし、「目標設定」と「実行成果」が乖離してきた日本の産業政策の歴史を踏まえると、METIが掲げる30%シェアを額面通りに受け取るのはリスクがある。FY2026予算の執行先と、2027年以降の進捗指標を追跡することで、政策の実効性を継続的に評価することが必要だ。目標よりも「今から3年間でどこに補助金が流れるか」の方が、個別企業の導入判断に直接影響する。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Japan quadruples chip and physical AI spending, deepens state backing for Rapidus',
        url: 'https://www.digitimes.com/news/a20251226PD237/rapidus-budget-industrial-semiconductors-expansion.html',
        publisher: 'Digitimes',
        publishedAt: '2025-12-26',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: "In Japan, the robot isn't coming for your job; it's filling the one nobody wants",
        url: 'https://techcrunch.com/2026/04/05/japan-is-proving-experimental-physical-ai-is-ready-for-the-real-world/',
        publisher: 'TechCrunch',
        publishedAt: '2026-04-05',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Physical AI Japan: The Urgent Strategy Deploying Robots for National Survival',
        url: 'https://www.mexc.co/news/1005897',
        publisher: 'MEXC News',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Robot Industry — METI Ministry of Economy, Trade and Industry',
        url: 'https://www.meti.go.jp/english/policy/mono_info_service/robot_industry/index.html',
        publisher: 'METI',
        checkedAt: '2026-06-15',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'humanoids-summit-tokyo-may2026',
    slug: 'humanoids-summit-tokyo-may2026',
    title: 'Humanoids Summit lands in Tokyo for the first time — 2,000 attendees, Boston Dynamics to Chinese startups',
    titleJa: 'Humanoids Summit、初の東京開催──2,000人・30カ国が集結。Boston DynamicsからBooster・LimXまで',
    type: 'event-report',
    category: 'news',
    section: 'business',
    summary: '2026年5月28〜29日、ヒューマノイドロボット業界の国際フォーラム「Humanoids Summit」が初めて日本（高輪コンベンションセンター）で開催された。30カ国・300社から2,000人が参加し、Boston Dynamics・Toyota・Booster Robotics・LimX Dynamicsなどが実機デモを披露。「実験から量産・商用展開へ」をテーマに、日本の製造・物流・介護業の購買担当者が直接参加できる初の国際フォーラムとなった。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    regionTags: ['japan'],
    themeTags: ['commercialization', 'market-analysis'],
    heroImage: {
      src: '/images/article-generic/conference-expo/speaker-stage-audience.jpg',
      alt: 'Speaker presenting on stage to a tech conference audience',
      credit: 'Carlos Gil / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/speaker-presenting-on-stage-to-an-audience-AsxOJcsaR4g',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Carlos Gil',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Unsplash Licenseの汎用イメージ。Humanoids Summit Tokyo公式写真ではなく、カンファレンスのテーマを示す代替画像として使用。',
      },
    },
    whyItMatters:
      'グローバルのヒューマノイド業界が「東京に来た」という事実は象徴的だ。日本市場への参入意欲を持つ海外メーカーが増えたことと、日本の製造・物流・介護業が「実際の顧客」として認識されてきたことの両方を示す。フォーラムに参加した企業リストは、今後1〜2年で日本に参入しようとしているプレイヤーのショートリストでもある。「誰が来ていないか」も同様に重要なシグナルだ。',
    keyTakeaways: [
      '開催：2026年5月28〜29日、高輪コンベンションセンター（東京）。第4回目のHumanoids Summit、初の日本・アジア開催',
      '規模：2,000人参加・30カ国・300社。海外展示主体のイベントが日本の購買担当者と同じ空間で交差した初のケース',
      '主要参加：Boston Dynamics、Toyota Motor Corp.、Booster Robotics、LimX Dynamics（中国新興企業）など',
      '実機デモ：繊細な操作タスク（精密部品・食材ハンドリング等）を各社が実演。Interesting Engineeringは「観客を驚かせた」と報じた',
      'テーマ「パイロットからプラットフォームへ」：PoC単発ではなくスケーラブルな展開モデルの設計が議題の中心',
    ],
    body: `## Humanoids Summit が日本に来た意味

2026年5月28〜29日、ヒューマノイドロボット業界の国際フォーラム「Humanoids Summit」が初めてアジアに、そして東京に上陸した。高輪コンベンションセンターに集まった2,000人・30カ国・300社の顔ぶれは、この産業が「研究者と投資家のフォーラム」から「実際の発注者と売り手が会う場」に変わりつつあることを示している。

過去3回は北米・欧州で開催されてきたが、4回目を日本で開く判断は市場の重心が変わったことを意味する。日本は製造・物流・介護のいずれでも深刻な人材不足を抱え、世界の中でもヒューマノイドを「実際に使う立場」として最初に検討し始めている国の一つだ。RoboticsTomorrowは2026年4月8日の記事で「グローバルのロボット産業が日本のために収束している」と表現した。

## 何が展示されたか

Japan TimesとNikkei Asiaの報道によると、今回のフォーラムの特徴はライブデモが「動画映え」ではなく「実作業」に振られていた点だ。

**Boston Dynamics（Atlas）**：工場環境に近い設定で資材のピックアンドプレースを実演。ユーザーへの自然言語指示への対応も含む形で、従来の「スタント動画」的なアクロバットデモとは一線を画すプレゼンテーションが評価された。

**Toyota Motor Corp.**：自動車製造での協働ロボット活用事例を中心に展示。Toyotaは独自ヒューマノイド研究と外部製ヒューマノイドの活用を並行させる戦略を示した。

**Booster Robotics・LimX Dynamics（中国スタートアップ）**：中国勢の存在感が際立った。両社はデリケートなタスク（精密部品のグリップ、食材ハンドリング）のデモを披露し、Interesting Engineeringは「観客を驚かせた」と報じた。欧米系とは異なる低コスト・高量産ペースのモデルが日本の購買担当者に直接見せられた。

## テーマ「パイロットからプラットフォームへ」

今回のアジェンダの中心は「商業化とスケールの経路」だ。個別の成功事例（BMW、GXO等）がどうすれば他の企業・他の現場に展開できる「プラットフォーム」になるかが議論された。具体的な論点は以下の三点だ。

- **世界モデルと空間AI**：固定タスクの事前プログラミングから、環境の変化に対応できる世界モデルへの移行がスケール展開の前提になる
- **製造量産とサプライチェーン**：単品・少量の試作品から千台・万台規模の量産への転換。アクチュエーター・センサー・バッテリーの確保が課題
- **資本配分**：投資家がPoC段階から量産段階へのシフトを始めており、資金調達の前提条件が変わっている

## 日本企業が読み取るべきシグナル

Humanoids Summitが東京で開かれたことは、今後1〜2年で日本への参入を本気で考えているプレイヤーが明確になったことでもある。参加した海外企業は「日本市場に興味がある」というシグナルを自ら出した。

「誰が来ていないか」もチェックポイントだ。Tesla・Figure AIといったトップ企業が出席しているかどうかは、彼らの日本市場優先度の目安になる（要確認）。一方でBooster・LimXといった中国新興企業が積極的に参加したことは、中国製機体が日本市場を直接開拓しようとしていることを示す。`,
    relatedRobotIds: ['boston-dynamics-atlas', 'booster-t1'],
    relatedManufacturerIds: ['boston-dynamics', 'booster-robotics', 'limx-dynamics'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Humanoids Summit gives Tokyo a peek of a robotic future',
        url: 'https://www.japantimes.co.jp/business/2026/05/28/tech/tokyo-humanoid-summit/',
        publisher: 'The Japan Times',
        publishedAt: '2026-05-28',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Humanoid robots strut their stuff as trade show comes to Japan',
        url: 'https://asia.nikkei.com/business/technology/humanoid-robots-strut-their-stuff-as-trade-show-comes-to-japan',
        publisher: 'Nikkei Asia',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Humanoid robots stun crowd by doing delicate tasks at Tokyo summit',
        url: 'https://interestingengineering.com/ai-robotics/humanoids-robots-stun-crowd-at-tokyo-summit',
        publisher: 'Interesting Engineering',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Global Robotics Industry Converges on Japan for Humanoids Summit Tokyo 2026',
        url: 'https://www.roboticstomorrow.com/news/2026/04/08/global-robotics-industry-converges-on-japan-for-humanoids-summit-tokyo-2026/26378/',
        publisher: 'RoboticsTomorrow',
        publishedAt: '2026-04-08',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'apptronik-apollo-935m-series-a-2026',
    slug: 'apptronik-apollo-935m-series-a-2026',
    title: "Apptronik closes $935M Series A — Google, Mercedes-Benz, AT&T and John Deere back Apollo's commercial push",
    titleJa: 'ApptronikがシリーズA総額$9.35億で完了──Google・Mercedes・AT&T・John DeereがApollo商用化に投票',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary: '2026年2月11日、TexasのApptronikはシリーズAの延長ラウンドで$5.2億を追加調達し、シリーズA総額を$9.35億に積み上げた。累計調達額は約$10億に達する。Google・Mercedes-Benz・B Capitalといった既存投資家に加え、AT&T Ventures・John Deere・カタール投資庁（QIA）が新規参加。Apolloは現在Mercedes-Benz工場とGXO物流センターでパイロット稼働中で、2026年内の商用量産開始を目標とする。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    themeTags: ['funding', 'commercialization'],
    heroImage: {
      src: '/images/article-generic/finance-funding/stock-chart-dark-screen.jpg',
      alt: 'Stock market candlestick chart on a dark screen',
      credit: 'Maxim Hopman / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/fiXLQXAhCfk',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Maxim Hopman',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Apptronik公式のApollo画像は許諾未確認のため使用しない。Unsplash Licenseの汎用資金調達イメージで代替。Apollo実機ではない。',
      },
    },
    whyItMatters:
      'ヒューマノイド業界の資金調達が「スタートアップのVC調達」から「大型産業プレイヤーのコーポレートVCが参戦」するフェーズに移行しつつある。John DeereとAT&Tが同一ラウンドに参加したことは、農業機械・通信インフラという異なる産業がヒューマノイドを自社オペレーションに組み込む計画を持ち始めたことを示す。Mercedes-BenzがApolloを工場に投入し続けていることは、欧州自動車産業のベンチマークとして機能し、日本の自動車・製造業にとっても評価の参照点になる。',
    keyTakeaways: [
      '2026年2月11日：シリーズA延長ラウンドで$5.2億を追加調達。シリーズA総額$9.35億、累計調達額~$10億（Apptronik公式）',
      '新規投資家：AT&T Ventures、John Deere、カタール投資庁（QIA）。既存継続：Google、Mercedes-Benz、B Capital',
      'Apollo仕様：身長173cm・重量73kg・ペイロード25kg・バッテリー稼働約4時間（ホットスワップ対応）',
      '現在の実証：Mercedes-Benz欧州工場複数拠点（組立補助）、GXO物流センター（ピッキング）',
      '2026年内の商用量産開始を目標。外部顧客への本格提供は2027年が現実的。国内代理店・保守体制は未公表（要確認）',
    ],
    body: `## 何が起きたか

2026年2月11日、ヒューマノイドロボット開発のApptronik（テキサス州オースティン）は、シリーズA延長ラウンドとして$5.2億の追加調達を完了したと発表した。この追加分により、シリーズA合計は$9.35億に達し、累計調達総額は約$10億になった。

注目すべきは新規投資家の顔ぶれだ。AT&T Ventures（通信大手）、John Deere（農業・建設機械大手）、カタール投資庁（主権ファンド）の三者が今回初めて参加した。これはApptronikへの資本が「テック系VC」から「産業大手のコーポレートVC・政府系ファンド」へ拡大したことを意味する。

## Apollo とはどういう機体か

Apptronikが開発するApolloは身長173cm・重量73kg・ペイロード25kgの二足歩行型ヒューマノイドだ。バッテリー稼働時間は約4時間で、ホットスワップ方式のバッテリー交換に対応する。製造・物流を主なターゲットとして設計されており、アームの可動域と力出力が産業現場でのマテハン作業に最適化されている。

Google DeepMindのGemini Roboticsパートナーとしても名を連ねており、LLMベースの自然言語指示への対応が統合される予定だ（別記事参照）。

## Mercedes-Benz と GXO での実証内容

現在、ApptronikはMercedes-Benzの欧州複数工場でApolloを試験投入している。Apptronikによると、主要ターゲットは「組立補助・マテハン」の三カテゴリで、コンポーネントの受け渡し、部品棚からのフェッチ、作業台間の搬送が含まれる。

GXO Logisticsとのパイロットでは物流センターでのピッキング業務を担当しており、Agility DigitのGXO事例と同一企業での比較が可能な状況だ（別記事参照）。ifactoryapp.comの報道では「Mercedes-Benzはパイロット中の機体が2027年に商用量産で届けられると確信している」と報じられている。

## 資金使途と商用化タイムライン

今回調達した$5.2億の使途はApptronikによると「Apollo量産のための製造能力増強」「商用・パイロット展開の拡大」「ロボット訓練とデータ収集のための新施設整備」と明示されている。

商用量産は2026年内開始を目標としているが、外部顧客への本格提供は2027年が現実的と見られる。現在パイロット実施中のMercedes-BenzとGXOが最初の商用顧客になる可能性が高い。

## 産業別の含意

John DeereとAT&Tが参加した背景に注目する価値がある。

**John Deere**：農業・建設機械は収穫・作付け・測量など多様な屋外タスクを持つ。Apolloの汎用性が農機への適用を想定させる——人型ではなく「人間と同じ操作インターフェースを持つ機体」がトラクターや建機を操作するシナリオが研究されている可能性がある。

**AT&T Ventures**：通信インフラ保守（電柱・配線・鉄塔の点検・修理）は人員確保が困難なタスクの典型だ。ヒューマノイドが通信設備保守に使われれば、日本のNTT・KDDI・ソフトバンクにとっても参照できるユースケースになる。

## 日本市場の現状

Apptronikは日本国内の代理店・保守体制を現時点（2026年6月）では公表していない（要確認）。ただしApolloは既に国際的な関心を集めており、日本への参入を検討していると示唆するシグナルも出ていると言われるが、正式な発表はない。`,
    relatedRobotIds: ['apptronik-apollo', 'agility-digit'],
    relatedManufacturerIds: ['apptronik', 'agility-robotics'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Apptronik Closes Over $935 Million Series A with New $520 Million Extension Round',
        url: 'https://www.globenewswire.com/news-release/2026/02/11/3236352/0/en/Apptronik-Closes-Over-935-Million-Series-A-with-New-520-Million-Extension-Round.html',
        publisher: 'Globe Newswire / Apptronik',
        publishedAt: '2026-02-11',
        checkedAt: '2026-06-15',
        reliability: 'official',
      },
      {
        title: 'Apptronik raises $520M to ramp humanoid Apollo robot commercial deployments',
        url: 'https://siliconangle.com/2026/02/11/apptronik-raises-520m-ramp-humanoid-apollo-robot-commercial-deployments/',
        publisher: 'SiliconAngle',
        publishedAt: '2026-02-11',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Apptronik brings in another $520M to ramp up Apollo production',
        url: 'https://www.therobotreport.com/apptronik-brings-in-another-520m-to-ramp-up-apollo-production/',
        publisher: 'The Robot Report',
        publishedAt: '2026-02-11',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: "Apollo at Mercedes-Benz: Apptronik's Humanoid Auto Manufacturing Deployment",
        url: 'https://ifactoryapp.com/industries/automotive-manufacturing/apollo-mercedes-apptronik-humanoid-automotive',
        publisher: 'iFactory',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'deepmind-gemini-robotics-ces2026',
    slug: 'deepmind-gemini-robotics-ces2026',
    title: "Google DeepMind's Gemini Robotics brings foundation model AI to humanoid bodies — Atlas, Apollo, Agility all partnered",
    titleJa: 'Google DeepMindの「Gemini Robotics」が基盤モデルAIをヒューマノイドに統合──Atlas・Apollo・Agility Digitが対象',
    type: 'tech-update',
    category: 'analysis',
    section: 'tech',
    summary: '2026年1月のCES 2026で、Google DeepMindはBoston Dynamics（Atlas）との戦略的AIパートナーシップを発表した。Gemini 3基盤モデルをAtlasの認知制御に統合するこの取り組みは、ApptronikのApollo・Agility RoboticsのDigit・Agile Robots・Enchanted Toolsにも展開される。ルールベースの固定プログラムを、自然言語指示→タスク計画→物理実行という基盤モデル制御に置き換えることを目指す。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    industryTags: ['manufacturing', 'research'],
    themeTags: ['physical-ai'],
    heroImage: {
      src: '',
      alt: 'Google DeepMind Gemini Robotics with Boston Dynamics Atlas',
      credit: 'Google DeepMind / Boston Dynamics',
      rights: {
        status: 'reference-attributed',
        sourceType: 'partner-official',
        checkedAt: '2026-06-15',
      },
    },
    whyItMatters:
      '「動作プログラムを事前定義する」制御パラダイムから「基盤モデルが文脈を読んでタスクを生成する」制御パラダイムへの転換は、ヒューマノイドの適用範囲を根本的に変える可能性がある。固定タスクのPoCを超えた「新しい作業を指示するだけで対応できる」機体が現実になれば、日本企業の導入判断における「用途を絞らないと使えない」という前提が崩れる。ただし現時点では研究・限定パイロット段階であり、産業現場での実用可能性はまだ評価中だ。',
    keyTakeaways: [
      'CES 2026（2026年1月）でBoston Dynamics × Google DeepMindが戦略的AIパートナーシップを発表',
      '統合対象：Boston Dynamics Atlas（Gemini 3）、Apptronik Apollo、Agility Robotics Digit、Agile Robots、Enchanted Tools',
      'Gemini Robotics-ER（Extended Reality）：複雑な操作タスクへの拡張モデル。複数パートナーと実機評価中',
      'オンデバイス推論（Gemini Robotics On-Device）：クラウド常時接続なしに動作可能。工場のネットワーク環境・機密性の課題に対処',
      '既存の「固定タスク×ルールベース制御」を「自然言語指示→基盤モデル→物理実行」に置き換える設計思想',
    ],
    body: `## CES 2026 での発表内容

2026年1月6〜9日に開催されたCES 2026で、Google DeepMindはBoston Dynamicsとの戦略的AIパートナーシップを発表した。DeepMindのGemini 3基盤モデルをBoston Dynamicsの全電動Atlasの認知制御に統合し、「言語理解→タスク計画→物理実行」の三層を一貫した基盤モデルで処理するシステムを開発する。

同時に発表されたのがGemini Roboticsの複数ハードウェアパートナーへの展開だ。対象にはApptronik（Apollo）、Agility Robotics（Digit）、Agile Robots、Enchanted Toolsが含まれる。Google DeepMindは自社でロボットを製造するのではなく、「AIモデルを複数のハードウェアパートナーに提供するプラットフォーマー」として機能する戦略だ。

## Gemini Robotics とは何か

Gemini Roboticsは、Google DeepMindがロボット制御向けに特化させたGeminiファミリーの派生モデルだ。DeepMindのブログによると、以下の特徴を持つ。

**汎用性**：事前にプログラムされた固定動作ではなく、新しい物体・新しい環境・新しい指示にゼロショット（または少数ショット）で対応できる設計を目指す。

**オンデバイス推論**：「Gemini Robotics On-Device」として、クラウドへの常時接続なしにロボット本体で推論を実行できるバージョンを提供する。工場内のネットワーク環境や機密性の観点から、クラウド依存の低減は産業用途で重要な差分になる。

**Gemini Robotics-ER**：複雑な操作タスク（繊細な部品のグリップ・複数ステップの組立など）への対応を強化した拡張版。Atlas、Agility Digitといったパートナーと実機評価中だ。

## なぜ「基盤モデル」が重要か

現在多くの産業ヒューマノイドが採用している「ルールベース制御＋タスク特化の学習」モデルには根本的な制限がある。

- **タスクを切り替えるたびに再プログラムが必要**：溶接からピッキングに変えるだけで、エンジニアリング投資が発生する
- **未知の物体・環境に弱い**：形状が変わったり、作業区域のレイアウトが変わると動けなくなる
- **スケールコストが高い**：工場ごと・ライン変更ごとに再調整が必要で、展開効率が低い

Gemini Roboticsが目指すのは、人間が自然言語で「このボルトをあそこのトレーに入れて」と指示するだけで、ロボットが環境を認識しタスクを実行できる状態だ。これが実現すれば、導入側のエンジニアリングコストと再調整コストが大幅に下がる。

## パートナー構成の戦略的意味

Google DeepMindが複数の競合するハードウェアメーカー（Boston Dynamics・Apptronik・Agility Robotics等）に同じAIモデルを提供する構造は、「どのロボットを選んでもGeminiが走る」という制御層の標準化を目指している。

この構造が成立すると、日本企業がロボット選定をする際に「制御AIの品質はどこも同じ、ハードの信頼性・保守体制・価格で選ぶ」という判断軸になる。一方で「Googleのモデル更新・廃止ポリシーがどうなっているか」「オフライン環境での動作保証はどのレベルか」というGemini依存リスクも評価変数に加わる。

## 現時点の限界

基盤モデル制御は現時点では研究・限定パイロット段階にある。Plain Conceptsの分析によると、現在のGemini Roboticsは構造化環境でのパフォーマンスが安定しているが、非構造環境での堅牢性は継続評価中だ。「デモ環境での成功」と「工場・倉庫の汚れた・乱雑な・照明が変わる環境での安定稼働」には大きな差がある。

産業現場への適用を検討する際は、「Gemini Roboticsがどの環境・どのタスクで実稼働実績を持つか」を具体的に確認することが必要だ。`,
    relatedRobotIds: ['boston-dynamics-atlas', 'apptronik-apollo', 'agility-digit'],
    relatedManufacturerIds: ['boston-dynamics', 'apptronik', 'agility-robotics'],
    relatedUseCaseIds: ['research-development'],
    sources: [
      {
        title: 'CES 2026: Boston Dynamics and Google DeepMind partner to bring Gemini AI models to humanoid robots',
        url: 'https://www.digitimes.com/news/a20260106VL212/boston-dynamics-google-deepmind-gemini-partnership-humanoid-robot.html',
        publisher: 'Digitimes',
        publishedAt: '2026-01-06',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Gemini Robotics On-Device brings AI to local robotic devices',
        url: 'https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/',
        publisher: 'Google DeepMind',
        checkedAt: '2026-06-15',
        reliability: 'official',
      },
      {
        title: 'Agile Robots to deploy Google DeepMind foundation models on its humanoid',
        url: 'https://www.therobotreport.com/agile-robots-deploy-google-deepmind-foundation-models-humanoid/',
        publisher: 'The Robot Report',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Gemini Robotics: A new era of AI-Powered Robots',
        url: 'https://www.plainconcepts.com/gemini-robotics/',
        publisher: 'Plain Concepts',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'japan-humanoid-labor-strategy-2026',
    slug: 'japan-humanoid-labor-strategy-2026',
    title: "Japan's shrinking workforce is turning humanoid robots from optional technology into strategic necessity",
    titleJa: '人口減少が「ロボット導入の任意」を「国家的必然」に変えた──日本がヒューマノイドの最初の大型市場になる理由',
    type: 'analysis',
    category: 'analysis',
    section: 'business',
    summary: '日本の生産年齢人口は2023〜2060年に31%減少する見通しで、2040年には1,100万人の労働力不足が迫っている。JAL羽田実証・METIの¥387億専用予算・Humanoids Summit東京開催という2026年の3つのシグナルは、「ヒューマノイット導入を検討するかどうか」という問いが「どう導入するか」に変わりつつあることを示す。日本のtoB企業にとってヒューマノイドが「技術の話」から「経営の話」になった転換点を整理する。',
    publishStatus: 'published',
    updatedAt: '2026-06-15',
    reliability: 'reported',
    publishedAt: '2026-06-15',
    author: 'Deploid Research',
    regionTags: ['japan'],
    themeTags: ['market-analysis'],
    heroImage: {
      src: '/images/article-generic/japan-policy/japan-flag-building.jpg',
      alt: 'Japanese flag flying atop an office building',
      credit: 'Agustina Perretta / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/flag-of-japan-on-top-of-building-HBDbNr16z_s',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Agustina Perretta',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Unsplash Licenseの汎用イメージ。日本の労働市場・政策テーマを示す代替画像として使用。',
      },
    },
    whyItMatters:
      '「ロボットは将来の技術」という認識がいつ「今すぐ調達しなければならない調達品」になるかは、各企業の採用環境・競合の動き・規制変化によって変わる。日本の現状は、製造・物流・グランドハンドリングといった業種でその「転換点」が2026〜2028年に来る可能性を示している。タイミングを外すと、機体不足・SIer不足・保守体制整備の遅れという競合劣後が生じる。',
    keyTakeaways: [
      '2040年に1,100万人の労働力不足（METI予測）。生産年齢人口は2023〜2060年に31%減少',
      '2025年：訪日外国人が過去最高の4,270万人。2030年目標6,000万人で、空港・ホテル・小売の人員需要が急増',
      '2026年の3つのシグナル：JAL羽田実証（国内航空初）、経産省フィジカルAI¥387億予算、Humanoids Summit初の東京開催',
      '日本の強み：産業用ロボット市場の世界シェア70%（2022年）。但しフィジカルAI（自律型）分野では米中に遅れ',
      '「誰もやりたがらない仕事を埋める」が最初の適用パターン──夜間倉庫・グランドハンドリング・ビルメンが先行市場',
    ],
    body: `## 「人が集まらない」が出発点になった

2026年の日本のヒューマノイド導入事例を見ると、共通点が明確だ。JALの羽田実証を動機付けたのはグランドハンドリングの採用難だ。ビルメンテナンス大手が清掃ロボット検討を始めたのも、清掃スタッフの確保がますます困難になっているからだ。「技術が面白いから試す」という動機ではなく、「人が来なくなった業務の補完」として最初の需要が形成されている。

TechCrunchが2026年4月5日に報じた記事はこの状況を一言で言い表した——「日本では、ロボットはあなたの仕事を奪いに来るのではなく、誰もやりたがらない仕事を埋めに来ている」。

## 数字で見る労働力の構造問題

METIの試算では、2040年には日本全体で1,100万人の労働力不足が生じる。これは「選択肢の問題」ではなく「足し算の問題」だ。

日本の生産年齢人口（15〜64歳）は2023年から2060年にかけて31%減少すると予測されている。この減少が製造・物流・介護・清掃・観光などの全業種に均等に及ぶ。

同時に、観光需要は逆方向に急増している。2025年の訪日外国人数は4,270万人と過去最高を記録し、政府目標の2030年6,000万人に向けて空港・ホテル・商業施設での人員需要が急上昇している。「供給が減る×需要が増える」という組み合わせがグランドハンドリング・ホテル清掃・観光施設運営で最初にクリティカルな問題として表面化している。

## 2026年の3つのシグナル

今年（2026年）は、日本のヒューマノイドに関して「空気が変わった」と表現できる3つの出来事が重なった。

**1. JAL羽田実証（2026年4月〜）**：JALグランドサービスとGMO AI & Roboticsが組み、国内航空会社として初めてヒューマノイドを空港現場で検証した（別記事参照）。航空という安全規制の厳しい現場での実証は、他業種への「許可証」に近い心理的効果がある。

**2. 経産省フィジカルAI予算（FY2026：¥387億）**：METIが「フィジカルAI」を独立した政策分野として予算化し、2040年に世界シェア30%という数値目標を掲げた（別記事参照）。補助金・安全規格整備・国内スタートアップ育成が政策として動き始めた。

**3. Humanoids Summit 初の東京開催（2026年5月28〜29日）**：グローバルのヒューマノイド業界フォーラムが初めて日本で開かれ、2,000人・30カ国・300社が参加した（別記事参照）。海外メーカーが東京に来たのは「日本市場を取りに来た」シグナルだ。

## 産業用ロボットの実績 vs フィジカルAIの課題

日本が産業ロボットで世界をリードしてきた事実を踏まえると、ヒューマノイド（フィジカルAI）への転換は自然に見える。ファナック・安川・川崎などの大手は産業ロボット市場で世界シェア70%（2022年）を持つ。

しかし「産業ロボット」（固定設置型・繰り返し精度重視・人間不在エリア）と「フィジカルAI」（自律移動型・汎用操作・人間と協働）では求められる技術スタックが根本的に異なる。自律制御・LLM統合・モビリティ設計という軸では、米国（Figure AI、Boston Dynamics、Apptronik等）と中国（AGIBOT、Unitree等）の新興企業が先行している。

KraneSharesの2026年レポートは、日本市場の二重構造を端的に表現している：「日本は最も切迫した需要側の一つでありながら、供給側では先行勢力に追いついていない」。

## 導入タイミングを外すリスク

「技術が成熟してから」という待機戦略には、2つのリスクが内在する。

**SIer・保守リソースの枯渇**：ヒューマノイドの現場実装にはシステムインテグレーター（SIer）が不可欠だが、現時点で経験を持つSIerは国内で極めて少ない。先行企業がパートナーSIerを確保すると、後発企業は経験豊富なSIerを取り合う状況になる。

**機体供給の待ち行列**：Boston DynamicsのAtlasは2026年生産分が既にHyundaiとDeepMindで完売。Figure 03は商用パイロット限定、Apptronikは2027年以降。今から問い合わせ・評価を始めた企業が2027〜2028年の早期枠を確保できる可能性が高い。

「何年後かに本格導入する」計画でも、「今すぐ情報収集・問い合わせ・PoC予算確保」を始めないと、リードタイムの計算が狂う。`,
    relatedRobotIds: ['unitree-g1', 'boston-dynamics-atlas', 'apptronik-apollo'],
    relatedManufacturerIds: ['unitree', 'boston-dynamics', 'apptronik'],
    relatedUseCaseIds: [],
    sources: [
      {
        title: "In Japan, the robot isn't coming for your job; it's filling the one nobody wants",
        url: 'https://techcrunch.com/2026/04/05/japan-is-proving-experimental-physical-ai-is-ready-for-the-real-world/',
        publisher: 'TechCrunch',
        publishedAt: '2026-04-05',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Humanoid Robotics In 2026: The Race From Pilot To Platform',
        url: 'https://kraneshares.com/humanoid-robotics-in-2026-the-race-from-pilot-to-platform/',
        publisher: 'KraneShares',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: 'Physical AI Japan: The Urgent Strategy Deploying Robots for National Survival',
        url: 'https://www.mexc.co/news/1005897',
        publisher: 'MEXC News',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
      {
        title: "Japan Airlines begins humanoid robot trials at Tokyo's Haneda airport as labor shortages bite",
        url: 'https://www.cnbc.com/2026/05/01/japan-airlines-humanoid-robots-haneda-labor-shortage.html',
        publisher: 'CNBC',
        publishedAt: '2026-05-01',
        checkedAt: '2026-06-15',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'unitree-r1-global-lineup-2026',
    slug: 'unitree-r1-global-lineup-2026',
    title: 'Unitree formalizes R1 humanoid lineup at $4,900–$5,900 and pushes global retail availability',
    titleJa: 'Unitree、量産ヒューマノイド「R1」シリーズを4,900〜5,900ドルで体系化──海外販売チャネルも拡大',
    type: 'market-analysis',
    category: 'company-report',
    section: 'business',
    summary:
      'Unitree公式サイトは2026年6月17日時点で、量産ヒューマノイド「R1」シリーズを「R1 AIR」（$4,900〜・20自由度）と「R1」（$5,900〜・26自由度）の二段構成として整理している。South China Morning Postの報道によると、同社は2026年4月時点でAliExpress経由の海外販売拡大も計画しており、対象地域には日本も含まれるとされる。',
    publishStatus: 'published',
    updatedAt: '2026-06-19',
    reliability: 'official',
    publishedAt: '2026-06-19',
    author: 'Deploid Research',
    themeTags: ['pricing', 'mass-production', 'market-analysis', 'consumer'],
    heroImage: {
      src: '/images/article-generic/industrial-automation/conveyor-production-line.jpg',
      alt: 'Monochrome conveyor system inside a factory production line',
      credit: 'Frans van Heerden / Pexels',
      sourceUrl: 'https://www.pexels.com/photo/factory-production-line-13974251/',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Frans van Heerden',
        licenseUrl: 'https://www.pexels.com/license/',
        checkedAt: '2026-06-25',
        permissionNote: 'Unitree公式のR1画像は許諾未確認のため使用しない。Pexels Licenseの汎用工場イメージで代替。',
      },
    },
    whyItMatters:
      'Unitreeが量産二足ロボットの価格を4,900〜5,900ドルという帯に整理し、国際販売チャネルの拡大も進めていることは、ヒューマノイドの価格下限を引き下げる動きとして注視すべきだ。重量物ハンドリングの主力機ではないが、デモ・教育・運動制御研究用途での導入コストの目安が大きく下がったことを意味する。',
    keyTakeaways: [
      'Unitree公式サイトで「R1 AIR」（$4,900〜・20DoF）と「R1」（$5,900〜・26DoF）の価格・構成が確認できる（2026年6月17日確認）',
      '同社G1は99,000元〜、H1は65万元〜。EngineAI PM01は88,000元、UBTechは29.9万元と、自社・競合ラインの中でもR1は最安級',
      'South China Morning Postの2026年4月9日報道によると、UnitreeはAliExpress経由で北米・欧州・日本・シンガポール向け海外販売を計画',
      '上位構成の「R1 EDU」は要問い合わせで、研究・二次開発向けの価格は非公表',
      '重量物ハンドリング用途には不向き。デモ・教育・運動制御研究での導入コスト目安として参照する位置付け',
    ],
    body: `## R1 AIR/R1/R1 EDUの三段構成が公式に整理された

Unitree Roboticsが公式サイトで、量産二足ロボット「R1」シリーズの構成を明確化した。エントリーモデルの「R1 AIR」が4,900ドルから、自由度を高めた標準モデル「R1」が5,900ドルから、研究・二次開発向けの「R1 EDU」は要問い合わせという3段階の価格帯が、2026年6月17日時点でUnitree公式サイト上で確認できる。R1 AIRは身長123cm・重量27kg・自由度20、R1は同じ筐体で自由度を26まで高めた構成だ。発表時の宣伝動画では宙返りや受け身を伴う走行など運動性能のデモが中心で、産業用途の精密作業ではなく身体性能の高さを訴求する見せ方になっている。

## 中国国内の競合機種と比べた価格の位置

Unitreeの自社ラインアップで見ても、R1の安さは際立つ。同社のG1（身長130cm・重量35kg）は99,000元からで、ヒト型として上位に位置するH1（身長180cm・重量47kg）は65万元からだ。競合のEngineAI製PM01（身長138cm）は88,000元、UBTech Roboticsの機種は29.9万元という値付けで、South China Morning Postの報道はR1の価格を中国の競合と比べても安いと位置づけている。R1の本体価格は39,999元（約5,900ドル）で、量産二足ロボットとしては現時点で最も入手しやすい価格帯の一つだ。比較対象として、Teslaが目標に掲げるOptimusの量産原価2万ドル台（COGS）はあくまで自社工場向け生産規模を前提にした数字であり、個人・研究機関が今すぐ手にできる価格帯としてはR1の方がより手前にある。

## 国際販売チャネルの拡大が先行していた

価格の安さに加えて見ておくべきは販売チャネルの動きだ。South China Morning Postは2026年4月9日付の報道で、Unitreeが翌週にもAliExpress経由でR1の海外販売を開始する計画だと、事情に詳しい関係者2名の証言を基に報じている。対象地域には北米・欧州・日本・シンガポールが含まれるとされ、国際価格は当時未公表だった。つまりR1は中国国内限定の安価モデルではなく、最初から海外個人購入者・研究機関を見込んだ設計だったことになる。海外のECチャネルを正規販売網として使う発想自体が、産業ロボット然とした商流（代理店経由・見積もり交渉）とは異なり、個人や中小の研究室でも調達障壁が低い点が特徴だ。

## 日本企業が確認すべきこと

R1自体は重量物ハンドリングを想定した機体ではなく、Unitreeのデータでもペイロードは大きくない。法人の主力導入機としてではなく、社内デモ・展示・運動制御の実証用途で評価する位置付けが妥当だ。日本企業が次に確認すべき点は、(1)日本向け正規販売・保守ルートがAliExpress経由の個人輸入と別に整備されるか、(2)R1 EDUの具体的な価格と二次開発条件、(3)この価格帯がG1やH1など主力機の今後の価格設定にどう波及するか、の3点だ。量産二足ロボットの価格下限が下がり続けていること自体は、ヒューマノイド評価のコスト感覚を見直す材料になる。個人輸入経由での導入は、保証・部品供給・日本語サポートの欠如というリスクを伴うため、社内検証目的であっても契約形態の整理を事前に行う必要がある。代理店経由の調達であれば一定の保守対応が期待できる一方、個人輸入はその枠の外にあることを前提に費用対効果を見積もるべきだ。`,
    relatedRobotIds: ['unitree-r1', 'unitree-r1-standard'],
    relatedManufacturerIds: ['unitree'],
    relatedUseCaseIds: ['research-development'],
    nextReviewBy: '2026-09-19',
    sources: [
      {
        title: 'Unitree R1',
        url: 'https://www.unitree.com/R1/',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-06-19',
        reliability: 'official',
      },
      {
        title: "China's Unitree debuts US$5,900 humanoid robot in race to make cheaper products",
        url: 'https://www.scmp.com/tech/tech-trends/article/3319637/chinas-unitree-debuts-us5900-humanoid-robot-race-make-cheaper-products',
        publisher: 'South China Morning Post',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
      {
        title: "China's Unitree to debut cheapest humanoid robot globally on Alibaba site: sources",
        url: 'https://www.scmp.com/tech/article/3349489/chinas-unitree-debut-cheapest-humanoid-robot-globally-alibaba-site-sources',
        publisher: 'South China Morning Post',
        publishedAt: '2026-04-09',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'dobot-atom-max-rtj-japan-2026',
    slug: 'dobot-atom-max-rtj-japan-2026',
    title: 'DOBOT brings 41-DOF humanoid Atom Max to Japan for the first time at Robot Technology Japan 2026',
    titleJa: 'DOBOT、41自由度ヒューマノイド「ATOM Max」を日本初公開──Robot Technology Japan 2026に出展',
    type: 'event-report',
    category: 'news',
    section: 'tech',
    summary:
      'DOBOT JAPANは2026年6月11〜13日、愛知県常滑市で開催された「Robot Technology Japan 2026」で、41自由度のヒューマノイド「ATOM Max」を国内初公開した。同展示会で人型ロボットが並んだのは今回が初めてで、トヨタや川田ロボティクスの機体と並んで展示された。',
    publishStatus: 'published',
    updatedAt: '2026-06-19',
    reliability: 'reported',
    publishedAt: '2026-06-19',
    author: 'Deploid Research',
    industryTags: ['manufacturing'],
    regionTags: ['japan'],
    themeTags: ['pr-demo'],
    heroImage: {
      src: '/images/article-generic/conference-expo/speaker-stage-audience.jpg',
      alt: 'Speaker presenting on stage to a tech conference audience',
      credit: 'Carlos Gil / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/speaker-presenting-on-stage-to-an-audience-AsxOJcsaR4g',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Carlos Gil',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'DOBOT公式のATOM Max画像は許諾未確認のため使用しない。Unsplash Licenseの汎用カンファレンスイメージで代替。',
      },
    },
    whyItMatters:
      '中国メーカーが日本の産業見本市で人型ロボットを相次いで初公開する流れの中で、DOBOTのATOM Maxは41自由度・両手12自由度という具体的な仕様を示した事例だ。デモの完成度と量産投入の距離感を見極める定点として記録する価値がある。',
    keyTakeaways: [
      'DOBOT JAPANが2026年6月11〜13日、愛知スカイエキスポの「Robot Technology Japan 2026」でATOM Maxを日本初公開',
      '41自由度、ハンド12自由度、60FPSフルHDカメラとIntel RealSense D455を搭載',
      'ティーチングによる動作記憶とAI推論モデルによる動作学習の両方に対応',
      '同展示会で人型ロボットが並んだのは今回が初めて。トヨタCUE、川田ロボティクスNEXTAGE等と並んで展示',
      '量産投入時期・日本向け価格・保守体制は未公表（要確認）',
    ],
    body: `## 産業用ロボット展に初めて人型機が並んだ

中国・深圳のDOBOT Roboticsの日本法人DOBOT JAPAN（東京都港区）は、2026年6月11日から13日まで愛知県常滑市の愛知スカイエキスポで開催された「Robot Technology Japan 2026」に、ヒューマノイドロボット「ATOM Max」を出展し、日本国内で初めて披露した。robot digestの現地レポートによると、同展示会で人型ロボットが並んだのは今回が初めてで、DOBOTの機体はトヨタの「CUE」や川田ロボティクスの「NEXTAGE」など国内勢の機体と並んで展示されたという。

## 41自由度とハンド12自由度の構成

ATOM Maxは41個の関節を持つヒューマノイドで、手部だけで12自由度を備える。視覚系統は60FPSのフルHDカメラに加え、Intel RealSense D455デプスカメラを搭載し、対象物の位置・形状を高精度に認識できる構成だ。展示では、人の動きをティーチングで覚えさせる従来型の制御と、AI推論モデルを使って人の動作観察から動作を学習させる制御の両方に対応する点を訴求していた。

## 既存の協働ロボットとの違い

DOBOT JAPANはこれまでCRA・CR・MG400・NOVA・Magician E6など、アーム単体の協働ロボットを国内市場で展開してきた。ATOM Maxはその延長線上にある人型機で、展示テーマ「Do More With Dobot」が示すように、既存の協働ロボット事業の上に人型機を積み上げる位置付けだ。アーム単体機と違い、二足歩行と両手の協調動作を前提にした分、対応できる作業の幅は広がるが、設置面積・安全要件・保守体制は協働ロボットとは別に検討する必要がある。

## 量産投入までの距離感

今回の出展はデモンストレーションの段階で、量産ラインへの本格投入時期や日本向けの価格・保守体制は公表されていない（要確認）。日本市場では中国メーカーのヒューマノイドが相次いで展示会デビューする動きが続いており、ATOM Maxもその一例だ。日本企業が検討する際は、デモの完成度だけでなく、国内サポート体制・部品供給・ファームウェア更新の運用方針を、正式な代理店契約の前に確認することが欠かせない。協働ロボット事業で築いた国内の販売・サポート網をそのまま人型機に転用できるかどうかが、他の新規参入メーカーとの差になり得る点も見ておきたい。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      {
        title: '【読んで発見「RTJ2026」vol.3】ヒューマノイドが続々と',
        url: 'https://www.robot-digest.com/contents/?id=1779354310-953620',
        publisher: 'robot digest',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
      {
        title: 'DOBOT、次世代ヒューマノイドを日本初公開',
        url: 'https://www.logi-today.com/950443',
        publisher: 'LOGI-TODAY',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'vindynamics-vinrobotics-debut-2026',
    slug: 'vindynamics-vinrobotics-debut-2026',
    title: "Vingroup launches two humanoid robot lines in one week — VinDynamics' Dyno and VinRobotics' VR-H3",
    titleJa: 'ベトナムVingroup、1週間でヒューマノイド2系統を発表──VinDynamics「Dyno」とVinRobotics「VR-H3」',
    type: 'analysis',
    category: 'company-report',
    section: 'business',
    summary:
      'ベトナムのVingroup傘下から、2026年6月上旬の1週間でヒューマノイドロボットが2系統発表された。VinDynamicsの案内・接客向け「Dyno」と、VinRoboticsの産業向け「VR-H3」で、いずれもICRA 2026とCOMPUTEX Taipei 2026で披露された。',
    publishStatus: 'published',
    updatedAt: '2026-06-19',
    reliability: 'reported',
    publishedAt: '2026-06-19',
    author: 'Deploid Research',
    industryTags: ['research'],
    regionTags: ['southeast-asia'],
    themeTags: ['market-analysis', 'physical-ai'],
    heroImage: {
      src: '/images/article-generic/conference-expo/crowd-seated-event.jpg',
      alt: 'Audience seated at a tech conference event',
      credit: 'Headway / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/crowd-of-people-sitting-on-chairs-inside-room-F2KRf_QfCqw',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Headway',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Vingroup公式のDyno画像は許諾未確認のため使用しない。Unsplash Licenseの汎用カンファレンスイメージで代替。',
      },
    },
    whyItMatters:
      'ヒューマノイド開発がベトナム発のコングロマリットからも本格的に立ち上がったことは、供給元が中国・米国の数社に限られない状況が生まれつつあることを示す。サービス向け（Dyno）と産業向け（VR-H3）を別法人で住み分ける体制は、用途ごとに異なる安全要件・認証への対応モデルとしても参考になる。',
    keyTakeaways: [
      'VinDynamics（2025年9月設立）が案内・接客・セキュリティ向け「Dyno」、姉妹会社VinRoboticsが産業向け「VR-H3」を発表',
      '両機種ともICRA 2026（ウィーン、6月1〜5日）とCOMPUTEX Taipei 2026（6月2〜5日）で披露',
      'DynoはVinpearl Safari Phu Quocで屋外実証済み。VR-H3は31以上のアクチュエーター、ペイロード6〜8kg、VRヘッドセット遠隔操作に対応',
      'サービス向けと産業向けを別法人で並走させる体制を取っている',
      '日本向け販売・代理店情報、外部顧客への販売条件は今回の発表時点で非公表（要確認）',
    ],
    body: `## ベトナムから2系統のヒューマノイドが同時に登場

ベトナムのコングロマリットVingroup傘下から、2026年6月上旬の1週間でヒューマノイドロボットが2系統発表された。2025年9月設立のVinDynamicsは案内・接客・セキュリティ向けの「Dyno」を、姉妹会社VinRoboticsは産業向けの「VR-H3」を、いずれもIEEE国際ロボット工学・オートメーション会議（ICRA 2026、ウィーン、6月1〜5日）とCOMPUTEX Taipei 2026（台北、6月2〜5日）で披露した。

## 用途で分かれる2つの機体

Dynoは多言語での案内・接客、訪問者の質問への応答、都市部やキャンパス・複合施設でのセキュリティ・監視を主な用途とする。Vingroupが運営するベトナム最大級の野生動物保全公園「Vinpearl Safari Phu Quoc」で実証プログラムを実施しており、屋外という動的な環境で安定稼働した実績を持つ。一方のVR-H3は31以上のアクチュエーターとデュアルエッジコンピューターを搭載し、ペイロード6〜8kgで資材搬送・組立支援・危険環境での作業を想定する。外部トラッカー不要でVRヘッドセットとモーションキャプチャーを組み合わせた遠隔操作にも対応する点は、初期の習熟データ収集を遠隔操作で稼ぎながら自律化を進める、他社にも見られる段階的なアプローチと一致する。

## 同じグループが2社で住み分ける狙い

DynoとVR-H3は開発元が異なる別会社の製品で、Vingroupはサービス向けと産業向けを別法人で並走させる体制を取っている。これは単一企業がヒューマノイドの全用途を一手に開発するモデルとは異なり、サービスロボットと産業ロボットでは安全要件・認証・販売チャネルが大きく異なることを踏まえた住み分けと見られる。Vingroup自体は不動産・自動車（VinFast）・小売など幅広い事業を持つコングロマリットであり、グループ内の実証フィールド（テーマパーク、製造拠点など）を自社製品の実証に使える点が強みだ。自社グループ内に実証できる現場を持つこと自体が、外部顧客の現場で許可を得てから実証するスタートアップに比べて立ち上がりの速さにつながっている。

## 中国・米国に次ぐ供給国の広がり

ヒューマノイド開発は中国（Unitree、AGIBOT、UBTechなど）と米国（Figure、Apptronik、Boston Dynamicsなど）が先行してきたが、Vingroupの参入は東南アジアからの新規参入として位置付けられる。実証実績はまだ自社グループ内の施設が中心で、外部企業への販売条件や日本含む海外展開の計画は今回の発表時点では明らかにされていない（要確認）。サービス系・産業系の機体を同時に2系統発表したという点では、単一プロトタイプの披露が多い新興メーカーの中でも開発リソースの厚さがうかがえる。

## 日本企業が見ておくべき点

現時点でDyno・VR-H3ともに日本向けの販売・代理店情報はない。ただし、ヒューマノイドの供給元が中国・米国の数社に限られない状況が生まれつつあることは、将来の調達先選定において選択肢が増える可能性を示す。日本企業としては、(1)Vingroupグループ内実証の継続的な成果公表、(2)VR-H3の認証・安全規格の取得状況、(3)海外（特にアジア圏）への販売条件、の3点を継続的に確認する価値がある。供給国の多様化は価格・リードタイムの競争を生みやすく、中長期的には調達条件の比較材料が増えること自体が買い手に有利に働く可能性がある。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'VinDynamics Debuts Dyno Humanoid Robot At ICRA 2026 And Computex Taipei 2026',
        url: 'https://pulse2.com/vindynamics-debuts-dyno-humanoid-robot-at-icra-2026-and-computex-taipei-2026/',
        publisher: 'Pulse2',
        publishedAt: '2026-06-02',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
      {
        title: 'New humanoid robot brings human-like dexterity for industrial roles',
        url: 'https://interestingengineering.com/ai-robotics/vietnam-vr-h3-humanoid-robot-industrial-grade',
        publisher: 'Interesting Engineering',
        publishedAt: '2026-06-04',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'genesis-ai-eno-non-humanoid-2026',
    slug: 'genesis-ai-eno-non-humanoid-2026',
    title: 'Genesis AI unveils Eno — a wheeled "general-purpose robot" that rejects humanoid form, backed by Eric Schmidt',
    titleJa: 'Genesis AI、人型を捨てた「汎用ロボット」Enoを発表──Eric Schmidtが支援',
    type: 'tech-update',
    category: 'analysis',
    section: 'tech',
    summary:
      'Genesis AIは2026年6月16日、車輪ベースの汎用ロボット「Eno」を発表した。人間の外見を模倣せず能力を中心に設計したと説明しており、Google前CEOのEric Schmidtが支援者として参加している。2026年末までの生産・顧客導入開始を計画する。',
    publishStatus: 'published',
    updatedAt: '2026-06-19',
    reliability: 'official',
    publishedAt: '2026-06-19',
    author: 'Deploid Research',
    industryTags: ['research'],
    themeTags: ['mass-production', 'physical-ai'],
    heroImage: {
      src: '/images/articles/genesis-ai-eno-non-humanoid-2026/hero.jpg',
      alt: 'Genesis AI Eno general-purpose robot in a warehouse',
      credit: 'Genesis AI',
      sourceUrl: 'https://www.genesis.ai/press-kit',
      rights: {
        status: 'reference-attributed',
        sourceType: 'manufacturer-official',
        rightsHolder: 'Genesis AI',
        checkedAt: '2026-06-20',
        permissionNote:
          'genesis.ai/press-kit の公式ダウンロードアセット（Eno Images）より取得。利用条件の明記は確認できなかったため reference-attributed（出典明記・削除依頼対応）として掲載。',
      },
    },
    whyItMatters:
      'ヒューマノイド一辺倒に見える業界で、「人間に似せる必要はない」という設計思想を掲げる有力新興企業が現れたことは、買い手にとって「人型である必要が本当にあるか」を再考する材料になる。構造化された屋内施設では、車輪ベースの汎用ロボットの方が導入・保守コストで優位に立つ可能性がある。',
    keyTakeaways: [
      'Genesis AIが2026年6月16日、車輪ベースの汎用ロボット「Eno」を発表。二足歩行・人型シルエットを前提にしない設計',
      '自社開発の基盤モデル「GENE」が文脈理解・状態記憶・状況に応じた推論を担う',
      'Google前CEOのEric Schmidtが支援者として参加。人間専門知識の増幅を投資の主眼として説明',
      '2026年末までに生産・顧客への先行導入を開始予定。最初の対象は製造・物流・研究施設',
      '段差・不整地対応は二足歩行機に劣る可能性が高く、構造化された屋内施設向けと見るのが妥当（要確認）',
    ],
    body: `## 人型を選ばない汎用ロボットという主張

2026年6月16日、Genesis AIはパリとカリフォルニア州サンカルロスで、同社初の汎用ロボット「Eno」を発表した。PR Newswire配信の公式発表によると、Enoは人間の外見を模倣する設計ではなく、人間の能力を中心に設計されている。下半身は車輪ベースで、上半身には可動式のパネルタワーと折り畳み機構を備える構成だ。Genesis AIはこれを「本質性と意図の哲学」と呼び、二足歩行・人間型シルエットを前提にしない設計判断を明言している。

## GENE基盤モデルが担う推論部分

Enoのソフトウェア基盤は同社が開発する「GENE」という基盤モデルだ。公式発表では、与えられた高レベルの目標に対して文脈を理解し、状態を記憶し、変化する条件に応じて推論する仕組みとして説明されている。複数ステップにわたる作業をミリ単位の精度で実行できるとされ、固定プログラムされた動作の繰り返しではなく、状況に応じた計画立案を重視する設計だ。

## ヒューマノイド勢との違い

UnitreeやFigure、Boston Dynamicsなど主要プレイヤーの多くは二足歩行の人型を前提に開発を進めている。Genesis AIの立場は逆で、ヒューマノイドが人間に似ている必要はないという主張そのものを製品コンセプトに据えている。車輪ベースの移動は二足歩行よりも単純な制御で済み、平坦な屋内環境では速度・安定性の面で有利になりやすい。一方で、段差・階段・不整地への対応力は二足歩行機に劣る可能性があり、適用環境は構造化された屋内施設に限られると見るのが妥当だ。

## 投資家の位置付けと量産計画

Genesis AIにはGoogle前CEOのEric Schmidtが支援者として名を連ねている。同氏は公式発表で、ロボット工学を通じて人間の能力を拡張する根本的に新しいモデルを構築しているとコメントし、専門知識を置き換えるのではなく増幅することが本質だと述べている。Genesis AIは2026年末までに生産と顧客への先行導入を開始する計画で、最初の適用領域は製造・物流・研究施設、続いてホテル・病院などのサービス業を想定している。

## 日本企業が確認すべきこと

Enoのような非ヒューマノイド型の汎用ロボットは、二足歩行機よりも導入コスト・保守難易度が低くなる可能性がある一方、対応できる作業範囲は限定される。日本企業が評価する際は、(1)2026年末という量産タイムラインの実現性、(2)製造・物流現場での実証データの公開状況、(3)二足歩行を前提にした既存の現場レイアウトとの相性、を確認する必要がある。人型である必要が本当にあるかを再考する材料として、今後の評価軸に加える価値がある。特に多品種少量生産や検品工程など、移動範囲が限られる現場では検討の余地が大きい。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      {
        title: "Introducing Eno: Genesis AI's First General-Purpose Robot is Challenging Traditional Humanoid Design",
        url: 'https://www.prnewswire.com/news-releases/introducing-eno-genesis-ais-first-general-purpose-robot-is-challenging-traditional-humanoid-design-302801103.html',
        publisher: 'PR Newswire / Genesis AI',
        publishedAt: '2026-06-16',
        checkedAt: '2026-06-19',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'j-hrti-chiba-data-center-2026',
    slug: 'j-hrti-chiba-data-center-2026',
    title: 'Japanese consortium J-HRTI to open 50-humanoid data collection facility in Chiba this July',
    titleJa: '日本企業4社のコンソーシアム「J-HRTI」、最大50台のヒューマノイドが稼働するデータ収集拠点を7月に千葉で開業',
    type: 'deployment-report',
    category: 'company-report',
    section: 'deployment',
    summary:
      'ツムラ・レオン自動機・山善・INSOL-HIGHのコンソーシアム「J-HRTI」が、千葉県沿岸部に最大50台のヒューマノイドが稼働するデータ収集センターを2026年7月に開業する。模倣学習用のフィジカルデータを生成・共有し、日本国内での社会実装基盤を作る狙いだ。',
    publishStatus: 'published',
    updatedAt: '2026-06-19',
    reliability: 'official',
    publishedAt: '2026-06-19',
    author: 'Deploid Research',
    industryTags: ['manufacturing', 'research'],
    regionTags: ['japan'],
    themeTags: ['physical-ai'],
    heroImage: {
      src: '/images/articles/j-hrti-chiba-data-center-2026/hero.jpg',
      alt: 'J-HRTI physical AI robot data collection center',
      credit: '株式会社山善',
      sourceUrl: 'https://www.yamazen.co.jp/news/entry-2806.html',
      rights: {
        status: 'reference-attributed',
        sourceType: 'press-release',
        rightsHolder: '株式会社山善',
        checkedAt: '2026-06-20',
        permissionNote:
          '山善公式プレスリリース（共同通信PRワイヤー配信）添付の施設イメージより取得。利用条件の明記は確認できなかったため reference-attributed として掲載。',
      },
    },
    whyItMatters:
      '日本国内でヒューマノイドの模倣学習データを専門に生成する拠点が、政府主導ではなく民間4社の枠組みで2026年7月に稼働を始める。海外メーカーの汎用モデルに依存しない、現場特性に合わせたデータ基盤が日本に育つかどうかを見る定点として重要だ。',
    keyTakeaways: [
      'ツムラ・レオン自動機・山善が運営委員、INSOL-HIGHが事務局となるコンソーシアム「J-HRTI」が2026年3月26日設立を発表',
      '千葉県沿岸部の約1,400平方メートルの施設で、最大50台のヒューマノイドが稼働するデータ収集センターを2026年7月開業予定',
      'オペレーター・アノテーターなど約100名が常駐し、模倣学習用のフィジカルデータを生成・共有する体制',
      '政府主導ではなく民間企業4社だけで構成される枠組みである点が特徴',
      '参加ロボットメーカー・データ提供条件・外部企業への開放方針は2026年6月時点で未公表（要確認）',
    ],
    body: `## 千葉に最大50台のヒューマノイドが稼働するデータ拠点

ツムラ、レオン自動機、山善の3社が運営委員、INSOL-HIGHが事務局を務めるコンソーシアム「J-HRTI（Japan Humanoid Robot Training & Implementation）」が2026年3月26日に設立を発表した。同コンソーシアムが整備する「フィジカルAI・ロボットデータ収集センター」は、千葉県沿岸部の約1,400平方メートルの施設に、最大50台のヒューマノイドロボットを稼働させる体制で2026年7月の開業を予定している。山善の公式発表によると、現場にはオペレーター・アノテーターなど約100名が常駐する計画だ。

## なぜ民間4社だけで動いているか

このコンソーシアムの特徴は、政府主導ではなく民間企業4社だけで構成されている点にある。漢方薬大手のツムラ、食品機械のレオン自動機、産業機械商社の山善という、ロボットメーカーではない事業会社が中心になっているのも特徴的だ。狙いは、ヒューマノイドロボットの模倣学習（imitation learning）に必要なフィジカルデータを大規模に生成・共有することにある。ロボット単体の性能ではなく、現場作業を模した動作データそのものを資産として位置付け、日本国内でヒューマノイドの社会実装を進める基盤を作る発想だ。山善が産業機械の商社として国内の製造・物流現場に広い顧客基盤を持つこと、レオン自動機が食品加工機械で精密なハンドリング工程に強みを持つことを踏まえると、収集するデータの種類も特定の業種に偏らない設計を意図している可能性がある。

## 実運用の現実：オペレーターとアノテーターが常駐する作業現場

最大50台という規模は、単発の実証実験というより、データ生成を継続的な業務として運用する体制を指す。約100名のオペレーター・アノテーターが常駐するという規模は、ロボット自体への投資だけでなく、データに人手で意味付け（アノテーション）を行う作業の比重が大きいことを示唆する。模倣学習用のデータセットは、ロボットの動作ログだけでは不十分で、人による検証・ラベリングが品質を左右するため、この体制はその前提に沿ったものと見られる。施設の具体的な稼働開始日、参加するロボットメーカー・機種、データの提供先・利用条件については、2026年6月時点で公表されている情報の範囲を超える内容は確認できていない（要確認）。これらは開業が近づくにつれて明らかになっていくとみられ、続報を追う価値がある。

## 日本企業が参照できる点

製造業・物流業がヒューマノイド導入を検討する際、最大のハードルの一つは自社の現場に合わせた動作をどう学習させるかという点だ。J-HRTIのような専用データ収集拠点が国内に生まれることは、海外メーカーの汎用モデルに依存しない、日本の現場特性に合わせたデータ基盤が育つ可能性を示す。同種の現場（多品種少量生産、繊細なハンドリングが必要な工程など）を持つ企業にとっては、(1)このセンターが将来外部企業のデータ収集ニーズを受け入れるか、(2)生成されたデータやモデルの提供条件、(3)2026年7月の開業後の実際の稼働実績、を継続的に確認する価値がある。データそのものが事業資産になるという発想は、ロボット導入を機体の購入や賃借だけで捉えていた企業にとって、調達戦略の再検討を促す材料になる。自社の現場データを外部に出さずに学習基盤を構築する選択肢と、こうした共同拠点を利用する選択肢のどちらが妥当かは、データの機密性と投資規模の両面から個別に判断する必要がある。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: ['research-development'],
    sources: [
      {
        title: '民間企業４社によるコンソーシアム「J-HRTI(ジェイハーティ)」を設立',
        url: 'https://www.yamazen.co.jp/news/entry-2806.html',
        publisher: '株式会社山善',
        publishedAt: '2026-03-26',
        checkedAt: '2026-06-19',
        reliability: 'official',
      },
      {
        title: '山善ら4社がヒューマノイドロボット社会実装コンソーシアム「J-HRTI」設立',
        url: 'https://robotstart.info/article/2026/03/27/381725.html',
        publisher: 'ロボスタ',
        publishedAt: '2026-03-27',
        checkedAt: '2026-06-19',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'nvidia-halos-robotics-safety-2026',
    slug: 'nvidia-halos-robotics-safety-2026',
    title: 'NVIDIA launches Halos for Robotics safety stack, with Agility bringing it to industrial humanoids',
    titleJa:
      'NVIDIA、ロボット安全システム「Halos for Robotics」を発表--Agility Digitの産業導入で安全・認証が前面に',
    type: 'tech-update',
    category: 'analysis',
    section: 'tech',
    summary:
      'NVIDIAが2026年6月22日に、ロボット/フィジカルAI向け安全システム「Halos for Robotics」を発表した。Agility Roboticsが最初の適用企業となり、Digitの産業運用に向けた安全アーキテクチャと認証準備を進める。',
    publishStatus: 'published',
    updatedAt: '2026-06-23',
    reliability: 'official',
    publishedAt: '2026-06-23',
    author: 'Deploid Research',
    industryTags: ['manufacturing', 'logistics'],
    themeTags: ['safety', 'physical-ai'],
    heroImage: {
      src: '/images/article-generic/safety-certification/construction-safety-helmet.jpg',
      alt: 'Worker in safety helmet and vest performing a site inspection',
      credit: 'RDNE Stock project / Pexels',
      sourceUrl: 'https://www.pexels.com/photo/construction-worker-in-yellow-safety-vest-and-helmet-checking-glass-window-of-a-house-8293699/',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'RDNE Stock project',
        licenseUrl: 'https://www.pexels.com/license/',
        checkedAt: '2026-06-25',
        permissionNote: 'Pexels Licenseの汎用イメージ。NVIDIA/Agility実機ではなく、安全・現場検証のテーマを示す代替画像として使用。',
      },
    },
    whyItMatters:
      'ヒューマノイドを人の横で動かすには、機体性能だけでなく安全アーキテクチャ、外部センサー、認証準備、運用現場での検証が必要になる。NVIDIAとAgilityの発表は、物流・製造現場の導入判断で「安全を誰がどう担保するか」をベンダー選定の主項目に引き上げる材料だ。',
    keyTakeaways: [
      'NVIDIAは2026年6月22日、ロボット/フィジカルAI向け安全システム「Halos for Robotics」を発表した',
      'Agility Roboticsが最初の適用企業となり、Digit向けの安全関連システムにNVIDIA IGX ThorとHalos Coreを組み込む計画',
      '対象は工場、倉庫、物流現場で、NVIDIA発表ではAmazon、GXO、Schaeffler、Toyota Motor Manufacturing CanadaがAgilityの顧客として挙げられている',
      '構成要素はAIコンピュート、センサー接続、OS/安全アプリ、外部カメラを使うOutside-In Safety Blueprint、AI Systems Inspection Labまで広い',
      'IEC 61508、ISO 13849、ISO/IEC TR 5469などを参照した第三者認証前の検証準備が明記されており、導入企業は「認証済み」ではなく「認証に向けた検証段階」として読む必要がある',
    ],
    body: `## 安全が「あとで確認する項目」ではなくなった

NVIDIAは2026年6月22日、ロボットとフィジカルAI向けの安全システム「Halos for Robotics」を発表した。これは新しいヒューマノイド本体の発表ではない。AIコンピュート、センサー接続、OS、安全アプリ、外部検査ラボを組み合わせ、ロボットが人や設備の近くで動くための安全アーキテクチャを整える発表である。

Deploidの読者である製造・物流・施設運営の導入担当者にとって重要なのは、ここで安全が単なるチェックリストではなく、ロボット選定の中核条件として扱われている点だ。ヒューマノイドは形状として人間の作業環境に入りやすい一方、実際の現場では人、台車、棚、フォークリフト、他の自動化設備が同時に動く。機体がどれだけ器用に動けるかだけでは、PoC後の常設判断には足りない。

## Agility Digitが最初の適用先になる

NVIDIAの発表では、Agility RoboticsがHalos for Roboticsの要素を取り込む最初の企業として位置付けられている。対象は同社のヒューマノイド「Digit」で、工場、倉庫、物流現場での作業を前提に、NVIDIA IGX ThorとHalos CoreをAgility独自の安全な人検知システムへ統合する計画だ。

ここで注意したいのは、発表が「Digitがすでに包括的な第三者認証を完了した」という内容ではない点である。NVIDIAとAgilityは、Digitの安全関連ソフトウェア、AIコンポーネント、サイバーセキュリティ保護が、IEC 61508、ISO 13849、ISO/IEC TR 5469などの基準に沿うよう、最終的な第三者認証の前段階で検証していくとしている。導入企業は、発表文の勢いよりも、どの安全機能がどの現場条件で検証済みなのかを確認する必要がある。

## 外部カメラまで含むフルスタックの意味

Halos for Roboticsの特徴は、ロボット本体の制御だけで完結しない点にある。NVIDIAは、IGX ThorとHoloscan Sensor Bridgeによるコンピュート/センサー接続、Halos OSとHalos Coreによる安全関連機能、外部カメラとAIエージェントを使ってロボットの挙動を制御するOutside-In Safety Blueprint、さらにAI Systems Inspection Labを構成要素として挙げている。

これは、ヒューマノイドの安全を「ロボットの目と反射神経」だけに任せるのではなく、現場側のセンサー、停止条件、ソフトウェア更新、検査プロセスまで含めて設計する方向性を示す。倉庫の通路幅、作業者の動線、荷姿、照明、既存設備との干渉は現場ごとに違うため、安全機能も機体スペックだけでは評価しにくい。外部センサーを前提にした安全設計は、導入企業側の設備投資や現場レイアウト変更にも関係する。

## 日本の導入企業が見るべきチェック項目

この発表から日本の導入企業が読み取るべき論点は、NVIDIA採用の有無そのものではない。第一に、ベンダーが安全関連機能をどの標準に対応させようとしているか。第二に、その検証がロボット単体なのか、外部カメラや現場設備を含むシステム全体なのか。第三に、PoCの段階で停止条件、ニアミス記録、遠隔介入、ソフトウェア更新時の再評価をどう扱うかである。

特に人と同じ空間で動かす計画では、作業成功率だけをKPIにすると判断を誤る。何回ピッキングできたか、何時間止まらずに動いたかに加えて、人の侵入時にどう減速・停止したか、照明や棚配置が変わった時に安全機能が維持されたか、異常時の責任分界が契約上どう定義されるかを確認する必要がある。

## 導入判断への含意

ヒューマノイド市場では、動作デモや生成AIとの連携が注目されやすい。しかし実際に常設導入へ進む企業にとっては、安全アーキテクチャと認証準備の説明能力が、価格や作業速度と同じくらい重要になる。NVIDIAとAgilityの発表は、産業向けヒューマノイドの比較軸が「どの作業ができるか」から「どの条件なら安全に運用できるか」へ広がっていることを示す。

今後、ベンダー比較では、対応標準、第三者検査の範囲、外部センサー要件、現場側の改修負担、事故/ニアミス時のログ提供、認証取得までのロードマップを並べて見る必要がある。これは導入を遅らせるための論点ではない。PoCを本番運用につなげるために、初期段階から仕様書と評価項目へ入れておくべき条件である。`,
    relatedRobotIds: ['agility-digit'],
    relatedManufacturerIds: ['agility-robotics'],
    relatedUseCaseIds: ['warehouse-picking', 'factory-assembly-support'],
    sources: [
      {
        title: 'NVIDIA Announces Halos for Robotics, the Industry’s First Full-Stack Safety System for Physical AI',
        url: 'https://nvidianews.nvidia.com/news/nvidia-announces-halos-for-robotics-the-industrys-first-full-stack-safety-system-for-physical-ai',
        publisher: 'NVIDIA',
        publishedAt: '2026-06-22',
        checkedAt: '2026-06-23',
        reliability: 'official',
      },
      {
        title: 'Nvidia debuts AI humanoid software to advance robotics safety',
        url: 'https://www.axios.com/2026/06/22/nvidia-humanoid-ai-robotics',
        publisher: 'Axios',
        publishedAt: '2026-06-22',
        checkedAt: '2026-06-23',
        reliability: 'reported',
      },
    ],
  },
  {
    id: 'robot-com-rnoid-workplace-humanoid-2026',
    slug: 'robot-com-rnoid-workplace-humanoid-2026',
    title: 'Robot.com brings R-noid from delivery robots into workplace humanoid tasks',
    titleJa: 'Robot.com、職場向けヒューマノイド「R-noid」を展開--配達ロボットの運用経験を倉庫・店舗作業へ',
    type: 'news-brief',
    category: 'news',
    section: 'business',
    summary:
      'Kiwibotとして配達ロボットを展開してきたRobot.comが、車輪型ヒューマノイド「R-noid」を職場向けに展開している。Business Insiderは、同社が食品サービス、物流、医療などの反復作業を狙い、少数顧客で商用導入を進めていると報じた。',
    publishStatus: 'draft',
    updatedAt: '2026-07-01',
    reliability: 'reported',
    publishedAt: '2026-06-23',
    author: 'Deploid Research',
    industryTags: ['logistics'],
    themeTags: ['business-model', 'commercialization', 'market-analysis'],
    heroImage: {
      src: '/images/article-generic/logistics-warehouse/forklift-warehouse-pallets.jpg',
      alt: 'Forklift moving pallets inside a logistics warehouse',
      credit: 'Bernd Dittrich / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-forklift-driving-through-a-warehouse-filled-with-pallets-F2C_mSrb6iM',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Bernd Dittrich',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Robot.com公式のR-noid画像は許諾未確認のため使用しない。Unsplash Licenseの汎用倉庫イメージで代替。',
      },
    },
    whyItMatters:
      'R-noidは、二足歩行の汎用機ではなく、既存の配達ロボット事業で得た遠隔支援・運用体制を職場作業へ広げるアプローチだ。導入企業にとっては、機体性能だけでなく「現場に入れるまでのデータ収集、遠隔支援、限定タスク設計」をどう評価するかが論点になる。',
    keyTakeaways: [
      'Robot.comはKiwibotとして配達ロボット事業を展開してきた企業で、職場向けロボットに軸足を広げている',
      'Business Insiderは、R-noidが食品サービス、物流、医療などの反復作業を対象にしていると報じた',
      '同記事によると、R-noidは車輪型ヒューマノイドで、注文梱包、箱の積み下ろし、作業台準備などを想定する',
      '初期導入では完全自律ではなく、遠隔支援やデータ収集を含む運用プロセスが重要になる',
      '二足歩行よりも「実務タスクに入れるまでの短さ」を重視するベンダー比較軸として見るべき事例だ',
    ],
    body: `## 配達ロボット企業が職場向けヒューマノイドへ広げる

Robot.comは、Kiwibotとして知られてきた配達ロボット企業である。同社は公式サイトで、配達ロボットから職場向けロボットへ対象を広げ、ハードウェア、AI、運用支援を組み合わせたロボットサービスを掲げている。Business Insiderは2026年6月22日、同社が車輪型ヒューマノイド「R-noid」を食品サービス、物流、医療などの反復作業向けに展開していると報じた。

ここで重要なのは、R-noidが「人間のように歩ける」ことを中心に据えた発表ではない点だ。報道では、注文梱包、箱の積み下ろし、作業台の準備など、限定された現場作業への適用が挙げられている。二足歩行の見栄えよりも、既存施設で移動し、腕を使って作業し、遠隔支援を受けながら稼働率を上げることに焦点がある。

## 導入判断で見るべき点

Robot.comの事例は、ヒューマノイド導入を「機体の自由度」だけで比較する危うさを示している。現場に入れるまでのデータ収集期間、初期自律率、遠隔介入の体制、タスクの切り出し方が導入成否を左右するからだ。Business Insiderは、導入プロセスに数週間単位の設定とデータ収集が含まれると報じており、これはRaaS型の現場立ち上げに近い。

導入企業は、初回PoCで「どれだけ器用に動いたか」だけを見るべきではない。遠隔支援が入った回数、エラー時の復旧時間、既存スタッフがどの程度作業手順を変える必要があったか、ロボットの稼働ログがどこまで提供されるかを確認する必要がある。車輪型であれば段差や狭い通路の制約もある一方、二足機より安定性やメンテナンスで有利な場合がある。

## Deploid読者への示唆

R-noidは、ヒューマノイド市場が単一の形に収束していないことを示す。製造・物流・店舗の導入担当者にとっては、「二足であるか」より「対象タスクを限定して業務KPIに乗せられるか」が先に来る。R-noidのようなアプローチは、価格やスペック表だけでは見えない運用設計力を比較する材料になる。特に初期導入では、自律率100%を前提にせず、遠隔支援を含めた総コストと責任分界を契約前に確認する必要がある。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: [],
    sources: [
      {
        title: 'Delivery robot startup Robot.com is betting its next act on workplace humanoids',
        url: 'https://www.businessinsider.com/delivery-robot-startup-robot-com-workplace-humanoid-rnoid-2026-6',
        publisher: 'Business Insider',
        publishedAt: '2026-06-22',
        checkedAt: '2026-06-23',
        reliability: 'reported',
      },
      {
        title: 'Robot.com',
        url: 'https://www.robot.com/',
        publisher: 'Robot.com',
        checkedAt: '2026-06-23',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'io-ai-teleoperation-training-shenzhen-2026',
    slug: 'io-ai-teleoperation-training-shenzhen-2026',
    title: 'IO-AI shows how body teleoperation is becoming a humanoid data factory',
    titleJa: 'IO-AIの遠隔操作デモが示す、ヒューマノイド学習データ工場としての深圳',
    type: 'analysis',
    category: 'analysis',
    section: 'tech',
    summary:
      'WIREDは、深圳のIO-AIが人の身体動作を使ってヒューマノイドを遠隔操作し、学習データを集める現場を報じた。商用タスクそのものより、ロボットが現場作業を覚えるためのデータ収集工程が事業化しつつある点が重要だ。',
    publishStatus: 'published',
    updatedAt: '2026-06-23',
    reliability: 'reported',
    publishedAt: '2026-06-23',
    author: 'Deploid Research',
    industryTags: ['research'],
    regionTags: ['china'],
    themeTags: ['market-analysis', 'poc', 'physical-ai'],
    heroImage: {
      src: '/images/article-generic/teleoperation-vr/vr-headset-hands-outstretched.jpg',
      alt: 'Person wearing a VR headset with hands raised, mimicking remote-control gestures',
      credit: 'Vitaly Gariev / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/man-wearing-vr-headset-with-hands-outstretched-sESr6zSRxk8',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Vitaly Gariev',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote: 'Unsplash Licenseの汎用イメージ。IO-AI実機ではなく、身体動作による遠隔操作のテーマを示す代替画像として使用。',
      },
    },
    whyItMatters:
      'ヒューマノイド導入のボトルネックは、機体の調達だけでなく、現場動作をどう学習させるかに移っている。IO-AIの事例は、遠隔操作、データ収集、模倣学習がPoC前の準備工程として重要になることを示している。',
    keyTakeaways: [
      'WIREDは2026年6月、深圳のIO-AIが身体動作ベースの遠隔操作でヒューマノイドを動かす現場を報じた',
      'IO-AIは公式サイトでヒューマノイド「Exia」を掲げ、データ収集とロボット学習に関わる事業を示している',
      '遠隔操作は単なる代替操縦ではなく、模倣学習用の作業データを作る工程として重要になる',
      '導入企業は、PoC前に「自社作業をどれだけデータ化できるか」を評価する必要がある',
      '深圳のハードウェア供給網は、機体・センサー・治具・改善サイクルの短さで競争力を持つ',
    ],
    body: `## 遠隔操作は「人が代わりに動かす仕組み」だけではない

WIREDは2026年6月17日、深圳のIO-AIで、人が身体を使ってヒューマノイドを遠隔操作する現場を報じた。IO-AIは公式サイトで、ヒューマノイド「Exia」と、ロボット学習に向けたデータ収集・操作技術を掲げている。記事の焦点は、ヒューマノイドがすでに完全自律であらゆる作業をこなすという話ではない。人が操作し、その操作ログを蓄積し、ロボットが作業を学ぶためのデータを作る工程にある。

この点は、導入企業が見落としやすい。ヒューマノイドのPoCでは、機体を持ち込めばすぐに現場作業へ入れると期待しがちだ。しかし多くの作業は、持つ、置く、避ける、向きを変える、確認する、待つといった細かな判断の連続である。作業手順書に書かれていない動きほど、ロボットにとっては学習データが必要になる。

## 深圳が持つデータ収集の速度

深圳の強みは、ロボット本体だけではない。センサー、アクチュエータ、治具、通信機器、試作部品を短いサイクルで揃え、遠隔操作とデータ収集の環境を組み替えられる点にある。IO-AIのような企業が示すのは、ヒューマノイド市場の競争軸が「完成品の性能」から「現場データを高速に集めて更新する仕組み」へ広がっていることだ。

導入企業にとって、これは調達プロセスの前倒しを意味する。ベンダー比較の段階で、対応できる作業だけでなく、どのような遠隔操作環境を持つか、データの所有権は誰にあるか、収集したデータを他社モデル学習に使うのか、機密情報を含む現場映像をどう扱うのかを確認する必要がある。

## PoCの評価項目に入れるべきこと

IO-AIの事例から、PoC前のチェック項目は明確になる。第一に、自社作業を分解し、何を人が遠隔操作で教える必要があるか。第二に、遠隔操作時の映像、力覚、関節ログ、失敗ログがどの粒度で保存されるか。第三に、そのデータを使った改善サイクルが何日単位で回るか。第四に、遠隔支援が本番運用でも必要な場合、その費用と責任分界がどう定義されるか。

ヒューマノイド導入は、機体を買う話で終わらない。現場作業をデータ化し、そのデータでロボットを改善する運用能力を持つかどうかが、PoCの成否を左右する。IO-AIの遠隔操作デモは、その前提を分かりやすく示している。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: ['research-development', 'factory-assembly-support'],
    sources: [
      {
        title: 'Operating a Humanoid With Your Body, in China’s Hardware Capital',
        url: 'https://www.wired.com/story/humanoid-robot-training-in-chinas-hardware-capital/',
        publisher: 'WIRED',
        publishedAt: '2026-06-17',
        checkedAt: '2026-06-23',
        reliability: 'reported',
      },
      {
        title: 'IO-AI',
        url: 'https://io-ai.tech/',
        publisher: 'IO-AI',
        checkedAt: '2026-06-23',
        reliability: 'official',
      },
    ],
  },
  {
    id: 'pudu-d7-industrial-semi-humanoid-2026',
    slug: 'pudu-d7-industrial-semi-humanoid-2026',
    title: 'Pudu Robotics launches D7, a wheeled semi-humanoid for round-the-clock warehouse work',
    titleJa: 'Pudu Robotics、24時間稼働を狙う車輪型の産業用半人型ロボット「D7」を発表',
    type: 'tech-update',
    category: 'analysis',
    section: 'tech',
    summary:
      'サービスロボットで実績を持つPudu Roboticsが、産業用の半人型ロボット「PUDU D7」を発表した。14kgペイロード、両腕の力制御、自動バッテリー交換を備え、二足歩行ではなく車輪移動を採用する。倉庫・工場の高頻度タスクに特化した設計だ。',
    publishStatus: 'published',
    updatedAt: '2026-06-25',
    reliability: 'reported',
    publishedAt: '2026-06-25',
    author: 'Deploid Research',
    industryTags: ['manufacturing', 'logistics'],
    regionTags: ['china'],
    themeTags: ['market-analysis'],
    heroImage: {
      src: '/images/article-generic/industrial-automation/factory-orange-machines.jpg',
      alt: 'Industrial robotic arms on a factory production line',
      credit: 'Simon Kadula / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-factory-filled-with-lots-of-orange-machines-8gr6bObQLOI',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Simon Kadula',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-06-25',
        permissionNote:
          'Unsplash Licenseの汎用イメージ。PUDU D7実機ではなく、産業用ロボットの現場イメージとして使用。',
      },
    },
    whyItMatters:
      'D7は「歩く人型」ではなく「特定の繰り返し作業を止めずに回す車輪型」を打ち出している。倉庫・工場の現場改善担当者は、二足歩行か車輪型かをスペック上の優劣で判断せず、自社の床面状況や24時間稼働の必要性を基準に比較対象へ加えるべきだ。',
    keyTakeaways: [
      'Pudu Roboticsが2026年6月1日、産業用半人型ロボット「PUDU D7」を発表した',
      '14kgペイロード、両腕の力制御、触覚センシング、自動バッテリー交換を備え、車輪移動を採用する',
      '自社基盤モデル「PuduFM 1.0」で稼働データから作業を学習し、継続的に改善すると説明されている',
      '想定用途は搬送、棚からのピッキング、補充、構内物流など倉庫・工場の高頻度タスク',
      '価格・出荷時期・日本展開計画は現時点の公式発表に含まれておらず、Pudu Roboticsはまだメーカーデータベースに未登録',
    ],
    body: `## Pudu Robotics、車輪型で24時間稼働を狙う産業用ロボット「D7」を発表

中国・深圳のPudu Roboticsは2026年6月1日、産業用の半人型ロボット「PUDU D7」を発表した。PR Newswire経由の公式発表によると、D7は14kgのペイロード、両腕の力制御、触覚センシング、360度の環境認識、自動バッテリー交換機能を備え、二足歩行ではなく車輪移動を採用している。倉庫・工場向けに、搬送、棚からのピッキング、補充、構内物流といった高頻度タスクを想定する。

## 「歩く人型」ではなく「学習する半人型」を打ち出す

D7は自社の基盤モデル「PuduFM 1.0」を搭載し、稼働データから作業を学習し、実行を継続的に改善すると説明されている。Pudu Roboticsはサービスロボット（配膳・清掃ロボット）で実績を持つ企業であり、二足歩行の見た目を追わず、既存の倉庫オペレーションに合わせた車輪型・固定タスク特化の設計を選んでいる。自動バッテリー交換による24時間稼働という訴求も、研究機ではなく現場の稼働率を重視した製品設計であることを示す。

## 既存プレイヤーとの違い

二足歩行のヒューマノイドが「人の代わりに歩いて作業する」ことを目指すのに対し、D7は「特定の繰り返し作業を止めずに回す」ことに特化している。これは、RobotEraの中国郵政向け固定型アーム機や、Agility DigitのようなRaaS型搬送ロボットと同じ系譜にある。車輪型は段差や階段のある現場には弱いが、平坦な倉庫・工場フロアでは二足歩行よりも安定性・メンテナンス性で有利になりやすい。

## 導入検討時の論点

PUDU D7は発表段階であり、価格、出荷時期、日本市場への展開計画は現時点の公式発表に含まれていない。倉庫・工場の現場改善担当者にとっては、「二足歩行か車輪型か」をスペック上の優劣で判断せず、自社の床面状況、稼働時間の要件（24時間稼働の必要性）、既存の搬送機器との置き換えやすさを基準に比較対象へ加えるべき製品だ。Pudu Roboticsは現時点でDeploidのメーカーデータベースに登録がなく、価格・出荷条件の確認が取れた段階で改めてメーカー・機体情報を追加する。

## サービスロボット企業が産業用途へ広げる流れ

Pudu Roboticsはこれまで配膳ロボット・清掃ロボットといったサービス業向け機体で実績を積んできた企業で、ヒューマノイド専業メーカーとして立ち上がった企業ではない。この経緯は、D7の設計判断にも表れている。研究開発段階の二足歩行機を一から作るのではなく、既存の自律移動・センシング技術を産業用途向けに転用し、ペイロードと稼働時間を伸ばす方向に振っている。Robot.comのR-noidが配達ロボット事業の運用知見を職場向けロボットに転用した事例と同様、ヒューマノイド市場では「既存ロボット事業の隣接領域への展開」が、ゼロから二足歩行機を開発するより速い立ち上がりの手段になりつつある。導入企業にとっては、メーカーの出自が配膳・清掃・配送のどこにあるかを見ることで、得意とする現場条件（屋内平坦面か、屋外段差ありか）をある程度推測できる。`,
    relatedRobotIds: [],
    relatedManufacturerIds: [],
    relatedUseCaseIds: ['warehouse-picking'],
    sources: [
      {
        title: 'PUDU Embodied Unveils the Next-Generation PUDU D7: Opening a New Chapter for Industrial Semi-Humanoid Robotics',
        url: 'https://www.prnewswire.com/news-releases/pudu-embodied-unveils-the-next-generation-pudu-d7-opening-a-new-chapter-for-industrial-semi-humanoid-robotics-302786976.html',
        publisher: 'PR Newswire / Pudu Robotics',
        publishedAt: '2026-06-01',
        checkedAt: '2026-06-25',
        reliability: 'official',
      },
      {
        title: "China's Pudu Robotics Unveils Industrial Semi-Humanoid Robot PUDU D7",
        url: 'https://theaiinsider.tech/2026/06/03/chinas-pudu-robotics-unveils-industrial-sem-humanoid-robot-pudu-d7/',
        publisher: 'The AI Insider',
        publishedAt: '2026-06-03',
        checkedAt: '2026-06-25',
        reliability: 'reported',
      },
    ],
  },

  {
    id: 'unitree-manufacturer-guide',
    slug: 'unitree-manufacturer-guide',
    previousSlugs: ['unitree-manufacturer-guide-vol-1-1'],
    title: 'Unitree Robotics: buyer-focused company guide',
    titleJa: 'メーカー解説シリーズ vol.1.1｜Unitree Roboticsをどう見るか？ 価格・実績・日本での調達',
    type: 'manufacturer-guide',
    category: 'company-report',
    section: 'business',
    summary:
      'Unitree Roboticsを、研究・教育・初期PoCの調達候補としてどう評価すべきか。価格、供給力、実装段階、日本の窓口を分けて整理する。',
    publishStatus: 'published',
    updatedAt: '2026-07-13',
    reliability: 'reported',
    publishedAt: '2026-07-12',
    author: 'Deploid Research',
    industryTags: ['manufacturing', 'research'],
    themeTags: ['commercialization', 'business-model'],
    heroImage: {
      src: '/images/articles/unitree-manufacturer-guide/hero.jpg',
      alt: 'Unitree G1 humanoid robot on stage at Japan Mobility Show 2025',
      credit: 'RuinDig / Wikimedia Commons (CC BY 4.0)',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Japan-Mobility-Show-2025-RuinDig_0563.jpg',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'RuinDig (Yuki Uchida)',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        checkedAt: '2026-07-12',
      },
    },
    relatedRobotIds: ['unitree-r1', 'unitree-r1-standard', 'unitree-g1', 'unitree-g1-edu', 'unitree-h1', 'unitree-h2', 'unitree-h2-plus'],
    relatedManufacturerIds: ['unitree', 'agility-robotics', 'ubtech'],
    relatedUseCaseIds: [],
    whyItMatters:
      'Unitreeは、ヒューマノイドを低価格で手に入れたい組織にとって最も現実的な候補の一つである。ただし、入手しやすさと、第三者の現場で業務を任せられることは別問題である。',
    sources: [
      {
        title: 'Unitree G1 official page',
        url: 'https://www.unitree.com/g1/',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-07-12',
        reliability: 'official',
      },
      {
        title: 'Unitree H2 official shop',
        url: 'https://shop.unitree.com/products/unitree-h2',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-07-12',
        reliability: 'official',
      },
      {
        title: 'Unitree R1 official page',
        url: 'https://www.unitree.com/R1',
        publisher: 'Unitree Robotics',
        checkedAt: '2026-07-12',
        reliability: 'official',
      },
      {
        title: '粗利率60％超の衝撃ーー中国「Unitree」、なぜ人型ロボットで稼げるのか',
        url: 'https://36kr.jp/494285/',
        publisher: '36Kr Japan',
        checkedAt: '2026-07-13',
        reliability: 'reported',
        note: 'IPO目論見書ベースの売上・出荷・粗利率・平均販売価格・内製戦略・春晩後の需要拡大の根拠。',
      },
      {
        title: "A Complete Guide To Unitree Robotics' 2026 IPO",
        url: 'https://kraneshares.com/a-complete-guide-to-unitree-robotics-2026-ipo-why-it-matters-for-star-market-etf-kstr-humanoid-robotics-etf-koid/',
        publisher: 'KraneShares',
        checkedAt: '2026-07-13',
        reliability: 'reported',
        note: '2016年杭州設立・四足シェア60%超・人型の売上比率約52%・2026年後半の上場計画の根拠。',
      },
      {
        title: '軽快に走って踊るUNITREEのヒューマノイドは中国でなぜ売れるのか',
        url: 'https://spap.jst.go.jp/china/experiences/science/st_25118.html',
        publisher: 'Science Portal China（JST）',
        checkedAt: '2026-07-13',
        reliability: 'reported',
        note: '大学・政府機関の落札件数（2025年92件）、同済大学の10台825万元、変電所点検・消防偵察の開発案件、レンタル商流、R1級3万元の根拠。',
      },
      {
        title: 'Unitree G1 製品ページ（国内正規代理店）',
        url: 'https://techshare.co.jp/product/unitree/g1/',
        publisher: 'TechShare',
        checkedAt: '2026-07-13',
        reliability: 'official',
      },
      {
        title: 'Unitree ヒューマノイド取扱ページ',
        url: 'https://tohasen.com/robot/unitree/human/',
        publisher: 'Tohasen Robotics',
        checkedAt: '2026-07-13',
        reliability: 'official',
      },
      {
        title: 'GMO AI＆ロボティクス商事、Unitree Roboticsの国内正規代理店に',
        url: 'https://gmo-air.com/news/article/gmo-unitree/',
        publisher: 'GMO AI&ロボティクス商事',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: '正規代理店契約と「販売から導入支援・通信の安全性担保までワンストップ提供」の根拠。',
      },
      {
        title: '化学プラントの危険作業をヒューマノイドで代替（旭化成のUnitree G1実証実験）',
        url: 'https://gmo-air.com/news/article/asahi-kasei-poc/',
        publisher: 'GMO AI&ロボティクス商事',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: '旭化成のカゴ搬送省人化に向けたG1実証実験の根拠（発表主体はGMO AIR）。',
      },
      {
        title: 'GMO／中国のヒューマノイドメーカー「Unitree」国内正規代理店に',
        url: 'https://www.lnews.jp/2026/06/s0619605.html',
        publisher: 'LNEWS',
        checkedAt: '2026-07-13',
        reliability: 'reported',
      },
      {
        title: 'Notice of Availability of Designation of Chinese Military Companies',
        url: 'https://www.federalregister.gov/documents/2026/06/10/2026-11571/notice-of-availability-of-designation-of-chinese-military-companies',
        publisher: 'Federal Register',
        checkedAt: '2026-07-12',
        reliability: 'official',
        note: '米国防総省の1260HリストにUnitreeが含まれることの一次情報。',
      },
    ],
    manufacturerGuideContent: {
      companyOverview:
        'Unitree Robotics（宇樹科技）は、2016年に中国・杭州で設立されたロボットメーカーである。事業は四足歩行ロボット、人型ロボット、モーター・減速機・LiDARなどのロボット部品の3本柱で、四足歩行ロボットでは世界シェア60%超とされる。人型はこの会社にとって実験ではなくすでに主力であり、2025年1〜9月期には売上の約52%を人型が占めた。\n\n競争軸は一貫して価格である。中核アルゴリズムからコア部品までを自社開発し、四足と人型で関節制御・機械構造・バッテリー管理を共用して重複投資を抑えることで、値下げを続けながら59.5%（2025年1〜9月期）という高い粗利率を維持している。\n\n規模を示す数字としては、2025年に四足歩行ロボット1万8,000台超、人型5,500台を販売した。低価格で実機を入手しやすい量産メーカーであり、研究・教育・開発用途の調達で最初に名前が挙がる存在といえる。',
      productLineup:
        'ヒューマノイドはR1、G1、H1・H2の3系統で構成される。R1系は小型・低価格の入門機、G1系は研究・開発の標準機、H1・H2系はフルサイズ機で、H2 PlusはNVIDIAとの協業で発表されたAI開発プラットフォームとしてH2とは構成と価格帯が異なる。人型のほかに四足歩行ロボットのGoシリーズとロボット部品も販売している。\n\nいずれの系統も公式価格が公開されており、R1 AIRは$4,900〜、G1は$13,500〜、H2は$29,900〜と初期導入コストを見積もりやすい。内製による原価低減をそのまま販売価格に反映する値付けで、この価格は本体の目安のため税・送料・国内での保守や開発支援の費用は含まない。',
      lineup: [
        { robotId: 'unitree-r1', roleLabel: '低予算での教育・実験・展示の入口', priceLabel: '$4,900〜' },
        { robotId: 'unitree-r1-standard', roleLabel: 'R1シリーズの上位構成', priceLabel: '$5,900〜' },
        { robotId: 'unitree-g1', roleLabel: '研究・開発・初期PoCの標準候補', priceLabel: '$13,500〜' },
        { robotId: 'unitree-g1-edu', roleLabel: '二次開発向けの構成', priceLabel: '要見積' },
        { robotId: 'unitree-h1', roleLabel: 'フルサイズ機の運動性能を検証する機体', priceLabel: '要問い合わせ' },
        { robotId: 'unitree-h2', roleLabel: 'フルサイズの現行主力', priceLabel: '$29,900〜' },
        { robotId: 'unitree-h2-plus', roleLabel: 'AI開発・データ収集を含む上位構成', priceLabel: '$100,000' },
      ],
      history:
        'Unitreeの事業は四足歩行ロボットから始まった。2016年の設立後、Goシリーズなどの四足機を量産して研究機関や点検用途に販売してきたが、2022年から2024年の年間売上高は1億〜3億元にとどまり、同時期の優必選（UBTECH）の10分の1程度の規模だった。\n\n人型への転換は四足で培った技術の転用として進んだ。関節制御・機械構造・バッテリー管理を四足と共用することでH1からG1、R1へと機体を広げながら値下げを続け、人型の平均販売価格は2025年1〜9月期に前年同期比35.7%減の16万7,600元となりR1系では3万元まで下がった。\n\n転機は2025年の春節番組「春晩」でのパフォーマンスである。認知が一気に広がって商業イベントやレンタルの需要が立ち上がり、2025年1〜9月期の売上高は前年までの数倍にあたる11億5,000万元へ拡大して黒字転換した。現在は2026年後半の上場を計画する段階にある。',
      deploymentIntro:
        '公開情報で確認できる実装段階を、研究から商用まで5分類で整理する。',
      deploymentStatus: {
        researchEducation: {
          evidence: 'confirmed',
          body: '中国の大学・研究機関・政府機関による調達は2025年だけで92件の落札があり、前年の2.4倍に増えた。同済大学は研究・教育用途で人型10台を825万元で購入している。',
          sourceUrls: ['https://spap.jst.go.jp/china/experiences/science/st_25118.html'],
        },
        exhibitionDemo: {
          evidence: 'confirmed',
          body: 'テレビ番組・展示会・ロボットイベントでの実演が繰り返し確認できる。パフォーマンスの披露自体が同社の認知と販売の導線になっている。',
          sourceUrls: ['https://spap.jst.go.jp/china/experiences/science/st_25118.html'],
        },
        poc: {
          evidence: 'limited',
          body: '中国では変電所点検や消防偵察に向けた開発案件が報じられている。日本でも旭化成が化学プラントのカゴ搬送省人化に向けたG1の実証実験を進めている。いずれも本番運用の確認はない。',
          sourceUrls: [
            'https://spap.jst.go.jp/china/experiences/science/st_25118.html',
            'https://gmo-air.com/news/article/asahi-kasei-poc/',
          ],
        },
        internalTrial: {
          evidence: 'none',
          body: '自社工場や自社施設で人型を業務に投入していることを示す公開情報は確認できない。',
        },
        commercial: {
          evidence: 'limited',
          body: '中国ではレンタル業者がUnitree機を仕入れ、店舗集客やイベント出演用に貸し出す商流が報じられている。物流・製造のような作業系業務での第三者現場の長期運用は、公開情報では確認できない。',
          sourceUrls: ['https://spap.jst.go.jp/china/experiences/science/st_25118.html'],
        },
      },
      procurementChannels: [
        {
          kind: 'official-direct',
          name: 'Unitree公式オンラインショップ',
          url: 'https://shop.unitree.com/',
          role: '本体の直販。日本への発送条件・保守対応は要確認',
        },
        {
          kind: 'domestic-distributor',
          name: 'TechShare',
          url: 'https://techshare.co.jp/product/unitree/g1/',
          role: '国内正規代理店。研究・開発向けに人型機を販売',
        },
        {
          kind: 'domestic-distributor',
          name: 'Tohasen Robotics',
          url: 'https://tohasen.com/robot/unitree/human/',
          role: '国内正規代理店。人型機の販売を取り扱う',
        },
        {
          kind: 'domestic-distributor',
          name: 'GMO AI&ロボティクス商事（GMO AIR）',
          url: 'https://gmo-air.com/',
          role: '国内正規代理店。販売に加え、導入支援から通信の安全性担保までのワンストップ提供を掲げる',
        },
      ],
      japanProcurement:
        '※調達リスクとして、2026年6月に米国防総省の1260HリストへUnitreeが追加された。日本の民生調達を直接禁止する指定ではないが、米国の取引先・投資家・海外拠点を持つ組織では問い合わせ前に影響範囲を確認しておく必要がある。',
      faq: [],
    },
  },
  {
    id: 'agility-robotics-manufacturer-guide',
    slug: 'agility-robotics-manufacturer-guide',
    title: 'Agility Robotics: company profile and buyer\'s guide',
    titleJa: 'メーカー解説シリーズ vol.2.1｜Agility Roboticsをどう見るか？ Digitの商用実績・価格・日本での相談窓口',
    type: 'manufacturer-guide',
    category: 'company-report',
    section: 'business',
    summary:
      'Agility Roboticsを、物流・製造の商用導入候補としてどう評価すべきか。価格非公開の理由、商用実績、安全設計、日本からの相談窓口を分けて整理する。',
    publishStatus: 'published',
    updatedAt: '2026-07-13',
    reliability: 'reported',
    publishedAt: '2026-07-08',
    author: 'Deploid Research',
    industryTags: ['logistics', 'manufacturing'],
    themeTags: ['business-model', 'commercialization', 'safety'],
    heroImage: {
      src: '/images/article-generic/logistics-warehouse/forklift-warehouse-pallets.jpg',
      alt: 'Forklift moving pallets inside a logistics warehouse',
      credit: 'Bernd Dittrich / Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-forklift-driving-through-a-warehouse-filled-with-pallets-F2C_mSrb6iM',
      rights: {
        status: 'licensed',
        sourceType: 'third-party',
        rightsHolder: 'Bernd Dittrich',
        licenseUrl: 'https://unsplash.com/license',
        checkedAt: '2026-07-08',
        permissionNote:
          'Agility Robotics公式画像はTerms of Use上、利用条件が限定されるため使用しない。代わりにUnsplash Licenseの汎用倉庫イメージを使用。Digit実機ではない。',
      },
    },
    relatedRobotIds: ['agility-digit'],
    // fitSummary廃止で本文中の比較言及はUnitree（製品ラインナップ）のみになったため、それ以外を外した（G7）。
    relatedManufacturerIds: ['agility-robotics', 'unitree'],
    relatedUseCaseIds: ['warehouse-picking'],
    whyItMatters:
      'Agility Roboticsは、ヒューマノイドを研究用の機体ではなく、RaaS・クラウド運用・安全設計を含む商用パッケージとして売る数少ないメーカーである。日本から見ると、すぐ買える安価な開発機ではない一方、物流・製造で本番導入を検討する際の比較基準になる。',
    sources: [
      {
        title: 'Agility Robotics company page',
        url: 'https://www.agilityrobotics.com/company',
        publisher: 'Agility Robotics',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: '創業年、OSU発、拠点、RoboFab、沿革、顧客・パートナー表示の根拠。',
      },
      {
        title: 'Agility Robotics solutions',
        url: 'https://www.agilityrobotics.com/solutions',
        publisher: 'Agility Robotics',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'Digit、Arc、サービス体制、物流・製造用途、仕様の根拠。',
      },
      {
        title: 'Digit Moves Over 100,000 Totes',
        url: 'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
        publisher: 'Agility Robotics',
        publishedAt: '2025-11-20',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'GXO Flowery Branchでの10万トート搬送、AMR・コンベヤ連携、学習パイプラインの根拠。',
      },
      {
        title: 'Agility Robotics to Go Public Through Merger with Churchill Capital Corp XI',
        url: 'https://www.agilityrobotics.com/content/agility-robotics-to-go-public-through-merger-with-churchill-capital-corp-xi',
        publisher: 'Agility Robotics',
        publishedAt: '2026-06-24',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'SPAC上場予定、65,000時間超の稼働、9施設、3億ドル超のDigit v5受注、顧客名の根拠。将来見通しは注意して扱う。',
      },
      {
        title: 'Agility Robotics Announces Commercial Agreement with Toyota Motor Manufacturing Canada',
        url: 'https://www.agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada',
        publisher: 'Agility Robotics',
        publishedAt: '2026-02-19',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'Toyota Motor Manufacturing CanadaとのRaaS契約、製造・サプライチェーン・物流用途の根拠。',
      },
      {
        title: 'Mercado Libre and Agility Robotics Announce Commercial Agreement to Deploy Humanoid Robots',
        url: 'https://www.agilityrobotics.com/content/mercado-libre-and-agility-robotics-announce-commercial-agreement',
        publisher: 'Agility Robotics',
        publishedAt: '2025-12-10',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'Mercado Libreのテキサス拠点でのDigit導入、Arcと既存自動化/WMS連携の根拠。',
      },
      {
        title: 'NVIDIA Announces Halos for Robotics, the Industry’s First Full-Stack Safety System for Physical AI',
        url: 'https://nvidianews.nvidia.com/news/nvidia-announces-halos-for-robotics-the-industrys-first-full-stack-safety-system-for-physical-ai',
        publisher: 'NVIDIA',
        publishedAt: '2026-06-22',
        checkedAt: '2026-07-13',
        reliability: 'official',
        note: 'NVIDIA HalosとAgility協業の根拠。',
      },
    ],
    manufacturerGuideContent: {
      companyOverview:
        'Agility Roboticsは、2015年に米国オレゴン州で設立されたヒューマノイドメーカーである。Oregon State UniversityのDynamic Robotics Labを起点とし、本社をオレゴン州セーラムに置く。\n\n事業は人型ロボット専業で、物流・製造現場向けのDigit本体と配備・監視・フリート管理を担うクラウドプラットフォームArc、導入設計からオンサイト保守までのサービス体制の3本柱で構成される。売上高や年間出荷台数は公表されていない。\n\n競争軸は商用実績である。機体を単体で売るのではなく、既存の倉庫・工場設備にDigitを接続した状態で稼働までを請け負う契約型の事業設計を取り、この方式で複数の商用契約を公表してきた。2026年6月に発表された上場計画では企業価値25億ドルと評価されており、研究向けの安価な開発機ではなく物流・製造の本番導入を検討するときの基準になるメーカーといえる。',
      productLineup:
        '製品は物流・製造向けヒューマノイドのDigit一機種に集約され、Unitreeのように価格帯の異なる複数機種を並べる構成を取らない。機体の上にクラウドプラットフォームArcと導入・トレーニング・保守のサービスを積み上げ、この一体構成ごと顧客に提供する。Digit自体は人間サイズの二足歩行機で、公式ページでは約16kgの運搬能力と約4時間のバッテリーに加えて、トート搬送やAMR・コンベヤ連携を前提にした設計が示されている。\n\n価格が非公開なのはこの事業設計の帰結で、実際の費用は台数・作業範囲・Arc利用料・保守・現場改修・システム連携費によって契約ごとに決まる。機体単価で稟議を組む相手ではなく、業務単位の総額で見積もる相手である。',
      lineup: [
        {
          robotId: 'agility-digit',
          roleLabel: '物流・製造の標準化されたマテリアルハンドリング向け商用候補。トート搬送、AMR・コンベヤ連携が主戦場',
          priceLabel: '非公開（RaaS・契約ごとに個別設定）',
        },
      ],
      history:
        'Agilityの起点はOSUの脚ロボット研究である。2015年に研究室から独立し、2016年には二足歩行ロボットCassieが自律歩行を実現した。2017年発表の初代Digitも、現在の商用機というより研究者向けの機体だった。\n\n転機は2023年で、Digitを産業顧客向けに再設計して事業の軸足を研究から商用労働力へ移した。オレゴン州セーラムに構えた自社工場RoboFabは年産ピーク1万台規模と公式に説明されており、受注に先行して量産体制へ投資する段階に入った。\n\n2025年後半からは物流・製造の商用契約が具体的な数字とともに相次いで公表され、導入先は物流倉庫から自動車製造へ広がった。2026年6月にはChurchill Capital Corp XIとの合併による上場計画を発表し、Digit v5の複数年受注3億ドル超を示して上場手続きの段階にある。',
      deploymentIntro:
        '公開情報で確認できる実装段階を、研究から商用まで5分類で整理する。',
      deploymentStatus: {
        researchEducation: {
          evidence: 'limited',
          body: '会社の起点はOSUの研究室で、初代Digitも研究者向けの機体として始まった。現在のAgilityは大学・研究機関向けに安価な開発機を配る事業モデルではない。',
          sourceUrls: ['https://www.agilityrobotics.com/company'],
        },
        exhibitionDemo: {
          evidence: 'limited',
          body: '公式動画や顧客発表でDigitの稼働映像は確認できるが、Agilityが強調するのは展示映えではなく顧客施設での稼働実績である。',
          sourceUrls: ['https://www.agilityrobotics.com/solutions'],
        },
        poc: {
          evidence: 'limited',
          body: 'Toyota Motor Manufacturing CanadaとのRaaS契約は、パイロット後の契約として発表されている。PoC単体の期間・台数・評価指標を示す公開情報は限られる。',
          sourceUrls: ['https://www.agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada'],
        },
        internalTrial: {
          evidence: 'limited',
          body: 'RoboFabという自社製造拠点は存在するが、Digit自身がAgilityの生産工程をどの程度自動化しているかを示す稼働データは公表されていない。',
          sourceUrls: ['https://www.agilityrobotics.com/company'],
        },
        commercial: {
          evidence: 'confirmed',
          body: 'GXOでの10万トート超搬送、Toyota Motor Manufacturing CanadaとのRaaS契約、Mercado Libreのテキサス拠点導入、Schaefflerを含む顧客名が公式に確認できる。2026年6月時点で9施設・6万5,000時間超の運用が示されている。',
          sourceUrls: [
            'https://www.agilityrobotics.com/content/digit-moves-over-100k-totes',
            'https://www.agilityrobotics.com/content/mercado-libre-and-agility-robotics-announce-commercial-agreement',
            'https://www.agilityrobotics.com/content/agility-robotics-to-go-public-through-merger-with-churchill-capital-corp-xi',
          ],
        },
      },
      procurementChannels: [
        {
          kind: 'official-direct',
          name: 'Agility Robotics 公式問い合わせ',
          url: 'https://www.agilityrobotics.com/solutions',
          role: '直販・RaaS契約の一次窓口。日本からの対応可否・導入形態は要確認',
        },
      ],
      japanProcurement:
        '2026年7月時点の公開情報では日本法人・国内正規代理店・国内保守拠点は確認できず、検討は公式の問い合わせ窓口で対象国と導入形態を確認するところから始まる。\n\n※調達リスクとして、現在のDigitは人と完全に混在して働く前提を持たず、Agility自身も次世代のDigit v5で協調安全を目指すと説明している段階である。サービス体制は米国拠点が中心で日本の現場にどこまで届くかは未確認のうえ、上場計画も取引完了前で条件は変わり得る。',
      faq: [],
    },
  },
];
