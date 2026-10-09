import policy from '@/data/vehicle-tax-2026.json';
export function VehiclePolicy({stateCode}: {stateCode: string}) {
  const state = policy.states.find(row=>row.state===stateCode);
  if (!state) return null;
  return <aside className="formula-box"><h3>{state.name}: vehicle tax assumptions</h3><p>{state.automaticPresetSafe ? 'A scoped taxable-base preset is available. Check the conditions below before applying it.' : 'Use a verified manual treatment or quoted tax amount for this state.'}</p>{state.notes.map(note=><p key={note}>{note}</p>)}<p>Sources checked {policy.asOf}: {state.sources.map((source,i)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{i ? ' · ' : ''}Official state source {i+1}</a>)}</p></aside>;
}
