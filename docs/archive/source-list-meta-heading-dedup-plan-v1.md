# SourceList Meta Heading Dedup Plan v1

Status: completed
Last updated: 2026-06-25

## 実装結果

`components/SourceList.tsx` に `titleVariant?: 'default' | 'meta'` を追加し、`titleClassName` 未指定時のみ適用する優先順位で実装した。`src/app/reports/[slug]/page.tsx:308`・`src/app/guides/[slug]/page.tsx:178` を `titleVariant="meta"` に置き換え。`npx tsc --noEmit`・`npm run build` 通過。`/reports/bmw-figure-deployment`・`/guides/decision-variables` の出典見出し `<h2>` のclass属性が変更前と一致することを確認済み（commit `3469574`）。完了条件をすべて満たしたため archive へ移動する。

この文書は、`component-duplication-unification-plan-v1.md`（archive済み）で「C: 見出しclass文字列の重複、低優先」として一括で見送った項目を、実装前に自己調査し直した結果見つかった、本物の重複1件だけを対象にする小さな修正計画である。完了後は archive へ移動する。

## 背景

`component-duplication-unification-plan-v1.md` の C は、`text-xs font-semibold uppercase tracking-wide text-muted-foreground` という見出しclass文字列が複数箇所にあることを指して「単一class文字列の重複であり優先度最低」とだけ記録し、見送っていた。

その後、Manufacturer の Hero/FactSheet で「見た目の差」と書いていたものが実際はデータ重複だった経緯があったため、Cも同じように内容を精査せず見送っていないかを自己調査した。結果、Cとして一括りにしていたものは実際には3種類に分かれており、本物の重複は1種類だけだった。

## 調査結果

このclass文字列の出現箇所をコンポーネント単位で洗い出すと、5箇所が見つかる。

1. `src/app/reports/[slug]/page.tsx:59`、`:74` — `ReportSidebarContent` 内の `<h3>` 2箇所（"情報提供・取材相談"、"関連ツール"）。このサイドバーは `col-span-12 lg:col-start-10 lg:col-span-3` の本物の右サイドバー（`ArticleRelatedSidebar` でラップ、モバイル用とデスクトップ用sticky用に2回呼ばれているが、これはレスポンシブ対応として意図的な実装）。
2. `src/app/reports/[slug]/page.tsx:294` — 本文側「タグ」ラベル（`<p>`、1箇所のみ）。

1と2は同じclassを使っているが、これは reports ページが本文ラベルとサイドバー見出しの両方を `text-xs font-semibold` 系で統一しているためであり、サイドバーだけが手抜きで違う書き方になっているわけではない。これを他ページのサイドバー共通コンポーネント（`SidebarBlock`、`text-[10px] tracking-widest` 系）に合わせて変更すると、他ページのサイドバーとは揃うが reports 自身の本文ラベルとはズレるという新しい不整合を生む。トレードオフを比較すると現状維持の方が妥当であり、見送りの判断は正しい。2はそもそも1箇所しかなく、ズレて壊れる相手がいないため重複に当たらない。

3. `src/app/reports/[slug]/page.tsx:308` — `SourceList` への `titleClassName="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"`。
4. `src/app/guides/[slug]/page.tsx:178` — `SourceList` への同一の `titleClassName` override。

3と4は、`reports/[slug]` と `guides/[slug]` どちらも本文カラム（`col-span-7`側、サイドバーではない）で、`SourceList`（`components/SourceList.tsx`）の `titleClassName` という非デフォルト値を、2ファイルが独立して一字一句同じ文字列で指定している。`SourceList` 自身のデフォルトは別の値（`text-lg font-semibold text-foreground mb-4`）なので、これは「デフォルトの再指定」ではなく本物の重複である。一方が変われば他方とズレる構造であり、3・4だけが実際に直す価値のある対象になる。

5. `components/ArticleToc.tsx:26`、`components/RelatedLinkList.tsx:41` — 共有コンポーネント内部での使用であり、これは重複ではなく正しい再利用。

## 修正方針

`components/SourceList.tsx` に、3・4が指定している値をそのまま表す選択肢を追加する。プロパティ名は `variant` ではなく `titleVariant?: 'default' | 'meta'` にする。`variant` という名前は `RelatedLinkList` で「見出し・説明文・カード装飾・構造ごと全部省いて `<nav>` のみを返す」という、コンテナそのものを切り替える意味で既に使われている（`components/RelatedLinkList.tsx`、`compact` 時は `<section>` も `<Heading>` も生成しない）。`SourceList` 側の今回の変更は見出しのclassだけを切り替えるもので、コンテナ（カード風の `border bg-card p-6` 等）は変えない。同じ `variant` という名前を見出しだけの切り替えに使うと、将来 `<SourceList variant="compact" />` と書いた人が `RelatedLinkList` と同じ「構造が簡略化される」挙動を期待してしまう。`titleVariant` のように見出しのみに作用することが名前から分かる形にする。

`titleVariant='meta'` のときは、現在のoverride文字列（`mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground`）をデフォルトとして適用する。`titleVariant` 省略時（`'default'`）は現状のデフォルト（`text-lg font-semibold text-foreground mb-4`）を維持し、見た目を変えない。コンテナの `className` prop はこの変更と無関係で、従来通り個別に指定する。

`titleClassName` prop自体は残す（個別の上書きが今後必要になる可能性があるため、削除はスコープ外）。優先順位は次の通り：`titleClassName` が明示的に渡されていれば常にそれを使う。`titleClassName` が省略されているときだけ `titleVariant`（`'default'` か `'meta'`）に応じた既定classを選ぶ。

## 触るファイル

- `components/SourceList.tsx`：`titleVariant` prop追加。`titleClassName` 省略時のデフォルト解決ロジックに `titleVariant` を反映
- `src/app/reports/[slug]/page.tsx:308`：`titleClassName="..."` を `titleVariant="meta"` に置き換え
- `src/app/guides/[slug]/page.tsx:178`：同上

触らないファイル：`ReportSidebarContent` のサイドバー見出し（上記1）、reports本文の「タグ」ラベル（上記2）、`ArticleToc`/`RelatedLinkList`（上記5）。

## 検証方針

- `npx tsc --noEmit`
- `npm run build`
- 確認対象は「`SourceList` が出力する出典見出し（`<h2>`）のclassが、変更前の文字列（`mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground`）と一致すること」に絞る。任意のslugではなく、データに実在する以下のページで確認する：
  - `/reports/bmw-figure-deployment`（`data/articles.ts` に実在、`sources` あり）
  - `/guides/decision-variables`（`data/guides.ts` に実在、`sources` あり）
  - `curl -s http://localhost:3000/reports/bmw-figure-deployment | grep -o '<h2[^>]*>出典</h2>'` のように、出典見出しの`<h2>`タグのclass属性を変更前後で取得して文字列比較する

## 完了条件

- `SourceList` が `titleVariant="meta"` 相当の選択肢を持ち、`titleClassName` 未指定時のみそれが適用される（`titleClassName` 指定時はそちらが優先される）優先順位がコード上も成立している。
- `reports/[slug]`・`guides/[slug]` の両方が `titleVariant="meta"` を使い、生のclass文字列を直書きしていない。
- 上記2ページの出典見出しのclass属性が変更前後で一致することを確認済み。
- この計画が `docs/planning/README.md` に active/unimplemented plan として登録されている。
