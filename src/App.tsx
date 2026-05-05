import React, { useState, useEffect, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary, Pin } from '@vis.gl/react-google-maps';
import { Building2, MapPin, Coffee, Utensils, ShoppingBag, AlertTriangle, Star, Navigation } from 'lucide-react';
import { DUMMY_PROPERTIES, type PropertyListing } from './data';

// Read the API Key from Vite's environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Helper to render icon based on type
const getAmenityIcon = (type: string) => {
  if (type.includes('restaurant') || type.includes('food')) return <Utensils size={18} />;
  if (type.includes('cafe')) return <Coffee size={18} />;
  if (type.includes('store') || type.includes('shopping')) return <ShoppingBag size={18} />;
  return <MapPin size={18} />;
};

const MapContent: React.FC<{
  selectedProperty: PropertyListing | null;
  onPropertySelect: (prop: PropertyListing) => void;
  amenities: any[];
  setAmenities: (amenities: any[]) => void;
  selectedAmenity: any | null;
  setSelectedAmenity: (amenity: any | null) => void;
  setIsLoading: (loading: boolean) => void;
  setRouteInfo: (info: { distance: string; duration: string } | null) => void;
}> = ({ selectedProperty, onPropertySelect, amenities, setAmenities, selectedAmenity, setSelectedAmenity, setIsLoading, setRouteInfo }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize DirectionsRenderer once
  useEffect(() => {
    if (map && routesLib && !directionsRendererRef.current) {
      directionsRendererRef.current = new routesLib.DirectionsRenderer({
        map,
        suppressMarkers: true, // We draw our own markers
        polylineOptions: {
          strokeColor: '#818cf8',
          strokeWeight: 5,
        }
      });
    }
  }, [map, routesLib]);

  const fetchNearbyAmenities = useCallback(async (location: google.maps.LatLngLiteral) => {
    if (!placesLib || !map) return;

    setIsLoading(true);
    try {
      // Use the New Places API class
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

      const request = {
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'primaryType', 'rating', 'userRatingCount'],
        locationRestriction: {
          center: location,
          radius: 1000,
        },
        includedPrimaryTypes: ['restaurant', 'cafe', 'park', 'supermarket', 'school', 'hospital', 'gym', 'bakery'],
        maxResultCount: 15,
      };

      const { places } = await Place.searchNearby(request);
      setAmenities(places || []);
    } catch (error) {
      console.error("New Places API Search failed:", error);
      setAmenities([]);
    }
    setIsLoading(false);
  }, [placesLib, map, setAmenities, setIsLoading]);

  const calculateRoute = useCallback((property: PropertyListing, amenity: any) => {
    if (!routesLib || !directionsRendererRef.current) return;

    const directionsService = new routesLib.DirectionsService();

    // Amenity location might be a function or object depending on the API result
    const destinationLocation = amenity.location;

    directionsService.route({
      origin: { lat: property.lat, lng: property.lng },
      destination: destinationLocation,
      travelMode: google.maps.TravelMode.WALKING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRendererRef.current?.setDirections(result);
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || ''
        });
      } else {
        console.error("Directions request failed due to " + status);
        setRouteInfo(null);
      }
    });
  }, [routesLib, setRouteInfo]);

  // When property changes, fetch new amenities and clear route
  useEffect(() => {
    if (selectedProperty && map) {
      const location = { lat: selectedProperty.lat, lng: selectedProperty.lng };
      map.panTo(location);
      map.setZoom(15);
      fetchNearbyAmenities(location);

      setSelectedAmenity(null);
      setRouteInfo(null);
      directionsRendererRef.current?.setDirections({ routes: [] }); // clear route
    }
  }, [selectedProperty, map, fetchNearbyAmenities, setSelectedAmenity, setRouteInfo]);

  // When amenity changes, calculate route
  useEffect(() => {
    if (selectedProperty && selectedAmenity) {
      calculateRoute(selectedProperty, selectedAmenity);
    }
  }, [selectedProperty, selectedAmenity, calculateRoute]);

  return (
    <Map
      defaultCenter={{ lat: 47.3769, lng: 8.5417 }} // Default Zurich
      defaultZoom={12}
      mapId="DEMO_MAP_ID" // Requires a Map ID in GCP for AdvancedMarkers
      disableDefaultUI={true}
    >
      {/* Property Markers */}
      {DUMMY_PROPERTIES.map((prop) => (
        <AdvancedMarker
          key={prop.id}
          position={{ lat: prop.lat, lng: prop.lng }}
          onClick={() => onPropertySelect(prop)}
          zIndex={selectedProperty?.id === prop.id ? 100 : 1}
        >
          <Pin
            background={selectedProperty?.id === prop.id ? '#c084fc' : '#6366f1'}
            borderColor="#ffffff"
            glyphColor="#ffffff"
          />
        </AdvancedMarker>
      ))}

      {/* Amenity Markers */}
      {amenities.map((place) => {
        // location from Place object might be LatLng object, use as is
        if (!place.location) return null;
        const isSelected = selectedAmenity?.id === place.id;

        return (
          <AdvancedMarker
            key={place.id}
            position={place.location}
            onClick={() => setSelectedAmenity(place)}
            zIndex={isSelected ? 50 : 10}
          >
            <div className={`amenity-marker ${isSelected ? 'active' : ''}`}>
              {isSelected ? <Navigation size={12} /> : ''}
            </div>
          </AdvancedMarker>
        );
      })}
    </Map>
  );
};

export default function App() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<any | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Property Listings</h1>
          <p>Select a property and amenity to see the route</p>
        </div>

        <div className="list-container">
          <div className="section-title">
            <Building2 size={16} />
            Our Properties (EU)
          </div>

          {DUMMY_PROPERTIES.map((prop) => (
            <div
              key={prop.id}
              className={`card ${selectedProperty?.id === prop.id ? 'active' : ''}`}
              onClick={() => setSelectedProperty(prop)}
            >
              <div className="card-title">
                {prop.name}
                <span className="badge">{prop.price}</span>
              </div>
              <div className="card-subtitle">
                <MapPin size={14} /> {prop.address}
              </div>
            </div>
          ))}

          {selectedProperty && (
            <div style={{ marginTop: '24px' }}>
              <div className="section-title">
                <Coffee size={16} />
                Nearby Amenities (1km)
              </div>

              {isLoading ? (
                <div className="loader"></div>
              ) : amenities.length > 0 ? (
                amenities.map((place) => {
                  const isSelected = selectedAmenity?.id === place.id;

                  return (
                    <div
                      key={place.id}
                      className={`amenity-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedAmenity(place)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="amenity-icon">
                        {getAmenityIcon(place.primaryType || '')}
                      </div>
                      <div className="amenity-info" style={{ flex: 1 }}>
                        <h4>{place.displayName || place.name || 'Unknown Place'}</h4>
                        <p>{place.formattedAddress}</p>
                        {place.rating && (
                          <div className="rating">
                            <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                            {place.rating} ({place.userRatingCount})
                          </div>
                        )}

                        {/* Route Info injected here when selected */}
                        {isSelected && routeInfo && (
                          <div className="route-info">
                            <Navigation size={14} color="#818cf8" />
                            <span style={{ color: '#818cf8', fontWeight: 600 }}>{routeInfo.distance}</span>
                            <span style={{ color: 'var(--text-muted)' }}> (Walk: {routeInfo.duration})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                  No amenities found. Ensure your API key has "Places API (New)" enabled.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAP AREA */}
      <div className="map-container">
        {!GOOGLE_MAPS_API_KEY ? (
          <div className="api-key-warning">
            <AlertTriangle size={24} />
            <div>
              <div style={{ fontWeight: 'bold' }}>Missing API Key</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                Please create a .env file and add VITE_GOOGLE_MAPS_API_KEY
              </div>
            </div>
          </div>
        ) : null}

        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="beta">
          <MapContent
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            amenities={amenities}
            setAmenities={setAmenities}
            selectedAmenity={selectedAmenity}
            setSelectedAmenity={setSelectedAmenity}
            setIsLoading={setIsLoading}
            setRouteInfo={setRouteInfo}
          />
        </APIProvider>
      </div>
    </div>
  );
}
