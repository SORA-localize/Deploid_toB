/**
 * `tests/e2e/draft-mode-wiring.spec.ts` 専用のヘルパー。`mintPreviewToken()`（経路2:
 * 署名付き5分token）を発行し、token文字列だけをstdoutへ出力する。Playwright specは
 * `page.goto('/api/draft-mode/enable?token=<token>&redirect=<redirect>')`でこれを消費する
 * （`/api/draft-mode/enable`のGET経路——クリック可能なマジックリンクと同じ形）。
 *
 * Usage: `npx tsx tests/e2e/mintPreviewTokenForE2E.mts <redirect-path> [sub]`
 */
import { getPayload } from 'payload';
import config from '../../payload.config';
import { mintPreviewToken } from '../../lib/content/previewTokens';

async function main(): Promise<void> {
  const [, , redirect, sub] = process.argv;
  if (!redirect) {
    console.error('usage: tsx mintPreviewTokenForE2E.mts <redirect-path> [sub]');
    process.exitCode = 1;
    return;
  }

  const payload = await getPayload({ config });
  try {
    const token = await mintPreviewToken({ payload, sub: sub ?? 'e2e-draft-viewer@example.com', redirect });
    // stdoutにはtokenのみを出す（specがexecFileSyncの標準出力をそのまま使う）。
    process.stdout.write(token);
  } finally {
    await payload.destroy();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
