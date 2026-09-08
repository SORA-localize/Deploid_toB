---
status: reference
updated: 2026-09-08
---

# MCP運用試行ログ

このファイルは正式なdoc governance shelf（`ai/rules/80-doc-governance.md`）の`decisions`/`plans`/`archive`のどれにも厳密には該当しない、**運用中の作業ログ**。MCP経由でのcollection編集を実際に試してみて、どこがうまくいき、どこで詰まったかをその都度ここに書き足していく。

一区切りついたら（各collectionで安定して運用できると分かったら）、得られた知見を`.codex/content-workflow.md`や`ai/rules/21-data-maintenance-workflow.md`側の正式なルールへ反映し、このログ自体は`docs/archive/`へ移すか役目を終える。

**試す前に**[`docs/reference/payload-field-usage-audit-2026-09-08.md`](./payload-field-usage-audit-2026-09-08.md)を読むこと。「入れたのに公開ページに反映されない」fieldの多くは、MCPの不具合ではなくそもそも表示先が実装されていない（①分類）。特に`robot-series`/`distributors`はcollection全体がこれに該当する。

## 書き方

1件の試行につき、以下の形式で追記する。

```
### YYYY-MM-DD collection名 — 短い概要

- **やったこと**: (例: CSVからロボット3件をcreateRobotsでdraft作成)
- **結果**: 成功 / 一部成功 / 失敗
- **詰まった点**: (無ければ「なし」)
- **対応**: (詰まった点をどう解決したか、まだ未解決なら「未解決」)
- **次回への申し送り**: (無ければ省略可)
```

---

## manufacturers

### 2026-09-08 manufacturers — Clone Roboticsを新規create→update

- **やったこと**: `findManufacturers`で既存26件・IDレンジを確認→未収録の実在企業Clone Robotics（ポーランド、筋骨格ヒューマノイド「Protoclone」）を公式サイト＋RobotHubプロフィールで一次情報確認→`createManufacturers`で`draft: true`作成（id=27）→`updateManufacturers`で`nextReviewBy`のみを追加更新→`findManufacturers`（`draft: true`）で反映確認。
- **結果**: 成功
- **詰まった点**: なし。`stableId`衝突チェック、必須field（`stableId`/`slug`/`lifecycleStatus`/`name`/`summary`/`description`/`country`/`companyType`/`japanPresence`/`website`/`sources`）は事前にschemaで把握済みで一発で通った。
- **対応**: -
- **次回への申し送り**: `hqCity`は情報源間で表記揺れ（Warsaw vs Wroclaw）があり、①未使用fieldでもあるため未入力のまま`sources[].note`に揺れの事実だけ残した。同様のケースでは無理に埋めずnoteに残す運用でよさそう。

## distributors

### 2026-09-08 distributors — GMO AI & Roboticsを新規create

- **やったこと**: Unitree Roboticsの日本正規代理店をWeb検索で特定（2026年6月にGMO AI & Robotics Corporationが締結、対象はG1/H1/R1/Go2/B2）→公式プレスリリース（group.gmo）を一次情報として確認→`createDistributors`で`draft: true`作成。`handledManufacturerIds: [1]`（Unitree）、`handledRobotIds: [1, 3, 27]`（robots collectionのG1/H1/R1標準機）。
- **結果**: 成功
- **詰まった点**: `robots`collectionのid=27が偶然`manufacturers`collectionのid=27（今回作ったClone Robotics）と同じ数値だったため、一瞬「参照を取り違えたか」と混乱した。実際にはcollectionごとに独立したid採番なので問題なし。
- **対応**: 混乱を避けるため、`handledRobotIds`を渡す直前に`findRobots`の結果でid=27が`unitree-r1-standard`であることを再確認してから確定した。
- **次回への申し送り**: 複数collectionを同時に触るセッションでは、数値idだけを見て「同じidだから同じレコード」と誤認しないこと。`stableId`を並記してダブルチェックする方が安全。また、既存`robots`データ内で id=26 (`stableId: "unitree-r1"`, `slug: "unitree-r1-air"`, `name: "R1 AIR"`) は stableId が slug/name と対応しておらず紛らわしい（本来`unitree-r1-air`であるべき）。MCPの問題ではなく既存データ側の軽微な不整合として認識のみ残す。
- **field usage audit確認**: このcollectionは監査で①（全体未使用）と分類済み。作成したdraftは公開ページのどこにも表示されない想定通りの結果——確認のため公開ページ側の該当箇所は探索していない（探しても無いことが分かっているため）。

## robot-series

### 2026-09-08 robot-series — Unitree G1 Seriesを新規create→robotsへ紐付け

- **やったこと**: `createRobotSeries`で`draft: true`作成（`manufacturerId: 1`＝Unitree、id=1）→`updateRobots`で既存の`unitree-g1`（id=1）・`unitree-g1-edu`（id=2）に`seriesId: 1`を追加update。
- **結果**: 成功
- **詰まった点**: なし。`updateRobots`は他のfield（specs, sources, comparison等）を送らなくても、送った`seriesId`以外は既存値がそのまま保持される部分更新（マージ）だった。
- **対応**: -
- **次回への申し送り**: robot→series方向の参照（`robots.seriesId`）は問題なく作れるが、事前の監査どおり series単体ページが無いため、この関連付けが公開ページのどこかに実際に出るのは「候補ロボット」欄など別経路経由でのみ。今回のUnitree G1 Seriesはその意味では検証用データであり、実データとして残すかは要判断（下記ユーザー報告参照）。

## robots

### 2026-09-08 robots — 既存レコードへのupdate（seriesId紐付け）としてrobot-series節で実施

- 上記「robot-series」の申し送りの通り、`robots`単体のcreateは今回試行しなかった（既存63件で命名・spec・price等のパターンが十分に把握できていたため、update経路の検証を優先）。
- **やったこと**: `unitree-g1`(id=1)・`unitree-g1-edu`(id=2)へ`seriesId`のみを渡す部分update。
- **結果**: 成功
- **詰まった点**: なし
- **対応**: -
- **次回への申し送り**: create経路（新規ロボット追加）はまだ未検証。特に`specs`/`fieldEvidence`/`loadRatings`/`priceOffers`のようなJSON任意形状field＋配列field併用時の挙動（部分一致 or 全置換）は、次回create時に改めて確認する必要がある。

## use-cases

### 2026-09-08 use-cases — 既存レコードのcandidateRobotsへ1件追加update

- **やったこと**: `findUseCases`で「Warehouse Tote and Material Handling」(id=1)の既存`candidateRobots`（7件）を取得→PUDU D7（robots id=60、2026年発表の倉庫向け産業用セミヒューマノイド、PR Newswire一次情報で確認）を1件追加した配列8件を`updateUseCases`に渡してupdate。
- **結果**: 成功
- **詰まった点**: `candidateRobots`のような配列fieldは、既存7件を省略して新規1件だけ渡すと**上書き（全置換）される**懸念があった。
- **対応**: 事前に配列fieldは全置換方式だとcontent-workflow.mdに明記されていなかったため、安全側に倒して既存7件＋新規1件の計8件をフルで送った。結果的に既存7件は`id`（Payloadが自動採番するarray item id）ごと保持されたまま更新された。
- **次回への申し送り**: 配列型field（`candidateRobots` / `sources` / `domesticDistributors` / `loadRatings` / `priceOffers` 等）を更新する際は、**必ず先に`find`でdraft版の現在値を取得し、フル配列を組み立ててから`update`する**ことを標準手順に明記すべき（`.codex/content-workflow.md`のstep3に追記候補）。

## deployments

### 2026-09-08 deployments — Boston Dynamics × Hyundai Metaplant Americaを新規create

- **やったこと**: Web検索でHyundai Motor GroupがCES 2026で発表したBoston Dynamics Atlas導入計画（RMACで訓練→2028年までにHMGMA（ジョージア州エラベル）で部品シーケンシング開始）を確認→`createDeployments`で`draft: true`作成。`manufacturerId: 6`（Boston Dynamics）、`robotId: 13`（Atlas）、`status: "announced"`（まだ稼働開始前のため）、`location`はHMGMAの公開座標（32.1625, -81.445）。
- **結果**: 成功
- **詰まった点**: なし。`status`enumに`announced`があったため、「発表済みだが稼働はまだ」という実情を無理なく表現できた。
- **対応**: -
- **次回への申し送り**: `robotId`/`startedAt`は監査で①（未使用）と分類済みだが、`robotId`は関連整合性としては引き続き正しく設定しておく（表示されないことと、参照として正しいことは別軸）。

## articles

### 2026-09-08 articles — Clone Robotics関連の新規記事をcreate

- **やったこと**: 上記manufacturersで作成したClone Roboticsに関する状況記事（量産・歩行実証の遅延）を、複数の報道ソース（reliability: reported）を裏付けに`createArticles`で`draft: true`作成。`category: news` / `type: tech-update` / `section: tech`、`relatedManufacturerIds: [27]`で新規manufacturerと関連付け。
- **結果**: 成功
- **詰まった点**: なし。`category`（news/interview/company-report/analysis/policy）と`type`（analysis/deployment-report/…/manufacturer-guide等）が別軸のenumになっており、最初どちらが「記事一覧のタブ」に対応するのか一瞬迷った。
- **対応**: 既存記事（例: id=32 unitree-manufacturer-guide）を`findArticles`で参照し、`category`と`type`の組み合わせパターンを確認してから値を決定した。
- **次回への申し送り**: `category`/`type`/`section`の3軸関係は`.codex/content-workflow.md`や`ai/rules/21-data-maintenance-workflow.md`のG7に明記が薄い（G7はtag axisの話が中心で、この3 enumの使い分けには触れていない）。新規記事作成のたびに既存記事を逆引きする必要があり、ここはドキュメント化の価値がある。

## domain validation（全collection共通の気づき）

### 2026-09-08 `npm run validate:data` は現在存在しない

- **やったこと**: G4/G10（`ai/rules/21-data-maintenance-workflow.md`）および`docs/decisions/data/README.md`が参照する`npm run validate:data`を`package.json`で確認。
- **結果**: **スクリプト自体が存在しない**（`docs/plans/content-platform-migration-factual-audit-v1.md:228`に「validate:data ← スクリプト自体が存在しない」と既に記録済みで、Payload移行時に意図的に廃止されたことも確認できた）。代替として`content:verify-snapshot`/`content:verify-conservation`があるが、どちらも署名付きsnapshotやbaseline manifestを前提とした本番運用向けコマンドで、MCPでdraft編集した直後に手元でサッと回せる粒度のツールではない。
- **詰まった点**: `.codex/content-workflow.md`のstep4自体は「Payload側ではpublish時にしか走らない」と正確に書けているが、G10が参照する`README.md`/`docs/decisions/data/README.md`側にはまだ`validate:data`前提の説明が複数残っており、AIエージェントがそちらを先に読むと存在しないコマンドを実行しようとする可能性がある。
- **対応**: 今回は各create/update前にschemaのrequired fieldを手動チェックする自己点検のみで代替した。
- **次回への申し送り**: `docs/decisions/data/README.md`や`ai/rules/21-data-maintenance-workflow.md`のG10参照先の記述更新は、このtrial logの範囲を超えるため今回は手を入れていない。ユーザーへの報告事項とする。

## article-placements（MCP対象外・参考）

このcollectionはMCPから編集不可（`lib/payload/mcp.ts`の設計）。記事のホームページ掲載枠設定は必ずAdmin UI経由になるため、ここに試行ログは発生しない想定。
