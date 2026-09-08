---
status: reference
updated: 2026-09-08
---

# MCP運用試行ログ

このファイルは正式なdoc governance shelf（`ai/rules/80-doc-governance.md`）の`decisions`/`plans`/`archive`のどれにも厳密には該当しない、**運用中の作業ログ**。MCP経由でのcollection編集を実際に試してみて、どこがうまくいき、どこで詰まったかをその都度ここに書き足していく。

一区切りついたら（各collectionで安定して運用できると分かったら）、得られた知見を`.codex/content-workflow.md`や`ai/rules/21-data-maintenance-workflow.md`側の正式なルールへ反映し、このログ自体は`docs/archive/`へ移すか役目を終える。

**試す前に**[`docs/reference/payload-field-usage-audit-2026-09-08.md`](./payload-field-usage-audit-2026-09-08.md)を読むこと。「入れたのに公開ページに反映されない」fieldの多くは、MCPの不具合ではなくそもそも表示先が実装されていない（①分類）。特に`robot-series`/`distributors`はcollection全体がこれに該当する。

## 書き方

1件の試行につき、以下の形式で追記する。

```
### YYYY-MM-DD collection名 — 短い概要

- **やったこと**: (例: CSVからロボット3件をcreateRobotsでdraft作成)
- **結果**: 成功 / 一部成功 / 失敗
- **詰まった点**: (無ければ「なし」)
- **対応**: (詰まった点をどう解決したか、まだ未解決なら「未解決」)
- **次回への申し送り**: (無ければ省略可)
```

---

## manufacturers

（未実施）

## distributors

（未実施）

## robot-series

（未実施 — 補足: このcollectionは現状フロントエンドの閲覧経路が無い設計であることが別調査で判明済み。データを入れても公開ページには表示されない点に注意）

## robots

（未実施）

## use-cases

（未実施）

## deployments

（未実施）

## articles

（未実施）

## article-placements（MCP対象外・参考）

このcollectionはMCPから編集不可（`lib/payload/mcp.ts`の設計）。記事のホームページ掲載枠設定は必ずAdmin UI経由になるため、ここに試行ログは発生しない想定。
