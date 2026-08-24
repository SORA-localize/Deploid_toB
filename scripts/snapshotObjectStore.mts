/**
 * cutover baseline を置く object store の抽象と、**どの store へ繋いでいるのかを credential 側から
 * 確かめる**ロジック（remediation group 3 / 必須修正7）。
 *
 * 監査の指摘（原文）:
 * > `createVercelBlobObjectStore(storeName)` の `put`/`get` が `@vercel/blob` の `put()`/`get()` を
 * > implicit token で呼んでいる。`storeName` 引数は manifest の表示用 bucket 名として使われるだけで、
 * > 実際にどの store へ接続するかの選択には一切関与しない。
 *
 * これは表示の問題ではない。この repository では `BLOB_READ_WRITE_TOKEN` は **public media store**
 * の token（`.env.example` / `lib/payload/mediaStoragePlugin.ts`）であり、private audit store
 * （`deploid-audit-production` / `deploid-audit-preview`）は OIDC-federated で静的 token を持たない。
 * つまり implicit token 呼び出しは「No token found で落ちる」か、**public media store へ
 * cutover baseline（全 content record）を書き込む**かのどちらかで、後者は資源表の
 * 「private。公開URLを持たない」と正面から矛盾する。
 *
 * よってここでは:
 * 1. credential（RW token / OIDC token）から**実 store ID を導く**（`resolveBlobCredential`）。
 * 2. 要求された store ID と突き合わせ、食い違えば**接続前に**拒否する（`checkBlobStoreSelection`）。
 * 3. SDK 呼び出しには常に**明示的な credential と storeId** を渡す（implicit 解決に任せない）。
 *
 * ## OIDC token の claim を読むことについて
 *
 * `parseVercelOidcEnvironment()` は JWT の payload を base64url decode するだけで、**署名は
 * 検証しない**。検証するのは Vercel 側であり、こちらが認証判断をするわけではない。用途は
 * 「Preview の credential で Production の store を触ろうとしている」ような**環境交差を拒否する**
 * 一方向の guard に限る（claim を根拠に許可することはしない。fail-closed）。
 *
 * ## 実 store への到達性
 *
 * `deploid-audit-*` は Vercel Function runtime からしか使えないため、ローカル / CI では
 * このモジュールの**ロジック**（store ID 照合・credential 交差拒否・completeness marker）だけを
 * 検証する。実 Blob への end-to-end は Task 9 まで未検証（brief 必須修正7-9）。
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type SnapshotStorageProvider = 'vercel-blob' | 's3' | 'local-disk';

export interface SnapshotObjectStore {
  provider: SnapshotStorageProvider;
  /** 表示用の名前（manifest の `storage.bucket`）。**接続先の選択には使わない**。 */
  bucket: string;
  /**
   * credential から検証済みの実 store ID（正規化済み。`store_` prefix なし）。
   * local-disk には store ID の概念が無いので `null`。
   */
  storeId: string | null;
  /** 同一キーへの再 upload は拒否する（write-once 運用。brief Step 7 の表）。 */
  put(objectKey: string, body: Buffer): Promise<{ versionId: string | null }>;
  /**
   * `fresh: true` は CDN cache を迂回して origin から読む（必須修正7-6 の `useCache: false`）。
   * verify / restore は「今 store にある実物」を見なければ意味がないので既定で fresh。
   */
  get(objectKey: string, options?: { fresh?: boolean }): Promise<Buffer>;
  exists(objectKey: string): Promise<boolean>;
  /** 失敗した run の後片付け用。存在しないキーの削除は成功扱いにする。 */
  remove(objectKey: string): Promise<void>;
  /**
   * 表示・ログ用の**永続識別子**。brief Step 7 は「private object の署名付きURLは manifest へ
   * 保存しない（期限切れになるため）」としており、期限の無いリンクがログ・スクロールバック・
   * チケットへ残ることを構造的に防ぐため、ここは **URL を返さない**契約にする。
   */
  objectReference(objectKey: string): string;
}

export type EnvLike = Record<string, string | undefined>;

// ─── credential → store ID ────────────────────────────────────────────────

export type BlobCredentialKind = 'read-write-token' | 'oidc';

export interface BlobCredential {
  kind: BlobCredentialKind;
  /**
   * credential 自身から導けた store ID（正規化済み）。導けない場合は `null`
   * （OIDC token はあるが `BLOB_STORE_ID` が無い場合）。**要求値で埋めない**。
   */
  storeId: string | null;
  /** OIDC token の claim から読んだ環境。RW token からは分からないので `null`。 */
  environment: 'production' | 'preview' | null;
  token: string;
}

/** `store_abc` と `abc` を同じものとして比較するための正規化（SDK の `normalizeStoreId` と同じ規則）。 */
export function normalizeBlobStoreId(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('store_') ? trimmed.slice('store_'.length) : trimmed;
}

/**
 * classic read/write token は `vercel_blob_rw_<storeId>_<random>` という形で、**store ID を
 * token 自身が含む**（`@vercel/blob` の `parseStoreIdFromReadWriteToken` と同じ規則）。
 * 形が違う文字列から store を推測しない（推測は「実は別 store だった」を隠す）。
 */
export function parseStoreIdFromReadWriteToken(token: string): string | null {
  const parts = token.split('_');
  if (parts.length < 5 || parts[0] !== 'vercel' || parts[1] !== 'blob' || parts[2] !== 'rw') return null;
  const storeId = parts[3];
  return storeId.length > 0 ? storeId : null;
}

/**
 * Vercel OIDC token（JWT）の `environment` claim。**署名は検証しない**（モジュール冒頭の注記）。
 * 読めない・想定外の値なら `null` を返し、呼び出し側は「環境が分からない」として扱う。
 */
export function parseVercelOidcEnvironment(token: string): 'production' | 'preview' | null {
  const segments = token.split('.');
  if (segments.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as {
      environment?: unknown;
    };
    if (payload.environment === 'production' || payload.environment === 'preview') return payload.environment;
    return null;
  } catch {
    return null;
  }
}

/** テスト用に claim だけを持つ「署名の無い」JWT 形式の文字列を作る（署名検証をしないため十分）。 */
export function encodeUnsignedJwtForTests(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.`;
}

/**
 * 実行環境の credential を決める。**OIDC を優先する**。
 *
 * この repository では `BLOB_READ_WRITE_TOKEN` は public media store の token なので、
 * private audit store の操作でそれを暗黙に掴むのは事故そのもの。OIDC がある環境（= Vercel
 * Function runtime）では必ず OIDC 側を使い、cross-check で store 違いを弾く。
 *
 * `oidcTokenOverride`（`docs/reference/task9-audit-upload-endpoint-design-v1.md`「oidcTokenOverride」）:
 * Vercel FunctionのruntimeではOIDC tokenは`process.env.VERCEL_OIDC_TOKEN`ではなく
 * `x-vercel-oidc-token` request headerで渡る（`VERCEL_OIDC_TOKEN`はbuildとlocal devだけ）。
 * audit-upload routeはこの引数へheader値を明示的に渡す。**`env`経路より優先**し、
 * `process.env`へ書き込まない・呼び出し元へ返さない・ログしない——呼び出し側の責務。
 */
export function resolveBlobCredential(env: EnvLike = process.env, oidcTokenOverride?: string): BlobCredential {
  const oidcToken = oidcTokenOverride?.trim() || env.VERCEL_OIDC_TOKEN?.trim();
  if (oidcToken) {
    const configuredStoreId = env.BLOB_STORE_ID?.trim();
    return {
      kind: 'oidc',
      storeId: configuredStoreId ? normalizeBlobStoreId(configuredStoreId) : null,
      environment: parseVercelOidcEnvironment(oidcToken),
      token: oidcToken,
    };
  }

  const readWriteToken = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (readWriteToken) {
    const storeId = parseStoreIdFromReadWriteToken(readWriteToken);
    if (storeId === null) {
      throw new Error(
        'blob-credential-unparseable: BLOB_READ_WRITE_TOKEN is not a `vercel_blob_rw_<storeId>_<secret>` ' +
          'token, so the store it selects cannot be determined. Refusing to connect rather than guessing.',
      );
    }
    return { kind: 'read-write-token', storeId: normalizeBlobStoreId(storeId), environment: null, token: readWriteToken };
  }

  throw new Error(
    'blob-credential-missing: neither VERCEL_OIDC_TOKEN (+ BLOB_STORE_ID) nor BLOB_READ_WRITE_TOKEN is set. ' +
      'The private audit store is OIDC-federated and only reachable from a Vercel Function runtime.',
  );
}

export interface BlobStoreSelectionFailure {
  check: string;
  detail: string;
}

/**
 * 必須修正7-4: **要求された store と credential が指す store が違えば拒否する**。
 * 純粋関数なので、実 Blob へ到達できない環境でも全パターンを検証できる。
 */
export function checkBlobStoreSelection(args: {
  requestedStoreId: string;
  credential: BlobCredential;
  /** manifest / オペレーターが宣言した環境。OIDC claim と食い違えば credential 交差。 */
  expectedEnvironment?: 'production' | 'preview' | 'local-throwaway';
}): BlobStoreSelectionFailure[] {
  const failures: BlobStoreSelectionFailure[] = [];
  const requested = args.requestedStoreId.trim();

  if (requested.length === 0) {
    failures.push({
      check: 'blobStoreIdMissing',
      detail: 'no store id was requested. The display name (--store-name) does not select a store.',
    });
  } else if (args.credential.storeId === null) {
    // fail-closed。「要求された store を使う」で埋めると cross-check が自分自身との比較になる。
    failures.push({
      check: 'blobCredentialStoreUnknown',
      detail:
        'the credential does not identify a store (OIDC token without BLOB_STORE_ID). Set BLOB_STORE_ID ' +
        'for the environment so the store this credential selects can be checked against the artifact.',
    });
  } else if (normalizeBlobStoreId(requested) !== args.credential.storeId) {
    failures.push({
      check: 'blobStoreId',
      detail:
        `the artifact names store "${normalizeBlobStoreId(requested)}" but the runtime credential selects ` +
        `store "${args.credential.storeId}" (${args.credential.kind}).`,
    });
  }

  if (
    args.expectedEnvironment &&
    args.expectedEnvironment !== 'local-throwaway' &&
    args.credential.environment !== null &&
    args.credential.environment !== args.expectedEnvironment
  ) {
    failures.push({
      check: 'blobCredentialEnvironment',
      detail:
        `the artifact is for "${args.expectedEnvironment}" but the OIDC credential was issued for ` +
        `"${args.credential.environment}". Preview and Production credentials are never crossed.`,
    });
  }

  return failures;
}

// ─── local disk（テスト・round-trip 用） ───────────────────────────────────

/**
 * Task 5 のテストと Step 6.5 の round-trip 用。実 private audit store は OIDC federated auth で
 * Vercel Function runtime からしか到達できず、ローカル/CI からは触れない。Task 3 の media storage が
 * token 未設定時に local disk へ落ちるのと同じ前例に従う。
 */
export function createLocalDiskObjectStore(directory: string): SnapshotObjectStore {
  const resolve = (objectKey: string) => path.join(directory, objectKey);
  return {
    provider: 'local-disk',
    bucket: directory,
    storeId: null,
    async put(objectKey, body) {
      const target = resolve(objectKey);
      // write-once: 既に同じキーがあれば拒否する（実 store の `allowOverwrite: false` と同じ挙動）。
      if (existsSync(target)) {
        throw new Error(`object-key-already-exists: ${objectKey} (write-once store, use a fresh key)`);
      }
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
      return { versionId: null };
    },
    async get(objectKey) {
      return readFile(resolve(objectKey));
    },
    async exists(objectKey) {
      return existsSync(resolve(objectKey));
    },
    async remove(objectKey) {
      await rm(resolve(objectKey), { force: true });
    },
    objectReference(objectKey) {
      return `file://${resolve(objectKey)}`;
    },
  };
}

// ─── Vercel Blob（private audit store） ────────────────────────────────────

export interface VercelBlobStoreOptions {
  /** **実 store ID**（`store_...` でも bare でも可）。これが接続先の選択に使われる。 */
  storeId: string;
  /** manifest / ログ表示用の名前（例 `deploid-audit-production`）。選択には使わない。 */
  displayName?: string;
  /** artifact が宣言する環境。OIDC claim との交差を検出する。 */
  expectedEnvironment?: 'production' | 'preview' | 'local-throwaway';
  env?: EnvLike;
  /** `resolveBlobCredential()`と同じ。Vercel Function routeが`x-vercel-oidc-token`を渡す用。 */
  oidcTokenOverride?: string;
}

/**
 * 本番（Task 9 Step 2）向け。private Vercel Blob store（`deploid-audit-*`）を対象にする。
 *
 * 構築時点で credential ↔ store の照合を行い、通らなければ**そもそも store object を作らない**
 * （put / get の直前ではなく構築時に落とすことで、「接続してから気付く」経路を消す）。
 * SDK 呼び出しには常に明示 credential（`token` または `oidcToken` + `storeId`）を渡す。
 */
export function createVercelBlobObjectStore(options: VercelBlobStoreOptions): SnapshotObjectStore {
  const env = options.env ?? process.env;
  const credential = resolveBlobCredential(env, options.oidcTokenOverride);
  const failures = checkBlobStoreSelection({
    requestedStoreId: options.storeId,
    credential,
    expectedEnvironment: options.expectedEnvironment,
  });
  if (failures.length > 0) {
    throw new Error(
      `blob-store-selection-refused: ${failures.map((failure) => `${failure.check}: ${failure.detail}`).join(' | ')}`,
    );
  }

  const storeId = credential.storeId as string;
  const displayName = options.displayName ?? `store_${storeId}`;
  /** 明示 credential。implicit な env 解決に任せない（それが監査の指摘そのもの）。 */
  const auth =
    credential.kind === 'oidc'
      ? { oidcToken: credential.token, storeId }
      : { token: credential.token };

  return {
    provider: 'vercel-blob',
    bucket: displayName,
    storeId,
    async put(objectKey, body) {
      const { put } = await import('@vercel/blob');
      const result = await put(objectKey, body, {
        ...auth,
        // **private 必須**。`deploid-audit-*` は private store（資源表 §2 / §2.1）で、
        // cutover baseline は全 content record を含む。
        access: 'private',
        addRandomSuffix: false,
        // 同一キーへの再 upload を禁止する（Vercel Blob は WORM を持たないため、
        // 「run ごとに一意なキー + 上書き禁止」で immutability を運用的に担保する）。
        allowOverwrite: false,
      });
      return { versionId: (result as { versionId?: string }).versionId ?? null };
    },
    async get(objectKey, getOptions) {
      const { get } = await import('@vercel/blob');
      // 必須修正7-6: verify / restore は「今 store にある実物」を読む必要がある。CDN cache 経由の
      // 古い bytes を検証すると、検証した対象と復元する対象がずれる。よって既定で origin から読む。
      const fresh = getOptions?.fresh ?? true;
      const result = await get(objectKey, {
        ...auth,
        access: 'private',
        useCache: !fresh,
      });
      if (!result) throw new Error(`blob-object-not-found: ${objectKey}`);
      if (result.statusCode !== 200 || !result.stream) {
        throw new Error(`blob-get-unexpected-status-${result.statusCode}: ${objectKey}`);
      }
      const chunks: Uint8Array[] = [];
      for await (const chunk of result.stream) chunks.push(chunk);
      return Buffer.concat(chunks);
    },
    async exists(objectKey) {
      const { head } = await import('@vercel/blob');
      try {
        const result = await head(objectKey, { ...auth });
        return Boolean(result);
      } catch {
        return false;
      }
    },
    async remove(objectKey) {
      const { del } = await import('@vercel/blob');
      await del(objectKey, { ...auth });
    },
    objectReference(objectKey) {
      // **URL を返さない。** private blob の読み出しは認証付き `get()` で行う。ここで永続URLを
      // 返して表示すると、期限の無いリンクをログ・スクロールバック・チケットへ残すことになる。
      return `vercel-blob://${displayName}[store ${storeId}]/${objectKey} (private; read via @vercel/blob get({ access: 'private' }))`;
    },
  };
}

// ─── 不完全 run の検出（必須修正7-7） ──────────────────────────────────────

/**
 * 必須修正7-7: 「snapshot upload 成功・signature upload 失敗」のような**不完全 run が有効
 * baseline として選ばれない**ようにする。
 *
 * baseline の構成物（snapshot / detached signature）を全部置き終えた**最後に**
 * completion marker を書く。restore / verify は marker が無い、または marker の内容が署名済み
 * manifest と食い違う baseline を受け付けない。marker 自体は trust anchor ではない
 * （攻撃者が書けたとしても、署名済み manifest と一致しない限り通らない）——
 * これは「完全に置き終えたか」だけを表す completeness gate。
 */
export function baselineCompletionMarkerKey(objectKey: string): string {
  return `${objectKey}.complete.json`;
}

/**
 * 必須修正9-1: baseline へ同梱した media バイト列の目録。**署名済み manifest の一部**なので、
 * ここに載った sha256 は artifact 署名と同じ強さで守られる。
 *
 * 型をここ（store 層）に置くのは、`scripts/import-content-to-payload.mts` が
 * `scripts/export-content-snapshot.mts` を import すると循環になるため
 * （export → import-content-to-payload の向きが既にある）。
 */
export interface MediaInventoryEntry {
  /** `ContentSnapshot.media[].id`（stable ID）。snapshot 側と1対1で対応する。 */
  stableId: string;
  filename: string;
  objectKey: string;
  sha256: string;
  size: number;
  mimeType: string;
}

export interface BaselineCompletionMarker {
  artifactSha256: string;
  signatureSha256: string;
  /** media bytes を含む baseline では、その inventory 全体の digest（必須修正9）。 */
  mediaInventorySha256: string;
  baselineRunId: string;
  completedAt: string;
}

export function assertValidCompletionMarker(value: unknown): asserts value is BaselineCompletionMarker {
  const marker = value as Partial<BaselineCompletionMarker> | null;
  if (!marker || typeof marker !== 'object') throw new Error('completion-marker-invalid: not an object');
  const problems: string[] = [];
  for (const key of ['artifactSha256', 'signatureSha256', 'mediaInventorySha256'] as const) {
    if (typeof marker[key] !== 'string' || !/^[0-9a-f]{64}$/.test(marker[key] as string)) problems.push(key);
  }
  if (typeof marker.baselineRunId !== 'string' || marker.baselineRunId.length === 0) problems.push('baselineRunId');
  if (typeof marker.completedAt !== 'string' || Number.isNaN(Date.parse(marker.completedAt))) problems.push('completedAt');
  if (problems.length > 0) throw new Error(`completion-marker-invalid: ${problems.join(', ')}`);
}

// ─── audit-upload endpoint 用: object key の形状検証 ─────────────────────────

/**
 * `docs/reference/task9-audit-upload-endpoint-design-v1.md`「Step 2」の防御その2。
 *
 * audit-upload routeは、client がアップロードしたバイト列の sha256 を、署名検証済み
 * manifest から導いた許可一覧と突き合わせて object を特定する（object key を client が
 * 自己申告する経路は無い）。この関数はそれとは**独立**の、object key の**形状**そのものの
 * 検証——sha256突き合わせのロジックにバグがあっても、想定外の prefix・`..`・絶対パスへは
 * 書けないようにする最後の防波堤（defense in depth）。
 *
 * 許可する形は、`baselineObjectKey()`（`export-content-snapshot.mts`）・
 * `${objectKey}.cosign.bundle`・`${objectKey}.media/<sha256>`（`export-content-snapshot.mts`の
 * media upload loop）の3種だけ。`baselineCompletionMarkerKey()`（`${objectKey}.complete.json`）
 * はroute自身が最後に書く値であり、client からの Step 2 アップロード対象には含めない
 * （complete markerをclientが直接アップロードできてしまうと、Step 3のTOCTOU再検証が
 * 意味を持たなくなる）。
 */
export function isAllowedAuditBaselineObjectKey(candidateKey: string, baselineObjectKey: string): boolean {
  if (candidateKey.length === 0 || baselineObjectKey.length === 0) return false;
  if (candidateKey.startsWith('/') || candidateKey.includes('..') || candidateKey.includes('\\')) return false;
  if (!baselineObjectKey.startsWith('cutover-baseline/')) return false;
  if (baselineObjectKey.startsWith('/') || baselineObjectKey.includes('..') || baselineObjectKey.includes('\\')) {
    return false;
  }

  if (candidateKey === baselineObjectKey) return true;
  if (candidateKey === `${baselineObjectKey}.cosign.bundle`) return true;

  const mediaPrefix = `${baselineObjectKey}.media/`;
  if (candidateKey.startsWith(mediaPrefix)) {
    const suffix = candidateKey.slice(mediaPrefix.length);
    // media key の末尾は sha256Hex 1個だけ（`/` を含まない = さらに深い階層を作らせない）。
    return suffix.length > 0 && !suffix.includes('/');
  }

  return false;
}
