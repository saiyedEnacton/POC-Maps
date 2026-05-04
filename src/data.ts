export interface PropertyListing {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  price: string;
  type: string;
}

export const DUMMY_PROPERTIES: PropertyListing[] = [
  {
    id: 'p1',
    name: 'Luxury Downtown Penthouse',
    address: '123 Main St, Metro City',
    lat: 40.7128,
    lng: -74.0060, // NYC coordinates as a placeholder
    price: '$2.5M',
    type: 'Penthouse'
  },
  {
    id: 'p2',
    name: 'Cozy Suburban Home',
    address: '456 Oak Ave, Westside',
    lat: 40.7282,
    lng: -73.9942, // Nearby coordinates
    price: '$850K',
    type: 'House'
  },
  {
    id: 'p3',
    name: 'Modern Tech Loft',
    address: '789 Innovation Dr, Silicon District',
    lat: 40.7580,
    lng: -73.9855, // Times Square area coordinates
    price: '$1.2M',
    type: 'Loft'
  }
];
