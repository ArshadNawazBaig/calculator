import {describe, it, expect} from 'vitest';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Result, type Values} from '@/lib/calculators/types';

const calc = (slug: string, algorithm: string, values: Values = {}) => {
  const mode = definitionMap.get(slug)!.modes.find(m => m.algorithm === algorithm)!;
  return calculate('everyday', mode, {...defaults(mode), ...values});
};
const metric = (r: Result, label: string) => r.metrics.find(m => m.label === label)!.value;
const bra = (values: Values) => calc('bra-size-calculator', 'bra-regions', values);
const shoe = (values: Values) => calc('shoe-size-conversion', 'shoe-regions', values);
const heat = (values: Values) => calc('btu-calculator', 'heat-loss', values);
describe('Named sizing conventions', () => {
  // Wacoal international guide, AA and different cup ladders are explicit rows.
  it('converts UK 34E to US 34DDD, EU 75F, French 90F and AU 12E', async () => {
    const r = await bra({system: 'uk', band: '34', cup: 'E'});
    expect(r.metrics.map(m => m.value)).toEqual(['34DDD', '34E', '75F', '90F', '12E', '75G']);
  });
  it('supports the published AA boundary and Japanese offset', async () => {
    expect((await bra({system: 'us', band: '30', cup: 'aa'})).metrics.map(m => m.value)).toEqual(['30AA', '30AA', '65AA', '80AA', '8AA', '65A']);
  });
  it('converts the last published cup and band without extrapolation', async () => {
    expect(metric(await bra({system: 'eu', band: '105', cup: 'J'}), 'UK')).toBe('46GG');
  });
  for (const values of [{band: '28'}, {band: '35'}, {cup: 'HH'}, {cup: 'F', system: 'us'}] as Values[]) it(`rejects undocumented labels ${JSON.stringify(values)}`, async () => {
    await expect(bra(values)).rejects.toThrow(/outside/);
  });
  it('keeps dress labels separate from band and cup', async () => {
    const r = await calc('bra-size-calculator', 'dress-regions', {system: 'uk', size: '12'});
    expect(r.metrics.map(m => m.value)).toEqual(['M', '12', '8', '38', '40', 'L']);
  });
  it('looks up independently verified adult US/UK/EU/JP/CN labels', async () => {
    const r = await shoe({group: 'adult-men', source: 'usMen', size: '9.0'});
    expect(r.table!.rows[0]).toEqual(['9', '10.5', '—', '8', '42.5', '27', '270', 261.9375]);
  });
  it('returns both adult matches for repeated UK size 6', async () => {
    const r = await shoe({source: 'uk', size: '6'});
    expect(r.table!.rows.map(row => row[0])).toEqual(['6.5', '7']);
    expect(r.table!.rows.map(row => row[4])).toEqual(['39', '40']);
  });
  it('preserves group-specific foot lengths for identical nominal sizes', async () => {
    const adult = await shoe({group: 'adult-men', source: 'usMen', size: '3.5'});
    const child = await shoe({group: 'big-kids', source: 'usKids', size: '3.5Y'});
    expect(adult.table!.rows[0][7]).toBe(215.9);
    expect(child.table!.rows[0][7]).toBe(222.25);
  });
  it('supports infant CN labels from the China source', async () => {
    const r = await shoe({group: 'infants', source: 'usKids', size: '1c'});
    expect(r.table!.rows[0].slice(2)).toEqual(['1C', '0.5', '16', '7', '70', 90.4875]);
  });
  it('does not invent a CN label for the missing women’s row', async () => {
    const r = await shoe({group: 'adult-women', source: 'usWomen', size: '3.5'});
    expect(r.table!.rows[0][6]).toBe('—');
  });
  it('selects the next measured length between rows', async () => {
    const r = await shoe({group: 'infants', source: 'foot', length: '9.1', lengthUnit: 'cm'});
    expect(r.table!.rows[0][2]).toBe('2C');
  });
  it('matches the exact physical boundary in inches', async () => {
    const r = await shoe({group: 'infants', source: 'foot', length: '3.5625', lengthUnit: 'in'});
    expect(r.table!.rows[0][2]).toBe('1C');
  });
  for (const values of [{group: 'infants', source: 'usKids', size: '1Y'}, {group: 'infants', source: 'foot', length: '8', lengthUnit: 'cm'}, {source: 'foot', length: '999', lengthUnit: 'mm'}] as Values[]) it(`rejects unsupported shoe input ${JSON.stringify(values)}`, async () => {
    await expect(shoe(values)).rejects.toThrow(/range|matching/);
  });
});

describe('Steady heating loss', () => {
  it('reproduces Qdot = UA deltaT with 0.5 W/m²K × 20 m² × 20 K', async () => {
    const r = await heat({envelopeInput: 'components', surfaces: JSON.stringify([{area: 20, u: 0.5}]), ach: '0'});
    expect(metric(r, 'Heating loss in watts')).toBe(200);
    expect(metric(r, 'Steady heating loss')).toBeCloseTo(682.4283266255884, 8);
  });
  it('adds independently calculated outdoor-air sensible loss', async () => {
    const r = await heat({});
    expect(metric(r, 'Heated volume')).toBe(50);
    expect(metric(r, 'Envelope loss')).toBe(2000);
    expect(metric(r, 'Air exchange loss')).toBeCloseTo(167.63888888888889, 9);
  });
  it('preserves imperial/SI equivalence including temperature offsets', async () => {
    const si = await heat({});
    const imperial = await heat({length: String(5 / .3048), width: String(4 / .3048), height: String(2.5 / .3048), lengthUnit: 'ft', indoor: '68', outdoor: '32', temperatureUnit: 'F', ua: String(100 / (1055.05585262 / 3600 * 1.8)), uaUnit: 'BTU/(h·°F)'});
    expect(metric(imperial, 'Heating loss in watts')).toBeCloseTo(Number(metric(si, 'Heating loss in watts')), 8);
  });
  it('ceiling height changes air volume without inventing an envelope multiplier', async () => {
    const r = await heat({height: '5'});
    expect(metric(r, 'Air exchange loss')).toBeCloseTo(335.27777777777777, 9);
    expect(metric(r, 'Envelope loss')).toBe(2000);
  });
  it('returns zero at equal temperatures', async () => expect(metric(await heat({outdoor: '20'}), 'Steady heating loss')).toBe(0));
  for (const values of [{outdoor: '21'}, {ach: '-1'}, {length: '0'}, {airCapacity: '0'}, {envelopeInput: 'components', surfaces: '[]'}, {envelopeInput: 'components', surfaces: '[{"area":20,"u":-1}]'}] as Values[]) it(`rejects invalid heat-loss input ${JSON.stringify(values)}`, async () => {await expect(heat(values)).rejects.toThrow();});
});

describe('Mixed golf rounds', () => {
  const round = {input: '18-score', score: 82, rating: 72, slope: 113, pcc: 0};
  const verified = {input: '9-verified', differential: 12, source: 'Test handicap record'};
  const mixed = (rounds: Record<string, unknown>[]) => calc('golf-handicap-calculator', 'golf-mixed', {rounds: JSON.stringify(rounds)});
  it('combines a verified nine-hole equivalent without doubling or applying PCC again', async () => {
    const r = await mixed([round, {...verified, pcc: 3, score: 40}, {...round, score: 86}]);
    expect(r.table!.rows.map(row => row[2])).toEqual([10, 12, 14]);
    expect(metric(r, 'Estimated handicap index')).toBe(8);
  });
  it('retains negative half-tie rounding toward zero for calculated differentials', async () => {
    const r = await mixed([{...round, score: 68, slope: 80}, verified, {...round, score: 84}]);
    expect(r.table!.rows[0][2]).toBe(-5.6);
    expect(metric(r, 'Estimated handicap index')).toBe(-7.6);
  });
  it('uses six-score selection with both nine- and eighteen-hole equivalents', async () => {
    const r = await mixed([10, 12, 14, 16, 18, 20].map((differential, i) => ({...verified, input: i % 2 ? '18-verified' : '9-verified', differential})));
    expect(metric(r, 'Estimated handicap index')).toBe(10);
  });
  for (const row of [{...verified, source: ''}, {...verified, differential: ''}, {...verified, differential: 12.34}, {...verified, input: '9-score'}, {...round, slope: 50}]) it(`rejects incomplete or invalid round ${JSON.stringify(row)}`, async () => {await expect(mixed([round, row, round])).rejects.toThrow();});
  it('requires at least three recent rounds', async () => {await expect(mixed([round, verified])).rejects.toThrow(/3–20/);});
});

describe('2017 NEC numerical impedance reference', () => {
  const nec = (values: Values = {}) => calc('voltage-drop-calculator', 'nec-2017', values);
  // Cummins T-030 manual independently uses 1/0 copper in steel: R=.12, X=.055 Ω/kft.
  it('uses the independently documented 1/0 copper / steel R and X', async () => {
    const r = await nec();
    expect(metric(r, 'AC resistance at 75 °C')).toBe(.12);
    expect(metric(r, 'Reactance at 60 Hz')).toBe(.055);
    expect(metric(r, 'Effective longitudinal impedance')).toBeCloseTo(.129, 12);
    expect(metric(r, 'Line-to-line voltage drop')).toBeCloseTo(2.234345541763852, 10);
  });
  it('selects distinct aluminum-conduit resistance for 250 kcmil copper', async () => {
    const r = await nec({size: '250', conduit: 'aluminum'});
    expect(metric(r, 'AC resistance at 75 °C')).toBe(.057);
    expect(metric(r, 'Reactance at 60 Hz')).toBe(.041);
  });
  it('supports the large aluminum / steel boundary', async () => {
    const r = await nec({size: '1000', material: 'aluminum', powerFactor: '1'});
    expect(metric(r, 'AC resistance at 75 °C')).toBe(.025);
    expect(metric(r, 'Effective longitudinal impedance')).toBe(.025);
  });
  it('keeps meters and feet equivalent', async () => {
    expect(metric(await nec({length: '30.48', lengthUnit: 'm'}), 'Line-to-line voltage drop')).toBeCloseTo(Number(metric(await nec(), 'Line-to-line voltage drop')), 12);
  });
  it('uses only reactance at zero lagging power factor', async () => {
    expect(metric(await nec({powerFactor: '0'}), 'Effective longitudinal impedance')).toBe(.055);
  });
  for (const values of [{size: '14', material: 'aluminum'}, {size: '700'}, {voltage: '601'}, {powerFactor: '1.1'}, {current: '-1'}, {length: '-1'}] as Values[]) it(`rejects inputs outside the reference ${JSON.stringify(values)}`, async () => {await expect(nec(values)).rejects.toThrow();});
});
