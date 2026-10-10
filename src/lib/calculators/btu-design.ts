import climate from '@/data/btu-us-climate.json';
import envelope from '@/data/btu-envelope-presets.json';
import {num, nonnegative, positive, integer} from './helpers';
import {metric as m, type Result, type Values} from './types';

export const BTU_H_TO_W = 1055.05585262 / 3600;
export const IMPERIAL_U_TO_SI = BTU_H_TO_W / .09290304 * 1.8;
type County = [string, number, number, number];
const regions = climate.regions as unknown as Record<string, County[]>;

export function runBtuDesign(v: Values): Result {
  if (!['us', 'si'].includes(v.units) || !['heating', 'cooling'].includes(v.season) || !['room', 'building'].includes(v.space) || !['county', 'custom'].includes(v.climateInput)) throw Error('Select supported heat-transfer units and methods.');
  const us = v.units === 'us', heating = v.season === 'heating';
  const lengthScale = us ? .3048 : 1, areaScale = lengthScale ** 2, uScale = us ? IMPERIAL_U_TO_SI : 1;
  const toC = (value: number) => us ? (value - 32) * 5 / 9 : value;
  const indoorC = toC(num(v, 'indoor'));
  let outdoorC: number;
  let county: County | undefined;
  if (v.climateInput === 'county') {
    county = Object.hasOwn(regions, v.state) ? regions[v.state].find(row => `${v.state}|${row[0]}` === v.county) : undefined;
    if (!county) throw Error('Choose a county in the selected state or territory.');
    outdoorC = (county[heating ? 1 : 2] - 32) * 5 / 9;
  } else outdoorC = toC(num(v, 'outdoor'));
  // A cooling balance can lose heat to colder outdoor air; retain that signed
  // contribution until all gains have been summed. Heating never becomes cooling.
  const delta = heating ? Math.max(0, indoorC - outdoorC) : outdoorC - indoorC;
  const length = positive(num(v, 'length'), 'Footprint length') * lengthScale;
  const width = positive(num(v, 'width'), 'Footprint width') * lengthScale;
  const height = positive(num(v, 'height'), 'Ceiling height') * lengthScale;
  const stories = v.space === 'building' ? integer(num(v, 'stories'), 1, 100) : 1;
  const footprint = length * width, perimeter = 2 * (length + width);
  const exposed = v.space === 'building' ? perimeter : nonnegative(num(v, 'exposedWallLength'), 'Exterior wall length') * lengthScale;
  if (exposed > perimeter + 1e-8) throw Error('Exterior wall length cannot exceed the rectangular room perimeter.');
  const grossWall = exposed * height * stories;
  const windowArea = nonnegative(num(v, 'windowArea'), 'Window area') * areaScale;
  const doorArea = nonnegative(num(v, 'doorArea'), 'Door area') * areaScale;
  if (windowArea + doorArea > grossWall + 1e-8) throw Error('Window and door areas cannot exceed gross exterior wall area.');
  const ceilingArea = nonnegative(num(v, 'ceilingArea'), 'Ceiling area') * areaScale;
  const floorArea = nonnegative(num(v, 'floorArea'), 'Exposed floor area') * areaScale;
  const profile = envelope.profiles.find(p => p.id === v.envelope);
  if (v.envelope !== 'custom' && !profile) throw Error('Choose a supported envelope reference.');
  const u = (key: 'wall' | 'ceiling' | 'floor' | 'window') => profile ? profile[key] * IMPERIAL_U_TO_SI : positive(num(v, `${key}U`), 'Assembly U-value') * uScale;
  const surfaces: [string, number, number][] = [
    ['Opaque exterior walls', Math.max(0, grossWall - windowArea - doorArea), u('wall')],
    ['Vertical windows', windowArea, u('window')],
    ['Exterior doors', doorArea, positive(num(v, 'doorU'), 'Door U-value') * uScale],
    ['Exposed ceiling', ceilingArea, u('ceiling')],
    ['Floor above outdoor air', floorArea, u('floor')],
  ];
  const ua = surfaces.reduce((sum, [, area, value]) => sum + area * value, 0);
  const volume = footprint * height * stories;
  const airUa = positive(num(v, 'airCapacity'), 'Air heat capacity') * nonnegative(num(v, 'ach'), 'Outdoor air changes') * volume / 3600;
  const conduction = ua * delta, air = airUa * delta;
  const additional = heating ? nonnegative(num(v, 'additionalHeating'), 'Additional heating losses') : ['solarGain', 'internalGain', 'latentGain', 'otherCooling'].reduce((sum, key) => sum + nonnegative(num(v, key), 'Additional cooling gain'), 0);
  const net = conduction + air + additional, total = Math.max(0, net);
  const outdoor = us ? outdoorC * 9 / 5 + 32 : outdoorC;
  const notes = [
    'This steady estimate does not size HVAC equipment, determine a time-dependent cooling peak, or certify Manual J or current code compliance.',
    'Only entered exposed surfaces and additional loads are included. Ground coupling, ducts, thermal storage, solar effects and humidity require separate established inputs where relevant.',
    profile ? 'Assembly references are maximum U-values from 2015 IECC Table R402.1.4. They are comparison assumptions, not measured building performance. The selected county does not assign an insulation profile.' : 'Custom U-values must describe complete assemblies, including framing and thermal bridges. Insulation-only R-values are not whole-wall U-values.',
    heating ? 'Solar and internal gains are not credited against heating loss. Additional heating losses are included exactly as entered.' : 'Cooling includes only the solar, internal, latent and other gains you entered. Zero excludes a contribution; it does not verify that the contribution is absent. Negative envelope or air terms offset gains before the total is limited to zero.',
  ];
  if (county) notes.push('County temperatures are EPA program limits from the 2019 guide revised in 2020, not current weather. Local design conditions and historical county boundaries may differ. Use a verified site-specific temperature when available.');
  return {
    metrics: [m(heating ? 'Steady heating load' : 'Steady cooling subtotal', total / BTU_H_TO_W, 'number', 'BTU/h'), m('Heat-transfer total', total, 'number', 'W'), m('Outdoor design temperature used', outdoor, 'number', us ? '°F' : '°C'), m('Envelope heat transfer', conduction, 'number', 'W'), m('Outdoor-air heat transfer', air, 'number', 'W'), m('Additional entered loads', additional, 'number', 'W'), m('Conditioned volume', volume, 'number', 'm³'), ...(county ? [m('Climate reference', `${v.state} — ${county[0]}`), m('Climate source page', county[3])] : [])],
    table: {headers: ['Surface', 'Exposed area (m²)', 'Assembly U-value (W/m²·K)', 'UA (W/K)', 'Heat transfer (W)'], translateColumns: [0], rows: surfaces.map(([label, area, value]) => [label, area, value, area * value, area * value * delta])},
    notes,
  };
}
