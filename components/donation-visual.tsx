import {HeartHandshake,ShieldCheck} from 'lucide-react';
import type {Cause,Locale} from '@/lib/domain';
export function DonationVisual({cause='orphelins',locale='fr'}:{cause?:Cause;locale?:Locale}){
const t=(fr:string,en:string,ar:string)=>locale==='en'?en:locale==='ar'?ar:fr;
return <div className="donation-visual" aria-label={t('Nos actions au Burundi','Our work in Burundi','أعمالنا في بوروندي')}>
<img className="visual-main" src={'/action-'+cause+'.webp'} alt={t('Une action de solidarité au Burundi','Solidarity in Burundi','التضامن في بوروندي')}/>
<img className="visual-small" src={'/action-'+(cause==='colis'?'puits':'colis')+'.webp'} alt="" />
<img className="visual-small" src={'/action-'+(cause==='orphelins'?'puits':'orphelins')+'.webp'} alt="" />
<span className="visual-stamp"><HeartHandshake size={18}/>{t('Ensemble, au Burundi','Together, in Burundi','معاً في بوروندي')}</span>
<span className="visual-seal" aria-hidden="true"><ShieldCheck size={25}/></span>
</div>;
}

