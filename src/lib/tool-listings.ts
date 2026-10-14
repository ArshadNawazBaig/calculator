import catalog from '@/data/catalog.json';
import {spinWheels, wheelHref} from '@/lib/spin-wheels/catalog';
import type {ToolCategoryId} from '@/lib/site';

/** Shared discovery data; calculator engines and wheel article copy stay out of search. */
export type ToolListing = {
  slug: string; title: string; category: ToolCategoryId; subcategory: string; type: string;
  href?: string; description?: string; searchTerms?: string[]; favorite?: boolean;
};
export const wheelListings: ToolListing[] = spinWheels.map(wheel => ({
  slug: wheel.slug, title: wheel.title, category: 'spin-wheels', subcategory: 'Random pickers', type: 'interactive_tool',
  href: wheelHref(wheel.slug), description: wheel.summary, searchTerms: wheel.searchTerms, favorite: false,
}));
export const toolListings: ToolListing[] = [...catalog as ToolListing[], ...wheelListings];
export const toolHref = (tool: Pick<ToolListing, 'slug' | 'href'>) => tool.href || `/${tool.slug}`;
