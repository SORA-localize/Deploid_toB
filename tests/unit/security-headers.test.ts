import { describe, expect, it } from 'vitest';
import { securityHeaders } from '@/lib/securityHeaders';

/**
 * header は `next.config.mjs` が返す値であって、コードから見えない。
 * 目視で確認する運用にすると、あとで1つ落ちても誰も気づかない。契約としてここで固定する。
 *
 * CSP は report-only に限る。enforce すると外部 script / iframe / 画像のどれかが必ず落ちるが、
 * どれが落ちるかは実トラフィックのレポートを見るまで分からない。互換性を観測してから
 * enforce へ上げる。
 */
describe('securityHeaders', () => {
  // 宣言していない header 名も問い合わせるので、literal union ではなく string で持つ。
  const headers = new Map<string, string>(
    securityHeaders.map(({ key, value }) => [key, value]),
  );

  it('sets baseline browser protections', () => {
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('ships CSP as report-only, never enforced', () => {
    expect(headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'");
    expect(headers.has('Content-Security-Policy')).toBe(false);
  });

  it('allows the third parties the site actually loads', () => {
    const csp = headers.get('Content-Security-Policy-Report-Only') ?? '';

    // components/YouTubeEmbed.tsx はクリック後に youtube-nocookie の iframe を作り、
    // サムネイルを i.ytimg.com から読む。
    expect(csp).toContain('https://www.youtube-nocookie.com');
    expect(csp).toContain('https://i.ytimg.com');

    // components/ContactForm.tsx が @formspree/react で送信する。
    expect(csp).toContain('https://formspree.io');

    // analytics は opt-in だが、有効化したときに CSP で落ちては意味がない。
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://www.clarity.ms');
  });

  it('keeps the dangerous directives closed', () => {
    const csp = headers.get('Content-Security-Policy-Report-Only') ?? '';

    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self' https://formspree.io");
  });
});
