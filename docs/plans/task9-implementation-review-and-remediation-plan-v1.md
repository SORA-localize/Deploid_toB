---
title: Task 1-9 実装監査・是正計画
status: in-progress
updated: 2026-08-26
scope: content-platform-migration
---

# Task 1-9 実装監査・是正計画

## 1. 目的と結論

Task 1〜9 の実装について、コード、設定、履歴、CI、テスト、データ移行・復元経路を対象に、実装レビューと安全性監査を行った。本書は監査結果、対象ブランチで実施した是正、検証結果、残る運用確認事項を記録する。

対象ブランチでは上記のCritical/High是正を実装し、throwaway DB・build・CI対象E2E・integrationで検証した。ただし、Production/Previewの同一性、GitHub required checks/branch protection、実Blob/KMS、全UI向けE2Eの合否は外部環境または別fixtureが必要なため、本番カットオーバーはまだ承認しない。

## 2. 監査範囲と前提

- 監査起点ブランチ: `fix-ci-e2e-admin-seed`
- 実施ブランチ: `remediation/task9-safety-gates`
- 実施コミット: `46e10a7`（起点 `e7427f7` の是正コミットを含む）
- 監査対象: Payload 設定、DB safety、migration/import/restore、監査アップロード、認証・公開、draft/revalidation/cache、Blob/KMS、CI/CD、ドキュメント
- Production/Preview/Vercel/外部 DB/Blob への接続・書き込みは行っていない
- `.env.local` の内容は読み取らず、明示的にsourceもしなかった。Next.js buildはファイルの存在を自動検出するため、buildログには `.env.local` と表示されたが、検証用の `DATABASE_URL`/`PAYLOAD_SECRET` をプロセス環境で明示した。秘密値・接続文字列・トークンは本書に記載しない
- 承認済みの一時 PostgreSQL（127.0.0.1:55440、throwaway DB）で migration/status/CI seed、restore enforcement、integration、build、CI対象E2Eを実行した。Production/Preview DB では実行していない
- GitHub の branch protection、ruleset、required checks は API接続失敗（`api.github.com`へ接続不可）のため未確認。認証状態自体は `gh auth status` で有効を確認した

## 3. 参照したルール・判断基準

以下を入口・ワークフロー・データ・UI・権利・編集方針の判断基準として確認した。

- `ai/rules/00-index.md`
- `ai/rules/10-workflow.md`
- `ai/rules/20-data.md`
- `ai/rules/21-data-maintenance-workflow.md`
- `ai/rules/22-article-sourcing.md`
- `ai/rules/30-ui-design.md`
- `ai/rules/40-content-rights.md`
- `docs/decisions/ai_fullstack_development_guardrails_v1.md`
- `docs/decisions/data-maintenance-checklist-v1.md`
- `docs/decisions/editorial_style_guide_v1.md`
- `docs/decisions/robot-factcheck-research-prompt-2026-07-01.md`
- `docs/decisions/design_system_v1.md`
- `docs/decisions/ui_architecture_and_development_policy_v1.md`
- `docs/decisions/copyright_and_media_rights_policy_v1.md`

特に、変更前の現状確認、検証可能な完了報告、G1〜G11 データゲート、権利・出典の記録、Production 未確認時の明示を採用した。

## 4. 監査結果

### 4.1 Critical / High（Task 9 をブロック）

| ID | 重大度 | 所見 | 根拠 |
|---|---|---|---|
| H-01 | Critical | `seed:ci-site-settings` は `CI=true` しか確認せず、DB URL の throwaway 性、環境 marker、Preview/Production 禁止を検証しない。誤設定時に admin 作成と fixture 上書きが可能。 | `scripts/seed-ci-site-settings.mts` |
| H-02 | High | migration CLI が中央 DB safety ガードを経由せず、任意の `DATABASE_URL` に migration/status/down を実行できる。`down` は破壊的。 | `scripts/run-payload-migration-cli.mts` |
| H-03 | High | `stamp-environment` は `DEPLOYMENT_ENV` と引数の一致のみで、接続先の host/name/resource identity を検証しない。誤 DB を Production/Preview として stamp できる。 | `scripts/stamp-environment.mts` |
| H-04 | High | content restore は media・複数 collection・参照解決・SiteSettings を順次書き込むが、DB トランザクションがない。途中失敗時に DB/Blob が部分更新される。 | `scripts/import-content-to-payload.mts` |
| H-05 | High | 監査アップロードは Blob 書き込み後の DB 更新失敗、完了 marker 書き込み後の session 更新失敗で孤児 Blob/marker を残し得る。並行 complete、期限切れ session、cleanup 失敗にも回復保証がない。 | `lib/payload/auditUpload*`, `src/app/api/admin/audit-upload/*` |
| H-06 | High | `publishApprovedVersion` は commit 前に afterChange/revalidation を発生させる可能性があり、別リクエストが未 commit 状態をキャッシュする。公開後の整合性を保証できない。 | `lib/payload/publishApprovedVersion.ts`, `lib/payload/revalidationHook.ts` |
| H-07 | High | 最終 admin の削除・降格保護が count 判定のみで、advisory lock/transaction による同時実行保護がない。並行操作で最後の admin が失われ得る。 | `collections/Admins.ts` |
| H-08 | High | `content:import` は retired だが、`--bootstrap-admin` 経路が先に admin を作成してから cutover snapshot 取得で失敗し得る。 | `scripts/import-content-to-payload.mts` |

### 4.2 Medium（是正必須、または運用開始条件に含める）

| ID | 所見 |
|---|---|
| M-01 | `source-links.yml` が削除済みの `check:source-links` を呼ぶため、定期監視が常に失敗する。 |
| M-02 | `docs/README.md`、`ai/rules/21-data-maintenance-workflow.md`、`ai/rules/22-article-sourcing.md`、`README.md` に旧 `data/*.ts` を SoT とする記述が残り、現行 Payload 運用と矛盾する。 |
| M-03 | `CONTENT_SOURCE` と rollback を示す古いコメント・切替痕跡が残る。Task 9 の旧経路撤去が未完了。 |
| M-04 | revalidation と draft enable/revalidate endpoint に本文サイズ上限・レート制限がなく、監査アップロード complete も JSON 本文上限がない。 |
| M-05 | audit upload session の `requestId` に一意制約がなく、再送で不要な session/CPU/DB 使用を増やせる。期限切れ session の自動掃除もない。 |
| M-06 | DB URL の classifier が protocol/port/pooler mode を十分に区別しない。migration の direct/session pooler と runtime transaction pooler の運用ミスを検知できない。 |
| M-07 | `stableId` immutable の方針に対する field-level guard がなく、変更時に route registry の旧行が残る可能性がある。 |
| M-08 | SiteSettings の直接 publish が approval/version 経路と同じ保証を持たない可能性がある。要件確認後に判定する。 |

### 4.3 良好な点

- snapshot schema、署名 envelope、manifest/artifact hash、store ID、environment marker、completion marker、provenance、baseline replay による復元前後検証がある。
- audit upload の manifest key allowlist、session TTL、署名検証、store/environment 照合、private Blob、path traversal 防止が実装されている。
- publish gate、publisher role、approved version、advisory document lock、transaction を組み合わせた公開経路がある。
- preview token は HMAC、nonce の atomic consume、短い token TTL、role 再確認、redirect allowlist を備える。
- 静的境界検査、typecheck、lint、dead-code、docs 検査は通過した。関連非 DB テストは 161 pass / 12 skip（実 KMS 条件付きテスト）だった。throwaway DB では migration 9件、status 全件 Yes、CI seed、restore enforcement 44 pass / 13 skip を確認した。
- 依存監査では Critical/High は 0 件だった（Moderate 6、Low 1）。

## 5. 是正計画と実施結果

### Phase A: DB 書き込み安全ゲート（最優先）

実施順: `lib/content/databaseSafety.ts` の共通 API 整理 → `scripts/run-payload-migration-cli.mts` → `scripts/stamp-environment.mts` → `scripts/seed-ci-site-settings.mts` → retired import の副作用除去。

- すべての CLI を中央 safety API 経由にし、host/name、throwaway 判定、expected environment、resource identity、明示的な `ALLOW_*` 承認を検証する。
- CI seed は CI 環境でも throwaway DB 以外を拒否し、marker を実 DB から取得して fixture 書き込み前に照合する。
- retired import は bootstrap-admin を含めて副作用なく即時終了する。
- migration `down` は別の明示承認と dry-run を要求する。

影響: 誤 DB 書き込みを拒否するため、既存の手動運用や CI の URL 設定が不備なら失敗する。ロールバックは変更ファイル単位の revert とし、DB を逆 migration で戻さない。

### Phase B: restore と audit upload の整合性

実施順: restore の transaction/compensation 設計 → audit upload の状態機械・idempotency → cleanup/expiry job → route body limits/rate limits。

- DB 変更を可能な範囲で単一 transaction にまとめ、Blob は staged object と completion marker を使う。途中失敗時の再実行、補償削除、孤児検出を仕様化する。
- upload object/complete を idempotent にし、session の状態遷移を DB 条件更新で直列化する。`requestId` の再送を抑止する。
- cleanup は uploaded=false の Blob、completion marker、期限切れ session を対象にし、失敗を隠さず再試行可能な結果にする。
- endpoint の request body 上限、rate limit、監査ログの request ID 方針を追加する。

影響: 既存の restore/export の再実行時挙動が変わる。旧 partial session の移行・掃除手順を別途用意する。ロールバックは新しい状態機械を feature flag で停止できるようにし、既存データを自動削除しない。

### Phase C: publish/admin/cache の競合制御

実施順: publish commit と revalidation の順序修正 → admin last-member guard の lock/transaction 化 → `stableId` guard → SiteSettings approval 要件の確定。

- DB commit 成功後に revalidation を発火する、または outbox/retry で commit と通知を分離する。
- admin の削除・降格を advisory lock + transaction + 再カウントで保護する。
- `stableId` の変更を拒否し、route registry の旧 slug 取り扱いをテストで固定する。
- SiteSettings を approval/version 経路に統一するか、直接 publish を要件として明文化する。

### Phase D: CI/CD・ドキュメント整合性

実施順: `source-links.yml` 修正 → 現行 Payload 運用への docs 更新 → PR required checks/E2E 方針の確認 → Node/package manager 固定。

- 削除済み script を呼ぶ workflow を修正または削除する。
- 旧 `data/*.ts` 編集手順を Payload/MCP/承認・出典・権利記録の現行手順へ置換する。
- PR で必須にする静的検査、throwaway DB migration/seed、integration/E2E の範囲を repository settings と照合する。
- GitHub 認証が回復した後に branch protection/ruleset/required checks を読み取り専用で記録する。

## 6. 変更しない範囲

承認が別途ない限り、以下は変更しない。

- Production/Preview の環境変数、DB、Blob、Vercel project settings
- migration の実行、migration down、restore、seed、admin 作成・削除
- GitHub branch protection、required checks、workflow の本番相当 secrets
- KMS、OIDC、Blob の実 credential または秘密値
- UI/デザイン実装（本計画では運用ドキュメント整合性のみ扱う）

## 7. 承認事項と実施範囲

ユーザー指示により、次の範囲を対象ブランチで実施した。

1. Phase A〜Dを対象ブランチで実施
2. ローカル一時PostgreSQLでmigration/seed/restore/integration/build/E2Eを検証
3. CI workflowは外部設定を変更せず、既存定義を読み取り・対象E2Eを再現
4. Preview/Production/GitHub settingsへの接続・書き込みは実施しない
5. 既存Productionのpartial session/Blob掃除は実施しない

## 8. 検証マトリクス

| 領域 | 必須検証 | 完了条件 |
|---|---|---|
| 静的品質 | typecheck, lint, boundary checks, dead-code, docs, diff check | 全 pass、既知 warning を記録 |
| DB safety | throwaway DB で migration/status/seed/stamp/restore、誤 URL 拒否テスト | throwaway 以外を拒否し、marker/environment が一致 |
| restore | 途中失敗、再実行、孤児 Blob、parity mismatch | 部分更新を検知・回復できる |
| auth/publish | publish gate、admin concurrency、MCP 権限 | unauthorized write/delete と last-admin loss がない |
| audit upload | session/object/complete/cleanup の再送・並行・期限切れ | idempotent、孤児検出、body/rate limit が有効 |
| CI | PR workflow、main E2E、source links、required checks | 必須ゲートと non-blocking の意図が一致 |
| 外部環境 | Preview/Production の read-only 接続、Vercel/GitHub設定 | 対象・日時・結果を別ログに記録。未確認なら未確認と報告 |

## 9. 再監査とカットオーバー判定

是正後は、変更差分を再読し、上記 ID を一件ずつ再判定する。Critical/High が残る、throwaway DB での検証ができない、Preview/Production の対象同一性が確認できない、または required checks が未確認の場合は「実装済み」までに留め、「本番安全」「カットオーバー承認済み」とは報告しない。

本書は対象ブランチの実装・検証結果を含む。Production/Previewへのデプロイや外部設定変更を完了したことを意味しない。

## 10. 実装進捗

2026-08-26 時点で `remediation/task9-safety-gates` に Phase A〜D の是正を反映した。

- `databaseSafety` に CI throwaway DB 専用 assertion を追加
- migration CLI と environment stamp を共通 writable DB gate 経由に変更
- retired `content:import` の admin bootstrap 前副作用を除去
- complete endpoint に request body 上限を追加
- Blob書き込み後のDB更新失敗時に補償削除し、cleanup対象を未記録Blob・completion markerまで拡張
- `restoreContentSnapshot` のDB write経路をtransactionで包み、失敗時rollback・成功時commitを実装
- publish approved経路のrevalidationをDB commit後へ遅延
- admin削除・最後のplatform-admin降格判定にtransaction advisory lockを追加
- 削除済み script を呼ぶ `source-links.yml` を削除
- typecheck、lint、関連非DBテストを再実行済み
- CI=true・fixture入りthrowaway DBで `npm run build` 成功
- CI対象の `cache-revalidation.spec.ts` と `draft-mode-wiring.spec.ts` は4/4 pass（workers=1）
- `npm run test:integration` は12/12 pass、全Vitestは504 pass / 37 skip
- 全UI E2E 94本は61 pass / 32 fail / 1 did not run。失敗は最小Payload fixtureと既存UI英語fixture・visual baselineの前提不一致（または既存UI挙動）で、CIのcontent-e2e対象外。残課題として記録する

DB側restore transaction、Blob/DB更新失敗時の補償、publish revalidationのcommit順序、admin同時実行保護は実装済み。throwaway DBでmigration/status/seed/restore enforcement、integration、production build、CI対象E2Eを検証済み。BlobとDBを跨ぐ完全な原子性、全UI E2Eの既存baseline整合、Preview/Production/GitHub required checksの外部検証は未完了であり、Task 9の本番承認条件はまだ満たしていない。
