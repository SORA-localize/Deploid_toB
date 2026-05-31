import React from 'react';
import { parseJapaneseText } from '@/lib/typography';

interface BudouXTextProps {
  /** The raw Japanese text to be parsed. Strictly string only for safety. */
  text: string;
  /** Optional class name to apply to the wrapper span. Recommended to add 'break-keep'. */
  className?: string;
  /** Explicitly forbid children to prevent runtime crashes from nested React nodes. */
  children?: never;
}

/**
 * A highly accessible, SEO-friendly, and XSS-safe component for rendering Japanese typography.
 * It uses Google's BudouX to insert `<wbr>` tags at natural word boundaries.
 */
export function BudouXText({ text, className = '' }: BudouXTextProps) {
  if (!text) return null;

  // 1. Parse text into safe array of strings (No dangerouslySetInnerHTML)
  const chunks = parseJapaneseText(text);

  return (
    <span className={`inline-block ${className}`}>
      {/* 2. SEO & Accessibility: The raw, unbroken text for crawlers and screen readers */}
      <span className="sr-only">{text}</span>

      {/* 3. Visual Presentation: Hidden from screen readers to prevent stuttering */}
      <span aria-hidden="true">
        {chunks.map((chunk, index) => (
          <React.Fragment key={index}>
            {chunk}
            {/* Insert zero-width space after each chunk except the last one */}
            {index < chunks.length - 1 && <wbr />}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}
