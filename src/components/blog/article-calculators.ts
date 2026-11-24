import {fromMarkdown} from 'mdast-util-from-markdown';
import {gfmFromMarkdown} from 'mdast-util-gfm';
import {gfm} from 'micromark-extension-gfm';
import type {Link, LinkReference, Nodes} from 'mdast';
import catalog from '@/data/catalog.json';
import {preferredCalculatorSlugs} from '@/data/calculator-relationships';
import type {BlogPost} from '@/lib/blog/types';
import type {CatalogEntry} from '@/lib/calculators/types';
import {categorySlug} from '@/lib/catalog-paths';
import {featuredTools} from '@/lib/home-content';
import {splitLocale} from '@/lib/i18n/config';
import {categories, categoryLabels, site} from '@/lib/site';
import {blogContentUrl} from './blog-markdown';

const calculators = (catalog as CatalogEntry[]).filter(tool => tool.type === 'interactive_tool');
const bySlug = new Map(calculators.map(tool => [tool.slug, tool]));
const siteHost = new URL(site.url).host;
const calculatorHosts = new Set([siteHost, 'finflo.org', 'www.finflo.org']);

function linkedCalculatorSlugs(content: string): string[] {
  const links: (Link | LinkReference)[] = [];
  const definitions = new Map<string, string>();
  function collect(node: Nodes) {
    if (node.type === 'link' || node.type === 'linkReference') links.push(node);
    if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
    if ('children' in node) node.children.forEach(collect);
  }
  collect(fromMarkdown(content, {extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()]}));

  const slugs = new Set<string>();
  for (const link of links) {
    const href = blogContentUrl(link.type === 'link' ? link.url : definitions.get(link.identifier) ?? '');
    if (!href) continue;
    const url = new URL(href, site.url);
    if (!['http:', 'https:'].includes(url.protocol) || !calculatorHosts.has(url.host)) continue;
    const slug = splitLocale(url.pathname).path.replace(/^\/|\/$/g, '');
    if (bySlug.has(slug)) slugs.add(slug);
  }
  return [...slugs];
}

export function articleCalculators(post: Pick<BlogPost, 'category' | 'title' | 'content'>) {
  const category = categories.find(item => categoryLabels[item.id] === post.category)?.id;
  let subjects = linkedCalculatorSlugs(post.content);
  if (!subjects.length) {
    const title = `-${categorySlug(post.title.replace(/[()]/g, ''))}-`;
    subjects = calculators.filter(tool => {
      const topic = tool.slug.replace(/-calculator$/, '');
      return title.includes(`-${categorySlug(tool.title)}-`) || (
        tool.category === category && [topic, topic + 's', topic + 'es'].some(word => title.includes(`-${word}-`))
      );
    }).map(tool => tool.slug).sort((a, b) => b.length - a.length);
  }
  const featured = featuredTools[category ?? 'all'].map(tool => tool.slug);
  const slugs = new Set([...subjects, ...subjects.flatMap(preferredCalculatorSlugs), ...featured]);
  return {
    heading: subjects.length || category ? 'Related calculators' : 'Featured calculators',
    tools: Array.from(slugs, slug => bySlug.get(slug)).filter(tool => tool !== undefined).slice(0, 4),
  };
}
