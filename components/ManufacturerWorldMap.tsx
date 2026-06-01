import DottedMap from 'dotted-map';
import { ManufacturerMapStage } from '@/components/ManufacturerMapStage';
import type { ManufacturerMarker } from '@/components/ManufacturerMapCopy';

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

// 同一/近接座標のドットが重ならない範囲で最小限だけ離す（実座標になるべく近づける）。
// 投影後のSVG座標空間で処理（map.image は縦横が等倍pxなので等方的に扱える）。
const HQ_MIN = 1.9; // HQドット同士の最小間隔（SVG単位, height=100基準）。小さいほど実座標に忠実。
const ARC_END_MIN = 2.6; // 導入先ドット/ラベルが HQドットに被らないための最小距離。

type Pt = { x: number; y: number };

// points 同士を相互に反発させて minDist を確保する。
function deOverlap(points: Pt[], minDist: number) {
  for (let iter = 0; iter < 80; iter += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        let dx = points[j].x - points[i].x;
        let dy = points[j].y - points[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= minDist) continue;
        if (dist < 1e-6) {
          const angle = i * 2.399963229728653; // 完全一致は黄金角で決定的に分離
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        const push = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        points[i].x -= ux * push;
        points[i].y -= uy * push;
        points[j].x += ux * push;
        points[j].y += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
}

// movable を fixed（動かさない）と movable同士から minDist だけ離す。導入先ドットの被り回避用。
function pushAway(movable: Pt[], fixed: Pt[], minDist: number) {
  for (let iter = 0; iter < 60; iter += 1) {
    let moved = false;
    for (let m = 0; m < movable.length; m += 1) {
      for (let f = 0; f < fixed.length; f += 1) {
        let dx = movable[m].x - fixed[f].x;
        let dy = movable[m].y - fixed[f].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= minDist) continue;
        if (dist < 1e-6) {
          const angle = (m + f) * 2.399963229728653;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        const push = minDist - dist;
        movable[m].x += (dx / dist) * push;
        movable[m].y += (dy / dist) * push;
        moved = true;
      }
    }
    deOverlap(movable, minDist); // movable同士も離す
    if (!moved) break;
  }
}

// Server Component。dotted-map（背景SVG生成＋getPin投影）はビルド時に実行され、
// クライアントへは静的SVGと算出済みの座標のみを渡す。
// 操作（ホバー/フォーカス/自動デモ）と弧アニメは子のクライアントコンポーネントが担当する。
export function ManufacturerWorldMap({ manufacturers, heading, subcopy }: ManufacturerWorldMapProps) {
  const map = new DottedMap({ height: 100, grid: 'diagonal' });
  const { width, height } = map.image;

  const svgMap = map.getSVG({
    radius: 0.22,
    color: '#ffffff45', // ダーク背景に映える明るめのモノクロ点
    shape: 'circle',
    backgroundColor: 'transparent',
  });

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

  deOverlap(projected, HQ_MIN);
  const hqPoints: Pt[] = projected.map((p) => ({ x: p.x, y: p.y }));

  const markers: ManufacturerMarker[] = projected
    .map(({ input, x, y }) => {
      const hq = toPct(x, y);
      // 導入先を投影 → HQドット群に被らないよう離す
      const ends = (input.deployments ?? []).flatMap((d) => {
        const pin = map.getPin({ lat: d.lat, lng: d.lng });
        if (!pin) return [];
        return [{ x: pin.x, y: pin.y, customer: d.customer, status: d.status }];
      });
      pushAway(ends, hqPoints, ARC_END_MIN);
      const arcs = ends.map((e) => {
        const end = toPct(e.x, e.y);
        return { leftPct: end.leftPct, topPct: end.topPct, customer: e.customer, status: e.status };
      });
      return {
        slug: input.slug,
        name: input.name,
        country: input.country,
        foundedYear: input.foundedYear,
        logoSrc: input.logoSrc,
        leftPct: hq.leftPct,
        topPct: hq.topPct,
        arcs,
      } satisfies ManufacturerMarker;
    })
    .sort((a, b) => a.leftPct - b.leftPct);

  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`;

  return (
    <section className="relative w-full border-b border-neutral-200">
      <ManufacturerMapStage
        svgMap={svgDataUri}
        markers={markers}
        heading={heading}
        subcopy={subcopy}
      />
    </section>
  );
}
