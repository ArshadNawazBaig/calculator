import {createServer} from 'vite';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';

// Structural inventory, not a Google quality score or a minimum-word-count rule.
const output = process.env.CONTENT_OUTPUT || 'docs/validation/content-inventory.json';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const [copy, directories, paths] = await Promise.all([
  readJSON('src/data/calculator-content.json'),
  readJSON('src/data/directory-content.json'),
  readJSON('src/data/locales/translated-pages.json'),
]);
const server = await createServer({configFile: false, server: {middlewareMode: true}, resolve: {alias: {'@': resolve('src')}}});
const issues = [], pages = [], descriptions = new Map();
try {
  const {definitions, catalog, noInitialExampleTools} = await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const {guides} = await server.ssrLoadModule('/src/data/guides.ts');
  const {information} = await server.ssrLoadModule('/src/data/information.ts');
  const {zones, zoneHref, timeTools} = await server.ssrLoadModule('/src/lib/time/catalog.ts');
  const {spinWheels, wheelHref} = await server.ssrLoadModule('/src/lib/spin-wheels/catalog.ts');
  const {wheelGuides} = await server.ssrLoadModule('/src/lib/spin-wheels/guides.ts');
  const {studentDirectory} = await server.ssrLoadModule('/src/lib/student-tools.ts');
  const byPath = new Map(definitions.map(definition => [`/${definition.slug}`, definition]));
  const clocks = new Map(zones.map(zone => [zoneHref(zone), zone]));
  const wheels = new Map(spinWheels.map(wheel => [wheelHref(wheel.slug), wheel]));
  const seenParagraphs = new Map();

  for (const path of paths) {
    const definition = byPath.get(path), clock = clocks.get(path), wheel = wheels.get(path);
    let page;
    if (definition) {
      const entry = copy[definition.slug];
      const tool = catalog.find(tool => tool.slug === definition.slug);
      if (!entry?.sections?.length || !entry.faqs?.length) issues.push(`${path}: missing guide or FAQ`);
      if (!definition.description.trim()) issues.push(`${path}: missing description`);
      const previous = descriptions.get(definition.description);
      if (previous) issues.push(`${path}: calculator description duplicates ${previous}`);
      descriptions.set(definition.description, path);
      for (const section of entry?.sections || []) for (const paragraph of section.paragraphs) {
        const previousPath = seenParagraphs.get(paragraph);
        if (previousPath && previousPath !== path) issues.push(`${path}: guide paragraph duplicates ${previousPath}`);
        seenParagraphs.set(paragraph, path);
      }
      page = {path, kind: 'calculator', title: tool.title, modes: definition.modes.map(mode => mode.title),
        guideSections: entry?.sections.length || 0, faqs: entry?.faqs.length || 0,
        references: definition.sources.length, fixedWorkedExample: !noInitialExampleTools.has(definition.slug)};
    } else if (clock) {
      page = {path, kind: 'regional-clock', zone: clock.id, aliases: clock.aliases,
        value: 'Live local date, time, UTC offset and upcoming offset change; aliases resolve to this entry.'};
    } else if (wheel) {
      const guide = wheelGuides[wheel.slug];
      if (!guide?.steps.length || !guide.questions.length) issues.push(`${path}: missing wheel instructions or FAQ`);
      page = {path, kind: 'spin-wheel', title: wheel.title, guideSections: guide?.sections.length || 0, faqs: guide?.questions.length || 0};
    } else if (directories[path]) {
      const entry = directories[path];
      for (const section of entry.sections) for (const link of section.links) {
        if (!paths.includes(link.href)) issues.push(`${path}: directory link missing from indexable routes: ${link.href}`);
      }
      page = {path, kind: 'calculator-directory', guideSections: entry.sections.length};
    } else if (path === studentDirectory.path) page = {path, kind: 'student-directory'};
    else if (guides[path.replace(/^\/guides\//, '')]) {
      const guide = guides[path.replace(/^\/guides\//, '')];
      page = {path, kind: 'guide', title: guide.title, guideSections: guide.sections.length};
    } else if (information[path.slice(1)]) {
      const entry = information[path.slice(1)];
      page = {path, kind: 'information', title: entry.title, guideSections: entry.sections.length};
    } else if (timeTools.some(tool => tool.href === path)) page = {path, kind: 'time-tool'};
    else if (['/', '/guides', '/sitemap', '/spin-wheels'].includes(path)) page = {path, kind: 'navigation-hub'};
    else {issues.push(`${path}: unclassified route`); page = {path, kind: 'unclassified'};}
    pages.push(page);
  }
  for (const path of byPath.keys()) if (!paths.includes(path)) issues.push(`${path}: implemented calculator missing from route inventory`);
  const counts = Object.fromEntries([...new Set(pages.map(page => page.kind))].map(kind => [kind, pages.filter(page => page.kind === kind).length]));
  const report = {checkedAt: new Date().toISOString(),
    scope: 'English source routes and their shared templates. Translation coverage and rendered URLs are checked separately.',
    criteria: ['Completes the stated task', 'Explains assumptions and interpretation', 'Matches implemented functionality', 'Offers readable examples', 'Uses relevant sources and links'],
    limitations: ['This inventory does not classify pages on behalf of Google or predict rankings.', 'No word-count threshold is used. Interactive tool value and original guidance must be assessed together.', 'The content review does not replace specialist review or an independent native-language review.'],
    counts, sourceRoutes: paths.length, calculatorModes: definitions.reduce((sum, definition) => sum + definition.modes.length, 0),
    issues, pages};
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({output, routes: pages.length, counts, issues}, null, 2));
  if (issues.length) process.exitCode = 1;
} finally {
  await server.close();
}
