import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

// 本文(body)を neutral 矩形の系統に合わせて描画する共通コンポーネント。
// 見出し・段落・リスト・引用・リンク・強調にだけスタイルを当てる（最小限）。
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('text-base leading-[1.75] text-foreground', className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 mb-4 text-xl font-semibold text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 text-lg font-semibold text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-base font-semibold text-foreground">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noreferrer' : undefined}
              className="text-foreground underline hover:text-muted-foreground"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-border pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>
          ),
          hr: () => <hr className="my-6 border-border" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
