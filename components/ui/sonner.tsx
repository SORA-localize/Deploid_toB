'use client';

import type { ComponentProps } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * サイト共通のトースト表示層。呼び出し側は `import { toast } from 'sonner'` を使う。
 * 背景の箱は出さない方針（unstyled）: 短い状態通知だけなのでテキストのみを浮かせる。
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as 'light' | 'dark' | undefined) ?? 'system'}
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-full items-center justify-center gap-2 text-xs font-medium text-foreground',
        },
      }}
      {...props}
    />
  );
}
