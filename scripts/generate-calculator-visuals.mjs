import {mkdir, readFile, writeFile, copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import * as lucide from 'lucide-react';
import sharp from 'sharp';

// Keep the artwork reproducible and use the same symbols as the catalog cards.
// The pregnancy calculator keeps its purpose-drawn cover and social preview.
const catalog = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
const config = JSON.parse(await readFile('src/data/calculator-visual-themes.json', 'utf8'));
const descriptions = JSON.parse(await readFile('scripts/illustrations/sources/calculator-symbols.json', 'utf8'));
const translatedDescriptions = JSON.parse(await readFile('src/data/locales/calculator-symbols.json', 'utf8'));
const iconDescriptions = new Map();
for (const [description, names] of Object.entries(descriptions)) {
  for (const locale of ['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl']) {
    if (!translatedDescriptions[description]?.[locale]) throw new Error(`Missing ${locale} description for ${description}`);
  }
  for (const name of names) {
    if (iconDescriptions.has(name)) throw new Error(`Duplicate description for ${name}`);
    iconDescriptions.set(name, description);
  }
}
const destination = 'public/illustrations/calculators';
const server = await createServer({configFile: false, server: {middlewareMode: true, watch: null}, resolve: {alias: {'@': resolve('src')}}});

function icon(Component, x, y, size, color, strokeWidth) {
  if (!Component) throw new Error('Missing calculator illustration icon');
  return createElement('g', {transform: `translate(${x} ${y})`},
    createElement(Component, {size, color, strokeWidth, 'aria-hidden': true}));
}

try {
  await mkdir(destination, {recursive: true});
  await copyFile('node_modules/lucide-react/LICENSE', `${destination}/LICENSE.txt`);
  await mkdir('public/illustrations/examples', {recursive: true});
  await copyFile('node_modules/lucide-react/LICENSE', 'public/illustrations/examples/LICENSE.txt');
  const {calculatorIcons} = await server.ssrLoadModule('/src/lib/calculator-icons.ts');
  const {CalculatorArtwork, calculatorPalettes} = await server.ssrLoadModule('/scripts/illustrations/sources/calculator-artwork.tsx');
  const {calculatorExamples, exampleImage} = await server.ssrLoadModule('/src/lib/calculator-examples.ts');
  const {CatalogExampleArtwork} = await server.ssrLoadModule('/scripts/illustrations/sources/catalog-example.tsx');
  const manifest = {};
  for (const tool of catalog) {
    // Volume has three purpose-drawn examples exported by generate-illustrations.
    if (tool.slug !== 'volume-calculator') {
      const example = calculatorExamples[tool.slug];
      if (example?.rows.length !== 2) throw new Error(`Missing illustrated example for ${tool.slug}`);
      const drawing = renderToStaticMarkup(createElement(CatalogExampleArtwork, {slug: tool.slug, example, icon: calculatorIcons[tool.slug]}));
      await sharp(Buffer.from(drawing)).webp({quality: 86, effort: 5}).toFile('public' + exampleImage(tool.slug));
    }
    if (tool.slug === 'pregnancy-calculator') continue;
    const group = config.subcategories[tool.subcategory] || config.defaults[tool.category];
    const theme = config.themes[group];
    const primary = calculatorIcons[tool.slug];
    const symbol = iconDescriptions.get(primary?.displayName);
    if (!theme || !primary || !symbol) throw new Error(`No visual or symbol description for ${tool.slug}`);
    const repeatedSymbol = theme.icons.some(name => iconDescriptions.get(lucide[name]?.displayName) === symbol);
    const palette = calculatorPalettes[tool.category];
    const [upper, lower] = theme.icons.map(name => lucide[name]);
    if (!palette || !upper || !lower) throw new Error(`Invalid illustration theme for ${tool.slug}`);
    const source = Buffer.from(renderToStaticMarkup(createElement(CalculatorArtwork, {
      palette,
      primary: icon(primary, 195, 200, 230, palette.accent, 1.35),
      upper: icon(upper, 793, 160, 96, palette.dark, 1.55),
      lower: icon(lower, 914, 387, 96, palette.accent, 1.55),
    })));
    await Promise.all([
      sharp(source).webp({quality: 84, effort: 5}).toFile(`${destination}/${tool.slug}.webp`),
      sharp(source).jpeg({quality: 84, mozjpeg: true}).toFile(`${destination}/${tool.slug}-social.jpg`),
    ]);
    manifest[tool.slug] = {theme: group, symbol, repeatedSymbol};
  }
  await writeFile('src/data/calculator-visuals.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${Object.keys(manifest).length} calculator covers and social images, and ${Object.keys(calculatorExamples).length} worked illustrations.`);
} finally {
  await server.close();
}
