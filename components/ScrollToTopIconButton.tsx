'use client';

import { ArrowUp } from 'lucide-react';
import { scrollToPageTop } from '@/lib/scroll';

export function ScrollToTopIconButton() {
  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition-colors hover:text-muted-foreground"
      aria-label="ページ先頭に戻る"
    >
      <ArrowUp className="h-3.5 w-3.5" />
    </button>
  );
}
