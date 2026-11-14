import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { textAt, type AssociationProfile } from '@/lib/editorial-model';
import type { Locale } from '@/lib/domain';

const partnerLogos = new Map([
  ['qatar charity', '/partners/qatar-charity.webp'],
  ['gouvernement du burundi', '/partners/burundi.webp'],
  ['communaute islamique du burundi', '/partners/comibu.webp'],
  ['comibu', '/partners/comibu.webp'],
]);

function normalizeName(name: string) {
  return name.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function TrustSection({ partners, locale }: { partners: AssociationProfile['partners']; locale: Locale }) {
  const t = (fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;
  if (!partners.length) return null;

  return (
    <section className="trust-section section" id="confiance" aria-labelledby="trust-title">
      <div className="trust-heading">
        <p className="eyebrow">{t('LA CONFIANCE', 'TRUST', 'الثقة')}</p>
        <h2 id="trust-title">{t('Ils nous font confiance', 'They put their trust in us', 'يضعون ثقتهم بنا')}</h2>
        <p>{t('Direct Aid opère en partenariat avec des institutions reconnues qui soutiennent et encadrent nos programmes sur le terrain.', 'Direct Aid works with recognised institutions that support and oversee our programmes on the ground.', 'تعمل ديركت إيد بالشراكة مع مؤسسات معترف بها تدعم برامجنا الميدانية وتشرف عليها.')}</p>
      </div>
      <div className="trust-grid">
        {partners.map((partner, index) => {
          const logo = partnerLogos.get(normalizeName(partner.name.fr))
            ?? partnerLogos.get(normalizeName(partner.name.en));

          return (
            <article className="trust-card" key={index}>
              <div className="trust-mark">
                {logo ? (
                  <div className="trust-logo">
                    <Image src={logo} alt="" width={116} height={88} unoptimized />
                  </div>
                ) : (
                  <span className="trust-icon"><ShieldCheck size={25} aria-hidden="true" /></span>
                )}
              </div>
              <h3>{textAt(partner.name, locale)}</h3>
              <p>{textAt(partner.description, locale)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
