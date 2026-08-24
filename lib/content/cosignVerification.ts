import { execFileSync } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PRODUCTION_KEY = ['-----BEGIN PUBLIC KEY-----','MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/cHZmiiXZKXcUVZefKLtKVwLBdxS','oHcOefwBg14WSe08xdJE0yM9cnVgLZYINtulE2S/ZTStYMBNoK3vOhnq6Q==','-----END PUBLIC KEY-----',''].join('\n');
const PREVIEW_KEY = ['-----BEGIN PUBLIC KEY-----','MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElua4jHrbBrGa1plUQh/jbrxC0P3x','VC40bVQtTAw2PuZdhdOsVCzFZcLwd63rGn7ccgw9hROFUOKBEkiOWW48UA==','-----END PUBLIC KEY-----',''].join('\n');

export interface CosignVerifyResult { verified: boolean; detail: string }
export function ensureCosignOnPath(): void {
  const dir = path.join(process.cwd(), '.cosign-bin');
  process.env.PATH = process.env.PATH ? `${dir}:${process.env.PATH}` : dir;
}
export async function verifyBlobWithCosign(filePath: string, bundlePath: string): Promise<CosignVerifyResult> {
  const override = process.env.SNAPSHOT_SIGNING_PUBLIC_KEY_PATH;
  const dir = override ? undefined : await mkdtemp(path.join(os.tmpdir(), 'deploid-snapshot-'));
  if (dir) await chmod(dir, 0o700);
  const keyPath = override ?? path.join(dir as string, 'deploid-snapshot-signing-pubkey.pem');
  if (!override) await writeFile(keyPath, process.env.VERCEL_ENV === 'production' ? PRODUCTION_KEY : PREVIEW_KEY, 'utf8');
  try {
    execFileSync('cosign', ['verify-blob','--key',keyPath,'--bundle',bundlePath,'--insecure-ignore-tlog=true',filePath], { stdio: ['ignore','pipe','pipe'] });
    return { verified: true, detail: 'cosign verify-blob: Verified OK' };
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? (error as Error).message;
    return { verified: false, detail: stderr.split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('WARNING:')).join(' | ') };
  } finally { if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {}); }
}
export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'deploid-snapshot-')); await chmod(dir, 0o700);
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }).catch(() => {}); }
}
