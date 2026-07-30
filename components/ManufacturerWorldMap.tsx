import DottedMap from 'dotted-map';
import { ManufacturerMapStage } from '@/components/ManufacturerMapStage';
import type { MapPoint } from '@/components/ManufacturerMapCopy';
import {
  ARC_END_MIN_DISTANCE,
  clusterProjectedManufacturers,
  pushAway,
  type Point,
} from '@/lib/worldMap';

export interface ManufacturerDeploymentInput {
  lat: number;
  lng: number;
  customer: string;
  status: string;
}

export interface ManufacturerMapInput {
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  foundedYear?: number;
  /** メーカーのワードマークロゴ（カード下段用） */
  logoSrc?: string;
  /** 導入事例（弧の終点） */
  deployments?: ManufacturerDeploymentInput[];
}

interface ManufacturerWorldMapProps {
  manufacturers: ManufacturerMapInput[];
  heading: string;
  subcopy: string;
}

// 背景SVGはビルド時に scripts/generate-world-map-asset.mjs が public/generated/world-map.svg
// へ書き出す固定アセット。ここでは同じ DottedMap インスタンスを本社/導入先座標の投影にのみ使う。
// 近接する本社は「クラスタ（1点に集約）」する＝座標精度を保ちつつ重なり回避。クラスタリングと
// 反発計算のロジックは lib/worldMap.ts の pure function に委譲する。

// Server Component。dotted-map（getPin投影）はビルド時に実行され、
// クライアントへは固定パスの背景SVGと算出済みの座標のみを渡す。
// 操作（ホバー/フォーカス/自動デモ）と弧アニメは子のクライアントコンポーネントが担当する。
export function ManufacturerWorldMap({ manufacturers, heading, subcopy }: ManufacturerWorldMapProps) {
  const map = new DottedMap({ height: 100, grid: 'diagonal' });
  const { width, height } = map.image;

  const toPct = (x: number, y: number) => ({
    leftPct: (x / width) * 100,
    topPct: (y / height) * 100,
  });

  const projected = manufacturers
    .map((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      return pin ? { input: m, x: pin.x, y: pin.y } : null;
    })
    .filter((p): p is { input: ManufacturerMapInput; x: number; y: number } => p !== null);

  // 近接する本社を1クラスタに集約する（slug固有の特例なし・順序非依存）。
  const clusters = clusterProjectedManufacturers(
    projected.map((entry) => ({
      ...entry,
      slug: entry.input.slug,
    })),
  );

  const clusterCenters: Point[] = clusters.map((members) => ({
    x: members.reduce((sum, m) => sum + m.x, 0) / members.length,
    y: members.reduce((sum, m) => sum + m.y, 0) / members.length,
  }));

  const points: MapPoint[] = clusters
    .map((members, index) => {
      const { x, y } = clusterCenters[index];
      const ctr = toPct(x, y);
      // クラスタ内全社の導入先を投影 → クラスタ点群に被らないよう離す
      const ends = members.flatMap((it) =>
        (it.input.deployments ?? []).flatMap((d) => {
          const pin = map.getPin({ lat: d.lat, lng: d.lng });
          if (!pin) return [];
          return [
            {
              x: pin.x,
              y: pin.y,
              customer: d.customer,
              status: d.status,
              manufacturerSlug: it.input.slug,
            },
          ];
        }),
      );
      const pushedEnds = pushAway(ends, clusterCenters, ARC_END_MIN_DISTANCE);
      const arcs = pushedEnds.map((e) => {
        const end = toPct(e.x, e.y);
        return {
          leftPct: end.leftPct,
          topPct: end.topPct,
          customer: e.customer,
          status: e.status,
          manufacturerSlug: e.manufacturerSlug,
        };
      });
      const memberInfos = members.map((it) => ({
        slug: it.input.slug,
        name: it.input.name,
        country: it.input.country,
        foundedYear: it.input.foundedYear,
        logoSrc: it.input.logoSrc,
      }));
      return {
        id: memberInfos.map((m) => m.slug).join('+'),
        leftPct: ctr.leftPct,
        topPct: ctr.topPct,
        members: memberInfos,
        arcs,
      } satisfies MapPoint;
    })
    .sort((a, b) => a.leftPct - b.leftPct);

  return (
    <section className="relative w-full border-b border-border">
      <ManufacturerMapStage
        svgMap="/generated/world-map.svg"
        points={points}
        heading={heading}
        subcopy={subcopy}
      />
    </section>
  );
}
