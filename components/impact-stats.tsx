"use client";
import {useEffect,useRef,useState} from 'react';
import {HeartHandshake,Droplets,Wheat,HandHeart} from 'lucide-react';
import type {ImpactStat,Locale} from '@/lib/domain';
function Counter({item,locale,index}:{item:ImpactStat;locale:Locale;index:number}){
 const ref=useRef<HTMLDivElement>(null),[number,setNumber]=useState(item.value);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
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
 const Icon=[HeartHandshake,Droplets,Wheat,HandHeart][index%4];
 const label=locale==='en'?(item.labelEn||item.label):locale==='ar'?(item.labelAr||item.label):item.label;
 const format=(n:number)=>new Intl.NumberFormat(locale).format(n)+item.suffix;
 return <div ref={ref} className="impact-item"><Icon aria-hidden="true"/><strong aria-label={format(item.value)}><span aria-hidden="true">{format(number)}</span></strong><p>{label}</p></div>;
}
export function ImpactStats({items=[],locale}:{items?:ImpactStat[];locale:Locale}){
 if(!items.length)return null;
 const t=(fr:string,en:string,ar:string)=>locale==='en'?en:locale==='ar'?ar:fr;
 return <section className="impact-section section" aria-labelledby="impact-title"><div className="impact-heading"><p className="eyebrow">{t('LA SOLIDARITÉ EN ACTION','SOLIDARITY IN ACTION','التضامن في العمل')}</p><h2 id="impact-title">{t('Ensemble, nous avançons.','Together, we move forward.','معاً نتقدم.')}</h2></div><div className="impact-grid">{items.map((item,i)=><Counter key={i} item={item} locale={locale} index={i}/>)}</div></section>;
}

