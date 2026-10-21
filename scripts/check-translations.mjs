import {readFile, writeFile} from 'node:fs/promises';
import {translationSource} from './i18n-source.mjs';

const source = await translationSource();
const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join('|');
const numbers = text => (text.normalize('NFKC').replace(/[٠-٩۰-۹०-९]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : digit <= '۹' ? 0x6f0 : 0x966))).match(/\d+(?:[.,]\d+)*/g) || []).map(number => number.replace(/[.,]/g, '').replace(/^0+/, '') || '0').sort().join('|');
const notation = text => (text.match(/[=×÷^+*Σ∑√≤≥±≠⁻²³≈−<>|\[\]]/g) || []).sort().join('');
let failed = false;
const requireDrafts = process.argv.includes('--all-locales');
console.log(`Published languages: ${source.publishedLocales.join(', ')}. ${requireDrafts ? 'All supported dictionaries are required.' : 'Unpublished dictionaries are draft diagnostics; use --all-locales for strict draft checks.'}`);
for (const locale of ['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl']) {
  const ui = JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8'));
  const content = JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8'));
  const dictionary = {...content, ...ui};
  const missing = source.keys.filter(key => !Object.hasOwn(dictionary, key) || !dictionary[key].trim());
  const malformed = source.keys.filter(key => dictionary[key] && placeholders(key) !== placeholders(dictionary[key]));
  const changedNumbers = source.keys.filter(key => dictionary[key] && numbers(key) !== numbers(dictionary[key]));
  const damagedFormulas = source.formulas.filter(key => dictionary[key] && notation(key) !== notation(dictionary[key]));
  const unreadable = source.keys.filter(key => dictionary[key] && /<unk>|⁇/.test(dictionary[key]));
  const required = requireDrafts || source.publishedLocales.includes(locale);
  console.log(`${locale}${required ? '' : ' (unpublished draft)'}: ${source.keys.length - missing.length}/${source.keys.length} messages, ${malformed.length} placeholder errors, ${changedNumbers.length} numeric changes, ${damagedFormulas.length} formula changes, ${unreadable.length} unreadable messages`);
  if (missing.length || malformed.length || changedNumbers.length || damagedFormulas.length || unreadable.length) {
    if (required) failed = true;
    console.error(JSON.stringify({locale, required, missing, malformed, changedNumbers, damagedFormulas, unreadable}, null, 2));
  }
}
if (failed) process.exitCode = 1;
else if (process.argv.includes('--write-manifests')) {
  // These are translation-development manifests. Public availability is controlled
  // separately by publishedLocales after editorial review. Active locales must pass.
  for (const [file, data] of [['page-keys', source.pages], ['runtime-keys', source.runtime], ['translated-pages', source.paths], ['wheel-runtime-keys', source.wheelRuntime], ['home-runtime-keys', source.homeRuntime], ['time-runtime-keys', source.timeRuntime]]) {
    await writeFile(`src/data/locales/${file}.json`, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`${source.paths.length} translation-development routes; published languages: ${source.publishedLocales.join(', ')}. This manifest does not publish a language.`);
}
