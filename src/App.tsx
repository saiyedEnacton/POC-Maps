import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary, Pin } from '@vis.gl/react-google-maps';
import { Building2, MapPin, Coffee, Utensils, ShoppingBag, AlertTriangle, Star } from 'lucide-react';
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

// Inner component that handles the map logic
const MapContent: React.FC<{
  selectedProperty: PropertyListing | null;
  onPropertySelect: (prop: PropertyListing) => void;
  setAmenities: (amenities: google.maps.places.PlaceResult[]) => void;
  setIsLoading: (loading: boolean) => void;
}> = ({ selectedProperty, onPropertySelect, setAmenities, setIsLoading }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const fetchNearbyAmenities = useCallback((location: google.maps.LatLngLiteral) => {
    if (!placesLib || !map) return;
    
    setIsLoading(true);
    
    const service = new placesLib.PlacesService(map);
    const request = {
      location,
      radius: 1000, // 1km radius
      type: 'restaurant' // default type, could be expanded
    };

    service.nearbySearch(request, (results, status) => {
      if (status === placesLib.PlacesServiceStatus.OK && results) {
        setAmenities(results.slice(0, 10)); // limit to top 10 for POC
      } else {
        setAmenities([]);
      }
      setIsLoading(false);
    });
  }, [placesLib, map, setAmenities, setIsLoading]);

  useEffect(() => {
    if (selectedProperty && map) {
      const location = { lat: selectedProperty.lat, lng: selectedProperty.lng };
      map.panTo(location);
      map.setZoom(15);
      fetchNearbyAmenities(location);
    } else {
      setAmenities([]);
    }
  }, [selectedProperty, map, fetchNearbyAmenities]);

  return (
    <Map
      defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
      defaultZoom={12}
      mapId="DEMO_MAP_ID" // Requires a Map ID in GCP for AdvancedMarkers
      disableDefaultUI={true}
    >
      {/* Render Dummy Properties */}
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
    </Map>
  );
};

export default function App() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [amenities, setAmenities] = useState<google.maps.places.PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Property Listings</h1>
          <p>Select a property to explore nearby amenities</p>
        </div>

        <div className="list-container">
          <div className="section-title">
            <Building2 size={16} />
            Our Properties
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
                amenities.map((place, index) => (
                  <div key={place.place_id || index} className="amenity-card">
                    <div className="amenity-icon">
                      {getAmenityIcon(place.types?.[0] || '')}
                    </div>
                    <div className="amenity-info">
                      <h4>{place.name}</h4>
                      <p>{place.vicinity}</p>
                      {place.rating && (
                        <div className="rating">
                          <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                          {place.rating} ({place.user_ratings_total})
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                  No amenities found. Ensure your API key is valid.
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
                Please add your Google Maps API Key in App.tsx
              </div>
            </div>
          </div>
        ) : null}

        {/* APIProvider handles script loading */}
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <MapContent 
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            setAmenities={setAmenities}
            setIsLoading={setIsLoading}
          />
        </APIProvider>
      </div>
    </div>
  );
}
