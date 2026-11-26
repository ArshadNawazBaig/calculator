import {createElement} from 'react';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {ArrowUpRight,ChartColumnIncreasing,TrendingUp,Landmark,HeartPulse,Calculator,CalendarDays,type LucideIcon} from 'lucide-react';
import catalog from '@/data/catalog.json';
import {calculatorIcons,toolIcons} from '@/lib/calculator-icons';

function geometry(icon:LucideIcon){
  return renderToStaticMarkup(createElement(icon)).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
}

describe('calculator icon coverage',()=>{
  it('includes the assigned artwork for each tool in the shared browser sprite',()=>{
    const sprite=readFileSync(new URL('../src/assets/tool-icons.svg',import.meta.url),'utf8');
    const symbols=new Map([...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24">(.+?)<\/symbol>/g)].map(match=>[match[1],match[2]]));
    expect([...symbols.keys()].sort()).toEqual(Object.keys(toolIcons).sort());
    for(const [slug,icon] of Object.entries(toolIcons)) expect(symbols.get(slug),slug).toBe(geometry(icon));
  });
  it('assigns an icon to every calculator without stale entries',()=>{
    expect(Object.keys(calculatorIcons).sort()).toEqual(catalog.map(tool=>tool.slug).sort());
  });

  it('uses distinct rendered shapes, including across icon aliases',()=>{
    const assigned=new Map<string,string>();
    for(const [slug,icon] of Object.entries(calculatorIcons)){
      const shape=geometry(icon);
      expect(assigned.has(shape),`${slug} repeats the icon for ${assigned.get(shape)}`).toBe(false);
      assigned.set(shape,slug);
    }
  });

  it('excludes rejected icons and keeps category symbols separate',()=>{
    const excluded=new Set([ArrowUpRight,ChartColumnIncreasing,TrendingUp,Landmark,HeartPulse,Calculator,CalendarDays].map(geometry));
    for(const [slug,icon] of Object.entries(calculatorIcons)){
      expect(excluded.has(geometry(icon)),`${slug} uses a rejected or category icon`).toBe(false);
    }
  });
});
