'use client';

import { ArrowUp } from 'lucide-react';
import { scrollToPageTop } from '@/lib/scroll';

export function ScrollToTopIconButton() {
  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      className="shrink-0 text-foreground transition-colors hover:text-muted-foreground"
      aria-label="ページ先頭に戻る"
    >
      <ArrowUp className="h-3.5 w-3.5" />
    </button>
  );
}
