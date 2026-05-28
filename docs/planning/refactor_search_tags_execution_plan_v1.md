# UI共通化・検索・タグ改善 修正計画 v1

## 1. この計画の目的

この計画は、現在の Deploid 実装にある以下の問題を、壊さず段階的に解消するための実行計画である。

- 同じUIの焼き増し
- ハードコードされたラベル、定数、外部ID
- `lib/data.ts` に寄せるべき取得・filter処理の散在
- タグ表示とタグフィルタの不統一
- 検索体験の弱さ
- 固定3カラムなどのレスポンシブリスク
- アクセシビリティ確認不足

進め方は `ai_fullstack_development_guardrails_v1.md` に従う。各フェーズは「調査、計画、実装、自己監査、検証、コミット」の順で進める。前フェーズの不備が残っている場合、次フェーズに進まない。

---

## 2. 現在のベースライン

確認日: 2026-05-29

GitHub同期:

```text
origin/main...HEAD = 0 0
HEAD = origin/main
```

既存の未コミット差分:

```text
data/guides.ts
data/manufacturers.ts
data/reports.ts
data/robots.ts
```

扱い:

- 上記 `data/*.ts` は既存差分として扱う
- この修正計画の各フェーズでは、必要が明確な場合を除き触らない
- 触る場合は、そのフェーズの計画に明記してから stage する

---

## 3. 守る原則

### 3.1 DRY

同じ構造、同じ className、同じ文言、同じUI状態が複数箇所にある場合、共通化候補として扱う。

ただし、2箇所だけで将来増える見込みが薄いものは無理に抽象化しない。

### 3.2 KISS

抽象化は小さく始める。

最初から万能コンポーネントを作らない。`TagChip`、`EmptyState`、`FilterSelect` のような粒度から始める。

### 3.3 Single Source of Truth

- enumラベルは `lib/labels.ts`
- データ取得、slug lookup、関連取得は `lib/data.ts`
- 検索処理は `lib/search.ts`
- タグの正規化と集約は `lib/tags.ts`
- UI部品は `components/`

### 3.4 フェーズごとの自己監査

各フェーズの最後に以下を確認する。

- 同じUIを新たに増やしていないか
- 既存の設計ルールを破っていないか
- 抽象化しすぎていないか
- build が通るか
- 未コミットの unrelated 差分を stage していないか

---

## 4. フェーズ一覧

### Phase 0: GitHub最新確認と作業対象固定

目的:

- 古いローカルから作業しない
- ユーザーの未コミット差分を巻き込まない

作業:

- `git status --short --branch`
- `git fetch origin main`
- `git rev-list --left-right --count origin/main...HEAD`
- `git log --oneline origin/main..HEAD`
- 未コミット差分の対象確認

完了条件:

- `origin/main...HEAD` の左側が `0`
- stage対象がそのフェーズのファイルだけになっている
- 既存の `data/*.ts` 差分を不用意に含めていない

---

### Phase 1: 監査リスト確定

目的:

- 実装前に、どこをどう直すかを確定する

調査対象:

- `components/*Browser.tsx`
- `src/app/*/[slug]/page.tsx`
- `src/app/page.tsx`
- `components/CompareClient.tsx`
- `components/ContactForm.tsx`
- `lib/data.ts`
- `lib/labels.ts`
- `lib/search.ts`

確認項目:

- 同じUIパターンの重複
- `lib/data.ts` に寄せるべき filter
- `lib/labels.ts` に寄せるべき label 定義
- タグ表示・タグフィルタのばらつき
- 固定カラム・固定幅のレスポンシブリスク
- icon button、input、select のアクセシビリティ
- 環境変数に寄せるべき外部ID

成果物:

- この計画ファイルに「Phase 1 監査結果」を追記する、または別ファイルに監査結果を作る

完了条件:

- 修正対象が優先順位付きで明確
- 各修正がどのフェーズに属するか決まっている
- まだ実装しない

---

### Phase 2: 小型UI共通コンポーネント化

目的:

- UIの焼き増しを減らす
- 以降のタグ・検索・レスポンシブ修正の土台を作る

作る候補:

- `components/TagChip.tsx`
- `components/FilterChipGroup.tsx`
- `components/FilterSelect.tsx`
- `components/EmptyState.tsx`
- 必要なら `components/SectionCard.tsx`

優先順:

1. `TagChip`
2. `FilterChipGroup`
3. `FilterSelect`
4. `EmptyState`
5. `SectionCard`

適用候補:

- `ReportsBrowser.tsx`
- `GuidesBrowser.tsx`
- `UseCasesBrowser.tsx`
- `RobotsBrowser.tsx`
- `ManufacturersBrowser.tsx`
- `ContactForm.tsx`

やらないこと:

- 見た目を大きく変えない
- タグURL機能はまだ入れない
- 検索ライブラリはまだ入れない

完了条件:

- 主要な chip/select/empty state の重複が減っている
- 既存の表示と意味が変わっていない
- `npm run build` 成功

---

### Phase 3: データ/helper整理

目的:

- データ取得・ラベル・表示定数の責務を整理する

修正候補:

- `categoryLabels` を `lib/labels.ts` に移す
- `envLabels` を `lib/labels.ts` に移す
- `capLabels` を `lib/labels.ts` に移す
- `TBD = '要確認'` を共通定数にするか判断する
- `getReports().filter(...)` を `lib/data.ts` の関数に戻す
- `PRE_RELEASE_STAGES` の配置を見直す

対象例:

- `components/RobotsBrowser.tsx`
- `src/app/robots/[slug]/page.tsx`
- `src/app/use-cases/[slug]/page.tsx`
- `src/app/manufacturers/[slug]/page.tsx`
- `lib/data.ts`
- `lib/labels.ts`

完了条件:

- ページ側の直接 filter が減っている
- label定義の重複が減っている
- 表示は変わっていない
- `npm run build` 成功

---

### Phase 4: タグ基盤

目的:

- `tags`、`topics`、`industryTags`、`taskTags` を、UI上は一貫したタグ機能として扱えるようにする

作る候補:

- `lib/tags.ts`

責務:

- タグ正規化
- 表示名生成
- collection横断のタグ集約
- タグ種別の定義
- タグ検索対象の整理

現状のタグ相当データ:

- `Report.tags`
- `Guide.topics`
- `UseCase.industryTags`
- `UseCase.taskTags`

設計判断:

- MVPでは独立 `tags` collection は作らない
- まずは既存配列を集約して使う
- 表示UIは `TagChip` に統一する
- URL state は Phase 5 で扱う

完了条件:

- タグ表示のルールが統一されている
- タグ正規化処理が `lib/tags.ts` に閉じている
- `npm run build` 成功

---

### Phase 5: タグURL・一覧フィルタ改善

目的:

- タグやフィルタ状態を共有可能にする
- ブラウザ戻る操作や検索流入に強くする

対象:

- `ReportsBrowser.tsx`
- `GuidesBrowser.tsx`
- `UseCasesBrowser.tsx`
- 必要に応じて `RobotsBrowser.tsx`
- 必要に応じて `ManufacturersBrowser.tsx`

候補仕様:

- `?tag=manufacturing`
- `?topic=PoC`
- `?industry=logistics`
- `?task=inspection`
- `?q=keyword`

注意:

- すべてを一気に URL state 化しない
- まず `reports` と `guides` のタグ/トピックから始める
- URL仕様が増えすぎたら KISS 違反として縮小する

完了条件:

- タグクリックでURLが変わる
- URL直アクセスでフィルタが復元される
- ブラウザ戻る操作が自然
- `npm run build` 成功

---

### Phase 6: 検索改善

目的:

- 現在の単純一致検索を、将来の検索ライブラリ導入に耐える構造にする

前提:

- 現状の `matchesQuery` は小規模データでは問題ない
- いきなり有料検索サービスは不要

候補:

- まず `lib/search.ts` の API を整理する
- 検索対象フィールドをページごとに明示する
- 件数が増えたら Fuse.js を検討する
- サイト全体検索が必要になったら Pagefind を検討する

やらないこと:

- Algoliaなどの有料SaaSを先に入れない
- 検索モーダルと一覧内検索を混同しない

完了条件:

- 検索対象フィールドが読みやすい
- 検索ロジックが差し替え可能
- `npm run build` 成功

---

### Phase 7: レスポンシブ・アクセシビリティ修正

目的:

- モバイルでも崩れにくくする
- 操作UIの意味を明確にする

修正候補:

- 固定 `grid-cols-3` を `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` に変更
- `CompareClient` の3ペイン固定幅をモバイル対応する
- icon button に `aria-label` を追加
- select/input/textarea の label を確認
- 長い文言やタグの折り返しを確認

対象例:

- `src/app/page.tsx`
- `components/RobotsBrowser.tsx`
- `components/ManufacturersBrowser.tsx`
- `components/CompareClient.tsx`
- `components/RobotCard.tsx`
- `components/RobotImageCarousel.tsx`

完了条件:

- 主要ページがモバイル幅で破綻しない
- icon button の意味が支援技術に伝わる
- `npm run build` 成功

---

### Phase 8: 外部ID・運用安全性

目的:

- 本番運用で困る直書きを減らす

修正候補:

- Formspree ID を環境変数に寄せる
- contact form の失敗時表示を確認する
- Vercel環境変数が未設定の場合の fallback を決める

対象:

- `components/ContactForm.tsx`
- `.env` 運用ドキュメント

注意:

- 秘密情報をコミットしない
- 環境変数名をREADMEにだけ記載し、値は記載しない

完了条件:

- 外部ID直書きが減っている
- 未設定時の挙動が明確
- `npm run build` 成功

---

### Phase 9: 最終監査

目的:

- 変更全体が一貫しているか確認する

確認:

- `rg` で重複UIや直書きが残っていないか確認
- `npm run build`
- 主要ページの手動確認
- `git diff --stat`
- 未解決リスクの記録

主要ページ:

- `/`
- `/robots`
- `/robots/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/guides`
- `/guides/[slug]`
- `/use-cases`
- `/use-cases/[slug]`
- `/reports`
- `/reports/[slug]`
- `/compare`
- `/contact`

完了条件:

- 各フェーズの未解決事項が整理されている
- build成功
- 変更コミットがフェーズ単位で分かれている
- Vercel反映対象の branch が最新

---

## 5. 実装時のコミット方針

1フェーズ1コミットを基本にする。

例:

```text
refactor(ui): add reusable filter controls
refactor(data): centralize labels and related lookups
feat(tags): add tag helpers and shared chips
feat(search): improve listing search structure
fix(ui): improve responsive listing layouts
chore(config): move contact form id to env
```

コミット前に必ず確認する。

```bash
git status --short --branch
git diff --cached --name-only
npm run build
```

---

## 6. 次にやること

次の作業は Phase 1。

実装には入らず、まず以下を確定する。

- 共通化すべきUIの一覧
- ハードコードの一覧
- `lib/data.ts` に寄せるべき処理の一覧
- タグ機能の最小仕様
- 検索改善の最小仕様
- Phase 2以降の修正対象ファイル

