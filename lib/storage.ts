import {sqlDatabase} from './database';
import {fileBucket} from './files';
const env=process.env;
import { defaults, type Settings } from './domain';
export function database(){return sqlDatabase;}
export function bucket(){return fileBucket;}
export async function settings():Promise<Settings>{const row=await database().prepare('SELECT value FROM settings WHERE id = ?').bind('main').first<{value:string}>();return row?{...defaults,...JSON.parse(row.value)}:defaults;}
export async function projects(all=false){return (await database().prepare(`SELECT p.*, COALESCE((SELECT SUM(pay.amount) FROM payments pay JOIN contributions c ON c.id=pay.contribution_id WHERE c.project_id=p.id AND pay.status='paid'),0) AS collected FROM projects p ${all?'':'WHERE published = 1'} ORDER BY created_at DESC`).all()).results;}
export async function projectById(id:string){return database().prepare("SELECT p.*, COALESCE((SELECT SUM(pay.amount) FROM payments pay JOIN contributions c ON c.id=pay.contribution_id WHERE c.project_id=p.id AND pay.status='paid'),0) AS collected FROM projects p WHERE p.id = ?").bind(id).first();}
export const runtime=()=>({demo:env.APP_MODE==='demo',stripeReady:!!env.STRIPE_SECRET_KEY,emailReady:!!env.RESEND_API_KEY&&!!env.EMAIL_FROM});
export function siteOrigin(request?:Request){const configured=env.SITE_URL;if(configured)return configured.replace(/\/$/,'');if(process.env.NODE_ENV==='development'&&request)return new URL(request.url).origin;throw new Error('SITE_URL_REQUIRED');}
export function uuid(){return crypto.randomUUID();}
export function secret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export async function audit(actor:string,action:string,entity:string){await database().prepare('INSERT INTO audit (id,actor,action,entity,created_at) VALUES (?,?,?,?,?)').bind(uuid(),actor,action,entity,new Date().toISOString()).run();}
