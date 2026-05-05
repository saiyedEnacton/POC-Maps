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
    name: 'Luxury Lakefront Apartment',
    address: 'Seefeldstrasse 123, Zurich, Switzerland',
    lat: 47.3552,
    lng: 8.5520,
    price: 'CHF 3.5M',
    type: 'Apartment'
  },
  {
    id: 'p2',
    name: 'Historic Altstadt Loft',
    address: 'Niederdorfstrasse 45, Zurich, Switzerland',
    lat: 47.3744,
    lng: 8.5445,
    price: 'CHF 1.8M',
    type: 'Loft'
  },
  {
    id: 'p3',
    name: 'Modern Mitte Penthouse',
    address: 'Friedrichstraße 200, Berlin, Germany',
    lat: 52.5085,
    lng: 13.3886,
    price: '€ 2.2M',
    type: 'Penthouse'
  }
];
