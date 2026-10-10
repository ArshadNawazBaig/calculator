import Decimal from 'decimal.js';
import {finalGrade} from './final-grade';
import units from '@/data/utility-unit-tables.json';
import {num, positive} from './helpers';
import {parseRows, rowNumber} from './row-data';
import {metric as m, type Result, type Values} from './types';
const D = Decimal.clone({precision: 50});
const factor = (table: Record<string, string>, unit: string) => {
  if (!Object.hasOwn(table, unit)) throw Error('Choose a supported measurement unit.');
  return new D(table[unit]);
};
export const completionEverydayAlgorithms = new Set(['landscape-purchasing', 'mass-units', 'wind-units', 'ohm-units', 'grade-letters', 'grade-letter-final', 'heat-energy']);

function gradeScale(v: Values) {
  const scale = new Map<string, number>();
  for (const row of parseRows(v.letterScale, 'Letter scale')) {
    if (typeof row.letter !== 'string' || !row.letter.trim()) throw Error('Each scale letter must be nonempty text.');
    const key = row.letter.trim().toUpperCase();
    if (!key || scale.has(key)) throw Error('Each scale letter must be nonempty and unique.');
    const value = rowNumber(row.percentage, 'Representative percentage', 0);
    if (value > 100) throw Error('Scale percentages must be between 0 and 100.');
    scale.set(key, value);
  }
  return (raw: unknown) => {
    if (!['string', 'number'].includes(typeof raw)) throw Error('Enter a letter or percentage grade.');
    const text = String(raw).trim().toUpperCase();
    const value = scale.has(text) ? scale.get(text)! : /^[+]?(?:\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : NaN;
    if (!Number.isFinite(value) || value < 0 || value > 100) throw Error('Choose a known letter or a percentage from 0 to 100.');
    return value;
  };
}

export function runCompletionEveryday(op: string, v: Values): Result {
  const n = (key: string) => num(v, key);
  if (op === 'mass-units') {
    const mass = new D(n('density')).times(factor(units.densityToKgM3, v.densityUnit)).times(n('volume')).times(factor(units.volumeToM3, v.volumeUnit));
    return {metrics: [m('Mass', mass.div(factor(units.massToKg, v.outputMassUnit)).toNumber(), 'number', v.outputMassUnit), m('Mass in kilograms', mass.toNumber(), 'number', 'kg')], notes: ['Pounds and ounces are avoirdupois mass; US gallon, quart and pint are liquid measures. The psi/1000 ft choice is a pressure-gradient equivalent density at standard gravity 9.80665 m/s².']};
  }
  if (op === 'wind-units') {
    const temperature = v.temperatureUnit === 'F' ? n('temperature') : (n('temperature') - (v.temperatureUnit === 'K' ? 273.15 : 0)) * 1.8 + 32;
    if (temperature < -459.67) throw Error('Temperature cannot be below absolute zero.');
    const speed = n('wind') / ({mph: 1, 'km/h': 1.609344, 'm/s': .44704, knots: 1609.344 / 1852}[v.windUnit] ?? NaN);
    if (temperature > 50 + 1e-12 || speed <= 3 + 1e-12) throw Error('The NWS equation requires temperature at or below 50°F and wind above 3 mph.');
    const fahrenheit = 35.74 + .6215 * temperature - 35.75 * speed ** .16 + .4275 * temperature * speed ** .16;
    const celsius = (fahrenheit - 32) / 1.8;
    return {metrics: [m('Wind chill', v.outputTemperatureUnit === 'F' ? fahrenheit : celsius + (v.outputTemperatureUnit === 'K' ? 273.15 : 0), 'number', v.outputTemperatureUnit), m('Wind chill in Fahrenheit', fahrenheit, 'number', '°F'), m('Wind chill in Celsius', celsius, 'number', '°C')], notes: ['NWS apparent-temperature index for exposed skin. It is not an object temperature, forecast or precise frostbite timer. Domain checks use converted values.']};
  }
  if (op === 'ohm-units') {
    const tables = units.electricalFactors as Record<string, Record<string, string>>;
    const pair = v.pair.toUpperCase(), a = positive(n('a')) * factor(tables[pair[0]], v.aUnit).toNumber(), b = positive(n('b')) * factor(tables[pair[1]], v.bUnit).toNumber();
    let voltage = 0, current = 0, resistance = 0, power = 0;
    if (pair === 'VI') {voltage = a; current = b; resistance = a / b; power = a * b;}
    if (pair === 'VR') {voltage = a; resistance = b; current = a / b; power = a * current;}
    if (pair === 'IR') {current = a; resistance = b; voltage = a * b; power = voltage * a;}
    if (pair === 'VP') {voltage = a; power = b; current = b / a; resistance = a * a / b;}
    if (pair === 'IP') {current = a; power = b; voltage = b / a; resistance = b / a ** 2;}
    if (pair === 'RP') {resistance = a; power = b; current = Math.sqrt(b / a); voltage = Math.sqrt(a * b);}
    return {metrics: [m('Voltage', voltage / factor(tables.V, v.outputVoltageUnit).toNumber(), 'number', v.outputVoltageUnit), m('Current', current / factor(tables.I, v.outputCurrentUnit).toNumber(), 'number', v.outputCurrentUnit), m('Resistance', resistance / factor(tables.R, v.outputResistanceUnit).toNumber(), 'number', v.outputResistanceUnit), m('Power', power / factor(tables.P, v.outputPowerUnit).toNumber(), 'number', v.outputPowerUnit)], notes: ['Ideal passive resistor / DC quantities. Horsepower means mechanical horsepower; BTU/h uses the International Table BTU. This does not model reactive power or impedance.']};
  }
  if (op === 'grade-letters' || op === 'grade-letter-final') {
    const grade = gradeScale(v);
    if (op === 'grade-letter-final') {
      const output=finalGrade(grade(v.current),grade(v.target),positive(n('remainingWeight')),'Required remaining score');
      return {...output,notes:[...output.notes||[], 'Letter inputs use your editable representative percentages, not universal grade cutoffs.']};
    }
    const rows = parseRows(v.assessments, 'Assessments').map(r => ({name: String(r.name || 'Assessment'), score: grade(r.grade), weight: positive(rowNumber(r.weight, 'Weight', 0))}));
    const weight = positive(rows.reduce((sum, r) => sum + r.weight, 0), 'Total weight');
    if (v.weightBasis === 'percentage' && weight > 100 + 1e-9) throw Error('Completed percentage weights cannot exceed 100%.');
    const average = rows.reduce((sum, r) => sum + r.score * r.weight, 0) / weight;
    return {metrics: [m('Weighted average', average, 'percent'), m('Total entered weight', weight), ...(v.weightBasis === 'percentage' ? [m('Remaining weight', Math.max(0, 100 - weight), 'percent')] : [])], table: {headers: ['Assessment', 'Representative score (%)', 'Weight', 'Contribution to average'], rows: rows.map(r => [r.name, r.score, r.weight, r.score * r.weight / weight])}, notes: ['The editable letter map is an example scoring convention. Representative input percentages do not define letter-grade thresholds, so no final letter is inferred.']};
  }
  if (op === 'heat-energy') {
    const volume = n('lengthM') * n('widthM') * n('heightM');
    const mass = v.massInput === 'volume' ? positive(volume, 'Volume') * positive(n('densityKgM3'), 'Density') : positive(n('massKg'), 'Mass');
    const delta = n('deltaTemperature') * (v.differenceUnit === 'F' ? 5 / 9 : 1), energy = mass * positive(n('specificHeatJPerKgK'), 'Specific heat') * delta;
    return {metrics: [m('Heat energy', energy, 'number', 'J'), m('Heat energy in kilojoules', energy / 1000, 'number', 'kJ'), m('Heat energy in BTU', energy / 1055.05585262, 'number', 'BTU (IT)'), m('Mass', mass, 'number', 'kg'), m('Direction', energy > 0 ? 'Heat added' : energy < 0 ? 'Heat removed' : 'No temperature change')], notes: ['Q = m × c × ΔT assumes constant specific heat and no phase change. This is energy, not cooling capacity in BTU/h. It excludes building heat gain, ventilation, moisture and losses.']};
  }
  if (op === 'landscape-purchasing') {
    let area: Decimal;
    if (v.shape === 'beds') {
      const beds = parseRows(v.beds, 'Beds');
      if (!beds.length) throw Error('Add at least one bed.');
      area = beds.reduce((sum, r) => sum.plus(new D(rowNumber(r.length, 'Bed length', 0)).times(rowNumber(r.width, 'Bed width', 0)).times(factor(units.lengthToM, String(r.unit)).pow(2))), new D(0));
    } else if (v.shape === 'known-area') area = new D(n('area')).times(factor(units.areaToM2, v.areaUnit));
    else if (v.shape === 'circle') area = new D(n('diameter')).times(factor(units.lengthToM, v.diameterUnit)).div(2).pow(2).times(Math.PI);
    else area = new D(n('length')).times(factor(units.lengthToM, v.lengthUnit)).times(n('width')).times(factor(units.lengthToM, v.widthUnit));
    const geometric = area.times(n('depth')).times(factor(units.lengthToM, v.depthUnit)), volume = geometric.times(new D(1).plus(new D(n('waste')).div(100)));
    const massRequired = v.includeMass === 'yes' || ['lb', 'short-ton', 'kg', 'tonne'].includes(v.priceBasis) || (v.priceBasis === 'bag' && ['lb', 'kg'].includes(v.bagUnit));
    const mass = massRequired ? volume.times(positive(n('density'), 'Density')).times(factor(units.densityToKgM3, v.densityUnit)) : null;
    const metrics = [m('Area', area.toNumber(), 'number', 'm²'), m('Geometric volume', geometric.toNumber(), 'number', 'm³'), m('Order volume', volume.toNumber(), 'number', 'm³'), m('Order volume in cubic yards', volume.div(units.volumeToM3.yd3).toNumber(), 'number', 'yd³'), m('Order volume in cubic feet', volume.div(units.volumeToM3.ft3).toNumber(), 'number', 'ft³'), ...(mass ? [m('Material mass', mass.toNumber(), 'number', 'kg')] : [])];
    let pricedQuantity: Decimal;
    if (v.priceBasis === 'bag') {
      const massBag = ['lb', 'kg'].includes(v.bagUnit), bag = new D(positive(n('bagSize'), 'Bag size')).times(factor(massBag ? units.massToKg : units.volumeToM3, v.bagUnit));
      const material = massBag ? mass! : volume, equivalent = material.div(bag), count = equivalent.ceil(); pricedQuantity = count;
      metrics.push(m('Equivalent bags', equivalent.toNumber()), m('Whole bags to order', count.toNumber()), m('Material surplus from whole bags', count.times(bag).minus(material).toNumber(), 'number', massBag ? 'kg' : 'm³'));
    } else if (Object.hasOwn(units.volumeToM3, v.priceBasis)) pricedQuantity = volume.div(factor(units.volumeToM3, v.priceBasis));
    else pricedQuantity = mass!.div(factor(units.massToKg, v.priceBasis));
    if (v.price?.trim()) metrics.push(m('Material cost', pricedQuantity.times(n('price')).toNumber(), 'money'));
    return {metrics, notes: ['Areas are added as nonoverlapping beds. Material is aggregated before rounding bag quantities upward. Cost excludes delivery, labor and taxes.', 'Density is an entered bulk-material assumption. Moisture and compaction change actual mass and purchasing needs.']};
  }
  throw Error('Unsupported utility mode.');
}
