"use client";
import {useEffect,useRef,useState} from 'react';
import {CalendarDays,Euro,UsersRound} from 'lucide-react';
import type {ImpactStat,Locale} from '@/lib/domain';
import {fixedImpactMetrics} from '@/lib/impact-metrics';

function Counter({item,locale,index}:{item:ImpactStat;locale:Locale;index:number}){
 const ref=useRef<HTMLDivElement>(null),[number,setNumber]=useState(item.value);
 useEffect(()=>{
  const node=ref.current;if(!node||!item.value)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches)return;
  let frame=0;setNumber(0);
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();const start=performance.now();
   const tick=(now:number)=>{const p=Math.min(1,(now-start)/1400);setNumber(Math.round(item.value*(1-Math.pow(1-p,3))));if(p<1)frame=requestAnimationFrame(tick);};
   frame=requestAnimationFrame(tick);
  },{threshold:.25});
  observer.observe(node);
  const onChange=()=>{if(reduced.matches){observer.disconnect();cancelAnimationFrame(frame);setNumber(item.value);}};
  reduced.addEventListener('change',onChange);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);reduced.removeEventListener('change',onChange);};
 },[item.value]);
 const Icon=[UsersRound,CalendarDays,Euro][index];
 const label=locale==='en'?item.labelEn:locale==='ar'?item.labelAr:item.label;
 const format=(n:number)=>new Intl.NumberFormat(locale).format(n)+item.suffix;
 return <div ref={ref} className="impact-item"><Icon aria-hidden="true"/><strong aria-label={item.value?format(item.value):'À renseigner'}><span aria-hidden="true">{item.value?format(number):'—'}</span></strong><p>{label}</p></div>;
}

export function ImpactStats({items=[],locale}:{items?:ImpactStat[];locale:Locale}){
 const t=(fr:string,en:string,ar:string)=>locale==='en'?en:locale==='ar'?ar:fr;
 return <section className="impact-section section" aria-labelledby="impact-title"><div className="impact-heading"><p className="eyebrow">{t('NOS CHIFFRES','OUR IMPACT','أرقامنا')}</p><h2 id="impact-title">{t('Notre impact en chiffres','Our impact in numbers','أثرنا بالأرقام')}</h2></div><div className="impact-grid">{fixedImpactMetrics(items).map((item,i)=><Counter key={i} item={item} locale={locale} index={i}/>)}</div></section>;
}
