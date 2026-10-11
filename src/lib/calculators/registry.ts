import methodCopy from '@/data/method-copy.json';
import {calculatorFamilies, relatedCalculatorSlugs} from '@/data/calculator-relationships';
import {remainingDefinitions} from './remaining-definitions';
import {roadRouteDefinition} from './road-route-definition';
import {historicalFhaMode} from './historical-fha';
import currencyInstruments from '@/data/currency-instruments.json';
import {vehicleTaxDefinitions} from './vehicle-tax-definitions';
import {additionalTaxDefinitions,additionalFederalFields} from './tax-additional-definitions';
import {annualPayDefinition,expandMarriageMode} from './annual-pay-definitions';
import {programCompositionDefinitions} from './program-composition-definitions';
import {taxCompositionDefinitions} from './tax-composition-definitions';
import textCharsets from '@/data/text-charsets.json';
import {mode,t} from './types';
import {completionEverydayDefinitions} from './everyday-completion-definitions';
import moleculePresets from '@/data/molecule-presets.json';
import {debtCompositionDefinitions} from './debt-composition-definitions';
import {completionFinanceDefinitions} from './finance-completion-definitions';
import {s} from './types';
import overrides from '@/data/calculator-overrides.json';
import {researchHealthDefinitions} from './health-research-definitions';
import {taxModuleDefinitions} from './tax-module-definitions';
import {programMortgageDefinitions} from './program-mortgage-definitions';
import {policyFinanceDefinitions} from './finance-policy-definitions';
import {householdFinanceDefinitions} from './finance-household-definitions';
import descriptions from '@/data/tool-descriptions.json';
import {cashflowFinanceDefinitions} from './finance-cashflow-definitions';
import {planningFinanceDefinitions} from './finance-planning-definitions';
import {growthFinanceDefinitions} from './finance-growth-definitions';
import {advancedFinanceDefinitions} from "./finance-advanced-definitions";
import rawCatalog from '@/data/catalog.json';
import {mathDefinitions} from './math-definitions';
import {healthDefinitions} from './health-definitions';
import {financeCoreDefinitions} from './finance-definitions';
import {financeExtraDefinitions} from './finance-extra-definitions';
import {everydayDefinitions} from './everyday-definitions';
import type {CatalogEntry,Definition} from './types';
export const catalog=rawCatalog as CatalogEntry[];
export const definitions:Definition[]=structuredClone([...financeCoreDefinitions,...financeExtraDefinitions,...healthDefinitions,...mathDefinitions,...everydayDefinitions,roadRouteDefinition]);
for(const [slug,modes]of Object.entries(advancedFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug)!;if(slug==='lease-calculator'||slug==='inflation-calculator')d.modes.unshift(...modes);else d.modes.push(...modes);}
const lease=definitions.find(d=>d.slug==='lease-calculator')!;lease.description='Calculate an asset-financing lease payment or implied rate from asset value, residual, and term.';
const inflation=definitions.find(d=>d.slug==='inflation-calculator')!;inflation.description='Compare historical US purchasing power using official CPI data, or explore an assumed future inflation rate.';inflation.sources.push({title:'BLS CPI-U all items, US city average (CUUR0000SA0)',url:'https://data.bls.gov/timeseries/CUUR0000SA0'});inflation.notes=['Historical calculations use a versioned BLS dataset. Future scenarios use your assumed rate; they are not forecasts.'];
for(const d of definitions){if(d.slug==='canadian-mortgage-calculator'||d.slug==='mortgage-calculator-uk'){const symbol=d.slug==='mortgage-calculator-uk'?'£':'CAD';d.modes=d.modes.map(mode=>({...mode,fields:mode.fields.map(f=>({...f,unit:f.unit?.replace('$',symbol),...(d.slug==='canadian-mortgage-calculator'&&f.key==='years'?{label:'Amortization period'}:{})}))}));}}
for(const [slug,modes]of Object.entries(growthFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug);if(!d)throw Error('Missing '+slug);d.modes.push(...modes);}
for(const [slug,modes]of Object.entries(planningFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug);if(!d)throw Error('Missing '+slug);d.modes.push(...modes);}
for(const [slug,modes]of Object.entries(cashflowFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug);if(!d)throw Error('Missing '+slug);for(const mode of modes)d.modes.push({...mode,id:d.modes.some(m=>m.id===mode.id)?mode.id+'-cashflows':mode.id});}
for(const d of definitions){const description=(descriptions as Record<string,string>)[d.slug];if(description)d.description=description;}
for(const slug of ['401k-calculator','ira-calculator','roth-ira-calculator'])definitions.find(d=>d.slug===slug)!.sources.push({title:'IRS Notice 2025-67: retirement-plan limits for 2026',url:'https://www.irs.gov/pub/irs-drop/n-25-67.pdf'});
for(const [slug,modes]of Object.entries(householdFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug);if(!d)throw Error('Missing '+slug);d.modes.push(...modes);}
for(const [slug,modes]of Object.entries(policyFinanceDefinitions())){const d=definitions.find(d=>d.slug===slug);if(!d)throw Error('Missing '+slug);d.modes.push(...modes);}
for(const [slug,modes]of Object.entries(programMortgageDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
for(const [slug,modes]of Object.entries(taxModuleDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
for(const [slug,modes]of Object.entries(researchHealthDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
for(const [slug,modes]of Object.entries(completionFinanceDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
definitions.find(d=>d.slug==='student-loan-calculator')!.modes.push({...definitions.find(d=>d.slug==='payment-calculator')!.modes.find(m=>m.algorithm==='payoff')!,id:'fixed-payment',title:'Fixed-payment payoff'});
for(const d of definitions)for(const mode of d.modes)if(['simple-interest','simple-inverse'].includes(mode.algorithm)){mode.fields=mode.fields.map(f=>f.key==='years'?{...f,label:'Duration',min:0,max:1200}:f);mode.fields.push(s('timeUnit','Duration unit',[['years','Years'],['months','Months']]));mode.explanation+=' Monthly durations are normalized by dividing by 12; the annual rate remains unchanged.';}
for(const d of definitions){const edit=(overrides as Record<string,{notes?:string[];sources:{title:string;url:string}[];removeSources?:string[]}>)[d.slug];if(!edit)continue;if(edit.notes)d.notes=edit.notes;d.sources=d.sources.filter(s=>!edit.removeSources?.includes(s.url));for(const source of edit.sources)if(!d.sources.some(s=>s.url===source.url))d.sources.push(source);}
for(const [slug,modes]of Object.entries(debtCompositionDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
const armyDefinition=definitions.find(d=>d.slug==='army-body-fat-calculator')!;armyDefinition.modes.unshift(armyDefinition.modes.pop()!);
for(const [slug,modes]of Object.entries(completionEverydayDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
const moleculeMode=definitions.find(d=>d.slug==='molecular-weight-calculator')!.modes.find(m=>m.algorithm==='molecular-weight')!;moleculeMode.fields.unshift(s('preset','Example compound',[['custom','Custom formula'],...moleculePresets.map(p=>[p.formula,p.label+' — '+p.formula] as [string,string])]));moleculeMode.fields.find(f=>f.key==='formula')!.hint='Case-sensitive symbols; parentheses, square brackets and hydrate dots are supported.';
const base64Definition=definitions.find(d=>d.slug==='base64-encode-decode')!;base64Definition.modes[0].fields.find(f=>f.key==='text')!.optional=true;base64Definition.modes.push(mode('character-encoding','Base64 with a selected text encoding','base64-charset',[s('direction','Operation',[['encode','Encode text'],['decode','Decode Base64']]),s('charset','Character encoding',textCharsets.map(c=>[c.value,c.label])),{...t('text','Text or Base64','Hello, Finflo!','textarea'),optional:true},s('bom','Unicode byte-order mark',[['none','No added BOM; preserve on decode'],['include-on-encode','Add BOM when encoding UTF text'],['strip-on-decode','Strip a leading BOM after decoding']]),s('whitespace','Base64 input whitespace',[['no','Reject whitespace'],['yes','Remove ASCII whitespace']])],'Text → selected codec bytes → standard padded Base64, or the reverse.','Uses a strict lossless text round trip. ASCII and Latin-1 retain their actual byte definitions. Arbitrary binary files use the separate file tool; encoding is not encryption.'));
for(const [slug,modes]of Object.entries(taxCompositionDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
for(const [slug,modes]of Object.entries(programCompositionDefinitions()))definitions.find(d=>d.slug===slug)!.modes.push(...modes);
definitions.find(d=>d.slug==='currency-calculator')!.modes.push(mode('global-reference','Global dated reference and spot quotes','currency-global',[s('currencyList','Currency list',[['popular','Popular instruments'],['all','All instruments, including historical codes']]),{key:'amount',label:'Amount in source currency',type:'number',default:'100',min:0},s('from','Source currency',currencyInstruments.map(i=>[i.code,i.label+(i.strategy.startsWith('historical')?' (historical; manual only)':'')]),'USD'),s('to','Target currency',currencyInstruments.map(i=>[i.code,i.label+(i.strategy.startsWith('historical')?' (historical; manual only)':'')]),'EUR'),s('tableView','Reference table',[['rates','Rates from selected source'],['matrix','Major-currency matrix'],['providers','Selected pair provider provenance']])],'Converted amount = amount × USD per source unit / USD per target unit.','Broad daily official-reference blends are delivered by Frankfurter. Bitcoin uses a separate Coinbase spot snapshot; Chilean UF uses the SII daily value crossed through CLP. Source and observation dates remain visible. Legacy codes need a dated manual rate; no live trading or transaction quote is implied.'));
for(const [slug,modes] of Object.entries(vehicleTaxDefinitions())) definitions.find(d=>d.slug===slug)!.modes.push(...modes);
for(const [slug,modes] of Object.entries(additionalTaxDefinitions())) definitions.find(d=>d.slug===slug)!.modes.push(...modes);
definitions.find(d=>d.slug==='fha-loan-calculator')!.modes.push(historicalFhaMode());
const composedTax=definitions.find(d=>d.slug==='tax-calculator')!.modes.find(m=>m.algorithm==='tax-federal-composed')!;
composedTax.fields.push(...additionalFederalFields());
composedTax.explanation='Selected-year federal planning arithmetic with optional qualified tip, overtime, vehicle-interest, education, IRA and student-interest calculations. Confirm eligibility separately and exclude computed amounts from generic verified adjustments. QBI can use a verified deduction or the one-business worksheet. EITC is an optional continuous planning estimate; AMT and other special amounts use separately verified inputs. The refundable child-credit calculation includes the three-or-more-child payroll alternative. A verified EITC can replace the continuous estimate.';
for(const [key,label]of Object.entries({otherAdjustments:'Other above-line adjustments, excluding computed half-SE, IRA and student interest',verifiedOtherSchedule1A:'Other Schedule 1-A deductions, excluding amounts computed here',verifiedPreCTCNonrefundableCredits:'Other verified credits before child credit, excluding computed care and education',verifiedOtherRefundableCredits:'Other refundable credits, excluding ACTC, EITC and computed AOTC'}))composedTax.fields.find(f=>f.key===key)!.label=label;
const braDefinition=definitions.find(d=>d.slug==='bra-size-calculator')!;
for(const m of braDefinition.modes){m.fields.unshift(s('measurementUnit','Measurement unit',[['in','Inches'],['cm','Centimeters']]));m.fields=m.fields.map(f=>['under','bust'].includes(f.key)?{...f,min:0.01,max:250,unit:'measurement'}:f);}
braDefinition.modes.push({...structuredClone(braDefinition.modes[0]),id:'traditional-band',title:'Traditional +4/+5 band estimate',algorithm:'bra-legacy',formula:'Round each inch measurement; add 4 to an even underbust or 5 to an odd underbust, then compare rounded bust with band.',explanation:'Alternative traditional fitting method using a declared US cup ladder: difference 0 = AA, 1 = A, 2 = B, 3 = C, 4 = D, then DD, DDD, G–L. This convention is not a universal fit or international brand conversion.'});
braDefinition.sources.push({title:'Triumph: traditional +4/+5 measurement method',url:'https://in.triumph.com/blogs/community/your-ultimate-guide-to-finding-the-perfect-bra-size'});
const shoeMode=definitions.find(d=>d.slug==='shoe-size-conversion')!.modes.find(m=>m.algorithm==='shoe')!;shoeMode.fields.unshift(s('measurementUnit','Foot-length unit',[['cm','Centimeters'],['mm','Millimeters'],['in','Inches']]));shoeMode.fields=shoeMode.fields.map(f=>f.key==='length'?{...f,min:0.01,max:1000,unit:'measurement'}:f);
definitions.find(d=>d.slug==='take-home-pay-calculator')!.modes.push(annualPayDefinition(composedTax));
expandMarriageMode(definitions.find(d=>d.slug==='marriage-calculator')!.modes.find(m=>m.algorithm==='tax-marriage-composed')!);
for(const d of definitions)for(const m of d.modes){
 if(['bra','bra-legacy','fashion-ffit'].includes(m.algorithm)){m.fields.unshift(s('unitScheme','Measurement units',[['shared','One unit for all measurements'],['individual','Set each measurement unit']]));for(const key of m.algorithm==='fashion-ffit'?['bust','waist','hip','highHip']:['under','bust']){m.fields.push(s(key+'Unit',key+' unit',[['in','Inches'],['cm','Centimeters']]));const field=m.fields.find(f=>f.key===key)!;field.unit='measurement';}}
 if(m.algorithm==='btu'){m.fields.unshift(s('areaUnit','Room area unit',[['ft2','Square feet'],['m2','Square meters']]));m.fields=m.fields.map(f=>f.key==='area'?{...f,min:0.01,max:2500,unit:'room-area'}:f);}
}
const versionedTaxAlgorithms=['tax-federal-composed','tax-standard-expanded','tax-social-benefits','tax-senior-deduction','tax-itemization-2026','tax-care-2026','tax-marriage-composed','annual-tax-pay','tax-tips-2026','tax-overtime-2026','tax-car-interest-2026','tax-education-2026','tax-student-interest-2026','tax-ira-deduction-2026','tax-qbi-2026','tax-qbi-section68','tax-eitc-estimate-2026'];
for(const d of definitions)for(const m of d.modes)if(versionedTaxAlgorithms.includes(m.algorithm)){m.fields.unshift(s('taxYear','US federal tax year',[['2026','2026'],['2025','2025']]));m.title=m.title.replace('2026','2025 / 2026');m.explanation+=' Select the applicable tax year. Dollar ceilings and tax bands use that year’s versioned parameters; 2025 does not include the 2026 nonitemizer charitable deduction, charitable floor, overall itemized reduction or active-business QBI minimum.';if(m.algorithm==='tax-student-interest-2026')m.formula='Up to $2,500 per return, with joint MAGI phaseout $170,000–$200,000 for 2025 or $175,000–$205,000 for 2026; other eligible filers use $85,000–$100,000.';if(m.algorithm==='tax-care-2026')m.formula='Eligible expense base × selected-year rate: 2025 uses a 35% to 20% schedule; 2026 begins at 50% with the two-stage phaseout.';if(m.algorithm==='tax-itemization-2026')m.formula='Apply selected-year medical, SALT and charitable limits. The 0.5%-of-AGI cash-charity floor and Section 68 reduction begin in 2026.';}
for(const d of definitions)for(const m of d.modes)for(const change of methodCopy)if(m.algorithm===change.algorithm){if(change.field==='formula')m.formula=change.replacement;else m.explanation=change.replacement;}
for(const [slug,modes] of Object.entries(remainingDefinitions())) definitions.find(d=>d.slug===slug)!.modes.push(...modes);
definitions.find(d=>d.slug==='voltage-drop-calculator')!.sources.push({title:'2017 NEC, Chapter 9 Table 9, page 70–690 (Nye County reference copy)',url:'https://www.nyecountynv.gov/DocumentCenter/View/38288/2017-NEC-Code-2#page=693'});
definitions.find(d=>d.slug==='bra-size-calculator')!.sources.push({title:'Wacoal: international band, cup and dress label conventions',url:'https://www.wacoallingerie.com/uk/en/size-guide/'});
definitions.find(d=>d.slug==='shoe-size-conversion')!.sources.push(...['mens-footwear','womens-footwear','kids-footwear'].flatMap(path=>[{title:`Nike: ${path} regional size guide`,url:`https://www.nike.com/size-fit/${path}`},{title:`Nike China: ${path} CN size labels`,url:`https://www.nike.com.cn/size-fit/${path}`} ]));
definitions.find(d=>d.slug==='golf-handicap-calculator')!.sources.push({title:'USGA: treatment of nine-hole scores since 2024',url:'https://www.usga.org/content/usga/home-page/handicapping/world-handicap-system/2024-revision/2024-treatment-of-9-hole-scores-FAQ.html'});
definitions.find(d=>d.slug==='btu-calculator')!.sources.push({title:'OpenStax: conduction and thermal resistance',url:'https://openstax.org/books/college-physics-2e/pages/14-5-conduction'},{title:'NREL: building thermal envelope tests, dry-air assumptions (Table A10)',url:'https://docs.nlr.gov/docs/fy08osti/42059.pdf'});
definitions.find(d=>d.slug==='btu-calculator')!.sources.push({title:'EPA: county design temperature limits, 2019 edition revised 2020',url:'https://www.energystar.gov/partner-resources/residential_new/working/hvac/hvac_designers/design_temp_limits'},{title:'2015 IECC: assembly U-factor references, Table R402.1.4',url:'https://codes.iccsafe.org/content/IECC2015/chapter-4-re-residential-energy-efficiency'});
definitions.find(d=>d.slug==='target-heart-rate-calculator')!.sources.push({title:'CDC: measuring physical activity intensity',url:'https://www.cdc.gov/physical-activity-basics/measuring/index.html'});
export const definitionMap=new Map(definitions.map(d=>[d.slug,d]));
export const toolMap=new Map(catalog.map(d=>[d.slug,d]));
export const blocked:Record<string,string>={};
export const sensitiveTools=new Set(['password-generator','base64-encode-decode','url-encode-decode']);
export const randomTools=new Set(['password-generator','dice-roller','random-number-generator']);
export const noInitialExampleTools=new Set([...randomTools,'mileage-calculator']);
export function relatedTools(tool: CatalogEntry): CatalogEntry[] {
 const preferred = relatedCalculatorSlugs[tool.slug] || calculatorFamilies.filter(family=>family.includes(tool.slug)).flat();
 const fallback = catalog.filter(item=>item.category===tool.category).sort((a,b)=>Number(b.subcategory===tool.subcategory)-Number(a.subcategory===tool.subcategory)).map(item=>item.slug);
 return [...new Set([...preferred,...fallback])].filter(slug=>slug!==tool.slug&&definitionMap.has(slug)).slice(0,6).map(slug=>toolMap.get(slug)!);
}
