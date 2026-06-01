'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl, {
  type GeoJSONSource,
  type LngLatLike,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import { RotateCcw } from 'lucide-react';
import {
  manufacturerClusterCountLayerId,
  manufacturerClusterLayerId,
  manufacturerLabelLayerId,
  manufacturerMapBounds,
  manufacturerMapInitialView,
  manufacturerMapSourceId,
  manufacturerPointHaloLayerId,
  manufacturerPointLayerId,
  type ManufacturerFeatureProperties,
  type ManufacturerMapPoint,
  toManufacturerFeatureCollection,
} from '@/lib/manufacturer-map';

interface ManufacturerMapProps {
  points: ManufacturerMapPoint[];
}

interface ActiveManufacturer extends ManufacturerFeatureProperties {
  x: number;
  y: number;
}

const manufacturerMapStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    cartoDark: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'manufacturer-map-background',
      type: 'background',
      paint: {
        'background-color': '#050505',
      },
    },
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'cartoDark',
      paint: {
        'raster-opacity': 0.74,
      },
    },
  ],
};

function getFeatureProperties(event: MapLayerMouseEvent): ManufacturerFeatureProperties | null {
  const properties = event.features?.[0]?.properties;
  if (!properties) {
    return null;
  }

  return {
    slug: String(properties.slug),
    name: String(properties.name),
    country: String(properties.country),
    presenceLabel: String(properties.presenceLabel),
  };
}

export function ManufacturerMap({ points }: ManufacturerMapProps) {
  const router = useRouter();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeManufacturer, setActiveManufacturer] = useState<ActiveManufacturer | null>(null);
  const countriesCount = useMemo(() => new Set(points.map((point) => point.country)).size, [points]);
  const featureCollection = useMemo(() => toManufacturerFeatureCollection(points), [points]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: manufacturerMapStyle,
      center: manufacturerMapInitialView.center,
      zoom: manufacturerMapInitialView.zoom,
      minZoom: 0.7,
      maxZoom: 8,
      maxBounds: manufacturerMapBounds,
      attributionControl: false,
      cooperativeGestures: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.addSource(manufacturerMapSourceId, {
        type: 'geojson',
        data: featureCollection,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 3,
      });

      map.addLayer({
        id: manufacturerClusterLayerId,
        type: 'circle',
        source: manufacturerMapSourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0f766e',
          'circle-radius': ['step', ['get', 'point_count'], 20, 4, 25, 8, 31],
          'circle-stroke-color': '#99f6e4',
          'circle-stroke-opacity': 0.65,
          'circle-stroke-width': 1,
          'circle-opacity': 0.78,
        },
      });

      map.addLayer({
        id: manufacturerClusterCountLayerId,
        type: 'symbol',
        source: manufacturerMapSourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Semibold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      map.addLayer({
        id: manufacturerPointHaloLayerId,
        type: 'circle',
        source: manufacturerMapSourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#2dd4bf',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 8, 4, 16, 8, 22],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.18, 5, 0.1],
          'circle-stroke-color': '#2dd4bf',
          'circle-stroke-opacity': 0.5,
          'circle-stroke-width': 1,
        },
      });

      map.addLayer({
        id: manufacturerPointLayerId,
        type: 'circle',
        source: manufacturerMapSourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#2dd4bf',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 4, 6, 8, 8],
          'circle-stroke-color': '#ecfeff',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 1, 1, 6, 2],
          'circle-opacity': 0.94,
        },
      });

      map.addLayer({
        id: manufacturerLabelLayerId,
        type: 'symbol',
        source: manufacturerMapSourceId,
        filter: ['!', ['has', 'point_count']],
        minzoom: 3.4,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3.4, 10, 7, 13],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#f5f5f5',
          'text-halo-color': '#050505',
          'text-halo-width': 1.2,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 3.3, 0, 4, 1],
        },
      });

      map.on('mouseenter', manufacturerPointLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', manufacturerPointLayerId, () => {
        map.getCanvas().style.cursor = '';
        setActiveManufacturer(null);
      });

      map.on('mousemove', manufacturerPointLayerId, (event) => {
        const properties = getFeatureProperties(event);
        if (!properties) {
          return;
        }

        setActiveManufacturer({
          ...properties,
          x: event.point.x,
          y: event.point.y,
        });
      });

      map.on('click', manufacturerPointLayerId, (event) => {
        const properties = getFeatureProperties(event);
        if (properties) {
          router.push(`/manufacturers/${properties.slug}`);
        }
      });

      map.on('mouseenter', manufacturerClusterLayerId, () => {
        map.getCanvas().style.cursor = 'zoom-in';
      });

      map.on('mouseleave', manufacturerClusterLayerId, () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', manufacturerClusterLayerId, async (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource(manufacturerMapSourceId) as GeoJSONSource | undefined;

        if (typeof clusterId !== 'number' || !source) {
          return;
        }

        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: event.lngLat as LngLatLike,
          zoom: Math.min(zoom + 0.4, 8),
          duration: 650,
        });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [featureCollection, router]);

  return (
    <div className="relative h-[460px] overflow-hidden border border-white/10 bg-neutral-950 shadow-2xl shadow-neutral-950/25 md:h-[560px]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-4 top-4 z-10 grid grid-cols-2 overflow-hidden border border-white/10 bg-neutral-950/78 text-white backdrop-blur">
        <div className="px-4 py-3">
          <p className="text-xl font-semibold leading-none">{points.length}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">Manufacturers</p>
        </div>
        <div className="border-l border-white/10 px-4 py-3">
          <p className="text-xl font-semibold leading-none">{countriesCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">Countries</p>
        </div>
      </div>

      <button
        type="button"
        aria-label="地図表示を初期位置に戻す"
        title="Reset map"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-white/10 bg-neutral-950/78 text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        onClick={() => {
          mapRef.current?.easeTo({
            center: manufacturerMapInitialView.center,
            zoom: manufacturerMapInitialView.zoom,
            pitch: 0,
            bearing: 0,
            duration: 600,
          });
        }}
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {activeManufacturer && (
        <div
          className="pointer-events-none absolute z-10 max-w-[280px] border border-white/15 bg-neutral-950/92 px-3 py-2 text-xs text-white shadow-xl shadow-black/30 backdrop-blur"
          style={{
            left: `clamp(16px, ${activeManufacturer.x + 16}px, calc(100% - 296px))`,
            top: `clamp(72px, ${activeManufacturer.y - 12}px, calc(100% - 96px))`,
          }}
        >
          <p className="font-medium">{activeManufacturer.name}</p>
          <p className="mt-1 text-white/55">
            {activeManufacturer.country}・{activeManufacturer.presenceLabel}
          </p>
        </div>
      )}
    </div>
  );
}
