export interface POI {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  poi_type: string;
  partner: string;
  info: Record<string, any>;
  updated_at: string;
}

export interface POIResponse {
  status: string;
  data: {
    items: POI[];
  };
}

export interface POICache {
  [key: string]: {
    pois: POI[];
    lastUpdated: string;
    bounds: {
      swLat: number;
      swLng: number;
      neLat: number;
      neLng: number;
    };
  };
}

export interface POIState {
  pois: POIResponse;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  cache: POICache;
}

export interface POIBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
} 