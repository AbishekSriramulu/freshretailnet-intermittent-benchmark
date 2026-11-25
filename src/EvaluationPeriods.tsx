export default function EvaluationPeriods({original=false}:{original?:boolean}){
 return <div className="caption" aria-label="Training, validation and test periods">
  <p><b>Training data:</b> Permitted history through {original?'13 July 2025':'25 May 2025'} at the first forecast origin; each method uses its declared history length. Later origins may use earlier test observations once available. Recovery fitting uses history before its reconstruction block.</p>
  <p><b>Validation:</b> Not used with these fixed recipes; no hyperparameter search.</p>
  <p><b>Test period:</b> {original?'14–20 July 2025 (Original protocol)':'26 May–20 July 2025 (Recent)'}. Only completed test-set scores appear in the leaderboard.</p>
 </div>;
}
