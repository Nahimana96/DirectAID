"use client";
import type {ImpactStat} from '@/lib/domain';
import {fixedImpactMetrics} from '@/lib/impact-metrics';

export function ImpactEditor({items,onChange}:{items:ImpactStat[];onChange:(items:ImpactStat[])=>void}){
 const metrics=fixedImpactMetrics(items);
 return <section className="admin-panel settings-section impact-editor">
  <h2>Les chiffres de notre impact</h2>
  <p>Ces trois chiffres apparaissent sur l’accueil, avant « La confiance », et s’animent à l’écran. Laissez un champ vide tant que sa valeur n’est pas vérifiée.</p>
  <div className="impact-editor-grid">{metrics.map((metric,index)=><label className="field" key={metric.label}>
   <span>{metric.label}{index===2?' (€)':''}</span>
   <input type="number" min="1" max="1000000000" step="1" inputMode="numeric" value={metric.value||''} placeholder="À renseigner" onChange={event=>onChange(metrics.map((item,i)=>i===index?{...item,value:event.target.value?Number(event.target.value):0}:item))}/>
  </label>)}</div>
  <p className="fineprint">Les champs vides s’affichent avec un tiret. Enregistrez les réglages pour publier les valeurs.</p>
 </section>;
}
