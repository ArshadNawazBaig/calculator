import {defaults,type Mode,type Result} from '@/lib/calculators/types';
import {isFieldActive} from '@/lib/calculators/field-visibility';
import {displayField} from '@/lib/calculators/input-display';
import {formatMetric} from '@/components/calculators/result';

export function WorkedExample({mode,result,currency}:{mode:Mode;result:Result;currency:string}){
 const values=defaults(mode);
 return <section id="example"><h2>Worked example</h2><p>Using the {mode.title.toLowerCase()} example:</p><dl className="worked-inputs">{mode.fields.filter(field=>isFieldActive(mode,field,values)).map(field=>{const displayed=displayField(mode,field,values),value=field.type==='multiselect'?field.options?.filter(o=>field.default.split(',').includes(o.value)).map(o=>o.label).join(','):field.options?.find(o=>o.value===field.default)?.label||field.default;return <div key={field.key}><dt>{displayed.label}{displayed.unit?` (${displayed.unit})`:''}</dt><dd>{value||'None'}</dd></div>;})}</dl><div className="example-answer">{result.metrics.slice(0,3).map(metric=><p key={metric.label}>{metric.label}: <strong>{formatMetric(metric,currency)}</strong></p>)}</div><p>{mode.explanation}</p><p>These are illustrative inputs. Change the values to explore a different scenario.</p></section>;
}
