"use client";

import { ArrowDown, ArrowRight, Camera, Droplets, HeartHandshake, MapPin } from 'lucide-react';
import { CardsSkeleton } from './cards-skeleton';
import { StoryModal } from './story-modal';
import { Progress } from '@/components/ui/progress';
import { money, type Locale, type Project } from '@/lib/domain';

const translate = (locale: Locale, fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;

function latestUpdate(project: Project): { date: string; text: string } | null {
  try {
    const updates: unknown = JSON.parse(project.updates || '[]');
    if (!Array.isArray(updates)) return null;
    const last = updates.at(-1);
    return last && typeof last.date === 'string' && typeof last.text === 'string' ? last : null;
  } catch {
    return null;
  }
}

export function WaterAction({ projects, locale, loading, loadError }: {
  projects: Project[];
  locale: Locale;
  loading: boolean;
  loadError: boolean;
}) {
  const t = (fr: string, en: string, ar: string) => translate(locale, fr, en, ar);

  return <div className="water-page">
    <section className="water-hero" aria-labelledby="water-title">
      <div className="water-hero-image" role="img" aria-label={t('Une famille autour d’un puits au Burundi', 'A family at a well in Burundi', 'عائلة حول بئر في بوروندي')} />
      <div className="water-hero-content">
        <span className="water-kicker"><Droplets size={18} aria-hidden="true" />{t('LES PUITS D’EAU · BURUNDI', 'WATER WELLS · BURUNDI', 'آبار المياه · بوروندي')}</span>
        <h1 id="water-title">{t('L’eau plus proche.','Water within reach.','الماء أقرب.') }<br /><em>{t('La vie plus légère.','Life a little easier.','والحياة أيسر.')}</em></h1>
        <p>{t('Participez à un puits identifié et suivez, étape après étape, les fonds reçus et les travaux menés sur le terrain.', 'Support an identified well and follow the funds received and work on the ground, step by step.', 'ساهم في بئر محدد وتابع الأموال المستلمة والأعمال المنجزة على الأرض خطوة بخطوة.')}</p>
        <div className="water-hero-actions">
          <a className="water-button water-button-yellow" href="#puits-projets">{t('Voir les puits à soutenir', 'Explore wells to support', 'اكتشف الآبار لدعمها')} <ArrowRight size={18} aria-hidden="true" /></a>
          <a className="water-button water-button-outline" href="#puits-impact">{t('Comprendre l’action', 'How it works', 'تعرف على العمل')} <ArrowDown size={18} aria-hidden="true" /></a>
        </div>
      </div>
      <span className="water-hero-caption">{t('Ensemble, au Burundi', 'Together in Burundi', 'معاً في بوروندي')}</span>
    </section>

    <section className="water-intro water-container" id="puits-impact" aria-labelledby="water-intro-title">
      <p className="eyebrow">{t('UN GESTE, UN IMPACT DURABLE', 'ONE GIFT, LASTING IMPACT', 'عطاء ذو أثر مستدام')}</p>
      <h2 id="water-intro-title">{t('Un puits peut changer','A well can change','يمكن للبئر أن يغير')}<br /><em>{t('le quotidien d’un village.', 'daily life in a village.', 'الحياة اليومية في قرية.')}</em></h2>
      <p className="water-intro-lead">{t('Quand l’eau se rapproche des habitations, les familles consacrent moins de temps à la chercher. Chaque contribution fait avancer un projet concret, avec un objectif et une progression visibles.', 'When water is closer to home, families spend less time collecting it. Every gift advances a concrete project with a visible goal and progress.', 'عندما يصبح الماء أقرب إلى المنازل، تقضي الأسر وقتاً أقل في جلبه. كل مساهمة تدعم مشروعاً محدداً بهدف وتقدم واضحين.')}</p>
      <div className="water-benefits">
        <article><span><Droplets aria-hidden="true" /></span><h3>{t('Une eau plus proche', 'Water closer to home', 'ماء أقرب')}</h3><p>{t('Un point d’eau au service des besoins quotidiens de la communauté.', 'A water point serving the community’s everyday needs.', 'مصدر ماء يخدم احتياجات المجتمع اليومية.')}</p></article>
        <article><span><HeartHandshake aria-hidden="true" /></span><h3>{t('Un effort partagé', 'A shared effort', 'جهد مشترك')}</h3><p>{t('Contribuez à la hauteur de vos moyens ou financez un puits entier.', 'Give what you can or fund an entire well.', 'ساهم بما تستطيع أو موّل بئراً كاملاً.')}</p></article>
        <article><span><Camera aria-hidden="true" /></span><h3>{t('Un projet suivi', 'A project you can follow', 'مشروع قابل للمتابعة')}</h3><p>{t('Consultez l’avancement des collectes. L’équipe peut transmettre des photos des travaux réalisés.', 'Follow fundraising progress. The team can share photos of completed work.', 'تابع تقدم جمع التبرعات، ويمكن للفريق مشاركة صور الأعمال المنجزة.')}</p></article>
      </div>
    </section>

    <section className="water-projects" id="puits-projets" aria-labelledby="water-projects-title">
      <div className="water-container">
        <div className="water-section-heading"><div><p className="eyebrow">{t('LES PROJETS À SOUTENIR', 'PROJECTS TO SUPPORT', 'مشاريع للدعم')}</p><h2 id="water-projects-title">{t('Choisissez un puits.','Choose a well.','اختر بئراً.')}<br /><em>{t('Faites avancer le projet.', 'Help it move forward.', 'وساهم في إنجازه.')}</em></h2></div><p>{t('Chaque carte montre le lieu, l’objectif et les fonds reçus. Choisissez le projet auquel vous souhaitez contribuer.', 'Each card shows the location, target and funds received. Choose the project you wish to support.', 'تعرض كل بطاقة الموقع والهدف والأموال المستلمة. اختر المشروع الذي تريد دعمه.')}</p></div>
        {loading ? <CardsSkeleton locale={locale} /> : loadError ? <div className="water-projects-empty" role="status">{t('Les projets sont momentanément indisponibles. Réessayez plus tard.', 'Projects are temporarily unavailable. Please try again later.', 'المشاريع غير متاحة مؤقتاً. حاول مرة أخرى لاحقاً.')}</div> : projects.length === 0 ? <div className="water-projects-empty"><Droplets size={36} aria-hidden="true" /><h3>{t('De nouveaux puits arrivent', 'New wells are on the way', 'آبار جديدة قريباً')}</h3><p>{t('Notre équipe publiera ici les prochains projets et leur avancement.', 'Our team will publish upcoming projects and their progress here.', 'سينشر فريقنا هنا المشاريع المقبلة وتقدمها.')}</p></div> : <div className="water-project-grid">{projects.map(project => {
          const title = locale === 'en' && project.title_en ? project.title_en : locale === 'ar' && project.title_ar ? project.title_ar : project.title;
          const description = locale === 'en' && project.description_en ? project.description_en : locale === 'ar' && project.description_ar ? project.description_ar : project.description;
          const percent = project.goal > 0 ? Math.min(100, Math.round(project.collected / project.goal * 100)) : 0;
          const funded = project.collected >= project.goal;
          const update = latestUpdate(project);
          return <article className="water-project-card" key={project.id}>
            <div className="water-project-photo"><img src={project.cover ? '/api/media/' + project.cover : '/action-puits.webp'} alt="" loading="lazy" /><span className="water-project-stage">{project.stage === 'completed' ? t('Terminé', 'Completed', 'مكتمل') : project.stage === 'working' ? t('En travaux', 'Under construction', 'قيد الإنشاء') : t('En préparation', 'Planned', 'قيد التحضير')}</span></div>
            <div className="water-project-content"><p className="water-project-location"><MapPin size={16} aria-hidden="true" />{project.location}</p><h3>{title}</h3><div className="water-project-funds"><strong>{money(project.collected, locale)}</strong><span>{t('collectés sur', 'raised of', 'جُمعت من')} {money(project.goal, locale)}</span></div><Progress value={percent} aria-label={t('Avancement de la collecte', 'Fundraising progress', 'تقدم جمع التبرعات')} /><p className="water-project-percent">{percent}% {t('financé', 'funded', 'مموّل')}</p>{update && <p className="water-project-update"><time>{update.date}</time> · {update.text}</p>}<div className="water-project-links"><StoryModal title={title} description={description} image={project.cover ? '/api/media/' + project.cover : '/action-puits.webp'} locale={locale} />{!funded && project.stage !== 'completed' ? <a className="water-button water-button-green" href={`/donner?cause=puits&project=${project.id}&lang=${locale}`}>{t('Participer', 'Contribute', 'ساهم')} <ArrowRight size={17} aria-hidden="true" /></a> : <span className="water-project-complete">{t('Objectif atteint', 'Goal reached', 'تحقق الهدف')}</span>}</div></div>
          </article>;
        })}</div>}
      </div>
    </section>

    <section className="water-faq water-container" aria-labelledby="water-faq-title"><p className="eyebrow">{t('QUESTIONS FRÉQUENTES', 'FREQUENTLY ASKED QUESTIONS', 'أسئلة شائعة')}</p><h2 id="water-faq-title">{t('Avant de participer', 'Before you give', 'قبل المساهمة')}</h2><div className="water-faq-list"><details><summary>{t('Puis-je financer seulement une partie d’un puits ?', 'Can I fund part of a well?', 'هل يمكنني تمويل جزء من البئر؟')}</summary><p>{t('Oui. Sélectionnez un projet puis choisissez une participation du montant qui vous convient dans le formulaire de don.', 'Yes. Select a project and choose the contribution amount that suits you in the donation form.', 'نعم. اختر مشروعاً ثم حدد المبلغ الذي يناسبك في نموذج التبرع.')}</p></details><details><summary>{t('Puis-je financer un puits entier ?', 'Can I fund an entire well?', 'هل يمكنني تمويل بئر كامل؟')}</summary><p>{t('Oui, si le projet n’a pas encore reçu de participation. Cette option apparaît dans le formulaire du puits concerné.', 'Yes, if the project has not yet received a contribution. This option appears in that well’s donation form.', 'نعم، إذا لم يتلق المشروع أي مساهمة بعد. يظهر هذا الخيار في نموذج التبرع الخاص بالبئر.')}</p></details><details><summary>{t('Comment puis-je suivre le projet ?', 'How can I follow the project?', 'كيف يمكنني متابعة المشروع؟')}</summary><p>{t('La carte du puits affiche les fonds reçus et son étape actuelle. Après la réalisation, l’équipe peut également envoyer des photos de preuve au donateur.', 'The well card shows funds received and its current stage. After completion, the team can also email proof photos to the donor.', 'تعرض بطاقة البئر الأموال المستلمة ومرحلة المشروع الحالية. وبعد الإنجاز، يمكن للفريق إرسال صور إثبات للمتبرع.')}</p></details></div></section>
  </div>;
}
