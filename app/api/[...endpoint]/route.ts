const env=process.env;
import { z } from 'zod';
import { prepareProofEmail } from '@/lib/proof-email';
import { administrator,sameOrigin,errorResponse,login,logout,changePassword } from '@/lib/auth';
import { database,bucket,settings,projects,projectById,runtime as appRuntime,uuid,secret,hash,audit,siteOrigin } from '@/lib/storage';
import { orderSchema,quoteOrder,projectSchema,settingsSchema,nextWeek,dateIsValid,type Project } from '@/lib/domain';
import { recordPaid,emailStatement,flushEmails,runReminders,escapeHtml,type Contribution } from '@/lib/mail';
import { checkout,stripe,verifyStripe,handleStripe,reconcileCardPayment,reconcilePendingCards } from '@/lib/stripe';
import { feedbackSchema,feedbackInvitation,publicTestimonials } from '@/lib/testimonials';
import {associationProfile,contentEntries,saveProfile,saveEntry,deleteEntry,editorialAssetPublished,campaignForDonation} from '@/lib/editorial';
import {requestAccess,consumeDonorAccess,resetPassword,donorDashboard,donorIdentity,donorLogout,donorPortal} from '@/lib/access';
import {listAdminUsers,addAdminUser,removeAdminUser} from '@/lib/admin-users';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function bytes(req:Request,max:number){const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let length=0;while(true){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>max){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(r.value);}const body=new Uint8Array(length);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}return body;}
async function body(req:Request){return JSON.parse(new TextDecoder().decode(await bytes(req,100000)));}
async function order(id:string){const o=await database().prepare('SELECT * FROM contributions WHERE id=?').bind(id).first<Contribution>();if(!o)throw new Error('NOT_FOUND');return o;}
async function ownedOrder(id:string,token:string){const o=await order(id);if(!token||await hash(token)!==o.access_hash)throw new Error('FORBIDDEN');return o;}
function publicOrder(o:Contribution){const {access_hash,request_key,...safe}=o;return {...safe,details:JSON.parse(o.details)};}
async function nextStep(o:Contribution,token:string,req:Request){let url=`/suivi?id=${o.id}&token=${token}&lang=${o.locale}`;if(o.method==='card'&&o.status==='pending'&&!appRuntime().demo){if(o.stripe_session){const session=await stripe('checkout/sessions/'+encodeURIComponent(o.stripe_session));if(session.url)url=session.url;}else url=await checkout(o,token,req);}return {id:o.id,reference:o.reference,token,url,mode:appRuntime().demo?'demo':'live'};}

export async function GET(req:Request){try{const url=new URL(req.url);const path=url.pathname.slice(5);const db=database();
 if(path==='jobs/reminders'){if(!env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${env.CRON_SECRET}`)throw new Error('FORBIDDEN');return json(await runReminders());}
 if(path==='public'){const s=await settings();return json({settings:s,projects:await projects(),testimonials:await publicTestimonials(),profile:await associationProfile(),entries:await contentEntries(),...appRuntime()});}
 if(path==='feedback'){const invitation=await feedbackInvitation(url.searchParams.get('invitation')??'',url.searchParams.get('token')??'');const testimonial=await db.prepare('SELECT comment,display_name,consent,status FROM testimonials WHERE contribution_id=?').bind(invitation.contribution_id).first();return json({testimonial,demo:invitation.demo});}
 if(path==='order'){const o=await reconcileCardPayment(await ownedOrder(url.searchParams.get('id')??'',url.searchParams.get('token')??''));const proof=(await db.prepare('SELECT id,filename,token FROM assets WHERE contribution_id=?').bind(o.id).all()).results;const payments=(await db.prepare('SELECT id,amount,currency,status,created_at FROM payments WHERE contribution_id=? ORDER BY created_at DESC').bind(o.id).all()).results;return json({order:publicOrder(o),proofs:proof,payments,...appRuntime()});}
 if(path==='donor')return json(await donorDashboard());
 if(path==='admin/users')return json(await listAdminUsers());
 if(path==='admin/export'){await administrator();const rows=(await db.prepare('SELECT reference,name,email,phone,cause,amount,currency,frequency,method,status,created_at,paid_at FROM contributions ORDER BY created_at DESC').all()).results;const headers=['reference','name','email','phone','cause','amount','currency','frequency','method','status','created_at','paid_at'];const cell=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const csv='\uFEFF'+[headers,...rows.map(row=>headers.map(k=>k==='amount'?Number(row[k])/100:row[k]))].map(row=>row.map(cell).join(';')).join('\r\n');return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename=directaid-contributions.csv','Cache-Control':'no-store'}});}
 if(path==='admin'){const who=await administrator();await reconcilePendingCards();const [orders,projectList,s,mail,log,feedback]=await Promise.all([db.prepare("SELECT c.*, (SELECT COUNT(*) FROM assets a WHERE a.contribution_id=c.id) AS proof_count, (SELECT COUNT(*) FROM emails e WHERE e.contribution_id=c.id AND e.kind='proof' AND e.status='sent') AS proof_sent_count FROM contributions c ORDER BY created_at DESC LIMIT 500").all(),projects(true),settings(),db.prepare('SELECT id,contribution_id,recipient,subject,kind,status,error,created_at,sent_at FROM emails ORDER BY created_at DESC LIMIT 200').all(),db.prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 30').all(),db.prepare('SELECT t.*,c.name AS donor_name,c.reference,c.demo FROM testimonials t JOIN contributions c ON c.id=t.contribution_id ORDER BY t.updated_at DESC LIMIT 300').all()]);return json({user:who,orders:orders.results.map((o:any)=>publicOrder(o)),projects:projectList,settings:s,emails:mail.results,audit:log.results,testimonials:feedback.results,profile:await associationProfile(),entries:await contentEntries(true),backups:(await db.prepare('SELECT * FROM backup_runs ORDER BY created_at DESC LIMIT 10').all()).results,...appRuntime()});}
 if(path==='admin/proofs'){await administrator();return json({assets:(await db.prepare('SELECT id,filename,mime,token,created_at FROM assets WHERE contribution_id=? ORDER BY created_at DESC').bind(url.searchParams.get('id')??'').all()).results});}
 if(path.startsWith('media/')){const id=path.split('/')[1];const asset=await db.prepare('SELECT * FROM assets WHERE id=?').bind(id).first<any>();if(!asset)throw new Error('NOT_FOUND');if(!asset.public&&asset.token!==url.searchParams.get('token')){let owned=false;try{const email=await donorIdentity();owned=!!await db.prepare("SELECT id FROM contributions WHERE id=? AND lower(email)=? AND status='paid'").bind(asset.contribution_id,email).first();}catch{}if(!owned)await administrator();}if(asset.public){const published=await db.prepare('SELECT id FROM projects WHERE cover=? AND published=1').bind(id).first();if(!published&&!(await settings()).carouselImages.includes('/api/media/'+id)&&!await editorialAssetPublished(id))await administrator();}const object=await bucket().get(asset.storage_key);if(!object)throw new Error('NOT_FOUND');return new Response(object.body,{headers:{'Content-Type':asset.mime,...(asset.mime==='application/pdf'?{'Content-Disposition':'attachment; filename=document.pdf'}:{}),'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=300','Referrer-Policy':'no-referrer'}});}
 return json({error:'NOT_FOUND'},404);
 }catch(e){return errorResponse(e);}}

export async function POST(req:Request){try{const path=new URL(req.url).pathname.slice(5);const db=database();
 if(path==='stripe/webhook'){if(appRuntime().demo)return json({error:'DEMO_MODE'},400);const raw=new TextDecoder().decode(await bytes(req,1000000));const event=await verifyStripe(raw,req.headers.get('stripe-signature'));await handleStripe(event);return json({received:true});}
 if(path==='jobs/reminders'){const expected=env.CRON_SECRET;if(!expected||req.headers.get('authorization')!==`Bearer ${expected}`)throw new Error('FORBIDDEN');return json(await runReminders());}
 sameOrigin(req);
 if(path==='auth/forgot')return json(await requestAccess(await body(req),req,'reset'));
 if(path==='auth/first')return json(await requestAccess(await body(req),req,'first'));
 if(path==='auth/reset')return json(await resetPassword(await body(req)));
 if(path==='admin/users/add')return json(await addAdminUser(await body(req)));
 if(path==='admin/users/remove')return json(await removeAdminUser(await body(req)));
 if(path==='donor/request')return json(await requestAccess(await body(req),req,'donor'));
 if(path==='donor/verify')return json(await consumeDonorAccess(await body(req)));
 if(path==='donor/logout')return json(await donorLogout());
 if(path==='donor/portal')return json(await donorPortal(await body(req),req));
 if(path==='auth/login')return json(await login(await body(req),req));
 if(path==='auth/logout')return json(await logout());
 if(path==='auth/password')return json(await changePassword(await body(req)));
 if(path==='orders'){
  const raw=await body(req);const parsed=orderSchema.parse(raw);const s=await settings();const mode=appRuntime();
  if(!mode.demo&&!s.pricesConfirmed)throw new Error('PRICES_NOT_CONFIGURED');
  if(parsed.method==='card'&&!mode.demo&&!mode.stripeReady)throw new Error('STRIPE_NOT_CONFIGURED');
  if(parsed.method==='transfer'&&!mode.demo&&(!s.bankAccount||!s.bankHolder||!s.bankName))throw new Error('BANK_NOT_CONFIGURED');
  const token=await hash('access:'+parsed.key);const existing=await db.prepare('SELECT * FROM contributions WHERE request_key=?').bind(parsed.key).first<Contribution>();
  if(existing){if(existing.email!==parsed.email||existing.cause!==parsed.cause)throw new Error('REQUEST_ALREADY_USED');return json(await nextStep(existing,token,req));}
  if(parsed.campaignId)await campaignForDonation(parsed.campaignId,parsed.cause,parsed.projectId);
  const q=quoteOrder(raw,s,parsed.projectId?await projectById(parsed.projectId) as Project:undefined);const id=uuid();const reference='DA-'+new Date().getUTCFullYear()+'-'+id.slice(0,8).toUpperCase();
  await db.prepare('INSERT OR IGNORE INTO contributions (id,request_key,reference,cause,offer,quantity,amount,currency,frequency,method,status,name,email,phone,locale,details,project_id,access_hash,demo,next_reminder,created_at,campaign_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,parsed.key,reference,parsed.cause,parsed.offer,q.quantity,q.cents,s.currency,parsed.frequency,parsed.method,'pending',parsed.name,parsed.email,parsed.phone,parsed.locale,JSON.stringify(q.details),parsed.cause==='puits'?parsed.projectId!:null,await hash(token),mode.demo?1:0,parsed.method==='transfer'?nextWeek():null,new Date().toISOString(),parsed.campaignId||null).run();
  const saved=await db.prepare('SELECT * FROM contributions WHERE request_key=?').bind(parsed.key).first<Contribution>();return json(await nextStep(saved!,token,req),201);
 }
 if(path==='demo-pay'){if(!appRuntime().demo)throw new Error('FORBIDDEN');const v=await body(req);const o=await ownedOrder(v.id,v.token);if(!o.demo||o.method!=='card')throw new Error('FORBIDDEN');await recordPaid(o,'demo-'+o.id,o.amount,o.currency);return json({paid:true,demo:true});}
 if(path==='subscription'){const v=await body(req);const o=await ownedOrder(v.id,v.token);if(o.frequency!=='monthly'||o.status!=='paid')throw new Error('INVALID_SUBSCRIPTION');if(v.action!=='cancel')throw new Error('INVALID_ACTION');if(!appRuntime().demo){if(!o.stripe_subscription)throw new Error('SUBSCRIPTION_NOT_READY');await stripe('subscriptions/'+encodeURIComponent(o.stripe_subscription),new URLSearchParams({cancel_at_period_end:'true'}));}const details=JSON.parse(o.details);details.cancelAtPeriodEnd=true;await db.prepare('UPDATE contributions SET details=? WHERE id=?').bind(JSON.stringify(details),o.id).run();return json({cancelled:true});}
 if(path==='feedback'){
  const value=feedbackSchema.parse(await body(req));const invitation=await feedbackInvitation(value.invitation,value.token);const now=new Date().toISOString();
  await db.prepare("INSERT INTO testimonials (id,contribution_id,invite_id,comment,display_name,locale,consent,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'pending',?,?) ON CONFLICT(contribution_id) DO UPDATE SET invite_id=excluded.invite_id,comment=excluded.comment,display_name=excluded.display_name,locale=excluded.locale,consent=excluded.consent,status='pending',updated_at=excluded.updated_at,moderated_at=NULL").bind(uuid(),invitation.contribution_id,value.invitation,value.comment,value.consent?value.displayName:'',value.locale,value.consent?1:0,now,now).run();return json({saved:true});
 }
 const who=await administrator();
 if(path==='admin/upload'){
  const form=await new Response(await bytes(req,4200000),{headers:{'Content-Type':req.headers.get('content-type')??''}}).formData();const f=form.get('file');if(!f||typeof f==='string')throw new Error('FILE_REQUIRED');if(f.size>4000000||f.size<12)throw new Error('FILE_SIZE');const buffer=new Uint8Array(await f.arrayBuffer());const isJpg=buffer[0]===255&&buffer[1]===216&&buffer[2]===255;const isPng=buffer[0]===137&&buffer[1]===80&&buffer[2]===78&&buffer[3]===71;const isWebp=new TextDecoder().decode(buffer.slice(0,4))==='RIFF'&&new TextDecoder().decode(buffer.slice(8,12))==='WEBP';const isPdf=form.get('document')==='true'&&new TextDecoder().decode(buffer.slice(0,5))==='%PDF-';if(!isJpg&&!isPng&&!isWebp&&!isPdf)throw new Error('IMAGE_ONLY');const mime=isPdf?'application/pdf':isJpg?'image/jpeg':isPng?'image/png':'image/webp';const cid=String(form.get('contributionId')??'');if(cid){if(isPdf)throw new Error('IMAGE_ONLY');const o=await order(cid);if(o.status!=='paid')throw new Error('PAYMENT_REQUIRED');}const id=uuid();const token=secret();const key='images/'+id;await bucket().put(key,buffer,{httpMetadata:{contentType:mime}});try{await db.prepare('INSERT INTO assets (id,contribution_id,filename,mime,size,storage_key,token,public,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,cid||null,f.name.slice(0,180),mime,f.size,key,token,cid?0:1,new Date().toISOString()).run();}catch(e){await bucket().delete(key);throw e;}await audit(who.email,'upload',id);return json({id,filename:f.name,url:'/api/media/'+id+(cid?'?token='+token:''),token});
 }
 if(path!=='admin')return json({error:'NOT_FOUND'},404);const v=await body(req);const action=v.action;
 if(action==='association')return json(await saveProfile(v.profile,who.email));
 if(action==='content')return json(await saveEntry(v.entry,who.email));
 if(action==='deleteContent')return json(await deleteEntry({id:v.id},who.email));
 if(action==='deleteProject'){const id=z.string().uuid().parse(v.id);if(await db.prepare('SELECT id FROM contributions WHERE project_id=? LIMIT 1').bind(id).first())throw new Error('PROJECT_HAS_DONATIONS');const linked=(await contentEntries(true)).some(entry=>entry.kind==='campaign'&&entry.projectId===id);if(linked)throw new Error('PROJECT_HAS_CAMPAIGNS');const result=await db.prepare('DELETE FROM projects WHERE id=?').bind(id).run();if(!result.meta.changes)throw new Error('NOT_FOUND');await audit(who.email,'project_deleted',id);return json({deleted:true});}
 if(action==='settings'){const s=settingsSchema.parse(v.settings);await db.prepare('INSERT INTO settings (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('main',JSON.stringify(s)).run();await audit(who.email,action,'main');return json({saved:true});}
 if(action==='project'){const p=projectSchema.parse(v.project);const id=p.id??uuid();if(p.cover&&!await db.prepare('SELECT id FROM assets WHERE id=? AND public=1').bind(p.cover).first())throw new Error('INVALID_COVER');const now=new Date().toISOString();await db.prepare('INSERT INTO projects (id,title,title_en,title_ar,location,description,description_en,description_ar,goal,stage,published,cover,updates,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,title_en=excluded.title_en,title_ar=excluded.title_ar,location=excluded.location,description=excluded.description,description_en=excluded.description_en,description_ar=excluded.description_ar,goal=excluded.goal,stage=excluded.stage,published=excluded.published,cover=excluded.cover,updates=excluded.updates,updated_at=excluded.updated_at').bind(id,p.title,p.title_en,p.title_ar,p.location,p.description,p.description_en,p.description_ar,p.goal,p.stage,p.published?1:0,p.cover,JSON.stringify(p.updates),now,now).run();await audit(who.email,action,id);return json({saved:true,id});}
 if(action==='runReminders')return json(await runReminders());
 if(action==='flushEmails')return json(await flushEmails(50));
 if(action==='retryEmail'){await db.prepare("UPDATE emails SET status='queued',error=NULL WHERE id=? AND status='failed'").bind(String(v.id)).run();return json(await flushEmails());}
 if(action==='testimonial'){
  const id=z.string().uuid().parse(v.id),status=z.enum(['approved','hidden','pending']).parse(v.status),expectedUpdatedAt=z.string().datetime().parse(v.expectedUpdatedAt);
  const item=await db.prepare('SELECT t.*,c.status AS payment_status,c.demo,e.status AS email_status,e.kind,e.sent_at FROM testimonials t JOIN contributions c ON c.id=t.contribution_id JOIN feedback_invites i ON i.id=t.invite_id JOIN emails e ON e.dedupe=i.email_dedupe WHERE t.id=?').bind(id).first<any>();
  if(!item)throw new Error('NOT_FOUND');
  if(item.updated_at!==expectedUpdatedAt)throw new Error('INVALID_STATUS');
  if(status==='approved'&&(item.consent!==1||item.payment_status!=='paid'||item.kind!=='proof'||(!(item.email_status==='sent'&&item.sent_at)&&!(appRuntime().demo&&item.demo===1&&item.email_status==='queued'))))throw new Error('TESTIMONIAL_NOT_PUBLISHABLE');
  const result=await db.prepare('UPDATE testimonials SET status=?,moderated_at=? WHERE id=? AND updated_at=?').bind(status,new Date().toISOString(),id,expectedUpdatedAt).run();if(!result.meta.changes)throw new Error('INVALID_STATUS');await audit(who.email,'testimonial-'+status,id);return json({saved:true});
 }
 const o=await order(String(v.id));
 if(action==='confirmTransfer'){if(o.method!=='transfer'||o.status!=='pending')throw new Error('INVALID_STATUS');await recordPaid(o,'bank-'+o.id,o.amount,o.currency);}
 else if(action==='stopReminders'){await db.prepare('UPDATE contributions SET reminders_paused=1,next_reminder=NULL WHERE id=?').bind(o.id).run();}
 else if(action==='cancel'){if(o.status!=='pending')throw new Error('INVALID_STATUS');await db.prepare("UPDATE contributions SET status='cancelled',reminders_paused=1,next_reminder=NULL WHERE id=? AND status='pending'").bind(o.id).run();}
 else if(action==='remind'){if(o.status!=='pending'||o.method!=='transfer')throw new Error('INVALID_STATUS');const s=await settings();const bank=`<p>${escapeHtml(s.bankName)}<br/>${escapeHtml(s.bankHolder)}<br/>${escapeHtml(s.bankAccount)}<br/>${escapeHtml(s.bankSwift)}</p>`;await emailStatement(o,'reminder-manual','manual-'+uuid(),bank).run();await flushEmails();}
 else if(action==='schedule'){const date=z.string().refine(dateIsValid).parse(v.date);if(o.cause!=='sacrifices')throw new Error('INVALID_ACTION');const d=JSON.parse(o.details);d.confirmedDate=date;d.dateStatus='confirmed';await db.prepare('UPDATE contributions SET details=? WHERE id=?').bind(JSON.stringify(d),o.id).run();await emailStatement(o,'date',`date-${o.id}-${date}`,`<p>${escapeHtml(date)}</p>`).run();await flushEmails();}
 else if(action==='fulfillment'){if(o.cause!=='sacrifices'||o.status!=='paid')throw new Error('PAYMENT_REQUIRED');const d=JSON.parse(o.details);const i=z.number().int().min(0).max(o.quantity-1).parse(v.index);d.recipients[i].status=z.enum(['pending','completed']).parse(v.status);await db.prepare('UPDATE contributions SET details=? WHERE id=?').bind(JSON.stringify(d),o.id).run();}
 else if(action==='previewProof'||action==='proof'){
  const preview=await prepareProofEmail(o,req,v);
  if(action==='previewProof')return json({recipient:preview.recipient,from:preview.from,subject:preview.subject,html:preview.html,blocker:preview.blocker});
  if(preview.blocker)return json({error:preview.blocker},400);
  const existing=await db.prepare('SELECT status FROM emails WHERE dedupe=?').bind(preview.dedupe).first();
  if(!existing)await db.batch([emailStatement(o,'proof',preview.dedupe,preview.extra),preview.invitation.statement]);
  await flushEmails(1,preview.dedupe);
  const delivered=await db.prepare('SELECT status,error FROM emails WHERE dedupe=?').bind(preview.dedupe).first();
  await audit(who.email,action,o.id);
  return json({saved:true,emailStatus:delivered?.status,emailError:delivered?.error,...appRuntime()});
 }
 else throw new Error('INVALID_ACTION');
 await audit(who.email,action,o.id);return json({saved:true,...appRuntime()});
 }catch(e){return errorResponse(e);}}

