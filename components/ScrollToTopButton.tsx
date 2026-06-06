'use client';

import { ArrowUp } from 'lucide-react';
import { scrollToPageTop } from '@/lib/scroll';

export function ScrollToTopButton() {
  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      aria-label="ページトップへ戻る"
    >
      <ArrowUp className="h-3 w-3" />
      トップへ
    </button>
  );
}
