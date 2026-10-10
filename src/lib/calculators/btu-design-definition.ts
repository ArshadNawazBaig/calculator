import climate from '@/data/btu-us-climate.json';
import envelope from '@/data/btu-envelope-presets.json';
import {mode, n, s, type Field} from './types';

const group = (name: string, fields: Field[]) => fields.map(field => ({...field, group: name}));
export const btuDesignMode = () => mode('us-design', 'US room and building heat transfer', 'btu-design', [
  s('season', 'Calculation season', [['heating', 'Heating loss'], ['cooling', 'Cooling heat-gain subtotal']]),
  s('units', 'Measurement system', [['us', 'US customary'], ['si', 'Metric']]),
  s('climateInput', 'Outdoor temperature source', [['county', 'US county reference'], ['custom', 'Enter design temperature']]),
  {...s('state', 'State or territory', Object.keys(climate.regions), 'Texas'), translateOptions: false},
  {...s('county', 'County or equivalent', Object.entries(climate.regions).flatMap(([state, rows]) => rows.map(row => [`${state}|${row[0]}`, String(row[0])] as [string, string])), 'Texas|Travis'), translateOptions: false, hint: 'Names and temperature limits use the 2019 EPA guide, revised in 2020. These are program reference limits, not live weather or a site-specific design.'},
  n('outdoor', 'Outdoor design temperature', 28, 'design-temperature', -100, 180),
  n('indoor', 'Indoor design temperature', 70, 'design-temperature', -50, 150),
  s('space', 'Space to model', [['room', 'One rectangular room'], ['building', 'Rectangular whole building']]),
  n('length', 'Footprint length', 20, 'design-length', 0.01, 10000),
  n('width', 'Footprint width', 15, 'design-length', 0.01, 10000),
  n('height', 'Ceiling height per floor', 8, 'design-length', 0.01, 1000),
  {...n('stories', 'Conditioned floors', 1, undefined, 1, 100), step: '1'},
  {...n('exposedWallLength', 'Total exterior wall length', 20, 'design-length', 0), hint: 'Add only walls facing outdoors. Shared walls beside rooms at the same temperature are excluded.'},
  ...group('Envelope and insulation', [
    {...s('envelope', 'Assembly U-value reference', [['custom', 'Enter actual assembly U-values'], ...envelope.profiles.map(p => [p.id, p.label] as [string, string])], 'zone3'), hint: 'The dated code references are comparison assumptions, not your measured insulation or current code requirements. Location does not automatically choose a profile. Use actual whole-assembly values when known.'},
    n('windowArea', 'Vertical window area', 30, 'design-area', 0),
    n('doorArea', 'Exterior door area', 20, 'design-area', 0),
    {...n('ceilingArea', 'Ceiling area exposed to outdoors', 300, 'design-area', 0), hint: 'Use zero below a conditioned room. Enter the thermal-boundary area, not every floor in a multi-floor building.'},
    {...n('floorArea', 'Floor area exposed to outdoor air', 0, 'design-area', 0), hint: 'Do not use this area method for soil, slabs or basement walls. Add separately established foundation losses under additional loads.'},
    n('wallU', 'Whole frame-wall U-value', .060, 'design-u', 0.0001),
    n('ceilingU', 'Whole ceiling U-value', .030, 'design-u', 0.0001),
    n('floorU', 'Whole exposed-floor U-value', .047, 'design-u', 0.0001),
    n('windowU', 'Whole window U-value', .35, 'design-u', 0.0001),
    n('doorU', 'Whole exterior-door U-value', .35, 'design-u', 0.0001),
  ]),
  ...group('Outdoor air and additional loads', [
    {...n('ach', 'Total outdoor air changes per hour', .5, '1/h', 0, 100), hint: 'Enter operating infiltration plus outdoor ventilation. Do not enter blower-door ACH50 or count ventilation twice.'},
    {...n('airCapacity', 'Air volumetric heat capacity', 1207, 'J/(m³·K)', 0.01), hint: 'The default assumes dry air near sea level and 21 °C. Change it when a different air property is established.'},
    {...n('additionalHeating', 'Additional established heating losses', 0, 'W', 0), hint: 'Include separately calculated ground, duct or other losses. Zero excludes them; it does not mean those losses are absent.'},
    {...n('solarGain', 'Solar heat gain', 0, 'W', 0), hint: 'Enter a separately established coincident solar gain for glazing and opaque surfaces, accounting for orientation and shading.'},
    n('internalGain', 'People, lighting and equipment sensible gain', 0, 'W', 0),
    {...n('latentGain', 'Total moisture-removal load', 0, 'W', 0), hint: 'Include outdoor-air and internal latent loads. Dry-bulb temperatures do not determine humidity load.'},
    n('otherCooling', 'Other established cooling gains', 0, 'W', 0),
  ]),
], 'Envelope heat transfer = Σ(U × exposed area) × temperature difference. Outdoor-air heat transfer = air heat capacity × air changes per hour × volume × temperature difference / 3600. Add separately established loads.', 'Use a county reference or your own design temperature, exposed geometry and an assembly reference or actual U-values. Window and door areas are deducted from gross exterior walls. Whole-building mode includes every exterior wall and conditioned floor in its volume. Heating ignores beneficial solar and internal gains. Cooling reports a steady heat-gain subtotal from the entered sources, not a time-dependent design peak or an equipment size. This is not Manual J or an ENERGY STAR certification calculation.');
