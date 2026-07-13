import Image from 'next/image';
import { CameraOff } from 'lucide-react';
import type { ImageAsset, ManufacturerLogos } from '@/data/types';
import { getLogoBoxSize } from '@/lib/manufacturerLogoAspect';
import { resolveManufacturerLogo, type ManufacturerLogoVariant } from '@/lib/manufacturerLogo';

interface ManufacturerLogoNameProps {
  name: string;
  /** @deprecated logos を渡すこと。単発の logo だけ渡された場合は combined 相当として扱う */
  logo?: ImageAsset;
  logos?: ManufacturerLogos;
  /** どの種別を表示したいか。fallback順は lib/manufacturerLogo.ts 参照 */
  variant?: ManufacturerLogoVariant;
  className?: string;
  /** ロゴ枠の目標「面積」(px^2)。ワードマーク型は横長・低め、シンボル型は正方形・
   * やや高めに自動配分され、見た目の文字サイズがおおよそ揃う */
  targetAreaPx?: number;
  minHeightPx?: number;
  maxHeightPx?: number;
  maxWidthPx?: number;
  textClassName?: string;
  showPlaceholder?: boolean;
  /** trueの場合、ロゴ横の社名テキストを「視覚的に」表示しない（ロゴマークのみ）。
   *  表示可能なロゴが無い場合だけは指定があっても社名を視覚表示する
   *  （何も表示するものが無くなるため）。視覚的に隠す場合も sr-only で
   *  アクセシブルネームは常に保持する。 */
  hideName?: boolean;
}

export function ManufacturerLogoName({
  name,
  logo,
  logos,
  variant = 'combined',
  className = '',
  targetAreaPx = 20 * 70,
  minHeightPx = 14,
  maxHeightPx = 40,
  maxWidthPx = 96,
  textClassName = '',
  showPlaceholder = true,
  hideName = false,
}: ManufacturerLogoNameProps) {
  const { asset: displayLogo, resolvedVariant } = resolveManufacturerLogo({ logo, logos }, variant);
  const { heightPx, widthPx } = getLogoBoxSize(displayLogo?.aspectRatio, targetAreaPx, {
    minHeightPx,
    maxHeightPx,
    maxWidthPx,
  });

  // 名前を読ませたい面（combined/wordmark要求）で symbol しか解決できなかった場合は、
  // hideName 指定があっても社名を視覚表示する（symbol単体では会社を判読できないため。監査A）。
  const symbolOnlyFallback = resolvedVariant === 'symbol' && variant !== 'symbol';
  const nameVisible = !hideName || !displayLogo || symbolOnlyFallback;

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      {displayLogo ? (
        <span
          // 枠・背景なし。ロゴ自体の透過をそのまま活かす。
          className="relative inline-block shrink-0"
          style={{ height: heightPx, width: widthPx }}
          title={displayLogo.credit}
        >
          <Image
            src={displayLogo.src}
            alt=""
            aria-hidden="true"
            fill
            sizes="120px"
            className="object-contain object-left"
          />
        </span>
      ) : showPlaceholder ? (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground/70"
          style={{ height: heightPx, width: Math.min(widthPx, heightPx) }}
          title="Official logo requested"
        >
          <CameraOff className="h-2.5 w-2.5" />
        </span>
      ) : null}
      {nameVisible ? (
        <span className={`min-w-0 truncate ${textClassName}`}>{name}</span>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </span>
  );
}
