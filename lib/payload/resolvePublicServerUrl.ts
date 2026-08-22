/**
 * `PAYLOAD_PUBLIC_SERVER_URL` の実効値を決める。
 *
 * ローカル開発は`.env.local`で明示設定する（`.env.example`の既定値`http://localhost:3000`）。
 * Vercelの各deploymentでは、Preview URLはpushのたびに変わる（`<project>-<hash>-<team>.vercel.app`）
 * ため、固定値をVercel Environment Variablesへ手動設定し続けるのは運用コストが高く、更新を
 * 忘れるとPayload admin・revalidation webhookが古いURLを指したまま壊れる。
 *
 * Vercelは`VERCEL_BRANCH_URL`（同じbranchの最新deploymentを指す安定URL）と`VERCEL_URL`
 * （そのdeployment固有のURL）をruntimeへ自動注入する（どちらもprotocol無し）。
 * `PAYLOAD_PUBLIC_SERVER_URL`が明示設定されていればそれを最優先し、無ければ
 * `VERCEL_BRANCH_URL`→`VERCEL_URL`の順でfallbackする。どちらも無ければ（ローカル開発で
 * `.env.local`未設定など）`undefined`を返す——呼び出し側の既存のnull安全な扱いをそのまま使う。
 */
/** `lib/payload/access.ts`の`EnvLike`と同じ、テストから差し替え可能にするための最小型。 */
export type EnvLike = Record<string, string | undefined>;

export function resolvePublicServerUrl(env: EnvLike = process.env): string | undefined {
  if (env.PAYLOAD_PUBLIC_SERVER_URL) return env.PAYLOAD_PUBLIC_SERVER_URL;
  const vercelHost = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : undefined;
}
