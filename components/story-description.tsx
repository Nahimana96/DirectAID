"use client";

import {useId,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import type {Locale} from '@/lib/domain';

export function StoryDescription({description,locale}:{description:string;locale:Locale}) {
 const [expanded,setExpanded]=useState(false);
 const id=useId();
 if(!description)return null;
 const label=locale==='en'?(expanded?'Hide description':'Show description'):locale==='ar'?(expanded?'إخفاء الوصف':'عرض الوصف'):(expanded?'Masquer la description':'Afficher la description');
 return <div className="story-description">
  <button type="button" className="story-description-toggle" aria-label={label} aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(!expanded)}><ChevronDown size={22} aria-hidden="true"/></button>
  <div id={id} className="story-description-panel" data-expanded={expanded} aria-hidden={!expanded} inert={!expanded}><div><p className="preserve-lines">{description}</p></div></div>
 </div>;
}
