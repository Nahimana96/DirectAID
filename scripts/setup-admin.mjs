import {createClient} from '@libsql/client';
import {randomUUID} from 'node:crypto';
import {passwordHash} from '../lib/password.mjs';
const url=process.env.TURSO_DATABASE_URL;
if(!url||(process.env.VERCEL&&url.startsWith('file:')))throw new Error('Configure TURSO_DATABASE_URL avant la création du compte.');
if(process.stdin.isTTY){process.stdin.setRawMode(true);process.stderr.write('Envoyez les données du compte en JSON sur stdin (saisie masquée).\n');}
const input=await new Promise((resolve,reject)=>{let value='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{value+=chunk;if(value.includes('\u0003'))reject(new Error('Annulé'));if(value.length>1000)reject(new Error('Entrée trop longue'));if(value.includes('\n')||value.includes('\r'))resolve(value);});process.stdin.once('end',()=>resolve(value));});
if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();
const data=JSON.parse(input),email=String(data.email??'').trim().toLowerCase(),password=String(data.password??'');
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||password.length>128)throw new Error('E-mail ou mot de passe non valide.');
const client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 const existing=await client.execute({sql:'SELECT id FROM admin_users WHERE email=?',args:[email]});
 if(existing.rows.length)console.log('Le compte existe déjà. Son mot de passe est conservé.');
 else{const now=new Date().toISOString();await client.execute({sql:'INSERT OR IGNORE INTO admin_users (id,email,password_hash,password_version,created_at,updated_at) VALUES (?,?,?,1,?,?)',args:[randomUUID(),email,await passwordHash(password),now,now]});console.log('Compte administrateur créé.');}
}finally{client.close();}
