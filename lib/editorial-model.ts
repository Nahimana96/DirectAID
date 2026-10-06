import { z } from 'zod';
import { dateIsValid,today, type Locale } from './domain';

export const localized = z.object({fr:z.string().trim().max(12000),en:z.string().trim().max(12000).default(''),ar:z.string().trim().max(12000).default('')});
export type Localized = z.infer<typeof localized>;
export const textAt = (value:Localized, locale:Locale) => value[locale] || value.fr;
export const words = (fr='',en='',ar=''):Localized => ({fr,en,ar});
export const initialPartners=[
 {name:words('Gouvernement des Émirats Arabes Unis','Government of the United Arab Emirates','حكومة دولة الإمارات العربية المتحدة'),description:words('Soutien institutionnel aux programmes humanitaires et aux projets d’eau potable.','Institutional support for humanitarian programmes and drinking water projects.','دعم مؤسسي للبرامج الإنسانية ومشاريع مياه الشرب.')},
 {name:words('Gouvernement du Burundi','Government of Burundi','حكومة بوروندي'),description:words('Agrément officiel et collaboration avec les autorités locales pour nos centres et écoles.','Official recognition and collaboration with local authorities for our centres and schools.','اعتماد رسمي وتعاون مع السلطات المحلية لمراكزنا ومدارسنا.')},
 {name:words('Communauté Islamique du Burundi','Islamic Community of Burundi','الجالية الإسلامية في بوروندي'),description:words('Ancrage religieux et communautaire, supervision de nos actions selon l’éthique islamique.','Religious and community ties, with supervision of our work according to Islamic ethics.','روابط دينية ومجتمعية وإشراف على أعمالنا وفق الأخلاق الإسلامية.')},
];
const asset = z.string().uuid();
const secureUrl = z.string().url().refine(v=>new URL(v).protocol==='https:');
export const profileSchema = z.object({
 history:localized,mission:localized,address:z.string().trim().max(600),registration:z.string().trim().max(600),director:z.string().trim().max(200),hosting:z.string().trim().max(1500),legal:localized,terms:localized,
 team:z.array(z.object({name:z.string().trim().min(2).max(120),role:localized,photo:asset.nullable()})).max(30),
 documents:z.array(z.object({title:localized,asset})).max(20),
 photos:z.array(z.object({asset,caption:localized})).max(20),
 socials:z.array(z.object({label:z.string().trim().min(2).max(50),url:secureUrl})).max(8),
 partners:z.array(z.object({name:localized,description:localized})).max(12).default(initialPartners),
 faq:z.array(z.object({question:localized,answer:localized})).max(40),
}).strict();
export type AssociationProfile=z.infer<typeof profileSchema>;
export const initialProfile:AssociationProfile={
 history:words(),mission:words('Soutenir les orphelins et les familles au Burundi, faciliter l’accès à l’eau potable et organiser des actions de partage.','Support orphans and families in Burundi, improve access to drinking water and organise acts of giving.','دعم الأيتام والأسر في بوروندي وتسهيل الوصول إلى مياه الشرب وتنظيم أعمال العطاء.'),address:'',registration:'',director:'',hosting:'',legal:words(),terms:words(),team:[],documents:[],photos:[],socials:[],partners:initialPartners,
 faq:[
  {question:words('Comment sont utilisés les dons ?','How are donations used?','كيف تُستخدم التبرعات؟'),answer:words('Vous choisissez une action lors de votre don. Pour les orphelins, les contributions soutiennent un programme collectif : repas, éducation et soins, selon les priorités de l’association.','You choose a cause when donating. Orphan support funds a collective programme for meals, education and care according to the association’s priorities.','تختار مجال العمل عند التبرع. تدعم مساهمات الأيتام برنامجاً جماعياً للغذاء والتعليم والرعاية حسب أولويات الجمعية.')},
  {question:words('Quand recevrai-je les photos de mon action ?','When will I receive photos?','متى أتلقى الصور؟'),answer:words('Après la réalisation de l’action, l’équipe peut vous transmettre les photos par e-mail. Les délais dépendent du projet. Contactez-nous avec votre référence pour connaître son avancement.','After an action is completed, our team can email you photos. Timing depends on the project. Contact us with your reference for an update.','بعد إنجاز العمل يمكن للفريق إرسال الصور بالبريد الإلكتروني. تختلف المدة حسب المشروع. تواصل معنا مع مرجع تبرعك لمعرفة التقدم.')},
  {question:words('Comment fonctionne une promesse de virement ?','How does a transfer pledge work?','كيف يعمل الوعد بالتحويل؟'),answer:words('Remplissez le formulaire, puis effectuez le virement avec la référence indiquée. L’équipe confirme le paiement après réception sur le compte bancaire. Une promesse ne constitue pas un paiement. Jusqu’à quatre relances hebdomadaires peuvent être envoyées.','Complete the form, then transfer using the reference provided. Our team confirms payment after receipt in the bank account. A pledge is not a payment. Up to four weekly reminders may be sent.','املأ النموذج ثم نفّذ التحويل مع المرجع المحدد. يؤكد الفريق الدفع بعد وصوله إلى الحساب البنكي. الوعد ليس دفعة. قد تُرسل أربعة تذكيرات أسبوعية كحد أقصى.')},
  {question:words('Comment arrêter mon soutien mensuel ?','How do I stop monthly support?','كيف أوقف الدعم الشهري؟'),answer:words('Utilisez le lien privé de suivi de votre contribution pour demander l’arrêt à la fin de la période en cours. Vous pouvez également nous contacter. Les soutiens mensuels concernent les orphelins et les colis alimentaires.','Use your private contribution tracking link to request cancellation at the end of the current period. You can also contact us. Monthly support is available for orphan support and food parcels.','استخدم رابط متابعة مساهمتك الخاص لطلب الإيقاف في نهاية الفترة الحالية، أو تواصل معنا. يتوفر الدعم الشهري للأيتام والطرود الغذائية.')},
  {question:words('Puis-je financer un puits entier ?','Can I fund a whole well?','هل يمكنني تمويل بئر كامل؟'),answer:words('Oui, lorsqu’un projet est disponible pour un financement intégral. Vous pouvez aussi participer à une collecte commune. La page du projet présente séparément les fonds reçus et l’avancement des travaux.','Yes, when a project is available for full funding. You can also contribute to a shared collection. The project page shows funds received and construction progress separately.','نعم، عندما يكون المشروع متاحاً للتمويل الكامل. يمكنك أيضاً المشاركة في جمع التبرعات. تعرض صفحة المشروع الأموال المستلمة وتقدم الأشغال بشكل منفصل.')},
  {question:words('Comment organiser un sacrifice ?','How do I arrange a sacrifice?','كيف أنظم أضحية؟'),answer:words('Choisissez un mouton, une part de vache ou une vache entière. Indiquez un nom pour chaque sacrifice et une date souhaitée, à confirmer par l’équipe. Plusieurs sacrifices du même type peuvent être réglés ensemble, avec sept parts de vache au maximum par commande.','Choose a sheep, a cow share or a whole cow. Enter a name for each sacrifice and a requested date, which our team must confirm. Multiple sacrifices of the same type can be paid together, with a maximum of seven cow shares per order.','اختر خروفاً أو حصة من بقرة أو بقرة كاملة. أدخل اسماً لكل أضحية وموعداً مطلوباً يؤكده الفريق. يمكنك دفع عدة أضاحٍ من النوع نفسه معاً، بحد أقصى سبع حصص لكل طلب.')},
 ],
};
const day=z.string().refine(dateIsValid);
export const entrySchema=z.object({id:z.string().uuid().optional(),kind:z.enum(['realisation','campaign']),title:localized,description:localized,cause:z.enum(['orphelins','puits','colis','sacrifices']),location:z.string().trim().max(200),date:z.union([day,z.literal('')]),start:z.union([day,z.literal('')]),end:z.union([day,z.literal('')]),goal:z.number().int().min(100).max(100000000),projectId:z.string().uuid().nullable(),images:z.array(asset).max(12),published:z.boolean(),imageConsent:z.boolean()}).strict().superRefine((v,c)=>{
 if(v.title.fr.length<2||v.description.fr.length<10)c.addIssue({code:'custom',message:'Ajoutez un titre et une présentation.'});
 if(v.images.length&&v.published&&!v.imageConsent)c.addIssue({code:'custom',message:'Confirmez le droit de publier les photos.'});
 if(v.kind==='realisation'&&(!v.date||v.date>today()||!v.location))c.addIssue({code:'custom',message:'Ajoutez une date et un lieu.'});
 if(v.kind==='campaign'&&(!v.start||!v.end||v.end<v.start))c.addIssue({code:'custom',message:'Vérifiez les dates de la campagne.'});
 if(v.kind==='campaign'&&v.cause==='puits'&&!v.projectId)c.addIssue({code:'custom',message:'Choisissez le projet de puits.'});
});
export type ContentEntry=z.infer<typeof entrySchema> & {id:string;collected:number};
