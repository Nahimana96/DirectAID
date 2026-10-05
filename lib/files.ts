import { put,get,del } from '@vercel/blob';
import { mkdir,readFile,writeFile,unlink } from 'node:fs/promises';
import path from 'node:path';
function localFile(key:string){if(!/^images\/[a-f0-9-]{36}$/.test(key))throw new Error('INVALID_FILE');return path.join(process.cwd(),'.data','uploads',key);}
const isLocal=()=>process.env.NODE_ENV==='development'&&!process.env.VERCEL;
export const fileBucket={
 async put(key:string,body:Uint8Array,options:{httpMetadata:{contentType:string}}){
  if(isLocal()){const file=localFile(key);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,body);return;}
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('STORAGE_NOT_CONFIGURED');
  await put(key,Buffer.from(body),{access:'private',contentType:options.httpMetadata.contentType,addRandomSuffix:false});
 },
 async get(key:string){
  if(isLocal()){try{return {body:new Uint8Array(await readFile(localFile(key)))};}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}}
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('STORAGE_NOT_CONFIGURED');
  const result=await get(key,{access:'private'});return result&&result.statusCode===200?{body:result.stream}:null;
 },
 async delete(key:string){if(isLocal()){await unlink(localFile(key)).catch(error=>{if(error.code!=='ENOENT')throw error;});}else await del(key);}
};
