# Reports 詳細ページ UI 実装計画 v1

作成: 2026-06-11  
改訂: 2026-06-11（指摘反映）

---

## 目的

`/reports/[slug]` 詳細ページを、量産に耐える記事フォーマットとして完成させる。

| # | やること |
|---|---|
| 1 | body（Markdown 本文）のサンプルを入れて構造を確定させる |
| 2 | body 内 h2 を TOC に動的追加する |
| 3 | `tags` / `readingTimeMin` を画面に表示する |
| 4 | 関連リンクを RelatedLinkList に統一する（guides と揃える） |

**スコープ外（別タスク）**: `authors?: Author[]` 型追加。現行 `author?: string` はそのまま維持する。

---

## 調査済みファイル

| ファイル | 確認内容 |
|---|---|
| `src/app/reports/[slug]/page.tsx` | 現行 UI 全体。header が heroImage あり/なしで 2 分岐 |
| `src/app/guides/[slug]/page.tsx` | 確立パターンの参照元。RelatedLinkList を種別ごとに分けて使用 |
| `data/types.ts` | `Report` 型 / `readingTimeMin?: number` 存在 |
| `data/reports.ts` | 全件 body 空・readingTimeMin 未設定 |
| `components/ArticleToc.tsx` | Scrollspy 実装済み。`ArticleTocItem = { label, href }` の flat array のみ受け付ける |
| `components/Markdown.tsx` | h2/h3 に id なし。`react-markdown` 使用。Client/Server 両対応 |
| `components/RelatedLinkList.tsx` | 単一 `{ id, title, items[] }` を受け取る |
| `lib/uiText.ts` | `uiText.common.readingMinutes(n)` 存在確認済み |
| `lib/tagRegistry.ts` | `'report'` kind 存在確認済み（TagChip で kind="report" 使用可） |

---

## 変更するファイル

| ファイル | 種別 | 変更内容 |
|---|---|---|
| `lib/markdownHeadings.ts` | **新規** | `slugifyHeading` / `extractH2Headings` |
| `components/Markdown.tsx` | 変更 | h2/h3 に `id` と `scroll-mt-site-header` を追加 |
| `data/reports.ts` | 変更 | `bmw-figure-deployment` に `body` / `readingTimeMin` を追加 |
| `src/app/reports/[slug]/page.tsx` | 変更 | 動的 TOC / tags / readingTimeMin / RelatedLinkList |

## 変更しないファイル

| ファイル | 理由 |
|---|---|
| `components/ArticleToc.tsx` | flat array interface を変えない。動的 items は page.tsx 側で生成して渡す |
| `data/types.ts` | `Report` 型に変更なし。`readingTimeMin` は既に存在 |
| `lib/data.ts` | データ取得層は変えない |
| `src/app/reports/page.tsx` | 一覧ページはスコープ外 |

---

## 実装手順

### Phase 1 — `lib/markdownHeadings.ts` 新規作成

```ts
// Markdown 文字列から h2 見出しテキストと anchor id を抽出するユーティリティ。
// page.tsx（Server Component）で呼んで TOC items を生成する。
// Markdown.tsx の h2 id 生成にも同じ slugifyHeading を使い、両者の id を一致させる。

export interface MarkdownH2 {
  text: string;
  id: string;
}

export function slugifyHeading(text: string): string
export function extractH2Headings(markdown: string): MarkdownH2[]
```

**`slugifyHeading` の仕様（ステートレス）:**
- 前後空白除去
- ASCII: スペース → ハイフン、英字を小文字化、`[^a-z0-9\-]` を除去
- 日本語・非 ASCII: そのまま保持（URI エンコードはブラウザに委ねる）
- 例: `"Why It Matters"` → `"why-it-matters"` / `"なぜ重要か"` → `"なぜ重要か"`
- **重複解決は行わない**（後述の編集ルールで保証する）

**`extractH2Headings` の仕様:**
- `## text` 行のみを対象（h3 は抽出しない）
- コードブロック（` ``` ` 〜 ` ``` `）内の行は除外
- 各 h2 に対して `slugifyHeading(text)` を呼ぶ

**重複 id と記法について（編集ルール）:**  
`slugifyHeading` はステートレス（文書内の出現順を知らない）。そのため `page.tsx` の `extractH2Headings` と `Markdown.tsx` の h2 レンダリングの両方が同じ関数を呼べば、同じテキストに同じ id が生成され一致する。ただし以下の制約を守る必要がある。

- **h2 見出しは記事内で重複させない**（id 衝突防止）
- **h2 見出しはプレーンテキストのみ。リンク・強調（`**`）・コード記法（`` ` ``）を含めない**

リンク付き見出し（`## [Foo](url)`）だと `extractH2Headings` は `[Foo](url)` をテキストとして slugify するが、`Markdown.tsx` の `childrenToText` は `<a>` 要素の children から `Foo` のみを得るため id がズレる。プレーンテキスト限定の編集ルールでこの不一致を防ぐ。量産運用で違反があった場合は `extractH2Headings` に order suffix 方式を後から追加できるが、今フェーズでは実装しない。

### Phase 2 — `components/Markdown.tsx` 更新

h2/h3 に `id` と `scroll-mt-site-header` を追加する。`id` は `lib/markdownHeadings.ts` の `slugifyHeading` を import して生成する。

`children` から plain text を得るために `childrenToText` ヘルパーを同ファイル内に実装する:
```ts
function childrenToText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as React.ReactElement<{ children?: React.ReactNode }>;
    return childrenToText(element.props.children);
  }
  return '';
}
```

変更後の h2/h3:
```tsx
h2: ({ children }) => {
  const id = slugifyHeading(childrenToText(children));
  return (
    <h2 id={id} className="scroll-mt-site-header mt-6 mb-3 text-lg font-semibold text-foreground">
      {children}
    </h2>
  );
},
h3: ({ children }) => {
  const id = slugifyHeading(childrenToText(children));
  return (
    <h3 id={id} className="scroll-mt-site-header mt-5 mb-2 text-base font-semibold text-foreground">
      {children}
    </h3>
  );
},
```

h3 にも id を付けるが（将来の利用のため）、今回の TOC 動的追加は h2 のみを対象とする。

**guides 詳細ページへの影響:** guides の `Markdown` 使用箇所にも id が付くが追加的変更のみで、既存の guides TOC（静的 items）の挙動は変わらない。

### Phase 3 — `data/reports.ts` にサンプル body を追加

`bmw-figure-deployment` に `body` と `readingTimeMin` を追加する。

body の内容は `sources` に記載済みの Figure AI 公式発表・BMW Group 公式プレスリリースの内容に限定する。AI 生成値は含めない。不明事項は `（要確認）` と記述する。h2 見出しを 3〜4 本含む Markdown（目安 400〜600 字）。

`readingTimeMin: 5` を追加する（body 量から見当）。

### Phase 4 — `src/app/reports/[slug]/page.tsx` 修正

#### 4-1. TOC の構造（最終方針）

```
固定エントリ:
  { label: 'なぜ重要か',        href: '#why' }
  { label: '要点',              href: '#takeaways' }  ← hasTakeaways のとき
  { label: '本文',              href: '#body' }        ← hasBody のとき（body セクション全体 anchor）
body の h2 から動的追加:
  { label: '〈h2 見出しテキスト〉', href: '#〈id〉' }   ← body 内 h2 ごとに挿入（hasBody のとき）
関連（種別ごと）:
  { label: '関連ロボット',      href: '#related-robots' }        ← robots.length > 0 のとき
  { label: '関連メーカー',      href: '#related-manufacturers' } ← manufacturers.length > 0 のとき
  { label: '関連用途',          href: '#related-use-cases' }     ← useCases.length > 0 のとき
  { label: '関連ガイド',        href: '#related-guides' }        ← guides.length > 0 のとき
固定エントリ:
  { label: '出典',              href: '#sources' }
```

旧来の `{ label: '関連', href: '#related' }` 単一エントリは削除する。body セクションに `id="body"` の wrapper div を置き、その中に `<Markdown>` をレンダリングする。body 内 h2 はそのまま `id={slugifyId}` を持つので、TOC の `href="#body"` はセクション先頭へのジャンプ、body 内 h2 の href は各見出しへの直接ジャンプになる。

#### 4-2. tags 表示（hero あり/なし 両方）

tags はメインコンテンツカラム（3 カラムレイアウトの中央列）の **冒頭、`#why` セクションの上** に配置する。これにより hero 画像オーバーレイの暗い背景問題を回避し、両ヘッダーバリアントで同一の実装になる。

```tsx
{/* タグ（コンテンツカラム冒頭） */}
{report.tags.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {report.tags.map((tag) => (
      <TagChip key={tag} kind="report" value={tag} className="py-1" />
    ))}
  </div>
)}

{/* なぜ重要か */}
<div id="why" className="scroll-mt-site-header ...">
  ...
</div>
```

hero 画像バリアント・フラットバリアントとも、コンテンツカラムは同じ `<div className="col-span-12 space-y-6 lg:col-span-7">` の中にあるため、条件分岐は不要。

#### 4-3. readingTimeMin 表示

フラットヘッダーのメタ情報行に追加:
```tsx
{report.readingTimeMin && (
  <span className="flex items-center gap-1.5">
    <Clock className="h-3.5 w-3.5" />
    {uiText.common.readingMinutes(report.readingTimeMin)}
  </span>
)}
```

hero 画像バリアントのメタ情報行（`div.flex.flex-wrap.items-center.gap-4`）にも同じ要素を追加する。

#### 4-4. RelatedLinkList に置換

既存の手書き Link ループを削除し、種別ごとに `RelatedLinkList` を使う（guides パターンと同一）。

```tsx
{robots.length > 0 && (
  <RelatedLinkList
    id="related-robots"
    title="関連ロボット"
    items={robots.map((r) => ({
      href: `/robots/${r.slug}`,
      title: r.nameJa ?? r.name,
      description: r.summary,
    }))}
  />
)}
{manufacturers.length > 0 && (
  <RelatedLinkList
    id="related-manufacturers"
    title="関連メーカー"
    items={manufacturers.map((m) => ({
      href: `/manufacturers/${m.slug}`,
      title: m.nameJa ?? m.name,
      description: m.summary,
    }))}
  />
)}
{useCases.length > 0 && (
  <RelatedLinkList
    id="related-use-cases"
    title="関連用途"
    items={useCases.map((u) => ({
      href: `/use-cases/${u.slug}`,
      title: u.titleJa ?? u.title,
    }))}
  />
)}
{guides.length > 0 && (
  <RelatedLinkList
    id="related-guides"
    title="関連ガイド"
    items={guides.map((g) => ({
      href: `/guides/${g.slug}`,
      title: g.titleJa ?? g.title,
    }))}
  />
)}
```

旧来の `hasRelated` フラグと単一 `id="related"` div は削除。TOC の関連エントリは 4-1 の通り種別ごとに分割。

#### 4-5. author 表示（現行維持）

`report.author?: string` は現行コードのまま（`User` アイコン + テキスト）。変更なし。

---

## 検証コマンド

```bash
npm run build
```

（lint / typecheck は未設定のため build のみ）

## 手動確認チェックリスト

- [ ] `npm run build` が通る
- [ ] `/reports/bmw-figure-deployment` で body（Markdown 本文）が表示される
- [ ] body の h2 見出しが TOC に出現し、クリックでスクロールされる
- [ ] TOC のアクティブ項目が Scrollspy で切り替わる
- [ ] `tags` が `#why` の上に TagChip で表示される（hero あり/なし 両方）
- [ ] `readingTimeMin` が Clock アイコンと共にヘッダーのメタ情報行に表示される
- [ ] 関連セクションが RelatedLinkList スタイルで種別ごとに表示される
- [ ] `/reports/gxo-digit-100k-totes`（body 空）で body セクション非表示・他は正常
- [ ] 375px 幅で横スクロールなし・TOC 非表示（`hidden lg:block`）
- [ ] guides 詳細ページ（body ありのもの）の表示が壊れていない

---

## 残るリスク

| リスク | 対応 |
|---|---|
| body 内に重複 h2 テキストがあると TOC anchor がズレる | 記事内 h2 は一意にする（編集ルール）。違反した場合 TOC クリックで意図しないセクションに飛ぶが、ページ崩壊はしない |
| `childrenToText` が将来の react-markdown バージョンアップで壊れる可能性 | 手動確認で検出できる。react-markdown の major バージョンアップ時に再確認 |
