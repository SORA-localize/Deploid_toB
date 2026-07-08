'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { ManufacturerGuideVideo } from '@/data/types';

/**
 * YouTube埋め込みのfacadeパターン。サムネイル＋再生ボタンのみを初期表示し、
 * クリックされるまでiframe（＝YouTubeの重いJS）を生成しない。LCP/CWVへの影響を避けるため。
 * 対象は埋め込みが許可されている公式チャンネルの動画のみ（40-content-rights.md 準拠）。
 */
export function YouTubeEmbed({ video }: { video: ManufacturerGuideVideo }) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <div className="my-6 aspect-video w-full overflow-hidden rounded border border-border bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="my-6">
      <button
        type="button"
        onClick={() => setActivated(true)}
        aria-label={`動画を再生: ${video.title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTubeサムネイルCDN直参照。next/imageのドメイン許可を増やさないための例外 */}
        <img
          src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors motion-reduce:transition-none group-hover:bg-black/40">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black">
            <Play className="ml-1 h-6 w-6" fill="currentColor" />
          </span>
        </span>
      </button>
      <p className="mt-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
        {video.title} —{' '}
        <a
          href={video.channelUrl}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          {video.channelName}
        </a>
        {' '}(YouTube)
      </p>
    </div>
  );
}
