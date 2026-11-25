export type InputRecord={id:string;method:string;task:string;history?:string;features?:string;feature_spec?:string;regime?:string;recovery_method?:string;target_gap_policy?:string;missing_history?:unknown;context_days?:number;grouping?:string;static_covariates?:string[];static_encoding?:string;static_pool_population?:string;hierarchy_enabled?:boolean;mask_rate?:number;mask_seeds?:number[]|number;recovery_condition?:string;actual_block_origins?:number;evaluation_conditions?:number};

export function recoveryCondition(r:InputRecord){
 if(r.recovery_condition)return r.recovery_condition;
 const rate=r.mask_rate??Number(r.id.match(/__rate(0\.[135])(?:__|$)/)?.[1]??(r.id.startsWith('pilot__recovery-')?'0.3':'NaN'));
 const seeds=Array.isArray(r.mask_seeds)?r.mask_seeds:r.mask_seeds===3?[0,1,2]:r.id.startsWith('pilot__recovery-')?[0]:[];
 return Number.isFinite(rate)&&seeds.length?`rate${rate}-seeds${seeds.join('-')}`:'undeclared';
}
export const recoveryConditions:Record<string,string>={
 'rate0.3-seeds0-1-2':'30% hidden · three fixed masks · primary',
 'rate0.1-seeds0-1-2':'10% hidden · three fixed masks · sensitivity',
 'rate0.5-seeds0-1-2':'50% hidden · three fixed masks · sensitivity',
 'rate0.3-seeds0':'30% hidden · single mask · pilot comparison',
 undeclared:'Undeclared condition · see receipt',
};

export const featureLabels:Record<string,string>={
 target:'Sales history',
 calendar:'Sales + calendar',
 noncalendar:'Sales + price & past conditions',
 both:'Sales + calendar + permitted covariates',
 source:'Source model inputs',
 'recovery-inputs':'Recovery model inputs',
};
export const featureGroup=(value?:string)=>!value?'target':value in featureLabels?value:'source';
export const featureLabel=(value?:string)=>featureLabels[featureGroup(value)];
export const historyLabel=(value:string)=>value==='raw'?'Recorded sales · no stockout recovery':value==='observed-context'?'Unmasked observed context':value==='recovered'?'Reconstructed sales':value.startsWith('recovered:')?`Reconstructed sales · ${value.slice(10)}`:value;

export function featuresForRow(r:InputRecord){
 if(r.task.startsWith('recovery'))return ['TimesNet','ImputeFormer','SAITS','iTransformer','GPVAE','CSDI','DLinear'].includes(r.method)?'Unmasked sales, discount, holiday, precipitation, temperature and hour · retrospective block inputs':'Unmasked observed sales · declared recovery control';
 const group=featureGroup(r.features);
 if(r.feature_spec==='known-future-only-v1'&&r.regime==='original-allowed'){
  const originalInputs:Record<string,string>={
   target:'Sales history · no calendar, discount, weather or activity inputs',
   calendar:'Sales + calendar and holidays · known for the forecast period',
   noncalendar:'Sales + discount, weather and activities · Original permits realized future weather and activities',
   both:'Sales + calendar, holidays, discount, weather and activities · Original permits realized future weather and activities',
  };
  return `${originalInputs[group]||featureLabels[group]} · historical stockout indicators unsupported`;
 }
 if(r.feature_spec==='known-future-only-v1'&&group==='both')return 'Sales + calendar + planned discounts · past weather, activity and stock inputs unsupported';
 if(r.feature_spec==='known-future-only-v1')return `${featureLabels[group]} · calendar/discount inputs only when enabled; past weather, activity and stock inputs unsupported`;
 if(group==='source')return r.features||featureLabels.source;
 if(['noncalendar','both'].includes(group)&&!['stock-v1','native-stock-v1','stock-v1-categorical-mean-v1','stock-v1-categorical-matched-control-v1','stock-v1-seven-static-v1'].includes(r.feature_spec||''))return `${featureLabels[group]} · earlier recipe; see exact columns`;
 return featureLabels[group];
}

export function staticForRow(r:InputRecord){
 if(r.id.startsWith('categorical-v1__')&&r.id.includes('__causal-category-mean__'))return 'Static categories: store, product, city, management group and category levels 1–3. Encoding: means of earlier recorded sales from the official 10,000-series pool, fixed over each forecast horizon. No joint-series inference.';
 if(r.id.startsWith('categorical-v1__TFT__')&&r.id.includes('__seven-embeddings__'))return 'Static categories: store, product, city, management group and category levels 1–3, using native categorical embeddings.';
 if(r.static_covariates){
  const names:Record<string,string>={store_id:'store',product_id:'product',city_id:'city',management_group_id:'management group',first_category_id:'category level 1',second_category_id:'category level 2',third_category_id:'category level 3'};
  if(r.static_covariates.length&&r.static_encoding?.includes('original-recorded'))return `Numeric category context: ${r.static_covariates.map(name=>names[name]||name).join(', ')}. Means of original recorded prefixes from the official 10,000-series pool, fixed over each forecast horizon. ${r.grouping==='product-city'?'Joint inference uses the same product within city.':'No joint-series inference.'}`;
  return r.static_covariates.length?`Static categories: ${r.static_covariates.map(name=>names[name]||name).join(', ')}.`:'Static categorical inputs: none.';
 }
 if(r.id.startsWith('original__TFT__'))return 'Static categories: store, product, city, management group and category levels 1–3.';
 if(r.id.startsWith('research-v1__TFT__'))return ['noncalendar','both'].includes(r.features||'')?'Static categories: store, product, city, management group and category levels 1–3.':'Static categories: store and product identities.';
 if(r.grouping==='product-city')return 'Metadata selects peers: same product within city. No static categorical inputs.';
 if(r.grouping==='store-category')return 'Metadata selects peers: same store within the source category-level-3 label. No static categorical inputs.';
 if(r.grouping?.startsWith('random'))return 'Random peer control, matched to metadata-group sizes. No static categorical inputs.';
 if(r.method==='tabpfn-ts')return 'Static categorical inputs: unsupported by the current adapter.';
 if(['chronos2','chronos2-synth','timesfm3','toto2','tirex2'].includes(r.method))return 'Static categorical inputs: not supplied in this recipe.';
 if(['zero','seasonal-naive','seasonal-empirical','SSA','DLinear','TimesNet','ImputeFormer','SAITS','iTransformer','GPVAE','CSDI'].includes(r.method))return 'Static categorical inputs: not used by this recipe.';
 return 'Static context: see the saved input receipt.';
}

export function recoveryName(r:InputRecord){
 if(r.task.startsWith('recovery'))return r.method==='zero'?'Zero-fill':r.method==='seasonal-empirical'?'Seasonal empirical mean':r.method==='seasonal-naive'?'Seasonal naïve':r.method;
 if(r.recovery_method)return r.recovery_method==='seasonal-empirical'?'Seasonal empirical mean':r.recovery_method;
 if(r.history?.startsWith('recovered:'))return r.history.slice(10);
 if(r.history==='recovered')return 'Declared recovery · see receipt';
 return 'None';
}

export function gapDescription(r:InputRecord){
 if(r.task.startsWith('recovery'))return 'Deliberately hidden observations reconstructed; natural lost demand has no label.';
 if(r.method==='toto2'){
  const units=r.task.startsWith('hourly')?'hours':r.task.startsWith('weekly')?'weeks':'days';
  return `Missing records: native masks; gaps in the final 32 ${units} receive native zero completion.`;
 }
 const history=typeof r.missing_history==='string'?r.missing_history:Array.isArray(r.missing_history)?r.missing_history.map(value=>typeof value==='object'&&value!==null&&'policy' in value?String(value.policy):'').join(' '):'';
 const policy=`${r.target_gap_policy||''} ${history}`;
 if(/seasonal-observed-then-channel-mean|seasonal original-observed donors, then observed channel mean/.test(policy))return 'Missing records: observed seasonal value → observed context mean.';
 if(/native/.test(policy))return 'Missing records: native missing-value masks; no external fill.';
 if(r.method==='zero')return 'Zero forecast; no history imputation.';
 if(['seasonal-naive','seasonal-empirical'].includes(r.method))return 'Gap-aware observed-history formula; context-mean fallback.';
 if(r.id.startsWith('original__SSA__'))return 'No missing records in its original 42-day inference context.';
 if(r.id.startsWith('original__TFT__'))return `No missing records in its original ${r.context_days||35}-day inference context.`;
 if(r.id.startsWith('original__DLinear__'))return 'No missing records in its original 35-day inference context; source training compresses missing dates.';
 return 'Missing-record handling: see saved preparation receipt.';
}

export default function InputGuide({recovery=false,original=false}:{features?:string;recovery?:boolean;original?:boolean}){
 return <section className="input-guide" aria-label="Inputs and availability">
  <p className="input-rule"><b>{recovery?'Retrospective recovery rule':original?'Original protocol information rule':'Sales + calendar + permitted covariates'}</b><br/>{recovery?'Unmasked observations in the declared reconstruction block may be used. Hidden truth is excluded from every input.':original?'The published protocol permits future realized weather and activities. These source-faithful results stay on the Original page; future sales and stockout outcomes are forbidden.':'Known future: calendar, holidays and planned price/discount. LT supplies discount only. Realized weather, activity and stock information use measurements strictly before the forecast origin, as past context or declared lags.'}</p>
  {!recovery&&!original&&<p>Static store, product, city, management group and three category levels use causal recorded-sales means or embeddings where supported. Every training example obeys its own cutoff. Unsupported inputs are disclosed in method details. Raw and recovered history share the same inputs.</p>}
 </section>;
}
