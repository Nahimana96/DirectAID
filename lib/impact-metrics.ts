import type {ImpactStat} from './domain';

const previousYear=new Date().getUTCFullYear()-1;

export const impactMetrics:ImpactStat[]=[
 {value:0,suffix:'',label:'Donateurs cumulés',labelEn:'Donors to date',labelAr:'إجمالي المتبرعين'},
 {value:0,suffix:'',label:'Années d’expérience',labelEn:'Years of experience',labelAr:'سنوات الخبرة'},
 {value:0,suffix:' €',label:`Collectés en ${previousYear}`,labelEn:`Raised in ${previousYear}`,labelAr:`المبالغ المجموعة في ${previousYear}`},
];

export function fixedImpactMetrics(items:ImpactStat[]=[]):ImpactStat[]{
 return impactMetrics.map((metric,index)=>({...metric,value:items[index]?.value||0}));
}
