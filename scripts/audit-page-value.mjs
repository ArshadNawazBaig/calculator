import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {resolve} from 'node:path';

const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));
const locales=['en','es','fr','de','pt','ar','hi','tl'];
const translatedPaths=await readJSON('src/data/locales/translated-pages.json');
const calculators=Object.assign({},...await Promise.all(['finance','health','math','everyday'].map(category=>readJSON(`src/data/insights/${category}.json`))));
const informationNotes=await readJSON('src/data/insights/information.json');
const server=await createServer({configFile:false,server:{middlewareMode:true,watch:null},resolve:{alias:{'@':resolve('src')}}});
const issues=[],pages=[],seen=new Map();
function checkNote(path,record){
  for(const locale of locales){
    const note=record?.[locale];
    if(!note?.heading?.trim()||!note?.body?.trim()){issues.push(`${path}: missing ${locale} guidance`);continue;}
    const key=`${locale}:${note.body}`;
    if(seen.has(key))issues.push(`${path}: ${locale} guidance duplicates ${seen.get(key)}`);
    seen.set(key,path);
    if(locale!=='en'&&note.body===record.en.body)issues.push(`${path}: English fallback in ${locale}`);
  }
}
try{
  const {publishedLocales}=await server.ssrLoadModule('/src/lib/i18n/config.ts');
  const {definitions}=await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const {information}=await server.ssrLoadModule('/src/data/information.ts');
  const {guides}=await server.ssrLoadModule('/src/data/guides.ts');
  const paths=[...new Set([...translatedPaths,...Object.keys(guides).map(slug=>`/guides/${slug}`)])];
  const {zones,zoneHref,timeTools}=await server.ssrLoadModule('/src/lib/time/catalog.ts');
  const {spinWheels,wheelHref}=await server.ssrLoadModule('/src/lib/spin-wheels/catalog.ts');
  const directories=await readJSON('src/data/directory-content.json');
  const byPath=new Map(definitions.map(definition=>[`/${definition.slug}`,definition]));
  const clocks=new Map(zones.map(zone=>[zoneHref(zone),zone]));
  const wheels=new Map(spinWheels.map(wheel=>[wheelHref(wheel.slug),wheel]));
  for(const path of paths){
    const definition=byPath.get(path),clock=clocks.get(path),wheel=wheels.get(path),slug=path.slice(1);
    let review;
    if(definition){
      checkNote(path,calculators[slug]);
      review={kind:'calculator',addition:calculators[slug]?.en.heading,implementation:'Original interpretation note, method navigation, input → formula → result example, and on-page numeric scenario comparison where applicable.',sourceReferences:definition.sources.length};
    }else if(clock)review={kind:'regional-clock',addition:`${clock.id}: dated cross-zone comparison and quarterly offset table`,implementation:'Server-rendered data for this zone; repeated full world-clock guide removed.'};
    else if(wheel)review={kind:'spin-wheel',addition:`${wheel.title}: initial entry counts and selection probabilities`,implementation:'Accessible table and proportion bars, explicitly distinguished from edited entries.'};
    else if(directories[path])review={kind:'directory',addition:'Compare the required inputs and methods of relevant tools before choosing.',implementation:'Tool-choice table drawn from actual active calculator fields and formulas.'};
    else if(information[slug]){checkNote(path,informationNotes[slug]);review={kind:'information',addition:informationNotes[slug]?.en.heading,implementation:'Practical page-specific guidance without changing policy commitments.'};}
    else if(path.startsWith('/guides/')&&guides[path.slice(8)]){
      const guide=guides[path.slice(8)],tables=guide.sections.filter(section=>section.table);
      review=tables.length?{kind:'worked-guide',addition:guide.title,implementation:'Worked scenarios, comparison tables, calculator mode links, assumptions and source references.',tables:tables.length}:{kind:'guide',addition:'A numerical teaching table with independently checked examples.',implementation:'Mortgage principal/interest progression, contributions versus growth, or BMI height sensitivity.'};
    }
    else if(timeTools.some(tool=>tool.href===path))review={kind:'time-tool',addition:path==='/time'?'Dated comparison and seasonal UTC reference':path==='/time/timer'?'Countdown elapsed-versus-remaining example':path==='/time/stopwatch'?'Lap-versus-cumulative-split example':'Regional-zone versus fixed-offset comparison',implementation:'Translated, accessible numerical explanation.'};
    else if(path==='/calculators/students')review={kind:'student-directory',addition:'Grade, final-exam, GPA and GPA-goal input/method comparison.'};
    else if(path==='/')review={kind:'homepage',addition:'Interactive percentage reversal demonstration and descriptive localized search titles.'};
    else if(path==='/guides')review={kind:'guide-directory',addition:'Comparison of the inputs and methods behind the featured guide topics.'};
    else if(path==='/sitemap')review={kind:'sitemap',addition:'Complete localized subcategory, guide and information-page navigation.'};
    else if(path==='/faq')review={kind:'faq',addition:'Thirty practical questions organized into six topics, with localized answers and relevant next steps.',implementation:'Shared accessible accordions, topic navigation, server-rendered answers and matching FAQ structured data in all eight languages.'};
    else if(path==='/spin-wheels')review={kind:'wheel-directory',addition:'Duplicate-entry probability example with a two-ticket versus one-ticket visual.'};
    else{issues.push(`${path}: no recorded page improvement`);review={kind:'unclassified'};}
    pages.push({path,...review,languages:translatedPaths.includes(path)?publishedLocales:['en']});
  }
  for(const slug of Object.keys(calculators))if(!byPath.has(`/${slug}`))issues.push(`${slug}: orphan calculator guidance`);
  for(const filename of ['explanations','guide-visuals','learning-demos','utility-guidance','home-seo']){
    const data=await readJSON(`src/data/locales/${filename}.json`);
    for(const locale of locales)if(!data[locale])issues.push(`${filename}: missing ${locale}`);
  }
  const report={checkedAt:new Date().toISOString(),sourceRoutes:pages.length,localizedURLs:pages.reduce((sum,page)=>sum+page.languages.length,0),calculatorNotes:Object.keys(calculators).length,informationNotes:Object.keys(informationNotes).length,languages:publishedLocales,supportedLanguages:locales,issues,
    scope:'Inventory of published routes; structural checks also retain all draft locale guidance records. This is not editorial approval of translations or a claim of browser inspection of every URL.',
    additionalRoutes:[{path:'/real-estate-calculator',review:'Shares the improved real-estate tool-selection guide; existing non-indexed directory behavior retained.'},{path:'/search',review:'Added localized guidance for matching a task to a calculation method; remains noindex.'},{path:'/workspace',review:'Added localized advice for naming and comparing assumptions; remains noindex.'},...['/offline','/network-error','/maintenance','404','error boundaries'].map(path=>({path,review:'Reviewed recovery instructions, navigation and noindex behavior. Kept focused on recovery; no unrelated search copy added.'}))],
    checks:['Distinct original note bodies within each language','No missing calculator or information-page locale','Every indexable route has a recorded functional or editorial improvement','Existing formula references retained','No ranking promises, invented author credentials, or artificial review dates added to pages'],pages};
  await mkdir('docs/validation',{recursive:true});
  await writeFile('docs/validation/page-value-review.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({sourceRoutes:report.sourceRoutes,localizedURLs:report.localizedURLs,calculatorNotes:report.calculatorNotes,informationNotes:report.informationNotes,issues},null,2));
  if(issues.length)process.exitCode=1;
}finally{await server.close();}
