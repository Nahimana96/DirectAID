"use client";

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ActionCarousel } from './action-carousel';
import { Button } from './ui/button';

const campaigns = [
  {
    cause: 'orphelins',
    fr: ['ACCOMPAGNER LES ENFANTS', 'Grandir, entourés.', 'Un avenir à bâtir.', 'Repas, éducation et soins : ensemble, soutenons les besoins des enfants au Burundi.', 'Soutenir les orphelins'],
    en: ['SUPPORTING CHILDREN', 'Growing up, supported.', 'A future to build.', 'Meals, education and care: together, support children’s needs in Burundi.', 'Support orphans'],
    ar: ['إلى جانب الأطفال', 'يكبرون برعايتنا.', 'ونبني مستقبلهم.', 'الغذاء والتعليم والرعاية: معاً ندعم احتياجات الأطفال في بوروندي.', 'دعم الأيتام'],
  },
  {
    cause: 'puits',
    fr: ['RENDRE L’EAU ACCESSIBLE', 'Un puits.', 'Une vie meilleure.', 'Une eau plus proche, un quotidien transformé. Participez à la construction de puits pour les communautés au Burundi.', 'Découvrir les projets de puits'],
    en: ['MAKING WATER ACCESSIBLE', 'A well.', 'A better life.', 'Water closer to home changes everyday life. Help build wells for communities in Burundi.', 'Explore our well projects'],
    ar: ['لنقرّب الماء من الجميع', 'بئر ماء.', 'وحياة أفضل.', 'ماء أقرب يغيّر الحياة اليومية. ساهموا في بناء الآبار للمجتمعات في بوروندي.', 'اكتشف مشاريع الآبار'],
  },
  {
    cause: 'colis',
    fr: ['PARTAGER L’ESSENTIEL', 'Un colis.', 'Des repas à partager.', 'Riz, farine, huile… Un colis alimentaire apporte un soutien concret aux familles qui en ont besoin.', 'Offrir un colis alimentaire'],
    en: ['SHARING THE ESSENTIALS', 'A food parcel.', 'Meals to share.', 'Rice, flour, oil… A food parcel provides practical support for families who need it.', 'Give a food parcel'],
    ar: ['نتقاسم الأساسيات', 'طرد غذائي.', 'ووجبات نتقاسمها.', 'أرز ودقيق وزيت… طرد غذائي يقدّم دعماً ملموساً للأسر المحتاجة.', 'قدّم طرداً غذائياً'],
  },
  {
    cause: 'sacrifices',
    fr: ['UN GESTE DE GÉNÉROSITÉ', 'Votre sacrifice.', 'Un repas partagé.', 'Faites de votre sacrifice un geste de solidarité et contribuez à la distribution de viande aux familles au Burundi.', 'Découvrir les sacrifices'],
    en: ['AN ACT OF GENEROSITY', 'Your sacrifice.', 'A shared meal.', 'Turn your sacrifice into an act of solidarity and help distribute meat to families in Burundi.', 'Explore sacrifices'],
    ar: ['عطاء يجمعنا', 'أضحيتكم.', 'وجبة نتقاسمها.', 'اجعلوا أضحيتكم عملاً تضامنياً وساهموا في توزيع اللحوم على الأسر في بوروندي.', 'اكتشف الأضاحي'],
  },
];

export function CampaignHero({ locale, images }: { locale: 'fr' | 'en' | 'ar'; images: string[] }) {
  const [selected, setSelected] = useState(0);
  const [copyFocused, setCopyFocused] = useState(false);

  return <section className="hero home-hero campaign-hero">
    <div className="hero-copy campaign-copy"
      onFocusCapture={() => setCopyFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setCopyFocused(false); }}>
      {campaigns.map((campaign, index) => {
        const [eyebrow, title, emphasis, description, button] = campaign[locale];
        const active = selected === index;
        return <div key={campaign.cause} className={`campaign-message${active ? ' is-active' : ''}`}
          aria-hidden={!active} inert={!active}>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}<br /><em>{emphasis}</em></h1>
          <p className="lead">{description}</p>
          <div className="hero-buttons">
            <Button asChild className="button yellow">
              <a href={`/actions/${campaign.cause}?lang=${locale}`} tabIndex={active ? 0 : -1}>
                {button}<ArrowUpRight size={19} aria-hidden="true" />
              </a>
            </Button>
            <a className="text-link" href="#actions" tabIndex={active ? 0 : -1}>
              {locale === 'fr' ? 'Toutes nos actions' : locale === 'en' ? 'All our causes' : 'جميع أعمالنا'}
            </a>
          </div>
        </div>;
      })}
    </div>
    <ActionCarousel locale={locale} images={images} immersive onSlideChange={setSelected} copyFocused={copyFocused} />
  </section>;
}
