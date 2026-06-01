export interface ManufacturerMapPoint {
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
  lat: number;
  lng: number;
}

export interface ManufacturerFeatureProperties {
  slug: string;
  name: string;
  country: string;
  presenceLabel: string;
}

export interface ManufacturerFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: ManufacturerFeatureProperties;
}

export interface ManufacturerFeatureCollection {
  type: 'FeatureCollection';
  features: ManufacturerFeature[];
}

export const manufacturerMapSourceId = 'manufacturer-headquarters';
export const manufacturerClusterLayerId = 'manufacturer-clusters';
export const manufacturerClusterCountLayerId = 'manufacturer-cluster-count';
export const manufacturerPointHaloLayerId = 'manufacturer-point-halo';
export const manufacturerPointLayerId = 'manufacturer-points';
export const manufacturerLabelLayerId = 'manufacturer-labels';

export const manufacturerMapInitialView = {
  center: [135, 32] as [number, number],
  zoom: 1.35,
};

export const manufacturerMapBounds = [
  [-190, -72],
  [190, 82],
] as [[number, number], [number, number]];

export function toManufacturerFeatureCollection(points: ManufacturerMapPoint[]): ManufacturerFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        slug: point.slug,
        name: point.name,
        country: point.country,
        presenceLabel: point.presenceLabel,
      },
    })),
  };
}
