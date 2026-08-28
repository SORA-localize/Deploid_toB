# Task 9 Production read-only確認

ProductionのDB identityとenvironment markerを、秘密値をチャットへ出さずに確認する手順。
この手順はDBのSELECTだけを実行し、migration/import/export/update/deleteは行わない。

```bash
vercel env pull /tmp/deploid-production.env production
node scripts/task9-production-readonly-check.mjs /tmp/deploid-production.env /tmp/task9-production-readonly-result.json
```

チャットへ共有するのは`/tmp/task9-production-readonly-result.json`のうち、次の項目だけ。

- `checkedAt`
- `database.identity.database`（DB名のみ）
- `database.identity.host`（必要ならホスト名の一部をマスク）
- `database.environmentMarker`
- `environmentVariables`の`present`/`missing`
- `database.publicTables`の件数と主要table名

共有禁止：`DATABASE_URL`、secret、token、KMS ARN全体、envファイル全文。
