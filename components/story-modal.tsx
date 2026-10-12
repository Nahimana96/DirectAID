"use client";

import {X,ArrowUpRight} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';
import type {Locale} from '@/lib/domain';

export function StoryModal({title,description,image,locale}:{title:string;description:string;image:string;locale:Locale}) {
 const label=locale==='en'?'View details':locale==='ar'?'عرض التفاصيل':'Voir les détails';
 const close=locale==='en'?'Close':locale==='ar'?'إغلاق':'Fermer';
 return <Dialog>
  <DialogTrigger asChild><button type="button" className="story-modal-trigger">{label}<ArrowUpRight size={18} aria-hidden="true"/></button></DialogTrigger>
  <DialogContent className="story-modal" showCloseButton={false} dir={locale==='ar'?'rtl':'ltr'} lang={locale}>
   <img className="story-modal-image" src={image} alt={title}/>
   <div className="story-modal-body"><DialogTitle>{title}</DialogTitle><DialogDescription className="preserve-lines">{description}</DialogDescription></div>
   <DialogClose className="story-modal-close" aria-label={close}><X size={22} aria-hidden="true"/></DialogClose>
  </DialogContent>
 </Dialog>;
}
