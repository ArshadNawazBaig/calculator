export function parseRows(raw:string,label:string,max=100):Record<string,unknown>[] {
 let rows:unknown;try{rows=JSON.parse(raw);}catch{throw Error(`${label} must contain valid rows. Reset the form to start again.`);}
 if(!Array.isArray(rows)||rows.length>max||rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error(`Use at most ${max} valid ${label.toLowerCase()} rows.`);
 return rows;
}
export function rowNumber(value:unknown,label:string,min=-Infinity,max=Infinity){
 if(!['string','number'].includes(typeof value)||String(value).trim()==='')throw Error(`${label} is required.`);
 const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Check ${label.toLowerCase()} and its permitted range.`);return n;
}
