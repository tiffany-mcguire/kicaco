export interface LocationResult {
  id: string;
  name: string;
  address: string;
  placeId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Mock data for development - replace with actual Google Places API integration
const mockLocations: LocationResult[] = [
  { id: '1', name: 'Westfield Shopping Center', address: '123 Main St, Anytown, ST 12345' },
  { id: '2', name: 'City Park Recreation Center', address: '456 Park Ave, Anytown, ST 12345' },
  { id: '3', name: 'Lincoln Elementary School', address: '789 School Rd, Anytown, ST 12345' },
  { id: '4', name: 'Memorial Sports Complex', address: '321 Sports Dr, Anytown, ST 12345' },
  { id: '5', name: 'Downtown Library', address: '654 Library Way, Anytown, ST 12345' },
  { id: '6', name: 'Community Health Center', address: '987 Health Blvd, Anytown, ST 12345' },
  { id: '7', name: 'Riverside Park', address: '147 River Rd, Anytown, ST 12345' },
  { id: '8', name: 'North High School', address: '258 Education St, Anytown, ST 12345' }
];

export const searchLocations = async (query: string): Promise<LocationResult[]> => {
  if (!query.trim()) {
    return [];
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock search - filter by name or address
  const results = mockLocations.filter(location => 
    location.name.toLowerCase().includes(query.toLowerCase()) ||
    location.address.toLowerCase().includes(query.toLowerCase())
  );

  return results.slice(0, 5); // Limit to 5 results
};

// TODO: Replace with actual Google Places API integration
export const searchWithGooglePlaces = async (query: string): Promise<LocationResult[]> => {
  // This would integrate with Google Places API
  // Example implementation:
  /*
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`);
  const data = await response.json();
  
  return data.results.map((place: any) => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    placeId: place.place_id,
    coordinates: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    }
  }));
  */
  
  // For now, use mock data
  return searchLocations(query);
};

export const formatLocationString = (location: LocationResult): string => {
  return `${location.name} - ${location.address}`;
}; 