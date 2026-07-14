'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, CameraOff } from 'lucide-react';
import { motion } from 'motion/react';
import { CardFactGrid, type CardFactItem, type CardFactItems } from '@/components/CardFactGrid';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { ImageAsset, ManufacturerLogos, Robot } from '@/data/types';
import type { RobotCardFact, RobotCardViewModel } from '@/lib/robotCatalog';
import { getRobotPrimaryImage } from '@/lib/robotMedia';
import { deploymentStageLabels } from '@/lib/labels';
import { uiText } from '@/lib/uiText';
import { useTiltCardEffect } from '@/lib/useTiltCardEffect';
import { cn } from '@/lib/utils';
import {
  getDeploymentStageTone,
  getVisualToneTextClassName,
} from '@/lib/visualSemantics';

interface RobotCardProps {
  robot: Robot;
  viewModel: RobotCardViewModel;
  manufacturerName?: string;
  manufacturerLogo?: ImageAsset;
  manufacturerLogos?: ManufacturerLogos;
  /** メーカー詳細ページ内の取り扱いロボット一覧など、同一メーカー文脈で
   *  メーカー表示が冗長になる面ではメーカー行ごと隠す（仕様L7） */
  hideManufacturer?: boolean;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  /** モバイル幅で画像を大きく・テキストを名前のみに絞った縦カードにする（既定は行カード） */
  mobileVisual?: boolean;
}

export function RobotCard({
  robot,
  viewModel,
  manufacturerName,
  manufacturerLogo,
  manufacturerLogos,
  hideManufacturer = false,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
  mobileVisual = false,
}: RobotCardProps) {
  const deploymentStageTone = getDeploymentStageTone(robot.deploymentStage);
  const cardImage = getRobotPrimaryImage(robot);
  const toCardFactItem = (fact: RobotCardFact): CardFactItem => ({
    key: fact.key,
    label: fact.label,
    value: fact.href ? (
      <Link
        href={fact.href}
        className="pointer-events-auto underline underline-offset-2 hover:text-muted-foreground"
        aria-label={`${robot.nameJa ?? robot.name}の価格を問い合わせる`}
      >
        {fact.value}
      </Link>
    ) : fact.value,
    valueClassName: fact.href ? 'overflow-visible' : undefined,
  });
  const cardFacts: CardFactItems = [
    toCardFactItem(viewModel.facts[0]),
    toCardFactItem(viewModel.facts[1]),
    toCardFactItem(viewModel.facts[2]),
    toCardFactItem(viewModel.facts[3]),
  ];

  const {
    cardRef,
    rotateX,
    rotateY,
    glowOpacity,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  } = useTiltCardEffect();

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "robot-card group relative isolate flex flex-col h-full overflow-hidden border transition-[border-color,box-shadow,filter,opacity] duration-300",
        "border-border bg-card text-card-foreground",
        "hover:border-ring hover:shadow-lg",
      )}
    >
      {/* Glow effect */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          opacity: glowOpacity,
          background: 'radial-gradient(circle at center, var(--card-spotlight) 0%, transparent 70%)',
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[100%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%] motion-reduce:hidden"
      />

      {showFavorite && (
        <button
          type="button"
          aria-label={
            isFavorite
              ? uiText.favorites.ariaRemove(robot.nameJa ?? robot.name)
              : uiText.favorites.ariaAdd(robot.nameJa ?? robot.name)
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteToggle?.(robot.id);
          }}
          className="absolute top-3 right-3 z-40 p-1 text-muted-foreground transition-colors hover:text-foreground pointer-events-auto"
        >
          <Star
            className={`w-4 h-4 ${
              isFavorite ? 'fill-favorite text-favorite' : ''
            }`}
          />
        </button>
      )}

      {(() => {
        const renderImageContent = (sizes: string) =>
          cardImage ? (
            <div className="relative h-full w-full">
              {/* ぼかし背景: 余白をニュートラルに埋める */}
              <Image
                src={cardImage.src}
                alt=""
                aria-hidden="true"
                fill
                sizes={sizes}
                className="pointer-events-none scale-110 select-none object-cover blur-2xl brightness-75 saturate-150"
              />
              <Image
                src={cardImage.src}
                alt={cardImage.alt}
                fill
                sizes={sizes}
                className="z-10 object-contain"
              />
            </div>
          ) : (
            <>
              <CameraOff className="w-6 h-6 mb-1.5 opacity-20" />
              <span className="text-xs text-muted-foreground/70">
                {uiText.robots.mainImageMissing}
              </span>
            </>
          );

        const imageBox = (
          <div className="w-20 flex-none self-stretch border-r border-border sm:w-24 md:w-auto md:aspect-[7/6] md:border-r-0 md:border-b bg-muted flex flex-col items-center justify-center text-muted-foreground overflow-hidden">
            {renderImageContent('(max-width: 768px) 96px, 25vw')}
          </div>
        );

        // モバイル専用: 画像を大きく見せるための正方形枠（PC版と同じ矩形・object-contain）
        const mobileImageBox = (
          <div className="w-full aspect-square border-b border-border bg-muted flex flex-col items-center justify-center text-muted-foreground overflow-hidden">
            {renderImageContent('50vw')}
          </div>
        );

        const desktopDetailContent = (
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="line-clamp-2 text-base font-semibold text-card-foreground">
                <Link href={`/robots/${robot.slug}`} className="hover:underline">
                  {robot.nameJa ?? robot.name}
                </Link>
              </h3>
            </div>
            {hideManufacturer ? null : (
              <div className="inline-block pointer-events-none md:pointer-events-auto">
                <ManufacturerLogoName
                  name={manufacturerName ?? robot.manufacturerId}
                  logo={manufacturerLogo}
                  logos={manufacturerLogos}
                  variant="combined"
                  className="mb-1 text-xs text-muted-foreground"
                  targetAreaPx={16 * 64}
                  maxHeightPx={16}
                  maxWidthPx={64}
                />
              </div>
            )}
            <CardFactGrid items={cardFacts} className="mt-auto" />
          </div>
        );

        const mobileRowContent = (
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <h3 className="line-clamp-2 text-base font-semibold text-card-foreground">
              <Link href={`/robots/${robot.slug}`} className="hover:underline">
                {robot.nameJa ?? robot.name}
              </Link>
            </h3>
            <dl className="mt-1.5 text-[11px]">
              <div>
                <dt className="text-muted-foreground/80">{uiText.robots.deploymentStage}</dt>
                <dd className={cn('font-medium', getVisualToneTextClassName(deploymentStageTone))}>
                  {deploymentStageLabels[robot.deploymentStage]}
                </dd>
              </div>
            </dl>
          </div>
        );

        if (!mobileVisual) {
          return (
            <>
              <div className="relative z-20 flex h-full flex-row pointer-events-none md:hidden">
                {imageBox}
                {mobileRowContent}
              </div>
              <div className="relative z-20 hidden h-full flex-col pointer-events-none md:flex">
                {imageBox}
                {desktopDetailContent}
              </div>
            </>
          );
        }

        return (
          <>
            {/* モバイル: 画像を大きく、テキストは名前のみ（PC版と同じ矩形画像枠を流用） */}
            <div className="relative z-20 flex flex-col h-full pointer-events-none md:hidden">
              {mobileImageBox}
              <div className="flex min-w-0 flex-1 flex-col p-2.5">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
                  <Link href={`/robots/${robot.slug}`} className="hover:underline">
                    {robot.nameJa ?? robot.name}
                  </Link>
                </h3>
              </div>
            </div>

            {/* PC: 4項目の共通カード */}
            <div className="relative z-20 hidden md:flex md:flex-col h-full pointer-events-none">
              {imageBox}
              {desktopDetailContent}
            </div>
          </>
        );
      })()}

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-40 h-[2px] w-0 bg-primary transition-all duration-500 group-hover:w-full motion-reduce:transition-none"
      />

      <Link
        href={`/robots/${robot.slug}`}
        className="absolute inset-0 z-10"
        aria-hidden="true"
        tabIndex={-1}
      />
    </motion.div>
  );
}
