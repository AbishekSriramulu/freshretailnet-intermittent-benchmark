type Record = {id?:string;method?:string;task?:string;features?:string;history?:string;static_covariates?:string[];fit?:string;learning_rate?:number;grouping?:string};
const intrinsicSalesOnly=new Set(['zero','seasonal-naive','seasonal-empirical','DLinear','toto2']);
const categoryCapable=new Set(['chronos2','chronos2-synth','timesfm3','tirex2','tabpfn-ts','TFT']);
const categories=['store_id','product_id','city_id','management_group_id','first_category_id','second_category_id','third_category_id'];
export function standardInputResult(row:Record):boolean{
 const id=row.id||'',task=row.task||'',features=row.features||'';
 if(/ensemble|blend|stacking/i.test(row.method||'')||/^(?:ensemble|blend|stacking)(?:__|$)/i.test(id)||row.grouping?.startsWith('random'))return false;
 if(task.startsWith('recovery-'))return true;
 if(features==='calendar'||features==='noncalendar'||/(?:__no-static|__off)(?:__|$)/.test(id))return false;
 if(id.startsWith('original__'))return true;
 const mode=row.fit||(/(?:^|__)lora\d/.test(id)?'lora':/(?:^|__)full\d/.test(id)?'full':'');
 const rate=row.learning_rate??Number(id.match(/(?:^|__)lr([^_]+)/)?.[1]??'NaN');
 if((mode==='full'||mode==='lora')&&Number.isFinite(rate)&&rate!==(mode==='full'?1e-5:1e-4))return false;
 if(intrinsicSalesOnly.has(row.method||''))return features==='target'||features==='source'||features==='';
 const completeProfile=features==='all'||features==='source'||features==='original-all'||features==='both'||features.startsWith('both-')||features.startsWith('source ');
 if(!completeProfile)return false;
 if(categoryCapable.has(row.method||''))return categories.every(name=>row.static_covariates?.includes(name))||id.includes('__causal-category-mean__')||id.includes('__seven-embeddings__');
 return true;
}
