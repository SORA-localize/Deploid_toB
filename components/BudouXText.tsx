import React from 'react';

interface BudouXTextProps {
  /**
   * 行ごとの分かち書き済みチャンク。`lib/typography.ts` の `segmentJapaneseLines()` を
   * **server側で**呼んで渡す。生テキストを受け取って内部で解析すると、client component
   * から使われたときに budoux（実測263,562バイト）が bundle へ入る。
   */
  segments: string[][];
  /** Optional class name to apply to the wrapper span. Recommended to add 'break-keep'. */
  className?: string;
  /** Explicitly forbid children to prevent runtime crashes from nested React nodes. */
  children?: never;
}

/**
 * A highly accessible, SEO-friendly, and XSS-safe component for rendering Japanese typography.
 * It uses Google's BudouX to insert `<wbr>` tags at natural word boundaries.
 */
export function BudouXText({ segments, className = '' }: BudouXTextProps) {
  if (segments.length === 0) return null;

  // 分かち書きは元テキストの分割なので、連結すれば原文に戻る。
  const text = segments.map((line) => line.join('')).join('\n');

  return (
    <span className={`inline-block ${className}`}>
      {/* SEO & Accessibility: The raw, unbroken text for crawlers and screen readers */}
      <span className="sr-only">{text}</span>

      {/* Visual Presentation: Hidden from screen readers to prevent stuttering */}
      <span aria-hidden="true">
        {segments.map((chunks, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {chunks.map((chunk, chunkIndex) => (
              <React.Fragment key={chunkIndex}>
                {chunk}
                {chunkIndex < chunks.length - 1 && <wbr />}
              </React.Fragment>
            ))}
            {lineIndex < segments.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}
