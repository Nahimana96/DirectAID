import { z } from 'zod';
import { database,hash,runtime,secret,siteOrigin,uuid } from './storage';
import type { Contribution } from './mail';
import { escapeHtml } from './mail';

export const feedbackSchema=z.object({invitation:z.string().uuid(),token:z.string().regex(/^[a-f0-9]{64}$/),comment:z.string().trim().min(10).max(2000),displayName:z.string().trim().max(80).default(''),consent:z.boolean(),locale:z.enum(['fr','en','ar'])}).strict();

export async function feedbackInvitation(id:string,token:string){
 if(!z.string().uuid().safeParse(id).success||!/^[a-f0-9]{64}$/.test(token))throw new Error('FORBIDDEN');
 const item=await database().prepare('SELECT i.*,c.status AS payment_status,c.demo,e.kind,e.status AS email_status,e.sent_at FROM feedback_invites i JOIN contributions c ON c.id=i.contribution_id JOIN emails e ON e.dedupe=i.email_dedupe WHERE i.id=?').bind(id).first<any>();
 if(!item||await hash(token)!==item.token_hash||item.payment_status!=='paid'||item.kind!=='proof')throw new Error('FORBIDDEN');
 const demo=runtime().demo&&item.demo===1;
 if(!(item.email_status==='sent'&&item.sent_at)&&!(demo&&item.email_status==='queued'))throw new Error('FORBIDDEN');
 if(item.demo===1&&!demo)throw new Error('FORBIDDEN');
 return {...item,demo};
}

export async function prepareFeedbackInvitation(order:Contribution,request:Request,emailDedupe:string){
 const id=uuid(),token=secret();
 const link=siteOrigin(request)+'/avis?'+new URLSearchParams({invitation:id,token,lang:order.locale});
 const text=order.locale==='en'?['How was your experience?','Share your feedback','Your feedback will only be published with your permission, after review.']:order.locale==='ar'?['كيف كانت تجربتك؟','شاركنا رأيك','لا يُنشر رأيك إلا بموافقتك وبعد المراجعة.']:['Comment s’est passée votre expérience ?','Partager mon avis','Votre témoignage sera publié uniquement avec votre accord, après validation.'];
 const html=`<div style="border-top:1px solid #dce3da;padding-top:24px;margin-top:24px"><h2>${text[0]}</h2><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#104f38;color:#f5df69;padding:12px 22px;border-radius:24px;text-decoration:none">${text[1]}</a></p><p>${text[2]}</p></div>`;
 const statement=database().prepare('INSERT INTO feedback_invites (id,contribution_id,token_hash,email_dedupe,created_at) VALUES (?,?,?,?,?)').bind(id,order.id,await hash(token),emailDedupe,new Date().toISOString());
 return {html,statement};
}

export async function publicTestimonials(){
 return (await database().prepare("SELECT t.id,t.comment,t.display_name,t.locale,t.created_at FROM testimonials t JOIN contributions c ON c.id=t.contribution_id JOIN feedback_invites i ON i.id=t.invite_id JOIN emails e ON e.dedupe=i.email_dedupe WHERE t.status='approved' AND t.consent=1 AND c.status='paid' AND c.demo=0 AND e.kind='proof' AND e.status='sent' AND e.sent_at IS NOT NULL ORDER BY t.updated_at DESC LIMIT 12").all()).results;
}
