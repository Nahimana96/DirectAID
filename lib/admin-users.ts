import {z} from 'zod';
import {administrator} from './auth';
import {database,uuid,audit} from './storage';

export const ownerEmail='nahimana1996@gmail.com';
const emailSchema=z.string().trim().email().max(254).transform(value=>value.toLowerCase());
async function owner(){const who=await administrator();if(who.email.toLowerCase()!==ownerEmail)throw new Error('FORBIDDEN');return who;}

export async function listAdminUsers(){await owner();const rows=(await database().prepare('SELECT id,email,password_hash,created_at FROM admin_users ORDER BY created_at ASC').all()).results;return {users:rows.map(row=>({id:row.id,email:row.email,pending:row.password_hash==='pending',created_at:row.created_at}))};}

export async function addAdminUser(value:unknown){const who=await owner();const {email}=z.object({email:emailSchema}).strict().parse(value);const now=new Date().toISOString();const result=await database().prepare("INSERT OR IGNORE INTO admin_users(id,email,password_hash,password_version,created_at,updated_at) VALUES(?,?, 'pending',1,?,?)").bind(uuid(),email,now,now).run();if(!result.meta.changes)throw new Error('USER_EXISTS');await audit(who.email,'admin_user_added',email);return {ok:true};}

export async function removeAdminUser(value:unknown){const who=await owner();const {id}=z.object({id:z.string().uuid()}).strict().parse(value);const db=database();const user=await db.prepare('SELECT id,email FROM admin_users WHERE id=?').bind(id).first<{id:string;email:string}>();if(!user)throw new Error('NOT_FOUND');if(user.email.toLowerCase()===ownerEmail||user.id===who.id)throw new Error('FORBIDDEN');await db.batch([db.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id),db.prepare('DELETE FROM access_links WHERE user_id=?').bind(id),db.prepare('DELETE FROM admin_users WHERE id=?').bind(id)]);await audit(who.email,'admin_user_removed',user.email);return {ok:true};}
