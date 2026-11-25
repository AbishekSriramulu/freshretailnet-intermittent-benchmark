export type ModelProvenanceRecord={pretraining?:string;weights_license?:string};

export default function ModelProvenance({run}:{run:ModelProvenanceRecord}){
 return <small className="exposure">Pretraining: {run.pretraining||'not declared'}<br/>Weights: {run.weights_license||'see result receipt'}</small>;
}
