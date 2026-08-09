---
status: reference
updated: 2026-08-09
---

# コンテンツ基盤移行 — 外部リソース・承認ログ v1

Payload CMS + managed Postgres 移行（`../decisions/content-platform-and-database-architecture-v2.md`、
`../plans/content-platform-migration-plan-v1.md`）で発生する、コードレビューでは残らない2種類の記録を持つ。

1. **Decision Log** — 上位正本ドキュメント（`docs/decisions/`）に対する人間承認の記録。
   Task 0.5 の Step 2、および以降のタスクで上位正本を変更するたびにここへ行を追加する。
2. **External Resources** — Supabase / Vercel Blob などのプロジェクト、環境、資格情報の所在。
   Task 0（外部resource払い出し）が値を追記する。本タスク（Task 0.5）時点では未着手のため空欄。

このファイルは `docs/reference/` に置くが、Decision Log は移行完了まで継続更新するアクティブな記録である。
`docs/decisions/content-platform-and-database-architecture-v2.md` が本書を名指しで参照する間は
`docs/reference/` に留める（`ai/rules/80-doc-governance.md` の docs/reference 基準）。

---

## Decision Log

**運用ルール**: 口頭確認だけ、または未承認の文書差分ではgate通過にしない。
architecture owner と content owner の両方が承認するまで、対応する `docs/decisions/*.md` の変更は
「承認待ち」として扱う。承認が入るまで `Approver` / `Commit SHA` / `Approval Timestamp` は
`PENDING` のままにする — 埋めるのは実際に承認した人間、またはその承認を記録するために動く
エージェントであり、承認そのものを代行してはならない。

| Decision | Target doc / section | Approver | Commit SHA | Approval Timestamp |
|---|---|---|---|---|
| URL waiver scope（①は slug/previousSlugs/公開URLをparity維持、waiverはSeries cutoverの承認済み変換のみ） | `content-platform-and-database-architecture-v2.md` §10 / `data-architecture-redesign-v1.md` §0 | Hori98 | 9a41fc5 | 2026-08-09 |
| Content role enum を4値（`content-reader` / `content-draft-writer` / `content-publisher` / `platform-admin`）に確定 | `content-platform-and-database-architecture-v2.md` §7.3 | Hori98 | 9a41fc5 | 2026-08-09 |
| Robot の公開ゲート必須項目から `buyerReadiness` を削除（UseCase側は維持） | `data-architecture-redesign-v1.md` §11 / `data-maintenance-checklist-v1.md` §F | Hori98 | 9a41fc5 | 2026-08-09 |

未承認の間、①の Task 1 以降には進まない（`../.superpowers/sdd/content-platform-migration-plan-v1/task-0.5-brief.md` 完了条件）。

---

## External Resources

Task 0 が着手時に本セクションへ追記する。現時点（Task 0.5 完了時点）では未着手のため空欄。

| Resource | Provider | Environment | Owner | Notes |
|---|---|---|---|---|
| (未定) | (未定) | (未定) | (未定) | (未定) |
