# SourceList Meta Heading Dedup Plan v1

Status: active/unimplemented plan
Last updated: 2026-06-24

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

`components/SourceList.tsx` に、3・4が指定している値をそのまま表す選択肢を追加する。具体的には `titleClassName` の代わりに `variant?: 'section' | 'compact'` を新設し、`compact` のときに現在のoverride文字列をデフォルトとして適用する。既存の `variant` 省略時（`'section'`）は現状のデフォルト（`text-lg font-semibold text-foreground mb-4`）を維持し、見た目を変えない。

`titleClassName` prop自体は残してよい（個別の上書きが今後必要になる可能性があるため、削除はスコープ外）。

## 触るファイル

- `components/SourceList.tsx`：`variant` prop追加
- `src/app/reports/[slug]/page.tsx:308`：`titleClassName="..."` を `variant="compact"` に置き換え
- `src/app/guides/[slug]/page.tsx:178`：同上

触らないファイル：`ReportSidebarContent` のサイドバー見出し（上記1）、reports本文の「タグ」ラベル（上記2）、`ArticleToc`/`RelatedLinkList`（上記5）。

## 検証方針

- `npx tsc --noEmit`
- `npm run build`
- `/reports/[任意のslug]` と `/guides/[任意のslug]` の出典セクションを変更前後で見た目が変わらないことを確認（curl でのclass確認、または表示確認）

## 完了条件

- `SourceList` が `variant="compact"` 相当の選択肢を持っている。
- `reports/[slug]`・`guides/[slug]` の両方が `variant="compact"` を使い、生のclass文字列を直書きしていない。
- 見た目の変化がないことを確認済み。
- この計画が `docs/planning/README.md` に active/unimplemented plan として登録されている。
