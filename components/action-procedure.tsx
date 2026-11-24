"use client";

import {useEffect, useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, Pause, Play} from 'lucide-react';
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from './ui/carousel';
import type {Locale} from '@/lib/domain';

const qurbanSteps = [
  {
    image: '/qurban-preparation.webp',
    fr: ['La préparation.', 'Notre équipe au Burundi organise votre Qurban et prépare les animaux pour le sacrifice.', 'Préparation des animaux pour le Qurban au Burundi'],
    en: ['The preparation.', 'Our team in Burundi organises your Qurban and prepares the animals for the sacrifice.', 'Preparing the animals for Qurban in Burundi'],
    ar: ['التحضير.', 'ينظّم فريقنا في بوروندي أضحيتكم ويجهّز الحيوانات استعداداً للذبح.', 'تجهيز الحيوانات للأضاحي في بوروندي'],
  },
  {
    image: '/qurban-decoupe.webp',
    fr: ['Le sacrifice et la découpe.', 'Sur place, les équipes réalisent le sacrifice puis préparent la viande pour sa mise en portions.', 'Préparation et découpe de la viande de Qurban'],
    en: ['The sacrifice and preparation.', 'The teams carry out the sacrifice on site, then prepare the meat for portioning.', 'Preparing and cutting the Qurban meat'],
    ar: ['الذبح وتجهيز اللحوم.', 'تتولى الفرق في الميدان ذبح الأضاحي ثم تجهيز اللحوم لتقسيمها إلى حصص.', 'تجهيز لحوم الأضاحي وتقطيعها'],
  },
  {
    image: '/qurban-colis.webp',
    fr: ['Des colis pour les familles.', 'La viande est répartie en colis destinés aux familles dans le besoin. Votre geste devient un repas partagé.', 'Colis de viande de Qurban préparés pour les familles'],
    en: ['Parcels for families.', 'The meat is packed into parcels for families in need. Your gift becomes a shared meal.', 'Qurban meat parcels prepared for families'],
    ar: ['طرود للأسر.', 'تُقسّم اللحوم إلى طرود مخصّصة للأسر المحتاجة، فيتحوّل عطاؤكم إلى وجبة يتقاسمونها.', 'طرود لحوم الأضاحي المجهّزة للأسر'],
  },
];

const aidSteps = [
  {
    image: '/aid-food.webp',
    fr: ['Des denrées essentielles.', 'Vos dons soutiennent les distributions de nourriture aux familles au Burundi : un geste concret pour leur quotidien.', 'Denrées alimentaires préparées pour les distributions au Burundi'],
    en: ['Essential food supplies.', 'Your donations support food distributions to families in Burundi: practical help with everyday needs.', 'Food supplies prepared for distributions in Burundi'],
    ar: ['مواد غذائية أساسية.', 'تدعم تبرعاتكم توزيع المواد الغذائية على الأسر في بوروندي، لتلبية احتياجاتها اليومية.', 'مواد غذائية مجهزة للتوزيع في بوروندي'],
  },
  {
    image: '/aid-uniforms.webp',
    fr: ['Des chaussures et des uniformes.', 'L’aide matérielle accompagne aussi les enfants à l’école, avec des chaussures et des uniformes adaptés à leurs besoins.', 'Chaussures et uniformes scolaires préparés pour les enfants'],
    en: ['Shoes and school uniforms.', 'Material aid also supports children at school, with shoes and uniforms to meet their needs.', 'Shoes and school uniforms prepared for children'],
    ar: ['أحذية وزي مدرسي.', 'ترافق المساعدات العينية الأطفال في دراستهم، بتوفير الأحذية والزي المدرسي لتلبية احتياجاتهم.', 'أحذية وزي مدرسي مجهز للأطفال'],
  },
  {
    image: '/aid-clothing.webp',
    fr: ['Des vêtements pour les enfants.', 'Les distributions de vêtements apportent un soutien concret aux enfants et à leurs familles. Ensemble, partageons l’essentiel.', 'Enfants recevant des vêtements lors d’une distribution'],
    en: ['Clothing for children.', 'Clothing distributions provide practical support for children and their families. Together, let’s share the essentials.', 'Children receiving clothing during a distribution'],
    ar: ['ملابس للأطفال.', 'يوفر توزيع الملابس دعماً ملموساً للأطفال وأسرهم. معاً نتقاسم الاحتياجات الأساسية.', 'أطفال يتلقون ملابس خلال عملية توزيع'],
  },
];

export function ActionProcedure({locale, cause}: {locale: Locale; cause: 'colis' | 'sacrifices'}) {
  const aid = cause === 'colis';
  const steps = aid ? aidSteps : qurbanSteps;
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(true);
  const t = (fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;
  const options = useMemo(() => ({loop: true, direction: locale === 'ar' ? 'rtl' as const : 'ltr' as const, duration: reduced ? 0 : 35}), [locale, reduced]);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {setReduced(query.matches); setPlaying(!query.matches);};
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update(); api.on('select', update); api.on('reInit', update);
    return () => {api.off('select', update); api.off('reInit', update);};
  }, [api]);

  useEffect(() => {
    if (!api || !playing) return;
    const timer = setInterval(() => {if (!document.hidden) api.scrollNext();}, 6500);
    return () => clearInterval(timer);
  }, [api, playing]);

  const [title, description] = steps[selected][locale];
  return <aside className={'qurban-procedure' + (aid ? ' aid-procedure' : '')} aria-label={aid ? t('Notre aide alimentaire et matérielle', 'Our food and material aid', 'مساعداتنا الغذائية والعينية') : t('Votre Qurban, étape par étape', 'Your Qurban, step by step', 'أضحيتكم خطوة بخطوة')}>
    <Carousel opts={options} setApi={setApi} className="qurban-carousel" aria-label={t('Notre procédure en trois images', 'Our process in three images', 'خطوات عملنا في ثلاث صور')}>
      <CarouselContent className="qurban-track">{steps.map((step, index) => <CarouselItem className={'qurban-slide qurban-slide-' + index} key={step.image} aria-hidden={index !== selected}>
        <img src={step.image} alt={step[locale][2]} loading={index === 0 ? 'eager' : 'lazy'}/>
      </CarouselItem>)}</CarouselContent>
    </Carousel>
    <div className="qurban-shade"/>
    <div className="qurban-procedure-copy">
      <span className="qurban-kicker">{aid ? t('PARTAGER L’ESSENTIEL', 'SHARING THE ESSENTIALS', 'نتقاسم الأساسيات') : t('VOTRE QURBAN, SUR LE TERRAIN', 'YOUR QURBAN, ON THE GROUND', 'أضحيتكم على أرض الواقع')}</span>
      <div className="qurban-caption" key={selected} aria-live={playing ? 'off' : 'polite'}><span className="qurban-step-label">{aid ? t('Nos actions', 'Our work', 'أعمالنا') : t('Étape', 'Step', 'الخطوة')} {String(selected + 1).padStart(2, '0')} / 03</span><h2>{title}</h2><p>{description}</p></div>
      <div className="qurban-controls">
        <div className="qurban-dots" aria-label={t('Choisir une étape', 'Choose a step', 'اختر خطوة')}>{steps.map((step, index) => <button type="button" key={step.image} aria-label={step[locale][0]} aria-pressed={index === selected} onClick={() => api?.scrollTo(index)}><span/></button>)}</div>
        <div className="qurban-control-actions">
          <button type="button" aria-label={t('Étape précédente', 'Previous step', 'الخطوة السابقة')} onClick={() => api?.scrollPrev()}><ChevronLeft size={19}/></button>
          <button type="button" aria-label={t('Étape suivante', 'Next step', 'الخطوة التالية')} onClick={() => api?.scrollNext()}><ChevronRight size={19}/></button>
          <button type="button" aria-label={playing ? t('Mettre en pause', 'Pause slideshow', 'إيقاف العرض') : t('Lancer le diaporama', 'Play slideshow', 'تشغيل العرض')} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button>
        </div>
      </div>
    </div>
  </aside>;
}
