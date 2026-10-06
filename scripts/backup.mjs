import {createClient} from '@libsql/client';
import {get,put} from '@vercel/blob';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createCipheriv,randomBytes,randomUUID,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';

// Run on a trusted machine or the daily GitHub workflow, outside Vercel's request limit.
const env=process.env,local=process.argv.includes('--local');
if(!env.TURSO_DATABASE_URL)throw new Error('TURSO_DATABASE_URL requis.');
if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY||''))throw new Error('BACKUP_ENCRYPTION_KEY doit contenir 64 caractères hexadécimaux.');
if(!local&&!env.BACKUP_BLOB_READ_WRITE_TOKEN)throw new Error('Configurez le stockage privé de sauvegarde BACKUP_BLOB_READ_WRITE_TOKEN.');
const key=Buffer.from(env.BACKUP_ENCRYPTION_KEY,'hex'),id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID();
const output=path.resolve('.data','backups',id),prefix='directaid-backups/'+id;
const client=createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN});
const sha=value=>createHash('sha256').update(value).digest('hex');
function encrypt(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const body=Buffer.concat([cipher.update(gzipSync(value)),cipher.final()]);return Buffer.concat([Buffer.from('DAID1'),iv,cipher.getAuthTag(),body]);}
async function store(name,bytes){if(local){await mkdir(path.dirname(path.join(output,name)),{recursive:true});await writeFile(path.join(output,name),bytes,{flag:'wx'});}else await put(`${prefix}/${name}`,bytes,{access:'private',addRandomSuffix:false,contentType:'application/octet-stream',token:env.BACKUP_BLOB_READ_WRITE_TOKEN});}
let tracked=false;
try{
 await client.execute({sql:"INSERT INTO backup_runs(id,status,created_at) VALUES (?,'running',?)",args:[id,new Date().toISOString()]});tracked=true;
 const tx=await client.transaction('read');let snapshot;
 try{const schema=(await tx.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name")).rows;const tables={};for(const table of schema.filter(x=>x.type==='table')){const escaped='"'+table.name.replaceAll('"','""')+'"';tables[table.name]=['admin_sessions','donor_sessions','access_links','auth_attempts'].includes(table.name)?[]:(await tx.execute('SELECT * FROM '+escaped)).rows;}
 snapshot={version:1,createdAt:new Date().toISOString(),schema,tables};await tx.commit();}catch(e){await tx.rollback();throw e;}finally{tx.close();}
 const manifest={version:1,id,createdAt:snapshot.createdAt,database:'database.enc',files:[]};
 const databaseBytes=encrypt(Buffer.from(JSON.stringify(snapshot)));await store('database.enc',databaseBytes);manifest.databaseSha256=sha(databaseBytes);
 for(const asset of snapshot.tables.assets||[]){if(!/^images\/[a-f0-9-]{36}$/.test(asset.storage_key))throw new Error('Clé de fichier invalide.');let raw;
  if(env.TURSO_DATABASE_URL.startsWith('file:'))raw=await readFile(path.resolve('.data','uploads',asset.storage_key));
  else{const item=await get(asset.storage_key,{access:'private',token:env.BLOB_READ_WRITE_TOKEN});if(!item||item.statusCode!==200)throw new Error('Un fichier de la sauvegarde est introuvable.');raw=Buffer.from(await new Response(item.stream).arrayBuffer());}
  const name=`assets/${asset.id}.enc`,encoded=encrypt(raw);await store(name,encoded);manifest.files.push({file:name,storageKey:asset.storage_key,sha256:sha(encoded),originalSha256:sha(raw)});
 }
 // The manifest is written last: its presence means the complete archive is ready.
 await store('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)));
 await client.execute({sql:"UPDATE backup_runs SET status='complete',asset_count=?,completed_at=? WHERE id=?",args:[manifest.files.length,new Date().toISOString(),id]});
 console.log(`Sauvegarde chiffrée terminée : ${manifest.files.length} fichier(s). ${local?output:prefix}`);
}catch(e){if(tracked)await client.execute({sql:"UPDATE backup_runs SET status='failed',completed_at=? WHERE id=?",args:[new Date().toISOString(),id]}).catch(()=>{});throw e;}finally{client.close();}
