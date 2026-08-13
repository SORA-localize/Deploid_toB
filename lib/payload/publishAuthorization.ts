import type { PayloadRequest } from 'payload';

/**
 * 公開（`_status: 'published'` なmain documentへの書き込み）を認可するcontextの正本
 * （remediation group 1 / 必須修正1-4・1-6）。
 *
 * ## なぜ `req.context` なのか
 *
 * Payloadの `context` は **Local APIの引数からしか渡せない**。REST / GraphQL の
 * `createPayloadRequest()` は `context: {}` を固定で作るため（`node_modules/payload/dist/
 * utilities/createPayloadRequest.js`）、HTTP経由の呼び出し側がここのキーを注入することは
 * できない。つまり「server側のコードが明示的に承認経路を通した」ことだけを表現できる。
 * MCP plugin / admin UI / REST はいずれもHTTP側から入るので、同じ理由で注入できない。
 *
 * 逆に言うと、このcontextを付けられるのは同一processのserver codeだけなので、
 * `publishApprovedVersion()`（承認済み公開）と import/restore（特権経路）の2つに限定し、
 * それ以外の経路は publish gate が fail-closed で落とす。
 */

const APPROVED_PUBLISH_KEY = '__deploidApprovedPublish';
const PRIVILEGED_PUBLISH_KEY = '__deploidPrivilegedPublish';
const DRAFT_INTENT_KEY = '__deploidDraftIntent';

/** 承認済みversionの公開（`publishApprovedVersion()` だけが作る）。 */
export interface ApprovedPublishAuthorization {
  collection: string;
  documentId: string;
  approvedVersionId: string;
  approvalManifestHash: string;
  actorId: string;
}

/**
 * import / restore 用の特権経路（必須修正1-6）。通常のpublish経路とは別扱いにし、
 * run ID・actor・理由・対象collectionを監査ログへ残す。
 */
export interface PrivilegedPublishAuthorization {
  runId: string;
  actorId: string;
  reason: string;
  /** 省略時は全content collection。特定collectionへ絞る場合だけ指定する。 */
  collections?: readonly string[];
}

/** `publishApprovedVersion()` が Local API 呼び出しへ渡す `context`。 */
export function approvedPublishContext(auth: ApprovedPublishAuthorization): Record<string, unknown> {
  return { [APPROVED_PUBLISH_KEY]: auth };
}

/** import / restore が Local API 呼び出しへ渡す `context`。 */
export function privilegedPublishContext(auth: PrivilegedPublishAuthorization): Record<string, unknown> {
  return { [PRIVILEGED_PUBLISH_KEY]: auth };
}

function contextOf(req: PayloadRequest): Record<string, unknown> {
  return (req.context ?? {}) as Record<string, unknown>;
}

/**
 * この collection / document の公開を認可する承認contextを読む。collectionとdocument idが
 * 一致しない承認は**認可として扱わない**（別documentの承認contextが同一request内に居残って
 * いても、それで別のdocumentが公開されないようにする）。
 */
export function readApprovedPublishAuthorization(
  req: PayloadRequest,
  collectionSlug: string,
  documentId: string | number | undefined,
): ApprovedPublishAuthorization | null {
  const value = contextOf(req)[APPROVED_PUBLISH_KEY] as ApprovedPublishAuthorization | undefined;
  if (!value) return null;
  if (value.collection !== collectionSlug) return null;
  if (documentId === undefined || String(value.documentId) !== String(documentId)) return null;
  return value;
}

/** import / restore の特権contextを読む。 */
export function readPrivilegedPublishAuthorization(
  req: PayloadRequest,
  collectionSlug: string,
): PrivilegedPublishAuthorization | null {
  const value = contextOf(req)[PRIVILEGED_PUBLISH_KEY] as PrivilegedPublishAuthorization | undefined;
  if (!value) return null;
  if (value.collections && !value.collections.includes(collectionSlug)) return null;
  return value;
}

function draftIntentKey(collectionSlug: string, docId: string | number): string {
  return `${collectionSlug}:${docId}`;
}

/**
 * `beforeOperation` で観測した Local API / REST の `draft` 引数を、同じrequestの
 * `beforeChange` から読めるように控える。
 *
 * これが要るのは、Payloadが `draft: true` のupdateで `data._status` を 'draft' へ**書き換えて**
 * from `beforeChange` に渡すため（`node_modules/payload/dist/collections/operations/utilities/
 * update.js` の `isSavingDraft`）、hookの引数だけでは
 *   (a) 公開中documentの上へdraftを保存する（main rowは触らない）
 *   (b) 公開中documentをunpublishする（main rowを draft に落とす）
 * の2つが完全に同じ形（`data._status === 'draft'` かつ `originalDoc._status === 'published'`）に
 * 見えてしまうから。(a) は draft-writer に許し、(b) は publisher に限る必要がある。
 */
export function recordDraftIntent(
  req: PayloadRequest,
  collectionSlug: string,
  docId: string | number,
  draft: boolean,
): void {
  const context = contextOf(req);
  const existing = context[DRAFT_INTENT_KEY];
  const map = existing instanceof Map ? (existing as Map<string, boolean>) : new Map<string, boolean>();
  map.set(draftIntentKey(collectionSlug, docId), draft);
  context[DRAFT_INTENT_KEY] = map;
}

/**
 * `recordDraftIntent()` が控えた値を読む。**記録が無ければ `false`（= main rowを書く扱い）**を
 * 返す。fail-closedの中核: 観測できなかった経路は、公開状態を書き換えうる操作として
 * 厳しい側に倒す。
 */
export function readDraftIntent(req: PayloadRequest, collectionSlug: string, docId: string | number | undefined): boolean {
  if (docId === undefined) return false;
  const map = contextOf(req)[DRAFT_INTENT_KEY];
  if (!(map instanceof Map)) return false;
  return map.get(draftIntentKey(collectionSlug, docId)) === true;
}
