import { z } from 'zod';

export type Locale = 'fr'|'en'|'ar';
export type Cause = 'orphelins'|'puits'|'colis'|'sacrifices';
export type Settings = {carouselImages:string[];currency:string; orphanAmounts:number[]; parcelPrice:number; sheepPrice:number; sharePrice:number; cowPrice:number; pricesConfirmed:boolean; bankName:string; bankHolder:string; bankAccount:string; bankSwift:string; phone:string; phone2:string; email:string; parcelContent:string; parcelContentEn:string; parcelContentAr:string};
export const defaults:Settings={carouselImages:['','','',''],currency:'EUR',orphanAmounts:[20,39,60],parcelPrice:35,sheepPrice:130,sharePrice:95,cowPrice:665,pricesConfirmed:false,bankName:'',bankHolder:'',bankAccount:'',bankSwift:'',phone:'+25768070000',phone2:'+25777750000',email:'directaidburundi@gmail.com',parcelContent:'Le contenu des colis sera précisé par notre équipe.',parcelContentEn:'Our team will specify the contents of the food parcels.',parcelContentAr:'سيحدد فريقنا محتويات الطرود الغذائية.'};
const name=z.string().trim().min(2).max(150);
export const orderSchema=z.object({key:z.string().uuid(),cause:z.enum(['orphelins','puits','colis','sacrifices']),offer:z.enum(['free','parcel','share','full','sheep','cow_share','cow']),quantity:z.number().int().min(1).max(50).default(1),amount:z.number().finite().optional(),frequency:z.enum(['once','monthly']),method:z.enum(['card','transfer']),locale:z.enum(['fr','en','ar']).default('fr'),name,email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),phone:z.string().trim().max(35).default(''),message:z.string().trim().max(1500).default(''),projectId:z.string().max(80).optional(),campaignId:z.string().uuid().optional(),plaque:z.string().trim().max(150).default(''),date:z.string().default(''),recipients:z.array(z.object({self:z.boolean(),name:z.string().trim().max(150)})).max(50).default([]),website:z.string().max(0).default('')}).strict();
export type OrderInput=z.infer<typeof orderSchema>;
export type Project={id:string;title:string;title_en:string;title_ar:string;location:string;description:string;description_en:string;description_ar:string;goal:number;stage:string;published:number;cover:string|null;updates:string;created_at:string;collected:number};
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Bujumbura',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function dateIsValid(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function quoteOrder(raw:unknown,s:Settings,project?:Project){
 const v=orderSchema.parse(raw);let amount=0;let recipients:{self:boolean;name:string;status:string}[]=[];
 if(v.frequency==='monthly'&&(!['orphelins','colis'].includes(v.cause)||v.method!=='card'))throw new Error('MONTHLY_CARD_ONLY');
 if(v.cause==='orphelins'){if(v.offer!=='free')throw new Error('INVALID_OFFER');amount=v.amount??0;}
 if(v.cause==='colis'){if(!['free','parcel'].includes(v.offer))throw new Error('INVALID_OFFER');amount=v.offer==='parcel'?s.parcelPrice*v.quantity:(v.amount??0);}
 if(v.cause==='puits'){
  if(!project||!project.published||!['share','full'].includes(v.offer))throw new Error('PROJECT_UNAVAILABLE');
  if(project.collected>=project.goal)throw new Error('PROJECT_FUNDED');
  if(v.offer==='full'&&project.collected>0)throw new Error('FULL_ALREADY_STARTED');
  amount=v.offer==='full'?project.goal/100:(v.amount??0);
 }
 if(v.cause==='sacrifices'){
  if(!['sheep','cow_share','cow'].includes(v.offer))throw new Error('INVALID_OFFER');
  if(v.offer==='cow_share'&&v.quantity>7)throw new Error('MAX_SEVEN_SHARES');
  if(v.recipients.length!==v.quantity)throw new Error('RECIPIENTS_REQUIRED');
  recipients=v.recipients.map(r=>({self:r.self,name:name.parse(r.self?v.name:r.name),status:'pending'}));
  if(!dateIsValid(v.date)||v.date<today())throw new Error('INVALID_DATE');
  amount=({sheep:s.sheepPrice,cow_share:s.sharePrice,cow:s.cowPrice} as Record<string,number>)[v.offer]*v.quantity;
 }
 const cents=Math.round(amount*100);if(!Number.isSafeInteger(cents)||cents<100||cents>10000000)throw new Error('INVALID_AMOUNT');
 const details={recipients,plaque:v.cause==='puits'&&v.offer==='full'?v.plaque:'',requestedDate:v.cause==='sacrifices'?v.date:'',confirmedDate:'',dateStatus:v.cause==='sacrifices'?'requested':'',message:v.message};
 return {input:v,cents,details,quantity:['parcel','sheep','cow_share','cow'].includes(v.offer)?v.quantity:1};
}
export const settingsSchema=z.object({carouselImages:z.array(z.string().regex(/^($|\/api\/media\/[a-f0-9-]+$)/)).length(4),currency:z.literal('EUR'),orphanAmounts:z.array(z.number().min(1).max(10000)).min(1).max(6),parcelPrice:z.number().min(1).max(10000),sheepPrice:z.number().min(1).max(100000),sharePrice:z.number().min(1).max(100000),cowPrice:z.number().min(1).max(100000),pricesConfirmed:z.boolean(),bankName:z.string().max(150),bankHolder:z.string().max(150),bankAccount:z.string().max(150),bankSwift:z.string().max(50),phone:z.string().max(35),phone2:z.string().max(35),email:z.string().email(),parcelContent:z.string().max(3000),parcelContentEn:z.string().max(3000),parcelContentAr:z.string().max(3000)}).strict();
export const projectSchema=z.object({id:z.string().max(80).optional(),title:name,title_en:z.string().max(150).default(''),title_ar:z.string().max(150).default(''),location:z.string().trim().min(2).max(150),description:z.string().trim().min(10).max(5000),description_en:z.string().max(5000).default(''),description_ar:z.string().max(5000).default(''),goal:z.number().int().min(100).max(100000000),stage:z.enum(['planned','working','completed']),published:z.boolean(),cover:z.string().max(80).nullable().default(null),updates:z.array(z.object({date:z.string().refine(dateIsValid),text:z.string().min(1).max(2000)})).max(100).default([])});
export function money(cents:number,locale:Locale='fr',currency='EUR'){return new Intl.NumberFormat(locale==='ar'?'ar':locale==='en'?'en-GB':'fr-FR',{style:'currency',currency,maximumFractionDigits:cents%100?2:0}).format(cents/100);}
export const WEEK=7*24*60*60*1000;
export function nextWeek(){return new Date(Date.now()+WEEK).toISOString();}
export function canAutoRemind(o:{status:string;method:string;reminder_count:number;reminders_paused:number;next_reminder:string|null},now=new Date().toISOString()){return o.status==='pending'&&o.method==='transfer'&&!o.reminders_paused&&o.reminder_count<4&&!!o.next_reminder&&o.next_reminder<=now;}

