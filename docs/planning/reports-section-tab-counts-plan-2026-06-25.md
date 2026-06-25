# Reports Section Tab Counts Plan

Status: active/unimplemented plan
Created: 2026-06-25

この文書は、`/reports` の sticky section タブ（`PageTabBar`）を、記事ファセットUIと整合させるための実装計画である。実装判断の正本ではなく、実装後は正本文書へ反映して archive へ移動する。

## 背景

記事一覧は、現在2種類の軸を持つ。

- `section`: 記事の主題。記事1本につき必須で1つ。`PageTabBar` の sticky タブを駆動する。
- `theme` / `industry` / `region`: 補助ファセット。記事に0個以上付き、`FacetFilterBar` のドロップダウンを駆動する。

ファセット側は、件数表示・0件disabled・URL同期・0件時のEmptyStateまで整っている。一方で section タブは件数も0件disabledもなく、現在のデータでは `entertainment` が0件でも選択できる。

これはデータ構造の問題ではない。全記事は有効な `section` を持ち、`deployment` / `policy` は `themeTags` ではなく `section` 側に寄っている。問題は表示層の非対称である。

## 目的

- section タブを、主分類として固定したまま、現在の検索・ファセット条件に応じた件数を表示する。
- 0件の非アクティブsectionをdisabledにし、空タブへの行き止まりを減らす。
- section と補助ファセットの責務を混ぜない。
- `PageTabBar` を非破壊で拡張し、robots側など既存利用を壊さない。
- データ運用docsに、sectionとthemeTagsを混同しないための注意を残す。

## 非目的

- section の種類をファセット選択に応じて増減・変更しない。
- 0件sectionを非表示にしない。
- `section` を `FacetFilterBar` に統合しない。
- `themeTags` や記事データを、空sectionを埋める目的で変更しない。
- ドロップダウン幅の方針は変えない。`SelectControl` のトリガー幅固定は維持する。
- `components/ManufacturerMap*.tsx` など地図系の作業には触れない。

## 調査済みファイル

- `components/PageTabBar.tsx`
- `components/ReportsHeader.tsx`
- `components/ReportsBrowser.tsx`
- `lib/articleSections.ts`
- `lib/articleFilters.ts`
- `lib/facetConfig.ts`
- `lib/searchIndex.ts`
- `data/articles.ts`
- `data/types.ts`
- `docs/planning/data-architecture-redesign-v1.md`
- `docs/planning/design_system_v1.md`
- `docs/planning/ui_architecture_and_development_policy_v1.md`
- `docs/data/tagging.md`
- `docs/planning/data-maintenance-checklist-v1.md`

## 設計方針

### 1. section タブは固定軸

タブの種類と順序は `ARTICLE_SECTION_TABS` / `articleSectionOrder` を正本にする。ファセット選択によってタブを消したり、別の分類体系へ差し替えたりしない。

良い状態:

```txt
すべて 8 / 導入 2 / ビジネス 4 / 技術 2 / 政策 0 / エンタメ 0
```

避ける状態:

```txt
ファセット選択後にタブ自体が消える
ファセット選択後にsectionではない分類タブへ変わる
0件タブが非表示になり、タブ位置が動く
```

### 2. section 件数は、sectionだけ除外して計算する

各sectionの件数は「今そのsectionへ切り替えたら何件になるか」を表す。

計算ルール:

- 母集団は記事全体。
- 現在の検索 `q` は反映する。
- 現在の `theme` / `industry` / `region` は反映する。
- 現在の `section` だけは除外して、section別に数える。
- `all` は同条件下の全件数。

これは `FacetFilterBar` の「当該ファセットを除外し、他ファセットと検索で数える」考え方と対応する。ただし `section` は主分類なので、UIはドロップダウンではなくタブのままにする。

### 3. disabled の扱い

- `count === 0` かつ `activeSection !== tab.value` の具体sectionタブをdisabledにする。
- active中のsectionは、0件でもdisabledにしない。URL直打ちや条件変更で現在地が消えないようにする。
- `all` は0件でもdisabledにしない。section解除の逃げ道として常に選択可能にする。
- disabledタブは `aria-disabled` と click guard で扱う。native `disabled` は使わない。tooltipやtablist内の意味を壊さず、クリックだけ止めるため。
- disabledタブは pointer 由来でも keyboard 由来（Enter / Space 相当）でも `onSelect` しない。`onClick` の早期returnで統一する。
- 件数はスクリーンリーダーにも伝わるようにする。視覚上の数字をそのまま読むか、必要なら `aria-label="ビジネス、13件"` のようにタブ全体の accessible name を補う。視覚用countを `aria-hidden` にする場合は、必ず代替ラベルを入れる。

### 4. PageTabBar は汎用表示部品のままにする

`PageTabBar` はデータ取得・件数計算・URL更新を持たない。追加するのは表示用propsだけにする。

追加候補:

```ts
export interface PageTab<T extends string> {
  value: T;
  label: string;
  description?: string;
  count?: number;
  disabled?: boolean;
}
```

表示:

- `count != null` の場合だけ、ラベル横に小さく表示する。`if (tab.count)` のようなtruthy判定は禁止。0件表示が今回の主目的であり、`0` を必ず表示対象にする。
- 数字は `tabular-nums` と最小幅を使い、件数変化でタブ幅が過剰に揺れないようにする。
- `disabled` は `text-muted-foreground/40` など既存トークン内で表現する。背景・borderを増やさない。

### 5. Reports 側で section tab 状態を組み立てる

`ReportsBrowser` は既に `sorted`、`matchedSlugs`、`ARTICLE_FACETS`、`facetValues` を持っているため、section別件数の組み立て場所として妥当である。

実装イメージ:

```ts
const sectionCountBase = filterArticles({
  reports: sorted,
  facets: ARTICLE_FACETS,
  facetValues,
  matchedSlugs,
});

const countBySection = new Map<ArticleSection, number>();
for (const article of sectionCountBase) {
  countBySection.set(article.section, (countBySection.get(article.section) ?? 0) + 1);
}

const sectionTabs = ARTICLE_SECTION_TABS.map((tab) => {
  const count =
    tab.value === 'all'
      ? sectionCountBase.length
      : countBySection.get(tab.value) ?? 0;

  return {
    ...tab,
    count,
    disabled: tab.value !== 'all' && tab.value !== activeSection && count === 0,
  };
});
```

section別カウントは初期実装から `Map<ArticleSection, number>` で1回集計し、`filter` の繰り返しを避ける。現在の記事数では性能問題は小さいが、将来拡張と実装意図の明確さを優先する。

## 変更ファイル

### コード

- `components/PageTabBar.tsx`
  - `PageTab` に `count?` / `disabled?` を追加。
  - count 表示、disabled style、`aria-disabled`、click guard を追加。
  - 未指定時は既存挙動を維持。
  - robots側のように既に `label` に件数が含まれる利用では `count` を渡さない。二重件数表示を避ける。

- `components/ReportsHeader.tsx`
  - `tabs?: readonly PageTab<ArticleSectionFilter>[]` を受け取れるようにする。
  - 未指定時は `ARTICLE_SECTION_TABS` を使い、既存呼び出しを壊さない。
  - `onSelect` の既存挙動を維持する。特に section 変更時の `category: null` と `[ARTICLE_PAGE_PARAM]: null` は落とさない。

- `components/ReportsBrowser.tsx`
  - `ARTICLE_SECTION_TABS` を使って `sectionTabs` を組み立てる。
  - `ReportsHeader` に `tabs={sectionTabs}` を渡す。
  - 件数計算は `filterArticles` + `ARTICLE_FACETS` + `facetValues` + `matchedSlugs` を再利用する。
  - `sectionCountBase`、`countBySection`、`sectionTabs` は `useMemo` で組み立て、既存の派生配列パターン（`sorted`、`gridReports` 等）に揃える。

### docs

- `docs/planning/design_system_v1.md`
  - `PageTabBar` は主軸タブとして固定し、件数表示・0件disabledを持てることを追記。
  - 0件タブは非表示ではなくdisabledにする方針を追記。

- `docs/planning/data-architecture-redesign-v1.md`
  - `section` / `themeTags` の境界が現行記述と一致しているか確認する。
  - 既に一致していれば変更しない。必要な場合のみ、UI都合でデータを歪めない旨を短く補う。

- `docs/planning/ui_architecture_and_development_policy_v1.md`
  - `PageTabBar` と `FacetFilterBar` の責務分離を追記。
  - sectionは主分類、facetsは補助絞り込み、件数だけ連動することを明記。

- `ai/rules/30-ui-design.md`
  - UIルールの短い要約として、主軸タブの件数/disabled方針を追記。

- `docs/data/tagging.md`
  - `section` と `themeTags` の境界は既に記載済み。重複を増やさず、不足がある場合だけ「0件sectionを埋める目的でタグや記事を無理に追加しない」旨を短く補う。

- `docs/planning/data-maintenance-checklist-v1.md`
  - 記事追加時、sectionは主題、themeTagsは論点であり、UIの空タブ都合で選ばないことを追記。

- `docs/planning/README.md`
  - この計画書は既に (c) 未実装・作業計画へ登録済み。実装時に重複登録しない。
  - 実装完了後に archive へ移動するか、正本文書へ反映済みの背景資料として reclassify する。

## 実装手順

1. `PageTabBar` の型と表示を非破壊で拡張する。
2. `ReportsHeader` が外部から `tabs` を受け取れるようにする。
3. `ReportsHeader` の section変更時URL更新で、既存の `category: null` と `[ARTICLE_PAGE_PARAM]: null` を維持する。
4. `ReportsBrowser` で section 件数と disabled 状態を計算する。section別集計は `Map<ArticleSection, number>` を使う。
5. `/reports` の通常状態で、`entertainment` が `0` disabled になることを確認する。
6. 検索・ファセット選択時に、section件数が条件に連動することを確認する。
7. docs を更新する。
8. 検証コマンドと手動確認を実施する。

## 検証コマンド

- `npm run validate:data`
- `npx tsc --noEmit`
- `npm run build`

## 手動確認チェックリスト

- `/reports`
  - 全sectionに件数が出る。
  - `entertainment` が0件ならdisabled表示になる。
  - `すべて` は常に選択可能。

- `/reports?section=entertainment`
  - active tab は0件でも表示維持される。
  - EmptyState が表示される。
  - `すべて` や他の非0件sectionへ移動できる。

- `/reports?industry=manufacturing`
  - section件数が業種条件に連動する。
  - 0件sectionはdisabledになる。

- `/reports?section=policy&theme=funding`
  - active section が0件でも消えない。
  - ファセット側の選択中値も表示される。
  - チップ解除で復帰できる。

- `/reports?theme=not-a-real-tag`
  - 未登録facet値でもタブ、チップ、EmptyState、解除導線が破綻しない。

- `/reports?section=entertainment&theme=funding`
  - active section が0件でも表示維持される。
  - 他の0件sectionはdisabledになる。
  - `すべて` は選択可能。

- `/reports?category=deployment&section=business&page=2`
  - sectionタブを選択した時に `category` と `page` がURLから消える。

- 検索語を入れて、section件数が検索結果に連動する。
- disabled section はクリックでも Enter / Space でも選択されない。
- count がタブのaccessible nameとして伝わる。
- モバイル幅で tablist の横スクロール、count表示、disabled表示が崩れない。
- `RobotsHeader` の `PageTabBar` 表示が変わっていない。特に既存ラベル内の件数と `count` prop の二重表示がない。

## 自己レビュー

この計画に問題がある前提で監査し、以下を最終計画に反映した。

| 問題 | 重大度 | なぜ問題か | 反映した修正 |
|---|---|---|---|
| section タブをファセット選択に応じて非表示にすると、分類体系が揺れる | major | ユーザーが現在の主分類を見失う。タブ位置も動く | タブ種類は固定し、0件はdisabled表示に限定 |
| active中の0件sectionまでdisabledにすると、URL直打ち時に現在地が壊れる | major | `/reports?section=entertainment` などでactive stateが説明不能になる | active tab は0件でもdisabledにしない |
| `all` を0件disabledにすると、section解除の逃げ道がなくなる | major | 検索/ファセットで全体0件のときにタブ操作が不自然になる | `all` は常にenabled |
| `PageTabBar` に件数計算を入れると責務が混ざる | major | 共通UI部品がreports固有のデータロジックを持つ | `PageTabBar` は `count` / `disabled` の表示だけ担当 |
| `ReportsHeader` に件数計算を入れるとURL/search/facet状態が不足する | major | `ReportsHeader` は `matchedSlugs` や `facetValues` を持たない | `ReportsBrowser` で組み立てて `tabs` として渡す |
| section件数とファセット件数の計算ルールがズレる | major | 「この選択肢へ切り替えたら何件か」という意味が一貫しない | sectionだけ除外し、検索と他ファセットを反映するルールを明記 |
| native `disabled` を使うと tooltip や tablist 内の発見性が落ちる可能性がある | minor | disabled button はフォーカス不可になり、説明が見えにくい場合がある | `aria-disabled` + click guard を採用 |
| 件数表示でタブ幅が大きく揺れる | minor | 検索やファセット操作でUIがガタついて見える | countに `tabular-nums` と最小幅を使う |
| PageTabBar 拡張が robots 側へ副作用を出す | major | 共通部品変更は利用箇所を壊しやすい | propsはoptional、未指定なら既存DOMに近い表示を維持。`RobotsHeader` を手動確認対象に追加 |
| 空sectionを埋めるために記事やタグを追加する誘因が残る | major | UI都合でデータ構造を歪める危険がある | `docs/data/tagging.md` と checklist に「UIの空枠都合で選ばない」を追記対象にした |
| docsに詳細ルールを重複させすぎる | minor | 80-doc-governance の重複ポリシーに反する | 詳細は `design_system_v1.md` / `ui_architecture...`、`ai/rules/30` は短い要約にする |
| 手動確認がreportsだけに偏る | minor | 共通部品変更の副作用を見落とす | `RobotsHeader` とモバイルtablist確認をチェックリストに追加 |
| section変更時の既存URL掃除を落とす可能性がある | major | `category` やページ番号が残ると旧URL状態と新UI状態が混ざる | `ReportsHeader` の `category: null` / pageリセット維持を手順と確認項目に追加 |
| データ設計正本への確認が漏れる | major | section/themeの責務はUIだけでなくデータ設計にも関わる | `data-architecture-redesign-v1.md` を調査済み・確認対象に追加 |
| disabledタブのキーボード操作とaccessible nameが曖昧 | major | 見た目だけdisabledになり、キーボードや支援技術では選べてしまう可能性がある | Enter/Space由来のclick guardとcountのaccessible name確認を追加 |
| robots側の既存件数ラベルと新count propが二重表示になる可能性がある | minor | `RobotsHeader` は既に `label` に件数を含む | robotsには `count` を渡さない方針と手動確認を追加 |
| section集計のサンプルが将来拡張に弱い | minor | sectionごとの `filter` 繰り返しは意図が散りやすい | 初期実装から `Map<ArticleSection, number>` 集計にする |

## 残るリスク

- `PageTabBar` は既に横スクロール前提なので、count追加で横幅は増える。非表示にしない設計上これは許容するが、モバイルで見づらい場合はcountの文字サイズやgapを調整する。
- 記事件数が大きく増えた場合でも、section件数計算は初期実装から `Map` 集計にするため、計算量のリスクは小さい。
- ブラウザ実測なしでは、実際のsticky表示の視覚的な詰まりは完全には判断できない。実装後にモバイル/desktopで目視確認する。
- active 0件タブをenabled表示にするため、disabledルールを読むだけでは例外が分かりにくい。コードコメントを短く入れる。

## 最終判断

section とファセットは別軸のまま維持するのが正しい。変更するのは、sectionタブが現在の検索・補助ファセット条件を件数/disabledとして反映する表示層だけに留める。
