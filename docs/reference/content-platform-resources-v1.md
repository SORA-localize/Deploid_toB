---
status: reference
updated: 2026-08-11
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

Task 0（`../../.superpowers/sdd/content-platform-migration-plan-v1/task-0-brief.md`）が確定した値。
`content-platform-and-database-architecture-v2.md` §11 の未確定5件＋本移行計画で追加した
snapshot署名／audit outbox暗号化2件、計7件をここで閉じる。値はすべて人間が外部で払い出し・
検証済みのものをそのまま転記している。実際の secret 値はここにも `.env.example` にも置かない。

### 1. Postgres（Supabase）

Preview / Production を別 Supabase project として分離。

| 環境 | Project ref | Region | Postgres version | `inet_server_addr()` | `public` schema table数 | storage bucket数 |
|---|---|---|---|---|---|---|
| Preview | `kstdgatquulrzzrpxcue` | ap-northeast-1 | 17.6 | `2406:da14:1d4f:7400:4fe3:c272:c314:6a82` | 0（検証時点） | 0（検証時点） |
| Production | `xtklkavbirorelqdyqjj` | ap-northeast-1 | 17.6 | `2406:da14:1772:ea02:d0a3:2a00:5574:5157` | 0（検証時点） | 0（検証時点） |

**分離の証明（Step 4）**: project ref と `host_addr` がそれぞれ2project間で異なることを分離の証拠とする。
`current_database()`（両方とも `postgres`）と `current_setting('cluster_name', true)`（両方とも汎用値）は
両projectで一致し、単体では分離を証明できないことをここに明記する（brief Step 4 が警告した通り）。

**接続モード**（用途で使い分け、どちらも Supabase 標準機能）:

| 用途 | モード | Port | Host | User |
|---|---|---|---|---|
| アプリ実行時 `DATABASE_URL`（Vercel serverless） | Transaction pooler（Supavisor） | 6543 | `aws-0-ap-northeast-1.pooler.supabase.com` | `postgres.<project-ref>` |
| 単発 / migration実行（`payload migrate`） | Direct connection | 5432 | `db.<project-ref>.supabase.co` | `postgres` |

理由: transaction-modeのpoolerはVercel serverless functionが作る多数の短命接続と相性が良い一方、
migration toolingはpooled transaction modeでは保証されないsession-levelの前提を必要とするため、
migration実行だけはdirect connectionを使う。

**Credential owner**: プロジェクトオーナー。各Supabase projectのpasswordはproject dashboard
（Settings → Database → reset password）から人間が個別に設定した値で、AIエージェントが生成・
閲覧したものではなく、git管理下には置かない。保管場所は人間が保持するローカルの未追跡ファイル
（コミットしない）という運用規約のみをここに記録する。

**Cost owner**: プロジェクトオーナー。

### 2. Object storage（public media / private audit・backup）

**Provider決定**: 4 store すべて Vercel Blob（public 用・private 用の両方）。brief Step 1 の初期値
「private Vercel Blob **または** S3互換」はあいまいな二択だったが、Vercel Blob には official な
"Private storage" access mode があり（Vercel公式ドキュメント `/docs/vercel-blob`）、private store は
server Function経由の認証済み読み取りのみで公開URLを持たないため、②が要求するprivate/audit-backup
要件を満たすことを確認した。Supabase Storage・S3互換代替は検討した上で採用しなかった
（意図的な集約判断。将来の読者がSupabase Storage bucketが未使用な理由を疑わないようここに明記する）。

全4 store は region `hnd1`（東京）、Vercel project `deploid-to-b`（org `soras-projects-bb254ff5`）配下。

| Store名 | 用途 | Access mode | 環境 | Store ID | Env var（Vercel project env、当該環境のみへscope） |
|---|---|---|---|---|---|
| `deploid-media-production` | public media | public | Production | `store_ApFuF52ILnyy2l7l` | `BLOB_READ_WRITE_TOKEN` |
| `deploid-media-preview` | public media | public | Preview | `store_We3iqHPm0yhFDnGU` | `BLOB_READ_WRITE_TOKEN` |
| `deploid-audit-production` | private audit / backup | private | Production | `store_vV3iFDaAGfIly5jb` | `PRODUCTION_AUDIT_BLOB_TOKEN_STORE_ID`, `PRODUCTION_AUDIT_BLOB_TOKEN_WEBHOOK_PUBLIC_KEY` |
| `deploid-audit-preview` | private audit / backup | private | Preview | `store_j323pw6GSN7Sm9xp` | `PREVIEW_AUDIT_BLOB_TOKEN_STORE_ID`, `PREVIEW_AUDIT_BLOB_TOKEN_WEBHOOK_PUBLIC_KEY` |

**credential modelが2種類混在している**（意図的、統一はTask 0の範囲外）:
- media 2 store: classic static token方式。`BLOB_READ_WRITE_TOKEN` は Vercel CLI の
  `blob create-store --environment` connect flowが環境ごとに自動注入する。このflowではstore名を
  カスタムできない。
- audit 2 store: OIDC-federated方式。`<PREFIX>_STORE_ID` + `<PREFIX>_WEBHOOK_PUBLIC_KEY` のペアのみで、
  長期static tokenはstoreに存在しない。Vercel Functionが自身の短命 `VERCEL_OIDC_TOKEN` をruntimeで
  Blob accessに交換する。dashboardの「Connect Project」flowでcustom Environment Variable Prefixを
  指定して接続した（CLIのcreate-store auto-connectはcustom prefixを設定できず、環境あたり2つ目の
  storeを繋ぐ際にdefault名が衝突したため）。
- どちらも有効な方式として現用。Task 3（Payload Media collectionのstorage adapter）は両方の
  patternを明示的に扱う必要がある。

**Delete / restore権限（実態）**: Vercel BlobにはS3のようなfine-grainedなIAM/ACL権限モデルは無い
（brief Step 2の `platform-admin` / security owner という表現はS3想定の言い回し）。実際のaccess
controlはVercel project / team member単位で、`soras-projects-bb254ff5` teamのadmin権限を持つ
メンバーは誰でもどのstoreも管理・削除できる。存在しない権限体系を作文せず、この実態のまま記録する。

**CORS**: 本ハンドオフでは未決定。実際のupload / embed originが固まる実装時（Task 3のPayload storage
adapter実装時）に確定する前提で、Task 0時点ではopen itemとして残す。

**Retention**: 4 storeとも lifecycle / expiry policy は未設定。ただし4 storeとも現時点で空
（ファイル未書き込み）であり、保持すべきデータがまだ存在しないため、Task 0の完了条件は
「実際にfileを書き込む後続task（Task 3以降）でretention policyを設定する」という理由付きの
先送りで満たすものとする。Task 0のblockerではない。

**CI/test storage**: brief通りCIはfake / localを使うため、cloud resourceは払い出していない。

#### 2.1 cutover baseline snapshot 領域（Task 5 で確定）

`content:export -- --upload` が置く cutover baseline snapshot の保管方針。移行計画 Task 5 Step 7 が
「immutable な領域の中身をここへ具体的に記録する」ことを求めているため、実運用の値をここに置く。
**Task 5 時点では機構だけを実装・検証しており、実データの baseline 取得は Task 9 Step 2 で行う。**

| 項目 | 決定値 |
|---|---|
| store | Production は `deploid-audit-production`（`store_vV3iFDaAGfIly5jb`）、Preview は `deploid-audit-preview`（`store_j323pw6GSN7Sm9xp`） |
| prefix | `cutover-baseline/` |
| object key | `cutover-baseline/<exportedAt を `:`/`.` → `-` にした ISO8601>-<sha256 先頭12桁>.json`。detached signature は同じキー + `.cosign.bundle` |
| アクセス | private。公開URLを持たず、Vercel Function runtime が OIDC で発行する短命URLからのみ読む。**短命URLは manifest へ保存しない**（期限切れになるため、restore 時に `storage` の永続識別子から都度発行する） |
| 上書き・バージョニング | Vercel Blob は WORM / object-lock / object versioning を持たない（実態。S3想定の言い回しをここでは使わない）。したがって **run ごとに一意なキーで新規オブジェクトとして置き、同一キーへの再uploadを禁止**する（`allowOverwrite: false`、`scripts/export-content-snapshot.mts` の `SnapshotObjectStore.put`）。manifest の `storage.versionId` は Vercel Blob では常に `null` になる |
| 削除権限 | Vercel Blob に fine-grained IAM は無く、`soras-projects-bb254ff5` team の admin 権限保持者が実質の削除権限者（§2「Delete / restore権限（実態）」と同じ制約）。日常運用（import/export/parity）の実行者アカウントに team admin を渡さない運用で代替する |
| 保持期間 | cutover完了（Task 9 Step 7 の rollback window 終了）から最低90日は削除しない。90日経過後の削除は手動判断とし、**自動失効ルールは設定しない** |
| 復元確認 | Task 5 Step 6.5 の export → restore round-trip と同じ経路で、この artifact からの復元が動くことを Task 9 実行前に一度確認する |

**Task 9 の前に人間の判断が要る事項（Task 5 で検出、未解決）**:

> **同一画像ファイルが rights metadata 違いで複数の Media レコードになる（実データで8ファイル）。**
> Task 5 の importer は移行計画 Task 5 Step 3 の「`src` + rights metadata で正規化・重複排除」を
> そのまま実装しているため、同じ `src` に異なる rights（実際の差は大半が `checkedAt`）が付いていると
> 別レコードとして扱い、**同じ画像を2〜3回 upload する**（media 61件のうち11件ぶんが実質重複）。
> `npm run content:compare` の出力と `--json` の `mediaReview` に
> `conflicting-image-rights` として毎回出る。**cutover 前にどちらかを選ぶこと**:
> (a) `data/*.ts` 側で当該画像の rights（`checkedAt`）を揃える、または
> (b) 重複排除の規則を「`src` のみ（rights は最も厳しいものを採用）」へ変更する。
> 放置すると重複したまま本番 blob store へ載る。

**署名**: `alias/deploid-snapshot-signing`（§4）で cosign detached signature を作る。`content:export -- --upload`
は署名なしでは artifact を置かない（cosign 未インストールなら失敗する）。検証（`content:verify-snapshot --manifest` /
`content:verify-conservation --manifest`）は **§4 の公開鍵だけで完結し、AWS credential を必要としない**
（Task 5 で実証済み）。trust anchor は §4 の公開鍵であって Rekor 透明性ログではないため、検証は
`--insecure-ignore-tlog` で行う（外部サービスの可用性を復旧経路の依存にしない）。

### 3. Payload の置き場

現行 Vercel project（`deploid-to-b`）に同居。Payload Cloud は使わない。brief Step 1 の初期値通りで、
新規resourceの追加なし。ここでは確認のみ記録する。

### 4. snapshot署名（cosign + KMS）／ audit outbox暗号化（KMS envelope encryption）

**Provider**: AWS KMS、region `ap-northeast-1`（東京）。Google Cloud KMSおよび「KMSを使わず
encrypted secretsのみ」という最小構成の代替案を検討した上で、コスト・複雑さの観点からAWS KMSを
選択した（このproject規模では鍵1本あたり月額約$1＋無料枠内のAPI呼び出しで実質無視できるコスト）。

- AWS Account ID: `866731631468`
- IAM user: `deploid-kms`。customer-managed policy `deploid-kms-admin` を付与し、`Resource: "*"` に対して
  `kms:*` のみを許可（他のAWS serviceへの権限は一切なし）。この credential が影響できる範囲を
  KMSのみに絞るleast-privilege境界。root user credentialは設計上、作成も使用もしていない。

**署名鍵**（cosign snapshot署名用、Task 5 / Task 9で使用）:

| 項目 | 値 |
|---|---|
| alias | `alias/deploid-snapshot-signing` |
| KeyId | `a9c59d6b-b769-47bb-bc65-8ac6ff4782f5` |
| ARN | `arn:aws:kms:ap-northeast-1:866731631468:key/a9c59d6b-b769-47bb-bc65-8ac6ff4782f5` |
| KeySpec | `ECC_NIST_P256` |
| KeyUsage | `SIGN_VERIFY` |
| SigningAlgorithm | `ECDSA_SHA_256` |
| 自動rotation | 非対応（AWS KMSはasymmetric keyの自動rotationをサポートしない。AWS platformの制約であり選択ではない） |

rotationが必要になった場合は手動（新しいkeyとaliasを作成し、以降の署名を作り直す）で対応する。

検証用公開鍵（secretではない。公開して問題ない値としてそのまま掲載する）:

```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/cHZmiiXZKXcUVZefKLtKVwLBdxS
oHcOefwBg14WSe08xdJE0yM9cnVgLZYINtulE2S/ZTStYMBNoK3vOhnq6Q==
-----END PUBLIC KEY-----
```

**暗号化鍵**（audit outbox envelope encryption用、②）:

| 項目 | 値 |
|---|---|
| alias | `alias/deploid-audit-outbox` |
| KeyId | `5f9b81f6-a145-450c-870c-c6ae09bbf91a` |
| ARN | `arn:aws:kms:ap-northeast-1:866731631468:key/5f9b81f6-a145-450c-870c-c6ae09bbf91a` |
| KeySpec | `SYMMETRIC_DEFAULT` |
| KeyUsage | `ENCRYPT_DECRYPT` |
| 自動rotation | 有効。`RotationPeriodInDays: 365`、次回rotation `2027-08-11` |

署名鍵とは別key IDであり、共有しない。rotation後もAWS KMSはrotation前のkey materialを透過的に
保持し、旧versionで暗号化されたciphertextの復号に自動的に使う。旧version保持のための手動運用は
不要。

**Rotation / 復号の運用担当**: 当面はプロジェクトオーナー（人間）が担う。brief Step 1が求める
「recovery operator」役割は現時点では separate に設けていない。単一operator体制のprojectという
現段階に合わせた意図的な先送りであり、抜け漏れではない。

**AWS access key ID / secret access key（`deploid-kms` IAM user）**: 本書にも `.env.example` にも
記載しない。Supabase passwordと同じ運用規約で、人間が保持するローカルの未追跡ファイルに保管し、
git管理下には置かない。実際にapplication / CIコードが消費する段階（後続task）でVercelの
Environment Variablesに設定する。

**復旧手順の入口**: プロジェクトオーナー（Supabase project dashboard、Vercel team admin、AWS
`deploid-kms` IAM credentialのすべてを保持）へ連絡する。詳細なrunbook文書はまだ作成していない
（Task 0の範囲外）。

### Step 5 完了条件との対応

brief Step 5の完了条件「外部リソースの契約・費用・責任者を含む未確定事項が閉じ、環境ごとにDBと
storageが分かれている。1件でもowner / credential / retentionが未確定ならTask 2へ進まない」に対して:

- **Owner / credential**: Postgres・Vercel Blob・KMSともプロジェクトオーナーを owner / cost owner
  として明記済み。credentialの保管規約（人間保持のローカル未追跡ファイル、gitに置かない）も明記済み。
- **環境分離**: Postgresは別project ref・別host_addr、Vercel Blobは4 storeとも別store ID・別env var
  （Production credentialはPreview環境変数に設定していない）で分離済み。
- **明示的に先送りした項目（blockerではない）**: Vercel Blob 4 storeのretention policy実装（保持
  すべきデータがまだ存在しないため、実際に書き込むTask 3以降で設定）、Vercel Blob storeのCORS設定
  （実際のupload originが決まるTask 3実装時に確定）、KMS rotation / decryptionの recovery operator
  役割分離（単一operator体制の現段階では未設置）。いずれも理由付きの先送りであり、Task 2へ進む上での
  blockerではない。
