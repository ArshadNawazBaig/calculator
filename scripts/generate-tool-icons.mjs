import {readFile, writeFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as lucide from 'lucide-react';
import {toolIcons} from '../src/lib/calculator-icons.ts';
import {modeIconNames} from '../src/lib/calculators/mode-icons.ts';

const license = await readFile(new URL('LICENSE', import.meta.resolve('lucide-react/package.json')), 'utf8');

async function writeSprite(name, icons) {
  const symbols = icons.map(([id, icon]) => {
    const svg = renderToStaticMarkup(createElement(icon));
    const drawing = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
    return `<symbol id="${id}" viewBox="0 0 24 24">${drawing}</symbol>`;
  });
  await writeFile(new URL(`../src/assets/${name}.svg`, import.meta.url),
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">', `<metadata><![CDATA[${license}]]></metadata>`, ...symbols, '</svg>', ''].join('\n'));
}

await writeSprite('tool-icons', Object.entries(toolIcons));
await writeSprite('mode-icons', modeIconNames.map(name => [name, lucide[name]]));
