/**
 * Draft Mode無効化（Task 7 Step 4）。cookieを削除するだけで、redirect先は受け取らない
 * （呼び出し側入力でredirect先を決める余地を作らない——open redirectの経路を1つ減らす）。
 */
import { draftMode } from 'next/headers';
import { PREVIEW_SESSION_COOKIE_NAME } from '@/lib/content/previewTokens';

function clearedSessionCookieHeader(): string {
  return `${PREVIEW_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function handle(): Promise<Response> {
  const draft = await draftMode();
  draft.disable();
  return new Response(null, {
    status: 204,
    headers: {
      'set-cookie': clearedSessionCookieHeader(),
      'cache-control': 'private, no-store',
    },
  });
}

export async function GET(): Promise<Response> {
  return handle();
}

export async function POST(): Promise<Response> {
  return handle();
}
