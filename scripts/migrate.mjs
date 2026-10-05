import {createClient} from '@libsql/client';
import {mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const url=process.env.TURSO_DATABASE_URL;
if(!url||(process.env.VERCEL&&url.startsWith('file:')))throw new Error('Configure TURSO_DATABASE_URL avant la migration.');
if(url.startsWith('file:'))await mkdir('.data',{recursive:true});
const client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await client.execute('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY,checksum TEXT NOT NULL,applied_at TEXT NOT NULL)');
 const journal=JSON.parse(await readFile('drizzle/meta/_journal.json','utf8'));
 for(const migration of journal.entries){
  const name=migration.tag,sql=await readFile(`drizzle/${name}.sql`,'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
  const existing=await client.execute({sql:'SELECT checksum FROM app_migrations WHERE name=?',args:[name]});
  if(existing.rows[0]){if(existing.rows[0].checksum!==checksum)throw new Error('Une migration déjà appliquée a été modifiée: '+name);continue;}
  const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
  await client.batch([...statements,{sql:'INSERT INTO app_migrations (name,checksum,applied_at) VALUES (?,?,?)',args:[name,checksum,new Date().toISOString()]}],'write');
  console.log('Migration appliquée: '+name);
 }
}finally{client.close();}
