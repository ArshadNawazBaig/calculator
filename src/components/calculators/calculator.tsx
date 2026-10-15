'use client';
import {calculatorModeHash,movedStudentMode} from '@/lib/student-tools';
import {useI18n} from "@/components/i18n/provider";
import {Dropdown} from '@/components/ui/dropdown';
import {VehiclePolicy} from './vehicle-policy';
import {RoadLocations,RoadAttribution} from './road-locations';
import {CurrencySwap} from './currency-swap';
import {useRef,useState,useCallback,useEffect} from 'react';
import {Calculator,RotateCcw,Link as LinkIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Definition,Result,Values} from '@/lib/calculators/types';
import {defaults} from '@/lib/calculators/types';
import type {CategoryId} from '@/lib/site';
import {displayField,updateInputs} from '@/lib/calculators/input-display';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {calculate} from '@/lib/calculators/engine';
import {useCalculatorTool} from './use-calculator-tool';
import dynamic from 'next/dynamic';
function FileToolsLoading(){const {t}=useI18n();return <p>{t('Loading local file tools…')}</p>;}
function CoordinatesLoading(){const {t}=useI18n();return <p className="field-help">{t('Loading coordinate picker…')}</p>;}
const InvoiceDocument=dynamic(()=>import('./invoice-document').then(m=>m.InvoiceDocument));
const NetWorthHistory=dynamic(()=>import('./net-worth-history').then(m=>m.NetWorthHistory));
const Base64Files=dynamic(()=>import('./base64-files').then(m=>m.Base64Files),{loading:FileToolsLoading});
const GeographicPicker=dynamic(()=>import('./geographic-picker').then(m=>m.GeographicPicker),{loading:CoordinatesLoading});
import {ExpressionControls} from './expression-controls';
import {FieldGroup} from './field-group';
import {CalculatorResult} from './result';
import {ResultDetails} from './result-details';
import {ResultExports} from './result-exports';
import {usePreferences} from '@/components/i18n/preferences-provider';
import {calculatorCurrencyPolicy,resolveCalculatorCurrency} from '@/lib/calculators/currency-policy';
import {CalculatorCurrency} from './currency-preference';
import {useHydrated} from '@/lib/use-hydrated';
import {CalculatorActions} from '@/components/workspace/calculator-actions';
import {RestoreCalculation} from '@/components/workspace/restore-calculation';
import {restoreInputs,summarizeInput,type SavedCalculation} from '@/lib/workspace/model';
import {currencyText,isCurrency} from '@/lib/i18n/preferences';
export function CalculatorForm({definition,title,category,initial,currency:baseCurrency='USD',privateInput=false}:{definition:Definition;title:string;category:CategoryId;initial:Result|null;currency?:string;privateInput?:boolean}){
 const {t,href}=useI18n();
 const preferences=usePreferences();
 const hydrated=useHydrated();

 const [modeId,setModeId]=useState(definition.modes[0].id),[values,setValues]=useState<Values>(defaults(definition.modes[0])),[output,setOutput]=useState<Result|null>(initial),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[example,setExample]=useState(true),[dirty,setDirty]=useState(false);
 const [resetVersion,setResetVersion]=useState(0);
 const [savedExpressionAnswer,setSavedExpressionAnswer]=useState<number|null>(null);
 const [answer,setAnswer]=useState<number|null>(null),[memory,setMemory]=useState<number|null>(null);const answerRef=useRef<number|null>(null),revision=useRef(0);useEffect(()=>()=>{revision.current++;},[]);
 const beginToolOperation=useCallback(()=>{const token=++revision.current;setBusy(true);return {isCurrent:()=>token===revision.current,finish:()=>{if(token===revision.current)setBusy(false);}};},[]);
 const expressionContext=useCallback(()=>({answer:answerRef.current}),[]);
 const commitAnswer=(result:Result)=>{const value=result.metrics.find(m=>m.label==='Result')?.value;if(typeof value==='number'&&Number.isFinite(value)){answerRef.current=value;setAnswer(value);}};
 const applyTool=useCallback((mode:string,inputs:Values,result:Result)=>{revision.current++;setBusy(false);setSavedExpressionAnswer(answerRef.current);const selected=definition.modes.find(m=>m.id===mode);if(selected?.algorithm==='expression'){const value=result.metrics.find(m=>m.label==='Result')?.value;if(typeof value==='number'&&Number.isFinite(value)){answerRef.current=value;setAnswer(value);}}setModeId(mode);setValues(inputs);setOutput(result);setError('');setNotice('');setExample(false);setDirty(false);},[definition]);
 useCalculatorTool(definition,category,applyTool,expressionContext,beginToolOperation);
 const resultRef=useRef<HTMLDivElement>(null);const mode=definition.modes.find(m=>m.id===modeId)!;
 const currency=resolveCalculatorCurrency(definition.slug,mode,preferences.currency,baseCurrency);
 const currencyPolicy=calculatorCurrencyPolicy(definition.slug,mode);
 const displayCurrency=currencyPolicy.kind==='selectable'||currencyPolicy.kind==='fixed'?currency:undefined;
 const preferencesRef=useRef(preferences);useEffect(()=>{preferencesRef.current=preferences;},[preferences]);
 const restoreSaved=useCallback((saved:SavedCalculation)=>{
  if(privateInput)return;
  const selected=definition.modes.find(item=>item.id===saved.modeId),restored=selected&&restoreInputs(saved,selected);
  if(!selected||!restored){setNotice('This calculator has changed. The saved inputs could not be restored.');return;}
  const policy=calculatorCurrencyPolicy(definition.slug,selected);
  if(policy.kind==='fixed'&&saved.currency!==policy.currency){setNotice('This calculator has changed. The saved inputs could not be restored.');return;}
  if(policy.kind==='selectable'&&isCurrency(saved.currency))preferencesRef.current.setCurrency(saved.currency);
  revision.current++;setBusy(false);setModeId(selected.id);setValues(restored);setOutput(null);setError('');setDirty(false);setExample(false);setResetVersion(value=>value+1);
  answerRef.current=saved.expressionAnswer;setAnswer(saved.expressionAnswer);setMemory(null);
  setNotice('Saved inputs restored. Select Calculate for an updated result.');
 },[definition,privateInput]);
 const missingSaved=useCallback(()=>setNotice('This saved calculation is unavailable in this browser. Import your workspace backup to restore it.'),[]);
 const snapshot=output&&!dirty&&!example&&!privateInput?{
  slug:definition.slug,title,modeId:mode.id,modeTitle:t(mode.title),algorithm:mode.algorithm,values:{...values},currency,currencyLabels:Boolean(displayCurrency),
  metrics:output.metrics.map(metric=>({...metric})),labels:Object.fromEntries(output.metrics.flatMap(metric=>[metric.label,metric.unit,metric.displayValue,metric.translateValue&&typeof metric.value==='string'?metric.value:undefined].filter((label):label is string=>typeof label==='string').map(label=>[label,t(label)]))),
  expressionAnswer:mode.algorithm==='expression'?savedExpressionAnswer:null,
  inputs:[...mode.fields.filter(field=>isFieldActive(mode,field,values)).map(field=>{const shown=displayField(mode,field,values);return {key:field.key,label:t(shown.label),value:summarizeInput(shown,values[field.key],t,displayCurrency),...(shown.unit?{unit:displayCurrency?currencyText(t(shown.unit),currency):t(shown.unit)}:{})};}),...(mode.algorithm==='expression'&&/\bAns\b/.test(values.expression)&&savedExpressionAnswer!==null?[{key:'expressionAnswer',label:'Ans',value:String(savedExpressionAnswer)}]:[])],
 }:null;
 const selectMode=useCallback((id:string)=>{const next=definition.modes.find(m=>m.id===id);if(!next)return;revision.current++;setBusy(false);setModeId(id);setValues(defaults(next));setOutput(null);setError('');setNotice('');setDirty(false);setExample(false);setResetVersion(value=>value+1);},[definition]);
 useEffect(()=>{
  const syncMode=()=>{const hash=window.location.hash;const moved=movedStudentMode(definition.slug,hash.replace(/^#(?:mode|method)-/,''));if(moved){window.location.replace(href('/'+moved)+hash);return;}const selected=definition.modes.find(m=>calculatorModeHash(m.id)===hash);if(selected)selectMode(selected.id);};
  const initialSelection=window.setTimeout(syncMode,0);
  window.addEventListener('hashchange',syncMode);
  return ()=>{window.clearTimeout(initialSelection);window.removeEventListener('hashchange',syncMode);};
 },[definition,selectMode,href]);
 function changeMode(id:string){selectMode(id);window.history.replaceState(null,'',window.location.pathname+window.location.search+calculatorModeHash(id));}
 async function submit(event:React.FormEvent){event.preventDefault();const run=++revision.current;setBusy(true);setError('');setNotice('');try{const context=expressionContext();const result=await calculate(category,mode,values,context);if(run!==revision.current)return;setSavedExpressionAnswer(context.answer);setOutput(result);if(mode.algorithm==='expression')commitAnswer(result);setExample(false);setDirty(false);setTimeout(()=>resultRef.current?.focus(),0);}catch(e){if(run!==revision.current)return;const message=e instanceof Error?e.message:'Unable to calculate. Check the inputs and try again.';setError(/Failed to fetch|Loading chunk|dynamically imported|load chunk/i.test(message)?'The calculation engine could not load. Reconnect and select Calculate to retry.':message);setOutput(null);}finally{if(run===revision.current)setBusy(false);}}
 async function memoryAction(action:'add'|'subtract'|'clear'){if(action==='clear'){setMemory(null);setNotice('Memory cleared.');return;}const run=++revision.current;setBusy(true);setError('');try{const result=await calculate(category,mode,values,expressionContext()),value=result.metrics.find(m=>m.label==='Result')?.value;if(run!==revision.current)return;if(typeof value!=='number'||!Number.isFinite(value))throw Error('Memory requires a finite numeric result.');const next=(memory??0)+(action==='add'?value:-value);if(!Number.isFinite(next))throw Error('Memory result exceeds the finite numeric range.');setMemory(next);setNotice('Memory updated from the current expression.');}catch(e){if(run===revision.current)setError(e instanceof Error?e.message:'Unable to update memory.');}finally{if(run===revision.current)setBusy(false);}}
 function updateExpression(value:string){setValues(previous=>({...previous,expression:value}));setDirty(true);setError('');}
 function reset(event:React.MouseEvent<HTMLButtonElement>){event.currentTarget.form?.reset();setResetVersion(previous=>previous+1);revision.current++;setBusy(false);answerRef.current=null;setAnswer(null);setMemory(null);setValues(defaults(mode));setOutput(null);setError('');setNotice('');setDirty(false);}

 async function copyLink(){try{await navigator.clipboard.writeText(window.location.origin+window.location.pathname+calculatorModeHash(modeId));setNotice('Tool link copied. Your inputs are not included.');}catch{setNotice('Copy this page’s address from your browser to share the tool.');}}
 return <div className="calculator-workspace"><RestoreCalculation slug={definition.slug} onRestore={restoreSaved} onMissing={missingSaved}/><section aria-label={t("Interactive calculator")} className="calculator-panel"><div aria-hidden="true">{definition.modes.map(item=><span key={item.id} id={`mode-${item.id}`} style={{display:'block',scrollMarginTop:80}}/>)}</div><div className="calculator-settings" data-has-mode={definition.modes.length>1}><CalculatorCurrency slug={definition.slug} mode={mode} disabled={!hydrated||busy}/>{definition.modes.length>1&&<div className="mode-picker no-print"><label id="calculation-mode-label" htmlFor="calculation-mode">{t("What would you like to calculate?")}</label><Dropdown disabled={!hydrated} id="calculation-mode" aria-labelledby="calculation-mode-label" value={modeId} onValueChange={changeMode} options={definition.modes.map(m=>({value:m.id,label:t(m.title)}))}/></div>}</div><div className="calculator-columns"><form id="calculator-inputs" tabIndex={-1} onSubmit={submit} className="calculator-form no-print"><div className="form-heading"><Calculator size={19} aria-hidden="true"/><div><h2>{t("Your inputs")}</h2></div></div>{mode.algorithm==='great-circle'&&<GeographicPicker values={values} disabled={!hydrated||busy} onChange={patch=>{setValues(previous=>({...previous,...patch}));if(Object.keys(patch).length===4&&Object.values(patch).every(value=>value==='')){setOutput(null);setDirty(false);setNotice('Points cleared.');}else setDirty(true);setError('');}}/>}{mode.algorithm==='road-route'&&values.locationInput==='places'&&<RoadLocations key={resetVersion} values={values} disabled={!hydrated||busy} onChange={patch=>{setValues(previous=>({...previous,...patch}));setDirty(true);setError('');}}/>}<FieldGroup currency={displayCurrency} fields={mode.fields.filter(field=>isFieldActive(mode,field,values)).map(field=>displayField(mode,field,values))} values={values} prefix={mode.id} disabled={!hydrated||busy} onChange={(key,value)=>{setValues(updateInputs(mode,values,key,value));setDirty(true);setError('');}}/>{mode.algorithm==='vehicle-state-tax'&&<VehiclePolicy stateCode={values.state}/>} {['currency-reference','currency-global','currency'].includes(mode.algorithm)&&<CurrencySwap disabled={!hydrated||busy} onSwap={()=>{setValues(previous=>({...previous,from:previous.to,to:previous.from,...(mode.algorithm==='currency'&&Number(previous.rate)>0?{rate:String(1/Number(previous.rate))}:{})}));setDirty(true);setError('');}}/>}{mode.algorithm==='expression'&&<ExpressionControls inputId={`${mode.id}-expression`} value={values.expression} onChange={updateExpression} answer={answer} memory={memory} busy={!hydrated||busy} onMemory={memoryAction} onClear={()=>{revision.current++;setBusy(false);updateExpression('');setOutput(null);setNotice('Expression cleared. Answer and memory retained.');}}/>}{error&&<p className="form-error" role="alert">{t(error)}</p>}<div className="form-actions"><Button type="submit" data-calculator-submit disabled={!hydrated||busy}>{busy?t("Calculating…"):t("Calculate")}<Calculator size={16} aria-hidden="true"/></Button><Button type="button" variant="ghost" disabled={!hydrated} onClick={reset}><RotateCcw size={15} aria-hidden="true"/>{t("Reset")}</Button></div>{mode.algorithm==='road-route'?<RoadAttribution/>:<p className="local-note">{t("Calculations run in your browser. No account needed.")}</p>}</form><div id="calculation-summary" className="results-region" data-stale={dirty&&Boolean(output)||undefined} ref={resultRef} tabIndex={-1} aria-live="polite" aria-atomic="false">{dirty&&output&&<p className="stale-note">{t("Inputs changed. Select Calculate to update the result.")}</p>}{output?<CalculatorResult showDetails={false} result={output} currency={currency} currencyLabels={Boolean(displayCurrency)} example={example}/>:<div className="result-empty"><Calculator size={32} aria-hidden="true"/><h3>{t("Your answer starts here")}</h3><p>{t("Enter your values and select Calculate to see the result and its breakdown.")}</p></div>}</div></div><div className="calculator-toolbar no-print"><span>{output?.table?<a href="#calculation-table">{t("Jump to the full table")}</a>:t("Clear inputs. Transparent methods.")}</span><div><Button type="button" variant="ghost" disabled={!hydrated} onClick={copyLink}><LinkIcon size={15} aria-hidden="true"/>{t("Copy tool link")}</Button>{!privateInput&&output&&mode.algorithm!=='toolkit-invoice'&&<ResultExports result={output} title={title} modeTitle={mode.title} algorithm={mode.algorithm} slug={definition.slug} currency={currency} currencyLabels={Boolean(displayCurrency)} example={example} dirty={dirty} disabled={!hydrated}/>}</div></div><CalculatorActions slug={definition.slug} title={title} snapshot={snapshot} disabled={!hydrated||busy} privateInput={privateInput}/>{notice&&<p role="status" className="toolbar-notice">{t(notice)}</p>}{definition.slug==='base64-encode-decode'&&<Base64Files/>}</section>{output&&!dirty&&mode.algorithm==='toolkit-invoice'&&<InvoiceDocument key={JSON.stringify([values,currency,example])} values={values} currency={currency} example={example}/ >}{definition.slug==='net-worth-tracker'&&<NetWorthHistory currency={currency}/ >}{output&&<ResultDetails key={modeId} result={output} algorithm={mode.algorithm} currency={currency} currencyLabels={Boolean(displayCurrency)} dirty={dirty}/>}</div>;
}
