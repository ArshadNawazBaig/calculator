import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';

// Source drawings are maintenance inputs, never shipped as inline SVG content.
// Rasterize at 3x (4x for small selector pictures) to retain fine measurement marks.
const drawingCss = `
.outline { fill: rgba(180,206,112,.14); stroke: #52632c; stroke-width: 1.8; stroke-linejoin: round; }
.measure,.dimension,.height,.extension,.axis,.angle { fill: none; stroke: #5c6750; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.2; }
.height { stroke-dasharray: 4 4; }
.extension { opacity: .5; stroke-width: .8; }
.axis { stroke-dasharray: 3 5; opacity: .4; }
.angle { stroke: #52632c; stroke-width: 1.8; }
.point { fill: #52632c; }
.label { fill: #17191c; font: italic 22px Georgia, serif; text-anchor: middle; }
[data-compact] .outline { stroke-width: 1.6; }
[data-compact] .height { stroke-width: 1; stroke-dasharray: 2 3; }
`;
const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const manifest = {};
const server = await createServer({configFile: false, server: {middlewareMode: true, watch: null}, resolve: {alias: {'@': resolve('src')}}});
try {
  const {AreaShapeDiagram} = await server.ssrLoadModule('/scripts/illustrations/sources/area.tsx');
  const {SolidShapeDiagram} = await server.ssrLoadModule('/scripts/illustrations/sources/solid.tsx');
  const {TankWaterline, TaperedPlanter, PipeSection} = await server.ssrLoadModule('/scripts/illustrations/sources/volume-examples.tsx');
  const {PlanarShapeDiagram} = await server.ssrLoadModule('/scripts/illustrations/sources/planar.tsx');
  const {MaterialDrawingSource} = await server.ssrLoadModule('/scripts/illustrations/sources/material.tsx');
  const {HomeIllustrationSource, homeIllustrations} = await server.ssrLoadModule('/scripts/illustrations/sources/home.tsx');
  const {materialMeasurement} = await server.ssrLoadModule('/src/components/calculators/material-measurement-diagram.tsx');
  const {materialIllustrationId} = await server.ssrLoadModule('/src/lib/illustration-id.ts');
  const {definitionMap} = await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const {defaults} = await server.ssrLoadModule('/src/lib/calculators/types.ts');

  async function exportImage(id, family, name, Component, props, {width = 260, height = 180, alt, compact = false, webp = {lossless: true, effort: 6}} = {}) {
    if (manifest[id]) return;
    if (compact) {width = 40; height = 32;}
    const scale = compact ? 4 : 3;
    let svg = renderToStaticMarkup(createElement(Component, props));
    const description = compact ? '' : alt ?? decode(svg.match(/aria-label="([^"]*)"/)?.[1] || '');
    if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    svg = svg.replace(/\bwidth="[^"]*"/, `width="${width * scale}"`).replace(/\bheight="[^"]*"/, `height="${height * scale}"`);
    // Selector SVGs formerly kept stroke widths in screen pixels. Preserve that
    // weight at 4x export, rather than shrinking strokes with their large viewBox.
    const compactCss = compact ? `
      .outline>*,.measure,.dimension,.height,.extension,.axis,.angle { vector-effect: non-scaling-stroke; }
      [data-compact] .outline { stroke-width: ${1.6 * scale}; }
      .measure,.dimension,.axis { stroke-width: ${1.2 * scale}; }
      .angle { stroke-width: ${1.8 * scale}; }
      [data-compact] .height { stroke-width: ${scale}; stroke-dasharray: ${2 * scale} ${3 * scale}; }
    ` : '';
    svg = svg.replace(/(<svg[^>]*>)/, `$1<style>${drawingCss}${compactCss}</style>`).replaceAll('var(--color-surface)', '#f7f8fb');
    const src = `/illustrations/${family}/${encodeURIComponent(name)}.webp`;
    const file = `public/illustrations/${family}/${name}.webp`;
    await mkdir(`public/illustrations/${family}`, {recursive: true});
    const bytes = await sharp(Buffer.from(svg)).webp(webp).toBuffer();
    await writeFile(file, bytes);
    manifest[id] = {src, width, height, alt: description};
  }
  for (const shape of ['rectangle', 'square', 'triangle', 'triangle-sss', 'trapezoid', 'circle', 'sector', 'ellipse', 'parallelogram']) {
    for (const compact of [false, true]) {
      const name = `${shape}${compact ? '-compact' : ''}`;
      await exportImage(`area-${name}`, 'area', name, AreaShapeDiagram, {shape, compact}, {compact});
    }
  }
  for (const shape of ['sphere', 'cone', 'cube', 'cylinder', 'cuboid', 'capsule', 'cap', 'frustum', 'ellipsoid', 'pyramid', 'tube', 'cap-inverse']) {
    for (const known of shape === 'cap-inverse' ? ['base-height', 'sphere-base'] : ['base-height']) {
      for (const compact of [false, true]) {
        const name = `${shape}${shape === 'cap-inverse' ? `-${known}` : ''}${compact ? '-compact' : ''}`;
        await exportImage(`solid-${name}`, 'solid', name, SolidShapeDiagram, {shape, known, compact}, {compact});
      }
    }
  }
  const volumeArt = {width: 480, height: 252, webp: {quality: 86, effort: 5}};
  const volumeDrawings = [
    ['solid-tank-waterline', 'rectangular-tank-water-depth', TankWaterline],
    ['solid-tapered-planter', 'tapered-planter-soil-depth', TaperedPlanter],
    ['solid-pipe-section', 'pipe-inside-outside-diameters', PipeSection],
  ];
  for (const [id, name, drawing] of volumeDrawings) {
    await exportImage(id, 'solid', name, drawing, {}, volumeArt);
  }
  const planar = [
    ...['radius', 'diameter', 'circumference', 'area'].map(known => ({name: `circle-${known}`, slug: 'circle-calculator', mode: 'circle', values: {known}})),
    ...['sss', 'sas', 'asa', 'ssa'].map(mode => ({name: `triangle-${mode}`, slug: 'triangle-calculator', mode, values: {}})),
    ...['plain', 'h', 'A', 'B', 'h-A', 'h-B'].map(marks => ({name: `right-triangle-${marks}`, slug: 'right-triangle-calculator', mode: 'pair', values: {pair: marks === 'plain' ? 'a,b' : marks.replaceAll('-', ',')}})),
  ];
  for (const {name, ...props} of planar) for (const compact of [false, true]) {
    const variant = `${name}${compact ? '-compact' : ''}`;
    await exportImage(`planar-${variant}`, 'planar', variant, PlanarShapeDiagram, {...props, compact}, {compact});
  }
  for (const slug of ['square-footage-calculator', 'concrete-calculator', 'mulch-calculator', 'gravel-calculator', 'roofing-calculator', 'stair-calculator', 'tile-calculator']) {
    for (const mode of definitionMap.get(slug).modes) {
      let cases = [defaults(mode)];
      for (const field of mode.fields.filter(field => ['shape', 'slopeInput', 'areaInput'].includes(field.key))) {
        if (field.options) cases = cases.flatMap(values => field.options.map(option => ({...values, [field.key]: option.value})));
      }
      for (const values of cases) {
        const measurement = materialMeasurement({slug, mode, values});
        if (!measurement) continue;
        const id = materialIllustrationId(measurement);
        await exportImage(id, 'material', id.slice('material-'.length), MaterialDrawingSource, {measurement}, {alt: measurement.description});
      }
    }
  }
  for (const {id, width, height} of homeIllustrations) {
    await exportImage(`home-${id}`, 'home', id, HomeIllustrationSource, {kind: id, color: id === 'finance' ? '#d5f915' : '#f5f5f6'}, {width, height, alt: ''});
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b, 'en')));
  await writeFile('src/data/illustrations.json', JSON.stringify(sorted, null, 2) + '\n');
  const sizes = await Promise.all(Object.values(manifest).map(async ({src}) => (await readFile(`public${decodeURIComponent(src)}`)).length));
  console.log(`Exported ${sizes.length} WebP illustrations (${Math.round(sizes.reduce((sum, size) => sum + size, 0) / 1024)} KiB total; largest ${Math.max(...sizes)} bytes).`);
} finally {
  await server.close();
}
