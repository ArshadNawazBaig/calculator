import {roadPoint, type RoadTrip} from '@/lib/data/road-routing';
import {metric as m, type Result, type Values} from './types';

export async function mapRequest<T>(body: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch('/api/road-route', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(16000)}); }
  catch { throw Error('The map service could not be reached. Check your connection and try again.'); }
  const data = await response.json();
  if (!response.ok) throw Error(typeof data?.error === 'string' ? data.error : 'The map service is temporarily unavailable.');
  return data as T;
}

export async function runRoadRoute(v: Values): Promise<Result> {
  if (!['places', 'coordinates'].includes(v.locationInput)) throw Error('Select a supported location input.');
  const point = (i: number) => {
    const prefix = v.locationInput === 'places' ? 'place' : '';
    const lat = v[`${prefix}lat${i}`], lon = v[`${prefix}lon${i}`];
    if (!lat?.trim() || !lon?.trim()) throw Error('Search for and select both route locations.');
    return roadPoint({lat: Number(lat), lon: Number(lon)});
  };
  const data = await mapRequest<RoadTrip>({kind: 'route', from: point(1), to: point(2)});
  if (![data.meters, data.seconds].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) || data.snapped?.length !== 2) throw Error('The routing service returned an incomplete route.');
  return {metrics: [m('Driving distance', data.meters / 1609.344, 'number', 'miles'), m('Driving distance in kilometers', data.meters / 1000, 'number', 'km'), m('Estimated driving time', data.seconds / 60, 'number', 'minutes')], table: {headers: ['Endpoint', 'Road latitude', 'Road longitude', 'Distance to matched road (m)'], rows: data.snapped.map((p, i) => [i === 0 ? 'Origin' : 'Destination', p.lat, p.lon, p.distance])}, notes: ['Road routing uses OpenStreetMap data. Travel time excludes live traffic and stops; the recommended driving route may not be the shortest-distance route.', 'Endpoints are matched to roads within 1 km. Check the matched coordinates and distances, especially when selecting a town or large place. No straight-line fallback is substituted when routing fails.']};
}
