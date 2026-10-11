/** Extract content coverage and per-calculator client message bundles. */
import {createServer} from 'vite';
import ts from 'typescript';
import {readFile, readdir, writeFile, mkdir, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const textProperties = new Set(['title', 'description', 'label', 'unit', 'hint', 'group', 'formula', 'explanation', 'question', 'answer', 'example', 'notes', 'limitations', 'paragraphs', 'displayValue']);
const skippedProperties = new Set(['key', 'id', 'value', 'default', 'slug', 'algorithm', 'type', 'url', 'href', 'className', 'format', 'name']);
export async function translationSource() {
  const root = process.cwd();
  const server = await createServer({configFile: false, root, server: {middlewareMode: true}, resolve: {alias: {'@': resolve(root, 'src')}}});
  const keys = new Set(), formulas = new Set(), pages = {}, pageCategories = {}, modules = new Map();
  const add = (set, value) => {
    if (typeof value === 'string' && value.trim() && /[a-zA-Z]/.test(value) && !/^(?:https?:|mailto:|\/)/.test(value)) set.add(value);
  };
  function collect(value, set, parent = '') {
    if (typeof value === 'string') { if (textProperties.has(parent)) add(set, value); }
    else if (Array.isArray(value)) value.forEach(item => collect(item, set, parent));
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      // Geographic names retain their source spelling; controls and hints still translate.
      if (key === 'options' && value.translateOptions === false) continue;
      collect(child, set, key);
    }
  }
  async function sourceModule(file) {
    if (modules.has(file)) return modules.get(file);
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const entry = {keys: new Set(), imports: new Set()};
    modules.set(file, entry);
    function accept(value) {
      if (/[a-zA-Z]/.test(value) && (/\s/.test(value) || /^[A-Z][a-z]+$/.test(value)) && !/^(?:https?:|mailto:|\/|@\/|\.\/|use client|text\/)/.test(value)) add(entry.keys, value);
    }
    function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const p = node.parent;
        if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isCallExpression(p) && p.expression.kind === ts.SyntaxKind.ImportKeyword) entry.imports.add(node.text);
        else if (!ts.isLiteralTypeNode(p) && !(ts.isJsxAttribute(p) && skippedProperties.has(p.name.getText(source))) && !(ts.isPropertyAssignment(p) && skippedProperties.has(p.name.getText(source)))) {
          let ancestor = p;
          while (ancestor && !ts.isJsxAttribute(ancestor) && !ts.isStatement(ancestor)) ancestor = ancestor.parent;
          if (!ancestor || !ts.isJsxAttribute(ancestor) || !skippedProperties.has(ancestor.name.getText(source))) accept(node.text);
        }
      } else if (ts.isTemplateExpression(node)) {
        if (!(ts.isJsxExpression(node.parent) && ts.isJsxAttribute(node.parent.parent) && skippedProperties.has(node.parent.parent.name.getText(source)))) {
          const value = node.head.text + node.templateSpans.map((span, index) => `{value${index}}${span.literal.text}`).join('');
          if (/\b[a-zA-Z]{2,}\b/.test(value.replace(/\{value\d+\}/g, ''))) accept(value);
        }
      } else if (ts.isJsxText(node)) {
        const text = node.text.replace(/\s+/g, ' ').trim();
        if (text) accept(text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    return entry;
  }
  async function dependencyKeys(file, visited = new Set()) {
    if (visited.has(file)) return new Set();
    visited.add(file);
    const entry = await sourceModule(file), result = new Set(entry.keys);
    for (const name of entry.imports) {
      const target = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(file), name);
      if (target.startsWith(resolve(root, 'src/data')) && target.endsWith('.json')) {
        collect(JSON.parse(await readFile(target, 'utf8')), result);
        continue;
      }
      if (![resolve(root, 'src/lib/calculators'), resolve(root, 'src/lib/data')].some(prefix => target.startsWith(prefix)) || /(?:definitions|registry)$/.test(target)) continue;
      for (const suffix of ['.ts', '.tsx']) {
        try { await access(target + suffix); } catch { continue; }
        for (const key of await dependencyKeys(target + suffix, visited)) result.add(key);
        break;
      }
    }
    return result;
  }
  try {
    const {definitions, catalog, blocked} = await server.ssrLoadModule('/src/lib/calculators/registry.ts');
    const {calculate} = await server.ssrLoadModule('/src/lib/calculators/engine.ts');
    const {defaults} = await server.ssrLoadModule('/src/lib/calculators/types.ts');
    const rendered = {finance: new Set(), health: new Set(), math: new Set(), everyday: new Set()};
    for (const definition of definitions) {
      const owned = new Set(); collect(definition, owned);
      pages[definition.slug] = [...owned].sort();
      definition.modes.forEach(mode => formulas.add(mode.formula));
      pageCategories[definition.slug] = catalog.find(tool => tool.slug === definition.slug).category;
      for (const key of owned) keys.add(key);
      for (const mode of definition.modes) {
        // No network requests during extraction. Provider messages are scanned below.
        if (['currency-reference', 'currency-global', 'road-route'].includes(mode.algorithm)) continue;
        const category = pageCategories[definition.slug];
        try {
          const result = await calculate(category, mode, defaults(mode));
          for (const metric of result.metrics) { add(rendered[category], metric.label); add(rendered[category], metric.unit); }
          for (const heading of result.table?.headers || []) add(rendered[category], heading);
          for (const point of result.chart || []) add(rendered[category], point.label);
        } catch (error) { add(rendered[category], error.message); }
      }
    }
    Object.values(blocked).forEach(value => add(keys, value));
    const info = JSON.parse(await readFile('src/data/information-content.json', 'utf8'));
    collect(JSON.parse(await readFile('src/data/analytics-copy.json', 'utf8')), keys);
    const {guides} = await server.ssrLoadModule('/src/data/guides.ts');
    const content = JSON.parse(await readFile('src/data/calculator-content.json', 'utf8'));
    collect(JSON.parse(await readFile('src/data/directory-content.json', 'utf8')), keys);
    for (const entry of [...Object.values(info), ...Object.values(guides), ...Object.values(content)]) collect(entry, keys);
    const {calculatorCardData} = await server.ssrLoadModule('/src/lib/calculator-cards.ts');
    const descriptions = Object.fromEntries(catalog.map(tool => [tool.slug, calculatorCardData(tool).description]));
    Object.values(descriptions).forEach(value => add(keys, value));
    collect(JSON.parse(await readFile('src/data/vehicle-tax-2026.json', 'utf8')), keys);
    const runtime = {};
    const common = new Set((await sourceModule(resolve(root, 'src/lib/calculators/engine.ts'))).keys);
    for (const entry of await readdir('src/components/calculators')) {
      if (!/\.tsx?$/.test(entry)) continue;
      const parsed = await sourceModule(resolve(root, 'src/components/calculators', entry));
      for (const key of parsed.keys) common.add(key);
    }
    for (const helper of ['input-display', 'result-presentation', 'row-data']) {
      for (const key of await dependencyKeys(resolve(root, `src/lib/calculators/${helper}.ts`))) common.add(key);
    }
    for (const category of ['finance', 'health', 'math', 'everyday']) {
      const categoryKeys = await dependencyKeys(resolve(root, `src/lib/calculators/${category}-engine.ts`));
      if (category === 'everyday') for (const helper of ['base64-codec', 'road-route']) for (const key of await dependencyKeys(resolve(root, `src/lib/calculators/${helper}.ts`))) categoryKeys.add(key);
      if (category === 'everyday') for (const key of (await sourceModule(resolve(root, 'src/app/api/road-route/route.ts'))).keys) categoryKeys.add(key);
      runtime[category] = [...new Set([...common, ...categoryKeys, ...rendered[category]])].sort();
      runtime[category].forEach(key => keys.add(key));
    }
    for (const file of ['src/components/i18n/calculator-article.tsx', 'src/lib/i18n/pages.tsx']) {
      for (const key of (await sourceModule(resolve(root, file))).keys) keys.add(key);
    }
    const existing = JSON.parse(await readFile('src/data/locales/es.json', 'utf8'));
    Object.keys(existing).filter(key => !/^tool\.|^description\./.test(key)).forEach(key => keys.add(key));
    // Routes match the English sitemap. Unavailable tools and system pages stay excluded.
    const {categories} = await server.ssrLoadModule('/src/lib/site.ts');
    const {categorySlug} = await server.ssrLoadModule('/src/lib/catalog-paths.ts');
    const paths = ['/', '/calculators', '/guides', '/sitemap', ...categories.map(c => `/calculators/${c.id}`), ...new Set(catalog.map(tool => `/calculators/${tool.category}/${categorySlug(tool.subcategory)}`)), ...Object.keys(info).map(slug => `/${slug}`), ...Object.keys(guides).map(slug => `/guides/${slug}`), ...definitions.map(d => `/${d.slug}`)];
    return {keys: [...keys].sort(), formulas: [...formulas].sort(), pages, runtime, pageCategories, paths, descriptions};
  } finally { await server.close(); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = await translationSource(), target = process.argv[2] || '/tmp/finflo-i18n-source.json';
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, JSON.stringify(data, null, 2) + '\n');
  console.log(JSON.stringify({keys: data.keys.length, words: data.keys.reduce((sum, key) => sum + key.split(/\s+/).length, 0), runtime: Object.fromEntries(Object.entries(data.runtime).map(([category, keys]) => [category, keys.length])), pages: Object.keys(data.pages).length, paths: data.paths.length, target}));
}
