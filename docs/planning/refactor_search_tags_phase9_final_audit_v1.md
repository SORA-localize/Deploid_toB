# Phase 9 最終監査結果: UI共通化・検索・タグ改善 v1

Last reviewed: 2026-05-29

## 1. 対象

`refactor_search_tags_execution_plan_v1.md` の Phase 0 から Phase 8 までの実装結果を最終確認した。

対象ブランチ:

- `main`
- `origin/main`

監査開始時点:

- `main...origin/main = 0 0`
- 作業ツリー clean

## 2. 実行した確認

### 2.1 Git / commit 整理

直近の主要commitはフェーズ単位で分かれている。

- `refactor(search): add shared search documents`
- `fix(search): keep urls out of query fields`
- `fix(ui): improve responsive layouts`
- `fix(media): contain robot reference images`
- `docs: add media rights policy`
- `docs: clarify demo media rights policy`
- `docs: refine commercial media rights guidance`
- `chore(config): move contact form id to env`

履歴のforce pushやsquashは不要と判断した。すでに `main` にpush済みで、フェーズ単位の粒度として追跡しやすいため。

### 2.2 直書き / env

確認コマンド:

```sh
rg -n "mgoqrrkb|useForm\('|formspree|NEXT_PUBLIC_FORMSPREE_FORM_ID|process\.env|\.env\.local" . --glob '!node_modules/**' --glob '!.next/**' --glob '!package-lock.json'
```

結果:

- Formspree ID の raw value は残っていない。
- `components/ContactForm.tsx` は `NEXT_PUBLIC_FORMSPREE_FORM_ID` を参照する。
- 未設定時はフォーム送信不可のUIになる。
- `.env.example` と `README.md` に環境変数を記載済み。
- `.env.local` は `.gitignore` 済み。

### 2.3 データ取得ルール

確認コマンド:

```sh
rg -n "from ['\"]@/data|from ['\"]\.\./data|data/.*\.ts|getReports\(\)\.filter|getRobots\(\)\.filter|getManufacturers\(\)\.filter|getUseCases\(\)\.filter|getGuides\(\)\.filter" src components lib --glob '!lib/data.ts'
```

結果:

- ページやコンポーネントが `data/*.ts` の配列を直接 import している箇所はない。
- `@/data/types` の type import は許容。
- 実データ import は `lib/data.ts` と `lib/validate.ts` に閉じている。

### 2.4 UI / レスポンシブ / アクセシビリティ

確認コマンド:

```sh
rg -n "grid-cols-3|w-64 flex-shrink-0|grid md:grid|object-cover|<img|aria-label|ariaLabel|<button|useForm\(|VIEW FULL PROFILE|All Status|要確認|TBD|Featured|SearchModal|SearchInput" components src/app lib data
```

結果:

- `w-64 flex-shrink-0` の固定サイドバーは残っていない。
- 無条件の `grid-cols-3` は残っていない。
- 残る `grid-cols-3` は `md:` / `lg:` / `xl:` などのresponsive指定付き。
- Robot画像は `object-contain` に変更済み。
- 主要なicon buttonには `aria-label` が入っている。
- `SearchModal` は未実装。現状は `SearchInput` による一覧内検索として整理済み。

### 2.5 検索 / タグ

確認コマンド:

```sh
rg -n "tags|topics|industryTags|taskTags|getTagLabel|getTagSearchValues|normalizeTagKey|matchesTag|TagChip|FilterChipGroup" components src/app lib data
```

結果:

- タグの正規化と検索値生成は `lib/tags.ts` に集約済み。
- 検索対象は `lib/search.ts` の `SearchDocument` builder に集約済み。
- `url` は検索対象 `fields` から除外済み。
- Guides用の `createGuideSearchDocument` は存在するが、Guides一覧には検索UIを追加していない。これは今回の「検索UIを増やさない」方針内。

### 2.6 Build

実行:

```sh
npm run build
```

結果:

- 成功。
- Next.js の edge runtime による static generation 警告は既存の `opengraph-image` 由来で、今回の変更による失敗ではない。

### 2.7 主要ページ応答

`npm run start -- --hostname 127.0.0.1 --port 3001` でproduction serverを起動して確認した。

HTTP 200を確認したページ:

- `/`
- `/robots`
- `/robots/unitree-g1`
- `/manufacturers`
- `/manufacturers/unitree`
- `/guides`
- `/guides/decision-variables`
- `/use-cases`
- `/use-cases/warehouse-picking`
- `/reports`
- `/reports/bmw-figure-deployment`
- `/compare`
- `/contact`
- `/sitemap.xml`

確認後、3001番のproduction serverは停止済み。

## 3. 未解決リスク

### 3.1 Vercel環境変数

`NEXT_PUBLIC_FORMSPREE_FORM_ID` はVercel側に設定が必要。

未設定でもbuildは成功し、Contactフォームは送信不可の準備中表示になる。公開前にはVercelのEnvironment Variablesに値を入れ、フォームから1件テスト送信する。

`NEXT_PUBLIC_SITE_URL` もVercel側で本番URLに設定することが望ましい。未設定時は `http://localhost:3000` がfallbackになる。

### 3.2 画像・ロゴ権利ゲート

media rights policy は追加済みだが、`rights.status` をデータモデルに実装し、`canDisplayAsset(asset)` で未許諾画像・ロゴを非表示にする処理はまだ入っていない。

現状は、登録済みの `heroImage`, `Robot.images`, `Manufacturer.logo` が表示される。公開運用・public demo前には、次のどちらかが必要。

- `commercial-permitted` など商用公開に耐える素材だけに差し替える。
- `rights` metadata と表示ゲートを実装する。

### 3.3 手動ビジュアル確認

今回のPhase 9ではHTTP 200とbuildを確認した。Playwright等によるmobile screenshot監査は未実施。

Phase 7で固定カラムは解消したが、実機幅での見た目確認は別途行う。

### 3.4 自動テスト

このプロジェクトには現時点でlint/test/e2e scriptがない。検証は `npm run build`, `rg`, HTTP 200確認が中心。

検索・URL filter・Contact form の回帰を防ぐなら、将来的に最小のE2Eまたはコンポーネントテストを追加する。

## 4. 結論

Phase 0 から Phase 8 までの計画対象は、現時点で実装・整理・push済み。

Phase 9の監査では、build失敗・主要ページ404・Formspree ID直書き・data直接参照・固定3カラムの重大な残りは見つからなかった。

次に着手すべき高優先度は、Vercel環境変数設定と、公開前の画像・ロゴ権利ゲートである。
