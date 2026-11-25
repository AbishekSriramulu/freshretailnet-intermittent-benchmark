import {useEffect,useState} from 'react';
import {ArrowDown,Download,Layers} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type {Components} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './intermittent.css';

type Scores={rmsse:number|null;crps9:number|null;series:number;origins:number;scoreable:number};
type Runtime={basis:string[];scope:string;recorded_origin_seconds:number;components:Record<string,number>;shared_job_key?:string};
type Decision={origin:string;decision:{members:string[];weights:number[];selection_origins:string[];weight_origins:string[];reason:string};
 mature_windows:{origin:string;available_at:number;observed_cells:number;parents_with_truth:number}[]};
type Row={id:string;name:string;method:string;task:string;family:string;scores:Scores;groups:Record<string,Scores>;
 point_type:string;probability_type:string|null;context_days:number;native_context_days?:number|null;training_days?:number|null;pretraining:unknown;consumed_inputs:unknown;
 unsupported_requested_inputs?:string[];receipt:string;receipt_sha256:string;code_license:string;weights_license:string;
 runtime?:Runtime;kernel_provenance?:{level:string;engine:string|null;native_kernel_pins:Record<string,string>};
 raw_native_output_evidence?:string;dwabi_decisions?:{path:string;sha256:string;candidate_pool:string[];origins:Decision[]}};
type Results={protocol:string;generated_utc:string;expected_per_task:number;rows:Row[];test_start:string;test_end:string;
 target_support:Record<string,Record<string,{series:number;origins:number;required:number;scoreable:number}>>;
 profile_summary:Record<string,{zero_fraction:number}>;
 population?:{parent_universe:string;core_rule:string;eligibility_scope:string};
 pending:{name:string;task:string;family:string;status?:string;reason?:string;qualification?:string}[];foundation_roster?:{method:string;name:string}[];excluded_methods?:Record<string,string>;profile_support:Record<string,{intermittency:string;sparsity:string;series:number}[]>};
const tasks={'hourly-24':'Hourly · next 24 hours (main)','daily-7':'Daily · next 7 days'};
const classes=[['all','All classes'],['smooth','Smooth'],['erratic','Erratic'],['intermittent','Intermittent'],['lumpy','Lumpy'],['all-zero','All-zero training window']];
const sparsities=[['all','All zero proportions'],['zero','0% zeros'],['0-25','>0–25% zeros'],['25-50','>25–50% zeros'],['50-75','>50–75% zeros'],['75-100','>75–<100% zeros'],['100','100% zeros']];
const display=(v:unknown):string=>typeof v==='string'?v:v==null?'Not recorded':JSON.stringify(v);
const number=(v:number)=>v.toLocaleString('en-US');
const valid=(items:string[][],value:string|null)=>items.some(x=>x[0]===value)?value!:'all';

const documentComponents: Components = {
 table: ({node: _node, ...props}) => (
  <div className="table-scroll manuscript-table" role="region" aria-label="Scrollable document table" tabIndex={0}>
   <table {...props}/>
  </div>
 ),
};

function InputHistory({row}: {row: Row}) {
 if (row.method === 'dwabi') {
  const evidence = row.dwabi_decisions;
  return <>
   <p>DWABI receives the original deciles from all eight foundation members at each issue. It uses equal full-roster weights until three earlier windows mature. Native joint selection can then choose a subset and estimate its weights.</p>
   {evidence && <details><summary>Verified origin decisions and weights</summary>
    <p>The candidate pool includes {evidence.candidate_pool.join(', ')}.</p>
    <p>Decision artifact <code>{evidence.path}</code><br/>SHA256 <code>{evidence.sha256}</code></p>
    {evidence.origins.map(({origin,decision,mature_windows})=><details key={origin}>
     <summary>{origin} · {decision.members.length} selected · {mature_windows.length} mature windows</summary>
     <dl>
      <dt>Selected members and weights</dt><dd>{decision.members.map((method,i)=>`${method} ${decision.weights[i]}`).join(', ')}</dd>
      <dt>Decision</dt><dd>{decision.reason}</dd>
      <dt>Selection evidence</dt><dd>{decision.selection_origins.join(', ')||'None used'}</dd>
      <dt>Weight evidence</dt><dd>{decision.weight_origins.join(', ')||'None used'}</dd>
      <dt>Mature origin windows</dt><dd>{mature_windows.map(window=>window.origin).join(', ')||'None at this issue'}</dd>
     </dl>
    </details>)}
   </details>}
  </>;
 }
 const history = row.native_context_days == null
  ? `Input context covers ${row.context_days} days.`
  : `Native retained history covers ${row.native_context_days} days.`;
 return <p>{history}{row.training_days != null && ` Fitting history covers ${row.training_days} days.`} Causal source-gap completion retains genuine zeros and stockout observations.</p>;
}

const componentLabels:Record<string,string>={
 pretest_selection_seconds:'Pre-test selection',
 fit_and_issuance_seconds:'Per-origin fit and issuance',
 native_fit_seconds:'Native fit',
 native_update_seconds:'Native updates',
 prediction_seconds:'Prediction',
};

function ExecutionEvidence({row}: {row: Row}) {
 const runtime=row.runtime;
 const pins=row.kernel_provenance;
 return <>
  {runtime && <div>
   <p>{runtime.scope}. Timing basis {runtime.basis.join(', ')}.</p>
   <p>{runtime.shared_job_key?'Recorded overlapping interval':'Recorded origin total'} {runtime.recorded_origin_seconds.toFixed(2)} s.
</p>
   {Object.entries(runtime.components).map(([key,seconds])=><p key={key}>{componentLabels[key]} {seconds.toFixed(2)} s.</p>)}
  </div>}
  {pins && <p>{pins.level}{pins.engine?` (${pins.engine})`:''}.</p>}
  {row.raw_native_output_evidence && <p>{row.raw_native_output_evidence}</p>}
 </>;
}

export default function IntermittentApp({page}:{page:'leaderboard'|'protocol'|'paper'}){
 const params=new URLSearchParams(location.search);
 const [task,setTask]=useState(params.get('task')==='daily-7'?'daily-7':'hourly-24');
 const [intermittency,setIntermittency]=useState(valid(classes,params.get('intermittency')));
 const [sparsity,setSparsity]=useState(valid(sparsities,params.get('sparsity')));
 const [sort,setSort]=useState<'rmsse'|'crps9'>(params.get('sort')==='crps9'?'crps9':'rmsse');
 const [data,setData]=useState<Results|null>(null),[error,setError]=useState(''),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false);
 const [document,setDocument]=useState(''),[documentError,setDocumentError]=useState('');
 useEffect(()=>{window.document.title=`${page==='paper'?'Research paper':page==='protocol'?'Protocol':'Leaderboard'} · FreshRetailNet-LT intermittent forecasting`},[page]);
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError('');
  fetch('./intermittent-leaderboard.json',{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error(`Saved results returned ${r.status}`);return r.json()}).then((value:Results)=>{if(value.protocol!=='frn-intermittent-v2')throw Error('Unexpected scoring protocol');setData(value)}).catch(e=>{if(e.name!=='AbortError')setError(String(e))}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
  return()=>controller.abort();},[refresh]);
 useEffect(()=>{if(page==='leaderboard')return;const controller=new AbortController();setDocument('');setDocumentError('');fetch(page==='paper'?'./intermittent-paper.md':'./intermittent-protocol.md',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('The document is not available yet.');return r.text()}).then(setDocument).catch(e=>{if(e.name!=='AbortError')setDocumentError(String(e))});return()=>controller.abort();},[page,refresh]);
 useEffect(()=>{const p=new URLSearchParams({task,intermittency,sparsity,sort});window.history.replaceState(window.history.state,'',`?${p}${location.hash||'#leaderboard'}`)},[task,intermittency,sparsity,sort,page]);
 const selection=`${intermittency}|${sparsity}`;
 const rows=(data?.rows??[]).filter(r=>r.task===task).map(r=>({...r,selected:r.groups[selection]}))
  .sort((a,b)=>(a.selected[sort]??Infinity)-(b.selected[sort]??Infinity)||a.name.localeCompare(b.name));
 const support=(data?.profile_support[task]??[]).filter(r=>(intermittency==='all'||r.intermittency===intermittency)&&(sparsity==='all'||r.sparsity===sparsity)).reduce((n,r)=>n+r.series,0);
 const pending=(data?.pending??[]).filter(r=>r.task===task);
 const completeFoundationCount=rows.filter(r=>r.family==='foundation').length;
 const selectedSupport=data?.target_support[task]?.[selection];
 const origins=selectedSupport?.origins??0;
 let rank=0;
 return <><header><div className="header-inner"><a className="brand" href="#leaderboard"><span className="brand-icon"><Layers size={24}/></span><span>FreshRetailNet-LT<br/><b>Intermittent forecasting</b></span></a><nav aria-label="Main navigation">{['leaderboard','protocol','paper'].map(p=><a key={p} href={`#${p}`} className={page===p?'active':''}>{p==='paper'?'Research paper':p[0].toUpperCase()+p.slice(1)}</a>)}</nav><span className="version">Study in progress</span></div></header>
 <main className="intermittent-app">
 {page==='leaderboard'?<><section className="intermittent-intro"><span className="eyebrow dark">FRESHRETAILNET-LT · RECORDED SALES</span><h1>Forecast intermittent sales.</h1><p>Foundation models, covariate-enabled Nixtla Auto baselines and DWABI. Common eligibility at each forecast date, RMSSE and CRPS-9. Recorded zeros and stockout sales remain observations.</p></section>
 <section className="board" aria-busy={busy}><div className="section-title"><div><span className="eyebrow dark">{data?`${data.test_start} – ${data.test_end}`:'SIX-MONTH TEST · 2025'}</span><h2>Test-set leaderboard</h2></div><a className="text-link" href="./downloads/intermittent-scores.csv" download><Download size={16}/> Download scores</a></div>
 <div className="filters intermittent-filters"><label>Resolution & horizon<select value={task} onChange={e=>setTask(e.target.value)}>{Object.entries(tasks).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Intermittency class<select value={intermittency} onChange={e=>setIntermittency(e.target.value)}>{classes.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Sparsity · proportion of zero sales<select value={sparsity} onChange={e=>setSparsity(e.target.value)}>{sparsities.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label></div>
 <p className="caption">Both filters use only the 84 days before the first test origin and apply together. ADI / CV² thresholds are 1.32 / 0.49. Filters re-aggregate saved case scores with equal series weights within each origin, then equal origin weights.</p>
 {data?.population && <p className="caption">The fixed core uses the {data.population.parent_universe}. January history rules define the core within that roster. Origin eligibility uses available history.</p>}
 <div className="coverage-strip"><div><span>SELECTED PARENT SERIES</span><b>{data?number(support):'—'}</b></div><div><span>OBSERVED SCOREABLE TARGETS</span><b>{selectedSupport?number(selectedSupport.scoreable):'—'}</b>{selectedSupport&&<span className="required-targets">{number(selectedSupport.required)} forecast slots required</span>}</div><div><span>FORECAST ORIGINS</span><b>{selectedSupport?origins:'—'}</b></div><div><span>COMPLETE PARTICIPANTS</span><b>{data?`${rows.length} / ${data.expected_per_task}`:'—'}</b></div></div>
 <p className="caption">Inputs requested: sales + calendar/holidays + planned discount + static hierarchy + strictly historical realized covariates. Each method discloses what its native API supports. Native Auto selection uses a small pre-test budget. DWABI uses all admitted foundation members and earlier available forecast outcomes. No recovery or feature ablations. Point-only methods have no probability rank.</p>
 {data?.foundation_roster&&<details className="intermittent-pending"><summary>Foundation membership and training-data disclosures</summary><p>DWABI members with standalone roster entries are {data.foundation_roster.map(m=>m.name).join(' · ')}. {completeFoundationCount} of {data.foundation_roster.length} have complete standalone results for this task.</p>{Object.entries(data.excluded_methods??{}).map(([name,reason])=><p key={name}>Excluded: {name}. {reason}</p>)}<p>Incomplete training-data disclosures remain unverified. No listed overlap is not proof of no overlap. <a href="./downloads/foundation-admission.json" download>Download the pinned disclosure audit</a>.</p></details>}
 <div className="intermittent-feedback" role="status">{busy?'Loading checked saved results…':error?(data?'Refresh failed; showing the last loaded results. ':'Results could not be loaded. ')+error:`Saved result snapshot: ${data?.generated_utc??'unavailable'}`}<button disabled={busy} onClick={()=>setRefresh(v=>v+1)}>Refresh results</button></div>
 {data&&support===0?<div className="empty"><h3>No series match both filters.</h3><p>Choose another class or zero-proportion range. No score is assigned to an empty group.</p></div>:<div className="table-scroll"><table><thead><tr><th>FORECASTING METHOD</th>{(['rmsse','crps9'] as const).map(m=><th key={m} aria-sort={sort===m?'ascending':'none'}><button className={`sort ${sort===m?'active-sort':''}`} onClick={()=>setSort(m)}>{m==='rmsse'?'RMSSE':'CRPS-9'}<ArrowDown size={14}/></button></th>)}<th>INPUTS & REPRODUCIBILITY</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><span className="rank">{r.selected[sort]==null?'—':++rank}</span><div><b>{r.name}</b><small className="exposure">{r.family==='foundation'?'Foundation model':r.family==='control'?'Reference control':r.family==='ensemble'?'DWABI foundation ensemble':'Fitted forecasting model'}</small></div></td><td className="score">{r.selected.rmsse?.toFixed(4)??'—'}</td><td className="score">{r.selected.crps9?.toFixed(4)??'—'}<small>{r.selected.crps9==null?'Point-only output':'Finite-decile CRPS approximation'}</small></td><td><details><summary>Method details</summary><p>Point: {r.point_type}. {r.probability_type??'No probabilistic forecast supplied'}.</p><p>Inputs: {display(r.consumed_inputs)}.</p>{r.unsupported_requested_inputs?.length? <p>Unsupported requested inputs: {r.unsupported_requested_inputs.join(', ')}.</p>:null}<p>Pretraining: {display(r.pretraining)}. Public test targets mean training overlap cannot be ruled out without a complete data disclosure.</p><p>Code license: {r.code_license}. Weights: {r.weights_license||'Not recorded'}.</p><InputHistory row={r}/><ExecutionEvidence row={r}/><p>Complete result receipt: <code>{r.receipt}</code><br/>SHA256: <code>{r.receipt_sha256}</code></p></details></td></tr>)}</tbody></table>{!rows.length&&!busy&&data&&<div className="empty"><p>No complete result is registered for this task yet. Pending methods receive no score.</p></div>}</div>}
 <p className="caption">Lower is better. RMSSE takes the square root within each series–origin before averaging. CRPS-9 uses nine deciles in the published normalized-sales units; it is not exact full-distribution CRPS. Tasks are never combined into one rank.</p>
 {data&&<details className="intermittent-pending"><summary>{pending.length} participants not scored for this task</summary><p>{pending.map(p=>p.reason?`${p.name} — ${p.reason} ${p.qualification??''}`:p.name).join(' · ')||'Every planned participant is complete.'}</p><p>Unscored methods receive no rank or baseline score.</p></details>}
 </section><section className="two-col"><article className="card"><h3>What “intermittent” means here</h3><p>{data?`${(100*data.profile_summary[task].zero_fraction).toFixed(1)}% of observed training slots are zero at this resolution. `:''}The filters describe the 84 days before testing. Overnight structural zeros and natural stockouts affect recorded sales.</p></article><article className="card"><h3>Six months of testing</h3><p>595 calendar days precede the first test issue. Trained models use 365 days of fitting history. Native Auto selection finishes before testing; frozen recipes can update from later available observations. Earlier eight-week results remain pilot evidence and are excluded here.</p></article></section></>:<section className="document manuscript"><div className="paper-top"><span className="eyebrow dark">{page==='paper'?'METHODS & MEASURED RESULTS':'FROZEN EVALUATION PROTOCOL'}</span><a href={page==='paper'?'./intermittent-paper.md':'./intermittent-protocol.md'} download>Download Markdown</a></div>{documentError?<p role="status">{documentError}</p>:document?<ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex]} components={documentComponents}>{document}</ReactMarkdown>:<p role="status">Loading document…</p>}</section>}
 </main><footer><div><b>FreshRetailNet-LT intermittent forecasting benchmark</b><p>Independent research · Dingdong Inc. dataset attribution · CC BY 4.0<br/>Only complete, verified results receive scores. The study is in progress.</p></div><div><a href="#original">Original FreshRetailNet-LT protocol</a><a href="https://github.com/AbishekSriramulu/freshretailnet-intermittent-benchmark" target="_blank" rel="noreferrer">GitHub</a><a href="mailto:abisheksriramulu95@gmail.com">abisheksriramulu95@gmail.com</a></div></footer></>;
}
