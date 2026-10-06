import {cookies} from 'next/headers';
import {z} from 'zod';
import {database,hash,secret,siteOrigin,uuid,audit} from './storage';
import {sqlClient} from './database';
import {passwordHash} from './password.mjs';
import {stripe} from './stripe';

const donorCookie='directaid_donor';
export async function throttle(req:Request,email:string,purpose:string){
 const ip=process.env.VERCEL?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
 const keys=await Promise.all([`${purpose}:email:${email}`,`${purpose}:ip:${ip}`].map(hash));const window=Math.floor(Date.now()/900000),db=database();
 await db.batch(keys.map(key=>db.prepare('INSERT INTO auth_attempts(key,window,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window=excluded.window THEN attempts+1 ELSE 1 END,window=excluded.window').bind(key,window)));
 for(const key of keys){const row=await db.prepare('SELECT attempts FROM auth_attempts WHERE key=? AND window=?').bind(key,window).first<{attempts:number}>();if((row?.attempts||0)>5)throw new Error('TOO_MANY_ATTEMPTS');}
}
export async function requestAccess(value:unknown,req:Request,purpose:'donor'|'reset'){
 const v=z.object({email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),locale:z.enum(['fr','en','ar']).default('fr')}).strict().parse(value);
 await throttle(req,v.email,purpose);
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new Error('EMAIL_NOT_CONFIGURED');
 const db=database();const user=purpose==='reset'?await db.prepare('SELECT id,password_version FROM admin_users WHERE email=?').bind(v.email).first<any>():await db.prepare('SELECT id FROM contributions WHERE lower(email)=? LIMIT 1').bind(v.email).first<any>();
 if(!user)return {ok:true};
 const token=secret(),digest=await hash(token),now=new Date(),expires=new Date(now.getTime()+15*60000).toISOString();
 await db.prepare('INSERT INTO access_links(token_hash,email,purpose,user_id,password_version,expires_at,created_at) VALUES (?,?,?,?,?,?,?)').bind(digest,v.email,purpose,purpose==='reset'?user.id:null,purpose==='reset'?user.password_version:null,expires,now.toISOString()).run();
 const url=`${siteOrigin(req)}/${purpose==='reset'?'admin/reinitialiser':'espace-donateur'}?lang=${v.locale}#token=${token}`;
 const titles=purpose==='reset'?['Réinitialiser votre mot de passe','Reset your password','إعادة تعيين كلمة المرور']:['Accéder à votre espace donateur','Open your donor area','الدخول إلى مساحة المتبرع'];
 const index=v.locale==='en'?1:v.locale==='ar'?2:0,title=titles[index];
 const explanation=['Ce lien est valable 15 minutes et ne peut être utilisé qu’une fois. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.','This link is valid for 15 minutes and can only be used once. If you did not request it, ignore this email.','هذا الرابط صالح لمدة 15 دقيقة ويُستخدم مرة واحدة. إذا لم تطلبه، تجاهل هذه الرسالة.'][index];
 try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':uuid()},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[v.email],subject:`Direct Aid Burundi · ${title}`,html:`<html lang="${v.locale}" dir="${v.locale==='ar'?'rtl':'ltr'}"><body style="font-family:Arial;line-height:1.7;color:#104f38;padding:30px"><h2>Direct Aid Burundi</h2><h1>${title}</h1><p>${explanation}</p><a href="${url}" style="display:inline-block;background:#104f38;color:white;padding:14px 24px;border-radius:8px">${title}</a></body></html>`})});if(!r.ok)throw new Error('EMAIL_UNAVAILABLE');}catch{await db.prepare('DELETE FROM access_links WHERE token_hash=?').bind(digest).run();throw new Error('EMAIL_UNAVAILABLE');}
 return {ok:true};
}
const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/);
export async function consumeDonorAccess(value:unknown){const {token}=z.object({token:tokenSchema}).strict().parse(value);const digest=await hash(token),now=new Date().toISOString();const row=await database().prepare("UPDATE access_links SET used_at=? WHERE token_hash=? AND purpose='donor' AND used_at IS NULL AND expires_at>? RETURNING email").bind(now,digest,now).first<{email:string}>();if(!row)throw new Error('LINK_EXPIRED');const session=secret();await database().prepare('INSERT INTO donor_sessions(token_hash,email,expires_at) VALUES (?,?,?)').bind(await hash(session),row.email,new Date(Date.now()+24*3600000).toISOString()).run();(await cookies()).set(donorCookie,session,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:86400});return {ok:true};}
export async function donorIdentity(){const token=(await cookies()).get(donorCookie)?.value;if(!token||!tokenSchema.safeParse(token).success)throw new Error('UNAUTHENTICATED');const row=await database().prepare('SELECT email FROM donor_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(token),new Date().toISOString()).first<{email:string}>();if(!row)throw new Error('UNAUTHENTICATED');return row.email;}
export async function donorLogout(){const token=(await cookies()).get(donorCookie)?.value;if(token)await database().prepare('DELETE FROM donor_sessions WHERE token_hash=?').bind(await hash(token)).run();(await cookies()).delete(donorCookie);return {ok:true};}
export async function resetPassword(value:unknown){
 const v=z.object({token:tokenSchema,password:z.string().min(8).max(128),confirmation:z.string().min(8).max(128)}).strict().parse(value);if(v.password!==v.confirmation)throw new Error('INVALID_PASSWORD');
 const digest=await hash(v.token),now=new Date().toISOString();if(!await database().prepare("SELECT token_hash FROM access_links WHERE token_hash=? AND purpose='reset' AND used_at IS NULL AND expires_at>?").bind(digest,now).first())throw new Error('LINK_EXPIRED');const encoded=await passwordHash(v.password);const tx=await sqlClient().transaction('write');
 try{const result=await tx.execute({sql:"SELECT a.user_id,a.password_version FROM access_links a JOIN admin_users u ON u.id=a.user_id AND u.password_version=a.password_version WHERE a.token_hash=? AND a.purpose='reset' AND a.used_at IS NULL AND a.expires_at>?",args:[digest,now]});const link=result.rows[0];if(!link)throw new Error('LINK_EXPIRED');
 await tx.execute({sql:'UPDATE admin_users SET password_hash=?,password_version=password_version+1,updated_at=? WHERE id=?',args:[encoded,now,link.user_id]});
 await tx.execute({sql:'UPDATE access_links SET used_at=? WHERE user_id=? AND used_at IS NULL',args:[now,link.user_id]});await tx.execute({sql:'DELETE FROM admin_sessions WHERE user_id=?',args:[link.user_id]});await tx.commit();await audit('password-reset','password_reset',String(link.user_id));
 }catch(e){await tx.rollback();throw e;}finally{tx.close();}return {ok:true};
}
export async function donorDashboard(){const email=await donorIdentity(),db=database();const orders=(await db.prepare('SELECT id,reference,cause,amount,currency,frequency,method,status,created_at,details,request_key,stripe_customer,stripe_subscription FROM contributions WHERE lower(email)=? ORDER BY created_at DESC').bind(email).all()).results;
 const result=await Promise.all(orders.map(async o=>({id:o.id,reference:o.reference,cause:o.cause,amount:o.amount,currency:o.currency,frequency:o.frequency,method:o.method,status:o.status,created_at:o.created_at,details:JSON.parse(o.details),portalReady:!!process.env.STRIPE_SECRET_KEY&&!!o.stripe_customer&&!!o.stripe_subscription,url:`/suivi?id=${o.id}&token=${await hash('access:'+o.request_key)}`,proofs:o.status==='paid'?(await db.prepare('SELECT id,filename,created_at FROM assets WHERE contribution_id=? ORDER BY created_at DESC').bind(o.id).all()).results:[],payments:(await db.prepare('SELECT amount,currency,status,created_at FROM payments WHERE contribution_id=? ORDER BY created_at DESC').bind(o.id).all()).results})));return {email,orders:result};}
export async function donorPortal(value:unknown,req:Request){const email=await donorIdentity();const v=z.object({id:z.string().uuid(),locale:z.enum(['fr','en','ar']).default('fr')}).strict().parse(value);const o=await database().prepare("SELECT stripe_customer FROM contributions WHERE id=? AND lower(email)=? AND frequency='monthly' AND stripe_subscription IS NOT NULL AND demo=0").bind(v.id,email).first<{stripe_customer:string}>();if(!o?.stripe_customer)throw new Error('SUBSCRIPTION_NOT_READY');const portal=await stripe('billing_portal/sessions',new URLSearchParams({customer:o.stripe_customer,return_url:`${siteOrigin(req)}/espace-donateur?lang=${v.locale}`,locale:v.locale==='ar'?'auto':v.locale}));return {url:portal.url};}
