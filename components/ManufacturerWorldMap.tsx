import DottedMap from 'dotted-map';
import { ManufacturerMapOverlay, type ManufacturerMarker } from '@/components/ManufacturerMapOverlay';

export interface ManufacturerMapInput {
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
  lat: number;
  lng: number;
  /** メーカーロゴ（カード1段目用） */
  logoSrc?: string;
  /** 代表機種名（カード2段目用） */
  robotName?: string;
  /** 代表機種画像（カード2段目用） */
  robotImageSrc?: string;
}

interface ManufacturerWorldMapProps {
  manufacturers: ManufacturerMapInput[];
}

// Server Component。dotted-map（背景SVG生成＋getPin投影）はビルド時に実行され、
// クライアントへは静的SVGと算出済みの座標のみを渡す。
// 操作（ホバー/フォーカス/自動デモ）は子のクライアントコンポーネントが担当する。
export function ManufacturerWorldMap({ manufacturers }: ManufacturerWorldMapProps) {
  const map = new DottedMap({ height: 100, grid: 'diagonal' });
  const { width, height } = map.image;

  const svgMap = map.getSVG({
    radius: 0.22,
    color: '#00000026', // モノクロ・約15%不透明の点
    shape: 'circle',
    backgroundColor: 'transparent',
  });

  // ライブラリ自身の投影(getPin)で lat/lng → 背景と完全一致するピクセル座標へ変換。
  const markers: ManufacturerMarker[] = manufacturers
    .flatMap((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      if (!pin) return [];
      return [{
        slug: m.slug,
        name: m.name,
        country: m.country,
        presenceLabel: m.presenceLabel,
        logoSrc: m.logoSrc,
        robotName: m.robotName,
        robotImageSrc: m.robotImageSrc,
        leftPct: (pin.x / width) * 100,
        topPct: (pin.y / height) * 100,
      }];
    })
    // 経度の西→東順。登場アニメ／自動デモを地域順（米→欧→アジア）に進める。
    .sort((a, b) => a.leftPct - b.leftPct);

  return (
    <div className="relative w-full aspect-[2/1] select-none">
      {/* 背景：点描世界地図（モノクロ）。装飾なので操作対象外・スクリーンリーダー対象外 */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none h-full w-full object-contain opacity-80 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
      />

      <ManufacturerMapOverlay markers={markers} />
    </div>
  );
}
