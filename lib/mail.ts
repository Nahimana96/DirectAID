import { env } from 'cloudflare:workers';
import { database,uuid,siteOrigin,settings,runtime } from './storage';
import { money,nextWeek,type Locale } from './domain';
export type Contribution=Record<string,any>;
export function escapeHtml(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
const words={fr:{paid:'Votre paiement a été confirmé',reminder:'Votre promesse de don est en attente',proof:'Des nouvelles de votre contribution',date:'La date de votre sacrifice',thanks:'Merci pour votre solidarité avec Direct Aid Burundi.',reference:'Référence',amount:'Montant',hello:'Bonjour',stop:'Pour arrêter les relances, répondez à cet e-mail.',details:'Votre contribution',demo:'Démonstration — aucun encaissement réel.'},en:{paid:'Your payment has been confirmed',reminder:'Your donation pledge is awaiting payment',proof:'An update on your contribution',date:'Your sacrifice date',thanks:'Thank you for supporting Direct Aid Burundi.',reference:'Reference',amount:'Amount',hello:'Hello',stop:'Reply to this email to stop reminders.',details:'Your contribution',demo:'Demonstration — no real payment.'},ar:{paid:'تم تأكيد دفعتكم',reminder:'تذكير بوعد التبرع',proof:'مستجدات مساهمتكم',date:'موعد الأضحية',thanks:'شكراً لدعمكم جمعية Direct Aid Burundi.',reference:'المرجع',amount:'المبلغ',hello:'مرحباً',stop:'للإيقاف، يرجى الرد على هذه الرسالة.',details:'مساهمتكم',demo:'عرض تجريبي — لم يتم تحصيل أموال.'}};
export function emailContent(o:Contribution,kind:string,extra=''){const t=words[o.locale as Locale]??words.fr;const title=kind==='payment'?t.paid:kind.startsWith('reminder')?t.reminder:kind==='date'?t.date:t.proof;const d=JSON.parse(o.details);const names=(d.recipients??[]).map((x:any)=>`<li>${escapeHtml(x.name)}</li>`).join('');return {subject:`Direct Aid Burundi · ${title} · ${o.reference}`,html:`<!doctype html><html lang="${o.locale}" dir="${o.locale==='ar'?'rtl':'ltr'}"><body style="font-family:Arial,sans-serif;color:#193a2d;line-height:1.7;max-width:600px;margin:auto;padding:24px"><h2>Direct Aid Burundi</h2><h1 style="font-size:24px">${title}</h1><p>${t.hello} ${escapeHtml(o.name)},</p><p>${t.thanks}</p>${o.demo?`<p>${t.demo}</p>`:''}<p>${t.reference} : <strong>${escapeHtml(o.reference)}</strong><br/>${t.amount} : <strong>${money(o.amount,o.locale,o.currency)}</strong></p>${names?`<ul>${names}</ul>`:''}${extra}${kind.startsWith('reminder')?`<p>${t.stop}</p>`:''}<p>directaidburundi@gmail.com<br/>+257 68 070 000</p></body></html>`};}
export function emailStatement(o:Contribution,kind:string,dedupe:string,extra=''){const c=emailContent(o,kind,extra);return database().prepare('INSERT OR IGNORE INTO emails (id,dedupe,contribution_id,recipient,subject,html,kind,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(uuid(),dedupe,o.id,o.email,c.subject,c.html,kind,'queued',new Date().toISOString());}
export async function flushEmails(limit=10){
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM||runtime().demo)return {sent:0,pending:true};
 const db=database();const items=(await db.prepare("SELECT * FROM emails WHERE status='queued' ORDER BY created_at LIMIT ?").bind(limit).all()).results as any[];let sent=0;
 for(const item of items){
  const o=await db.prepare('SELECT * FROM contributions WHERE id=?').bind(item.contribution_id).first<Contribution>();
  if(!o||o.demo){await db.prepare("UPDATE emails SET status='skipped' WHERE id=?").bind(item.id).run();continue;}
  if(item.kind.startsWith('reminder')&&(o.status!=='pending'||o.reminders_paused||(item.kind==='reminder-auto'&&o.reminder_count>=4))){await db.prepare("UPDATE emails SET status='skipped' WHERE id=?").bind(item.id).run();continue;}
  const lock=await db.prepare("UPDATE emails SET status='sending' WHERE id=? AND status='queued'").bind(item.id).run();if(!lock.meta.changes)continue;
  try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':item.dedupe},body:JSON.stringify({from:env.EMAIL_FROM,to:[item.recipient],reply_to:(await settings()).email,subject:item.subject,html:item.html})});const data:any=await response.json();if(!response.ok)throw new Error(data.message??'EMAIL_ERROR');
   const statements=[db.prepare("UPDATE emails SET status='sent',provider_id=?,sent_at=?,error=NULL WHERE id=?").bind(data.id,new Date().toISOString(),item.id)];
   if(item.kind.startsWith('reminder'))statements.push(db.prepare('UPDATE contributions SET reminder_count=reminder_count+?,next_reminder=? WHERE id=?').bind(item.kind==='reminder-auto'?1:0,nextWeek(),o.id));
   await db.batch(statements);sent++;
  }catch(e){await db.prepare("UPDATE emails SET status='failed',error=? WHERE id=?").bind(e instanceof Error?e.message.slice(0,300):'EMAIL_ERROR',item.id).run();}
 }
 return {sent,pending:false};
}
export async function runReminders(){
 const db=database();const due=(await db.prepare("SELECT * FROM contributions WHERE status='pending' AND method='transfer' AND reminders_paused=0 AND reminder_count<4 AND next_reminder<=? LIMIT 50").bind(new Date().toISOString()).all()).results as Contribution[];
 const s=await settings();const bank=`<p>${escapeHtml(s.bankName)}<br/>${escapeHtml(s.bankHolder)}<br/>${escapeHtml(s.bankAccount)}<br/>${escapeHtml(s.bankSwift)}</p>`;
 for(const o of due)await emailStatement(o,'reminder-auto',`reminder-${o.id}-${o.reminder_count+1}`,bank).run();
 return {...await flushEmails(50),queued:due.length};
}
export async function recordPaid(o:Contribution,paymentId:string,amount:number,currency:string){
 if(amount!==o.amount||currency.toUpperCase()!==o.currency)throw new Error('PAYMENT_MISMATCH');
 if(o.status==='cancelled'||o.status==='refunded')throw new Error('ORDER_CLOSED');
 const db=database();const now=new Date().toISOString();
 await db.batch([db.prepare("INSERT OR IGNORE INTO payments (id,contribution_id,amount,currency,status,created_at) VALUES (?,?,?,?,'paid',?)").bind(paymentId,o.id,amount,o.currency,now),db.prepare("UPDATE contributions SET status='paid',paid_at=COALESCE(paid_at,?),next_reminder=NULL WHERE id=?").bind(now,o.id),emailStatement(o,'payment',`payment-${paymentId}`)]);
 await flushEmails();
}
