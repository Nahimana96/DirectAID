import { z } from 'zod';
import { database,siteOrigin,runtime } from './storage';
import { emailContent,escapeHtml,type Contribution } from './mail';
import { prepareFeedbackInvitation } from './testimonials';

export function proofEmailBlocker(root:string){
 if(runtime().demo)return 'Le mode démonstration ne permet pas l’envoi d’e-mails.';
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return 'Le service e-mail doit être connecté : clé Resend et adresse d’expédition manquantes.';
 const url=new URL(root);
 if(url.protocol!=='https:'||['localhost','127.0.0.1','[::1]'].includes(url.hostname))return 'Les photos et liens doivent être accessibles depuis le site en ligne. L’envoi depuis cette adresse locale est indisponible.';
 return null;
}

// Preview and delivery share this renderer. Preparing it does not enqueue or send mail.
export async function prepareProofEmail(o:Contribution,request:Request,value:{assets:unknown;message?:unknown;key?:unknown}){
 if(o.status!=='paid')throw new Error('PAYMENT_REQUIRED');
 const ids=z.array(z.string()).min(1).max(12).parse(value.assets);
 const message=z.string().max(3000).parse(value.message??'');
 const key=z.string().uuid().parse(value.key);
 const all=(await database().prepare('SELECT * FROM assets WHERE contribution_id=?').bind(o.id).all()).results;
 const chosen=ids.map(id=>all.find(a=>a.id===id));
 if(chosen.some(a=>!a))throw new Error('INVALID_ASSET');
 const root=siteOrigin(request),dedupe='proof-'+o.id+'-'+key;
 const html=`<p>${escapeHtml(message).replace(/\n/g,'<br/>')}</p>`+chosen.map(a=>{
  const link=escapeHtml(`${root}/api/media/${a!.id}?token=${a!.token}`);
  return `<p><a href="${link}"><img src="${link}" alt="${escapeHtml(a!.filename)}" style="display:block;max-width:100%;height:auto;border-radius:12px"/></a></p>`;
 }).join('');
 const invitation=await prepareFeedbackInvitation(o,request,dedupe);
 const extra=html+invitation.html;
 return {dedupe,invitation,extra,...emailContent(o,'proof',extra),recipient:o.email,from:process.env.EMAIL_FROM??'',blocker:proofEmailBlocker(root)};
}
