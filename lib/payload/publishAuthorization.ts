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

interface DraftIntentEntry {
  draft: boolean;
  /**
   * このtokenを記録したoperationの `req.context` object。
   *
   * `createLocalReq()` は operation ごとに `req.context` を**新しいobjectへ差し替える**
   * （空なら渡された `context`、非空なら `{...req.context, ...context}`）。req object自体は
   * 使い回されうる（`createLocalReq` は引数のreqをmutateして返す）ため、operationの同一性は
   * reqではなく**contextのobject identity**で見る。
   */
  context: Record<string, unknown>;
}

function draftIntentStore(context: Record<string, unknown>): Map<string, DraftIntentEntry> | undefined {
  const store = context[DRAFT_INTENT_KEY];
  return store instanceof Map ? (store as Map<string, DraftIntentEntry>) : undefined;
}

/**
 * このcollectionについて溜まっているdraft intentを捨てる。各write operationの開始時
 * （`beforeOperation`）に必ず呼ぶ。
 *
 * `beforeOperation` は **access controlより前**に走る。id指定のupdateがaccess拒否や
 * `beforeValidate` のthrowで `beforeChange` へ到達せずに終わると、そのoperationが記録した
 * intentは誰にも消費されず**孤児**になる。孤児を残したまま同じ `req` で同じdocumentへ
 * 別の書き込み（`where` 指定のbulk update、`restoreVersion` など、自分ではintentを記録しない
 * 経路）が走ると、その孤児を拾って「draft保存」と誤認しかねない。
 * write operationの入口で毎回捨てれば、tokenが次のoperationまで生き延びること自体が無くなる。
 */
export function clearDraftIntents(req: PayloadRequest, collectionSlug: string): void {
  const store = draftIntentStore(contextOf(req));
  if (!store) return;
  const prefix = `${collectionSlug}:`;
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
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
  const map = draftIntentStore(context) ?? new Map<string, DraftIntentEntry>();
  map.set(draftIntentKey(collectionSlug, docId), { draft, context });
  context[DRAFT_INTENT_KEY] = map;
}

/**
 * `recordDraftIntent()` が控えた値を、**1回だけ**読む（読んだ時点で消費する）。
 * 記録が無ければ `false`（= main rowを書く扱い）を返す。
 *
 * ## なぜ消費するのか（累積するmapにしない理由）
 *
 * `req.context` は1つのrequestの中で使い回される。hookがネストした
 * `payload.update({ req })` を呼ぶと、`createLocalReq()` が `{...req.context, ...context}` を
 * 作るため、ここに置いたMapの**参照がそのまま引き継がれる**。
 *
 * 記録が残り続ける設計だと、id指定のdraft保存が残した `true` を、後続の
 * **`args.id` を持たない書き込み**（`where` 指定のbulk update、`restoreVersion` 等。
 * `beforeOperation` で何も記録しない）が拾い、「main rowを書く操作」が「draft保存」と
 * 誤認されうる。今のcallerの組み合わせでは実害のある経路が無いことを確認したが、
 * ここはsecurity-criticalなgateなので、「危険なcallerが今は居ない」ことに正しさを
 * 依存させない。1回の書き込み用の使い捨てトークンにすれば、記録の無い経路は
 * **構造上必ず** `false`（fail-closed）へ落ちる。
 */
export function readDraftIntent(req: PayloadRequest, collectionSlug: string, docId: string | number | undefined): boolean {
  if (docId === undefined) return false;
  const context = contextOf(req);
  const map = draftIntentStore(context);
  if (!map) return false;

  const key = draftIntentKey(collectionSlug, docId);
  const entry = map.get(key);
  // 使い捨て: 読んだ時点で必ず消す（自分のものでなかった場合も、次へ持ち越させない）。
  map.delete(key);

  if (!entry) return false;
  // 別operationが記録したtoken（= 消費されずに残った孤児）は自分のものではない。
  if (entry.context !== context) return false;
  return entry.draft === true;
}
