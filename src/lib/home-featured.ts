import catalog from '@/data/catalog.json';
import {calculatorCardData} from '@/lib/calculator-cards';
import {featuredTools, type FeaturedTool} from '@/lib/home-content';
import type {CategoryId, ToolCategoryId} from '@/lib/site';
import {spinWheels, wheelHref} from '@/lib/spin-wheels/catalog';
import type {ToolListing} from '@/lib/tool-listings';

export type HomeFeaturedTool = FeaturedTool & {subcategory: string};

// Build the homepage selections on the server so the full catalog stays out of its client bundle.
function calculatorGroup(category: CategoryId): HomeFeaturedTool[] {
  const featured = new Map(featuredTools[category].map(tool => [tool.slug, tool]));
  return (catalog as ToolListing[]).filter(tool => tool.category === category).map(tool => ({
    ...(featured.get(tool.slug) || calculatorCardData(tool)),
    subcategory: tool.subcategory,
  }));
}

const calculatorGroups = {
  finance: calculatorGroup('finance'),
  health: calculatorGroup('health'),
  math: calculatorGroup('math'),
  everyday: calculatorGroup('everyday'),
};
export const homeFeaturedTools: Record<ToolCategoryId, HomeFeaturedTool[]> = {
  ...calculatorGroups,
  'spin-wheels': spinWheels.map(wheel => ({title: wheel.title, slug: wheel.slug, category: 'spin-wheels', subcategory: 'Random pickers', description: wheel.summary, href: wheelHref(wheel.slug), favorite: false})),
  time: featuredTools.time.map(tool => ({...tool, subcategory: 'Time & clocks'})),
};
