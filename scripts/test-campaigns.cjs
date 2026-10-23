const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/campaigns.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{},URLSearchParams,require:()=>({today:()=> '2026-10-19'})};
vm.runInNewContext(source,context);
const {activeCampaigns,campaignListings,activeCampaignListings,campaignDonationUrl}=context.exports;
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

test('A featured well appears without creating a second campaign',()=>{
 const well={id:'well-1',title:'Un puits',title_en:'A well',title_ar:'',description:'Un projet d’eau',description_en:'',description_ar:'',location:'Cankuzo',goal:100000,collected:25000,published:1,show_in_campaigns:1,stage:'planned',cover:null};
 const listings=campaignListings([campaign],[well]);
 assert.equal(listings.length,1);
 assert.equal(listings[0].source,'well');
 assert.equal(listings[0].title.fr,'Un puits');
 const url=new URL(campaignDonationUrl(listings[0],'fr'),'https://example.org');
 assert.equal(url.searchParams.get('project'),'well-1');
 assert.equal(url.searchParams.has('campaign'),false);
 assert.equal(activeCampaignListings([campaign],[well]).length,1);
 assert.equal(activeCampaignListings([], [{...well,show_in_campaigns:0}]).length,0);
 assert.equal(activeCampaignListings([], [{...well,published:0}]).length,0);
 assert.equal(activeCampaignListings([], [{...well,stage:'completed'}]).length,0);
 assert.equal(activeCampaignListings([], [{...well,collected:100000}]).length,0);
});
