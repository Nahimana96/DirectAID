const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/proof-email.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(env={},demo=false){
 let writes=0;
 const statement={bind(){return this},async all(){return {results:[{id:'photo-owned',filename:'Photo <preuve>',token:'private-token'}]}},async run(){writes++}};
 const storage={runtime:()=>({demo}),siteOrigin:()=> 'http://127.0.0.1:5174',database:()=>({prepare:()=>statement})};
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const mail={escapeHtml,emailContent:(o,k,html)=>({subject:'Preuve',html})};
 const feedback={prepareFeedbackInvitation:async()=>({html:'<p>Partager mon avis</p>',statement})};
 const context={exports:{},process:{env},URL,require:name=>name==='zod'?require('zod'):name==='./storage'?storage:name==='./mail'?mail:feedback};
 vm.runInNewContext(source,context);
 return {...context.exports,writes:()=>writes};
}
const order={id:'don-1',status:'paid',email:'donor@example.com'};
const input={assets:['photo-owned'],message:'Merci <script>alert(1)</script>\nVoici la photo.',key:'c1af5103-0000-4000-8000-123456789abc'};
test('Preview escapes message, includes owned photos and feedback, and never queues mail',async()=>{
 const api=setup();const result=await api.prepareProofEmail(order,{},input);
 assert.equal(result.recipient,order.email);
 assert.ok(result.html.includes('&lt;script&gt;'));
 assert.ok(result.html.includes('<br/>Voici la photo.'));
 assert.ok(result.html.includes('/api/media/photo-owned?token=private-token'));
 assert.ok(result.html.includes('Partager mon avis'));
 assert.ok(result.blocker.includes('Resend'));
 assert.equal(api.writes(),0);
 assert.equal(result.dedupe,(await api.prepareProofEmail(order,{},input)).dedupe);
});
test('Reject photos outside the contribution and unpaid contributions',async()=>{
 const api=setup();
 await assert.rejects(api.prepareProofEmail(order,{}, {...input,assets:['someone-elses-photo']}),/INVALID_ASSET/);
 await assert.rejects(api.prepareProofEmail({...order,status:'pending'},{},input),/PAYMENT_REQUIRED/);
 assert.equal(api.writes(),0);
});
test('Delivery requires configured provider, live mode and public HTTPS links',()=>{
 assert.ok(setup().proofEmailBlocker('https://example.com'));
 const configured={RESEND_API_KEY:'test-placeholder',EMAIL_FROM:'proof@example.com'};
 assert.equal(setup(configured).proofEmailBlocker('https://example.com'),null);
 for(const url of ['http://127.0.0.1:5174','https://localhost','http://example.com'])assert.ok(setup(configured).proofEmailBlocker(url));
 assert.ok(setup(configured,true).proofEmailBlocker('https://example.com'));
});
