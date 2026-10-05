import { cookies } from 'next/headers';
import { z } from 'zod';
import { database,hash,secret,audit } from './storage';
import { passwordHash,passwordMatches } from './password.mjs';
const cookieName='directaid_admin';
const sessionDuration=8*60*60*1000;
type User={id:string;email:string;password_hash:string;password_version:number};
export async function administrator(){
 const token=(await cookies()).get(cookieName)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw new Error('UNAUTHENTICATED');
 const user=await database().prepare('SELECT u.id,u.email,u.password_version FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND s.password_version=u.password_version').bind(await hash(token),new Date().toISOString()).first<{id:string;email:string;password_version:number}>();
 if(!user)throw new Error('UNAUTHENTICATED');return user;
}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');const expected=new URL(process.env.SITE_URL||req.url).origin;if(!origin||origin!==expected)throw new Error('FORBIDDEN');}
const loginSchema=z.object({email:z.string().email().max(254).transform(v=>v.trim().toLowerCase()),password:z.string().min(1).max(128)}).strict();
async function setSession(user:Pick<User,'id'|'password_version'>){
 const token=secret(),now=new Date();
 await database().prepare('INSERT INTO admin_sessions (token_hash,user_id,password_version,expires_at,created_at) VALUES (?,?,?,?,?)').bind(await hash(token),user.id,user.password_version,new Date(now.getTime()+sessionDuration).toISOString(),now.toISOString()).run();
 (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:sessionDuration/1000});
}
export async function login(value:unknown,req:Request){
 const v=loginSchema.parse(value),db=database();
 const ip=process.env.VERCEL?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
 const keys=await Promise.all(['email:'+v.email,'ip:'+ip].map(hash));
 const window=Math.floor(Date.now()/(15*60*1000));
 await db.batch(keys.map(key=>db.prepare('INSERT INTO auth_attempts (key,window,attempts) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window=excluded.window THEN attempts+1 ELSE 1 END,window=excluded.window').bind(key,window)));
 const rows=await Promise.all(keys.map(key=>db.prepare('SELECT attempts FROM auth_attempts WHERE key=? AND window=?').bind(key,window).first<{attempts:number}>()));
 if(rows.some(row=>(row?.attempts??0)>10))throw new Error('TOO_MANY_ATTEMPTS');
 const user=await db.prepare('SELECT * FROM admin_users WHERE email=?').bind(v.email).first<User>();
 const fallback='pbkdf2-sha256$600000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000';
 if(!await passwordMatches(v.password,user?.password_hash??fallback)||!user)throw new Error('INVALID_CREDENTIALS');
 await setSession(user);await audit(user.email,'login',user.id);return {ok:true};
}
export async function logout(){const token=(await cookies()).get(cookieName)?.value;if(token)await database().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).run();(await cookies()).delete(cookieName);return {ok:true};}
export async function changePassword(value:unknown){
 const who=await administrator();const v=z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(8).max(128),confirmation:z.string().min(8).max(128)}).strict().parse(value);
 if(v.newPassword!==v.confirmation||v.newPassword===v.currentPassword)throw new Error('INVALID_PASSWORD');
 const user=await database().prepare('SELECT * FROM admin_users WHERE id=?').bind(who.id).first<User>();
 if(!user||!await passwordMatches(v.currentPassword,user.password_hash))throw new Error('INVALID_CURRENT_PASSWORD');
 const result=await database().prepare('UPDATE admin_users SET password_hash=?,password_version=password_version+1,updated_at=? WHERE id=? AND password_version=?').bind(await passwordHash(v.newPassword),new Date().toISOString(),user.id,user.password_version).run();
 if(!result.meta.changes)throw new Error('INVALID_STATUS');
 await database().prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(user.id).run();
 await setSession({...user,password_version:user.password_version+1});await audit(user.email,'password_changed',user.id);return {ok:true};
}
export function errorResponse(error:unknown){const message=error instanceof Error?error.message:'ERROR';const code=message==='UNAUTHENTICATED'||message==='INVALID_CREDENTIALS'?401:message==='FORBIDDEN'?403:message==='NOT_FOUND'?404:message==='TOO_MANY_ATTEMPTS'?429:/DATABASE|STORAGE|NOT_CONFIGURED|SITE_URL/.test(message)?503:400;console.error('DirectAid API:',message.startsWith('[')?'INVALID_FORM':message.slice(0,100));return Response.json({error:message.startsWith('[')?'INVALID_FORM':message},{status:code,headers:{'Cache-Control':'no-store'}});}
