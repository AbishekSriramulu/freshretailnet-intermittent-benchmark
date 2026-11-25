# FreshRetailNet-LT intermittent forecasting benchmark

[Open the leaderboard](https://abisheksriramulu.github.io/freshretailnet-intermittent-benchmark/)

An evolving comparison of foundation and fitted forecasting models on recorded retail sales. The test period is January 20–July 20, 2025: 182 next-day hourly forecast origins and 26 next-week daily origins, with prefix-only eligibility within a 4,538-series core.

The site reports RMSSE and finite-decile CRPS-9 separately. Intermittency and sparsity filters use only the 84 days before testing. Recorded zeros and stockout sales remain observations. The Original FreshRetailNet-LT protocol is available through the footer.

The study is in progress. Only complete, checked participant/task results receive scores; pending methods remain unranked. The visible snapshot time identifies the current exported measurements. Each method shows its recorded inputs, point interpretation, pretraining and licence metadata. Missing licence metadata is marked as not recorded; incomplete pretraining disclosures remain unverified.

## Run the website

Requires Node 22.12+ (or a compatible later release).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Open the repository prefix `/freshretailnet-intermittent-benchmark/` on the displayed local URL.

## Update results

After the local evaluator has validated a complete result, refresh the exported intermittent JSON, score CSV, protocol, paper, `public/downloads/foundation-admission.json` and referenced figures in `public/`. Keep the downloadable admission entries matched to the JSON snapshot's embedded `foundation_admission` records. Preserve the original-record snapshot and existing result receipts. Run `npm run build`, commit the updated public artifacts, then push to `main`. GitHub Actions builds and deploys the site automatically. The workflow can also be dispatched manually.

```sh
git add public
git commit -m "Update verified benchmark results"
git push origin HEAD:main
```

This repository contains the website, public protocols and score artifacts. The ongoing experiment workspace, raw forecasts, data caches and pretrained weights are not bundled in this website repository. Native experiment packaging remains in progress; the site is a study snapshot, not a claim that the complete model campaign has finished.

## Data and attribution

FreshRetailNet-LT is provided by Dingdong Inc. under CC BY 4.0. See the [dataset and its pinned source](https://huggingface.co/datasets/Dingdong-Inc/FreshRetailNet-LT/tree/8a9543bee53de0e2edc90881c2bbd2bfb711cc51) and the [original leaderboard](https://huggingface.co/spaces/Dingdong-Inc/FreshRetailNet-LT-Leaderboard).

Website code is Apache-2.0; data attribution and model-specific code/weight conditions remain separate. Model weights are not redistributed. Public targets and incomplete pretraining disclosures limit claims about training overlap.

Contact: [abisheksriramulu95@gmail.com](mailto:abisheksriramulu95@gmail.com).
