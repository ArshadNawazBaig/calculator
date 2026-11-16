import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import illustrations from '@/data/illustrations.json';
import runtimeKeys from '@/data/locales/runtime-keys.json';
import {GeometryDiagram, GeometryModePicker} from '@/components/calculators/geometry-controls';
import {MaterialMeasurementDiagram, materialMeasurement} from '@/components/calculators/material-measurement-diagram';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults, type Mode, type Values} from '@/lib/calculators/types';
import {calculatorMessages, getContentDictionary} from '@/lib/i18n/content';
import {locales, translator} from '@/lib/i18n/config';
import {AreaShapeDiagram as AreaSource} from '../scripts/illustrations/sources/area';
import {SolidShapeDiagram as SolidSource} from '../scripts/illustrations/sources/solid';
import {PlanarShapeDiagram as PlanarSource} from '../scripts/illustrations/sources/planar';

type Asset = {src: string; width: number; height: number; alt: string};
const assets = illustrations as Record<string, Asset>;
const bySource = new Map(Object.values(assets).map(asset => [asset.src, asset]));
const geometrySlugs = ['area-calculator', 'volume-calculator', 'surface-area-calculator', 'circle-calculator', 'triangle-calculator', 'right-triangle-calculator', 'pythagorean-theorem-calculator'];
const materialSlugs = ['square-footage-calculator', 'concrete-calculator', 'mulch-calculator', 'gravel-calculator', 'roofing-calculator', 'stair-calculator', 'tile-calculator'];

// Enumerate the real input choices, including combinations within a single mode.
// Unit and price selectors do not change the geometry or its measurement labels.
function selectedMeasurements(mode: Mode) {
  return mode.fields.filter(field => ['shape', 'known', 'pair', 'slopeInput', 'areaInput'].includes(field.key))
    .reduce<Values[]>((cases, field) => field.options?.length
      ? cases.flatMap(values => field.options!.map(option => ({...values, [field.key]: option.value})))
      : cases, [defaults(mode)]);
}
const casesFor = (slugs: string[]) => slugs.flatMap(slug => definitionMap.get(slug)!.modes.flatMap(mode =>
  selectedMeasurements(mode).map(values => ({slug, mode, values}))));
const geometryCases = casesFor(geometrySlugs);
const materialCases = casesFor(materialSlugs);
const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (html: string, name: string) => {
  const value = html.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
  return value === undefined ? undefined : decode(value);
};
function expectImage(html: string, expectedAlt: string) {
  expect(html).not.toContain('<svg');
  const images = html.match(/<img\b[^>]*>/g) || [];
  expect(images).toHaveLength(1);
  const image = images[0]!;
  expect(attr(image, 'alt')).toBe(expectedAlt);
  const asset = bySource.get(attr(image, 'src') || '');
  expect(asset, `Missing image manifest entry: ${image}`).toBeDefined();
  expect(attr(image, 'width')).toBe(String(asset!.width));
  expect(attr(image, 'height')).toBe(String(asset!.height));
  return image;
}
function originalDescription({slug, mode, values}: typeof geometryCases[number]) {
  const source = slug === 'area-calculator' ? <AreaSource shape={mode.id}/>
    : ['volume-calculator', 'surface-area-calculator'].includes(slug) ? <SolidSource shape={mode.id} known={values.known}/>
      : <PlanarSource slug={slug} mode={mode.id} values={values}/>;
  const description = attr(renderToStaticMarkup(source), 'aria-label');
  expect(description, `${slug}/${mode.id}`).toBeTruthy();
  return description!;
}

describe('generated content illustrations', () => {
  it('ships decodable, nonempty WebP files with the expected intrinsic aspect ratios', async () => {
    expect(new Set(Object.keys(assets).map(id => id.split('-')[0]))).toEqual(new Set(['area', 'solid', 'planar', 'material', 'home']));
    expect(bySource.size).toBe(Object.keys(assets).length);
    await Promise.all(Object.entries(assets).map(async ([id, asset]) => {
      expect(asset.src).toMatch(/^\/illustrations\/(?:area|solid|planar|material|home)\/[^/]+\.webp$/);
      expect(asset.src).not.toContain('..');
      expect(Number.isInteger(asset.width) && asset.width > 0).toBe(true);
      expect(Number.isInteger(asset.height) && asset.height > 0).toBe(true);
      const bytes = await readFile(resolve('public', decodeURIComponent(asset.src.slice(1))));
      expect(bytes.subarray(0, 4).toString('ascii'), id).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii'), id).toBe('WEBP');
      expect(bytes.readUInt32LE(4) + 8, id).toBe(bytes.length);
      const image = sharp(bytes);
      const metadata = await image.metadata();
      const scale = id.endsWith('-compact') ? 4 : 3;
      expect(metadata.format, id).toBe('webp');
      expect(metadata.width, id).toBe(asset.width * scale);
      expect(metadata.height, id).toBe(asset.height * scale);
      const stats = await image.ensureAlpha().stats();
      expect(stats.channels.at(-1)!.max, `${id} is fully transparent`).toBeGreaterThan(0);
      expect(stats.channels.some(channel => channel.min !== channel.max), `${id} has no visible drawing`).toBe(true);
      if (!id.endsWith('-compact') && !id.startsWith('home-')) expect(asset.alt.length, id).toBeGreaterThan(20);
      else expect(asset.alt, id).toBe('');
    }));
  });

  it('preserves the original measurement description for every geometry mode and selection', () => {
    for (const item of geometryCases) {
      const props = {...item, mode: item.mode.id};
      expectImage(renderToStaticMarkup(<GeometryDiagram {...props}/>), originalDescription(item));
      const compact = expectImage(renderToStaticMarkup(<GeometryDiagram {...props} compact/>), '');
      expect(attr(compact, 'aria-hidden')).toBe('true');
    }
  });

  it('renders every supported material measurement and retains text fallbacks for unsupported inputs', () => {
    for (const item of materialCases) {
      const measurement = materialMeasurement(item);
      const html = renderToStaticMarkup(<MaterialMeasurementDiagram {...item} fallback={<p>Measurement instructions</p>}/>);
      if (measurement) expectImage(html, measurement.description);
      else expect(html).toBe('<p>Measurement instructions</p>');
    }
  });

  it('keeps decorative selector pictures unnamed beside their visible button labels', () => {
    for (const slug of geometrySlugs) {
      const modes = definitionMap.get(slug)!.modes;
      const html = renderToStaticMarkup(<GeometryModePicker slug={slug} modes={modes} selected={modes[0].id} disabled={false} onChange={() => {}}/>);
      const buttons = html.match(/<button\b[\s\S]*?<\/button>/g) || [];
      expect(buttons.length, slug).toBe(modes.length);
      for (const button of buttons) {
        expectImage(button, '');
        expect(button).toMatch(/<span>[^<]+<\/span>/);
      }
    }
  });

  it('includes manifest alternatives in the client message bundles', () => {
    for (const asset of Object.values(assets).filter(asset => asset.alt)) {
      expect(runtimeKeys.math, asset.alt).toContain(asset.alt);
      expect(runtimeKeys.everyday, asset.alt).toContain(asset.alt);
    }
  });

  it.each(locales.filter(locale => locale !== 'en'))('renders localized alternatives from the actual %s calculator bundles', async locale => {
    const dictionary = await getContentDictionary(locale);
    const full = translator(dictionary);
    const checked = new Set<string>();
    for (const item of geometryCases) {
      const original = originalDescription(item);
      if (checked.has(original)) continue;
      checked.add(original);
      const expected = full(original);
      expect(expected, `${locale}: ${original}`).not.toBe(original);
      expect(expected).not.toMatch(/\{\w+\}/);
      const messages = calculatorMessages(dictionary, item.slug, 'math');
      expectImage(renderToStaticMarkup(<GeometryDiagram {...item} mode={item.mode.id} messages={messages}/>), expected);
    }
    for (const item of materialCases) {
      const measurement = materialMeasurement(item);
      if (!measurement || checked.has(measurement.description)) continue;
      checked.add(measurement.description);
      const expected = full(measurement.description);
      expect(expected, `${locale}: ${measurement.description}`).not.toBe(measurement.description);
      expect(expected).not.toMatch(/\{\w+\}/);
      const messages = calculatorMessages(dictionary, item.slug, 'everyday');
      expectImage(renderToStaticMarkup(<MaterialMeasurementDiagram {...item} messages={messages}/>), expected);
    }
  }, 20_000);

  it('retains mathematical variable names in the corrected alternative text', async () => {
    for (const locale of ['es', 'fr', 'de', 'pt'] as const) {
      const t = translator(await getContentDictionary(locale));
      const triangle = t('Triangle with angles A and B marked and side a opposite angle A');
      for (const symbol of ['A', 'B', 'a']) expect(triangle.match(/(?<!\p{L})[a-zA-Z](?!\p{L})/gu), locale).toContain(symbol);
    }
    for (const locale of ['es', 'fr', 'pt'] as const) {
      const t = translator(await getContentDictionary(locale));
      expect(t('Roof slope angle θ above the horizontal footprint')).toContain('θ');
    }
    const ar = translator(await getContentDictionary('ar'));
    expect(ar('Circular floor with diameter d through its center')).toContain(' d ');
    const de = translator(await getContentDictionary('de'));
    expect(de('Ellipse with semi-axis a from center to the right edge and semi-axis b from center to the top')).toContain('Halbachse a');
  });
});
