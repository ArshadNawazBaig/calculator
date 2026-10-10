import {runBtuDesign} from './btu-design';
import Decimal from 'decimal.js';
import {runSizing} from './sizing';
import {runNecImpedance} from './nec-impedance';
import {integer, num, positive, nonnegative} from './helpers';
import {parseRows, rowNumber} from './row-data';
import {metric as m, type Result, type Values} from './types';

export const remainingAlgorithms = new Set(['btu-design', 'golf-mixed', 'heat-loss', 'bra-regions', 'dress-regions', 'shoe-regions', 'nec-2017']);

export function runRemaining(op: string, v: Values, run: (algorithm: string, values: Values) => Result): Result {
  if (op === 'btu-design') return runBtuDesign(v);
  if (op === 'nec-2017') return runNecImpedance(v);
  if (['bra-regions', 'dress-regions', 'shoe-regions'].includes(op)) return runSizing(op, v);
  if (op === 'golf-mixed') {
    const rounds = parseRows(v.rounds, 'Recent rounds', 20);
    if (rounds.length < 3) throw Error('Enter 3–20 recent rounds.');
    const rows = rounds.map((row, i) => {
      const name = String(row.name || `Round ${i + 1}`);
      if (row.input === '18-score') {
        const score = integer(rowNumber(row.score, 'Adjusted gross score', 18, 300), 18, 300);
        const rating = rowNumber(row.rating, 'Course rating', 40, 90);
        const slope = integer(rowNumber(row.slope, 'Slope rating', 55, 155), 55, 155);
        const pcc = integer(rowNumber(row.pcc === undefined || String(row.pcc).trim() === '' ? 0 : row.pcc, 'Official PCC', -1, 3), -1, 3);
        const differential = new Decimal(113).div(slope).times(new Decimal(score).minus(rating).minus(pcc)).toDecimalPlaces(1, Decimal.ROUND_HALF_CEIL).toNumber();
        return [name, '18', differential, 'Calculated from adjusted score'];
      }
      if (!['9-verified', '18-verified'].includes(String(row.input))) throw Error('Select a supported round input.');
      const differential = rowNumber(row.differential, 'Verified 18-hole-equivalent differential', -200, 1000);
      if (new Decimal(differential).decimalPlaces() > 1) throw Error('Enter the final verified differential rounded to one decimal place.');
      if (typeof row.source !== 'string' || !row.source.trim() || row.source.length > 200) throw Error('Enter the source of each verified differential (up to 200 characters).');
      return [name, row.input === '9-verified' ? '9' : '18', differential, row.source.trim()];
    });
    const result = run('golf-index', {differentials: rows.map(row => row[2]).join(',')});
    return {...result, table: {headers: ['Round', 'Holes played', '18-hole-equivalent differential', 'Differential source'], rows}, notes: [
      'Nine-hole entries use your supplied final equivalent differentials, including the expected-score contribution. They are not doubled or adjusted by PCC again.',
      'This estimate does not verify supplied records or apply official handicap-record adjustments.',
    ]};
  }
  if (op === 'heat-loss') {
    if (!['m', 'ft'].includes(v.lengthUnit) || !['C', 'F'].includes(v.temperatureUnit) || !['total', 'components'].includes(v.envelopeInput)) throw Error('Select supported heat-loss units and inputs.');
    const scale = v.lengthUnit === 'ft' ? 0.3048 : 1;
    const volume = positive(num(v, 'length'), 'Length') * positive(num(v, 'width'), 'Width') * positive(num(v, 'height'), 'Ceiling height') * scale ** 3;
    const delta = (num(v, 'indoor') - num(v, 'outdoor')) * (v.temperatureUnit === 'F' ? 5 / 9 : 1);
    if (delta < 0) throw Error('Indoor temperature must be at least the outdoor temperature for heating loss.');
    const btuPerHourToW = 1055.05585262 / 3600;
    let ua: number;
    if (v.envelopeInput === 'components') {
      const surfaces = parseRows(v.surfaces, 'Exposed surfaces');
      if (!surfaces.length) throw Error('Enter at least one exposed surface.');
      ua = surfaces.reduce((sum, row) => sum + positive(rowNumber(row.area, 'Exposed area', 0), 'Exposed area') * scale ** 2 * rowNumber(row.u, 'U-value', 0), 0);
    } else {
      if (!['W/K', 'BTU/(h·°F)'].includes(v.uaUnit)) throw Error('Select a supported heat-loss coefficient unit.');
      ua = nonnegative(num(v, 'ua'), 'Envelope coefficient') * (v.uaUnit === 'W/K' ? 1 : btuPerHourToW * 9 / 5);
    }
    const airUa = positive(num(v, 'airCapacity'), 'Air heat capacity') * nonnegative(num(v, 'ach'), 'Air changes') * volume / 3600;
    const conduction = ua * delta, air = airUa * delta, watts = conduction + air;
    return {metrics: [m('Steady heating loss', watts / btuPerHourToW, 'number', 'BTU/h'), m('Heating loss in watts', watts, 'number', 'W'), m('Envelope loss', conduction, 'number', 'W'), m('Air exchange loss', air, 'number', 'W'), m('Heated volume', volume, 'number', 'm³'), m('Temperature difference', delta, 'number', 'K'), m('Envelope coefficient', ua, 'number', 'W/K')], notes: ['Heating loss is power. This estimate does not select equipment capacity or calculate a cooling load.']};
  }
  throw Error('Unsupported calculator mode.');
}
