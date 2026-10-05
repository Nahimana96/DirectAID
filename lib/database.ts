import { createClient, type Client, type InValue } from '@libsql/client';
let client: Client | undefined;
export function sqlClient() {
 const url=process.env.TURSO_DATABASE_URL;
 if(!url || (process.env.VERCEL && url.startsWith('file:'))) throw new Error('DATABASE_NOT_CONFIGURED');
 if(!client) client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
 return client;
}
export class Statement {
 constructor(public sql:string,public args:InValue[]=[]){}
 bind(...args:InValue[]){return new Statement(this.sql,args);}
 async first<T=Record<string,any>>(){const result=await sqlClient().execute(this);return (result.rows[0]??null) as T|null;}
 async all(){const result=await sqlClient().execute(this);return {results:result.rows as unknown as Record<string,any>[]};}
 async run(){const result=await sqlClient().execute(this);return {meta:{changes:result.rowsAffected}};}
}
export const sqlDatabase={prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{
 const results=await sqlClient().batch(statements,'write');return results.map(result=>({meta:{changes:result.rowsAffected}}));
}};
