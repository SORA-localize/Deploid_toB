# DATA-R01-B11 — PAL Robotics

調査日: 2026-07-16

対象: pal-talos, pal-kangaroo（2機）

## 結論

PAL Robotics公式製品ページと公式PDFを確認した。TALOSは研究向け高性能二足ヒューマノイド、KANGAROOは動的ロコモーション・強化学習・Embodied AI研究向けの開発プラットフォームとして位置付けられている。

TALOSは175cm、95kg、32 DoF、片腕6kg、歩行1.5時間／待機3時間、1080Wh、ROS/OROCOS/MoveIt!/Gazeboを確認した。KANGAROOは身長1.58m、重量50–65kg、DoF14–40、最大2m/s、3時間自律、ROS2、Intel i7×2、任意Jetson GPU、安全規格SIL 2（IEC 61508）／PL d（EN ISO 13849-1）を確認した。KANGAROOの重量・DoF・荷重は構成依存、公式電池表記は976Ah／15Ahと単位・値に確認事項があるため、推測換算していない。

価格は両機とも公式Request a quoteのみで、公開価格は確認できなかった。KANGAROOは公式timelineにKANGAROO／KANGAROO PROのready for sale表記があるが、現行在庫・納期は非公開。日本の入手性・国内正規代理店・国内サポート条件は確認できない。

## カード項目

| Robot | 想定用途 | 身長 | 重量 | 価格 | 稼働時間 |
| --- | --- | ---: | ---: | --- | ---: |
| TALOS | ヒューマノイド研究、Factory of the Future、航空機製造研究 | 175cm | 95kg | 公式非公開（見積） | 歩行1.5時間／待機3時間 |
| KANGAROO | 動的移動、RL、Embodied AI、ロボット学習研究 | 158cm | 50–65kg（構成依存） | 公式非公開（見積） | 3時間 |

## Robot詳細用の主要値

### TALOS

- 公式datasheetは全身32 DoF、脚6×2、腕7×2、グリッパー1×2、腰2、首2を掲載。
- 片腕6kg（腕を完全に伸ばした状態）をsingle-arm／unspecified loadRatingsに保存し、scalar payloadKgへ流用していない。
- 175cm、95kg、歩行1.5時間、待機3時間、リチウムイオン1080Wh、最大放電100Aを確認。
- 制御はjoint-level torque control、EtherCAT、ros_control。ソフトウェアはUbuntu LTS、Linux RT、ROS、OROCOS、MoveIt!、URDF/Gazebo。
- Intel Core i7×2の制御・マルチメディアPCを確認。速度、充電時間、IP等級、機体動作温度、安全規格名は公式公開値を確認できなかった。

### KANGAROO

- 公式ページはdynamic bipedal、development-ready humanoid、dynamic locomotion、reinforcement learning、embodied AI researchを明示。
- 身長1.58m、重量50–65kg、総DoF14–40、片腕4/5/7 DoF、脚6 DoF、胴2 DoF。構成を選べないため重量とDoFはneeds-review。
- 公式datasheetは最大2m/s、3時間自律、4/5/7 DoF腕のsingle-arm 7/5/3kg、dual-arm 30/28/25kgを掲載。rated/maximumの語がないため全てunspecified。
- ソフトウェアはUbuntu LTS、ROS 2 LTS、PAL OS、ros2_control、ROS2 C++/Python API、URDF/MJCF、MuJoCo/mjlab。計算基盤はIntel i7×2、任意NVIDIA Jetson GPU。
- 安全規格はSIL 2 based on IEC 61508、PL d based on EN ISO 13849-1。電池は公式PDFの976Ah／15Ah表記が曖昧で、Wh換算していない。

## 活用事例

### TALOS

1. TALOS research: torque-controlled locomotion for humanoids in unknown environments — TOWARD/Dynamograde、LAAS-CNRSと未知環境の移動・15cm階段昇降を研究。区分: research。出典: [PAL Robotics公式記事](https://pal-robotics.com/blog/talos-research-torque-controlled-locomotion-for-humanoids-in-unknown-environments/)
2. MEMMO: Giving memories to robots for a better motion generation — Airbus実験施設の航空機製造作業に向け、TALOSの動作生成と環境反応を検証。区分: pilot。出典: [PAL Robotics公式記事](https://pal-robotics.com/blog/memmo-memories-robots-motion-generation/)

### KANGAROO

1. Kangaroo: The dynamic robot & the latest developments — KANGAROOでトルク制御ジャンプ、Whole Body Inverse Dynamics、閉リンク機構の実機研究を実施。区分: research。出典: [PAL Robotics公式記事](https://pal-robotics.com/blog/kangaroo-biped-research-platform-updates/)

製品ページのデモ映像・一般的な製品説明は、名前付き導入事例として追加していない。

## UseCase接続とGap

既存UseCaseへの接続候補はJSONに根拠付きで記録した。

- pal-talos → research-development: advanced humanoid robot designed to boost your research
- pal-talos → factory-assembly-support: Factory of the Future / aircraft manufacturing industry
- pal-kangaroo → research-development: dynamic locomotion research / development-ready humanoid
- pal-kangaroo → research-ai-simulation: reinforcement learning and embodied AI; MuJoCo/mjlab
- pal-kangaroo → research-prototype-dev: customize KANGAROO for robot learning and robotic movement

公式用途表現は既存UseCaseへ接続できたため、B11のUSE_CASE_GAPはなし。

## 価格・調達・日本情報

- TALOS: 公式製品ページのRequest a quoteを確認したが、公開価格はない。
- KANGAROO: 公式timelineのready for saleと公式Request a quoteを確認したが、現行在庫・納期・公開価格はない。
- KANGAROO公式datasheetはremote diagnostics/support、onsite installation/training、hardware maintenance/replacement、warranty extension等を掲載。日本固有の支援条件は非公開。
- 日本向け販売、国内正規代理店、国内出荷はPAL Roboticsの確認ページで見つからず、問い合わせフォームの存在だけで購入可能とは断定していない。

## 主要確認ページ

- [TALOS公式製品ページ](https://pal-robotics.com/robot/talos/)
- [TALOS公式datasheet](https://pal-robotics.com/datasheet/talos/)
- [KANGAROO公式製品ページ](https://pal-robotics.com/robot/kangaroo/)
- [KANGAROO公式datasheet](https://pal-robotics.com/datasheet/kangaroo/)
- [PAL Robotics公式TALOS研究記事](https://pal-robotics.com/blog/talos-research-torque-controlled-locomotion-for-humanoids-in-unknown-environments/)
- [PAL Robotics公式MEMMO記事](https://pal-robotics.com/blog/memmo-memories-robots-motion-generation/)
- [PAL Robotics公式KANGAROO研究記事](https://pal-robotics.com/blog/kangaroo-biped-research-platform-updates/)
- [PAL Robotics公式timeline](https://pal-robotics.com/timeline/)

JSON: [DATA-R01-B11-pal.json](./DATA-R01-B11-pal.json)
