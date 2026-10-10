import {mode, n, s, type Definition} from './types';

export const roadRouteDefinition: Definition = {
  slug: 'mileage-calculator',
  description: 'Find driving distance and estimated journey time between places or coordinates using OpenStreetMap roads.',
  modes: [mode('driving', 'Driving route', 'road-route', [
    s('locationInput', 'Choose locations by', [['places', 'Place search'], ['coordinates', 'Latitude and longitude']]),
    n('lat1', 'Origin latitude', 51.5074, '°', -90, 90), n('lon1', 'Origin longitude', -0.1278, '°', -180, 180),
    n('lat2', 'Destination latitude', 52.2053, '°', -90, 90), n('lon2', 'Destination longitude', 0.1218, '°', -180, 180),
  ], 'Road distance comes from a routed path on the OpenStreetMap road network; miles = meters / 1609.344.', 'Search for each location and select the intended match, or enter coordinates. Route calculation requires an internet connection. Place searches and route coordinates are sent to map providers through Finflo. Driving time excludes live traffic, stops and current road closures.')],
  sources: [
    {title: 'OpenStreetMap data and attribution', url: 'https://www.openstreetmap.org/copyright'},
    {title: 'FOSSGIS routing service', url: 'https://routing.openstreetmap.de/about.html'},
    {title: 'Nominatim place search', url: 'https://nominatim.org/'},
  ],
  notes: ['Choose a precise address or entrance when possible. A town-centre match can differ from your intended start or destination.'],
};
