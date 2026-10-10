import {createServer} from 'vite';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd();
const server=await createServer({configFile:false,root,server:{middlewareMode:true},resolve:{alias:{'@':resolve(root,'src')}}});
try{
  const {catalog,definitions,blocked}=await server.ssrLoadModule('/src/lib/calculators/registry.ts');
  const manifest=JSON.parse(await readFile('docs/audit/coverage-manifest.json','utf8'));
  const testFiles=(await readdir('tests')).filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f);
  const snapshot={generatedAt:new Date().toISOString(),counts:{catalogEntries:catalog.length,calculatorPages:definitions.length,modes:definitions.reduce((n,d)=>n+d.modes.length,0),unavailableTools:Object.keys(blocked).length,directoryHubs:catalog.length-definitions.length-Object.keys(blocked).length},definitions};
  await writeFile('docs/audit/implementation-snapshot.json',JSON.stringify(snapshot,null,2)+'\n');
  let remaining={};try{remaining=JSON.parse(await readFile('docs/audit/remaining-modes.json','utf8'));}catch{}
  const bySlug=new Map(definitions.map(d=>[d.slug,d]));
  for(const tool of manifest.tools){
    const d=bySlug.get(tool.slug);
    Object.assign(tool,{implementation_status:d?'implemented_with_documented_scope':blocked[tool.slug]?'unavailable_explained':'implemented_directory_hub',testing_status:d?'see_validation_report_and_reference_fixtures':'route_and_content_checks',content_status:d?'original_methods_examples_faq_and_primary_sources':'availability_or_directory_content',behavior_status:'independent_methods_and_captured_controls_reconciled; not_a_claim_of_identical_competitor_behavior',formula_references:d?.sources??[],implemented_modes:d?.modes.map(m=>({id:m.id,title:m.title,algorithm:m.algorithm,fields:m.fields,formula:m.formula,scope:m.explanation,notes:m.notes??[]}))??[],limitation:blocked[tool.slug]??null,evidence:{competitor_structure:'docs/audit/catalog.json#tools/'+tool.slug,implementation:'docs/audit/implementation-snapshot.json#definitions/'+tool.slug,material_mode_review:'docs/audit/remaining-modes.json',test_files:testFiles,validation:'docs/validation/verification.json'},exports:d?['print','CSV results (except sensitive utilities)','page-address-only share']:[]});
  }
  manifest.implementation={updatedAt:snapshot.generatedAt,...snapshot.counts,coverage_claim:`All ${catalog.length} discovered routes accounted for. ${Object.keys(blocked).length} whole tool(s) and the explicitly listed advanced capabilities remain unresolved. Neither mode counts nor default examples establish complete feature parity.`,remainingReviewPresent:Object.keys(remaining).length>0};
  await writeFile('docs/audit/coverage-manifest.json',JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(snapshot.counts));
}finally{await server.close();}
