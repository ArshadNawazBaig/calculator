import {describe, expect, it} from 'vitest';
import climate from '@/data/btu-us-climate.json';
import {definitionMap} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults, type Result, type Values} from '@/lib/calculators/types';
import {displayField, updateInputs} from '@/lib/calculators/input-display';
import {isFieldActive} from '@/lib/calculators/field-visibility';

const mode = definitionMap.get('btu-calculator')!.modes.find(m => m.algorithm === 'btu-design')!;
const base = defaults(mode);
const calc = (patch: Values = {}) => calculate('everyday', mode, {...base, ...patch});
const metric = (r: Result, key: string) => r.metrics.find(m => m.label === key)!.value;

describe('US design-temperature and assembly references', () => {
  it('reproduces the EPA Travis County example: 28 F heating and 99 F cooling', async () => {
    expect(metric(await calc(), 'Outdoor design temperature used')).toBeCloseTo(28, 10);
    expect(metric(await calc({season: 'cooling'}), 'Outdoor design temperature used')).toBeCloseTo(99, 10);
  });
  for (const [state, county, heating, cooling] of [['Alabama', 'Autauga', 24, 96], ['Alaska', 'Fairbanks North Star', -40, 80], ['Arizona', 'Maricopa', 24, 111]] as const) it(`preserves primary-source limits for ${state} / ${county}`, async () => {
    const selected = {state, county: `${state}|${county}`};
    expect(metric(await calc(selected), 'Outdoor design temperature used')).toBeCloseTo(heating, 10);
    expect(metric(await calc({...selected, season: 'cooling'}), 'Outdoor design temperature used')).toBeCloseTo(cooling, 10);
  });
  it('keeps source geographic names and unique location keys', () => {
    const locations = Object.entries(climate.regions).flatMap(([state, rows]) => rows.map(row => `${state}|${row[0]}`));
    expect(locations.length).toBe(climate.count);
    expect(locations.length).toBeGreaterThan(3000);
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations).toContain('Alaska|Prince of Wales-Hyder');
    expect(locations).toContain('Alaska|Anchorage Municipality');
  });
  it('rejects a valid county belonging to a different selected state', async () => {
    await expect(calc({state: 'Alabama', county: 'Texas|Travis'})).rejects.toThrow(/selected state/);
  });
  it('deducts openings and reproduces the independent imperial envelope calculation', async () => {
    // Gross wall 20*8=160 ft²; net opaque=110. Source profile:
    // [(110*.060)+(30*.35)+(20*.35)+(300*.030)]*(70-28)=1390.2 BTU/h.
    const r = await calc({ach: '0'});
    expect(metric(r, 'Steady heating load')).toBeCloseTo(1390.2, 9);
    expect(r.table!.rows[0][1]).toBeCloseTo(110 * .09290304, 9);
    expect(r.table!.rows[1][2]).toBeCloseTo(1.9873921693897205, 9);
  });
  it('keeps colder-climate reference insulation distinct', async () => {
    // Zone 6: [(110*.045)+(30*.32)+(20*.35)+(300*.026)]*42.
    expect(metric(await calc({envelope: 'zone6', ach: '0'}), 'Steady heating load')).toBeCloseTo(1232.7, 9);
  });
  it('uses complete assembly custom U-values, not cavity R-values', async () => {
    const r = await calc({envelope: 'custom', wallU: '.1', ceilingU: '.05', windowU: '.4', ach: '0'});
    expect(metric(r, 'Steady heating load')).toBeCloseTo((110*.1+30*.4+20*.35+300*.05)*42, 9);
  });
});

describe('Geometry, air exchange and additional heat gains', () => {
  it('calculates conditioned volume and outdoor-air heat transfer independently', async () => {
    const r = await calc();
    expect(metric(r, 'Conditioned volume')).toBeCloseTo(67.9604318208, 10);
    expect(metric(r, 'Outdoor-air heat transfer')).toBeCloseTo(265.83226317312, 8);
  });
  it('counts all exterior walls and stories only in whole-building mode', async () => {
    const r = await calc({space: 'building', stories: '2', ach: '0'});
    // Two floors: 70 ft perimeter*16 ft height, less 50 ft² openings.
    expect(r.table!.rows[0][1]).toBeCloseTo(1070*.09290304, 9);
    expect(metric(r, 'Conditioned volume')).toBeCloseTo(135.9208636416, 9);
    expect(metric(r, 'Steady heating load')).toBeCloseTo((1070*.06+30*.35+20*.35+300*.03)*42, 9);
  });
  it('adds established heating losses without a hidden sizing multiplier', async () => {
    const r = await calc({ach: '0', additionalHeating: '100'});
    expect(metric(r, 'Heat-transfer total')).toBeCloseTo(1390.2 * (1055.05585262/3600) + 100, 9);
  });
  it('includes separately entered cooling sources exactly once', async () => {
    const r = await calc({season: 'cooling', indoor: '75', ach: '0', solarGain: '500', internalGain: '200', latentGain: '100', otherCooling: '50'});
    expect(metric(r, 'Additional entered loads')).toBe(850);
    expect(metric(r, 'Heat-transfer total')).toBeCloseTo((1390.2/42)*24*(1055.05585262/3600)+850, 9);
  });
  it('retains outward cooling heat transfer when outside air is colder', async () => {
    const r = await calc({season: 'cooling', climateInput: 'custom', outdoor: '65', indoor: '75', ach: '0', solarGain: '500'});
    expect(metric(r, 'Envelope heat transfer')).toBeCloseTo(-(1390.2/42)*10*(1055.05585262/3600), 9);
    expect(metric(r, 'Heat-transfer total')).toBeCloseTo(500-(1390.2/42)*10*(1055.05585262/3600), 9);
  });
  it('does not return negative heating or cooling demand', async () => {
    expect(metric(await calc({climateInput: 'custom', outdoor: '80'}), 'Steady heating load')).toBe(0);
    expect(metric(await calc({season: 'cooling', climateInput: 'custom', outdoor: '60'}), 'Steady cooling subtotal')).toBe(0);
  });
  for (const patch of [{windowArea: '141'}, {exposedWallLength: '71'}, {space: 'building', stories: '1.5'}, {ach: '-1'}, {envelope: 'custom', wallU: '0'}, {season: 'cooling', latentGain: '-1'}] as Values[]) it(`rejects unsupported inputs ${JSON.stringify(patch)}`, async () => {await expect(calc(patch)).rejects.toThrow();});
});

describe('US design form behavior', () => {
  it('preserves the physical result when all units change', async () => {
    const values = {...base, envelope: 'custom', climateInput: 'custom', floorArea: '100'};
    const si = updateInputs(mode, values, 'units', 'si');
    expect(Number(si.indoor)).toBeCloseTo(21.1111111111, 9);
    expect(Number(si.windowArea)).toBeCloseTo(2.7870912, 10);
    expect(metric(await calc(si), 'Steady heating load')).toBeCloseTo(Number(metric(await calc(values), 'Steady heating load')), 8);
    const back = updateInputs(mode, si, 'units', 'us');
    expect(Number(back.doorU)).toBeCloseTo(.35, 10);
  });
  it('filters counties by state and selects a matching county on state change', () => {
    const next = updateInputs(mode, base, 'state', 'Alaska');
    expect(next.county).toMatch(/^Alaska\|/);
    const field = displayField(mode, mode.fields.find(f => f.key === 'county')!, next);
    expect(field.options!.length).toBe(climate.regions.Alaska.length);
    expect(field.options!.every(o => o.value.startsWith('Alaska|'))).toBe(true);
    expect(field.translateOptions).toBe(false);
  });
  it('preserves custom ceiling areas but updates a full-footprint area with dimensions', () => {
    expect(updateInputs(mode, base, 'length', '30').ceilingArea).toBe('450');
    expect(updateInputs(mode, {...base, ceilingArea: '100'}, 'length', '30').ceilingArea).toBe('100');
  });
  it('does not leak irrelevant hidden inputs into results', async () => {
    const r = await calc({outdoor: 'bad', stories: 'bad', wallU: 'bad', solarGain: 'bad'});
    expect(metric(r, 'Outdoor design temperature used')).toBeCloseTo(28, 9);
    expect(mode.fields.filter(f => isFieldActive(mode, f, base)).map(f => f.key)).not.toContain('outdoor');
  });
});
