import {readFile, writeFile} from 'node:fs/promises';
import {translationSource} from './i18n-source.mjs';

const source = await translationSource();
const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join('|');
const numbers = text => (text.normalize('NFKC').replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))).match(/\d+(?:[.,]\d+)*/g) || []).map(number => number.replace(/[.,]/g, '').replace(/^0+/, '') || '0').sort().join('|');
const notation = text => (text.match(/[=×÷^+*Σ∑√≤≥±≠⁻²³≈−<>|\[\]]/g) || []).sort().join('');
let failed = false;
for (const locale of ['es', 'fr', 'de', 'pt', 'ar']) {
  const ui = JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8'));
  const content = JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8'));
  const dictionary = {...content, ...ui};
  const missing = source.keys.filter(key => !Object.hasOwn(dictionary, key) || !dictionary[key].trim());
  const malformed = source.keys.filter(key => dictionary[key] && placeholders(key) !== placeholders(dictionary[key]));
  const changedNumbers = source.keys.filter(key => dictionary[key] && numbers(key) !== numbers(dictionary[key]));
  const damagedFormulas = source.formulas.filter(key => dictionary[key] && notation(key) !== notation(dictionary[key]));
  const unreadable = source.keys.filter(key => dictionary[key] && /<unk>|⁇/.test(dictionary[key]));
  console.log(`${locale}: ${source.keys.length - missing.length}/${source.keys.length} messages, ${malformed.length} placeholder errors, ${changedNumbers.length} numeric changes, ${damagedFormulas.length} formula changes, ${unreadable.length} unreadable messages`);
  if (missing.length || malformed.length || changedNumbers.length || damagedFormulas.length || unreadable.length) {
    failed = true;
    console.error(JSON.stringify({locale, missing, malformed, changedNumbers, damagedFormulas, unreadable}, null, 2));
  }
}
if (failed) process.exitCode = 1;
else if (process.argv.includes('--write-manifests')) {
  // Publishing the route manifest is deliberately gated on complete dictionaries.
  for (const [file, data] of [['page-keys', source.pages], ['runtime-keys', source.runtime], ['translated-pages', source.paths]]) {
    await writeFile(`src/data/locales/${file}.json`, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`${source.paths.length} translated routes; ${source.paths.length * 6} sitemap URLs.`);
}
