"use client";

import {useEffect, useMemo, useState} from 'react';
import {X, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play} from 'lucide-react';
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from './ui/carousel';
import {Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose} from './ui/dialog';
import type {Locale} from '@/lib/domain';

export function StoryModal({title, description, image, images, locale}: {title: string; description: string; image: string; images?: string[]; locale: Locale}) {
 const [open, setOpen] = useState(false);
 const [api, setApi] = useState<CarouselApi>();
 const [selected, setSelected] = useState(0);
 const [playing, setPlaying] = useState(false);
 const [reduced, setReduced] = useState(true);
 const gallery = images?.length ? images : [image];
 const multiple = gallery.length > 1;
 const carouselOptions = useMemo(() => ({loop: multiple, direction: locale === 'ar' ? 'rtl' as const : 'ltr' as const, duration: reduced ? 0 : 35}), [multiple, locale, reduced]);
 const t = (fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;

 useEffect(() => {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => setReduced(query.matches);
  motion();
  query.addEventListener('change', motion);
  return () => query.removeEventListener('change', motion);
 }, []);

 useEffect(() => {
  if (!api) return;
  const changed = () => setSelected(api.selectedScrollSnap());
  changed();
  api.on('select', changed);
  api.on('reInit', changed);
  return () => {api.off('select', changed); api.off('reInit', changed);};
 }, [api]);

 useEffect(() => {
  if (open && api && api.selectedScrollSnap() !== selected) api.scrollTo(selected, reduced);
 }, [open, api, selected, reduced]);

 useEffect(() => {
  if (!open || !multiple || !playing) return;
  const timer = setInterval(() => setSelected(index => (index + 1) % gallery.length), 6500);
  return () => clearInterval(timer);
 }, [open, multiple, playing, gallery.length]);

 const move = (direction: -1 | 1) => {
  setSelected(index => (index + direction + gallery.length) % gallery.length);
 };

 return <Dialog open={open} onOpenChange={value => {setOpen(value); if (value) {setSelected(0); setPlaying(true);}}}>
  <DialogTrigger asChild><button type="button" className="story-modal-trigger">{t('Voir les détails', 'View details', 'عرض التفاصيل')}<ArrowUpRight size={18} aria-hidden="true"/></button></DialogTrigger>
  <DialogContent className="story-modal" showCloseButton={false} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
   <div className="story-modal-media">
    <Carousel opts={carouselOptions} setApi={setApi} className="story-modal-carousel" aria-label={t('Photos de la réalisation', 'Achievement photos', 'صور الإنجاز')}>
     <CarouselContent className="story-modal-track">{gallery.map((src, index) => <CarouselItem key={src + '-' + index} className="story-modal-slide" aria-label={(index + 1) + ' / ' + gallery.length} aria-hidden={selected !== index}>
      <img className="story-modal-image" src={src} alt={title + ' — ' + (index + 1) + '/' + gallery.length} loading={index === selected || index === (selected + 1) % gallery.length || index === (selected - 1 + gallery.length) % gallery.length ? 'eager' : 'lazy'}/>
      <div className="story-modal-shade"/>
     </CarouselItem>)}</CarouselContent>
    </Carousel>
    {multiple && <div className="story-modal-controls">
     <div className="story-modal-dots" role="group" aria-label={t('Choisir une photo', 'Choose a photo', 'اختر صورة')}>{gallery.map((_, index) => <button type="button" key={index} className={'story-modal-dot' + (selected === index ? ' active' : '')} aria-label={t('Afficher la photo', 'Show photograph', 'عرض الصورة') + ' ' + (index + 1)} aria-pressed={selected === index} onClick={() => setSelected(index)}><span/></button>)}</div>
     <span className="story-modal-count" aria-live={playing ? 'off' : 'polite'}>{String(selected + 1).padStart(2, '0')} <span>/ {String(gallery.length).padStart(2, '0')}</span></span>
     <div className="story-modal-actions">
      <button type="button" className="story-modal-control" aria-label={t('Image précédente', 'Previous image', 'الصورة السابقة')} onClick={() => move(-1)}><ChevronLeft size={20} aria-hidden="true"/></button>
      <button type="button" className="story-modal-control" aria-label={t('Image suivante', 'Next image', 'الصورة التالية')} onClick={() => move(1)}><ChevronRight size={20} aria-hidden="true"/></button>
      <button type="button" className="story-modal-control story-modal-play" aria-label={playing ? t('Mettre le diaporama en pause', 'Pause slideshow', 'إيقاف العرض') : t('Lancer le diaporama', 'Play slideshow', 'تشغيل العرض')} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18} aria-hidden="true"/> : <Play size={18} aria-hidden="true"/>}</button>
     </div>
    </div>}
   </div>
   <div className="story-modal-body"><DialogTitle>{title}</DialogTitle><DialogDescription className="preserve-lines">{description}</DialogDescription></div>
   <DialogClose className="story-modal-close" aria-label={t('Fermer', 'Close', 'إغلاق')}><X size={22} aria-hidden="true"/></DialogClose>
  </DialogContent>
 </Dialog>;
}
