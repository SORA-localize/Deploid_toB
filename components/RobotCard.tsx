'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, CameraOff } from 'lucide-react';
import { CardFactGrid, type CardFactItem, type CardFactItems } from '@/components/CardFactGrid';
import { CardHoverEffects } from '@/components/CardHoverEffects';
import { ManufacturerLogoName } from '@/components/ManufacturerLogoName';
import type { RobotCatalogItem } from '@/lib/viewModels/robots';
import type { CatalogFact } from '@/lib/viewModels/shared';
import { uiText } from '@/lib/uiText';
import { cn } from '@/lib/utils';
import { getVisualToneTextClassName } from '@/lib/visualSemantics';

interface RobotCardProps {
  item: RobotCatalogItem;
  /** メーカー詳細ページ内の取り扱いロボット一覧など、同一メーカー文脈で
   *  メーカー表示が冗長になる面ではメーカー行ごと隠す（仕様L7） */
  hideManufacturer?: boolean;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  /** モバイル幅で画像を大きく・テキストを名前のみに絞った縦カードにする（既定は行カード） */
  mobileVisual?: boolean;
  /** 一覧の先頭など、初期viewport内でLCP候補になる画像だけに指定する。 */
  eagerImage?: boolean;
}

export function RobotCard({
  item,
  hideManufacturer = false,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
  mobileVisual = false,
  eagerImage = false,
}: RobotCardProps) {
  const toCardFactItem = (fact: CatalogFact): CardFactItem => ({
    key: fact.key,
    label: fact.label,
    value: fact.href ? (
      <Link
        href={fact.href}
        className="pointer-events-auto underline underline-offset-2 hover:text-muted-foreground"
        aria-label={`${item.name}の価格を問い合わせる`}
      >
        {fact.value}
      </Link>
    ) : fact.value,
    valueClassName: fact.href ? 'overflow-visible' : undefined,
  });
  const cardFacts: CardFactItems = [
    toCardFactItem(item.facts[0]),
    toCardFactItem(item.facts[1]),
    toCardFactItem(item.facts[2]),
    toCardFactItem(item.facts[3]),
  ];

  return (
    <div
      data-catalog-item
      className={cn(
        "robot-card group relative isolate flex flex-col h-full overflow-hidden border transition-[border-color,box-shadow,filter,opacity] duration-300",
        "border-border bg-card text-card-foreground",
        "hover:border-ring hover:shadow-lg",
      )}
    >
      <CardHoverEffects />

      {showFavorite && (
        <button
          type="button"
          aria-label={
            isFavorite
              ? uiText.favorites.ariaRemove(item.name)
              : uiText.favorites.ariaAdd(item.name)
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteToggle?.(item.id);
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
          item.image ? (
            <div className="relative h-full w-full">
              {/* ぼかし背景: 余白をニュートラルに埋める */}
              <Image
                src={item.image.src}
                alt=""
                aria-hidden="true"
                fill
                loading={eagerImage ? 'eager' : 'lazy'}
                sizes={sizes}
                className="pointer-events-none scale-110 select-none object-cover blur-2xl brightness-75 saturate-150"
              />
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                loading={eagerImage ? 'eager' : 'lazy'}
                sizes={sizes}
                className="z-10 object-contain"
              />
            </div>
          ) : (
            <>
              <CameraOff className="w-6 h-6 mb-1.5 opacity-20" />
              <span className="text-xs text-muted-foreground/90">
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
                <Link href={item.href} className="hover:underline">
                  {item.name}
                </Link>
              </h3>
            </div>
            {hideManufacturer ? null : (
              <div className="inline-block pointer-events-none md:pointer-events-auto">
                <ManufacturerLogoName
                  name={item.manufacturer.name}
                  resolvedLogo={item.manufacturer}
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
              <Link href={item.href} className="hover:underline">
                {item.name}
              </Link>
            </h3>
            <dl className="mt-1.5 text-[11px]">
              <div>
                <dt className="text-muted-foreground/80">{uiText.robots.deploymentStage}</dt>
                <dd className={cn('font-medium', getVisualToneTextClassName(item.stage.tone))}>
                  {item.stage.label}
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
                  <Link href={item.href} className="hover:underline">
                    {item.name}
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

      <Link
        href={item.href}
        className="absolute inset-0 z-10"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
