import { NextResponse } from 'next/server';

// POC専用debug route（Supabase pooler mode確認）。確認後すぐ削除する。
// フルのDATABASE_URLは一切返さない・ログしない。ポート番号とホスト名の形（pooler経由か
// direct connectionか）だけを判定して返す。

export async function GET() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return NextResponse.json({ hasDatabaseUrl: false });
  }
  try {
    const u = new URL(raw);
    const hostKind = u.hostname.includes('pooler.supabase.com')
      ? 'pooler'
      : u.hostname.startsWith('db.') && u.hostname.includes('.supabase.co')
        ? 'direct'
        : 'other';
    const poolerMode = u.port === '5432' ? 'session' : u.port === '6543' ? 'transaction' : 'unknown';
    return NextResponse.json({
      hasDatabaseUrl: true,
      port: u.port || null,
      hostKind,
      poolerMode: hostKind === 'pooler' ? poolerMode : 'n/a',
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });
  } catch (e) {
    return NextResponse.json({ hasDatabaseUrl: true, parseError: e instanceof Error ? e.message : String(e) });
  }
}
