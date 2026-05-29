# UI・内容・内部構造リファクタ計画 v1

Last reviewed: 2026-05-30

## 1. 目的

この計画は、Deploid の現状UIと内容の「違和感」を、場当たり的な見た目修正ではなく、データ構造・UI文言・分類・URL state・アクセシビリティ・運用安全の順で整理するための実行計画である。

対象は以下。

- 英語UI文言を、サイト目的に合う自然な日本語へ寄せる。
- ロボット・メーカーの絞り込み項目をMECEに近づける。
- 改行、truncate、line-clamp、uppercase、trackingの使い方を日本語UIとして自然にする。
- ガイド詳細を読みやすい左/中/右カラム構成へ整理する。
- 比較ページを一覧カード流用ではなく、比較専用UIへ寄せる。
- UI文言、分類順、選択肢、validationをSSOT化する。
- AIだけで実装しても、調査、計画、実装、自己監査、検証、修正をフェーズごとに止められるようにする。

この文書は、既存の `ai_fullstack_development_guardrails_v1.md`、`ui_architecture_and_development_policy_v1.md`、`design_system_v1.md` を実行計画へ落としたもの。

---

## 2. 外部基準から反映する注意事項

AIのみで開発するときは、AIの出力を「正しそうな草案」として扱い、検証なしに採用しない。

参考にする外部基準：

- OWASP Top 10 for LLM Applications
  - LLM出力を検証しないと、下流で脆弱性や不正なコード実行につながるリスクがある。
  - この計画では、AIが生成したコードを必ず型、build、差分、UI状態、アクセシビリティで再確認する。
- OWASP Top 10 Web Application Security Risks
  - Webアプリの基本的なセキュリティリスクを開発文化に組み込む。
  - この計画では、外部サービスID、環境変数、フォーム、外部リンク、依存追加を毎フェーズで確認する。
- NIST SSDF / CISA Secure by Design
  - 設計・実装・検証の各段階で、セキュアな成果物を作る前提にする。
  - この計画では、各フェーズに「合格条件」と「戻り条件」を設ける。
- W3C WCAG 2.2
  - 非テキストコンテンツの代替テキスト、操作部品の名前、キーボード操作、ラベルを確認する。
  - この計画では、button/link/input/select/画像/ロゴをアクセシビリティ観点で見る。
- Next.js Environment Variables
  - `NEXT_PUBLIC_` はブラウザにバンドルされるため、秘密情報を入れない。
  - この計画では、公開してよい値と秘密値を分ける。
- Twelve-Factor App Config
  - デプロイごとに変わる設定をコードに埋め込まない。
  - この計画では、外部サービスID、公開URL、メディア表示ポリシーをenvで扱う。

---

## 3. 現状の構造的な課題

### 3.1 UI文言が散らばっている

例：

- `Robots`
- `Manufacturers`
- `All Types`
- `All Status`
- `ACTIVE MODELS`
- `PRE-RELEASE`
- `VIEW FULL PROFILE`
- `COMPARISON SHEET`
- `Read Guide`
- `Featured Guide`

問題：

- 日本語化や文体調整がページごとに必要になる。
- 表記ゆれが起きる。
- AIが似た英語文言を増やしやすい。

方向性：

- 汎用UI文言は `lib/uiText.ts` に寄せる。
- enum由来のラベルは引き続き `lib/labels.ts`。
- ページ固有の一回きりの説明文は、まずページ内に残してよい。

### 3.2 フィルタ選択肢がデータ出現順に依存している

例：

- `RobotsBrowser` の `types`, `avails`
- `ManufacturersBrowser` の `countries`, `types`, `statuses`

問題：

- UI上の順序に編集意図がない。
- MECEな分類として見えにくい。
- データ追加で並びが変わる。

方向性：

- `robotCategoryOrder`
- `japanAvailabilityOrder`
- `companyTypeOrder`
- `companyStatusOrder`
- 必要なら `countryRegionOrder`

を `lib/display.ts` または `lib/filters.ts` に置く。

### 3.3 Select実装が重複している

対象：

- `FilterSelect`
- `FormSelect`

問題：

- keyboard処理、外側クリック、listbox構造が重複している。
- 片方だけ修正されるリスクがある。

方向性：

- いきなり巨大なSelect frameworkを作らない。
- `SelectControl` のような低レベル共通部品に、listboxの開閉・keyboard・focus処理を寄せる。
- `FilterSelect` と `FormSelect` は薄いwrapperとして残す。

### 3.4 URL state がページごとに不統一

URL連動済み：

- `use-cases`
- `guides`
- `reports`

未連動：

- `robots`
- `manufacturers`

問題：

- 絞り込み状態を共有できない。
- 戻る/進む操作で状態が復元しにくい。
- SEO/導線の方針がページごとに違う。

方向性：

- `robots` と `manufacturers` も `useUrlFilters` へ寄せる。
- `q`, `type`, `manufacturer`, `availability`, `country`, `status` の命名を決める。
- indexされるべきではない検索結果URLはcanonicalやnoindexではなく、まず内部導線として扱う。

### 3.5 比較ページが一覧カードを流用している

対象：

- `CompareClient` が `RobotCard` を中央比較エリアでも使用している。

問題：

- 一覧カードは詳細導線・画像・summary中心。
- 比較ページではspec、制約、best fit、調達条件を横並びで見る必要がある。
- `COMPARISON SHEET (0/9)` 周辺の高さ・密度が左右カラムと噛み合わない。

方向性：

- `ComparisonRobotPanel` を作る。
- 将来 `ComparisonMatrix` を作れる構造にする。
- 選択なし状態、1台、2-3台、4台以上を別状態として設計する。

### 3.6 ガイド詳細の情報設計がまだ粗い

対象：

- `src/app/guides/[slug]/page.tsx`

現状：

- すでに左TOC、中央本文、右summaryの3カラム構成はある。

問題：

- 英語見出しが残っている。
- 左/中央/右の役割がまだ曖昧。
- Related Robots / Related Use Cases / Resources の見せ方がページ固有直書き。

方向性：

- `GuideDetailLayout` までは急がない。
- まず `ArticleToc`, `SourceList`, `RelatedLinkList`, `DecisionAside` の候補を局所的に作る。
- ガイド詳細で安定してから、reports詳細へ横展開する。

### 3.7 タグが自由文字列のまま

対象：

- `Guide.topics`
- `Report.tags`
- `UseCase.industryTags`
- `UseCase.taskTags`

問題：

- 表記ゆれを後から直しにくい。
- AIが似たタグを増やしやすい。

方向性：

- 今すぐunion型で縛りすぎない。
- `data/tagRegistry.ts` または `lib/tagRegistry.ts` にタグ辞書を作る。
- `lib/validate.ts` で未知タグを警告する。

### 3.8 検証がdev console中心

対象：

- `lib/validate.ts`

問題：

- dev serverを見ていないと警告を見落とす。
- CIやbuild前に検知しにくい。

方向性：

- `scripts/validate-data.mjs` または `tsx` を検討する。
- `npm run validate:data` を追加する。
- build前に走らせるかは、まず手動運用で試す。

---

## 4. 実行原則

各フェーズは必ず次の順で進める。

1. 調査
2. 最小計画
3. 実装
4. 自己回帰的な不備探し
5. 修正
6. 検証
7. コミット可否判断

次フェーズへ進む条件：

- `npm run build` が通る。
- `git diff --check` が通る。
- 対象ページの主要状態を確認している。
- 未解決の違和感がある場合、後続フェーズに明記している。

禁止：

- UI文言修正と比較ページ大改修を同じコミットに混ぜる。
- Select共通化とURL state化を同時にやる。
- データ型変更と大量コンテンツ修正を同時にやる。
- 見た目のためにデータ構造を歪める。

---

## 5. Phase 0: 作業前安全確認

目的：

- GitHub最新との差分を確認する。
- ユーザーの未コミット変更を巻き込まない。
- 既存docsの優先順位を確認する。

実行：

```bash
git status --short --branch
git fetch origin main
git rev-list --left-right --count origin/main...HEAD
git log --oneline -5
```

確認するdocs：

- `ai_fullstack_development_guardrails_v1.md`
- `ui_architecture_and_development_policy_v1.md`
- `design_system_v1.md`
- `humanoid_data_model_policy_v1.md`
- この計画書

合格条件：

- GitHubが先行していない。
- 未コミット差分がある場合、今回の作業対象か説明できる。
- どのフェーズを実行するか明確。

戻り条件：

- `origin/main` が進んでいる。
- unrelatedな未コミット差分がある。
- 対象フェーズが曖昧。

---

## 6. Phase 1: UI文言・日本語表記のSSOT化

目的：

- 英語UI文言、硬い文言、不自然なCTAを整理する。
- 翻訳をコンポーネント内で場当たり的にしない。

対象候補：

- `RobotsBrowser`
- `ManufacturersBrowser`
- `GuidesBrowser`
- `ReportsBrowser`
- `UseCasesBrowser`
- `CompareClient`
- `RobotImageCarousel`
- `Breadcrumbs`

実装方針：

1. `lib/uiText.ts` を追加する。
2. 共通UI文言だけを移す。
3. enumラベルは `lib/labels.ts` のままにする。
4. 一覧タイトル、CTA、空状態、件数表示、比較ページの見出しを自然な日本語へ変える。

移す候補：

- `all`
- `clearAll`
- `viewDetails`
- `viewProfile`
- `featuredGuide`
- `featuredReport`
- `latest`
- `results`
- `filtered`
- `comparisonSheet`
- `favorites`
- `manufacturers`
- `relatedPaths`
- `resources`

自己監査：

- `rg -n "All |VIEW|COMPARISON|Featured|Read |Latest|Manufacturers|Robots|Use Cases|Reports|Guides" components src`
- 日本語と英語が混ざっても意味がある箇所だけ残っているか。
- CTAが長すぎないか。
- uppercase/trackingが日本語UIに不要に残っていないか。

検証：

```bash
npm run build
git diff --check
```

コミット例：

```bash
git commit -m "refactor(ui): centralize interface text"
```

---

## 7. Phase 2: フィルタ分類と表示順のMECE化

目的：

- プルダウンの内容をデータ出現順ではなく、導入判断に沿った分類順にする。

対象：

- `RobotsBrowser`
- `ManufacturersBrowser`
- `lib/display.ts`
- `lib/labels.ts`
- 必要なら `lib/filters.ts`

実装方針：

1. 表示順を定義する。
2. UIでは `Set` から出現項目を拾いつつ、order定義に沿って並べる。
3. 不明・その他系は末尾に寄せる。
4. `All Types` などはPhase 1の `uiText` を使う。

分類案：

Robot category：

1. `humanoid`
2. `general-purpose-robot`
3. `upper-body-humanoid`
4. `mobile-manipulator`
5. `other`

Japan availability：

1. `official-japan`
2. `distributor-japan`
3. `inquiry-required`
4. `import-only`
5. `unavailable`
6. `unknown`

Company type：

1. `manufacturer`
2. `distributor`
3. `integrator`
4. `ai-os`
5. `research`

Company status：

1. `active`
2. `stealth`
3. `acquired`
4. `inactive`

自己監査：

- すべてのenum値がorderに含まれているか。
- データに存在しない選択肢を出すか、存在するものだけ出すかをページごとに決めたか。
- 選択肢の順序がユーザーの判断順になっているか。

検証：

```bash
npm run build
git diff --check
```

コミット例：

```bash
git commit -m "refactor(filters): define ordered filter taxonomies"
```

---

## 8. Phase 3: URL state統一

目的：

- robots/manufacturers の検索・絞り込みをURLで共有可能にする。
- 既にURL state化済みの use-cases/guides/reports と操作感を揃える。

対象：

- `RobotsBrowser`
- `ManufacturersBrowser`
- `lib/useUrlFilters.ts`

URL param案：

Robots：

- `q`
- `type`
- `manufacturer`
- `availability`
- `release`

Manufacturers：

- `q`
- `country`
- `type`
- `status`

実装方針：

1. local `useState` を `useUrlFilters` へ置き換える。
2. `all` はURLに出さない。
3. 検索入力は `replace`、明示フィルタ変更は `push` を使う。
4. 不正なparamは `all` に戻す。

自己監査：

- URL直打ちで壊れないか。
- 戻る/進むで状態が復元されるか。
- 0件表示が自然か。
- パラメータ名が他ページと衝突しても意味が通るか。

検証：

```bash
npm run build
```

手動確認：

- `/robots?q=neo`
- `/robots?manufacturer=unitree`
- `/robots?type=humanoid&availability=distributor-japan`
- `/manufacturers?country=USA`
- `/manufacturers?type=manufacturer&status=active`

コミット例：

```bash
git commit -m "feat(filters): sync robot and manufacturer filters with url"
```

---

## 9. Phase 4: Select共通化

目的：

- `FilterSelect` と `FormSelect` の重複を減らす。
- keyboard/listbox/focus処理を1箇所に寄せる。

対象：

- `components/FilterSelect.tsx`
- `components/FormSelect.tsx`
- 新規 `components/SelectControl.tsx`

実装方針：

1. まず共通処理を `SelectControl` に移す。
2. `FilterSelect` は controlled wrapper。
3. `FormSelect` は hidden input を持つ form wrapper。
4. 見た目classは既存に近い形を維持する。

やらないこと：

- 汎用UIライブラリ導入。
- 複雑なmulti-select化。
- async option対応。

自己監査：

- Enter/Space/ArrowDown/ArrowUp/Escape/Tab が維持されているか。
- label/htmlFor/aria-controls/aria-expanded/listbox/option が残っているか。
- Formspreeへ送る値が変わっていないか。

検証：

```bash
npm run build
```

手動確認：

- robots/manufacturersのfilter select
- contactの問い合わせ種別select

コミット例：

```bash
git commit -m "refactor(select): share listbox control behavior"
```

---

## 10. Phase 5: 比較ページ専用UI化

目的：

- 比較ページを一覧カード流用から脱却し、比較に必要な情報を見やすくする。
- 中央カラムの高さ・密度・空状態を左右カラムと揃える。

対象：

- `CompareClient`
- 新規 `ComparisonRobotPanel`
- 必要なら `ComparisonEmptyState`

実装方針：

1. 中央の選択済みロボット表示を `RobotCard` から `ComparisonRobotPanel` へ変更する。
2. `ComparisonRobotPanel` は画像より比較項目を主役にする。
3. 空状態は左右カラムと高さ・密度を揃える。
4. 1-3台はカード/パネル、4台以上は将来matrix化できる構造にする。

比較パネルに出す候補：

- 機種名
- メーカー
- 提供段階
- 国内入手性
- 調達モデル
- 身長/重量/ペイロード
- 強み
- 制約
- best fit
- not fit

自己監査：

- 比較用途なのに詳細カードのCTAが主役になっていないか。
- 0件、1件、3件、9件で破綻しないか。
- 左右カラムより中央だけ不自然に低く見えないか。
- 画像が非表示でも成立するか。

検証：

```bash
npm run build
```

手動確認：

- `/compare`
- 0件状態
- 1件追加
- 3件追加
- 9件上限
- favorite追加/削除

コミット例：

```bash
git commit -m "refactor(compare): use comparison-specific robot panels"
```

---

## 11. Phase 6: ガイド詳細レイアウト整理

目的：

- ガイドページを「読む」「判断する」「次へ進む」に分ける。
- 左/中央/右カラムの役割を明確化する。

対象：

- `src/app/guides/[slug]/page.tsx`
- 必要に応じて新規小型部品
  - `ArticleToc`
  - `SourceList`
  - `RelatedLinkList`
  - `DecisionAside`

実装方針：

1. 英語見出しを日本語化する。
2. 左カラムは目次と一覧へ戻る導線に限定する。
3. 中央カラムは本文、チェックリスト、関連機種、出典。
4. 右カラムは判断サマリ、想定読者、次の行動。
5. 小型部品化は、reports詳細にも使えるものだけにする。

自己監査：

- 3カラムがdesktopだけで、mobileは自然に縦積みか。
- 左/右stickyが本文より邪魔になっていないか。
- 本文見出し、出典、関連リンクの見た目がreports詳細と乖離しすぎていないか。
- 日本語の改行が不自然になっていないか。

検証：

```bash
npm run build
```

手動確認：

- `/guides/decision-variables`
- `/guides/poc-planning`
- 360px / 768px / desktop幅

コミット例：

```bash
git commit -m "refactor(guides): clarify detail page layout"
```

---

## 12. Phase 7: タグ辞書とデータ検証CLI

目的：

- コンテンツ拡張時にタグの表記ゆれとデータ漏れを検知する。
- dev console依存を減らす。

対象：

- `lib/tags.ts`
- `lib/validate.ts`
- 新規 `data/tagRegistry.ts` または `lib/tagRegistry.ts`
- 新規 `scripts/validate-data.mjs` または TypeScript実行方法の検討
- `package.json`

実装方針：

1. タグ辞書を作る。
2. 既存タグを辞書へ登録する。
3. `validateData()` で未知タグを警告する。
4. CLIからvalidationを実行できるようにする。
5. `npm run validate:data` を追加する。

やらないこと：

- タグをすぐ独立collection化しない。
- CMS導入を前提にしすぎない。
- いきなり全タグをunion型で厳格化しない。

自己監査：

- 既存タグがすべて登録されているか。
- タグ追加時の手順がREADMEかdocsにあるか。
- validationがbuildと独立して実行できるか。

検証：

```bash
npm run validate:data
npm run build
```

コミット例：

```bash
git commit -m "feat(data): add tag registry and validation script"
```

---

## 13. Phase 8: 日本語レイアウト・改行・文字量調整

目的：

- 「文字の表記が自然でない」「改行箇所がキモい」をUIとして直す。

対象：

- 一覧カード
- Compare
- Guide detail
- Reports list/detail
- Use cases list/detail
- Header/Breadcrumbs/Footer

実装方針：

1. `uppercase` と `tracking-*` を日本語UIから減らす。
2. `line-clamp-1` を不用意に使わない。
3. 長い日本語は2行まで許容する箇所と、折り返させない箇所を分ける。
4. CTAは短く、説明は本文側へ逃がす。
5. ボタン内テキストがはみ出る場合は幅ではなく文言を短くする。

自己監査：

- `rg -n "uppercase|tracking-|line-clamp-1|truncate|whitespace-nowrap" components src`
- 日本語タイトルが途中で不自然に切れていないか。
- 英語ラベルが装飾として残りすぎていないか。
- mobile幅でボタン文言がはみ出ていないか。

検証：

```bash
npm run build
```

手動確認：

- 主要一覧ページ
- robot detail
- manufacturer detail
- guide detail
- compare

コミット例：

```bash
git commit -m "fix(ui): improve japanese text layout"
```

---

## 14. Phase 9: 最終監査

目的：

- ここまでの修正がDRY/KISS/SSOT/SoC/Type Safety/A11y/Responsive/URL State/Operational Safetyに対して有効だったか確認する。

確認コマンド：

```bash
git status --short --branch
git diff --check
npm run validate:data
npm run build
rg -n "All Types|All Status|VIEW FULL PROFILE|COMPARISON SHEET|Read Guide|Featured Guide|Featured Report" components src
rg -n "grid-cols-3|w-64|uppercase|tracking-widest|line-clamp-1|truncate" components src
rg -n "data/.*\\.ts'|data/.*\\.ts\\\"" components src lib
rg -n "NEXT_PUBLIC_|formspree|process\\.env" components src lib README.md .env.example
```

手動確認ページ：

- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/manufacturers/unitree`
- `/compare`
- `/guides`
- `/guides/decision-variables`
- `/use-cases`
- `/reports`
- `/contact`

合格条件：

- build成功。
- データvalidation成功。
- 主要ページで0件/長文/画像非表示/モバイル幅が破綻しない。
- UI文言が日本語中心で自然。
- フィルタの分類順が説明できる。
- `RobotCard` が比較専用UIに流用されていない。
- Selectの重複が減っている。
- robots/manufacturersのfilter URLが共有できる。

最終コミット例：

```bash
git commit -m "docs: add ui refactor final audit"
```

---

## 15. フェーズ別コミット分割

推奨コミット単位：

1. `docs: add ui content structure refactor plan`
2. `refactor(ui): centralize interface text`
3. `refactor(filters): define ordered filter taxonomies`
4. `feat(filters): sync robot and manufacturer filters with url`
5. `refactor(select): share listbox control behavior`
6. `refactor(compare): use comparison-specific robot panels`
7. `refactor(guides): clarify detail page layout`
8. `feat(data): add tag registry and validation script`
9. `fix(ui): improve japanese text layout`
10. `docs: add ui refactor final audit`

1コミット1目的を守る。途中でUIの違和感が新しく見つかった場合も、実装中フェーズに無理やり混ぜず、Phase 8または最終監査へ送る。

---

## 16. 参考資料

- OWASP Top 10 for Large Language Model Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP Top Ten Web Application Security Risks: https://owasp.org/www-project-top-ten/
- NIST Secure Software Development Framework: https://csrc.nist.gov/projects/ssdf
- CISA Secure by Design: https://www.cisa.gov/resources-tools/resources/secure-by-design
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Next.js Environment Variables: https://nextjs.org/docs/app/guides/environment-variables
- The Twelve-Factor App: Config: https://12factor.net/config

---

## 17. 一言まとめ

この改修は、見た目の好みを直す作業ではなく、Deploidを「日本語で自然に読める、導入判断に使える、AIだけで拡張しても壊れにくいWebプロダクト」に寄せる作業である。

先に文言・分類・URL state・比較専用UI・ガイド詳細・タグ検証を整理する。大きなデザイン刷新やCMS導入は、その後でよい。
