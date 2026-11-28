import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {evaluate} from 'mathjs';
import {MathSearchAnswer, MathSearchContent} from '@/components/content/math-search-content';
import {mathSearchContent} from '@/data/math-search-content';
import {calculate} from '@/lib/calculators/engine';
import {definitionMap, toolMap} from '@/lib/calculators/registry';
import {defaults, type Values} from '@/lib/calculators/types';

async function run(slug: string, id: string, values: Values) {
  const mode = definitionMap.get(slug)!.modes.find(item => item.id === id)!;
  const {category} = toolMap.get(slug)!;
  return calculate(category, mode, {...defaults(mode), ...values});
}

const areaExamples: Record<string, Values> = {
  rectangle: {a: '6', b: '4'}, square: {a: '4'}, triangle: {a: '8', b: '3'},
  'triangle-sss': {a: '5', b: '12', c: '13'}, circle: {r: '3'},
  sector: {r: '4', angle: '90'}, ellipse: {a: '4', b: '2'},
  trapezoid: {a: '4', b: '8', h: '3'}, parallelogram: {a: '7', h: '3'},
};

const volumeExamples: Record<string, Values> = {
  cuboid: {a: '6', b: '4', h: '2'}, cube: {a: '3'},
  cylinder: {r: '2', h: '5'}, sphere: {r: '3'}, cone: {r: '3', h: '4'},
  pyramid: {a: '6', b: '4', h: '3'}, ellipsoid: {a: '3', b: '2', c: '1'},
  capsule: {r: '2', h: '6'}, cap: {r: '5', h: '2'},
  'cap-inverse': {known: 'base-height', base: '4', h: '2'},
  frustum: {r: '4', r2: '2', h: '3'}, tube: {r: '3', r2: '2', h: '5'},
};

describe('published formula examples agree with the working calculator', () => {
  const molecularGuide = mathSearchContent['molecular-weight-calculator']!;
  for (const row of molecularGuide.rows) {
    it(`checks the formula, arithmetic and displayed molar mass for ${row.label}`, async () => {
      const {metrics: [mass]} = await run('molecular-weight-calculator', 'formula', {formula: row.example});
      expect(evaluate(row.formula.replaceAll('×', '*'))).toBeCloseTo(Number(mass.value), 8);
      const displayed = Number(mass.value).toLocaleString('en-US', {maximumFractionDigits: 2});
      expect(`${displayed} ${mass.unit}`).toBe(row.result);
    });
  }

  it('checks the hydrate, mass percentage and mole conversions against the guide', async () => {
    const formula = (input: string) => run('molecular-weight-calculator', 'formula', {formula: input});
    const water = await formula('H2O');
    const hydrate = await formula('MgSO4·7H2O');
    const dry = await formula('MgSO4');
    const glucose = await formula('C6H12O6');
    const sucrose = await formula('C12H22O11');
    const text = (id: string) => molecularGuide.sections.find(section => section.id === id)!.paragraphs.join(' ');
    expect(hydrate.table?.rows.map(row => [row[0], row[1]])).toEqual([['Mg', 1], ['S', 1], ['O', 11], ['H', 14]]);
    expect(text('hydrate-formula')).toContain(`${(Number(hydrate.metrics[0].value) - Number(dry.metrics[0].value)).toFixed(3)} g/mol`);
    const hydrogen = Number(water.table!.rows.find(row => row[0] === 'H')![3]);
    expect(text('percent-by-mass')).toContain(`${(100 * hydrogen / Number(water.metrics[0].value)).toFixed(2)}%`);
    expect(text('mass-and-moles')).toContain(`${Number(glucose.metrics[0].value) * 0.25} g`);
    expect(text('purity-and-mixtures')).toContain(`${(5 / Number(sucrose.metrics[0].value)).toFixed(4)} mol`);
  });

  for (const [slug, examples, metricLabel] of [
    ['area-calculator', areaExamples, 'Area'],
    ['volume-calculator', volumeExamples, 'Volume'],
    ['surface-area-calculator', volumeExamples, 'Surface area'],
  ] as const) {
    for (const row of mathSearchContent[slug]!.rows) {
      it(`${slug}: ${row.label}`, async () => {
        expect(examples[row.id]).toBeDefined();
        const result = await run(slug, row.id, examples[row.id]);
        const label = row.id === 'cap-inverse' ? `Cap 1: ${slug === 'volume-calculator' ? 'volume' : 'total surface area'}` : metricLabel;
        const metric = result.metrics.find(item => item.label === label)!;
        const displayed = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(Number(metric.value));
        expect(`${displayed} ${metric.unit}`).toBe(row.result);
      });
    }
  }

  it('checks the simplified and scaled ratios in the reference table', async () => {
    const rows = mathSearchContent['ratio-calculator']!.rows;
    for (const [id, mode, values] of [
      ['simplify', 'simplify', {a: '18', b: '24'}],
      ['scale-enlarge', 'scale', {a: '3', b: '4', factor: '5', direction: 'enlarge'}],
      ['scale-shrink', 'scale', {a: '15', b: '20', factor: '5', direction: 'shrink'}],
    ] as [string, string, Values][]) {
      const result = await run('ratio-calculator', mode, values);
      expect(String(result.metrics[0].value).replaceAll(' ', '')).toBe(rows.find(row => row.id === id)!.result);
    }
    const decimals = await run('ratio-calculator', 'simplify', {a: '150', b: '225'});
    expect(decimals.metrics[0].value).toBe('2 : 3');
  });

  it.each(['A', 'B', 'C', 'D'])('checks the example for a missing %s term', async solve => {
    const result = await run('ratio-calculator', 'all-proportions', {solve, A: '3', B: '4', C: '9', D: '12'});
    const row = mathSearchContent['ratio-calculator']!.rows.find(item => item.id === `solve-${solve.toLowerCase()}`)!;
    expect(`${solve} = ${result.metrics[0].value}`).toBe(row.result);
  });

  it('checks the mixed-unit and capacity examples in the prose', async () => {
    const area = await run('area-calculator', 'rectangle', {a: '3', aUnit: 'ft', b: '24', bUnit: 'in', outputUnit: 'ft'});
    expect(area.metrics[0].value).toBeCloseTo(6, 12);
    expect(area.metrics[0].unit).toBe('ft²');
    const volume = await run('volume-calculator', 'cuboid', {a: '2', aUnit: 'ft', b: '12', bUnit: 'in', h: '6', hUnit: 'in', outputUnit: 'ft'});
    expect(volume.metrics[0].value).toBeCloseTo(1, 12);
    expect(volume.metrics[0].unit).toBe('ft³');
    const tank = await run('volume-calculator', 'cuboid', {a: '100', aUnit: 'cm', b: '50', bUnit: 'cm', h: '40', hUnit: 'cm', outputUnit: 'm'});
    expect(tank.metrics[0].value).toBeCloseTo(0.2, 12);
    expect(Number(tank.metrics[0].value) * 1000).toBeCloseTo(200, 12);
    const surface = await run('surface-area-calculator', 'cuboid', {a: '2', aUnit: 'ft', b: '12', bUnit: 'in', h: '6', hUnit: 'in', outputUnit: 'ft'});
    expect(surface.metrics[0].value).toBeCloseTo(7, 12);
    expect(surface.metrics[0].unit).toBe('ft²');
  });

  it('checks the open-cylinder and joined-cube surface examples', async () => {
    const cylinder = await run('surface-area-calculator', 'cylinder', {r: '2', h: '5'});
    const total = Number(cylinder.metrics[0].value);
    expect(total).toBeCloseTo(28 * Math.PI, 12);
    expect(total - Math.PI * 2 ** 2).toBeCloseTo(24 * Math.PI, 12);
    expect(total - 2 * Math.PI * 2 ** 2).toBeCloseTo(20 * Math.PI, 12);
    const joined = await run('surface-area-calculator', 'cuboid', {a: '2', b: '1', h: '1'});
    expect(joined.metrics[0].value).toBe(10);
  });

  it('checks the composite areas and scale drawing against the published guide', async () => {
    const sections = mathSearchContent['area-calculator']!.sections;
    const area = async (mode: string, values: Values) => Number((await run('area-calculator', mode, values)).metrics[0].value);
    const rectangle = (length: number, width: number) => area('rectangle', {a: String(length), b: String(width)});
    const trapezoid = (a: number, b: number, height: number) => area('trapezoid', {a: String(a), b: String(b), h: String(height)});
    const outerCircle = await area('circle', {r: '4'});
    const pond = await area('circle', {r: '3'});
    const window = await rectangle(2, 1.5) + await area('sector', {r: '1', angle: '180'});
    const firstPlot = await area('triangle-sss', {a: '3', b: '4', c: '5'});
    const secondPlot = await area('triangle-sss', {a: '5', b: '12', c: '13'});
    const walls = await rectangle(2 * (5 + 4), 2.5);
    const openings = await rectangle(0.9, 2) + await rectangle(1.5, 1.2);
    const gardenBed = await trapezoid(1, 3, 2) + await trapezoid(3, 2, 2) + await area('triangle', {a: '2', b: '2'});
    const expectedAreas = [
      ['path-area', outerCircle - pond],
      ['path-area', await rectangle(9, 6) - await rectangle(8, 5)],
      ['path-area', await rectangle(8, 5) - await rectangle(7, 4)],
      ['irregular-area', window],
      ['wall-area', walls - openings],
      ['wall-area', await trapezoid(2, 3, 6)],
      ['curved-bed-area', gardenBed],
      ['diagonal-area', firstPlot + secondPlot],
      ['polygon-area', 6 * await area('triangle-sss', {a: '4', b: '4', c: '4'})],
      ['polygon-area', await area('triangle', {a: '8', b: '5'})],
      ['scale-drawing-area', await rectangle(6 * 50 / 100, 4 * 50 / 100)],
    ] as const;
    for (const [id, squareMeters] of expectedAreas) {
      const text = sections.find(section => section.id === id)!.paragraphs.join(' ');
      expect(text).toContain(`${squareMeters.toLocaleString('en-US', {maximumFractionDigits: 2})} m²`);
    }
  });

  it('matches the planter, waterline, and pipe examples to the calculator output', async () => {
    const sections = mathSearchContent['volume-calculator']!.sections;
    const planter = sections.find(section => section.id === 'tapered-planter')!;
    const tank = sections.find(section => section.id === 'volume-capacity')!;
    const pipe = sections.find(section => section.id === 'composite-volume')!;
    const examples: {mode: string; values: Values; copy: string; liters?: boolean}[] = [
      {mode: 'frustum', values: {r: '10', rUnit: 'cm', r2: '15', r2Unit: 'cm', h: '20', hUnit: 'cm'}, copy: planter.steps![2], liters: true},
      {mode: 'cuboid', values: {a: '100', aUnit: 'cm', b: '50', bUnit: 'cm', h: '35', hUnit: 'cm'}, copy: tank.paragraphs[0], liters: true},
      {mode: 'cylinder', values: {r: '2', rUnit: 'cm', h: '2', hUnit: 'm'}, copy: pipe.paragraphs[0], liters: true},
      {mode: 'tube', values: {r: '2.5', rUnit: 'cm', r2: '2', r2Unit: 'cm', h: '2', hUnit: 'm'}, copy: pipe.paragraphs[1]},
    ];
    for (const {mode, values, copy, liters} of examples) {
      const {metrics: [volume]} = await run('volume-calculator', mode, {...values, outputUnit: 'cm'});
      const cubicCentimeters = Number(volume.value);
      expect(copy).toContain(`${cubicCentimeters.toLocaleString('en-US', {maximumFractionDigits: 0})} ${volume.unit}`);
      if (liters) expect(copy).toContain(`${(cubicCentimeters / 1000).toLocaleString('en-US', {maximumFractionDigits: 2})} L`);
    }
  });

  it('checks both spherical caps described by the same sphere and base radii', async () => {
    const caps = await run('volume-calculator', 'cap-inverse', {known: 'sphere-base', r: '5', base: '4'});
    expect(caps.metrics.find(metric => metric.label === 'Cap 1: height')!.value).toBe(2);
    expect(caps.metrics.find(metric => metric.label === 'Cap 2: height')!.value).toBe(8);
  });

  it('checks the storage box, capsule and drilled platform examples', async () => {
    const sections = mathSearchContent['volume-calculator']!.sections;
    const volume = async (mode: string, values: Values) => {
      const units = Object.fromEntries(Object.keys(values).map(key => [key + 'Unit', 'cm']));
      const {metrics: [result]} = await run('volume-calculator', mode, {...values, ...units, outputUnit: 'cm'});
      expect(result.unit).toBe('cm³');
      return Number(result.value);
    };
    const box = (a: string, b: string, h: string) => volume('cuboid', {a, b, h});
    const platform = await box('30', '20', '4') + await box('20', '10', '3');
    const hole = await volume('cylinder', {r: '1', h: '7'});
    for (const [id, value] of [
      ['inside-box-volume', await box('48', '28', '22')],
      ['inside-box-volume', await box('48', '28', '20')],
      ['capsule-overall-length', await volume('capsule', {r: '2', h: '6'})],
      ['joined-solids-volume', platform - hole],
    ] as const) {
      const copy = sections.find(section => section.id === id)!.paragraphs.join(' ');
      expect(copy).toContain(value.toLocaleString('en-US', {maximumFractionDigits: 2}) + ' cm³');
    }
  });

  it('checks the image sizing and seed mixture examples in the ratio guide', async () => {
    const sections = mathSearchContent['ratio-calculator']!.sections;
    const image = await run('ratio-calculator', 'all-proportions', {solve: 'D', A: '16', B: '9', C: '1280'});
    expect(sections.find(section => section.id === 'screen-ratio')!.paragraphs[0]).toContain(`The height is ${image.metrics[0].value} pixels`);
    const seedMass = await run('ratio-calculator', 'all-proportions', {solve: 'C', A: '2', B: '5', D: '350'});
    const copy = sections.find(section => section.id === 'adjusting-a-mixture')!.paragraphs[1];
    expect(copy).toContain(`weigh ${seedMass.metrics[0].value} g`);
    expect(copy).toContain(`add only ${Number(seedMass.metrics[0].value) - 100} g`);
  });

  it('reproduces all five pregnancy dating records and the alternate cycle, transfer and leap-year examples', async () => {
    const slug = 'pregnancy-calculator';
    const guide = mathSearchContent[slug]!;
    for (const row of guide.rows) {
      const mode = row.modeId!;
      const fields = defaults(definitionMap.get(slug)!.modes.find(item => item.id === mode)!);
      expect(row.example).toContain(fields.due || fields.date);
      const result = await run(slug, mode, fields);
      const label = mode === 'due-date' ? 'Gestational age on selected date' : 'Estimated due date';
      expect(result.metrics.find(metric => metric.label === label)?.value).toBe(row.result);
    }
    const cycle = await run(slug, 'lmp', {cycle: '32'});
    expect(cycle.metrics.map(item => item.value)).toEqual(expect.arrayContaining(['2027-04-11', '13 weeks, 5 days']));
    const transfer = await run(slug, 'ivf', {date: '2026-07-18', embryo: '3'});
    expect(transfer.metrics[0].value).toBe('2027-04-07');
    for (const [asof, age] of [['2028-02-28', '39 weeks, 5 days'], ['2028-02-29', '39 weeks, 6 days']]) {
      const result = await run(slug, 'due-date', {due: '2028-03-01', asof});
      expect(result.metrics.find(item => item.label === 'Gestational age on selected date')?.value).toBe(age);
    }
  });
});

describe('search guidance is readable in the initial server HTML', () => {
  it('allows a Hindi guidance sentence to move its calculator link after the purpose', () => {
    const sentence = 'Use the {calculatorLink} to convert mixed numbers or perform fraction arithmetic.';
    const messages = {
      [sentence]: 'मिश्रित संख्याओं को बदलने या भिन्नों की गणना करने के लिए {calculatorLink} का उपयोग करें।',
      'fraction calculator': 'भिन्न कैलकुलेटर',
    };
    const html = renderToStaticMarkup(<MathSearchContent slug="ratio-calculator" locale="hi" messages={messages}/>);
    expect(html).toContain('<p>मिश्रित संख्याओं को बदलने या भिन्नों की गणना करने के लिए <a href="/hi/fraction-calculator">भिन्न कैलकुलेटर</a> का उपयोग करें।</p>');
    expect(html).not.toContain('{calculatorLink}');
    expect(html).not.toContain('to convert mixed numbers or perform fraction arithmetic.');
  });

  it.each(Object.keys(mathSearchContent))('renders accessible references and real tool links for %s', slug => {
    const content = mathSearchContent[slug]!;
    const html = renderToStaticMarkup(<><MathSearchAnswer slug={slug}/><MathSearchContent slug={slug}/></>);
    expect(html).toContain(content.answer);
    expect(html).toContain('<caption>');
    expect(html.match(/scope="row"/g)).toHaveLength(content.rows.length);
    expect(html).toContain('aria-labelledby="formula-reference-heading" aria-describedby="formula-scroll-hint" tabindex="0"');
    for (const section of content.sections) {
      if (section.link) {
        const {href} = section.link;
        const target = new URL(href, `https://finflo.org/${slug}`);
        const tool = definitionMap.get(target.pathname.slice(1));
        expect(tool).toBeDefined();
        if (target.hash) {
          expect(tool!.modes.some(mode => target.hash === `#mode-${mode.id}`)).toBe(true);
        }
        expect(html).toContain(`href="${href}"`);
      }
    }
  });

  it('does not add generic guidance to unrelated calculator pages', () => {
    expect(renderToStaticMarkup(<><MathSearchAnswer slug="mortgage-calculator"/><MathSearchContent slug="mortgage-calculator"/></>)).toBe('');
  });
});
