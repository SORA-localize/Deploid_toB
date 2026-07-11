'use client';

import type { ComponentProps } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * サイト共通のトースト表示層。呼び出し側は `import { toast } from 'sonner'` を使う。
 * デザイントークン（角丸なし・border・card配色）に合わせて既定スタイルを上書きする。
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as 'light' | 'dark' | undefined) ?? 'system'}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            '!rounded-none !border !border-border !bg-card !text-card-foreground !text-xs !shadow-xl',
        },
      }}
      {...props}
    />
  );
}
