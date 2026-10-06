import {createClient} from '@libsql/client';
import {get,put} from '@vercel/blob';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createDecipheriv,createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';

const env=process.env,source=process.argv[2],remote=process.argv.includes('--remote');
if(!source)throw new Error('Indiquez un dossier de sauvegarde, ou son préfixe Blob avec --remote.');
if(!env.RESTORE_DATABASE_URL||env.RESTORE_DATABASE_URL===env.TURSO_DATABASE_URL)throw new Error('RESTORE_DATABASE_URL doit désigner une nouvelle base vide.');
if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY||''))throw new Error('Clé de déchiffrement requise.');
const root=path.resolve(source),key=Buffer.from(env.BACKUP_ENCRYPTION_KEY,'hex');
async function load(name){if(!/^(manifest\.json|database\.enc|assets\/[a-f0-9-]{36}\.enc)$/.test(name))throw new Error('Chemin de sauvegarde invalide.');if(remote){if(!/^directaid-backups\/[\w-]+$/.test(source))throw new Error('Préfixe invalide.');const r=await get(source+'/'+name,{access:'private',token:env.BACKUP_BLOB_READ_WRITE_TOKEN});if(!r||r.statusCode!==200)throw new Error('Sauvegarde incomplète.');return Buffer.from(await new Response(r.stream).arrayBuffer());}return readFile(path.join(root,name));}
const sha=value=>createHash('sha256').update(value).digest('hex');
function decrypt(bytes){if(bytes.subarray(0,5).toString()!=='DAID1')throw new Error('Format inconnu.');const d=createDecipheriv('aes-256-gcm',key,bytes.subarray(5,17));d.setAuthTag(bytes.subarray(17,33));return gunzipSync(Buffer.concat([d.update(bytes.subarray(33)),d.final()]));}
const manifest=JSON.parse((await load('manifest.json')).toString());if(manifest.version!==1)throw new Error('Version inconnue.');const database=await load(manifest.database);if(sha(database)!==manifest.databaseSha256)throw new Error('Archive altérée.');const snapshot=JSON.parse(decrypt(database).toString());
const client=createClient({url:env.RESTORE_DATABASE_URL,authToken:env.RESTORE_AUTH_TOKEN});
try{
 const existing=await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");if(existing.rows.length)throw new Error('La base de restauration doit être vide. Aucun écrasement effectué.');
 const local=env.RESTORE_DATABASE_URL.startsWith('file:');
 const uploads=path.resolve(env.RESTORE_UPLOADS_DIR||'.data/restored-uploads');
 if(local&&uploads===path.resolve('.data/uploads'))throw new Error('Choisissez un nouveau dossier de fichiers.');
 if(!local&&(!env.RESTORE_BLOB_READ_WRITE_TOKEN||env.RESTORE_BLOB_READ_WRITE_TOKEN===env.BLOB_READ_WRITE_TOKEN))throw new Error('Choisissez un nouveau stockage privé RESTORE_BLOB_READ_WRITE_TOKEN.');
 for(const item of manifest.files){if(!/^images\/[a-f0-9-]{36}$/.test(item.storageKey))throw new Error('Clé invalide.');const encoded=await load(item.file);if(sha(encoded)!==item.sha256)throw new Error('Fichier altéré.');const bytes=decrypt(encoded);if(sha(bytes)!==item.originalSha256)throw new Error('Empreinte incorrecte.');if(local){const file=path.join(uploads,item.storageKey);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes,{flag:'wx'});}else await put(item.storageKey,bytes,{access:'private',token:env.RESTORE_BLOB_READ_WRITE_TOKEN,addRandomSuffix:false});}
 const tables=snapshot.schema.filter(x=>x.type==='table');const quote=s=>'"'+s.replaceAll('"','""')+'"';
 // Create unique indexes before inserts so referenced keys are valid. Defer row checks until all rows are restored.
 const tx=await client.transaction('write');
 try{await tx.execute('PRAGMA defer_foreign_keys = ON');for(const table of tables)await tx.execute(table.sql);for(const index of snapshot.schema.filter(x=>x.type==='index'))await tx.execute(index.sql);for(const table of tables){for(const row of snapshot.tables[table.name]||[]){const columns=Object.keys(row);await tx.execute({sql:`INSERT INTO ${quote(table.name)} (${columns.map(quote).join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,args:columns.map(c=>row[c])});}}const bad=await tx.execute('PRAGMA foreign_key_check');if(bad.rows.length)throw new Error('Références incohérentes dans la sauvegarde.');await tx.commit();}catch(e){await tx.rollback();throw e;}finally{tx.close();}
 console.log(`Restauration vérifiée dans la nouvelle base : ${manifest.files.length} fichier(s). Les sessions de connexion ne sont pas restaurées.`);
}finally{client.close();}
