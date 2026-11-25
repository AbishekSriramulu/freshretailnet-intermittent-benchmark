import {Fragment,useEffect,useRef,useState} from 'react';
import {Download,Info,RefreshCw} from 'lucide-react';
import './local-study.css';
import {activeResult,forecastTasks,retiredWeeklyTask} from './ActiveTasks';
import {standardInputResult} from '../standardInputs';
import InputGuide,{featuresForRow,gapDescription,staticForRow,historyLabel,recoveryName,type InputRecord} from './InputGuide';
import EvaluationPeriods from './EvaluationPeriods';
import ModelProvenance from './ModelProvenance';

export const isLocalHost=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
type Result=InputRecord&{panel:string;status?:string;scores:Record<string,number>;required:number;scoreable:number;series?:number;origins?:number;grouping?:string;point_type?:string;pretraining?:string;weights_license?:string;code_license?:string;runtime_seconds?:number;fit?:string};
type Table={scope:string;original:Result[];main_recent:Result[]};
type Ledger={pending:string[]};
type Job={method:string;task:string;panel:string;status:string;saved_origins:number;total_origins:number;next_origin:string|null;score_admitted:boolean;progress_label?:string;recovery_method?:string};
type Live={checked_at:string;job:Job|null;jobs?:Job[];report_versions:Record<string,string>};
const titles:Record<string,string>={chronos2:'Chronos-2','chronos2-synth':'Chronos-2-Synth',timesfm3:'TimesFM 3',toto2:'Toto 2',tirex2:'TiRex 2','tabpfn-ts':'TabPFN-TS','seasonal-empirical':'Seasonal empirical','seasonal-naive':'Seasonal naïve',zero:'Zero'};
const taskNames:Record<string,string>={'daily-7':'Daily · 7 days','shift-7':'AM / PM · 7 days','hourly-24':'Hourly · next day','hourly-168':'Hourly · 7 days','recovery-28':'Hourly recovery · 28 days'};
const metricNames:Record<string,string>={wape:'WAPE',wpe:'Signed WPE',mae:'MAE',mse:'MSE',scaled_mse:'Scaled MSE',scaled_wis9:'Scaled WIS-9'};
const count=(x:number)=>x.toLocaleString('en-US');
const recoveryTask=(task:string)=>task==='recovery-28';
const inputHistory=(r:Result)=>r.history?.startsWith('recovered')?'recovered':'raw';
async function read<T>(name:string):Promise<T>{
 const response=await fetch('/__local-study/'+name,{cache:'no-store'});
 if(!response.ok)throw new Error(`Local ${name}: HTTP ${response.status}`);
 return response.json();
}
export default function LocalStudy(){
 const params=new URLSearchParams(location.search);
 const original=params.get('study_track')==='original';
 const [track,setTrack]=useState(original?'original':'recent');
 const [task,setTask]=useState(original?'original-daily-7':retiredWeeklyTask(params.get('study_task')));
 const [history,setHistory]=useState(params.get('study_history')?.startsWith('recovered')?'recovered':'raw');
 const [sort,setSort]=useState(original?['wape','mae','mse'].includes(params.get('study_sort')||'')?params.get('study_sort')!:'wape':params.get('study_sort')==='scaled_wis9'?'scaled_wis9':'scaled_mse');
 const [table,setTable]=useState<Table|null>(null),[ledger,setLedger]=useState<Ledger|null>(null),[live,setLive]=useState<Live|null>(null);
 const [detail,setDetail]=useState<string|null>(null),[error,setError]=useState(''),[liveError,setLiveError]=useState(''),[busy,setBusy]=useState(false);
 const refreshing=useRef(false),versions=useRef('');
 async function refresh(){
  if(refreshing.current)return;
  refreshing.current=true;setBusy(true);setError('');
  try{
   const [t,l,s]=await Promise.all([read<Table>('leaderboard.json'),read<Ledger>('progress.json'),read<Live>('live.json')]);
   setTable(t);setLedger(l);setLive(s);setLiveError('');versions.current=JSON.stringify(s.report_versions);
  }catch(e){setError(String(e))}finally{refreshing.current=false;setBusy(false)}
 }
 useEffect(()=>{if(isLocalHost)void refresh()},[]);
 useEffect(()=>{
  if(!isLocalHost)return;
  let stopped=false,inFlight=false;
  async function poll(){
   if(inFlight)return;
   inFlight=true;
   try{const value=await read<Live>('live.json');if(stopped)return;setLive(value);setLiveError('');if(JSON.stringify(value.report_versions)!==versions.current)await refresh()}
   catch{if(!stopped)setLiveError('Live status unavailable; showing the last successful update.')}
   finally{inFlight=false}
  }
  const timer=window.setInterval(()=>void poll(),15000);
  return()=>{stopped=true;window.clearInterval(timer)};
 },[]);
 useEffect(()=>{
  if(!isLocalHost)return;
  const p=new URLSearchParams(location.search);
  for(const key of ['study_features','study_regime','study_controls','study_recovery_condition'])p.delete(key);
  Object.entries({study_track:track,study_panel:track==='original'?'original':'recent',study_task:task,study_history:history,study_sort:sort}).forEach(([k,v])=>p.set(k,v));
  window.history.replaceState(null,'',`?${p}#local-study`);
 },[track,task,history,sort]);
 if(!isLocalHost)return <section className="document"><h1>Local benchmark</h1><p>This view is available in the local development server.</p></section>;
 if(!table||!ledger)return <section className="document"><h1>Local benchmark</h1><p role="status">{error||'Loading saved results…'}</p><button className="primary" onClick={()=>void refresh()}>Retry</button></section>;
 const source=track==='original'?table.original:table.main_recent.filter(activeResult).filter(standardInputResult);
 const runs=source.filter(r=>track==='original'||r.task===task&&(recoveryTask(task)||inputHistory(r)===history)).sort((a,b)=>(a.scores[sort]??Infinity)-(b.scores[sort]??Infinity));
 const metrics=track==='original'?['wape','wpe','mae','mse']:['scaled_mse','scaled_wis9'];
 function chooseTrack(value:string){setTrack(value);setTask(value==='original'?'original-daily-7':'daily-7');setSort(value==='original'?'wape':'scaled_mse');setHistory('raw');setDetail(null)}
 return <section className="local-study">
  <div className="section-title"><div><span className="eyebrow dark">LOCAL DEVELOPMENT · PUBLICATION DEFERRED</span><h1>Benchmark participants</h1></div><button className="text-link" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/>{busy?'Reading…':'Refresh results'}</button></div>
  <div className="notice"><Info size={18}/><p><b>Test-set results.</b> Fixed model recipes, with recorded or reconstructed history. Unfinished participants receive no score.</p></div>
  <EvaluationPeriods original={track==='original'}/>
  {error&&<p role="alert">{error}</p>}
  <details className="card local-pending"><summary>Running work</summary>
   {(live?.jobs||(live?.job?[live.job]:[]))?.map(job=><p className="local-queue" role="status" key={`${job.method}-${job.task}-${job.panel}-${job.recovery_method||'none'}`}><b>{titles[job.method]||job.method} · {job.panel==='original'?'Original':'Recent'} · {taskNames[job.task]||job.task}{job.recovery_method&&<> · {job.recovery_method==='None'?'Recorded sales':`${titles[job.recovery_method]||job.recovery_method} recovery`}</>}:</b> {job.status}. {job.progress_label||'Saved origins'}: {job.saved_origins} / {job.total_origins}.{job.next_origin&&<> Next unfinished origin: {job.next_origin}.</>}</p>)}
   {live&&<p className="caption">Saved files are progress only; complete outputs require independent validation before scoring. Checked {new Date(live.checked_at).toLocaleTimeString()}; updates every 15 seconds.</p>}
   {!live&&<p>No active run recorded.</p>}
   {liveError&&<p role="alert">{liveError}</p>}
  </details>
  <div className="segmented" aria-label="Benchmark track"><button aria-pressed={track==='recent'} className={track==='recent'?'selected':''} onClick={()=>chooseTrack('recent')}>Recent test set</button><button aria-pressed={track==='original'} className={track==='original'?'selected':''} onClick={()=>chooseTrack('original')}>Original protocol · test set</button></div>
  <section className="board">
   <div className="section-title"><div><span className="eyebrow dark">{track==='original'?'70,000 REQUIRED / 35,785 SCORED':'FIXED TARGETS · LOWER IS BETTER'}</span><h2>{track==='original'?'Original test results · daily seven-day forecasts':'Recent test results'}</h2></div><a className="text-link" href="/__local-study/leaderboard.json" download="benchmark-results.json"><Download size={16}/>Result receipts</a></div>
   {track!=='original'&&<div className="filters"><label>Resolution & horizon<select value={task} onChange={e=>{setTask(e.target.value);setDetail(null);setSort('scaled_mse')}}>{[...forecastTasks,'recovery-28'].map(t=><option key={t} value={t}>{taskNames[t]}</option>)}</select></label>{!recoveryTask(task)&&<label>History supplied to forecaster<select value={history} onChange={e=>setHistory(e.target.value)}><option value="raw">{historyLabel('raw')}</option><option value="recovered">{historyLabel('recovered')}</option></select></label>}</div>}
   <InputGuide features={track==='original'?'all':'both'} recovery={recoveryTask(task)} original={track==='original'}/>
   <p className="caption">The recovery column names stockout reconstruction and separately describes missing-record filling. “None” means no stockout reconstruction; any seasonal/mean fill is still disclosed.</p>
   <p className="caption">{track==='original'?'Original pooled metrics, dates and scoring mask. Adapted runtime and training recipes are disclosed. Signed WPE describes bias and is not a ranking metric.':recoveryTask(task)?'Recovery uses approximately 30% stockout-shaped masking, seeds 0, 1 and 2. Only deliberately hidden observed truth is scored. Naturally lost demand remains unlabelled.':'Each task uses the same frozen targets and recorded-sales training scales for every participant. Forecasts are issued at multiple origins within this one evaluation period.'}</p>
   <div className="table-scroll"><table><thead><tr><th>DEMAND METHOD / RECIPE</th><th>RECOVERY METHOD</th>{metrics.map(m=><th key={m} aria-sort={sort===m?'ascending':'none'}><button className={sort===m?'sort active-sort':'sort'} disabled={m==='wpe'} onClick={()=>setSort(m)}>{metricNames[m]}</button></th>)}<th>SCORED / REQUIRED</th></tr></thead><tbody>{runs.map(r=><Fragment key={r.id}>
    <tr><td><div><button className="method" onClick={()=>setDetail(detail===r.id?null:r.id)} aria-expanded={detail===r.id}>{recoveryTask(r.task)?'— · recovery evaluation':titles[r.method]||r.method}<small>{[r.fit,r.context_days?`${r.context_days}-day context`:'',r.grouping].filter(Boolean).join(' · ')||'Declared reference recipe'}</small></button><ModelProvenance run={r}/></div></td><td className="input-cell"><b>{recoveryName(r)}</b><small>{gapDescription(r)}</small></td>{metrics.map(m=><td className="score" key={m}>{r.scores[m]===undefined?'—':`${(r.scores[m]*(m==='wape'||m==='wpe'?100:1)).toFixed(5)}${m==='wape'||m==='wpe'?'%':''}`}</td>)}<td>{count(r.scoreable)} / {count(r.required)}</td></tr>
    {detail===r.id&&<tr className="detail"><td colSpan={metrics.length+3}><b>Declared result</b><p className="local-id">{r.id}</p><p>Inputs: {featuresForRow(r)}. {staticForRow(r)} Recovery: {recoveryName(r)}. {gapDescription(r)} Point: {r.point_type||'See receipt'}. Pretraining: {r.pretraining||'See receipt'}. Code: {r.code_license||'See receipt'}; weights: {r.weights_license||'See receipt'}. {r.series===undefined?'':`${count(r.series)} parent series. `}{r.origins===undefined?'':`${r.origins} origins. `}{r.runtime_seconds===undefined?'':`Measured runtime ${r.runtime_seconds.toFixed(1)} seconds.`}</p></td></tr>}
   </Fragment>)}</tbody></table></div>
   {!runs.length&&<div className="empty"><h3>No completed participant for this task and history</h3><p>Unfinished or unsupported methods receive no score.</p></div>}
  </section>
  <details className="card local-pending"><summary>Remaining work and reports</summary><ul>{ledger.pending.map(p=><li key={p}>{p}</li>)}</ul><p>Only complete checked forecasts enter the tables. Publication remains deferred.</p><div className="download-row"><a href="/__local-study/leaderboard.md" download><Download size={16}/>Benchmark report</a><a href="/__local-study/progress.md" download><Download size={16}/>Progress</a></div></details>
 </section>;
}
