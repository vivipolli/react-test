import { useCallback, useState, useMemo } from 'react';
import { 
  Map, 
  AdvancedMarker, 
  useMapsLibrary, 
  MapCameraChangedEvent, 
  APIProvider, 
  InfoWindow,
  CollisionBehavior
} from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPOIs } from '../store/poisSlice';
import { POI, POIResponse } from '../types/poi';
import debounce from 'lodash/debounce';

const getMarkerIcon = (type: string) => {
  const icons = {
    Marina: '⚓',
    Anchorage: '🔵',
    BoatRamp: '🚤',
    Other: '📍',
    default: '📍'
  };
  return icons[type as keyof typeof icons] || icons.default;
};

const MapComponent = () => {
  const mapsLibrary = useMapsLibrary('maps');
  const dispatch = useAppDispatch();
  const { pois, status } = useAppSelector((state) => state.pois) as unknown as { pois: POIResponse; status: string };
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [lastZoom, setLastZoom] = useState<number | null>(null);

  const filteredPOIs = useMemo(() => {
    if (!pois?.data?.items || !mapBounds) return [];
    return pois.data.items.filter(poi => 
      mapBounds.contains({ lat: poi.latitude, lng: poi.longitude })
    );
  }, [pois, mapBounds]);

  const markers = useMemo(() => {
    if (!filteredPOIs.length) return null;
    return filteredPOIs.map((poi) => (
      <AdvancedMarker
        key={poi.id}
        position={{ lat: poi.latitude, lng: poi.longitude }}
        onClick={() => setSelectedPOI(poi)}
        title={poi.name}
        collisionBehavior={CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL}
      >
        <div style={{ 
          fontSize: '24px',
          cursor: 'pointer',
          transform: 'translate(-50%, -100%)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          {getMarkerIcon(poi.poi_type)}
        </div>
      </AdvancedMarker>
    ));
  }, [filteredPOIs]);

  const debouncedFetchPOIs = useCallback(
    debounce((bounds: google.maps.LatLngBounds) => {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Ensure coordinates are within valid range
      const validNe = {
        lat: Math.min(ne.lat(), 90),
        lng: Math.min(ne.lng(), 180)
      };
      const validSw = {
        lat: Math.max(sw.lat(), -90),
        lng: Math.max(sw.lng(), -180)
      };

      dispatch(fetchPOIs({
        swLat: validSw.lat,
        swLng: validSw.lng,
        neLat: validNe.lat,
        neLng: validNe.lng,
      }));
    }, 500),
    [dispatch]
  );

  const handleBoundsChanged = useCallback((event: MapCameraChangedEvent) => {
    const map = event.map;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    if (!bounds || zoom === undefined) return;

    // Only update bounds and fetch if zoom level changed significantly
    if (!lastZoom || Math.abs(zoom - lastZoom) > 1) {
      setLastZoom(zoom);
      setMapBounds(bounds);
      debouncedFetchPOIs(bounds);
    }
  }, [debouncedFetchPOIs, lastZoom]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API Key is not defined in environment variables');
    return <div>Error: Google Maps API Key is not configured</div>;
  }

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {!mapsLibrary ? (
        <div>Loading Google Maps API...</div>
      ) : (
        <Map
          defaultZoom={6}
          defaultCenter={{ lat: 40.0, lng: -70.0 }}
          onCameraChanged={handleBoundsChanged}
          style={{ width: '100%', height: '100%' }}
          mapId={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          gestureHandling="greedy"
          mapTypeControl={true}
          minZoom={2}
          maxZoom={20}
        >
          {status === 'succeeded' && markers}
          {selectedPOI && (
            <InfoWindow
              position={{ lat: selectedPOI.latitude, lng: selectedPOI.longitude }}
              onCloseClick={() => setSelectedPOI(null)}
            >
              <div>
                <h3>{selectedPOI.name}</h3>
                <p>Type: {selectedPOI.poi_type}</p>
                <p>Coordinates: {selectedPOI.latitude.toFixed(4)}, {selectedPOI.longitude.toFixed(4)}</p>
                {selectedPOI.partner && <p>Partner: {selectedPOI.partner}</p>}
              </div>
            </InfoWindow>
          )}
        </Map>
      )}
    </div>
  );
};

const MapWithProvider = () => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
    <MapComponent />
  </APIProvider>
);

export default MapWithProvider; 