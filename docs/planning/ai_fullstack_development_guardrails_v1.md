# AI単独実装のためのWeb/フルスタック開発ガードレール v1

## 1. 目的

AIだけでWeb開発やフルスタック開発を進めると、短時間で動くものは作れる一方で、既存設計の読み落とし、過剰なハードコード、UIの焼き増し、データ構造の破壊、検証不足が起きやすい。

この文書は、AI実装を「速いが壊れやすい作業」ではなく、「小さく調査し、小さく直し、自己監査してから次へ進む作業」にするための運用ルールである。

本プロジェクトでは、特に以下を守る。

- 既存のデータモデル、設計ドキュメント、UI方針を読んでから実装する
- `data/*.ts` はデータの真実源、`lib/data.ts` は取得と関連解決の窓口として扱う
- 同じUIを焼き増ししない。共通化候補を常に確認する
- 1フェーズごとに「実装に不備がある前提」で自己監査する
- 不備が残っている限り、次フェーズに進まない

---

## 1.5 このプロジェクトにおける「フロント/バックエンド」の定義

このプロジェクトはNext.js App Router + 静的データファイルで動いており、APIサーバーもDBもない。「フルスタック確認」とは以下の層を指す。

```
┌─────────────────────────────────────────────────────┐
│ データ層（バックエンド相当）                            │
│  data/types.ts         — 型定義の唯一の正本            │
│  data/*.ts             — 実データ（配列）              │
│  lib/data.ts           — 取得・slug解決・関連解決      │
│  lib/validate.ts       — 参照整合・型カバレッジ検査    │
│  scripts/validate-data.mjs — CI相当の検証実行         │
│  lib/labels.ts         — enum→表示名の正本            │
│  lib/display.ts        — 表示順・並び替え関数         │
│  lib/tagRegistry.ts    — タグ値の正本                  │
│  lib/visualSemantics.ts — 色トーンの正本              │
│  lib/uiText.ts         — UI文言の正本                  │
├─────────────────────────────────────────────────────┤
│ ブリッジ層（Server Component / ルーティング）           │
│  src/app/**/page.tsx   — URLパラメータ読取・データ取得 │
│  lib/searchParams.ts   — URLパラメータ正規化           │
│  lib/metadata.ts       — OGP・seo生成                  │
│  src/app/sitemap.ts    — サイトマップ生成              │
├─────────────────────────────────────────────────────┤
│ フロントエンド層（Client Component / 状態管理）         │
│  components/*.tsx      — UIコンポーネント              │
│  lib/article*.ts       — 記事フィルタ・棚・ページング  │
│  lib/useUrlParamUpdater.ts — URL state更新             │
│  lib/*Filters.ts       — フィルタロジック              │
│  lib/searchIndex.ts    — MiniSearch インデックス       │
└─────────────────────────────────────────────────────┘
```

実装がおかしいとき、問題は必ずこの3層のどこかにある。

---

## 2. AIがやりがちな失敗と対策

### 2.1 既存構造を読まずに実装する

起きること:

- 既にある helper や component を使わず、似た処理を新規作成する
- データ取得ルールを破って、ページから直接 `data/*.ts` を参照する
- Figma復元方針やデータ運用ルールと違うUIを作る

対策:

- 実装前に `README.md`、`CLAUDE.md`、`docs/planning/README.md` を確認する
- 変更対象の周辺ファイルを最低2階層読む
- `rg` で同名・類似機能・文言・className を検索する

フェイルセーフ:

- 既存実装が見つかったら、まず再利用する
- 再利用できない場合だけ、新規コンポーネント化する理由を明記する
- 判断に迷う場合は新規抽象化ではなく、局所変更に留める

---

### 2.2 DRYを無視して焼き増しする

起きること:

- 同じ検索欄、タグ、カード、空状態、サイドバーがページごとに直書きされる
- 微妙に違う余白・色・文言が増え、後から一括修正できない
- バグ修正が1箇所で済まなくなる

対策:

- 3回以上出るUIは共通化候補にする
- 同じ `className` が複数ページにある場合は component 化を検討する
- 共通化は「見た目」「振る舞い」「データ変換」を分けて考える

フェイルセーフ:

- いきなり巨大な汎用コンポーネントを作らない
- まず `TagChip`、`EmptyState`、`FilterSelect` のような小さい部品から共通化する
- 共通化で props が増えすぎたら、抽象化しすぎと判断して分割する

---

### 2.3 KISSを破って抽象化しすぎる

起きること:

- 実態は2箇所でしか使わないのに、過度に汎用的なフレームワークを作る
- props が増えすぎて、使う側のコードが読みにくくなる
- 仕様変更時に抽象化そのものが足かせになる

対策:

- 抽象化は「重複を減らす」「意図を明確にする」「バグを閉じ込める」のどれかに効く場合だけ行う
- まず小さく作り、利用箇所が増えてから汎用化する
- UI部品と業務ロジックを混ぜない

フェイルセーフ:

- 抽象化前より呼び出し側が長くなるなら戻す
- 変数名や props 名だけで用途が分からない場合は作り直す
- 1コンポーネントが複数ドメインを知り始めたら分割する

---

### 2.4 ハードコードを増やす

起きること:

- ラベル、ステータス、タグ、フォームID、URL、上限値が散らばる
- 本番環境とローカル環境で動作が変わる
- 将来CMSやDBに移す時に呼び出し形を変える必要が出る

対策:

- enumラベルは `lib/labels.ts` に集約する
- データ取得、slug lookup、関連取得は `lib/data.ts` に寄せる
- 外部サービスIDや秘密情報は環境変数に寄せる
- UI文言も複数箇所で使うなら `lib/uiText.ts` に寄せる

フェイルセーフ（このプロジェクト用 grep）:

```bash
# コンポーネント内の日本語文字列直書き（ラベル・文言）
rg --no-ignore "['\"][　-鿿][^'\"]*['\"]" components src --include="*.tsx" -l

# ArticleType/ArticleSection/ArticleShelf の値をコンポーネント内で直比較
rg "article\.type\s*===|article\.section\s*===" components src

# 旧URLパラメータ名の残留
rg "section=|theme=|industry=|region=" src components lib --include="*.ts" --include="*.tsx"

# labels.ts を通さず enum 値を日本語化
rg "'(analysis|market-analysis|tech-update|deployment-report|news-brief)'" components src
```

---

### 2.5 データモデルを勝手に変える

起きること:

- UI都合で型を追加し、データ運用ルールとズレる
- 関連slugが片方向だけ更新され、詳細ページの関連表示が壊れる
- validate が通らない値がデータに入る

対策:

- 型変更前に `data/types.ts` を確認する
- 関連は原則 `id` で持つ。`slug` は公開URL専用として扱う
- 逆引きできる関係は重複保持しない

フェイルセーフ:

```bash
npm run validate:data   # 型・ラベル・参照整合の全チェック
npm run build           # TypeScript型エラーの最終確認
```

---

### 2.6 検証不足のまま「できた」とする

起きること:

- TypeScriptは通るがUIが崩れている
- 一覧は動くが空状態やフィルタ組み合わせで壊れる
- URLを直打ちすると崩れる

対策:

- 最低限 `npm run build` を通す
- 変更したページをローカルで開く
- 空データ、複数件、0件、長い文字列を確認する
- モバイル幅とデスクトップ幅を確認する

フェイルセーフ:

- 検証できなかった項目は明記する
- ビルドできない場合は原因を切り分けてから次へ進む

---

### 2.7 Git管理を雑にする

起きること:

- ユーザーの未コミット変更を混ぜる
- unrelatedな変更を同じコミットに入れる
- 作業ツリー全体（未コミット差分込み）で `build`/`validate` を通し、「検証OK」のままコミット・pushする。作業ツリーに他の未コミット変更（型定義の緩和など）が混在していると、コミットした差分単体では型エラーになる状態を見逃す（例: ある型を `never` から `string[]` に緩める変更が未コミットのまま、緩めた型に依存する新データだけをコミットしてpushし、CIビルドだけが失敗する）

対策:

```bash
git status --short --branch
git diff --cached --name-only     # stageした差分を確認
```

フェイルセーフ:

- 未コミット差分がある場合は、今回の作業対象か確認してから stage する
- unrelatedな差分は触らない
- `git reset --hard` や `git checkout --` はユーザー明示なしに使わない
- **一部だけをコミットする回（unrelatedな差分を残す回）は、コミット後に改めて `npm run build` を実行し、「コミットされた状態」で検証する。** 作業ツリーに残りの未コミット差分がある状態の検証結果は、pushされる内容の保証にならない。疑わしい場合は `git stash`（残す差分を退避）→ 検証 → `git stash pop` で切り分ける

---

### 2.8 UI品質を後回しにする

起きること:

- 固定3カラムがモバイルで崩れる
- テキストがボタンやカードからはみ出る
- button/link/input の意味が曖昧になる

対策:

- 固定 `grid-cols-3` は `sm:` / `md:` / `lg:` を明示する
- フォームには label と `aria-label` を付ける
- icon button には `aria-label` を付ける

フェイルセーフ:

- モバイル幅で必ず確認する
- 長い日本語、長い英語、空配列で確認する
- iconだけの操作はアクセシビリティ確認を必須にする

---

### 2.9 URL state を正しく扱わない

起きること:

- URLパラメータの正規化が抜けて、無効値でUIが壊れる
- 旧URLパラメータが来たときにエラーになる
- タブ選択がリロードで消える
- フィルタ変更時にページが1に戻らない

対策:

- URL読取は page.tsx（Server Component）で行い、正規化関数を通す
- 旧パラメータは「無視して正常表示」に倒す（404や空一覧にしない）
- ページ変更パラメータはフィルタ変更時に同時にリセットする

フェイルセーフ（手動確認）:

```
/path?unknown=value            → 壊れないこと
/path?oldparam=oldvalue        → 壊れないこと
/path?kind=news → リロード     → ニュースタブが選ばれていること
/path?page=99 (存在しないページ) → 崩れないこと
```

---

### 2.10 Server / Client 境界を崩す

起きること:

- 'use client' が不要なファイルについている（SSG効率低下）
- Server Component でイベントハンドラを書いてビルドエラー
- Client Component で `getArticles()` を直接呼び出してデータが取れない
- URL state の読取を Client Component でやっていて hydration がずれる

対策:

- データ取得・URLパラメータ読取は page.tsx（Server Component）で完結させる
- インタラクション（クリック・検索・ページング）だけ Client Component に渡す
- Client Component に渡す props は最小限にする

フェイルセーフ:

```bash
# 'use client' のついたファイルを確認し、不要なものがないか見る
rg "'use client'" components lib src --include="*.tsx" --include="*.ts" -l

# Client Component 内で lib/data.ts を直接呼んでいないか確認
rg "getArticles\|getManufacturers\|getRobots\|getUseCases" components --include="*.tsx"
```

---

## 3. 実装フェーズの自己監査ループ

各フェーズは以下の順序で進める。これは毎回必須。

### Phase 0: git状態確認

```bash
git status --short --branch
git log --oneline -5
```

合格条件:

- 今回の作業対象外の差分を stage しない
- `git reset --hard` や `git checkout --` はユーザー明示なしに使わない

---

### Phase 1: 調査

確認:

- 同じUIや同じ処理が既にあるか
- データ取得ルールに従っているか
- 設計ドキュメントと矛盾していないか

合格条件:

- 変更対象ファイルと関連ファイルを説明できる
- 使うべき既存コンポーネント、helper、label定義が分かっている

---

### Phase 2: 最小計画

計画に含める:

- 変更するファイル
- 変更しないファイル
- 正本になる定数・型・関数の置き場所
- 検証方法

合格条件:

- 1コミットで説明できる範囲に収まっている
- unrelatedなリファクタが混ざっていない

---

### Phase 3: 実装

ルール:

- データ層、ブリッジ層、フロントエンド層を別々に変更する
- 新しい依存は必要性を説明できる時だけ追加する

---

### Phase 4: 自己回帰的な不備探し

問い:

- 同じUIがまだ他にも残っていないか
- 既存のデータ取得ルールを破っていないか
- ラベルや定数が散らばっていないか
- モバイルで崩れないか
- 空状態、0件、長文で壊れないか
- URLを直打ちしたとき壊れないか

---

### Phase 5: 検証

```bash
npm run validate:data
npm run build
```

手動:

- 変更したページの基本操作
- モバイル幅
- URLパラメータの直打ち・リロード

未コミットの他差分（unrelated分）を残したままstage/commitする場合は、上記2コマンドを**作業ツリーではなくコミット後の状態**で再実行する（§2.7参照）。作業ツリー込みの検証結果は、pushされる内容が壊れていないことの証明にならない。

---

### Phase 6: コミット

```bash
git diff --cached --name-only   # stageした内容を最終確認
git commit -m "<scope>: <summary>"
```

---

## 4. 実装後フルスタック確認チェックリスト

実装後に「これが通れば壊れていない」と言える最小確認セット。

### 4.1 データ層（バックエンド相当）

```bash
npm run validate:data
```

これ1本で以下を全チェックする:

- `data/types.ts` の ArticleType / ArticleSection 等の enum と `lib/labels.ts` / `lib/display.ts` の順序配列がカバレッジ一致
- `data/*.ts` の各レコードの必須フィールド・参照整合（relatedRobotIds が実在するか等）
- タグ値が `lib/tagRegistry.ts` に登録済みか

追加で目視:

- `data/types.ts` に追加した型が `lib/labels.ts`, `lib/display.ts`, `lib/visualSemantics.ts` のすべてに反映されているか

---

### 4.2 ブリッジ層（Server Component / URLルーティング）

```bash
npm run build
```

これで静的生成（133ページ）が全部通ることを確認する。

追加で目視:

| 確認 | コマンド |
|---|---|
| page.tsx がデータを lib/data.ts 経由で取っているか | `rg "from '@/data/" src/app --include="*.tsx"` |
| URLパラメータ正規化関数が通っているか | 変更した page.tsx のパラメータ読取箇所を目視 |
| metadata が更新されているか | ブラウザのタブタイトル・description を確認 |

---

### 4.3 フロントエンド層（Client Component / URL state）

手動確認（ブラウザ）:

```
正常系:
  /reports                     → デフォルト表示
  /reports?kind=news           → ニュースだけ表示
  /reports?q=Unitree           → 検索結果
  /reports?q=xxx&kind=news     → 組み合わせ

異常系・境界値:
  /reports?kind=basics-guide   → all にフォールバック（壊れない）
  /reports?unknown=xxx         → 壊れない
  /reports?page=999            → 壊れない（最終ページか1ページ目に倒れる）
  /reports?kind=news → リロード → ニュースタブが選ばれていること

空状態:
  0件になるフィルタ条件        → EmptyState が出る
  disabled タブのクリック       → 無反応（クリックできない）

レスポンシブ:
  モバイル幅（375px）でタブが横スクロールできる
  カードテキストがはみ出ない
```

---

### 4.4 共通のAIミス確認（grep）

実装後に以下を流してゼロヒットを確認する:

```bash
# 旧URLパラメータ名の残留（?section= / ?theme= / ?industry= / ?region=）
rg "section=|theme=|industry=|region=" src components lib --include="*.ts" --include="*.tsx" \
  | grep -v "facetConfig\|ARTICLE_FACETS\|tagRegistry\|// "

# ArticleType / ArticleSection 値のコンポーネント内直比較
rg "article\.(type|section)\s*===\s*['\"]" components src

# data/*.ts をコンポーネントから直接 import
rg "from '@/data/(?!types)" components --include="*.tsx"

# lib/data.ts を Client Component から直接呼び出し
rg "getArticles\|getManufacturers\|getRobots\|getUseCases\|getUseCases" components --include="*.tsx"

# 旧型名・旧パラメータ名の残留
rg "ArticleSectionFilter|activeSection|ARTICLE_SECTION_TABS|normalizeArticleSectionParam" \
  components src lib --include="*.ts" --include="*.tsx"
```

---

### 4.5 デプロイ層（Vercel）

```bash
git log --oneline -3     # 最新コミットを確認
git push                 # pushされているか確認
```

Vercel ダッシュボードで:

- 最新コミットのビルドが成功しているか
- Production / Preview URL が想定の環境か

---

## 5. 修正計画を作る時の推奨フェーズ

今後のリファクタや機能改善は以下の順で進めるのが安全。

1. 監査フェーズ — 重複UI、ハードコード、データ取得ルール違反、レスポンシブ問題を一覧化
2. データ/helper整理フェーズ — labels.ts, display.ts, uiText.ts に正本を集約
3. UI共通化フェーズ — TagChip, EmptyState, PageTabBar など既存部品を最大限利用
4. URL state整理フェーズ — パラメータ名・正規化関数の一本化
5. 最終監査フェーズ — validate:data + build + 手動確認 + git diff

各フェーズは「調査、計画、実装、自己監査、検証、コミット」の順で進める。前フェーズの不備が残っている場合、次フェーズへ進まない。
