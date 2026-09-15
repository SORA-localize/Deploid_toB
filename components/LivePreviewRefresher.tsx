'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Payload Admin編集画面のLive Previewはiframeへ`{type:'payload-document-event'}`を
 * postMessageし、SSR側で`router.refresh()`することを期待する（RSCフレームワーク向けの
 * 公式な連携方式——`@payloadcms/ui`の`LivePreviewWindow`参照）。draftMode有効時のみ
 * `(frontend)/layout.tsx`から描画される（通常訪問者には一切ロードされない）。
 */
export function LivePreviewRefresher() {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: unknown } | null)?.type === 'payload-document-event') {
        router.refresh();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return null;
}
