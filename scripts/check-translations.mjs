import {readFile, writeFile} from 'node:fs/promises';
import {translationSource} from './i18n-source.mjs';
import {translationIssues} from './i18n-validation.mjs';

const source = await translationSource();
let failed = false;
const requireDrafts = process.argv.includes('--all-locales');
console.log(`Published languages: ${source.publishedLocales.join(', ')}. ${requireDrafts ? 'All supported dictionaries are required.' : 'Unpublished dictionaries are draft diagnostics; use --all-locales for strict draft checks.'}`);
for (const locale of ['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl']) {
  const ui = JSON.parse(await readFile(`src/data/locales/${locale}.json`, 'utf8'));
  const content = JSON.parse(await readFile(`src/data/locales/content/${locale}.json`, 'utf8'));
  const issues = translationIssues(source, ui, content, locale);
  const {missing, missingShared, malformed, changedNumbers, damagedFormulas, unreadable, unexpectedScripts, changedIdentifiers} = issues;
  const required = requireDrafts || source.publishedLocales.includes(locale);
  console.log(`${locale}${required ? '' : ' (unpublished draft)'}: ${source.keys.length - missing.length}/${source.keys.length} messages, ${missingShared.length} missing shared messages, ${malformed.length} placeholder errors, ${changedNumbers.length} numeric changes, ${damagedFormulas.length} formula changes, ${unreadable.length} unreadable messages, ${unexpectedScripts.length} unexpected-script messages, ${changedIdentifiers.length} changed technical identifiers`);
  if (Object.values(issues).some(entries => entries.length)) {
    if (required) failed = true;
    const detail = process.argv.includes('--verbose') ? issues : Object.fromEntries(Object.entries(issues).map(([kind, entries]) => [kind, entries.slice(0, 5)]));
    console.error(JSON.stringify({locale, required, ...detail, ...(!process.argv.includes('--verbose') ? {note: 'At most five examples per issue. Use --verbose for every affected message.'} : {})}, null, 2));
  }
}
const manifests = [['page-keys', source.pages], ['runtime-keys', source.runtime], ['translated-pages', source.paths], ['wheel-runtime-keys', source.wheelRuntime], ['home-runtime-keys', source.homeRuntime], ['time-runtime-keys', source.timeRuntime]];
if (!failed && process.argv.includes('--write-manifests')) {
  for (const [file, data] of manifests) {
    await writeFile(`src/data/locales/${file}.json`, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`Updated message bundles and ${source.paths.length} translated routes for ${source.publishedLocales.join(', ')}.`);
} else if (!process.argv.includes('--write-manifests')) {
  for (const [file, data] of manifests) {
    const stored = JSON.parse(await readFile(`src/data/locales/${file}.json`, 'utf8'));
    if (JSON.stringify(stored) !== JSON.stringify(data)) {
      failed = true;
      console.error(`${file}.json is stale. Complete translations, then run npm run i18n:check -- --write-manifests.`);
    }
  }
}
if (failed) process.exitCode = 1;
