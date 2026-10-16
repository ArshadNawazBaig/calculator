import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {definitions} from '@/lib/calculators/registry';
import {locales} from '@/lib/i18n/config';
import {getContentDictionary} from '@/lib/i18n/content';
import {calculatorInsights} from '@/lib/editorial-insights';
import {CalculatorInsight} from '@/components/content/calculator-insight';
import {GuideIllustration} from '@/components/content/guide-illustration';
import {ClockComparison} from '@/components/time/clock-comparison';
import {WheelOdds} from '@/components/spin-wheels/wheel-odds';
import {mortgageIllustration,growthIllustration,bmiIllustration} from '@/lib/guide-illustrations';
import {compareMetrics} from '@/lib/scenario-comparison';
import explanationCopy from '@/data/locales/explanations.json';
import guideCopy from '@/data/locales/guide-visuals.json';
import demoCopy from '@/data/locales/learning-demos.json';
import utilityCopy from '@/data/locales/utility-guidance.json';
import informationNotes from '@/data/insights/information.json';
import {information} from '@/data/information';
import {InformationInsight} from '@/components/content/information-insight';

describe('original calculator interpretation',()=>{
  it('covers every calculator in every language with distinct published guidance',()=>{
    expect(Object.keys(calculatorInsights).sort()).toEqual(definitions.map(definition=>definition.slug).sort());
    for(const locale of locales){
      const bodies=new Set<string>();
      for(const definition of definitions){
        const insight=calculatorInsights[definition.slug]?.[locale];
        expect(insight,`${definition.slug}/${locale}`).toBeDefined();
        expect(insight.heading.trim()).toBeTruthy();
        expect(insight.body.trim()).toBeTruthy();
        expect(bodies.has(insight.body),`${definition.slug}/${locale}: duplicate prose`).toBe(false);
        bodies.add(insight.body);
        if(locale!=='en')expect(insight.body).not.toBe(calculatorInsights[definition.slug].en.body);
        const html=renderToStaticMarkup(<CalculatorInsight slug={definition.slug} locale={locale}/>);
        expect(html).toContain('data-calculator-insight');
        expect(html).toContain('<h2>');
        expect(html).not.toMatch(/undefined|<unk>|⁇/);
      }
    }
  });
  it('keeps standalone explanation controls completely localized',()=>{
    const leaves=(value:unknown,prefix=''):Record<string,string>=>typeof value==='string'?{[prefix]:value}:Object.assign({},...Object.entries(value as Record<string,unknown>).map(([key,child])=>leaves(child,`${prefix}.${key}`)));
    for(const dictionary of [explanationCopy,guideCopy,demoCopy,utilityCopy])for(const locale of locales){
      const entries=leaves(dictionary[locale]);
      expect(Object.keys(entries).sort()).toEqual(Object.keys(leaves(dictionary.en)).sort());
      for(const value of Object.values(entries))expect(value.trim()).toBeTruthy();
    }
  });
  it('publishes page-specific guidance on every information page in every language',()=>{
    expect(Object.keys(informationNotes).sort()).toEqual(Object.keys(information).sort());
    for(const slug of Object.keys(informationNotes))for(const locale of locales){
      const html=renderToStaticMarkup(<InformationInsight slug={slug} locale={locale}/>);
      expect(html).toContain('data-information-insight');
      expect(html).toContain('<h2>');
    }
  });
});

describe('numerical explanation examples',()=>{
  it('separates mortgage principal from interest without changing the scheduled payment',()=>{
    const {payment,rows}=mortgageIllustration();
    expect(payment).toBeCloseTo(2022.61767517749,8);
    expect(rows[0].interest).toBeCloseTo(1733.33333333333,8);
    expect(rows[0].principal).toBeCloseTo(289.28434184416,8);
    expect(rows.at(-1)!.balance).toBeLessThan(0.000001);
    for(const row of rows)expect(row.principal+row.interest).toBeCloseTo(payment,6);
    expect(rows[0].interest).toBeGreaterThan(rows[1].interest);
  });
  it('distinguishes contributions, growth, and height sensitivity',()=>{
    expect(growthIllustration().at(-1)!.balance).toBeCloseTo(16288.94626777442,8);
    expect(growthIllustration().every(row=>row.deposit===10000)).toBe(true);
    const [first,second]=bmiIllustration();
    expect(first.bmi).toBeCloseTo(22.85714285714,8);
    expect(second.bmi).toBeCloseTo(21.60493827160,8);
    expect(first.weight).toBe(second.weight);
  });
  it('compares only matching numeric measures and preserves percentage-point deltas',()=>{
    const baseline=[{label:'Rate',value:20,format:'percent' as const},{label:'Balance',value:100,format:'money' as const},{label:'Time',value:3,unit:'hours'},{label:'Category',value:'A'}];
    const current=[{label:'Rate',value:25,format:'percent' as const},{label:'Balance',value:80,format:'money' as const},{label:'Time',value:180,unit:'minutes'},{label:'Category',value:'B'}];
    const rows=compareMetrics(baseline,current);
    expect(rows.map(row=>row.difference)).toEqual([5,-20]);
    expect(compareMetrics([{label:'Amount',value:0}],[{label:'Amount',value:5}])[0].difference).toBe(5);
    expect(compareMetrics([{label:'Amount',value:Number.MAX_VALUE}],[{label:'Amount',value:-Number.MAX_VALUE}])).toEqual([]);
    expect(compareMetrics([{label:'Amount',value:1,numericText:true}],[{label:'Amount',value:2}])).toEqual([]);
  });
  it('counts duplicate wheel entries as multiple tickets',()=>{
    const html=renderToStaticMarkup(<WheelOdds entries={['A','A','B','']} example/>);
    expect(html).toContain('66.67%');
    expect(html).toContain('33.33%');
  });
  it('publishes date-aware half-hour and quarter-hour clock comparisons',()=>{
    const html=renderToStaticMarkup(<ClockComparison zoneId="Asia/Kathmandu" at={Date.UTC(2026,0,15,23,30)}/>);
    expect(html).toContain('UTC+05:45');
    expect(html).toContain('UTC+05:30');
    expect(html).toContain('Jan 16, 2026');
    expect(html).toContain('2026-01-15T23:30:00.000Z');
  });
  it.each(locales.filter(locale=>locale!=='en'))('renders readable guide tables in %s',async locale=>{
    const messages=await getContentDictionary(locale);
    for(const slug of ['understanding-mortgage-payments','compound-interest-and-contributions','bmi-as-a-screening-tool']){
      const html=renderToStaticMarkup(<GuideIllustration slug={slug} locale={locale} messages={messages}/>);
      expect(html).toContain('<table');
      expect(html).not.toContain('Initial deposit');
      expect(html).not.toContain(guideCopy.en.mortgageNote);
      expect(html).not.toContain('<th scope="col">Balance</th>');
      expect(html).not.toMatch(/\{(?:principal|payment|rate|years|weight)\}/);
    }
  });
});
