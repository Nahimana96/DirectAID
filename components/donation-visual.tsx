"use client";
import {useEffect,useState} from 'react';
import type {Cause,Locale} from '@/lib/domain';

const visualCopy:Record<Cause,[string,string,string]>={
 orphelins:['Grandir avec du soutien.','Growing with support.','النمو بدعمكم.'],
 puits:['Rapprocher l’eau des familles.','Bringing water closer to families.','تقريب المياه من العائلات.'],
 colis:['Un colis, un geste concret.','A food parcel, a tangible act.','طرد غذائي، وعمل ملموس.'],
 sacrifices:['Partager avec les familles.','Sharing with families.','المشاركة مع العائلات.'],
};

export function DonationVisual({cause='orphelins',locale='fr'}:{cause?:Cause;locale?:Locale}){
 const t=(fr:string,en:string,ar:string)=>locale==='en'?en:locale==='ar'?ar:fr;
 return <div className="donation-visual donation-story" aria-label={t('Nos actions au Burundi','Our work in Burundi','أعمالنا في بوروندي')}>
  <img className="visual-main" src={'/action-'+cause+'.webp'} alt={t('Action solidaire de Direct Aid au Burundi','Direct Aid community work in Burundi','عمل ديركت إيد الإنساني في بوروندي')}/>
  <div className="donation-story-copy"><span>{t('ENSEMBLE, AU BURUNDI','TOGETHER, IN BURUNDI','معاً في بوروندي')}</span><strong>{t(...visualCopy[cause])}</strong><p>{t('Votre contribution soutient les actions menées sur le terrain.','Your gift supports work on the ground.','تدعم مساهمتك الأعمال على أرض الواقع.')}</p></div>
 </div>;
}

export function GeneralDonationVisual({locale}:{locale:Locale}){
 const [cause,setCause]=useState<Cause>('orphelins');
 useEffect(()=>{
  const selected=new URLSearchParams(location.search).get('cause');
  if(selected&&selected in visualCopy)setCause(selected as Cause);
  const update=(event:Event)=>{const next=(event as CustomEvent<Cause>).detail;if(next in visualCopy)setCause(next);};
  window.addEventListener('directaid:donation-cause',update);
  return()=>window.removeEventListener('directaid:donation-cause',update);
 },[]);
 return <DonationVisual cause={cause} locale={locale}/>;
}
