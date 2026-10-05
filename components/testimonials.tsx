"use client";
import { useEffect,useState,type FormEvent } from 'react';
import { CheckCircle2,Quote,Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { Locale } from '@/lib/domain';

export type Testimonial={id:string;comment:string;display_name:string;locale:Locale;created_at:string};
const translate=(locale:Locale,fr:string,en:string,ar:string)=>locale==='en'?en:locale==='ar'?ar:fr;

export function Testimonials({locale,items}:{locale:Locale;items:Testimonial[]}){
 const t=(fr:string,en:string,ar:string)=>translate(locale,fr,en,ar);
 return <section className="section testimonials-section" aria-labelledby="testimonials-title">
  <div className="section-heading"><div><p className="eyebrow">{t('TÉMOIGNAGES','DONOR STORIES','آراء المتبرعين')}</p><h2 id="testimonials-title">{t('Ils ont donné,','They gave,','ساهموا،')}<br/><em>{t('ils témoignent.','they share their experience.','ويشاركون تجربتهم.')}</em></h2></div><p>{t('Les mots de nos donateurs après avoir reçu des nouvelles de leur action.','Words from our donors after receiving updates on their contribution.','كلمات من متبرعينا بعد تلقي أخبار مساهماتهم.')}</p></div>
  {items.length?<div className="testimonials-grid">{items.map(item=><figure className="testimonial-card" key={item.id}><Quote aria-hidden="true" size={28}/><blockquote>{item.comment}</blockquote><figcaption><span>{item.display_name||t('Donateur anonyme','Anonymous donor','متبرع مجهول')}</span><small>{t('Donateur vérifié','Verified donor','متبرع موثّق')}</small></figcaption></figure>)}</div>:<div className="testimonials-empty"><Quote aria-hidden="true" size={30}/><p>{t('Les premiers témoignages de nos donateurs seront partagés ici.','Our donors’ first stories will be shared here.','سنشارك هنا أولى تجارب متبرعينا.')}</p></div>}
 </section>;
}

export function DonorFeedback({locale}:{locale:Locale}){
 const t=(fr:string,en:string,ar:string)=>translate(locale,fr,en,ar);
 const [identity,setIdentity]=useState({invitation:'',token:''}),[ready,setReady]=useState(false),[unavailable,setUnavailable]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState(''),[comment,setComment]=useState(''),[displayName,setDisplayName]=useState(''),[consent,setConsent]=useState(false),[demo,setDemo]=useState(false);
 useEffect(()=>{const params=new URLSearchParams(location.search);const credentials={invitation:params.get('invitation')||'',token:params.get('token')||''};setIdentity(credentials);let active=true;if(!credentials.invitation||!credentials.token){setUnavailable(true);return;}fetch('/api/feedback?'+new URLSearchParams(credentials)).then(async response=>{if(!response.ok)throw new Error('UNAVAILABLE');return response.json();}).then((data:any)=>{if(!active)return;setReady(true);setDemo(data.demo);if(data.testimonial){setComment(data.testimonial.comment);setDisplayName(data.testimonial.display_name);setConsent(!!data.testimonial.consent);}}).catch(()=>{if(active)setUnavailable(true);});return()=>{active=false;};},[]);
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...identity,comment,displayName:consent?displayName:'',consent,locale})});if(!response.ok)throw new Error('SAVE_FAILED');setSaved(true);}catch{setError(t('Votre avis n’a pas pu être enregistré. Réessayez en conservant votre texte.','Your feedback could not be saved. Keep your text and try again.','تعذر حفظ رأيك. احتفظ بالنص وحاول مجدداً.'));}finally{setBusy(false);}}
 return <section className="section narrow feedback-section"><p className="eyebrow">DIRECT AID BURUNDI</p><h1 className="page-title">{t('Votre avis compte.','Your feedback matters.','رأيك يهمّنا.')}</h1>
  {unavailable?<div className="panel"><h2>{t('Ce lien est indisponible','This link is unavailable','هذا الرابط غير متاح')}</h2><p>{t('Utilisez le lien reçu dans l’e-mail contenant vos photos de preuve, ou contactez notre équipe.','Use the link in the email containing your proof photos, or contact our team.','استخدم الرابط في رسالة صور إثبات التنفيذ أو اتصل بفريقنا.')}</p><a className="text-link" href={'/contact?lang='+locale}>{t('Contacter l’association','Contact the association','اتصل بالجمعية')}</a></div>:saved?<div className="panel feedback-success" role="status"><CheckCircle2 size={38}/><h2>{t('Merci pour votre témoignage.','Thank you for your feedback.','شكراً على رأيك.')}</h2><p>{consent?t('Votre avis sera relu par notre équipe avant publication.','Our team will review your feedback before publication.','سيراجع فريقنا رأيك قبل نشره.'):t('Votre avis est transmis à notre équipe et reste privé.','Your feedback has been shared with our team and remains private.','وصل رأيك إلى فريقنا وسيبقى خاصاً.')}</p><Button asChild className="button green"><a href={'/?lang='+locale}>{t('Retour à l’accueil','Back to home','العودة للرئيسية')}</a></Button></div>:!ready?<p role="status">{t('Chargement…','Loading…','جارٍ التحميل…')}</p>:<form className="panel feedback-form" onSubmit={submit}>
   <p>{t('Vous avez reçu les photos de votre action. Racontez-nous votre expérience avec Direct Aid Burundi.','You received photos of your contribution. Tell us about your experience with Direct Aid Burundi.','لقد تلقيت صور تنفيذ مساهمتك. أخبرنا عن تجربتك مع ديركت إيد بوروندي.')}</p>
   {demo&&<p className="note">{t('Avis de démonstration : il ne sera pas affiché parmi les témoignages publics.','Demo feedback: it will not appear in public donor stories.','رأي تجريبي: لن يظهر ضمن الآراء العامة.')}</p>}
   <label className="field"><span>{t('Votre témoignage','Your feedback','رأيك')}</span><Textarea value={comment} onChange={event=>setComment(event.target.value)} required minLength={10} maxLength={2000} rows={6}/></label>
   <label className="feedback-consent"><Checkbox checked={consent} onCheckedChange={value=>setConsent(value===true)}/><span>{t('J’autorise Direct Aid Burundi à publier ce témoignage sur son site après validation.','I allow Direct Aid Burundi to publish this feedback on its website after review.','أسمح للجمعية بنشر هذا الرأي على موقعها بعد المراجعة.')}</span></label>
   {consent&&<label className="field"><span>{t('Nom à afficher (facultatif)','Public name (optional)','الاسم المعروض (اختياري)')}</span><Input value={displayName} onChange={event=>setDisplayName(event.target.value)} maxLength={80} placeholder={t('Ex. : Karim B. — vide pour rester anonyme','E.g. Karim B. — leave blank to remain anonymous','مثال: كريم — اتركه فارغاً لتبقى مجهولاً')}/></label>}
   {error&&<p className="form-error" role="alert">{error}</p>}
   <Button className="button green" disabled={busy}>{busy?t('Enregistrement…','Saving…','جارٍ الحفظ…'):t('Envoyer mon avis','Send feedback','إرسال رأيي')}</Button>
  </form>}
 </section>;
}
