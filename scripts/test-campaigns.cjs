const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/campaigns.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{},URLSearchParams,require:()=>({today:()=> '2026-10-19'})};
vm.runInNewContext(source,context);
const {activeCampaigns,campaignDonationUrl}=context.exports;
const campaign={id:'campaign-1',kind:'campaign',published:true,start:'2026-10-01',end:'2026-10-31',collected:25000,goal:100000,cause:'puits',projectId:'well-1'};
test('Only published, current and unfinished campaigns are shown',()=>{
 const variants=[campaign,{...campaign,id:'draft',published:false},{...campaign,id:'future',start:'2026-10-20'},{...campaign,id:'ended',end:'2026-10-18'},{...campaign,id:'funded',collected:100000},{...campaign,id:'achievement',kind:'realisation'}];
 assert.equal(JSON.stringify(activeCampaigns(variants).map(e=>e.id)),JSON.stringify(['campaign-1']));
});
test('Start and end dates are inclusive',()=>{
 assert.equal(activeCampaigns([campaign],'2026-10-01').length,1);
 assert.equal(activeCampaigns([campaign],'2026-10-31').length,1);
 assert.equal(activeCampaigns([campaign],'2026-11-01').length,0);
});
test('Donation links retain campaign, well and language',()=>{
 const url=new URL(campaignDonationUrl(campaign,'ar'),'https://example.org');
 assert.equal(url.searchParams.get('campaign'),'campaign-1');
 assert.equal(url.searchParams.get('project'),'well-1');
 assert.equal(url.searchParams.get('lang'),'ar');
 assert.equal(url.searchParams.get('cause'),'puits');
 const other=new URL(campaignDonationUrl({...campaign,cause:'colis',projectId:null},'fr'),'https://example.org');
 assert.equal(other.searchParams.has('project'),false);
});
