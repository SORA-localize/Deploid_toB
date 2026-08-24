/**
 * restore 専用の**特権 authorization**（remediation group 3 / 必須修正8-3）。
 *
 * brief の要求:
 * > normal import は原則 `overrideAccess: false` と実 user を使う。
 * > **restore 専用 override entrypoint を normal import から直接再利用できない構造にする。**
 *
 * `content:import`（通常運用の冪等 upsert）と `content:restore`（災害復旧）は、これまで同じ
 * `importContentSnapshot()` を `overrideAccess: true` で通っていた。つまり通常 import が
 * **Payload の access control を丸ごと迂回**しており、role を間違えた実行が RBAC で止まらなかった。
 *
 * ここでは override を使う entrypoint（`restoreContentSnapshot`）に、この module でしか作れない
 * 値を要求する。`content:import` の経路には verified baseline も local throwaway の判定結果も
 * 無いので、**引数を用意できない**。
 *
 * ## この仕組みが保証すること / しないこと
 *
 * - 保証する: `content:import` の CLI 経路から override 付き書き込みへ**到達できない**
 *   （authorization を作るには preflight を通った `provenance`、または「DB 自身が local throwaway
 *   だと申告している」ことの確認結果が要る）。
 * - 保証しない: 同一 process 内で悪意ある新規コードが `authorizeRestoreFromLocalThrowaway()` を
 *   呼ぶこと自体は防げない。ただしその場合も**対象 DB が local throwaway でなければ throw** する
 *   ので、managed DB に対する escalation にはならない。
 */

const RESTORE_AUTHORIZATION = Symbol('deploid.restore-authorization');

export interface RestoreAuthorization {
  readonly [RESTORE_AUTHORIZATION]: true;
  /** 監査ログに残す理由。 */
  readonly reason: string;
  /** どの baseline を戻しているか（未署名 local restore では `local-throwaway`）。 */
  readonly baselineRunId: string;
}

function issue(reason: string, baselineRunId: string): RestoreAuthorization {
  return { [RESTORE_AUTHORIZATION]: true, reason, baselineRunId };
}

/**
 * review fix round 1 / Important #1: **実際に検証を通ったオブジェクトだけ**を記録する registry。
 *
 * 修正前の `authorizeRestoreFromVerifiedBaseline()` は「`provenance.baselineRunId` が非空文字列で
 * ありさえすれば」任意の object を受け付けていた。docblock は「検証済み baseline からのみ発行
 * される」と主張していたが、それは**命名規約であって強制された不変条件ではなかった**
 * （同じファイルの `authorizeRestoreFromLocalThrowaway` が前提条件を再導出しているのと対照的）。
 *
 * `verifyBaselineBeforeRestore()` が `{ ok: true }` を返すときにだけ、その戻り値そのものを
 * `registerVerifiedBaseline()` でここへ登録する。authorization はその**object identity**を要求
 * するので、形だけ似せた別の object では発行できない。WeakSet なので参照が消えれば自動的に落ちる。
 */
const verifiedBaselines = new WeakSet<object>();

/**
 * `verifyBaselineBeforeRestore()` だけが呼ぶ。検証を通った戻り値を registry へ登録して返す。
 * **検証に失敗した経路からは絶対に呼ばない**こと（呼べば authorization の根拠が消える）。
 */
export function registerVerifiedBaseline<T extends object>(verified: T): T {
  verifiedBaselines.add(verified);
  return verified;
}

/**
 * 署名検証・sha256・baseline 完了・schema・内容・media bytes・対象DB identity・store 同定を
 * すべて通った baseline からのみ発行する。引数は `verifyBaselineBeforeRestore()` が
 * **実際に返した** `verified` オブジェクトでなければならない（review fix round 1 / Important #1）。
 */
export function authorizeRestoreFromVerifiedBaseline(verified: {
  provenance: { baselineRunId: string; environment: string };
}): RestoreAuthorization {
  if (!verified || typeof verified !== 'object' || !verifiedBaselines.has(verified)) {
    throw new Error(
      'restore-authorization-refused: this is not a verification result produced by ' +
        'verifyBaselineBeforeRestore(). An object that merely looks like one does not authorise a ' +
        'restore with overridden access control.',
    );
  }
  const runId = verified.provenance?.baselineRunId;
  if (typeof runId !== 'string' || runId.length === 0) {
    throw new Error('restore-authorization-refused: a verified baseline must carry its baselineRunId.');
  }
  return issue(`content:restore from verified baseline ${runId} (${verified.provenance.environment})`, runId);
}

/**
 * 未署名 `--input` の local restore 用。**DB 自身の申告**（`_environment_marker`）が
 * production / preview ならここで throw する（`assertRawInputTargetAllowed()` と同じ根拠を、
 * authorization の発行条件としても要求する）。
 *
 * review fix round 1 / Important #2: `isLocalHost` も**実際に読む**。一度も
 * `environment:stamp` されていない managed database は `environment: null` を返すため、
 * marker だけを見ていると「まだ stamp されていない本番DB」へ特権 override を発行してしまう。
 * 引数として渡されていながら使っていなかったので、閉じられるはずの穴が開いたままだった。
 */
export function authorizeRestoreFromLocalThrowaway(target: {
  environment: 'production' | 'preview' | null;
  isLocalHost: boolean;
}): RestoreAuthorization {
  if (target.environment !== null) {
    throw new Error(
      `restore-authorization-refused: this database identifies itself as "${target.environment}". ` +
        'An unsigned restore never runs with overridden access control there.',
    );
  }
  if (!target.isLocalHost) {
    throw new Error(
      'restore-authorization-refused: this database has no _environment_marker row but is not on a local ' +
        'host either. An unstamped managed database is not a throwaway — stamp it (npm run environment:stamp) ' +
        'and restore from a signed baseline instead.',
    );
  }
  return issue('content:restore from an unsigned snapshot into a local throwaway database', 'local-throwaway');
}

export function isRestoreAuthorization(value: unknown): value is RestoreAuthorization {
  return Boolean(value && typeof value === 'object' && (value as RestoreAuthorization)[RESTORE_AUTHORIZATION] === true);
}
