import {mkdir, readFile, writeFile, copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import * as lucide from 'lucide-react';
import sharp from 'sharp';

// Keep the artwork reproducible and use the same symbols as the catalog cards.
// The pregnancy calculator has its own dedicated artwork and is intentionally skipped.
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

const palettes = {
  finance: {dark: '#193c2b', medium: '#d9e4ca', accent: '#d5f915', background: '#f5f3e8'},
  health: {dark: '#294737', medium: '#e6e2d0', accent: '#d5f915', background: '#f8f2e8'},
  math: {dark: '#253e38', medium: '#dce9dc', accent: '#d5f915', background: '#f3f6ed'},
  everyday: {dark: '#373e2b', medium: '#e9e3cf', accent: '#d5f915', background: '#f7f4e9'},
};

function icon(Component, x, y, size, color, strokeWidth = 1.6) {
  if (!Component) throw new Error('Missing calculator illustration icon');
  return `<g transform="translate(${x} ${y})">${renderToStaticMarkup(createElement(Component, {size, color, strokeWidth, 'aria-hidden': true}))}</g>`;
}

function artwork(tool, primary, theme) {
  const palette = palettes[tool.category];
  const [first, second] = theme.icons.map(name => lucide[name]);
  if (!palette || !first || !second) throw new Error(`Invalid illustration theme for ${tool.slug}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.medium}"/></linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.dark}"/><stop offset="1" stop-color="#102c20"/></linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="16"/><feOffset dy="14"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/>
    <circle cx="1110" cy="48" r="240" fill="#fff" opacity=".23"/>
    <circle cx="595" cy="642" r="230" fill="${palette.accent}" opacity=".12"/>
    <path d="M530 317 C635 317 650 210 748 210 M530 317 C635 317 650 420 748 420" fill="none" stroke="${palette.dark}" stroke-opacity=".21" stroke-width="3" stroke-dasharray="7 12"/>
    <rect x="86" y="77" width="448" height="476" rx="48" fill="url(#panel)" filter="url(#shadow)"/>
    <circle cx="310" cy="315" r="172" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
    <circle cx="310" cy="315" r="145" fill="#fff" opacity=".045"/>
    ${icon(primary, 195, 200, 230, palette.accent, 1.35)}
    <rect x="728" y="95" width="226" height="226" rx="44" fill="#fff" fill-opacity=".88" filter="url(#shadow)"/>
    ${icon(first, 793, 160, 96, palette.dark, 1.55)}
    <rect x="864" y="337" width="196" height="196" rx="40" fill="${palette.dark}" filter="url(#shadow)"/>
    ${icon(second, 914, 387, 96, palette.accent, 1.55)}
    <circle cx="668" cy="122" r="13" fill="${palette.accent}"/>
    <circle cx="1057" cy="210" r="21" fill="${palette.accent}" opacity=".72"/>
    <circle cx="683" cy="474" r="7" fill="${palette.dark}" opacity=".35"/>
    <circle cx="706" cy="474" r="7" fill="${palette.dark}" opacity=".2"/>
    <circle cx="729" cy="474" r="7" fill="${palette.dark}" opacity=".12"/>
  </svg>`;
}

try {
  await mkdir(destination, {recursive: true});
  await copyFile('node_modules/lucide-react/LICENSE', `${destination}/LICENSE.txt`);
  const {calculatorIcons} = await server.ssrLoadModule('/src/lib/calculator-icons.ts');
  const manifest = {};
  for (const tool of catalog) {
    if (tool.slug === 'pregnancy-calculator') continue;
    const group = config.subcategories[tool.subcategory] || config.defaults[tool.category];
    const theme = config.themes[group];
    const primary = calculatorIcons[tool.slug];
    const symbol = iconDescriptions.get(primary?.displayName);
    if (!theme || !primary || !symbol) throw new Error(`No visual or symbol description for ${tool.slug}`);
    const repeatedSymbol = theme.icons.some(name => iconDescriptions.get(lucide[name]?.displayName) === symbol);
    const source = Buffer.from(artwork(tool, primary, theme));
    await Promise.all([
      sharp(source).webp({quality: 84, effort: 5}).toFile(`${destination}/${tool.slug}.webp`),
      sharp(source).jpeg({quality: 84, mozjpeg: true}).toFile(`${destination}/${tool.slug}-social.jpg`),
    ]);
    manifest[tool.slug] = {theme: group, symbol, repeatedSymbol};
  }
  await writeFile('src/data/calculator-visuals.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${Object.keys(manifest).length} calculator illustrations and social images.`);
} finally {
  await server.close();
}
