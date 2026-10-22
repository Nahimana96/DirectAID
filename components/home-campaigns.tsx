"use client";

import { HeartHandshake, Droplets, Wheat, HandHeart, ArrowUpRight } from 'lucide-react';
import { activeCampaigns, campaignDonationUrl } from '@/lib/campaigns';
import { textAt, type ContentEntry } from '@/lib/editorial-model';
import { money, type Locale } from '@/lib/domain';
import { CardsSkeleton } from './cards-skeleton';
import { StoryModal } from './story-modal';
import { Progress } from './ui/progress';

const causes = {
  orphelins: { icon: HeartHandshake, fr: 'Orphelins', en: 'Orphan support', ar: 'رعاية الأيتام' },
  puits: { icon: Droplets, fr: 'Eau potable', en: 'Clean water', ar: 'مياه الشرب' },
  colis: { icon: Wheat, fr: 'Aide alimentaire', en: 'Food support', ar: 'مساعدة غذائية' },
  sacrifices: { icon: HandHeart, fr: 'Sacrifices', en: 'Sacrifices', ar: 'الأضاحي' },
};

export function HomeCampaigns({ entries, locale, loading, loadError }: {
  entries: ContentEntry[]; locale: Locale; loading: boolean; loadError: boolean;
}) {
  const t = (fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;
  const campaigns = activeCampaigns(entries);
  return <section className="section home-campaigns" id="campagnes" aria-labelledby="home-campaigns-title">
    <header className="campaigns-heading">
      <p className="eyebrow">{t('ENSEMBLE, PASSONS À L’ACTION', 'TOGETHER, LET’S TAKE ACTION', 'معاً نحو العمل')}</p>
      <h2 id="home-campaigns-title">{t('Nos campagnes', 'Our campaigns', 'حملاتنا')}</h2>
      <p>{t('Des projets concrets, des vies à changer. Choisissez la campagne que vous souhaitez soutenir au Burundi.', 'Real projects, lives to change. Choose a campaign to support in Burundi.', 'مشاريع ملموسة وحياة تتغيّر. اختر الحملة التي ترغب في دعمها في بوروندي.')}</p>
    </header>
    {loading ? <CardsSkeleton locale={locale} variant="stories" /> : loadError ?
      <p className="campaigns-empty" role="status">{t('Les campagnes sont momentanément indisponibles. Veuillez réessayer.', 'Campaigns are temporarily unavailable. Please try again.', 'الحملات غير متاحة مؤقتاً. يرجى المحاولة مجدداً.')}</p> : campaigns.length ?
      <div className="home-campaign-grid">{campaigns.map(entry => {
        const cause = causes[entry.cause], Icon = cause.icon;
        const title = textAt(entry.title, locale), description = textAt(entry.description, locale);
        const image = entry.images[0] ? `/api/media/${entry.images[0]}` : `/action-${entry.cause}.webp`;
        return <article className="home-campaign-card" key={entry.id}>
          <img className="home-campaign-cover" src={image} alt={title} loading="lazy" />
          <div className="home-campaign-body">
            <span className="campaign-cause"><Icon size={22} aria-hidden="true" />{cause[locale]}</span>
            <h3>{title}</h3>
            <p className="campaign-excerpt">{description}</p>
            <div className="campaign-funding">
              <Progress value={Math.min(100, entry.collected / entry.goal * 100)} aria-label={t('Avancement de la collecte', 'Fundraising progress', 'تقدم جمع التبرعات')} />
              <p><strong>{money(entry.collected, locale)}</strong> / {money(entry.goal, locale)}</p>
            </div>
            <StoryModal title={title} description={description} image={image} locale={locale} />
            <a className="button green campaign-donate" href={campaignDonationUrl(entry, locale)}>{t('Faire un don', 'Donate', 'تبرّع')}<ArrowUpRight size={18} aria-hidden="true" /></a>
          </div>
        </article>;
      })}</div> : <p className="campaigns-empty">{t('Nos prochaines campagnes seront présentées ici. En attendant, vous pouvez soutenir nos actions.', 'Our next campaigns will appear here. In the meantime, you can support our causes.', 'ستظهر حملاتنا القادمة هنا. في هذه الأثناء، يمكنك دعم أعمالنا.')}
        <a className="text-link" href="#actions">{t('Découvrir nos actions', 'Explore our causes', 'اكتشف أعمالنا')}</a>
      </p>}
    <a className="text-link campaigns-all" href={`/campagnes?lang=${locale}`}>{t('Toutes nos campagnes', 'All our campaigns', 'جميع حملاتنا')}<ArrowUpRight size={18} aria-hidden="true" /></a>
  </section>;
}
