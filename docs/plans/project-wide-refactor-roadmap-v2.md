---
status: plan
updated: 2026-07-26
---

# プロジェクト全体リファクタリング・ロードマップ v2

## 0. 目的

Deploid全体を、次の状態へ段階的に移行する。

- コンテンツの正本が明確
- 非エンジニアとCodexが同じデータを安全に編集可能
- UIがServer/Client境界を守り、不要なhydrateをしない
- 独自実装がドメイン価値のある部分に限定される
- セキュリティ、型、lint、test、CIが変更の安全網になる
- 現行のデザイン品質と公開URLを維持する
- 設計文書と実装が矛盾しない

この文書は全体順序と完了条件を定める。コンテンツ基盤の詳細は次を正本とする。

- 決定: `../decisions/content-platform-and-database-architecture-v2.md`
- 実装計画: `content-platform-migration-plan-v1.md`

> **2026-07-26 実行範囲**: CMS / DB移行は保留し、現行TS構成のまま実施できる安全網・依存・データ内部・性能・Client境界・UI・セキュリティを先行する。現在の実行設計は [`pre-migration-refactor-safety-design-v1.md`](pre-migration-refactor-safety-design-v1.md) を参照。

旧 `docs/archive/project-wide-refactor-implementation-plan-v1.md` は2026-06-26時点の履歴であり、本計画の入力・実行手順には使用しない。

---

## 1. 2026-07-26監査ベースライン

### 1.1. 正常に機能しているもの

- Next.js production build成功
- data validation成功
- 157ページを静的生成またはPartial Prerender
- ページ実装は原則 `lib/data.ts` を経由し、raw data importが局所化
- id/slug分離、参照ID、sources、rights、evidenceのモデルが導入済み
- desktop UIは情報密度、階層、ブランド表現が概ね良好
- 390px端末エミュレーションで主要7routeのdocument overflowなし
- skip link、focus、ARIA、reduced motionへの配慮が複数箇所にある

### 1.2. データ規模

| Collection | 件数 | ファイル規模 |
|---|---:|---:|
| Robots | 63 | `data/robots.ts` 4,931行 |
| Manufacturers | 26 | `data/manufacturers.ts` 1,946行 |
| Articles | 34 | `data/articles.ts` 2,732行 |
| Use cases | 44 | `data/useCases.ts` 2,980行 |
| Deployments | 11 | `data/deployments.ts` 332行 |

ローカルTSはruntime性能上ただちに破綻する規模ではない。しかし、編集、権限、下書き、参照入力、非エンジニア利用の観点で運用限界に達している。

### 1.3. 重大な問題

| ID | Severity | 問題 | Evidence |
|---|---|---|---|
| SEC-01 | P0 | 本番依存に13件の既知脆弱性（high 7、moderate 5、low 1） | `npm audit --omit=dev` |
| QA-01 | P0 | lint、unit test、E2E、CIがない | `package.json`、`.github/` |
| DATA-01 | P1 | 巨大TS配列がコンテンツDB・編集画面・履歴の役割を兼任 | `data/*.ts` |
| DATA-02 | P1 | Keystatic、Sanity、将来DBの設計判断が文書間で衝突 | `docs/decisions/*architecture*` |
| PERF-01 | P1 | Home HTMLが4,206,770 bytes | `.next/server/app/index.html` |
| PERF-02 | P1 | 約964KBのworld-map SVG data URIを3回描画 | `ManufacturerWorldMap` / `ManufacturerMapStage` |
| PERF-03 | P1 | client bundleが `/reports` 約357KB gzip、`/robots` 約275KB gzip | `.next/diagnostics/route-bundle-stats.json` |
| ARCH-01 | P1 | 190 TS/TSX中63がClient Component | source inventory |
| ARCH-02 | P1 | URL navigationを行いながら全件をclient filterする二重構造 | robots/use-cases/reports browsers |
| VALID-01 | P2 | `lib/validate.ts` が1,017行の単一custom validator | `lib/validate.ts` |
| UI-01 | P2 | `/reports` 一覧にH1がない | rendered HTML / `ReportsHeader.tsx` |
| UI-02 | P2 | 横スクロールUI、custom carousel、tilt/glow/shimmerが多い | catalog/home components |
| CONFIG-01 | P2 | GA/Clarity IDがコード既定値で有効化される | `lib/env.ts` |
| SEC-02 | P2 | app-level CSP、Referrer-Policy等が未設定 | `next.config.mjs` |
| DOC-01 | P2 | 親READMEが現行Next.jsを旧Astroと誤記 | 監査時点のworkspace `README.md`。2026-07-26に修正済み |

---

## 2. 対応順序

複数領域を一つの巨大PRで変更しない。以下のPhaseを独立したreview単位として進める。

```text
Phase 0 安全網
   ↓
Phase 1 コンテンツ基盤
   ↓
Phase 2 データアクセス・検証
   ↓
Phase 3 性能・Client境界
   ↓
Phase 4 UI・アクセシビリティ
   ↓
Phase 5 セキュリティ・運用
   ↓
Phase 6 文書・legacy整理
```

Phase 0は他の全Phaseの前提。Phase 1と2は同じmigration program内で実施する。Phase 3以降は、Phase 1のschema設計と衝突しない範囲で別branchに分けられる。

---

## 3. Phase 0: 安全網と既知脆弱性

### 対応

1. Next.jsを既知修正版へ更新する
2. `shadcn` packageのruntime CSS依存を調査し、不要なら除去する
3. high vulnerabilityのtransitive dependencyを更新する
4. `typecheck` scriptを追加する
5. ESLintを追加する
6. Vitestを追加する
7. Playwrightで主要route smoke testを追加する
8. GitHub Actionsでvalidate/typecheck/lint/test/buildを実行する
9. RenovateまたはDependabotで更新PRを作る

### 最低限のtest対象

- ID/slug一意性
- 参照整合性
- published recordの公開ゲート
- slug redirect
- robots/manufacturers/use-cases/reportsの一覧
- 主要detail route
- sitemap
- mobile 390px document width

### 完了条件

- `npm run check` 1コマンドで全品質ゲートが動く
- CIがmainとPRで同じコマンドを実行する
- `npm audit --omit=dev` のcriticalが0
- 残るhighは影響範囲と対応issueが明示されている

---

## 4. Phase 1: コンテンツ基盤をPayload + Postgresへ移行

詳細は `content-platform-migration-plan-v1.md` を実行する。

### 対応

1. Payload Adminを現行Next.jsへ組み込む
2. managed Postgresを接続する
3. content collectionsとrelationshipを定義する
4. non-engineer向けfield label、description、validationを整える
5. draft/version/preview/publish workflowを追加する
6. Codex MCPをleast privilegeで接続する
7. importer/exporter/parity checkerを作る
8. local/payload read adapterを使って表示回帰を確認する
9. Postgresへcutoverする
10. 安定化後に巨大TS配列を撤去する

### 完了条件

- Postgresがコンテンツ唯一の正本
- AdminとCodexが同じrecordを扱う
- Codex通常権限がdelete/publishを実行できない
- ID、slug、URL、references、公開状態が移行前後で一致
- Gitに同じcontent recordの二重正本がない

---

## 5. Phase 2: データアクセスと検証を分割

### 対応

1. 物理読み取りを `lib/content/*Source.ts` へ分離
2. published/archived/draft policyをrepositoryへ分離
3. slug解決とrelated record解決をpure repositoryへ分離
4. view model生成をserver側へ移す
5. `lib/validate.ts` をcollection別validatorへ分割
6. cross-collection validationを独立させる
7. Payload hook、CLI、CIから同じdomain validatorを使う
8. custom ruleの目的とerror codeを文書化する
9. `UseCasesBrowser` 内のmaturity順など、重複した表示規則をregistryへ統合する

### 責務境界

| Layer | Responsibility |
|---|---|
| Source | DB/APIの読み取りとdomain型へのmapping |
| Repository | 公開状態、ID、slug、relationship |
| Domain validator | データ品質、evidence、公開gate |
| View model | UIに必要な派生値 |
| Component | 描画とユーザー操作 |

### 完了条件

- `lib/data.ts` が巨大なglobal array resolverではない
- collection validatorを単独testできる
- Client Componentがdomain record全体を要求しない
- UIに参照整合性や公開状態の独自判断が残っていない

---

## 6. Phase 3: 性能とClient Component境界

### 6.1. Home world map

1. dotted-map SVGをビルド生成した静的assetへ変更
2. data URIをHTML/RSCへ埋め込まない
3. 同一SVGの3コピーを廃止する
4. 無限panが必須か再評価し、単一map + transformまたは静的mapへ縮小
5. Unitree/Shanghai特例を削除し、一般化したcluster ruleまたは編集データへ移す
6. country→ISO辞書を標準データまたはdomain registryへ移す
7. animationをviewport内・reduced-motion off時だけ実行する

### 6.2. Catalog browsers

次の二択をcollectionごとに明示して混在させない。

- 小規模: initial datasetを小さいview modelで渡し、client filterとHistory APIで完結
- 大規模: query/paginationをserver/Payloadへ送り、clientへ結果だけ返す

現在の「全件client filter + `router.push`によるRSC再取得」は廃止する。

### 6.3. Client boundary

1. card全体のClient Component化を避ける
2. favorite、drag、carousel、searchなど操作単位だけをisland化
3. `motion`を使用しない画面からbundleを除外
4. rootのToasterが不要な場合は必要routeへ限定
5. CompareClientをselection、table、DnD、mobile viewへ分割
6. ReportsBrowserのsearch indexとpagination処理を再配置

### 完了条件

- Home raw HTMLが500KB未満
- 埋め込みworld-map SVGが0件
- route別client gzipを基準値から30%以上削減
- 主要一覧のraw domain record全送信がない
- reduced motionで連続animationが停止する

---

## 7. Phase 4: UI・レイアウト・アクセシビリティ

全面リデザインは行わない。現在のeditorial broadsheet × product dashboardの方向を維持する。

### 対応

1. `/reports` にページ固有H1と説明を追加する
2. `PageListHeader` / `ContextualPageHeader` / sticky headerの役割を整理する
3. 横スクロール領域に名称、操作ヒント、keyboard到達性を付ける
4. carouselのpause、prev/next、現在位置を確認する
5. hover前提のtilt/glow/shimmerをmobile・keyboardでは情報依存にしない
6. card animationを全種類へ一律適用せず、比較に必要な静けさを優先する
7. form、dialog、popover、drawerのfocus restorationをE2E化する
8. 390 / 768 / 1280 / 1440pxをvisual regression対象にする
9. `site-container` とcontent/detail/listレイアウトprimitiveを整理する
10. design system文書から歴史的class表を分離する

### 完了条件

- 全index/detail pageに一意なH1
- keyboardだけでnavigation、filter、carousel、dialogを操作可能
- 主要routeでdocument overflowなし
- hoverしなくても全情報と操作へ到達可能
- design tokens以外の新規色直書きなし

---

## 8. Phase 5: セキュリティ・設定・運用

### 対応

1. GA/Clarityは環境変数が明示されたときだけ有効化する
2. production環境変数の起動時validationを追加する
3. CSPをreport-onlyで導入後、enforceへ移行する
4. `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`を設定する
5. contact、Payload Admin、MCPのrate limitとaudit logを設ける
6. Payload editor/publisher/adminを分離する
7. Codex MCP tokenをproduction user tokenと分離する
8. backup/restoreを定期実行し、復元演習を行う
9. image rightsと公開gateをCMS field/hookへ移す
10. dependency auditをCIまたは定期automationへ追加する

### 完了条件

- analytics IDのコード既定値がない
- app-level security headersを自動testできる
- Codexの通常profileでpublish/delete不可
- DB backupからstagingへ復元できる
- 管理操作のactorと時刻を追跡できる

---

## 9. Phase 6: 文書・legacy・ルート整理

この方針整理で、workspace README、`docs/README.md`、CMS / DB関連decisionの矛盾、AIルールの移行期間注記は更新済み。残る対応は実装のcutover時または各phase完了時に行う。

### 対応

1. [x] workspace READMEを現行Next.js入口へ修正
2. [x] `docs/README.md` のcurrent plans/decisionsを更新
3. [ ] データ正本の説明をPostgres cutoverに合わせて再更新
4. [ ] data work guideをAdmin/MCP操作へ更新
5. [ ] design systemの歴史的記述をreference/archiveへ分離
6. [ ] 完了したplanを即archiveへ移す
7. [x] `B2B Robot Buyer Portal UI/` をlegacy referenceと明記する
8. [ ] ZIPや一時成果物をworkspace rootから保管場所へ移す判断を行う
9. [x] `AGENTS.md` をAI作業入口としてREADME・rulesと整合させる
10. [ ] docs link checkをCIに追加する

### 完了条件

- 初見の人がworkspace READMEから現行repoへ到達できる
- current decision同士にCMS/DB方針の矛盾がない
- archive文書が現行planとして参照されない
- `docs/README.md` と `docs/plans/` が一致する

---

## 10. 実施単位

| Program | 主なPhase | 推奨branch |
|---|---|---|
| Quality baseline | 0 | `refactor/quality-baseline` |
| Content platform migration | 1–2 | `refactor/payload-content-platform` |
| Home/performance | 3 | `refactor/home-performance` |
| Catalog client boundary | 3 | `refactor/catalog-client-boundary` |
| UI/a11y consistency | 4 | `refactor/ui-accessibility` |
| Security/operations | 5 | `refactor/security-operations` |
| Docs/legacy cleanup | 6 | `refactor/docs-governance` |

各Programは独立PRにし、前のProgramが未mergeの状態で同じファイルを大きく変更しない。

---

## 11. 全体完了条件

- security、type、lint、unit、E2E、buildがCIで必須
- Postgresがコンテンツ唯一の正本
- 非エンジニアがAdminからdraftを編集可能
- CodexがMCPからdraftを更新可能
- 公開URLと既存IDが維持される
- Home 4.2MB HTML問題が解消
- client bundleとClient Component境界が改善
- Reports H1と主要a11y問題が解消
- custom validatorと巨大client componentが責務別に分割
- app-level security policyとbackup/restoreが存在
- current docsが実装と一致
