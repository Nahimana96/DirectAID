"use client";

import {useEffect,useState} from 'react';

export function PageLoadingScreen(){
 const [phase,setPhase]=useState<'visible'|'leaving'|'hidden'>('visible');
 const [locale,setLocale]=useState('fr');
 useEffect(()=>{
  const lang=new URLSearchParams(location.search).get('lang');setLocale(lang==='en'||lang==='ar'?lang:'fr');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const content=document.getElementById('admin-login-content');
  const started=performance.now();
  let delay:ReturnType<typeof setTimeout>,finish:ReturnType<typeof setTimeout>;
  let ending=false;
  setPhase('visible');if(content)content.inert=true;
  function reveal(){
   if(ending)return;ending=true;
   delay=setTimeout(()=>{
    if(content)content.inert=false;
    setPhase(reduced?'hidden':'leaving');
    if(!reduced)finish=setTimeout(()=>setPhase('hidden'),450);
   },Math.max(0,(reduced?0:850)-(performance.now()-started)));
  }
  if(document.readyState==='complete')reveal();else window.addEventListener('load',reveal,{once:true});
  const fallback=setTimeout(reveal,3000);
  return()=>{clearTimeout(delay);clearTimeout(finish);clearTimeout(fallback);window.removeEventListener('load',reveal);if(content)content.inert=false;};
 },[]);
 if(phase==='hidden')return null;
 const title=locale==='en'?'Together, in Burundi.':locale==='ar'?'معاً، في بوروندي.':'Ensemble, au Burundi.';
 const loading=locale==='en'?'Loading your page…':locale==='ar'?'جارٍ تحميل الصفحة…':'Chargement de votre page…';
 return <div className="page-loading-screen" data-phase={phase} role="status" aria-live="polite" dir={locale==='ar'?'rtl':'ltr'}>
  <div className="page-loading-glow" aria-hidden="true"/>
  <div className="page-loading-content">
   <div className="page-loading-emblem"><span className="page-loading-orbit orbit-one" aria-hidden="true"/><span className="page-loading-orbit orbit-two" aria-hidden="true"/><img src="/logo-directaid.jpeg" alt="Direct Aid Burundi" width={100} height={100}/></div>
   <p className="page-loading-brand">DIRECT AID <span>BURUNDI</span></p>
   <p className="page-loading-title">{title}</p>
   <div className="page-loading-line" aria-hidden="true"><span/></div>
   <p className="page-loading-caption">{loading}</p>
  </div>
 </div>;
}
