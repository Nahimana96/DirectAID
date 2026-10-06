import {ShieldCheck} from 'lucide-react';
import {textAt,type AssociationProfile} from '@/lib/editorial-model';
import type {Locale} from '@/lib/domain';

export function TrustSection({partners,locale:l}:{partners:AssociationProfile['partners'];locale:Locale}){
 const t=(fr:string,en:string,ar:string)=>l==='en'?en:l==='ar'?ar:fr;
 if(!partners.length)return null;
 return <section className="trust-section section" id="confiance" aria-labelledby="trust-title"><div className="trust-heading"><p className="eyebrow">{t('LA CONFIANCE','TRUST','الثقة')}</p><h2 id="trust-title">{t('Ils nous font confiance','They put their trust in us','يضعون ثقتهم بنا')}</h2><p>{t('Direct Aid opère en partenariat avec des institutions reconnues qui soutiennent et encadrent nos programmes sur le terrain.','Direct Aid works with recognised institutions that support and oversee our programmes on the ground.','تعمل ديركت إيد بالشراكة مع مؤسسات معترف بها تدعم برامجنا الميدانية وتشرف عليها.')}</p></div><div className="trust-grid">{partners.map((partner,i)=><article className="trust-card" key={i}><span className="trust-icon"><ShieldCheck size={25} aria-hidden="true"/></span><h3>{textAt(partner.name,l)}</h3><p>{textAt(partner.description,l)}</p></article>)}</div></section>;
}
