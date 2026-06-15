import Link from 'next/link';
import type { Robot } from '@/data/types';
import { getDisplayableAsset } from '@/lib/media';
import { uiText } from '@/lib/uiText';

interface FeaturedRobotCardProps {
  robot: Robot;
  manufacturerName?: string;
}

/**
 * home の「注目ロボット」専用カード。
 * ComparisonRobotPanel に視覚的に類似（blur 背景・単色透明フェード・前景画像）するが、
 * Dialog ではなく Link でロボット詳細ページへ遷移する。角丸なし（矩形）。
 * オーバーレイは from-black/60 to-transparent の単色フェードのみ（有彩色グラデ禁止）。
 */
export function FeaturedRobotCard({ robot, manufacturerName }: FeaturedRobotCardProps) {
  // transparent → hero → heroImage の順でフォールバック（ComparisonRobotPanel と同じ）
  const cardImage = getDisplayableAsset(
    robot.images?.transparent ?? robot.images?.hero ?? robot.heroImage,
  );

  return (
    <Link
      href={`/robots/${robot.slug}`}
      className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted md:aspect-[5/7]"
      aria-label={robot.nameJa ?? robot.name}
    >
      {cardImage ? (
        <>
          {/* blur 背景 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImage.src}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-110 object-cover blur-2xl brightness-[85] saturate-150"
          />
          {/* 前景 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImage.src}
            alt={cardImage.alt}
            className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{uiText.robots.mainImageMissing}</span>
        </div>
      )}

      {/* ホバー暗転 */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 group-hover:bg-black/20"
        aria-hidden="true"
      />

      {/* 上部テキスト可読性オーバーレイ（単色透明フェード） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* 上部: ロボット名 + メーカー名 */}
      <div className="absolute inset-x-0 top-0 z-30 px-3 pt-3">
        <p className="text-xs font-medium text-white">{robot.nameJa ?? robot.name}</p>
        {manufacturerName && (
          <p className="text-[10px] text-white/70">{manufacturerName}</p>
        )}
      </div>
    </Link>
  );
}
