# FreshRetailNet-LT intermittent recorded-sales protocol

Current protocol: **frn-intermittent-v2**. Participant campaign: **intermittent-six-month-v4**. Testing spans **January20–July20,2025**. This local study is active; no publication or outreach is in scope.

## Purpose and training fairness

Forecast recorded sales, including genuine zeros and sales recorded during stockouts. This is not an estimate of unobserved lost demand. Missing source measurements are unknown; no evaluator labels are imputed. There are no recovery methods, feature ablations, seasonal panels, weekly totals or monthly tasks.

The source contains777calendar days, June5,2023–July20,2025. A six-month test leaves595calendar days before the first issue; a52-week test would leave413. We chose six months to retain a full year of fitting history and sufficient earlier observations for trained comparators. This covers more evaluation occasions without claiming a full annual test cycle.

The old May26–July20 eight-week protocol is **v1 pilot evidence**. Its results and selected recipes cannot be relabelled or reused as earlier v2 selections. Pilot scores were already known when v2 was designed, so this is a retrospective public-data benchmark, not a blind or preregistered experiment. We chose the test span using historical support before comparing v2 model scores.

## Source, core and forecast contract

Pinned dataset revision:8a9543bee53de0e2edc90881c2bbd2bfb711cc51, Dingdong-Inc/FreshRetailNet-LT, CC BY4.0. Sales are published under one global normalization coefficient; scores are not item counts or currency. Use supplied local dates/hours without workstation timezone conversion.

The parent universe comes from the official July 14–20, 2025 evaluation roster. Within that universe, a parent needs at least 365 observed daily records before January 20, including 300 in the preceding 365 days, 42 in the preceding 84 days, one in the preceding seven days, and positive supported hourly and daily training scales. This freezes 4,538 established store–product parents across 838 stores. The overall universe depends on July membership.

At each origin, require forecasts for members of this fixed core with at least one original record in the preceding7 completed days and a valid task scale. Zeros count as observations. Conditional on the July universe, activity, scales and issue-time features use causal prefixes. Forecast populations can therefore vary across origins while remaining identical across methods.

| Task | Forecast horizon | Origins | Inference context | Required / observed targets |
|---|---|---:|---|---:|
| hourly-24 | Next24 hourly sales |182 daily midnight issues |168hours |19,783,176 /19,768,080 |
| daily-7 | Next7 daily totals |26 Monday midnight issues |84days |824,047 /823,276 |

Daily totals sum all24 source hours. An absent source day is unknown, not zero. Stockout annotations do not remove recorded-sales labels. Complete forecasts are mandatory even for missing future source targets; those unknown labels alone are omitted from scoring. Partial runs and small checks receive no rank.

Preparation authorities are protocols/intermittent-v2.json, reports/intermittent-v2/data-audit.json, data/cohorts/intermittent-v2/core.parquet and eligibility.npz. Forecast files contain only predictions and interval keys; labels/scales stay in evaluator references.

## One covariate policy and temporal handling

Use sales + calendar + permitted covariates. There are no feature-profile or price-unknown variants.

| Field | Hourly/daily representation | Availability |
|---|---|---|
| Sales | Original hourly values; daily sum of all24hours | Completed intervals before issue |
| Discount | Supplied daily ratio, repeated within its hourly day | Assumed known future |
| Calendar | Hour, weekday and annual cyclic features | Known future |
| Holiday | Supplied daily flag, repeated within day | Known future |
| Precipitation | Supplied daily summary | Past only |
| Temperature, humidity, wind | Supplied daily summaries, without fabricated hourly measurements | Past only |
| Activity | Supplied realized daily value | Past only; no archived future schedule |
| Stock | Original hourly status; fraction of24 known hours for a historical day | Past only |
| Store, product, city and category hierarchy | Metadata available before the issue; native categories or declared numeric encoding | Prefix-known |

Daily covariates are source summaries, not24 independent hourly measurements. Repetition for hourly alignment does not multiply precipitation or any other daily quantity on return to daily resolution. No weekly/monthly covariate aggregation is needed in this campaign.

A realized daily summary is available after that source day finishes. Historical hourly slots before23:00 use the preceding completed daily summary; the final23:00–24:00 slot may include its now-completed day. Daily historical slots use completed-day measurements. Supervised examples align these channels to their own forecast issue. Recursive rollouts freeze past-only channels at the issue. Actual future weather/activity/stock never enters future covariates. No weather-forecast archive is supplied.

There is no nominal selling-price series in this dataset. The supplied discount ratio is the price-related input. The frozen assumed plan retains every finite ratio, including0; carries preceding planned ratios across archive gaps; uses1 before the first ratio; and has unconditional availability1. It uses only the discount field. Every v2 foundation and fitted adapter uses this plan on future grids and internal validation grids, avoiding a future source-row-presence feature.

The plan is constructed retrospectively under the user's known-future-price assumption. It is not an independently archived issue-time schedule. Its file and receipt hashes remain pinned.

Static numeric encodings use original recorded-sales category means strictly before January1,2024, with an early global fallback and daily means divided by24 for hourly inputs. No test outcomes enter this encoder. Native static/grouping APIs are used where supported. A model normalizing away constant channels is disclosed; supplying a channel is not proof of useful static-level conditioning.

## Gaps and fitted models

All fitted participants use the preceding365calendar days at both resolutions. Models with a separate neural input tensor use168hours or84days at issuance. AutoMFLES and Sporacast retain native365-day historical state; this is disclosed per method rather than represented as a second context experiment. Neural and tree comparators refit on the declared weekly schedule; the native statistical AutoMFLES and Sporacast APIs refit parameters at each issue. Later available observations may enter these frozen recipes. Model selection finishes before January20.

Models supporting missing targets keep native masks. Dense-input models fill only absent measurements causally: prior observations of the same hour-of-week or weekday, then the prior overall mean; leading unknowns use an explicit zero placeholder and availability mask. Imputed values do not become donors or observed evaluator labels. Actual zeros and stockout sales are preserved.

AutoNBEATSx, AutoNHITS and AutoTFT use exactly2 native Optuna trials per task, seed0, decile MQLoss,1000updates, batch/windows32 and no outer search. Validation targets are January13–19; selected actual parameters are frozen for test-time refits. Hourly training forecast windows begin at midnight.

AutoMLForecast/AutoLightGBM uses2 native pre-test trials per task with selection history ending before January6. Selected actual parameters are shared across direct, recursive and Rectify and native point/nine quantile objectives. Direct training uses at most32,000 originally observed rows per lead; recursive uses at most32,000×H. Quantile-recursive feedback is a plug-in path approximation.

MLForecast1.1.0 supplies no public named Rectify API. The local declared adapter combines issued recursive backcasts and direct residual corrections. Daily residual issues January7/8/9/10 and hourly issues January15/16/17/18 mature before testing. No in-sample fitted values or test-selected residual policy substitute for issued backcasts.

AutoMFLES uses native two-candidate selection, max_rounds8/16, OLS exogenous fitting, no changepoints, seasons7 daily/[24,168] hourly, and native two-window conformal deciles. Selection histories end January6 daily and January18 hourly. Seven hierarchy-mean columns are supplied as within-series constants; independent native OLS does not provide shared hierarchy learning or separately identifiable static effects. Sporacast retains its supplied native algorithm: daily validation issues December9–January6 and hourly issues January4–18, with every outcome mature before January20. These participants freeze a static metadata snapshot no later than their earliest native validation issue. May-selected v1 recipes are not reused.

Crossformer uses the authors' fixed architecture and1000updates, historical multivariate inputs and sales readout. It has no supported future-exogenous argument and is point-only. No AutoCrossformer exists in the pinned Nixtla version. Unsupported features are shown rather than silently credited.

## Foundation models and DWABI

The base 18-participant manifest is protocols/intermittent-participants-v4.json. The separately declared Sporacast forecast-feature extension below brings the current roster to 19 methods and 38 method/task slots. The eight foundations are Chronos-2, TiRex2, TimesFM3, historical-covariate Toto2, t0-gamma, t0-beta, Timestral-209M and CIProto. TimeH2O-v1 is excluded because its pinned official training disclosure lists FreshRetailNet-LT. Other incomplete training inventories remain unverified.

Use one released zero-shot recipe per family. No context/grouping sweep or fine-tuning study. Toto receives joint historical auxiliary variates within each parent and scores sales channel0; no future-exogenous API is claimed. CIProto receives the complete eligible origin population with actual pre-origin hierarchy, preserving native grouping.

CIProto uses its released mamba3 CUDA configuration by default in environments/intermittent-ci-fused-20261125: bfloat16 autocast with float32 parameters and original TTA file 970c4bf1…. This execution correction follows the released configuration and resource qualification; it was not selected from complete benchmark scores. Source-matched four-parent gates and both full 4,538-parent/two-issue daily and hourly warm/cold/output/resource qualifications passed. Exact gate pins are in reports/intermittent-v2/feature-current-bfloat16-native-gate-pins-20261125.json; resource receipts 1e3e7f13…/75dc0804… record actual native shapes, requested keys, 16-cell execution, compiler dependencies and headroom. External NVCC 13.3.33 remains compiler-only; Python toolkit 13.0.3.0 and Torch CUDA 12.8 are separately recorded.

The earlier FP32-specific daily CIProto and dependent DWABI results are preserved with their source snapshots in runs/retired-attempts/20261126-ciproto-released-gpu-default, then recomputed using the current member recipe. The earlier portable comparison's 3 of 252 decile discrepancies (maximum absolute difference 0.0004501343; all 28 points within tolerance) remain historical diagnostics of that FP32 path. Current gates and per-origin receipts identify the current recipe. Every scored task requires complete issuance and its own source-matched native qualification.

V2 uses native CUDA from the first issue, with TF32 disabled and effective torch kernel files pinned. Other foundation participants retain their float32 recipes; CIProto follows the released autocast configuration above. Prior CPU/CUDA diagnostics found five model/task closeness failures attributable to released near-constant normalization reductions; these failures are retained. Native normalizers and covariates are preserved. Same-device batch/group correctness and real input checks remain required. Retained adapters guard the native point and scored deciles before sorting or nonnegative projection. Historical retained forecasts were checked after projection. Raw returns were not stored, and the reviewed evidence contains no observed native nonfinite.

DWABI is the sole authorized cross-model combination. Its native WalkForwardBlend sees all8 admitted members' original matched deciles. Native joint-pinball weights/selection start with equal full-roster weights until3 prior windows mature. Availability precedes issuance at the same midnight via explicit phase clocks. Only earlier mature labels inform a decision. Every foundation retains its own row; native subset selection does not shorten the declared candidate roster.

## Additional Sporacast forecast-feature participant

One separately declared extension, `sporacast-v2-ci-gamma-features`, adds CIProto and t0-gamma zero-shot predictions to the existing Sporacast design at both resolutions. The original Sporacast row and frozen foundation/DWABI roster remain. This extension was requested after some results were visible and is not a blind predeclared comparison. Source-level checks and genuine full-cohort two-issue generation with fresh-process verification passed for both resolutions. Complete historical banks, fitted extension results and whole-bank runtime measurements remain pending.

Reuse the native stride-one windows, selected rows, weights, budgets, quantile heads, validation and update schedule. For a native row ending at tick t with one-based lead h and step length Δ, the foundation issue is tick[t]+Δ, target start is tick[t+h], and target end is target start+Δ. The same parent, issue, lead and target interval identify its features. Each source supplies its native point and nine labelled deciles: twenty numeric predictors in total. They are ordinary predictors for every native quantile head, whose supervised outcome remains actual recorded sales.

An issued foundation prediction is available immediately, even when its target interval has not started. Only a supervised actual-sales label must have ended by the Sporacast fitting cutoff. Thus validation/test prediction consumes its own issue's foundation outputs immediately, while historical supervised rows use forecasts reconstructed from their own earlier prefixes. No later fit cutoff, target-date-only join or subsequently issued forecast substitutes for that earlier information set.

Generate features for the union of the native training, validation, update and prediction requests. Run each foundation source on the fixed full parent cohort at each exact issue, independently of which rows were later sampled for training. Preserve its released recipe and input context. Hourly source slicing includes only hours before that exact issue; future daily realized summaries remain unavailable. Immutable task-specific banks contain forecast values and keys, without actual labels. Missing or incompatible feature keys fail the run. Full banks, genuine native resource pilots, canonical fit/checkpoint/replay and complete saved-output scoring are required before ranking this extension.

## Scores, filters and missingness

For parent i and origin o, b_io is the mean squared original-recorded-sales difference at7-calendar-day separation in the preceding365days, matching hours for hourly data. Require at least14 valid pairs and a positive scale. There is no arbitrary epsilon or method-specific reconstructed scale.

RMSSE_io = sqrt(mean over observed leads of (actual − point)^2 / b_io).

For q=.1,…,.9, pinball_q(u)=u×(q−1[u<0]) and CRPS9_io = mean over observed leads of (2/9)×sum_q pinball_q(actual−forecast_q).

Average scoreable parents equally within each origin, then origins equally. The RMSSE square root is inside each parent–origin case. CRPS-9 is a finite-decile approximation in published normalized-sales units, not exact full-distribution CRPS. Point-only output receives no probability rank. Declare the native point action and adapter projection/sorting; the evaluator does not repair forecasts.

Profiles use84days strictly before January20. ADI is observed periods divided by positive periods; CV² uses positive sales. Thresholds1.32/.49 classify smooth, erratic, intermittent and lumpy, with explicit all-zero/unobserved cases. Sparsity is observed zero share. Filters intersect fixed training groups and recompute the same macro scores without refitting. Empty groups get no score. Hourly zeros include strong daily seasonality, not only sporadic positive demand.

Missing source labels reduce observed support; missing model forecasts invalidate a complete task. No grand score combines daily/hourly views. Publish required/observed target counts and origin support beside scores.

## Reproduction and completion

Prepare using scripts/prepare_intermittent_v2.py. V2 models use separate intermittent-v2__METHOD__TASK run folders and reports/intermittent-v2/completed.json. Do not edit v1 forecasts, runtimes or reference sources.

Each result binds its source, code, checkpoint, runtime, covariate and cohort hashes, actual backend, training and selection lineage, origin receipts and forecast interpretations. The CUDA foundation receipts pin effective torch kernel files. AutoMFLES pins selected CPU libraries including NumPy/SciPy linear algebra. LightGBM and Sporacast receipts record selected native CPU library hashes. Auto neural and Crossformer receipts bind source, package versions and interpreter without effective native kernel hashes. Method details report the pins each result actually records. Complete tasks undergo canonical scoring and an independent saved-output loss replay before atomic registration. Missing/corrupt sealed evidence is preserved as a failure. Smoke checks are never results.

The local website shows only complete v2 test results. Training/validation periods appear as methodology, without leaderboard scores. Until v2 completes, the old7 daily v1 participants remain pilot evidence only. Local/free execution, one GPU process at a time, bounded CPU workers and the25GiB reserve remain in effect. No public release, upload, email or release-folder copying is authorized.
