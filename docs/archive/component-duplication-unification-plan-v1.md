# Component Duplication Unification Plan v1

Status: completed — A・E・ManufacturerDetailHero/FactSheetは実装済み（下記「実装状況」参照）、B/Cは見送り決定済み
Last updated: 2026-06-23

## 追記：ManufacturerDetailHero/FactSheetの結末（当初の想定と異なる解決）

当初は「見た目（gutter 7rem vs 8rem・border-bの有無・dd太字）が違うため統合は別単位」としていたが、実装時にコード単体ではなくページ全体を読んだところ、見た目の差以前に**データの重複**が見つかった。`ManufacturerDetailHero` の `dl`（所在地・設立年・相談ルート・国内代理店・取扱機種数・最終更新の6項目）と `ManufacturerFactSheet` の `dl`（同じ6項目＋企業種別・企業ステータス・日本展開状況・Webサイト）が、同じ関数・同じラベルで同じ事実を画面に2回表示していた。

これは「2つの似た実装の見た目を揃える」問題ではなく「同じ情報をページに2回出している」問題だったため、`DefinitionList` のvariant統合では解決しない。代わりに `ManufacturerDetailHero` から重複していた `dl` を削除し、連絡導線（公式へ問い合わせ/Deploidに相談・外部サイトを見る）のみを残した。事実情報は `ManufacturerFactSheet` 側に一本化されている（`ManufacturerFactSheet` は元から全項目を含むスーパーセットだったため、FactSheet側の追記は不要だった）。

結果として、見た目を合わせる作業（gutter統一・`DefinitionList`への統合）自体が不要になった。比較対象の `dl` がHero側からなくなったため。

## 実装状況（2026-06-23）

完了：
- `components/SidebarSection.tsx`（`SidebarSection`/`SidebarBlock`/`SidebarDivider`）を新設し、`RobotStickyAside`・`use-cases/[slug]`・`guides/[slug]` の右サイドバー外枠を統一（sticky breakpointは `sticky: 'always' | 'lg'` propで吸収）。`reports/[slug]` は計画記載どおり対象外。
- `components/RelatedLinkList.tsx` に `variant="compact"` を追加し、`use-cases/[slug]`（関連ガイド・関連記事の2ループ）と `guides/[slug]`（関連用途の1ループ）の手書き `<nav>` を置き換え。あわせて欠落していた `last:border-b-0` のズレを解消。
- `components/ConsultationCta.tsx` を新設し、`use-cases/[slug]`・`guides/[slug]` の相談CTAブロックを共通化。
- `components/DefinitionList.tsx` に `detail-decision` variant（`sm:grid-cols-[8rem_1fr]`、アイコン対応、太字dd）を追加し、`robots/[slug]` の `decisionRows` dl・`specRows` dl（調査時点では未検出だった2つ目の同形 dl）、`use-cases/[slug]` の `atAGlance` dl を統合。mobile gap は `gap-0.5` と `gap-1` が混在していたため `gap-1` に統一（視覚差は360px時のみ・2px程度）。

見送り（この計画内で決定、コード変更なし）：
- B（`ComparisonRobotPanel`/`RobotCard` の簡易スペックリスト）: レイアウトが本質的に異なる（flex左右配置 vs grid-cols-2）ため、統合がKISSに反する過剰抽象化になると判断し見送りを既定とする。
- C（`text-xs font-semibold uppercase tracking-wide text-muted-foreground` の見出しclass文字列重複）: 構造的なJSX重複ではなく単一class文字列の重複であり、`reports/[slug]` の見出しシステム（Aとは別系統）にも関わるため、今回は見送る。

完了（当初の見送り方針を変更）：
- `ManufacturerDetailHero`・`ManufacturerFactSheet`：上記「追記」のとおり、gutter統一ではなく重複データの削除で解決。`ManufacturerDetailHero.tsx` から事実情報の `dl`（6項目）と未使用化した `robots` prop・関連import（`TBD_LABEL`、`getDomesticDistributorDisplay`等）を削除。呼び出し元 `src/app/manufacturers/[slug]/page.tsx` の `<ManufacturerDetailHero>` から `robots` propを削除。連絡導線は変更なし。

検証: `npx tsc --noEmit`、`npm run build` 通過（`validate:data` はデータ未変更のため対象外）。dev server起動後、`/robots/[slug]`・`/use-cases/[slug]`・`/guides/[slug]` をcurlでHTML構造を確認し、見出しラベル・リンクURL・区切り線数・definition listのgrid classが意図通りであることを確認済み。

この文書は、`layout-and-data-structure-audit-plan-v1.md` の調査・一次実装で意図的に保留した「定義リストの構造重複」を解消するための計画である。先行実装では `content-col` 幅の修正、日付・breadcrumb・ラベルの正本化、`about`/`privacy`/`for-manufacturers` の定義リスト共通化までは完了したが、`robots/[slug]`・`use-cases/[slug]`・`ManufacturerDetailHero`・`ManufacturerFactSheet` の4箇所は gutter 幅や breakpoint が異なるため見送っていた。この計画は、その4箇所を含めてプロジェクト全体を再調査し、`ai/rules/10-workflow.md` の Single Source of Truth / DRY / KISS の原則に照らして他にも放置されている構造重複がないかを確認したうえで、優先度をつけて解消する。

この計画は実装判断の正本ではない。完了後は archive へ移動する。

## 背景

前回の実装後レビューで、`robots/[slug]` の `decisionRows` 定義リスト、`use-cases/[slug]` の `atAGlance` 定義リスト、`ManufacturerDetailHero` のサイドバー定義リスト、`ManufacturerFactSheet` の定義リストの4箇所が、互いに近いが厳密には異なる grid 定義（gutter幅が `7rem` と `8rem` で混在し、breakpoint も `sm:` で統一されているものの dd の太字・コロン有無が食い違う）のまま個別実装され続けていることが判明した。これらを安全に統合するには見た目の差分検証が必要であり、前回の実装スコープには含めなかった。

今回、この4箇所以外にも同種の重複がないかをプロジェクト全体で再調査した。結果、4箇所の定義リストよりも構造的な重複量が大きく、かつ開発者自身がコードコメントで重複を認めている箇所が見つかった。

## 調査結果

### A. サイドバーの「区切り線＋見出しラベル」構成（最優先）

`components/RobotStickyAside.tsx`、`src/app/use-cases/[slug]/page.tsx` のサイドバー（256〜330行付近）、`src/app/guides/[slug]/page.tsx` のサイドバー（207〜260行付近）の3箇所が、`sticky top-site-header-gap space-y-5` という実質同一のラッパー（ただし `guides/[slug]` のみ `lg:sticky` で sticky 化の breakpoint が異なる）、`text-[10px] uppercase tracking-widest text-muted-foreground` という同一の見出しラベルclass、`border-t border-border` という同一の区切り線を使い、ブロック構成（スペック表／関連ロボット一覧／関連リンク／相談CTA）も酷似した独自実装を3回繰り返している。

この重複はコードコメント上でも認識されている。`use-cases/[slug]` 側のコメントは「robots/[slug] と同じく…」と明記し、`guides/[slug]` 側のコメントは「robots/[slug]のRobotStickyAside・use-cases/[slug]と同じ」と明記している。つまり実装者は重複を認識した上で共通化せずコピーした状態であり、これは `ai/rules/10-workflow.md` が避けるべきとする「似た実装があるのに、ページや機能ごとに独自実装を増やす」に当たる。4箇所の定義リストより重複の絶対量が大きく、共通化の意図がコメントで裏付けられているためリスクも低い。最優先で着手する。

このサイドバー構成の中には、さらに小さな重複が入れ子になっている。`use-cases/[slug]`（関連ガイド・関連記事の2ループ）と `guides/[slug]`（関連用途の1ループ）が、それぞれ独自に `<nav>{items.map(...)}<Link className="block text-xs text-foreground/80 hover:text-foreground py-2 border-b border-border last:border-b-0">` という同一markupのリンク一覧を実装している（厳密には use-cases 側の片方のループだけ `last:border-b-0` が欠落しており、統一時に揃える）。これは既存の `components/RelatedLinkList.tsx` が担うべき責務だが、サイドバー内では再利用されていない（メインコンテンツの「関連情報」セクションでは正しく `RelatedLinkList` を使っている）。`RelatedLinkList` はタイトルや説明文付きの装飾を持つため、サイドバー向けには説明文なしの簡易バリアントが必要になる。

なお `reports/[slug]` の `ReportSidebarContent`（情報提供・関連ツール）は A の対象外とする。これは見出しが `text-xs font-semibold uppercase tracking-wide`（後述 C と同じ系統）で、A の3箇所が使う `text-[10px] uppercase tracking-widest` 系とは別の見出しシステムだからである。サイト内の見出しは「サイドバーの 10px tracking-widest 系（A）」と「記事系の xs font-semibold 系（C・`RelatedLinkList`・`ArticleToc`）」の2系統に分かれており、reports サイドバーは後者に属する。これを `SidebarSection` に巻き込むと見出しの見た目が変わるため、A では触らない。

### B. カード・比較パネル内の簡易スペックリスト（中優先）

`components/ComparisonRobotPanel.tsx`（162〜180行、基本スペック・追加スペックの2箇所）が `<dl className="space-y-2 text-xs">` と `flex justify-between` の `dt`/`dd` を使う簡易な左右ラベル・値リストを実装しており、`components/RobotCard.tsx`（172〜176行）も `<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">` という別形状の簡易スペックグリッドを持つ。これらは互いにほぼ同じ目的（カード/パネル内の省スペックなスペック表示）だが実装が異なる。Aの「サイト共通定義リスト」とは別の、軽量な「インラインスペックリスト」という第2のバリアントとして切り出す候補だが、重複量はAより小さい。加えて両者はレイアウトが本質的に異なる（`ComparisonRobotPanel` は `flex justify-between` の左右配置、`RobotCard` は `grid-cols-2` の2列）。これを無理に1コンポーネントへ寄せると、`ai/rules/10-workflow.md` の KISS（実際の重複や複雑性を減らす抽象化だけを追加する）に反する過剰抽象化になりうる。したがって B は、統合が実際に複雑性を減らすと確認できない限り見送りを既定とする。

### C. セクション見出しclassの重複（低優先）

`text-xs font-semibold uppercase tracking-wide text-muted-foreground` という見出しclass文字列が、`src/app/reports/[slug]/page.tsx`（`ReportSidebarContent` 内2箇所、タグ見出し、`SourceList` への `titleClassName` 引き渡し）と `src/app/guides/[slug]/page.tsx`（`SourceList` への `titleClassName` 引き渡し）に計4回以上直書きされている。構造的なJSXの重複ではなく単一のclass文字列の重複なので、優先度は最も低い。

### D. 既存の共通化が機能している箇所（対応不要）

`Breadcrumbs`、`TagChip`、`ArticleToc`、`ArticleRelatedSidebar`、`SourceList`、`CandidateRobotList` は複数ページで正しく再利用されており、追加の対応は不要。これらは今回のリファクタリングの設計参考にもなる（特に `ArticleRelatedSidebar` の「sticky表示の制御」と「内容」を分離する考え方は、Aのサイドバー共通化でも踏襲できる）。

### E. 元々保留していた4箇所の定義リスト（再評価）

`robots/[slug]`・`use-cases/[slug]` の定義リスト2箇所は、Aのサイドバー共通化と同時に扱うのが合理的である。両方とも `sm:grid-cols-[8rem_1fr]` で gutter は揃っている。ただし両者とも dt にアイコンを持つ（robots は `decisionRows` の `LabelIcon`、use-cases は `CheckCircle2`/`AlertCircle`）ため、差分は「アイコンの有無」ではなく「どのアイコンを使うか・dd の font-weight」である。前回の静的 `DefinitionList` と同様、dd の装飾とアイコン種別をページごとに差分確認してから variant に寄せれば、共通化の難易度は前回想定したよりも低い。`ManufacturerDetailHero`（`7rem` gutter）と `ManufacturerFactSheet`（`8rem` gutter・dd太字・border-b方式）は依然 gutter と装飾が異なるため、A・Eの実装が安定してから着手する別単位とする。

## 実行方針

優先度はA → B → C → ManufacturerDetailHero/FactSheet の順とする。Aは構造重複が最も大きく、リスクが最も低いため最初に着手する。BとCは独立した小さい変更なので、Aの後にどちらからでも着手できる。ManufacturerDetailHero/FactSheetは、gutter・装飾の差異を吸収するprops設計が必要で見た目の検証コストが最も高いため最後に置く。

Aの実装では、まず `RobotStickyAside.tsx` の構造を正本として、ラッパー・見出しラベル・区切り線を持つ小さな共通コンポーネント（例: `SidebarSection`）を切り出す。中身（スペック表、`CandidateRobotList`、関連リンク、CTA）はpage側に残し、`SidebarSection` はレイアウトの外枠のみを担う。続けて `use-cases/[slug]` と `guides/[slug]` のサイドバーをこの共通コンポーネントに置き換える。`SidebarSection` は sticky 化の breakpoint（`sticky` か `lg:sticky` か）を prop で吸収する。関連リンクの簡易ループは `RelatedLinkList` の compact variant（説明文なし・区切り線のみ）を追加して置き換える。なお相談CTAブロック（`use-cases/[slug]` と `guides/[slug]` の `bg-primary` ボタン＋説明文）は uiText キー以外が完全一致しており、外枠だけを共通化しても重複が残る。A の中で `ConsultationCta` として小さく切り出すか、page 側に残して許容するかを実装時に判断する。

`robots/[slug]` と `use-cases/[slug]` の定義リスト2箇所は、既存の `components/DefinitionList.tsx` に `detail-decision` variant（`sm:grid-cols-[8rem_1fr]`、アイコン対応、太字dd）を追加し、両ページをそこに合わせる。

## 検証方針

- `npm run build` と `npx tsc --noEmit` を各フェーズ後に実行する。
- レイアウトに触れるため、`/robots/[任意のslug]`・`/use-cases/[任意のslug]`・`/guides/[任意のslug]` を実際にブラウザまたは `curl` でのHTML構造比較で確認する。文言・class名が変更前後で意図通りに一致するかをチェックする。
- 360px・768px・1280px・1440px以上の主要viewportでサイドバーの折り返し・スクロール挙動を確認する。
- ManufacturerDetailHero/FactSheetに着手する場合は、変更前後で `sm:grid-cols-[7rem...]` と `sm:grid-cols-[8rem...]` の見た目が保たれているかを重点的に確認する。

## 完了条件

- A（サイドバー共通化）が実装され、`RobotStickyAside`・`use-cases/[slug]`・`guides/[slug]` のサイドバー外枠が同一コンポーネントを参照している。
- 関連リンクの簡易ループが `RelatedLinkList` のcompact variantに置き換わっている。
- `robots/[slug]`・`use-cases/[slug]` の定義リストが `DefinitionList` の新variantに統合されている。
- B・Cの対応方針が決定している（実施または見送りの判断が記録されている。特に B は KISS の観点から見送りを既定とし、統合する場合はその根拠を残す）。
- 相談CTAブロックの重複について、`ConsultationCta` 切り出しか page 側での許容かの判断が記録されている。
- ManufacturerDetailHero/FactSheetの統合方針が決定している → 実施済み（重複データの削除、上記「追記」参照）。
- この計画が `docs/planning/README.md` に active/unimplemented plan として登録されている → 完了したため archive へ移動する。
