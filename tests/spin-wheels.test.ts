import {describe, expect, it, vi} from 'vitest';
import {landingRotation, MAX_ENTRIES, numberEntries, parseWheelEntries, pickIndex, segmentPath, shuffleEntries} from '@/lib/spin-wheels/engine';
import {colorForEntry, spinWheels, wheelHref} from '@/lib/spin-wheels/catalog';
import {wheelGuides} from '@/lib/spin-wheels/guides';
import {searchCalculators} from '@/lib/calculator-search';
import {localizedPath} from '@/lib/i18n/config';
import es from '@/data/locales/es.json';

describe('wheel entries and selection', () => {
  it('trims empty lines while keeping duplicate entries and their separate chances', () => {
    expect(parseWheelEntries(' Alex \r\n\nSam\nAlex\n')).toEqual({entries: ['Alex', 'Sam', 'Alex'], error: null});
    expect(parseWheelEntries(' \n').error).toMatch(/at least one/);
    expect(parseWheelEntries('x\n'.repeat(101)).error).toMatch(/100/);
    expect(parseWheelEntries('🌿'.repeat(60)).error).toBeNull();
    expect(parseWheelEntries('x'.repeat(61)).error).toMatch(/60/);
  });
  it('generates inclusive bounded integer ranges without silently coercing invalid values', () => {
    expect(numberEntries('-2', '2')).toEqual(['-2', '-1', '0', '1', '2']);
    expect(numberEntries('0', '0')).toEqual(['0']);
    expect(numberEntries('1', '100')).toHaveLength(100);
    for (const [min, max] of [['', '10'], ['1', ''], ['4', '3'], ['1', '101'], ['1.5', '5'], ['NaN', '10'], ['1', 'Infinity'], ['1000001', '1000001']]) expect(() => numberEntries(min, max)).toThrow();
  });
  it('rejects the remainder of the random range to avoid modulo bias', () => {
    const values = [0xffffffff, 0xfffffffe, 0xfffffffa, 17];
    expect(pickIndex(10, () => values.shift()!)).toBe(7);
    expect(values).toEqual([]);
    expect(pickIndex(1, () => 0xffffffff)).toBe(0);
    expect(pickIndex(100, () => 99)).toBe(99);
    for (const count of [0, -1, 1.5, 101, NaN]) expect(() => pickIndex(count)).toThrow();
    expect(() => pickIndex(2, () => -1)).toThrow();
    expect(() => pickIndex(3, () => 0xffffffff)).toThrow(/unavailable/);
  });
  it('shuffles a copy and retains every entry including duplicates', () => {
    const entries = ['A', 'B', 'A', 'C'];
    const shuffled = shuffleEntries(entries, () => 0);
    expect(entries).toEqual(['A', 'B', 'A', 'C']);
    expect(shuffled).not.toBe(entries);
    expect(shuffled.toSorted()).toEqual(entries.toSorted());
  });
  it('lands the pointer on the selected segment across wheel sizes and successive rotations', () => {
    let current = 0;
    for (const count of [1, 2, 3, 8, 17, 40, 100]) for (let index = 0; index < count; index++) {
      const next = landingRotation(current, index, count);
      expect(next).toBeGreaterThanOrEqual(current + 1800);
      const underPointer = (360 - next % 360) % 360;
      expect(Math.floor(underPointer / (360 / count))).toBe(index);
      current = next;
    }
  });
  it.each([-1, 1])('keeps SVG paths identical when runtime trigonometry differs by %i epsilon', direction => {
    const paths = Array.from({length: MAX_ENTRIES - 1}, (_, size) => {
      const count = size + 2;
      return Array.from({length: count}, (_, index) => ({index, count, path: segmentPath(index, count)}));
    }).flat();
    const {sin, cos} = Math;
    const sinSpy = vi.spyOn(Math, 'sin').mockImplementation(angle => sin(angle) + direction * Number.EPSILON);
    const cosSpy = vi.spyOn(Math, 'cos').mockImplementation(angle => cos(angle) + direction * Number.EPSILON);
    try {
      for (const {index, count, path} of paths) expect(segmentPath(index, count)).toBe(path);
    } finally {
      sinSpy.mockRestore();
      cosSpy.mockRestore();
    }
  });
  it('supports known color names without treating object properties as colors', () => {
    expect(colorForEntry('RED')).toBe('#ef4444');
    for (const name of ['constructor', '__proto__', 'toString', 'My custom color']) expect(colorForEntry(name)).toBeUndefined();
  });
});

describe('wheel discovery and content', () => {
  it('finds each wheel by its title and keeps canonical links working from other languages', () => {
    for (const wheel of spinWheels) {
      const result = searchCalculators(wheel.title, 'spin-wheels')[0];
      expect(result.slug).toBe(wheel.slug);
      expect(result.href).toBe(wheelHref(wheel.slug));
      expect(localizedPath(result.href!, 'ar')).toBe(`/ar${result.href}`);
    }
    expect(searchCalculators('ruleta de nombres', undefined, es)[0].slug).toBe('wheel-of-names');
    expect(searchCalculators('wheel', 'finance')).toEqual([]);
    expect(searchCalculators('1-100', 'spin-wheels').map(tool => tool.slug)).toContain('number-picker-wheel');
  });
  it('gives every published wheel valid presets and substantial distinct guidance', () => {
    expect(new Set(spinWheels.map(wheel => wheel.seoTitle)).size).toBe(spinWheels.length);
    expect(new Set(spinWheels.map(wheel => wheel.description)).size).toBe(spinWheels.length);
    for (const wheel of spinWheels) {
      for (const preset of [{entries: wheel.entries}, ...wheel.presets]) expect(parseWheelEntries(preset.entries.join('\n')).error).toBeNull();
      const guide = wheelGuides[wheel.slug];
      expect(guide.steps).toHaveLength(4);
      expect(guide.questions.length).toBeGreaterThanOrEqual(4);
      const copy = [guide.answer, ...guide.steps, ...guide.sections.flatMap(section => section.paragraphs), ...guide.questions.flatMap(item => [item.question, item.answer])].join(' ');
      expect(copy.split(/\s+/).length, wheel.slug).toBeGreaterThan(450);
    }
  });
});
