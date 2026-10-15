const env=process.env;
import { database,siteOrigin,runtime } from './storage';
import { recordPaid,type Contribution } from './mail';
export async function stripe(path:string,body?:URLSearchParams){if(!env.STRIPE_SECRET_KEY)throw new Error('STRIPE_NOT_CONFIGURED');if(runtime().demo)throw new Error('DEMO_MODE');const r=await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?.toString(),signal:AbortSignal.timeout(8000)});const data:any=await r.json();if(!r.ok)throw new Error(data.error?.message??'STRIPE_ERROR');return data;}
export async function checkout(o:Contribution,token:string,req:Request){const root=siteOrigin(req);const b=new URLSearchParams({mode:o.frequency==='monthly'?'subscription':'payment',customer_email:o.email,client_reference_id:o.id,'metadata[contribution_id]':o.id,'line_items[0][price_data][currency]':o.currency.toLowerCase(),'line_items[0][price_data][unit_amount]':String(o.amount),'line_items[0][price_data][product_data][name]':`Direct Aid Burundi — ${o.cause}`,'line_items[0][quantity]':'1',success_url:`${root}/merci?id=${o.id}&token=${token}&lang=${o.locale}`,cancel_url:`${root}/suivi?id=${o.id}&token=${token}&lang=${o.locale}`,locale:o.locale==='ar'?'auto':o.locale});if(o.frequency==='monthly'){b.set('line_items[0][price_data][recurring][interval]','month');b.set('subscription_data[metadata][contribution_id]',o.id);}const session=await stripe('checkout/sessions',b);await database().prepare('UPDATE contributions SET stripe_session=? WHERE id=?').bind(session.id,o.id).run();return session.url;}
export async function verifyStripe(raw:string,signature:string|null){if(!env.STRIPE_WEBHOOK_SECRET)throw new Error('STRIPE_NOT_CONFIGURED');const parts=signature?.split(',')??[];const timestamp=parts.find(s=>s.startsWith('t='))?.slice(2);if(!timestamp||Math.abs(Date.now()/1000-Number(timestamp))>300)throw new Error('INVALID_SIGNATURE');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const mac=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${raw}`))),b=>b.toString(16).padStart(2,'0')).join('');const valid=parts.filter(s=>s.startsWith('v1=')).some(s=>{const h=s.slice(3);if(h.length!==mac.length)return false;let diff=0;for(let i=0;i<h.length;i++)diff|=h.charCodeAt(i)^mac.charCodeAt(i);return diff===0;});if(!valid)throw new Error('INVALID_SIGNATURE');return JSON.parse(raw);}
export async function handleStripe(event:any){
 const db=database();if(await db.prepare('SELECT id FROM events WHERE id=?').bind(event.id).first())return;
 const obj=event.data.object;
 if(event.type==='checkout.session.completed'){
  const o=await db.prepare('SELECT * FROM contributions WHERE id=?').bind(obj.metadata?.contribution_id??'').first<Contribution>();
  if(o&&!o.demo){await db.prepare('UPDATE contributions SET stripe_customer=?,stripe_subscription=? WHERE id=?').bind(obj.customer??null,obj.subscription??null,o.id).run();if(obj.mode==='payment'&&obj.payment_status==='paid')await recordPaid(o,obj.payment_intent,obj.amount_total,obj.currency);}
 }
 if(event.type==='invoice.paid'){
  const sid=obj.parent?.subscription_details?.subscription??obj.subscription;let o=sid?await db.prepare('SELECT * FROM contributions WHERE stripe_subscription=?').bind(sid).first<Contribution>():null;
  if(!o&&sid){const subscription=await stripe('subscriptions/'+encodeURIComponent(sid));const cid=subscription.metadata?.contribution_id;if(cid){o=await db.prepare('SELECT * FROM contributions WHERE id=?').bind(cid).first<Contribution>();if(o)await db.prepare('UPDATE contributions SET stripe_subscription=?,stripe_customer=? WHERE id=?').bind(sid,obj.customer,o.id).run();}}
  if(o&&!o.demo)await recordPaid(o,obj.id,obj.amount_paid,obj.currency);
 }
 if(event.type==='checkout.session.async_payment_succeeded'){const o=await db.prepare('SELECT * FROM contributions WHERE stripe_session=?').bind(obj.id).first<Contribution>();if(o&&!o.demo&&obj.mode==='payment')await recordPaid(o,obj.payment_intent,obj.amount_total,obj.currency);}
 if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
  const rows=(await db.prepare('SELECT id,details FROM contributions WHERE stripe_subscription=?').bind(obj.id).all()).results;
  for(const o of rows){const details=JSON.parse(o.details);details.cancelAtPeriodEnd=!!obj.cancel_at_period_end;details.subscriptionStatus=obj.status;await db.prepare('UPDATE contributions SET details=? WHERE id=?').bind(JSON.stringify(details),o.id).run();}
 }
 if(event.type==='charge.refunded'&&obj.refunded){await db.prepare("UPDATE payments SET status='refunded' WHERE id=?").bind(obj.payment_intent).run();await db.prepare("UPDATE contributions SET status='refunded' WHERE frequency='once' AND id IN (SELECT contribution_id FROM payments WHERE id=?)").bind(obj.payment_intent).run();}
 await db.prepare('INSERT OR IGNORE INTO events (id,created_at) VALUES (?,?)').bind(event.id,new Date().toISOString()).run();
}

// Recover missing notifications using authenticated Stripe state, never browser claims.
export async function reconcileCardPayment(o:Contribution):Promise<Contribution>{
 if(o.method!=='card'||o.status!=='pending'||o.demo||runtime().demo||!o.stripe_session||!env.STRIPE_SECRET_KEY)return o;
 try{
  const session=await stripe('checkout/sessions/'+encodeURIComponent(o.stripe_session));
  if(session.id!==o.stripe_session||session.metadata?.contribution_id!==o.id||session.client_reference_id!==o.id)throw new Error('PAYMENT_REFERENCE_MISMATCH');
  if(session.status!=='complete'||session.payment_status!=='paid')return o;
  if(session.amount_total!==o.amount||session.currency?.toUpperCase()!==o.currency)throw new Error('PAYMENT_MISMATCH');
  let paymentId:string,amount:number,currency:string;
  if(o.frequency==='monthly'){
   if(session.mode!=='subscription'||typeof session.invoice!=='string'||typeof session.subscription!=='string')return o;
   const invoice=await stripe('invoices/'+encodeURIComponent(session.invoice));
   if(invoice.status!=='paid'||invoice.amount_paid!==o.amount||invoice.currency?.toUpperCase()!==o.currency)return o;
   paymentId=invoice.id;amount=invoice.amount_paid;currency=invoice.currency;
  }else{
   if(session.mode!=='payment'||typeof session.payment_intent!=='string')return o;
   const intent=await stripe('payment_intents/'+encodeURIComponent(session.payment_intent));
   if(intent.status!=='succeeded'||intent.amount_received!==o.amount||intent.currency?.toUpperCase()!==o.currency)return o;
   paymentId=intent.id;amount=intent.amount_received;currency=intent.currency;
  }
  const db=database();
  const current=await db.prepare('SELECT * FROM contributions WHERE id=?').bind(o.id).first<Contribution>();
  if(!current||current.status!=='pending')return current??o;
  await db.prepare('UPDATE contributions SET stripe_customer=?,stripe_subscription=? WHERE id=?').bind(session.customer??null,session.subscription??null,o.id).run();
  await recordPaid(current,paymentId,amount,currency);
  return await db.prepare('SELECT * FROM contributions WHERE id=?').bind(o.id).first<Contribution>()??o;
 }catch{
  console.warn('Stripe payment verification unavailable for contribution',o.id);
  return o;
 }
}

export async function reconcilePendingCards(){
 if(runtime().demo||!env.STRIPE_SECRET_KEY)return;
 const rows=(await database().prepare("SELECT * FROM contributions WHERE method='card' AND status='pending' AND demo=0 AND stripe_session IS NOT NULL ORDER BY created_at DESC LIMIT 10").all()).results;
 for(let i=0;i<rows.length;i+=5)await Promise.all(rows.slice(i,i+5).map(reconcileCardPayment));
}
