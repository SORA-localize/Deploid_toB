import type { ImageAsset, ManufacturerLogos } from '@/data/types';
import { canDisplayAsset } from '@/lib/media';

export type ManufacturerLogoVariant = 'symbol' | 'wordmark' | 'combined';

export interface ResolvedManufacturerLogo {
  asset?: ImageAsset;
  /** assetがどの種別として解決されたか。表示側が「symbolしか無い＝ブランド判読不可」を検知するために返す */
  resolvedVariant?: ManufacturerLogoVariant;
}

/**
 * variantごとのfallback解決（docs/decisions/manufacturer-logo-usage-spec-v1.md）。
 *
 * 監査(2026-07-09)で見つかった2つの欠陥への対処を含む:
 * - 「存在する」ではなく「表示可能な」最初のアセットを返す。チェーン先頭が
 *   blocked/empty-src/本番でのprototype-onlyでも、後続の表示可能なアセットまで落ちる。
 * - `logos`を持つメーカーではlegacy `logo`をチェーンから除外する。legacyは種別未分類の
 *   1枚（中身がsymbolだったりwordmarkだったりする）で、combined扱いすると表示面ごとに
 *   違うロゴが出る不一致の温床になるため。logosが無いメーカーだけlegacyを使う。
 */
export function resolveManufacturerLogo(
  manufacturer: { logo?: ImageAsset; logos?: ManufacturerLogos },
  variant: ManufacturerLogoVariant,
): ResolvedManufacturerLogo {
  const { logo, logos } = manufacturer;

  const candidates: Array<[ManufacturerLogoVariant, ImageAsset | undefined]> = logos
    ? variant === 'symbol'
      ? [
          ['symbol', logos.symbol],
          ['combined', logos.combined],
          ['wordmark', logos.wordmark],
        ]
      : variant === 'wordmark'
        ? [
            ['wordmark', logos.wordmark],
            ['combined', logos.combined],
            ['symbol', logos.symbol],
          ]
        : [
            ['combined', logos.combined],
            ['wordmark', logos.wordmark],
            ['symbol', logos.symbol],
          ]
    : [['combined', logo]];

  for (const [resolvedVariant, asset] of candidates) {
    if (canDisplayAsset(asset)) {
      return { asset, resolvedVariant };
    }
  }
  return {};
}

/** @deprecated resolveManufacturerLogo を使う。旧シグネチャの後方互換のみ */
export function getManufacturerLogoAsset(
  manufacturer: { logo?: ImageAsset; logos?: ManufacturerLogos },
  variant: ManufacturerLogoVariant,
): ImageAsset | undefined {
  return resolveManufacturerLogo(manufacturer, variant).asset;
}
